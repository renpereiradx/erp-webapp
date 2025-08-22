/**
 * APITestPanel - Wave 8: Componente de demostración de la nueva API
 * Panel para probar todos los endpoints documentados de RESERVE_API.md
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useI18n } from '../../lib/i18n';
import useReservationStore from '../../store/useReservationStore';
import reservationServiceV2 from '../../services/reservationServiceV2';
import { validateReserveRequest, validateReservationId } from '../../utils/reservationValidators';
import { RESERVATION_ACTIONS, RESERVATION_STATUSES } from '../../types/reservationTypes';
import { 
  Play, 
  Database, 
  Users, 
  Package, 
  FileSearch, 
  ShieldCheck, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

const APITestPanel = () => {
  const { t } = useI18n();
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [formData, setFormData] = useState({
    productId: 'BT_Cancha_1_xyz123abc',
    clientId: 'CLI_12345',
    startTime: '2025-08-23T14:00:00Z',
    duration: 2,
    reserveId: 1,
    date: '2025-08-23'
  });

  // Funciones del store
  const {
    manageReservationV2,
    getReservationsByProductV2,
    getReservationsByClientV2,
    checkConsistencyV2,
    getAvailableSchedulesV2
  } = useReservationStore();

  const executeTest = async (testName, testFunction) => {
    setLoading(prev => ({ ...prev, [testName]: true }));
    setResults(prev => ({ ...prev, [testName]: null }));
    
    try {
      const start = performance.now();
      const result = await testFunction();
      const duration = Math.round(performance.now() - start);
      
      setResults(prev => ({
        ...prev,
        [testName]: {
          success: true,
          data: result,
          duration,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [testName]: {
          success: false,
          error: error.message,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [testName]: false }));
    }
  };

  const testEndpoints = [
    {
      id: 'manage_create',
      title: 'POST /reserve/manage (CREATE)',
      icon: <Database className="w-4 h-4" />,
      description: 'Crear nueva reserva usando API unificada',
      action: () => executeTest('manage_create', async () => {
        const data = {
          product_id: formData.productId,
          client_id: formData.clientId,
          start_time: formData.startTime,
          duration: formData.duration
        };
        return await manageReservationV2(RESERVATION_ACTIONS.CREATE, data);
      })
    },
    {
      id: 'manage_update',
      title: 'POST /reserve/manage (UPDATE)',
      icon: <Database className="w-4 h-4" />,
      description: 'Actualizar reserva existente',
      action: () => executeTest('manage_update', async () => {
        const data = {
          reserve_id: formData.reserveId,
          duration: 3
        };
        return await manageReservationV2(RESERVATION_ACTIONS.UPDATE, data);
      })
    },
    {
      id: 'manage_cancel',
      title: 'POST /reserve/manage (CANCEL)',
      icon: <Database className="w-4 h-4" />,
      description: 'Cancelar reserva',
      action: () => executeTest('manage_cancel', async () => {
        const data = {
          reserve_id: formData.reserveId
        };
        return await manageReservationV2(RESERVATION_ACTIONS.CANCEL, data);
      })
    },
    {
      id: 'by_id',
      title: 'GET /reserve/{id}',
      icon: <FileSearch className="w-4 h-4" />,
      description: 'Obtener reserva por ID',
      action: () => executeTest('by_id', async () => {
        return await reservationServiceV2.getReservationById(formData.reserveId);
      })
    },
    {
      id: 'by_product',
      title: 'GET /reserve/product/{product_id}',
      icon: <Package className="w-4 h-4" />,
      description: 'Obtener reservas por producto',
      action: () => executeTest('by_product', async () => {
        return await getReservationsByProductV2(formData.productId);
      })
    },
    {
      id: 'by_client',
      title: 'GET /reserve/client/{client_id}',
      icon: <Users className="w-4 h-4" />,
      description: 'Obtener reservas por cliente',
      action: () => executeTest('by_client', async () => {
        return await getReservationsByClientV2(formData.clientId);
      })
    },
    {
      id: 'report',
      title: 'GET /reserve/report',
      icon: <FileSearch className="w-4 h-4" />,
      description: 'Obtener reporte de reservas',
      action: () => executeTest('report', async () => {
        return await reservationServiceV2.getReservationReport({
          start_date: '2025-08-20',
          end_date: '2025-08-30'
        });
      })
    },
    {
      id: 'consistency',
      title: 'GET /reserve/consistency/check',
      icon: <ShieldCheck className="w-4 h-4" />,
      description: 'Verificar consistencia reservas-ventas',
      action: () => executeTest('consistency', async () => {
        return await checkConsistencyV2();
      })
    },
    {
      id: 'available_schedules',
      title: 'GET /reserve/available-schedules',
      icon: <Calendar className="w-4 h-4" />,
      description: 'Obtener horarios disponibles',
      action: () => executeTest('available_schedules', async () => {
        return await getAvailableSchedulesV2(formData.productId, formData.date, 2);
      })
    }
  ];

  const renderResult = (testId) => {
    const result = results[testId];
    if (!result) return null;

    if (result.success) {
      return (
        <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-300 text-sm font-medium mb-2">
            <CheckCircle className="w-4 h-4" />
            Success ({result.duration}ms)
          </div>
          <pre className="text-xs text-green-600 dark:text-green-400 overflow-auto max-h-32">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      );
    }

    return (
      <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-300 text-sm font-medium mb-2">
          <AlertTriangle className="w-4 h-4" />
          Error
        </div>
        <p className="text-xs text-red-600 dark:text-red-400">{result.error}</p>
      </div>
    );
  };

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
          <Play className="w-5 h-5" />
          API V2 Test Panel - Wave 8
        </CardTitle>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Prueba todos los endpoints documentados en RESERVE_API.md
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Formulario de parámetros */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg border">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Product ID
            </label>
            <Input
              value={formData.productId}
              onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value }))}
              className="text-xs"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Client ID
            </label>
            <Input
              value={formData.clientId}
              onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
              className="text-xs"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Reserve ID
            </label>
            <Input
              type="number"
              value={formData.reserveId}
              onChange={(e) => setFormData(prev => ({ ...prev, reserveId: parseInt(e.target.value) }))}
              className="text-xs"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Start Time (ISO)
            </label>
            <Input
              value={formData.startTime}
              onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
              className="text-xs"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Duration (hours)
            </label>
            <Input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: parseFloat(e.target.value) }))}
              className="text-xs"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Date (YYYY-MM-DD)
            </label>
            <Input
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="text-xs"
            />
          </div>
        </div>

        {/* Lista de endpoints */}
        <div className="grid gap-4">
          {testEndpoints.map((endpoint) => (
            <div key={endpoint.id} className="border rounded-lg p-4 bg-white dark:bg-slate-800">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-blue-600 dark:text-blue-400">
                    {endpoint.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {endpoint.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {endpoint.description}
                    </p>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  onClick={endpoint.action}
                  disabled={loading[endpoint.id]}
                  className="flex items-center gap-2"
                >
                  {loading[endpoint.id] ? (
                    <Clock className="w-3 h-3 animate-spin" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                  Test
                </Button>
              </div>
              
              {renderResult(endpoint.id)}
            </div>
          ))}
        </div>

        {/* Estadísticas */}
        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
          <h5 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-2">
            Test Statistics
          </h5>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-600">
                {Object.values(results).filter(r => r?.success).length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Successful</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">
                {Object.values(results).filter(r => r && !r.success).length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Failed</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {Object.values(results).length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Total Tests</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default APITestPanel;
