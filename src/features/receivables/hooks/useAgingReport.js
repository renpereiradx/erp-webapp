import { useState, useEffect } from 'react';
import { receivablesService } from '@/services/bi/receivablesService';

/**
 * Hook personalizado para manejar la lógica del Reporte de Antigüedad y Estadísticas.
 * Consume los endpoints 8, 9 y 12 de la API de Receivables.
 */
export const useAgingReport = (period = 'month') => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Ejecutamos peticiones en paralelo (Endpoints 1, 9 y 12)
        const [overviewRes, reportRes, statsRes] = await Promise.all([
          receivablesService.getSummary(period),
          receivablesService.getDetailedAging(),
          receivablesService.getStatistics(period)
        ]);

        if (isMounted) {
          if (overviewRes?.success && reportRes?.success && statsRes?.success) {
            setData({
              overview: overviewRes.data,
              detailed: reportRes.data,
              statistics: statsRes.data
            });
          } else {
            setError('No se pudo obtener la información completa del reporte.');
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching aging report data:', err);
          setError('Error de conexión al cargar los reportes.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAllData();

    return () => {
      isMounted = false;
    };
  }, [period]);

  return { data, loading, error };
};
