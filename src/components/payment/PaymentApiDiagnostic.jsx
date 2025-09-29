import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

/**
 * Payment API Diagnostic Component
 * Tests each endpoint individually to identify the exact problem
 */
const PaymentApiDiagnostic = () => {
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);

  const endpoints = [
    { name: 'Currencies', url: '/currencies', method: 'GET' },
    { name: 'Payment Methods', url: '/payment-methods', method: 'GET' },
    { name: 'Exchange Rate USD', url: '/exchange-rate/currency/2', method: 'GET' },
    { name: 'Exchange Rate PYG', url: '/exchange-rate/currency/1', method: 'GET' }
  ];

  const testEndpoint = async (endpoint) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5050';
    const fullUrl = `${baseUrl}${endpoint.url}`;

    try {
      console.log(`🧪 Testing ${endpoint.name}: ${fullUrl}`);

      const response = await fetch(fullUrl, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: data,
        url: fullUrl,
        headers: Object.fromEntries(response.headers.entries())
      };

    } catch (error) {
      return {
        success: false,
        status: 0,
        statusText: 'Network Error',
        error: error.message,
        url: fullUrl
      };
    }
  };

  const runDiagnostic = async () => {
    setIsRunning(true);
    setTestResults({});

    for (const endpoint of endpoints) {
      const result = await testEndpoint(endpoint);
      setTestResults(prev => ({
        ...prev,
        [endpoint.name]: result
      }));
    }

    setIsRunning(false);
  };

  const getStatusIcon = (result) => {
    if (!result) return <AlertCircle className="w-5 h-5 text-gray-400" />;
    if (result.success) return <CheckCircle className="w-5 h-5 text-green-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusColor = (result) => {
    if (!result) return 'bg-gray-50 border-gray-200';
    if (result.success) return 'bg-green-50 border-green-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Diagnóstico de Payment APIs</h2>
            <p className="text-sm text-gray-600 mt-1">
              Prueba cada endpoint individualmente para identificar problemas
            </p>
          </div>
          <button
            onClick={runDiagnostic}
            disabled={isRunning}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <Play className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Ejecutando...' : 'Ejecutar Diagnóstico'}
          </button>
        </div>

        {/* Environment Info */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Configuración de Entorno</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <div><strong>Base URL:</strong> {import.meta.env.VITE_API_URL || 'http://localhost:5050'}</div>
            <div><strong>Auth Token:</strong> {localStorage.getItem('authToken') ? '✅ Presente' : '❌ No encontrado'}</div>
            <div><strong>Frontend URL:</strong> {window.location.origin}</div>
          </div>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          {endpoints.map((endpoint) => {
            const result = testResults[endpoint.name];
            return (
              <div
                key={endpoint.name}
                className={`p-4 border rounded-lg ${getStatusColor(result)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(result)}
                    <div>
                      <h3 className="font-medium text-gray-900">{endpoint.name}</h3>
                      <p className="text-sm text-gray-600">{endpoint.method} {endpoint.url}</p>
                    </div>
                  </div>
                  {result && (
                    <div className="text-right">
                      <div className={`text-sm font-medium ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                        {result.status} {result.statusText}
                      </div>
                    </div>
                  )}
                </div>

                {result && (
                  <div className="mt-3">
                    {/* URL */}
                    <div className="text-xs text-gray-600 mb-2">
                      <strong>URL:</strong> {result.url}
                    </div>

                    {/* Response/Error */}
                    {result.success ? (
                      <div>
                        <div className="text-xs text-green-700 mb-1"><strong>Respuesta:</strong></div>
                        <pre className="text-xs bg-green-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div>
                        <div className="text-xs text-red-700 mb-1"><strong>Error:</strong></div>
                        <pre className="text-xs bg-red-100 p-2 rounded overflow-x-auto">
                          {result.error || JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Headers (only if error) */}
                    {!result.success && result.headers && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-700 mb-1"><strong>Headers:</strong></div>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.headers, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {isRunning && !result && (
                  <div className="text-sm text-gray-600 animate-pulse">
                    Probando endpoint...
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Instrucciones</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>1. <strong>Ejecutar diagnóstico</strong> para probar cada endpoint individualmente</p>
            <p>2. <strong>Verificar errores</strong> específicos (CORS, 404, Auth, etc.)</p>
            <p>3. <strong>Comparar URLs</strong> con las que funcionan en tu prueba manual</p>
            <p>4. <strong>Verificar headers</strong> de autenticación si es necesario</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentApiDiagnostic;