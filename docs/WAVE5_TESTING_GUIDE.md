# Wave 5: Testing & Coverage Enterprise 🚀

## Descripción General

Wave 5 implementa un sistema de testing empresarial completo para el sistema de gestión de clientes del ERP. Esta iteración se centra en alcanzar **cobertura de código del 85%+** y proporcionar testing robusto en todos los niveles.

## 🎯 Objetivos de Wave 5

- ✅ **Cobertura de código**: 85%+ en todas las capas
- ✅ **Testing unitario**: Componentes individuales y lógica de negocio
- ✅ **Testing de integración**: Flujos completos de usuario
- ✅ **Testing E2E**: Pruebas end-to-end con navegadores reales
- ✅ **Testing de accesibilidad**: Cumplimiento WCAG 2.1 AA
- ✅ **Testing de performance**: Benchmarks y optimización
- ✅ **CI/CD integration**: Pipeline automatizado de testing

## 📋 Estructura de Testing

```
src/test/
├── setup.js                    # Configuración global y utilidades
├── clients/                    # Tests específicos de clientes
│   ├── ClientsPage.test.jsx    # Tests de la página principal
│   └── ClientModal.test.jsx    # Tests del modal de clientes
└── e2e/                       # Tests end-to-end
    └── clients.e2e.test.js    # Flujos completos de usuario

scripts/
└── test-runner.js             # Pipeline automatizado de testing

vitest.config.clients.js       # Configuración específica para clientes
```

## 🧪 Tipos de Testing Implementados

### 1. Testing Unitario
- **Propósito**: Verificar componentes individuales
- **Herramientas**: Vitest + React Testing Library
- **Cobertura**: Componentes, hooks, utilidades
- **Comando**: `npm run test:clients:unit`

### 2. Testing de Integración
- **Propósito**: Verificar interacciones entre componentes
- **Cobertura**: Flujos de datos, API integration, estado global
- **Comando**: `npm run test:clients`

### 3. Testing E2E
- **Propósito**: Verificar flujos completos de usuario
- **Herramientas**: Playwright
- **Navegadores**: Chrome, Firefox, Safari
- **Comando**: `npm run test:clients:e2e`

### 4. Testing de Accesibilidad
- **Propósito**: Verificar cumplimiento WCAG 2.1 AA
- **Cobertura**: Focus management, ARIA, keyboard navigation
- **Comando**: `npm run test:clients:accessibility`

### 5. Testing de Performance
- **Propósito**: Verificar tiempos de renderizado y memoria
- **Métricas**: Render time, memory usage, large datasets
- **Comando**: `npm run test:clients:performance`

## 🚀 Comandos de Testing

### Comandos Básicos
```bash
# Ejecutar todos los tests de clientes
npm run test:clients

# Tests con cobertura
npm run test:clients:coverage

# Tests en modo watch
npm run test:clients:watch

# Tests específicos
npm run test:clients:unit
npm run test:clients:e2e
npm run test:clients:accessibility
npm run test:clients:performance
```

### Pipeline Completo (Wave 5)
```bash
# Ejecutar pipeline completo
npm run test:wave5

# Ejecutar tipos específicos
npm run test:wave5:unit
npm run test:wave5:integration
npm run test:wave5:e2e
npm run test:wave5:accessibility
npm run test:wave5:performance
```

## 📊 Configuración de Cobertura

### Umbrales de Cobertura (85%+)
```javascript
coverage: {
  statements: 85,
  branches: 85,
  functions: 85,
  lines: 85
}
```

### Archivos Incluidos
- `src/pages/Clients.jsx`
- `src/components/ClientModal.jsx`
- `src/components/DeleteClientModal.jsx`
- `src/accessibility/**`
- `src/services/clientsService.js`

## 🔧 Utilidades de Testing

### Mock Data Factory
```javascript
import { createMockClient } from '../setup';

const client = createMockClient({
  name: 'Juan Pérez',
  email: 'juan@email.com'
});
```

### Service Mocks
```javascript
import { mockClientService } from '../setup';

mockClientService.getClients.mockResolvedValue([
  createMockClient()
]);
```

### Accessibility Testing
```javascript
import { checkAccessibility } from '../setup';

const focusTest = await checkAccessibility.testFocusManagement(container);
expect(focusTest.hasFocusableElements).toBe(true);
```

### Performance Testing
```javascript
import { performanceHelpers } from '../setup';

const { renderTime } = await performanceHelpers.measureRenderTime(() =>
  renderComponent()
);
expect(renderTime).toBeLessThan(100);
```

## 🎨 Matchers Personalizados

