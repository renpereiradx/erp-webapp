import React, { useState } from 'react';
import { purchaseService } from '../services/purchaseService';

const PurchaseEndpointsTest = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const runTest = async (testName, testFunction) => {
    setLoading(true);
    try {
      const result = await testFunction();
      setResults(prev => ({
        ...prev,
        [testName]: {
          success: true,
          data: result,
          error: null
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [testName]: {
          success: false,
          data: null,
          error: error.message
        }
      }));
    }
    setLoading(false);
  };

  const runAllTests = async () => {
    setResults({});
    setLoading(true);

    // Test 1: Compras por nombre de proveedor
    await runTest('supplierName', async () => {
      return await purchaseService.getPurchasesBySupplierName('TechBody');
    });

    // Test 2: Compras por rango de fechas
    await runTest('dateRange', async () => {
      return await purchaseService.getPurchasesByDateRange('2025-01-01', '2025-12-31', 1, 10);
    });

    // Test 3: Compras recientes
    await runTest('recent', async () => {
      return await purchaseService.getRecentPurchases(30, 1, 5);
    });

    // Test 4: Compras del mes actual
    await runTest('currentMonth', async () => {
      return await purchaseService.getCurrentMonthPurchases(1, 5);
    });

    // Test 5: Validación con proveedor
    await runTest('validation', async () => {
      return await purchaseService.getPurchaseOrderWithSupplierValidation(1, 'TechBody');
    });

    setLoading(false);
  };

  const formatResult = (result) => {
    if (!result) return 'No ejecutado';

    if (result.success) {
      const dataCount = result.data?.data?.length || 0;
      return (
        <div className="text-green-600">
          ✅ Éxito - {dataCount} registros
          {result.data?.pagination && (
            <div className="text-sm text-gray-600 ml-4">
              Página: {result.data.pagination.page}, Tamaño: {result.data.pagination.pageSize}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className="text-red-600">
          ❌ Error: {result.error}
        </div>
      );
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Pruebas de Endpoints de Compras</h2>

      <div className="mb-6">
        <button
          onClick={runAllTests}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? 'Ejecutando pruebas...' : 'Ejecutar todas las pruebas'}
        </button>
      </div>

      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">1. Compras por nombre de proveedor</h3>
          <p className="text-sm text-gray-600 mb-2">GET /purchase/supplier_name/{`{name}`}</p>
          {formatResult(results.supplierName)}
          {results.supplierName?.data?.data?.[0] && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
              <strong>Ejemplo:</strong> Orden #{results.supplierName.data.data[0].purchase?.id} -
              {results.supplierName.data.data[0].purchase?.supplier_name} -
              ${results.supplierName.data.data[0].purchase?.total_amount?.toLocaleString()}
            </div>
          )}
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">2. Compras por rango de fechas</h3>
          <p className="text-sm text-gray-600 mb-2">GET /purchase/date_range/?start_date={`{YYYY-MM-DD}`}&end_date={`{YYYY-MM-DD}`}&page={`{1}`}&page_size={`{50}`}</p>
          {formatResult(results.dateRange)}
          {results.dateRange?.data?.data?.[0] && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
              <strong>Ejemplo:</strong> Orden #{results.dateRange.data.data[0].purchase?.id} -
              {new Date(results.dateRange.data.data[0].purchase?.order_date).toLocaleDateString()}
            </div>
          )}
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">3. Compras recientes (30 días)</h3>
          <p className="text-sm text-gray-600 mb-2">Helper method - getRecentPurchases()</p>
          {formatResult(results.recent)}
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">4. Compras del mes actual</h3>
          <p className="text-sm text-gray-600 mb-2">Helper method - getCurrentMonthPurchases()</p>
          {formatResult(results.currentMonth)}
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">5. Validación con proveedor</h3>
          <p className="text-sm text-gray-600 mb-2">GET /purchase/{`{id}`}/supplier/{`{name}`}</p>
          {formatResult(results.validation)}
        </div>
      </div>

      {Object.keys(results).length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h3 className="text-lg font-semibold mb-2">Resumen de resultados</h3>
          <div className="text-sm">
            <div>Total de pruebas: {Object.keys(results).length}</div>
            <div>Exitosas: {Object.values(results).filter(r => r.success).length}</div>
            <div>Fallidas: {Object.values(results).filter(r => !r.success).length}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseEndpointsTest;