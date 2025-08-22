/**
 * Indicador visual del estado del Circuit Breaker
 * Muestra el estado actual y permite reset manual del circuito
 */

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import useReservationStore from '../../store/useReservationStore';
import { useI18n } from '../../lib/i18n';
import LiveRegion from '../a11y/LiveRegion';
import { cn } from '../../lib/utils';

const CircuitBreakerIndicator = ({ className = "", showResetButton = true }) => {
  const { t } = useTranslation();
  const [resetting, setResetting] = useState(false);
  const [liveMessage, setLiveMessage] = useState('');
  
  const { 
    circuit,
    circuitOpenCount,
    resetCircuitBreaker 
  } = useReservationStore(state => ({
    circuit: state.circuit,
    circuitOpenCount: state.circuitOpenCount,
    resetCircuitBreaker: state.resetCircuitBreaker
  }));
  
  // Determinar estado del circuito
  const isCircuitOpen = circuit?.openUntil && Date.now() < circuit.openUntil;
  const circuitState = isCircuitOpen ? 'open' : 'closed';
  const failureCount = circuit?.failures || 0;
  
  // No mostrar si el circuito está cerrado y no hay fallas recientes
  if (circuitState === 'closed' && failureCount === 0) {
    return null;
  }
  
  const handleReset = async () => {
    if (resetting || !isCircuitOpen) return;
    
    setResetting(true);
    setLiveMessage(t('reservations.circuit.resetting'));
    
    try {
      resetCircuitBreaker();
      setLiveMessage(t('reservations.circuit.reset_success'));
    } catch (error) {
      console.error('Circuit reset failed:', error);
      setLiveMessage(t('reservations.circuit.reset_failed'));
    } finally {
      setResetting(false);
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setLiveMessage(''), 3000);
    }
  };
  
  const getTimeRemaining = () => {
    if (!isCircuitOpen || !circuit?.openUntil) return 0;
    return Math.max(0, circuit.openUntil - Date.now());
  };
  
  const timeRemainingMs = getTimeRemaining();
  const timeRemainingSec = Math.ceil(timeRemainingMs / 1000);
  
  return (
    <>
      <LiveRegion message={liveMessage} />
      
      <div 
        className={cn(
          "circuit-status flex items-center gap-2 px-3 py-2 rounded-md border",
          isCircuitOpen ? 
            "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800" :
            "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800",
          className
        )}
        data-state={circuitState}
        role="status"
        aria-live="polite"
      >
        {/* Icono de estado */}
        {isCircuitOpen ? (
          <AlertTriangle 
            className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" 
            aria-hidden="true"
          />
        ) : (
          <CheckCircle 
            className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" 
            aria-hidden="true"
          />
        )}
        
        {/* Estado y detalles */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className={cn(
            "font-medium text-sm",
            isCircuitOpen ? 
              "text-red-800 dark:text-red-200" : 
              "text-yellow-800 dark:text-yellow-200"
          )}>
            {t(`reservations.circuit.${circuitState}`)}
          </span>
          
          {/* Badge con información adicional */}
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs",
              isCircuitOpen ?
                "border-red-300 text-red-700 dark:border-red-700 dark:text-red-300" :
                "border-yellow-300 text-yellow-700 dark:border-yellow-700 dark:text-yellow-300"
            )}
          >
            {isCircuitOpen ? (
              t('reservations.circuit.open_time', { seconds: timeRemainingSec })
            ) : (
              t('reservations.circuit.failures', { count: failureCount })
            )}
          </Badge>
          
          {/* Contador de resets */}
          {circuitOpenCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {t('reservations.circuit.resets', { count: circuitOpenCount })}
            </Badge>
          )}
        </div>
        
        {/* Botón de reset (solo si está abierto) */}
        {showResetButton && isCircuitOpen && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            disabled={resetting}
            className={cn(
              "text-xs px-2 py-1 h-auto flex-shrink-0",
              "bg-white hover:bg-red-50 border-red-300 text-red-700 hover:text-red-800",
              "dark:bg-red-900 dark:hover:bg-red-800 dark:border-red-700 dark:text-red-200"
            )}
            aria-describedby="reset-description"
          >
            {resetting ? (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="h-3 w-3" aria-hidden="true" />
            )}
            <span className="ml-1">
              {t('reservations.circuit.reset')}
            </span>
          </Button>
        )}
        
        {/* Descripción oculta para screen readers */}
        <div id="reset-description" className="sr-only">
          {t('reservations.circuit.reset_description')}
        </div>
      </div>
    </>
  );
};

export default CircuitBreakerIndicator;
