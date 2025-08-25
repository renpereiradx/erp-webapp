/**
 * Componente de verificación de consistencia entre reservas y ventas
 * Monitorea automáticamente la integridad de datos y muestra alertas
 * Integrado con API /reserve/consistency/check para auditoría continua
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw, Bug, Eye, EyeOff, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { useI18n } from '../../lib/i18n';
import useReservationStore from '../../store/useReservationStore';
import { cn } from '../../lib/utils';
import LiveRegion from '../a11y/LiveRegion';

const ConsistencyChecker = ({ 
  className = "",
  autoCheck = true,
  checkInterval = 30000, // 30 segundos por defecto
  showMinimal = false
}) => {
  const { t } = useI18n();
  
  const {
    loading,
    checkConsistency
  } = useReservationStore();

  // Estado local
  const [consistencyIssues, setConsistencyIssues] = useState([]);
  const [lastCheckTime, setLastCheckTime] = useState(null);
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(autoCheck);
  const [isExpanded, setIsExpanded] = useState(!showMinimal);
  const [checking, setChecking] = useState(false);

  // Ejecutar verificación de consistencia
  const runConsistencyCheck = useCallback(async (isAutomatic = false) => {
    try {
      setChecking(true);
      
      console.log('[telemetry] feature.reservations.consistency.check.start', {
        automatic: isAutomatic,
        timestamp: new Date().toISOString()
      });

      const issues = await checkConsistency();
      setConsistencyIssues(issues || []);
      setLastCheckTime(new Date());
      
      console.log('[telemetry] feature.reservations.consistency.check.success', {
        automatic: isAutomatic,
        issuesFound: issues?.length || 0,
        timestamp: new Date().toISOString()
      });

      // Telemetría específica por tipo de problema
      if (issues && issues.length > 0) {
        const issueTypes = issues.reduce((acc, issue) => {
          acc[issue.issue_type] = (acc[issue.issue_type] || 0) + 1;
          return acc;
        }, {});

        console.log('[telemetry] feature.reservations.consistency.issues.detected', {
          automatic: isAutomatic,
          issueTypes,
          totalCount: issues.length
        });
      }

    } catch (error) {
      console.error('[telemetry] feature.reservations.consistency.check.error', {
        automatic: isAutomatic,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      setConsistencyIssues([{
        issue_type: 'CHECK_ERROR',
        details: error.message || t('reservations.consistency.check_error'),
        sales_count: 0
      }]);
    } finally {
      setChecking(false);
    }
  }, [checkConsistency, t]);

  // Verificación automática con intervalo
  useEffect(() => {
    if (!autoCheckEnabled) return;

    const interval = setInterval(() => {
      runConsistencyCheck(true);
    }, checkInterval);

    // Ejecutar verificación inicial
    runConsistencyCheck(true);

    return () => clearInterval(interval);
  }, [autoCheckEnabled, checkInterval, runConsistencyCheck]);

  // Obtener resumen de problemas por tipo
  const issuesSummary = useMemo(() => {
    const summary = {
      total: consistencyIssues.length,
      critical: 0,
      warning: 0,
      info: 0,
      types: {}
    };

    consistencyIssues.forEach(issue => {
      // Clasificar por severidad
      switch (issue.issue_type) {
        case 'MISSING_SALE':
        case 'ORPHANED_SALE':
          summary.critical++;
          break;
        case 'STATUS_MISMATCH':
        case 'AMOUNT_MISMATCH':
          summary.warning++;
          break;
        default:
          summary.info++;
      }

      // Contar por tipo
      summary.types[issue.issue_type] = (summary.types[issue.issue_type] || 0) + 1;
    });

    return summary;
  }, [consistencyIssues]);

  // Obtener color y icono según severidad
  const getIssueDisplay = (issueType) => {
    switch (issueType) {
      case 'MISSING_SALE':
        return {
          color: 'destructive',
          icon: AlertTriangle,
          label: t('reservations.consistency.types.missing_sale')
        };
      case 'ORPHANED_SALE':
        return {
          color: 'destructive',
          icon: AlertTriangle,
          label: t('reservations.consistency.types.orphaned_sale')
        };
      case 'STATUS_MISMATCH':
        return {
          color: 'warning',
          icon: AlertTriangle,
          label: t('reservations.consistency.types.status_mismatch')
        };
      case 'AMOUNT_MISMATCH':
        return {
          color: 'warning',
          icon: AlertTriangle,
          label: t('reservations.consistency.types.amount_mismatch')
        };
      default:
        return {
          color: 'secondary',
          icon: Bug,
          label: issueType
        };
    }
  };

  // Formatear tiempo transcurrido
  const getTimeAgo = (date) => {
    if (!date) return '';
    
    const minutes = Math.floor((new Date() - date) / 60000);
    if (minutes < 1) return t('reservations.consistency.just_now');
    if (minutes < 60) return t('reservations.consistency.minutes_ago', { minutes });
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('reservations.consistency.hours_ago', { hours });
    
    const days = Math.floor(hours / 24);
    return t('reservations.consistency.days_ago', { days });
  };

  // Vista minimal para mostrar solo estado
  if (showMinimal && !isExpanded) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {issuesSummary.total === 0 ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">{t('reservations.consistency.all_good')}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">
              {t('reservations.consistency.issues_found', { count: issuesSummary.total })}
            </span>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(true)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bug className="h-4 w-4" />
            {t('reservations.consistency.title')}
            {checking && <RefreshCw className="h-4 w-4 animate-spin" />}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {showMinimal && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => runConsistencyCheck(false)}
              disabled={checking || loading}
            >
              <RefreshCw className={cn("h-4 w-4", (checking || loading) && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Control de verificación automática */}
        <div className="flex items-center gap-2 text-sm">
          <Switch
            id="auto-check"
            checked={autoCheckEnabled}
            onCheckedChange={setAutoCheckEnabled}
          />
          <Label htmlFor="auto-check" className="cursor-pointer">
            {t('reservations.consistency.auto_check')}
          </Label>
          
          {lastCheckTime && (
            <div className="flex items-center gap-1 text-muted-foreground ml-auto">
              <Clock className="h-3 w-3" />
              <span>{t('reservations.consistency.last_check')}: {getTimeAgo(lastCheckTime)}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Resumen de estado */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-muted/50 rounded">
            <div className="text-2xl font-bold">{issuesSummary.total}</div>
            <div className="text-xs text-muted-foreground">
              {t('reservations.consistency.total_issues')}
            </div>
          </div>
          
          <div className="text-center p-3 bg-red-50 rounded">
            <div className="text-2xl font-bold text-red-600">{issuesSummary.critical}</div>
            <div className="text-xs text-muted-foreground">
              {t('reservations.consistency.critical')}
            </div>
          </div>
          
          <div className="text-center p-3 bg-yellow-50 rounded">
            <div className="text-2xl font-bold text-yellow-600">{issuesSummary.warning}</div>
            <div className="text-xs text-muted-foreground">
              {t('reservations.consistency.warnings')}
            </div>
          </div>
          
          <div className="text-center p-3 bg-blue-50 rounded">
            <div className="text-2xl font-bold text-blue-600">{issuesSummary.info}</div>
            <div className="text-xs text-muted-foreground">
              {t('reservations.consistency.info')}
            </div>
          </div>
        </div>

        {/* Estado general */}
        {issuesSummary.total === 0 ? (
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">
              {t('reservations.consistency.no_issues_title')}
            </AlertTitle>
            <AlertDescription className="text-green-700">
              {t('reservations.consistency.no_issues_description')}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>
              {t('reservations.consistency.issues_detected_title', { 
                count: issuesSummary.total 
              })}
            </AlertTitle>
            <AlertDescription>
              {t('reservations.consistency.issues_detected_description')}
            </AlertDescription>
          </Alert>
        )}

        {/* Lista detallada de problemas */}
        {consistencyIssues.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">
              {t('reservations.consistency.issues_details')}
            </h4>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {consistencyIssues.map((issue, index) => {
                const display = getIssueDisplay(issue.issue_type);
                const IconComponent = display.icon;
                
                return (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 border rounded-lg bg-card"
                  >
                    <IconComponent className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={display.color} className="text-xs">
                          {display.label}
                        </Badge>
                        
                        {issue.reserve_id && (
                          <Badge variant="outline" className="text-xs">
                            ID: {issue.reserve_id}
                          </Badge>
                        )}
                        
                        <Badge variant="secondary" className="text-xs">
                          {t('reservations.consistency.sales_count', { 
                            count: issue.sales_count 
                          })}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {issue.details}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Resumen por tipo de problema */}
        {Object.keys(issuesSummary.types).length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">
              {t('reservations.consistency.summary_by_type')}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(issuesSummary.types).map(([type, count]) => {
                const display = getIssueDisplay(type);
                
                return (
                  <div key={type} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span className="text-sm">{display.label}</span>
                    <Badge variant={display.color} className="text-xs">
                      {count}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Información sobre verificación automática */}
        {autoCheckEnabled && (
          <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
            {t('reservations.consistency.auto_check_info', {
              interval: Math.floor(checkInterval / 1000)
            })}
          </div>
        )}
      </CardContent>

      <LiveRegion />
    </Card>
  );
};

export default React.memo(ConsistencyChecker);
