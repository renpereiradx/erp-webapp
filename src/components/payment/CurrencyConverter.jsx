import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Calculator, RefreshCw, AlertCircle, TrendingUp } from 'lucide-react';
import CurrencySelector from './CurrencySelector.jsx';
import ExchangeRateDisplay from './ExchangeRateDisplay.jsx';
import { ExchangeRateService } from '../../services/exchangeRateService.js';

/**
 * Currency Converter Component
 * Allows users to convert amounts between different currencies
 */
const CurrencyConverter = ({
  initialFromCurrency = null,
  initialToCurrency = null,
  initialAmount = 0,
  onConversionResult = null,
  className = ""
}) => {
  const [amount, setAmount] = useState(initialAmount);
  const [fromCurrency, setFromCurrency] = useState(initialFromCurrency);
  const [toCurrency, setToCurrency] = useState(initialToCurrency);
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [conversionDetails, setConversionDetails] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState(null);
  const [lastConversion, setLastConversion] = useState(null);

  // Auto-convert when values change
  useEffect(() => {
    if (amount > 0 && fromCurrency && toCurrency) {
      handleConvert();
    } else {
      setConvertedAmount(null);
      setConversionDetails(null);
      setError(null);
    }
  }, [amount, fromCurrency, toCurrency]);

  const handleConvert = async () => {
    if (!fromCurrency || !toCurrency || amount <= 0) {
      setError('Complete todos los campos para realizar la conversión');
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      const result = await ExchangeRateService.convertCurrencyDetailed(
        amount,
        fromCurrency.id,
        toCurrency.id
      );

      setConvertedAmount(result.convertedAmount);
      setConversionDetails(result);
      setLastConversion(new Date());

      // Notify parent component if callback provided
      if (onConversionResult) {
        onConversionResult({
          ...result,
          fromCurrency,
          toCurrency
        });
      }

    } catch (err) {
      console.error('Error converting currency:', err);
      setError('Error al convertir moneda. Verifique que existan tipos de cambio para ambas monedas.');
      setConvertedAmount(null);
      setConversionDetails(null);
    } finally {
      setIsConverting(false);
    }
  };

  const handleSwapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const handleRefresh = () => {
    if (!isConverting) {
      handleConvert();
    }
  };

  const formatAmount = (value) => {
    if (!value) return '0.00';
    return new Intl.NumberFormat('es-PY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatDateTime = (date) => {
    return date.toLocaleString('es-PY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateRate = () => {
    if (!conversionDetails || amount <= 0) return null;
    return (conversionDetails.convertedAmount / amount).toFixed(6);
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Calculator className="w-5 h-5 mr-2 text-blue-500" />
          Convertidor de Monedas
        </h3>
        {lastConversion && (
          <div className="text-xs text-gray-500">
            Última actualización: {formatDateTime(lastConversion)}
          </div>
        )}
      </div>

      {/* Converter form */}
      <div className="space-y-4">
        {/* Amount input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monto a convertir
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            min="0"
            step="0.01"
            placeholder="Ingrese el monto"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Currency selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* From currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              De (moneda origen)
            </label>
            <CurrencySelector
              value={fromCurrency?.id}
              onChange={setFromCurrency}
              placeholder="Seleccionar moneda..."
              showSearch={true}
            />
          </div>

          {/* To currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              A (moneda destino)
            </label>
            <CurrencySelector
              value={toCurrency?.id}
              onChange={setToCurrency}
              placeholder="Seleccionar moneda..."
              showSearch={true}
            />
          </div>
        </div>

        {/* Swap button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwapCurrencies}
            disabled={!fromCurrency || !toCurrency}
            className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors disabled:text-gray-400 disabled:hover:bg-transparent"
            title="Intercambiar monedas"
          >
            <ArrowRightLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isConverting && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-center text-blue-600">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            <span>Convirtiendo...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center text-red-600">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Conversion result */}
      {convertedAmount !== null && !isConverting && !error && fromCurrency && toCurrency && (
        <div className="mt-6 space-y-4">
          {/* Main result */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-800 mb-2">
                Resultado de Conversión
              </div>
              <div className="text-2xl font-bold text-green-900">
                {formatAmount(amount)} {fromCurrency.currency_code} = {formatAmount(convertedAmount)} {toCurrency.currency_code}
              </div>
              {calculateRate() && (
                <div className="text-sm text-green-700 mt-2">
                  Tasa: 1 {fromCurrency.currency_code} = {calculateRate()} {toCurrency.currency_code}
                </div>
              )}
            </div>
          </div>

          {/* Exchange rate displays */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Tipo de cambio origen</h4>
              <ExchangeRateDisplay
                currencyId={fromCurrency.id}
                showDate={true}
                showTrend={true}
                size="sm"
              />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Tipo de cambio destino</h4>
              <ExchangeRateDisplay
                currencyId={toCurrency.id}
                showDate={true}
                showTrend={true}
                size="sm"
              />
            </div>
          </div>

          {/* Refresh button */}
          <div className="flex justify-center">
            <button
              onClick={handleRefresh}
              disabled={isConverting}
              className="flex items-center px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isConverting ? 'animate-spin' : ''}`} />
              Actualizar conversión
            </button>
          </div>
        </div>
      )}

      {/* Help text */}
      {!fromCurrency || !toCurrency || amount <= 0 ? (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600 text-center">
            Complete todos los campos para realizar una conversión de moneda
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CurrencyConverter;