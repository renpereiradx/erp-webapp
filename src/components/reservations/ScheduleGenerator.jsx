/**
 * Componente para generación automática de horarios
 * Permite generar horarios diarios, para fechas específicas o próximos N días
 * Integrado con el sistema de reservas
 */

import React, { useState } from 'react';
import { Calendar, Clock, Zap, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import useReservationStore from '../../store/useReservationStore';
import { useI18n } from '../../lib/i18n';
import { useFocusManagement } from '../../hooks/useFocusManagement';
import LiveRegion from '../a11y/LiveRegion';
import { cn } from '../../lib/utils';

const ScheduleGenerator = ({ className = "" }) => {
  const { t } = useTranslation();
  const { announce } = useFocusManagement();
  
  // Estado local
  const [selectedType, setSelectedType] = useState('daily'); // daily, date, next-days
  const [targetDate, setTargetDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [nextDays, setNextDays] = useState(7);
  const [showPreview, setShowPreview] = useState(false);

  // Store de reservas
  const {
    scheduleManagement,
    generateDailySchedules,
    generateSchedulesForDate,
    generateSchedulesForNextDays,
    clearError,
    error
  } = useReservationStore();

  // Validaciones
  const isValidNextDays = nextDays >= 1 && nextDays <= 365;
  const isValidTargetDate = targetDate && new Date(targetDate) >= new Date().setHours(0, 0, 0, 0);
  
  const canGenerate = {
    daily: true,
    date: isValidTargetDate,
    'next-days': isValidNextDays
  }[selectedType];

  // Manejadores de eventos
  const handleGenerate = async () => {
    try {
      clearError();
      let result;
      
      switch (selectedType) {
        case 'daily':
          result = await generateDailySchedules();
          announce(t('reservations.a11y.schedule.daily_generated', { count: result?.generated_count || 0 }));
          break;
          
        case 'date':
          result = await generateSchedulesForDate(targetDate);
          announce(t('reservations.a11y.schedule.date_generated', { 
            date: targetDate, 
            count: result?.generated_count || 0 
          }));
          break;
          
        case 'next-days':
          result = await generateSchedulesForNextDays(nextDays);
          announce(t('reservations.a11y.schedule.next_days_generated', { 
            days: nextDays, 
            count: result?.generated_count || 0 
          }));
          break;
          
        default:
          throw new Error('Tipo de generación no válido');
      }
      
      setShowPreview(true);
    } catch (error) {
      announce(t('reservations.a11y.schedule.generation_failed'));
    }
  };

  const getGenerationDescription = () => {
    switch (selectedType) {
      case 'daily':
        return t('reservations.schedule.generator.daily_description');
      case 'date':
        return t('reservations.schedule.generator.date_description', { date: targetDate });
      case 'next-days':
        return t('reservations.schedule.generator.next_days_description', { days: nextDays });
      default:
        return '';
    }
  };

  const getLastGenerationInfo = () => {
    const last = scheduleManagement.lastGeneration;
    if (!last) return null;
    
    const timeAgo = Math.round((Date.now() - last.timestamp) / (1000 * 60));
    const typeLabel = {
      daily: t('reservations.schedule.generator.type_daily'),
      date: t('reservations.schedule.generator.type_date'),
      'next-days': t('reservations.schedule.generator.type_next_days')
    }[last.type];
    
    return {
      type: typeLabel,
      timeAgo,
      count: last.result?.generated_count || 0,
      details: last.targetDate || (last.days ? `${last.days} días` : 'hoy')
    };
  };

  const lastGeneration = getLastGenerationInfo();

  return (
    <div className={cn("space-y-6", className)}>
      <LiveRegion />
      
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Zap className="h-5 w-5" />
          {t('reservations.schedule.generator.title')}
        </h3>
        <p className="text-gray-600 mt-1">
          {t('reservations.schedule.generator.subtitle')}
        </p>
      </div>

      {/* Información de última generación */}
      {lastGeneration && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            {t('reservations.schedule.generator.last_generation', {
              type: lastGeneration.type,
              timeAgo: lastGeneration.timeAgo,
              count: lastGeneration.count,
              details: lastGeneration.details
            })}
          </AlertDescription>
        </Alert>
      )}

      {/* Error handling */}
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Opción: Generar diario */}
        <Card 
          className={cn(
            "cursor-pointer transition-all border-2",
            selectedType === 'daily' ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
          )}
          onClick={() => setSelectedType('daily')}
          role="button"
          tabIndex={0}
          aria-pressed={selectedType === 'daily'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setSelectedType('daily');
            }
          }}
        >
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('reservations.schedule.generator.daily_title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              {t('reservations.schedule.generator.daily_description')}
            </p>
            <Badge variant={selectedType === 'daily' ? "default" : "secondary"}>
              {t('reservations.schedule.generator.automatic')}
            </Badge>
          </CardContent>
        </Card>

        {/* Opción: Fecha específica */}
        <Card 
          className={cn(
            "cursor-pointer transition-all border-2",
            selectedType === 'date' ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
          )}
          onClick={() => setSelectedType('date')}
          role="button"
          tabIndex={0}
          aria-pressed={selectedType === 'date'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setSelectedType('date');
            }
          }}
        >
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('reservations.schedule.generator.date_title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              {t('reservations.schedule.generator.date_description_generic')}
            </p>
            
            {selectedType === 'date' && (
              <div className="space-y-2">
                <Label htmlFor="target-date" className="text-sm font-medium">
                  {t('reservations.schedule.generator.select_date')}
                </Label>
                <Input
                  id="target-date"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full"
                />
                {!isValidTargetDate && targetDate && (
                  <p className="text-red-600 text-xs" role="alert">
                    {t('reservations.schedule.generator.invalid_date')}
                  </p>
                )}
              </div>
            )}
            
            <Badge variant={selectedType === 'date' ? "default" : "secondary"} className="mt-2">
              {t('reservations.schedule.generator.specific')}
            </Badge>
          </CardContent>
        </Card>

        {/* Opción: Próximos N días */}
        <Card 
          className={cn(
            "cursor-pointer transition-all border-2",
            selectedType === 'next-days' ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
          )}
          onClick={() => setSelectedType('next-days')}
          role="button"
          tabIndex={0}
          aria-pressed={selectedType === 'next-days'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setSelectedType('next-days');
            }
          }}
        >
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              {t('reservations.schedule.generator.next_days_title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              {t('reservations.schedule.generator.next_days_description_generic')}
            </p>
            
            {selectedType === 'next-days' && (
              <div className="space-y-2">
                <Label htmlFor="next-days" className="text-sm font-medium">
                  {t('reservations.schedule.generator.number_of_days')}
                </Label>
                <Input
                  id="next-days"
                  type="number"
                  min="1"
                  max="365"
                  value={nextDays}
                  onChange={(e) => setNextDays(parseInt(e.target.value) || 1)}
                  className="w-full"
                />
                {!isValidNextDays && (
                  <p className="text-red-600 text-xs" role="alert">
                    {t('reservations.schedule.generator.invalid_days')}
                  </p>
                )}
              </div>
            )}
            
            <Badge variant={selectedType === 'next-days' ? "default" : "secondary"} className="mt-2">
              {t('reservations.schedule.generator.bulk')}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Preview y confirmación */}
      <Card role="region" aria-label={t('reservations.schedule.generator.generation_section')}>
        <CardHeader>
          <CardTitle className="text-lg">
            {t('reservations.schedule.generator.generate_schedules')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Descripción de lo que se va a generar */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">
              {t('reservations.schedule.generator.generation_summary')}
            </h4>
            <p className="text-gray-700 text-sm">
              {getGenerationDescription()}
            </p>
          </div>

          {/* Información adicional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <strong>{t('reservations.schedule.generator.schedule_pattern')}:</strong>
              <br />
              {t('reservations.schedule.generator.pattern_description')}
            </div>
            <div>
              <strong>{t('reservations.schedule.generator.availability')}:</strong>
              <br />
              {t('reservations.schedule.generator.availability_description')}
            </div>
          </div>

          {/* Botón de generación */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || scheduleManagement.generatingSchedules}
              className="flex-1 sm:flex-none"
            >
              {scheduleManagement.generatingSchedules ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {t('reservations.schedule.generator.generating')}
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  {t('reservations.schedule.generator.generate_button')}
                </>
              )}
            </Button>
            
            {!canGenerate && (
              <p className="text-red-600 text-sm self-center" role="alert">
                {selectedType === 'date' && !isValidTargetDate && t('reservations.schedule.generator.fix_date')}
                {selectedType === 'next-days' && !isValidNextDays && t('reservations.schedule.generator.fix_days')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resultado de la generación */}
      {showPreview && scheduleManagement.lastGeneration && (
        <Card role="region" aria-label={t('reservations.schedule.generator.result_section')}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {t('reservations.schedule.generator.generation_complete')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {scheduleManagement.lastGeneration.result?.generated_count || 0}
                  </div>
                  <div className="text-sm text-gray-600">
                    {t('reservations.schedule.generator.schedules_created')}
                  </div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-700">
                    {scheduleManagement.lastGeneration.type === 'daily' ? t('reservations.schedule.generator.today') :
                     scheduleManagement.lastGeneration.type === 'date' ? scheduleManagement.lastGeneration.targetDate :
                     `${scheduleManagement.lastGeneration.days} ${t('reservations.schedule.generator.days')}`}
                  </div>
                  <div className="text-sm text-gray-600">
                    {t('reservations.schedule.generator.time_period')}
                  </div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-700">
                    {new Date(scheduleManagement.lastGeneration.timestamp).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="text-sm text-gray-600">
                    {t('reservations.schedule.generator.generated_at')}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
              >
                {t('common.close')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScheduleGenerator;
