import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Globe,
  RefreshCw,
  Calendar,
  BarChart3,
  Settings
} from 'lucide-react';
import CurrencyConverter from '../components/payment/CurrencyConverter.jsx';
import ExchangeRateDisplay from '../components/payment/ExchangeRateDisplay.jsx';
import CurrencySelector from '../components/payment/CurrencySelector.jsx';
import PaymentMethodSelector from '../components/payment/PaymentMethodSelector.jsx';
import PaymentApiStatus from '../components/payment/PaymentApiStatus.jsx';
import PaymentApiDiagnostic from '../components/payment/PaymentApiDiagnostic.jsx';
import { CurrencyService } from '../services/currencyService.js';
import { PaymentMethodService } from '../services/paymentMethodService.js';
import { ExchangeRateService } from '../services/exchangeRateService.js';

/**
 * Payment Management Page
 * Main dashboard for currency and payment method management
 */
const PaymentManagement = () => {
  const [currencies, setCurrencies] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [baseCurrency, setBaseCurrency] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'converter', 'rates'
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setApiError(null);

      // Load all data in parallel
      const [currenciesData, paymentMethodsData, baseCurrencyData] = await Promise.all([
        CurrencyService.getAll(),
        PaymentMethodService.getAll(),
        CurrencyService.getBaseCurrency()
      ]);

      setCurrencies(currenciesData);
      setPaymentMethods(paymentMethodsData);
      setBaseCurrency(baseCurrencyData);

      // Set default selected currency (first non-base currency)
      const nonBaseCurrencies = currenciesData.filter(c => c.currency_code !== 'PYG');
      if (nonBaseCurrencies.length > 0) {
        setSelectedCurrency(nonBaseCurrencies[0]);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading payment data:', error);
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadInitialData();
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

  const getDashboardStats = () => {
    return {
      totalCurrencies: currencies.length,
      totalPaymentMethods: paymentMethods.length,
      activeCurrencies: currencies.filter(c => c.currency_code !== 'PYG').length,
      cashMethods: paymentMethods.filter(m =>
        m.method_code.toLowerCase().includes('cash') ||
        m.method_code.toLowerCase().includes('efectivo')
      ).length
    };
  };

  const stats = getDashboardStats();

  const TabButton = ({ id, label, icon: Icon, isActive }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
        isActive
          ? 'bg-blue-100 text-blue-700 border border-blue-200'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      <Icon className="w-4 h-4 mr-2" />
      {label}
    </button>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-lg text-gray-600">Cargando sistema de pagos...</span>
        </div>
      </div>
    );
  }

  // Show API status if there's an error
  if (apiError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <DollarSign className="w-8 h-8 mr-3 text-blue-500" />
                Gestión de Pagos
              </h1>
              <p className="text-gray-600 mt-2">
                Administración de monedas, métodos de pago y tipos de cambio
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Reintentar
            </button>
          </div>
        </div>

        {/* API Status */}
        <div className="space-y-6">
          <PaymentApiStatus
            title="Sistema de Pagos No Disponible"
            message={apiError}
            type="warning"
            className="max-w-4xl mx-auto"
          />

          {/* Diagnostic Tool */}
          <PaymentApiDiagnostic />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <DollarSign className="w-8 h-8 mr-3 text-blue-500" />
              Gestión de Pagos
            </h1>
            <p className="text-gray-600 mt-2">
              Administración de monedas, métodos de pago y tipos de cambio
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Última actualización: {formatDateTime(lastUpdate)}
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mt-6">
          <TabButton
            id="dashboard"
            label="Dashboard"
            icon={BarChart3}
            isActive={activeTab === 'dashboard'}
          />
          <TabButton
            id="converter"
            label="Convertidor"
            icon={Globe}
            isActive={activeTab === 'converter'}
          />
          <TabButton
            id="rates"
            label="Tipos de Cambio"
            icon={TrendingUp}
            isActive={activeTab === 'rates'}
          />
        </div>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Monedas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCurrencies}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Monedas Activas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeCurrencies}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Métodos de Pago</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPaymentMethods}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Métodos Efectivo</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.cashMethods}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick access tools */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Currency selector */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Selector de Monedas
              </h3>
              <div className="space-y-4">
                <CurrencySelector
                  value={selectedCurrency?.id}
                  onChange={setSelectedCurrency}
                  placeholder="Seleccionar moneda para ver detalles..."
                  showSearch={true}
                />
                {selectedCurrency && (
                  <ExchangeRateDisplay
                    currencyId={selectedCurrency.id}
                    showDate={true}
                    showSource={true}
                    showTrend={false}
                    showRefresh={true}
                    size="lg"
                  />
                )}
              </div>
            </div>

            {/* Payment method selector */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Métodos de Pago
              </h3>
              <div className="space-y-4">
                <PaymentMethodSelector
                  value={null}
                  onChange={(method) => console.log('Selected method:', method)}
                  placeholder="Explorar métodos de pago..."
                  showSearch={true}
                />
                <div className="text-sm text-gray-600">
                  <p>Métodos disponibles por tipo:</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div>• Efectivo: {stats.cashMethods}</div>
                    <div>• Tarjeta: {paymentMethods.filter(m => m.method_code.toLowerCase().includes('card')).length}</div>
                    <div>• Banco: {paymentMethods.filter(m => m.method_code.toLowerCase().includes('bank')).length}</div>
                    <div>• Digital: {paymentMethods.filter(m => m.method_code.toLowerCase().includes('digital')).length}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Base currency info */}
          {baseCurrency && (
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Moneda Base del Sistema
              </h3>
              <div className="flex items-center">
                <span className="inline-block px-3 py-1 text-sm font-mono font-bold text-white bg-blue-500 rounded mr-3">
                  {baseCurrency.currency_code}
                </span>
                <span className="text-blue-800">{baseCurrency.name}</span>
              </div>
              <p className="text-sm text-blue-700 mt-2">
                Todas las conversiones se realizan usando {baseCurrency.currency_code} como moneda base.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Converter Tab */}
      {activeTab === 'converter' && (
        <div className="max-w-4xl mx-auto">
          <CurrencyConverter
            onConversionResult={(result) => {
              console.log('Conversion result:', result);
            }}
          />
        </div>
      )}

      {/* Exchange Rates Tab */}
      {activeTab === 'rates' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Tipos de Cambio Actuales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currencies
                .filter(currency => currency.currency_code !== 'PYG')
                .map(currency => (
                  <ExchangeRateDisplay
                    key={currency.id}
                    currencyId={currency.id}
                    showDate={true}
                    showTrend={false}
                    showRefresh={true}
                    size="md"
                  />
                ))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;