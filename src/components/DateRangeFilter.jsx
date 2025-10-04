/**
 * Componente de Filtro de Rango de Fechas
 * Permite seleccionar un rango de fechas personalizado para filtrar ventas
 */

import React, { useState } from 'react';
import { Calendar, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

const DateRangeFilter = ({ onApply, onCancel, initialRange = null }) => {
  const [startDate, setStartDate] = useState(
    initialRange?.start_date || new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    initialRange?.end_date || new Date().toISOString().split('T')[0]
  );
  const [error, setError] = useState(null);

  const handleApply = () => {
    // Validaciones
    if (!startDate || !endDate) {
      setError('Debes seleccionar ambas fechas');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      setError('La fecha inicial no puede ser posterior a la fecha final');
      return;
    }

    // Validar que el rango no sea mayor a 1 año
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    if (end - start > oneYearInMs) {
      setError('El rango no puede ser mayor a 1 año');
      return;
    }

    setError(null);

    onApply({
      start_date: startDate,
      end_date: endDate
    });
  };

  const setQuickRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    setError(null);
  };

  return (
    <Card className="mb-4 bg-blue-50 border-blue-200">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Título */}
          <div className="flex items-center gap-2 font-medium text-sm">
            <Calendar className="w-4 h-4 text-blue-600" />
            Filtrar por Rango de Fechas
          </div>

          {/* Botones rápidos */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickRange(7)}
              className="text-xs"
            >
              Últimos 7 días
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickRange(15)}
              className="text-xs"
            >
              Últimos 15 días
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickRange(30)}
              className="text-xs"
            >
              Último mes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickRange(90)}
              className="text-xs"
            >
              Últimos 3 meses
            </Button>
          </div>

          {/* Selector de fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date" className="text-sm font-medium">
                Fecha Inicial
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setError(null);
                }}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="end-date" className="text-sm font-medium">
                Fecha Final
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setError(null);
                }}
                className="mt-1"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}

          {/* Información */}
          <div className="text-xs text-gray-600 bg-white rounded px-3 py-2 border">
            💡 Las fechas se procesan automáticamente:
            <ul className="list-disc list-inside mt-1 ml-2">
              <li>Fecha inicial: se le agrega 00:00:00</li>
              <li>Fecha final: se le agrega 23:59:59</li>
            </ul>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button size="sm" onClick={handleApply}>
              <Check className="w-4 h-4 mr-2" />
              Aplicar Filtro
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DateRangeFilter;
