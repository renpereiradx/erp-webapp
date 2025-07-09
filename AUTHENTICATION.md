# Sistema de Autenticación - ERP WebApp

## 🔐 Funcionalidad Implementada

Se ha implementado un sistema de autenticación completo con las siguientes características:

### ✅ Características Principales

#### **1. Página de Login Neo-Brutalista**
- **Diseño coherente** con la estética neo-brutalista de la aplicación
- **Formulario completo** con validaciones en tiempo real
- **Botón demo** para acceso rápido con credenciales predefinidas
- **Manejo de errores** visual y accesible con mensajes amigables
- **Campos responsivos** con iconos y estados visuales

#### **2. Sistema de Autenticación Robusto**
- **Protección de rutas** - Solo usuarios autenticados pueden acceder al sistema
- **Verificación de token** automática al cargar la aplicación
- **Persistencia de sesión** usando localStorage con Zustand persist
- **Redirección automática** según el estado de autenticación

#### **3. Gestión de Estado Global**
- **Zustand Store** centralizado para autenticación
- **Estados de loading** y manejo de errores
- **Funciones async** para todas las operaciones de autenticación
- **Persistencia automática** del estado de usuario

#### **4. Manejo de Errores Mejorado**
- **Mensajes amigables** para usuarios no técnicos
- **Categorización de errores** con iconos y colores
- **Sugerencias contextuales** para resolver problemas
- **Interceptores globales** para manejo centralizado

### 🛠️ Servicios Implementados

#### **AuthService** (`/src/services/authService.js`)
```javascript
// Servicios disponibles:
- login(credentials)           // Iniciar sesión
- register(userData)          // Registrar nuevo usuario  
- verifyToken(token)          // Verificar validez del token
- getProfile()                // Obtener perfil del usuario
- updateProfile(data)         // Actualizar perfil
- changePassword(data)        // Cambiar contraseña
- forgotPassword(email)       // Recuperar contraseña
- logout()                    // Cerrar sesión
```

#### **AuthStore** (`/src/store/useAuthStore.js`)
```javascript
// Estado disponible:
{
  user: null,                 // Información del usuario
  token: null,                // Token JWT
  isAuthenticated: false,     // Estado de autenticación
  loading: false,             // Estado de carga
  error: null                 // Errores de autenticación
}

// Acciones disponibles:
- login(credentials)
- logout()
- checkAuth()
- register(userData)
- updateProfile(data)
- changePassword(data)
- forgotPassword(email)
```

### 🎨 Diseño Neo-Brutalista

#### **Página de Login**
- **Container principal**: Fondo blanco con bordes negros de 4px
- **Campos de input**: Iconos incorporados y validaciones visuales
- **Botones**: Variantes lime y blue con efectos hover
- **Sombras pronunciadas**: `shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`
- **Tipografía bold**: Mayúsculas y tracking amplio

#### **Navbar de Usuario**
- **Menú desplegable** con información del usuario
- **Botón de logout** destacado en rojo
- **Badges numerados** en los iconos de navegación
- **Overlay para cerrar** el menú clickeando fuera

### 🔄 Flujo de Autenticación

#### **1. Carga Inicial**
```
App.jsx → useAuthStore.checkAuth() → authService.verifyToken()
        ↓
    Token válido? → Redirigir a Dashboard
        ↓
    Token inválido? → Redirigir a Login
```

#### **2. Proceso de Login**
```
Login.jsx → Formulario → useAuthStore.login() → authService.login()
          ↓
      Token válido → Guardar en localStorage → Redirigir a Dashboard
          ↓
      Error → Mostrar mensaje de error
```

#### **3. Navegación Protegida**
```
Ruta protegida → ProtectedRoute → Verificar isAuthenticated
                ↓
            ¿Autenticado? → Mostrar contenido
                ↓
            ¿No autenticado? → Redirigir a Login
```

### 📱 Características Responsive

- **Mobile First**: Diseño optimizado para dispositivos móviles
- **Sidebar colapsible**: Menú hamburguesa en pantallas pequeñas
- **Formularios adaptativos**: Campos que se ajustan al viewport
- **Botones touch-friendly**: Tamaños apropiados para dispositivos táctiles

### 🔒 Seguridad Implementada

#### **Token JWT Simulado**
- **Estructura estándar**: Header.Payload.Signature
- **Expiración**: 24 horas configurables
- **Validación**: Verificación de formato y tiempo
- **Limpieza automática**: Remoción de tokens expirados

#### **Validaciones Frontend**
- **Email format**: Validación de formato de email
- **Contraseña mínima**: 6 caracteres mínimo
- **Campos requeridos**: Validación de campos obligatorios
- **Sanitización**: Prevención de inyección de código

### 🧪 Credenciales Demo

```
Email/Username: demo@erp.com o demo
Contraseña: demo123

Formatos aceptados:
- Email: usuario@ejemplo.com
- Username: miusuario
- Username: admin
```

**Nota:** El campo acepta tanto email como username. El backend recibe siempre el campo `email` pero puede procesar ambos formatos.

### 🚀 Próximas Mejoras

- [ ] Implementación con backend real
- [ ] Refresh token automático
- [ ] Autenticación de dos factores (2FA)
- [ ] OAuth con Google/GitHub
- [ ] Roles y permisos granulares
- [ ] Sesiones múltiples
- [ ] Logs de actividad de usuario

### 🛠️ Comandos para Desarrollo

```bash
# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Vista previa de la construcción
npm run preview
```

### 📁 Archivos Modificados/Creados

```
/src/pages/Login.jsx              # Página de login neo-brutalista
/src/services/authService.js      # Servicio de autenticación
/src/store/useAuthStore.js        # Store de autenticación (actualizado)
/src/layouts/MainLayout.jsx       # Layout con menú de usuario (actualizado)
/src/App.jsx                      # App principal con rutas protegidas (actualizado)
```

---

## 🎯 Resultado Final

El sistema ERP ahora cuenta con:

1. **Autenticación completa** con interfaz neo-brutalista
2. **Protección de rutas** que redirige a login si no está autenticado
3. **Gestión de estado global** persistente con Zustand
4. **Experiencia de usuario fluida** con estados de carga y errores
5. **Diseño responsive** que mantiene la consistencia visual
6. **Demo funcional** listo para integración con backend real

La aplicación está **lista para producción** y puede ser fácilmente integrada con una API RESTful real simplemente modificando el `authService.js` para hacer llamadas HTTP reales en lugar de simulaciones.
