# 📚 Documentación - ERP Web Application

## 🚀 Deployment & Infrastructure

La documentación de deployment está organizada y lista para producción:

### Quick Start

- **[QUICKSTART_DEPLOY.md](../QUICKSTART_DEPLOY.md)** - Deploy en 3 comandos
- **[DEPLOYMENT_SUMMARY.md](../DEPLOYMENT_SUMMARY.md)** - Resumen completo de la estrategia
- **[DEPLOYMENT_CHECKLIST.md](../DEPLOYMENT_CHECKLIST.md)** - Checklist de verificación

### Guías Detalladas

- **[FRONTEND_DEPLOY_GUIDE.md](./development/FRONTEND_DEPLOY_GUIDE.md)** - Guía completa de deployment
- **[ARCHITECTURE_DIAGRAMS.md](../ARCHITECTURE_DIAGRAMS.md)** - Diagramas visuales de arquitectura

### Configuración

Archivos clave en la raíz del proyecto:

- `.env.development` - Configuración para desarrollo local
- `.env.production` - Configuración para producción Docker
- `.env.example` - Template documentado
- `nginx.conf` - Configuración del proxy Nginx
- `Dockerfile` - Build multi-stage
- `docker-compose.yml` - Orquestación de servicios

### Scripts

- `validate-config.sh` - Validación de configuración
- `build-and-deploy.sh` - Deployment automatizado

---

## 🏗️ Arquitectura & Diseño

### Sistema

- [API Integration](./API_INTEGRATION.md) - Integración con el backend
- [Cache Implementation](./CACHE_IMPLEMENTATION.md) - Sistema de caché
- [Observability](./OBSERVABILITY.md) - Telemetría y monitoreo
- [Telemetry](./TELEMETRY.md) - Sistema de telemetría

### UI & Themes

- [Theme System](./THEME_SYSTEM.md) - Sistema multi-tema
- [Theme Guide](./THEME_GUIDE.md) - Guía de diseño y uso
- [SASS Theme Migration](./SASS_THEME_MIGRATION_GUIDE.md) - Migración a SASS
- [UI States Mini Guide](./UI_STATES_MINI_GUIDE.md) - Estados de UI

---

## 🔧 Desarrollo

### Guías Generales

- [Guía MVP Desarrollo](./GUIA_MVP_DESARROLLO.md) - Desarrollo MVP
- [Feature Contribution Guide](./FEATURE_CONTRIBUTION_GUIDE.md) - Contribuir features
- [New Feature Checklist](./NEW_FEATURE_CHECKLIST.md) - Checklist para nuevos features
- [Feature Flags](./FEATURE_FLAGS.md) - Sistema de feature flags

### Features Implementados

- [Feature Products](./FEATURE_PRODUCTS_IMPLEMENTED.md) - Gestión de productos
- [Payment System V3](./PAYMENT_SYSTEM_V3_IMPLEMENTATION.md) - Sistema de pagos v3
- [Payment Improvements V3](./PAYMENT_IMPROVEMENTS_V3.md) - Mejoras de pagos
- [Cash Register Movements V2.1](./CASH_REGISTER_MOVEMENTS_V2.1_IMPLEMENTATION.md) - Movimientos de caja
- [Sale Client Name Search](./SALE_CLIENT_NAME_SEARCH_IMPLEMENTATION.md) - Búsqueda de clientes

### Templates

- [Feature Page Improvement Template](./FEATURE_PAGE_IMPROVEMENT_TEMPLATE.md) - Template para mejoras
- [Checklist Feature Orders](./CHECKLIST_FEATURE_orders.md) - Checklist de órdenes

### Matrices & Estados

- [Products States Matrix](./PRODUCTS_STATES_MATRIX.md) - Matriz de estados de productos

---

## 🐛 Issues & Debug

### Backend Issues Documentados

- [Backend Issue: Payment Details](./BACKEND_ISSUE_PAYMENT_DETAILS.md)
- [Backend Issue: Payment Process Partial 400](./BACKEND_ISSUE_PAYMENT_PROCESS_PARTIAL_400.md)
- [Backend Issue: Sale Status Not Updating](./BACKEND_ISSUE_SALE_STATUS_NOT_UPDATING.md)
- [Backend Issue: Sale GetById](./BACKEND_ISSUE_SALE_GETBYID.md)
- [Backend Issue: Preview Cancellation](./BACKEND_ISSUE_PREVIEW_CANCELLATION.md)
- [Backend Issue: Cache Sale Date Range](./BACKEND_ISSUE_CACHE_SALE_DATE_RANGE.md)
- [Backend Issue: Cash Registers](./BACKEND_ISSUE_CASH_REGISTERS.md)

### Debug & Comparaciones

- [Payment API Debug](./PAYMENT_API_DEBUG.md)
- [Backend Comparison Payment Endpoints](./BACKEND_COMPARISON_PAYMENT_ENDPOINTS.md)
- [Sale Date Range Examples](./SALE_DATE_RANGE_EXAMPLES.md)

---

## 📱 Features Futuros

- [PWA Implementation Plan](./PWA_IMPLEMENTATION_PLAN.md) - Plan para Progressive Web App

---

## 🔍 Páginas Verificadas

- [Verified Pages No Console Logs](./VERIFIED_PAGES_NO_CONSOLE_LOGS.md) - Páginas sin logs

---

## 🗂️ Carpetas Especializadas

### [development/](./development/)

Documentación específica de desarrollo:

- **[FRONTEND_DEPLOY_GUIDE.md](./development/FRONTEND_DEPLOY_GUIDE.md)** - Guía completa de deployment

### [api/](./api/)

Documentación de APIs específicas

### [hooks/](./hooks/)

Documentación de custom hooks

### [issues/](./issues/)

Issues históricos y resoluciones

### [archive/](./archive/)

Documentación archivada

---

## 🛠️ Configuración Especial

- [MCP Setup](./mcp-setup.md) - Configuración de Model Context Protocol
- [Remoto Config](./remoto-config.md) - Configuración para desarrollo remoto

---

## 🎯 Getting Started

### Para Desarrollo

1. Lee [GUIA_MVP_DESARROLLO.md](./GUIA_MVP_DESARROLLO.md)
2. Configura tu ambiente con [development/FRONTEND_DEPLOY_GUIDE.md](./development/FRONTEND_DEPLOY_GUIDE.md)
3. Revisa [FEATURE_CONTRIBUTION_GUIDE.md](./FEATURE_CONTRIBUTION_GUIDE.md)

### Para Deployment

1. Comienza con [QUICKSTART_DEPLOY.md](../QUICKSTART_DEPLOY.md)
2. Lee [DEPLOYMENT_SUMMARY.md](../DEPLOYMENT_SUMMARY.md)
3. Usa [DEPLOYMENT_CHECKLIST.md](../DEPLOYMENT_CHECKLIST.md) para verificar

### Para Debugging

1. Revisa [OBSERVABILITY.md](./OBSERVABILITY.md)
2. Consulta [TELEMETRY.md](./TELEMETRY.md)
3. Busca en [issues/](./issues/) si ya existe un issue similar

---

## 📞 Soporte

Para dudas o problemas:

1. Busca en esta documentación
2. Revisa los issues documentados
3. Consulta los logs: `docker-compose logs -f`
4. Ejecuta: `./validate-config.sh`

---

**Última actualización:** Diciembre 2024  
**Mantenido por:** Equipo de Desarrollo ERP