### Accessibility Matchers
```javascript
// Verificar accesibilidad general
expect(element).toBeAccessible();

// Verificar skip links
expect(container).toHaveSkipLink();

// Verificar focus management
expect(element).toHaveFocusManagement();
```

### Client-Specific Matchers
```javascript
// Verificar datos de cliente
expect(element).toHaveClientData(expectedClient);

// Verificar errores de validación
expect(form).toHaveValidationError('email');
```

## 📈 Reportes de Testing

### Ubicación de Reportes
```
test-results/
├── test-report.json    # Reporte detallado en JSON
├── test-report.html    # Reporte visual en HTML
└── coverage/           # Reportes de cobertura
    ├── index.html      # Reporte visual de cobertura
    └── coverage-final.json
```

### Métricas Incluidas
- ✅ Tasa de éxito de tests
- ✅ Cobertura por archivo y función
- ✅ Tiempo de ejecución
- ✅ Tests fallidos con detalles
- ✅ Recomendaciones de mejora

## 🔄 Integración CI/CD

### GitHub Actions
```yaml
name: Wave 5 Testing Pipeline
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Run Wave 5 tests
        run: npm run test:wave5
```

### Pre-commit Hooks
```bash
# Instalar husky para pre-commit hooks
npx husky install

# Agregar hook de testing
npx husky add .husky/pre-commit "npm run test:clients:unit"
```

## 🐛 Debugging Tests

### Configuración de Debug
```javascript
// En vitest.config.clients.js
export default defineConfig({
  test: {
    setupFiles: ['./src/test/setup.js'],
    globals: true,
    environment: 'jsdom',
    // Debug mode
    logHeapUsage: true,
    reporter: ['verbose', 'json']
  }
});
```

### Testing en Modo Debug
```bash
# Ejecutar con debug
DEBUG=true npm run test:clients

# Testing específico con logs
npm run test:clients -- --reporter=verbose
```

## 📚 Patrones de Testing

### 1. Arrange-Act-Assert
```javascript
it('should create new client', async () => {
  // Arrange
  const clientData = createMockClient();
  renderClientModal();
  
  // Act
  await fillClientForm(clientData);
  await clickSaveButton();
  
  // Assert
  expect(mockClientService.createClient).toHaveBeenCalledWith(clientData);
});
```

### 2. Testing de Componentes Accesibles
```javascript
it('should be accessible', async () => {
  const { container } = render(<ClientModal />);
  
  // Focus management
  const focusTest = await checkAccessibility.testFocusManagement(container);
  expect(focusTest.hasFocusableElements).toBe(true);
  
  // ARIA attributes
  const dialog = screen.getByRole('dialog');
  expect(dialog).toHaveAttribute('aria-labelledby');
});
```

### 3. Testing de Performance
```javascript
it('should render efficiently', async () => {
  const { renderTime } = await performanceHelpers.measureRenderTime(() =>
    render(<ClientsList clients={largeClientList} />)
  );
  
  expect(renderTime).toBeLessThan(100);
});
```

## 🎯 Mejores Prácticas

### 1. Nombrado de Tests
- ✅ `should [expected behavior] when [condition]`
- ✅ `should handle [error case] gracefully`
- ✅ `should validate [requirement] compliance`

### 2. Estructura de Tests
- ✅ Agrupa tests relacionados con `describe`
- ✅ Usa `beforeEach` para setup común
- ✅ Limpia mocks en `afterEach`

### 3. Assertions
- ✅ Usa matchers específicos (`toBeVisible` vs `toBeTruthy`)
- ✅ Verifica comportamiento, no implementación
- ✅ Incluye mensajes descriptivos en assertions

### 4. Mocking
- ✅ Mock servicios externos
- ✅ Mock navegador APIs (localStorage, fetch)
- ✅ Usa factory functions para datos de prueba

## 🔍 Troubleshooting

### Problemas Comunes

#### Tests Lentos
```bash
# Ejecutar con timeout extendido
npm run test:clients -- --testTimeout=10000
```

#### Memory Leaks
```bash
# Ejecutar con heap profiling
npm run test:clients -- --logHeapUsage
```

#### Flaky Tests
- Usar `waitFor` para elementos asincrónicos
- Limpiar estado entre tests
- Mock todas las dependencias externas

#### Coverage Insuficiente
- Revisar archivos excluidos en configuración
- Agregar tests para edge cases
- Verificar branches no cubiertas

## 📞 Soporte

Para problemas con testing:
1. Revisar logs en `test-results/test-report.html`
2. Verificar configuración en `vitest.config.clients.js`
3. Consultar utilidades en `src/test/setup.js`

---

**Wave 5 Status**: ✅ **COMPLETADO** - Testing enterprise con 85%+ cobertura implementado

**Próxima iteración**: Wave 6 - Optimización & Performance 🚀
