# Guía de Verificación de Ruta del Backend

## ⚠️ Importante: Antes de ejecutar Docker Compose

La ubicación del backend puede variar según el developer y cómo haya clonado o copiado el proyecto. **SIEMPRE** verifica la ruta del backend antes de ejecutar `docker-compose up`.

## Ubicaciones Comunes del Backend

El backend puede estar en diferentes ubicaciones dependiendo de cómo se configuró el entorno:

- `C:\dev\erp-project\backend` (estructura actual)
- `C:\dev\erp-project\business_management` (estructura antigua)
- Otras ubicaciones personalizadas

## Proceso de Verificación (3 pasos)

### 1. Ejecutar Script de Verificación

Antes de construir los contenedores, ejecuta el script de verificación:

```powershell
.\verify-backend-path.ps1
```

Este script:
- ✅ Lee el `docker-compose.yml`
- ✅ Verifica que la ruta del backend existe
- ✅ Confirma que el `Dockerfile` está presente
- ✅ Muestra instrucciones si hay algún problema

### 2. Corregir docker-compose.yml (si es necesario)

Si el script reporta que la ruta no existe, edita `docker-compose.yml`:

```yaml
# Busca la sección del backend:
backend:
  image: erp-backend:latest
  build:
    context: ../backend  # ← Actualiza esta línea con la ruta correcta
    dockerfile: Dockerfile
```

**Ejemplos de rutas relativas:**
- Si el backend está en `C:\dev\erp-project\backend` → usa `../backend`
- Si el backend está en `C:\dev\erp-project\business_management` → usa `../business_management`
- Si el backend está en otro lugar, ajusta según corresponda

### 3. Reconstruir Contenedores

Una vez verificado, ejecuta los comandos de Docker Compose:

```powershell
# Detener contenedores actuales (si existen)
docker-compose down

# Reconstruir y levantar
docker-compose up --build -d

# Ver los logs
docker-compose logs -f
```

## Solución de Problemas

### Error: "path not found"

**Causa:** La ruta del backend en `docker-compose.yml` no coincide con la ubicación real.

**Solución:**
1. Localiza el backend en tu sistema
2. Actualiza la línea `context:` en `docker-compose.yml`
3. Ejecuta `.\verify-backend-path.ps1` nuevamente
4. Si todo está bien ✅, ejecuta `docker-compose up --build -d`

### Error: Docker Desktop no está corriendo

**Causa:** Docker Desktop no está iniciado.

**Solución:**
1. Inicia Docker Desktop
2. Espera a que aparezca "Docker Desktop is running"
3. Vuelve a ejecutar los comandos

## Checklist Rápido

Antes de ejecutar `docker-compose up`:

- [ ] Docker Desktop está corriendo
- [ ] Ejecuté `.\verify-backend-path.ps1`
- [ ] La verificación pasó exitosamente ✅
- [ ] Estoy en el directorio `frontend/`

## Comandos Útiles

```powershell
# Verificar ruta del backend
.\verify-backend-path.ps1

# Detener contenedores
docker-compose down

# Reconstruir todo desde cero
docker-compose down
docker-compose up --build -d

# Ver estado de los contenedores
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs solo del backend
docker-compose logs -f backend

# Ver logs solo del frontend
docker-compose logs -f erp-system
```

## Configuración para Diferentes Developers

Si trabajas en un equipo, cada developer puede tener el backend en diferentes ubicaciones:

| Developer | Ubicación del Backend | Context en docker-compose.yml |
|-----------|----------------------|-------------------------------|
| Dev 1     | `C:\dev\erp-project\backend` | `../backend` |
| Dev 2     | `C:\dev\erp-project\business_management` | `../business_management` |
| Dev 3     | `D:\projects\erp\backend` | Ruta absoluta o ajustar según estructura |

**Recomendación:** Mantén tu `docker-compose.yml` en `.gitignore` si cada developer necesita rutas diferentes, o usa variables de entorno.

## Notas Adicionales

- El script `verify-backend-path.ps1` es seguro de ejecutar (solo lee, no modifica nada)
- Siempre ejecuta el script después de hacer `git pull` por si cambió la configuración
- Si cambias la ubicación del backend, actualiza `docker-compose.yml` inmediatamente
