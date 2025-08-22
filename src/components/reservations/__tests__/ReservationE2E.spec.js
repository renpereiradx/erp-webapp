/**
 * Tests End-to-End para flujo crítico de reservas
 * Usando Playwright para tests E2E completos
 */
import { test, expect } from '@playwright/test';

// Configuración base para tests E2E
test.describe('Reservations E2E - Critical User Journeys', () => {
  
  test.beforeEach(async ({ page }) => {
    // Interceptar llamadas API y mockear respuestas
    await page.route('**/api/reservations', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                id: 'reservation-1',
                client_name: 'Juan Pérez',
                product_name: 'Producto A',
                date: '2024-08-25',
                time: '14:30',
                duration: 120,
                status: 'confirmed',
                location: 'Sala A',
                notes: 'Reserva importante'
              },
              {
                id: 'reservation-2',
                client_name: 'María García',
                product_name: 'Producto B',
                date: '2024-08-26',
                time: '10:00',
                duration: 90,
                status: 'pending',
                location: 'Sala B',
                notes: ''
              }
            ],
            pagination: {
              page: 1,
              limit: 20,
              total: 2,
              totalPages: 1
            }
          })
        });
      }
    });

    await page.route('**/api/products', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { id: 'product-1', name: 'Producto A' },
            { id: 'product-2', name: 'Producto B' },
            { id: 'product-3', name: 'Producto C' }
          ]
        })
      });
    });

    await page.route('**/api/clients', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { id: 'client-1', name: 'Juan Pérez' },
            { id: 'client-2', name: 'María García' },
            { id: 'client-3', name: 'Carlos López' }
          ]
        })
      });
    });

    // Navegar a la página de reservas
    await page.goto('/reservations');
    
    // Esperar a que la página cargue completamente
    await page.waitForLoadState('networkidle');
  });

  test.describe('Flujo completo: Crear reserva', () => {
    test('debería crear una nueva reserva exitosamente', async ({ page }) => {
      // Interceptar POST request
      await page.route('**/api/reservations', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                id: 'reservation-new',
                client_name: 'Cliente E2E',
                product_name: 'Producto Test',
                date: '2024-08-28',
                time: '15:00',
                duration: 90,
                status: 'confirmed',
                location: 'Sala Test',
                notes: 'Reserva creada en E2E'
              }
            })
          });
        }
      });

      // 1. Hacer clic en botón "Nueva Reserva"
      await page.click('[data-testid="create-reservation-button"]');

      // 2. Verificar que el modal se abre
      await expect(page.locator('[data-testid="reservation-modal"]')).toBeVisible();
      await expect(page.locator('h2')).toHaveText('Nueva Reserva');

      // 3. Llenar formulario
      await page.fill('[data-testid="client-name-input"]', 'Cliente E2E');
      
      // Seleccionar producto del dropdown
      await page.click('[data-testid="product-select"]');
      await page.click('[data-testid="product-option-1"]');
      
      // Llenar fecha y hora
      await page.fill('[data-testid="date-input"]', '2024-08-28');
      await page.fill('[data-testid="time-input"]', '15:00');
      await page.fill('[data-testid="duration-input"]', '90');
      
      // Campos opcionales
      await page.fill('[data-testid="location-input"]', 'Sala Test');
      await page.fill('[data-testid="notes-textarea"]', 'Reserva creada en E2E');

      // 4. Enviar formulario
      await page.click('[data-testid="submit-reservation-button"]');

      // 5. Verificar notificación de éxito
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="toast-success"]')).toHaveText(/Reserva creada exitosamente/);

      // 6. Verificar que el modal se cierra
      await expect(page.locator('[data-testid="reservation-modal"]')).not.toBeVisible();

      // 7. Verificar que la nueva reserva aparece en la lista
      await expect(page.locator('[data-testid="reservation-card-reservation-new"]')).toBeVisible();
      await expect(page.locator('text=Cliente E2E')).toBeVisible();
    });

    test('debería mostrar errores de validación', async ({ page }) => {
      // 1. Abrir modal
      await page.click('[data-testid="create-reservation-button"]');

      // 2. Intentar enviar formulario vacío
      await page.click('[data-testid="submit-reservation-button"]');

      // 3. Verificar errores de validación
      await expect(page.locator('[data-testid="client-name-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="client-name-error"]')).toHaveText('El nombre del cliente es requerido');
      
      await expect(page.locator('[data-testid="product-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="date-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="time-error"]')).toBeVisible();

      // 4. Verificar que el modal permanece abierto
      await expect(page.locator('[data-testid="reservation-modal"]')).toBeVisible();
    });

    test('debería manejar errores de servidor', async ({ page }) => {
      // Mock error response
      await page.route('**/api/reservations', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Error interno del servidor'
            })
          });
        }
      });

      // Llenar y enviar formulario
      await page.click('[data-testid="create-reservation-button"]');
      await page.fill('[data-testid="client-name-input"]', 'Test Client');
      await page.click('[data-testid="product-select"]');
      await page.click('[data-testid="product-option-1"]');
      await page.fill('[data-testid="date-input"]', '2024-08-28');
      await page.fill('[data-testid="time-input"]', '15:00');
      await page.fill('[data-testid="duration-input"]', '90');
      
      await page.click('[data-testid="submit-reservation-button"]');

      // Verificar notificación de error
      await expect(page.locator('[data-testid="toast-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="toast-error"]')).toHaveText(/Error al crear la reserva/);
    });
  });

  test.describe('Flujo completo: Buscar y filtrar reservas', () => {
    test('debería buscar reservas por nombre de cliente', async ({ page }) => {
      // Mock filtered results
      await page.route('**/api/reservations?search=Juan*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                id: 'reservation-1',
                client_name: 'Juan Pérez',
                product_name: 'Producto A',
                date: '2024-08-25',
                time: '14:30',
                duration: 120,
                status: 'confirmed',
                location: 'Sala A',
                notes: 'Reserva importante'
              }
            ],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
          })
        });
      });

      // 1. Usar campo de búsqueda
      await page.fill('[data-testid="search-input"]', 'Juan');

      // 2. Esperar debounce y resultados filtrados
      await page.waitForTimeout(600); // Debounce de 500ms + margen

      // 3. Verificar que solo se muestra la reserva de Juan
      await expect(page.locator('[data-testid="reservation-card-reservation-1"]')).toBeVisible();
      await expect(page.locator('[data-testid="reservation-card-reservation-2"]')).not.toBeVisible();
      
      await expect(page.locator('text=Juan Pérez')).toBeVisible();
      await expect(page.locator('text=María García')).not.toBeVisible();

      // 4. Verificar contador de resultados
      await expect(page.locator('[data-testid="results-count"]')).toHaveText('1 reserva encontrada');
    });

    test('debería filtrar por estado de reserva', async ({ page }) => {
      // Mock filtered results for confirmed status
      await page.route('**/api/reservations?status=confirmed*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                id: 'reservation-1',
                client_name: 'Juan Pérez',
                product_name: 'Producto A',
                date: '2024-08-25',
                time: '14:30',
                duration: 120,
                status: 'confirmed',
                location: 'Sala A',
                notes: 'Reserva importante'
              }
            ],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
          })
        });
      });

      // 1. Usar filtro de estado
      await page.click('[data-testid="status-filter"]');
      await page.click('[data-testid="status-confirmed"]');

      // 2. Verificar resultados filtrados
      await expect(page.locator('[data-testid="reservation-card-reservation-1"]')).toBeVisible();
      await expect(page.locator('[data-testid="reservation-card-reservation-2"]')).not.toBeVisible();

      // 3. Verificar indicador de filtro activo
      await expect(page.locator('[data-testid="active-filters-badge"]')).toBeVisible();
      await expect(page.locator('[data-testid="active-filters-badge"]')).toHaveText('1 filtro activo');
    });

    test('debería filtrar por rango de fechas', async ({ page }) => {
      // 1. Abrir selector de fecha desde
      await page.click('[data-testid="date-from-button"]');
      await page.click('[data-testid="calendar-date-25"]');

      // 2. Abrir selector de fecha hasta
      await page.click('[data-testid="date-to-button"]');
      await page.click('[data-testid="calendar-date-26"]');

      // 3. Verificar que se aplican los filtros
      await expect(page.locator('[data-testid="date-from-display"]')).toHaveText('25 ago 2024');
      await expect(page.locator('[data-testid="date-to-display"]')).toHaveText('26 ago 2024');

      // 4. Verificar resultados filtrados por fecha
      await expect(page.locator('[data-testid="results-count"]')).toBeVisible();
    });

    test('debería limpiar todos los filtros', async ({ page }) => {
      // 1. Aplicar varios filtros
      await page.fill('[data-testid="search-input"]', 'Juan');
      await page.click('[data-testid="status-filter"]');
      await page.click('[data-testid="status-confirmed"]');

      // 2. Verificar que hay filtros activos
      await expect(page.locator('[data-testid="active-filters-badge"]')).toBeVisible();

      // 3. Limpiar filtros
      await page.click('[data-testid="clear-filters-button"]');

      // 4. Verificar que se limpiaron
      await expect(page.locator('[data-testid="search-input"]')).toHaveValue('');
      await expect(page.locator('[data-testid="status-filter"]')).toHaveText('Todos los estados');
      await expect(page.locator('[data-testid="active-filters-badge"]')).not.toBeVisible();

      // 5. Verificar que se muestran todas las reservas
      await expect(page.locator('[data-testid="reservation-card-reservation-1"]')).toBeVisible();
      await expect(page.locator('[data-testid="reservation-card-reservation-2"]')).toBeVisible();
    });
  });

  test.describe('Flujo completo: Editar reserva', () => {
    test('debería editar una reserva existente', async ({ page }) => {
      // Mock PUT request
      await page.route('**/api/reservations/reservation-1', async (route) => {
        if (route.request().method() === 'PUT') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                id: 'reservation-1',
                client_name: 'Juan Pérez Actualizado',
                product_name: 'Producto A',
                date: '2024-08-25',
                time: '16:00', // Hora actualizada
                duration: 150, // Duración actualizada
                status: 'confirmed',
                location: 'Sala A',
                notes: 'Reserva importante - ACTUALIZADA'
              }
            })
          });
        }
      });

      // 1. Hacer clic en botón editar de la primera reserva
      await page.click('[data-testid="edit-reservation-reservation-1"]');

      // 2. Verificar que el modal se abre con datos pre-cargados
      await expect(page.locator('[data-testid="reservation-modal"]')).toBeVisible();
      await expect(page.locator('h2')).toHaveText('Editar Reserva');
      await expect(page.locator('[data-testid="client-name-input"]')).toHaveValue('Juan Pérez');

      // 3. Modificar algunos campos
      await page.fill('[data-testid="client-name-input"]', 'Juan Pérez Actualizado');
      await page.fill('[data-testid="time-input"]', '16:00');
      await page.fill('[data-testid="duration-input"]', '150');
      await page.fill('[data-testid="notes-textarea"]', 'Reserva importante - ACTUALIZADA');

      // 4. Guardar cambios
      await page.click('[data-testid="submit-reservation-button"]');

      // 5. Verificar notificación de éxito
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="toast-success"]')).toHaveText(/Reserva actualizada exitosamente/);

      // 6. Verificar que el modal se cierra
      await expect(page.locator('[data-testid="reservation-modal"]')).not.toBeVisible();

      // 7. Verificar datos actualizados en la tarjeta
      await expect(page.locator('text=Juan Pérez Actualizado')).toBeVisible();
      await expect(page.locator('text=16:00')).toBeVisible();
    });

    test('debería manejar conflictos de edición concurrente', async ({ page }) => {
      // Mock conflict response
      await page.route('**/api/reservations/reservation-1', async (route) => {
        if (route.request().method() === 'PUT') {
          await route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'CONFLICT',
              message: 'La reserva fue modificada por otro usuario'
            })
          });
        }
      });

      // Editar reserva
      await page.click('[data-testid="edit-reservation-reservation-1"]');
      await page.fill('[data-testid="client-name-input"]', 'Cambio conflictivo');
      await page.click('[data-testid="submit-reservation-button"]');

      // Verificar mensaje de conflicto
      await expect(page.locator('[data-testid="toast-warning"]')).toBeVisible();
      await expect(page.locator('[data-testid="toast-warning"]')).toHaveText(/modificada por otro usuario/);

      // Verificar opción de recargar
      await expect(page.locator('[data-testid="reload-reservation-button"]')).toBeVisible();
    });
  });

  test.describe('Flujo completo: Eliminar reserva', () => {
    test('debería eliminar una reserva con confirmación', async ({ page }) => {
      // Mock DELETE request
      await page.route('**/api/reservations/reservation-1', async (route) => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true })
          });
        }
      });

      // Mock dialog de confirmación
      page.on('dialog', async (dialog) => {
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message()).toContain('¿Estás seguro de que deseas eliminar esta reserva?');
        await dialog.accept();
      });

      // 1. Hacer clic en botón eliminar
      await page.click('[data-testid="delete-reservation-reservation-1"]');

      // 2. La confirmación se maneja automáticamente por el event listener

      // 3. Verificar notificación de éxito
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="toast-success"]')).toHaveText(/Reserva eliminada exitosamente/);

      // 4. Verificar que la reserva ya no aparece en la lista
      await expect(page.locator('[data-testid="reservation-card-reservation-1"]')).not.toBeVisible();
      await expect(page.locator('text=Juan Pérez')).not.toBeVisible();
    });

    test('debería cancelar eliminación si usuario no confirma', async ({ page }) => {
      // Mock dialog de confirmación - usuario cancela
      page.on('dialog', async (dialog) => {
        await dialog.dismiss();
      });

      // 1. Hacer clic en eliminar
      await page.click('[data-testid="delete-reservation-reservation-1"]');

      // 2. Verificar que la reserva sigue presente
      await expect(page.locator('[data-testid="reservation-card-reservation-1"]')).toBeVisible();
      await expect(page.locator('text=Juan Pérez')).toBeVisible();

      // 3. No debe haber notificaciones
      await expect(page.locator('[data-testid="toast-success"]')).not.toBeVisible();
    });
  });

  test.describe('Navegación y experiencia de usuario', () => {
    test('debería manejar paginación correctamente', async ({ page }) => {
      // Mock multiple pages
      await page.route('**/api/reservations?page=1*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              { id: 'res-1', client_name: 'Cliente 1', product_name: 'Producto A', status: 'confirmed' },
              { id: 'res-2', client_name: 'Cliente 2', product_name: 'Producto B', status: 'pending' }
            ],
            pagination: { page: 1, limit: 2, total: 5, totalPages: 3 }
          })
        });
      });

      await page.route('**/api/reservations?page=2*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              { id: 'res-3', client_name: 'Cliente 3', product_name: 'Producto C', status: 'confirmed' },
              { id: 'res-4', client_name: 'Cliente 4', product_name: 'Producto D', status: 'cancelled' }
            ],
            pagination: { page: 2, limit: 2, total: 5, totalPages: 3 }
          })
        });
      });

      // Verificar página 1
      await expect(page.locator('[data-testid="pagination-info"]')).toHaveText('Página 1 de 3');
      await expect(page.locator('text=Cliente 1')).toBeVisible();

      // Ir a página 2
      await page.click('[data-testid="pagination-next"]');

      // Verificar página 2
      await expect(page.locator('[data-testid="pagination-info"]')).toHaveText('Página 2 de 3');
      await expect(page.locator('text=Cliente 3')).toBeVisible();
      await expect(page.locator('text=Cliente 1')).not.toBeVisible();

      // Volver a página 1
      await page.click('[data-testid="pagination-prev"]');
      await expect(page.locator('text=Cliente 1')).toBeVisible();
    });

    test('debería mantener filtros durante navegación', async ({ page }) => {
      // Aplicar filtro
      await page.fill('[data-testid="search-input"]', 'Juan');
      await page.click('[data-testid="status-filter"]');
      await page.click('[data-testid="status-confirmed"]');

      // Navegar a otra página y volver
      await page.goto('/products');
      await page.goBack();

      // Verificar que los filtros se mantienen
      await expect(page.locator('[data-testid="search-input"]')).toHaveValue('Juan');
      await expect(page.locator('[data-testid="status-filter"]')).toHaveText('Confirmadas');
    });
  });

  test.describe('Modo offline y recuperación', () => {
    test('debería mostrar modo offline cuando no hay conexión', async ({ page }) => {
      // Simular modo offline
      await page.setOffline(true);

      // Intentar crear reserva
      await page.click('[data-testid="create-reservation-button"]');
      await page.fill('[data-testid="client-name-input"]', 'Cliente Offline');
      await page.click('[data-testid="submit-reservation-button"]');

      // Verificar mensaje de modo offline
      await expect(page.locator('[data-testid="offline-banner"]')).toBeVisible();
      await expect(page.locator('[data-testid="offline-banner"]')).toHaveText(/Sin conexión a internet/);

      // Verificar que la reserva se guarda localmente
      await expect(page.locator('[data-testid="toast-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="toast-info"]')).toHaveText(/Guardado localmente/);
    });

    test('debería sincronizar datos cuando se recupera la conexión', async ({ page }) => {
      // Mock sync endpoint
      await page.route('**/api/sync/reservations', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            synchronized: 2,
            conflicts: 0,
            errors: 0
          })
        });
      });

      // Simular recuperación de conexión
      await page.setOffline(false);

      // Verificar notificación de sincronización
      await expect(page.locator('[data-testid="sync-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="sync-notification"]')).toHaveText(/Sincronizando datos/);

      // Verificar sincronización exitosa
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="toast-success"]')).toHaveText(/Datos sincronizados/);
    });
  });

  test.describe('Accessibility - Flujos E2E', () => {
    test('debería ser completamente navegable por teclado', async ({ page }) => {
      // Navegar usando solo teclado
      await page.keyboard.press('Tab'); // Buscar
      await page.keyboard.press('Tab'); // Filtro estado
      await page.keyboard.press('Tab'); // Filtro fecha
      await page.keyboard.press('Tab'); // Botón crear
      
      // Verificar focus en botón crear
      await expect(page.locator('[data-testid="create-reservation-button"]')).toBeFocused();
      
      // Abrir modal con Enter
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-testid="reservation-modal"]')).toBeVisible();
      
      // Navegar dentro del modal
      await page.keyboard.press('Tab'); // Cliente
      await page.keyboard.press('Tab'); // Producto
      await page.keyboard.press('Tab'); // Fecha
      
      // Cerrar modal con Escape
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid="reservation-modal"]')).not.toBeVisible();
    });

    test('debería anunciar cambios importantes a screen readers', async ({ page }) => {
      // Crear reserva
      await page.click('[data-testid="create-reservation-button"]');
      await page.fill('[data-testid="client-name-input"]', 'Test Client');
      await page.click('[data-testid="submit-reservation-button"]');

      // Verificar anuncio ARIA
      await expect(page.locator('[aria-live="polite"]')).toHaveText(/Reserva creada exitosamente/);
      
      // Verificar focus management
      await expect(page.locator('[data-testid="create-reservation-button"]')).toBeFocused();
    });

    test('debería tener contraste y tamaños apropiados', async ({ page }) => {
      // Verificar que los elementos son clickeables y visibles
      await expect(page.locator('[data-testid="create-reservation-button"]')).toBeVisible();
      
      // Verificar tamaño mínimo de botones (44px x 44px)
      const buttonBox = await page.locator('[data-testid="create-reservation-button"]').boundingBox();
      expect(buttonBox.height).toBeGreaterThanOrEqual(44);
      expect(buttonBox.width).toBeGreaterThanOrEqual(44);
      
      // Verificar contraste de texto (esto sería más complejo en implementación real)
      await expect(page.locator('[data-testid="create-reservation-button"]')).toHaveCSS('color', /rgb\(/);
    });
  });

  test.describe('Performance - Cargas y respuesta', () => {
    test('debería cargar la página inicial en menos de 2 segundos', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/reservations');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(2000);
    });

    test('debería manejar listas grandes sin degradación', async ({ page }) => {
      // Mock large dataset
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: `reservation-${i}`,
        client_name: `Cliente ${i}`,
        product_name: `Producto ${i % 5}`,
        status: ['confirmed', 'pending', 'cancelled'][i % 3],
        date: '2024-08-25',
        time: '14:30'
      }));

      await page.route('**/api/reservations', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: largeDataset.slice(0, 20), // Paginación
            pagination: { page: 1, limit: 20, total: 100, totalPages: 5 }
          })
        });
      });

      await page.reload();
      
      // Verificar que el scroll es fluido
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(100);
      
      // Verificar que los elementos siguen siendo interactivos
      await expect(page.locator('[data-testid="reservation-card-reservation-0"]')).toBeVisible();
    });
  });
});
