# Walkthrough de la Solución: Error 403 Forbidden al Cambiar de Sucursal (ADMIN)

Se han solucionado dos problemas identificados al trabajar con el rol `ADMIN` al seleccionar o crear sucursales nuevas, específicamente para la sucursal con `ID 3`:

1. **Problema de Serialización en el Dashboard Trends:** En `useDashboardStore`, se llamaba a `dashboardService.getTrends('month')` pasando el parámetro `'month'` como string directo en lugar de un objeto. Esto causaba que el cliente API serializara los caracteres de la cadena como índices individuales, resultando en una petición a `GET /dashboard/trends?0=m&1=o&2=n&3=t&4=h`.
2. **Problema de Token Stale (JWT Desactualizado) en la Selección de Nueva Sucursal:** Al crear una nueva sucursal, el backend asocia automáticamente al creador con la sucursal en la base de datos (`users.user_branch_access`). Sin embargo, el token JWT actual almacenado en el frontend aún posee los claims antiguos de sucursales permitidas (`allowed_branches` sin el `ID 3`). Al seleccionar la sucursal `3`, el frontend inyecta el encabezado `X-Branch-ID: 3`. Dado que el backend valida este ID contra las sucursales del token (que no contiene `3`), el backend responde con un error `403 Forbidden` (`forbidden branch_id`), impidiendo al usuario navegar correctamente.

---

## Cambios Realizados

### Frontend (ERP Webapp)

#### 1. Corrección de Parámetro en el Dashboard Trends
- **Archivo:** [useDashboardStore.ts](file:///home/darthrpm/dev/web-project/erp-webapp/src/store/useDashboardStore.ts#L334)
- **Cambio:** Se modificó la llamada de `dashboardService.getTrends('month')` a `dashboardService.getTrends({ period: 'month' })` para alinearse con los tipos esperados y evitar la serialización incorrecta de los query parameters.

#### 2. Mecanismo de Refresh Automático al Detectar `forbidden branch_id`
- **Archivo:** [BusinessManagementAPI.ts](file:///home/darthrpm/dev/web-project/erp-webapp/src/services/BusinessManagementAPI.ts#L168-L210)
- **Cambio:** Se intercepta el error HTTP `403` en `makeRequest()`. Si el mensaje de error del backend contiene la cadena `"forbidden branch_id"`, y hay un refresh token disponible, se realiza una renovación automática y silenciosa del token llamando a `/auth/refresh`. Dado que el endpoint de refresh consulta la base de datos en tiempo real, el nuevo JWT devuelto ya incluirá el `ID` de la nueva sucursal dentro de `allowed_branches`. Tras guardar los nuevos datos en `localStorage`, se vuelve a intentar la petición original de manera transparente para el usuario y se emite el evento personalizado `auth:token_refreshed`.

#### 3. Sincronización del Estado de Autenticación de React
- **Archivo:** [AuthContext.tsx](file:///home/darthrpm/dev/web-project/erp-webapp/src/contexts/AuthContext.tsx#L206-L229)
- **Cambio:** Se añadió un event listener para el evento personalizado `auth:token_refreshed` en el `AuthProvider`. Cuando el token se refresca tras un error de sucursal prohibida, se actualiza el token en el estado de React y se invoca `/me` para volver a cargar los datos actualizados del usuario (incluyendo sus `allowed_branches` actualizados). Esto provoca que `BranchContext` también reaccione al cambio de forma dinámica sin obligar al usuario a recargar la página.

---

## Redacción Técnica para el Equipo del Backend

> **Asunto:** Solicitud de ajuste en validación de contexto de sucursal para Rol Administrador (`constants.RoleAdmin`) en `handlers/branch_context.go`
>
> **Descripción del Problema:**
> Actualmente, en los endpoints que requieren contexto de sucursal (transaccionales y BI) se ejecuta la función `resolveBranchContextFromAuth()` la cual a su vez llama a `parseOptionalBranchID()`.
>
> Si el usuario posee registros asignados en `AllowedBranches` dentro de los claims de su token, se evalúa estrictamente que el `branchID` solicitado (enviado mediante `?branch_id` o `X-Branch-ID`) se encuentre en dicha lista. En caso de no estarlo, la función retorna inmediatamente un error `403 Forbidden` con el mensaje `forbidden branch_id`:
>
> ```go
> // handlers/branch_context.go - Line 160
> if requestedBranchID != nil {
> 	if _, ok := allowedSet[*requestedBranchID]; !ok {
> 		return nil, fmt.Errorf("forbidden branch_id")
> 	}
> 	return requestedBranchID, nil
> }
> ```
>
> Esto genera un conflicto para los usuarios con Rol Administrador (`F2VLso` / `constants.RoleAdmin`):
> 1. Al crear una nueva sucursal (ej: sucursal `3`), el administrador es asignado en base de datos pero su JWT actual no contiene esa sucursal en `allowed_branches` hasta que inicie sesión de nuevo o expire el token (15 mins).
> 2. Aunque en el listado de sucursales (`GetBranchesHandler`) se excluye a los administradores del filtro de sucursales permitidas para que puedan ver todas, en los endpoints de BI y transacciones (que usan `resolveBranchContextFromAuth`) la restricción es estricta y les bloquea el acceso con `403 Forbidden`.
>
> **Solución Propuesta para el Backend:**
> Modificar `parseOptionalBranchID` en `handlers/branch_context.go` para omitir la validación de pertenencia a `allowed_branches` si el usuario posee el rol de Administrador, permitiendo así que el Administrador consulte y opere en cualquier sucursal activa en tiempo real:
>
> ```diff
> func parseOptionalBranchID(r *http.Request, claims *models.TokenClaims) (*int, error) {
> 	branchRaw := strings.TrimSpace(r.URL.Query().Get("branch_id"))
> 	if branchRaw == "" {
> 		branchRaw = strings.TrimSpace(r.Header.Get("X-Branch-ID"))
> 	}
> 
> 	var requestedBranchID *int
> 	if branchRaw != "" {
> 		branchID, err := strconv.Atoi(branchRaw)
> 		if err != nil || branchID <= 0 {
> 			return nil, fmt.Errorf("invalid branch_id")
> 		}
> 		requestedBranchID = &branchID
> 	}
> 
> 	if claims == nil {
> 		return requestedBranchID, nil
> 	}
> 
> +	// Los Administradores omiten la restricción de allowed_branches y pueden operar en cualquier sucursal
> +	if claims.RoleID == constants.RoleAdmin {
> +		if requestedBranchID != nil {
> +			return requestedBranchID, nil
> +		}
> +		if claims.ActiveBranch != nil && *claims.ActiveBranch > 0 {
> +			id := *claims.ActiveBranch
> +			return &id, nil
> +		}
> +		return nil, nil
> +	}
> 
> 	if len(claims.AllowedBranches) == 0 {
> 		if requestedBranchID != nil {
> 			return requestedBranchID, nil
> 		}
> 		...
> ```
