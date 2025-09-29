import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, RefreshCw, Calendar } from 'lucide-react';
import { ExchangeRateService } from '../../services/exchangeRateService.js';
import { CurrencyService } from '../../services/currencyService.js';

/**
 * Exchange Rate Display Component
 * Shows current exchange rate for a currency with optional trend indicators
 */
const ExchangeRateDisplay = ({
  currencyId,
  date = null,
  showDate = true,
  showSource = false,
  showTrend = false,
  showRefresh = false,
  size = 'md', // 'sm', 'md', 'lg'
  className = ""
}) => {
  const [exchangeRate, setExchangeRate] = useState(null);
  const [currency, setCurrency] = useState(null);
  const [previousRate, setPreviousRate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validation, setValidation] = useState(null);

  // Load exchange rate and currency data
  useEffect(() => {
    if (currencyId) {
      loadExchangeRate();
      loadCurrency();
    }
  }, [currencyId, date]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadExchangeRate = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current rate
      const rate = await ExchangeRateService.getByDate({
        currency_id: currencyId,
        date: date
      });

      setExchangeRate(rate);

      // Validate rate
      const validationResult = await ExchangeRateService.validateExchangeRate(currencyId, date);
      setValidation(validationResult);

      // Get previous rate for trend calculation if needed
      if (showTrend && rate) {
        try {
          const currentDate = new Date(rate.date);
          const previousDate = new Date(currentDate);
          previousDate.setDate(previousDate.getDate() - 1);

          const prevRate = await ExchangeRateService.getByDate({
            currency_id: currencyId,
            date: previousDate.toISOString().split('T')[0]
          });

          setPreviousRate(prevRate);
        } catch (err) {
          // Previous rate not available, that's okay - fail silently
          console.warn(`Previous exchange rate not available for ${currencyId} on previous date, hiding trend`);
          setPreviousRate(null);
        }
      }

    } catch (err) {
      console.error('Error loading exchange rate:', err);
      setError('Sin tipo de cambio disponible');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrency = async () => {
    try {
      const curr = await CurrencyService.getById(currencyId);
      setCurrency(curr);
    } catch (err) {
      console.error('Error loading currency:', err);
    }
  };

  const handleRefresh = () => {
    if (!isLoading) {
      loadExchangeRate();
    }
  };

  // Calculate trend
  const getTrendInfo = () => {
    if (!exchangeRate || !previousRate || !showTrend) {
      return { trend: 'neutral', change: 0, icon: Minus };
    }

    const change = ExchangeRateService.calculateRateChange(
      previousRate.rate_to_base,
      exchangeRate.rate_to_base
    );

    if (change > 0) {
      return { trend: 'up', change, icon: TrendingUp };
    } else if (change < 0) {
      return { trend: 'down', change: Math.abs(change), icon: TrendingDown };
    } else {
      return { trend: 'neutral', change: 0, icon: Minus };
    }
  };

  const formatRate = (rate) => {
    if (!rate) return '0.00';
    return ExchangeRateService.formatExchangeRate(rate);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-PY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Size variants
  const sizeClasses = {
    sm: {
      container: 'p-2 text-xs',
      rate: 'text-sm font-mono',
      code: 'text-xs px-1 py-0.5',
      icon: 'w-3 h-3'
    },
    md: {
      container: 'p-3 text-sm',
      rate: 'text-lg font-mono',
      code: 'text-xs px-2 py-1',
      icon: 'w-4 h-4'
    },
    lg: {
      container: 'p-4 text-base',
      rate: 'text-2xl font-mono',
      code: 'text-sm px-3 py-1',
      icon: 'w-5 h-5'
    }
  };

  const sizes = sizeClasses[size] || sizeClasses.md;

  if (isLoading) {
    return (
      <div className={`border border-gray-200 rounded-lg bg-gray-50 ${sizes.container} ${className}`}>
        <div className="flex items-center justify-center">
          <RefreshCw className={`${sizes.icon} animate-spin mr-2`} />
          <span className="text-gray-600">Cargando...</span>
        </div>
      </div>
    );
  }

  if (error || !exchangeRate || !currency) {
    return (
      <div className={`border border-red-200 rounded-lg bg-red-50 ${sizes.container} ${className}`}>
        <div className="flex items-center">
          <AlertTriangle className={`${sizes.icon} text-red-500 mr-2`} />
          <span className="text-red-600">{error || 'Error al cargar tipo de cambio'}</span>
        </div>
      </div>
    );
  }

  const trendInfo = getTrendInfo();
  const TrendIcon = trendInfo.icon;

  return (
    <div className={`border border-gray-200 rounded-lg bg-white ${sizes.container} ${className}`}>
      {/* Header with currency and refresh */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <span className={`inline-block ${sizes.code} font-mono font-bold text-white bg-blue-500 rounded mr-2`}>
            {currency.currency_code}
          </span>
          {showRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
              title="Actualizar tipo de cambio"
            >
              <RefreshCw className={`${sizes.icon} ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {/* Trend indicator */}
        {showTrend && trendInfo.trend !== 'neutral' && (
          <div className={`flex items-center ${sizes.code}`}>
            <TrendIcon className={`${sizes.icon} mr-1 ${
              trendInfo.trend === 'up' ? 'text-green-500' : 'text-red-500'
            }`} />
            <span className={trendInfo.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
              {trendInfo.change.toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      {/* Exchange rate value */}
      <div className="flex items-baseline">
        <span className={`${sizes.rate} font-bold text-blue-600 mr-2`}>
          {formatRate(exchangeRate.rate_to_base)}
        </span>
        <span className="text-gray-500 text-xs">PYG</span>
      </div>

      {/* Additional information */}
      <div className="mt-2 space-y-1">
        {showDate && exchangeRate.date && (
          <div className="flex items-center text-xs text-gray-600">
            <Calendar className="w-3 h-3 mr-1" />
            <span>{formatDate(exchangeRate.date)}</span>
          </div>
        )}

        {showSource && exchangeRate.source && (
          <div className="text-xs text-gray-500">
            Fuente: {exchangeRate.source}
          </div>
        )}

        {/* Validation warning */}
        {validation && validation.warning && (
          <div className="flex items-center text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
            <AlertTriangle className="w-3 h-3 mr-1" />
            <span>{validation.warning}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExchangeRateDisplay;