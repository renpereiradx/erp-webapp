# Guía de Integración - APIs de Pagos

## Descripción

Esta guía proporciona información completa para integrar las **APIs de Pagos** del sistema de gestión empresarial. Incluye tres módulos principales: Monedas, Métodos de Pago y Tipos de Cambio.

## 🛠 Tecnologías y Herramientas

- **Backend**: Go REST API
- **Base de datos**: PostgreSQL (schema `payments`)
- **Frontend**: React + TypeScript
- **HTTP Client**: Axios/Fetch API
- **Estado**: React Query/SWR (recomendado)

## 📋 Endpoints Disponibles

### Base URL
```
http://localhost:8080
```

### 1. 💰 Currencies API

#### Obtener todas las monedas
```http
GET /currencies
```

#### Obtener moneda por ID
```http
GET /currencies/{id}
```

#### Obtener moneda por código
```http
GET /currencies/code/{code}
```

### 2. 💳 Payment Methods API

#### Obtener todos los métodos de pago
```http
GET /payment-methods
```

#### Obtener método de pago por ID
```http
GET /payment-methods/{id}
```

#### Obtener método de pago por código
```http
GET /payment-methods/code/{code}
```

### 3. 📈 Exchange Rates API

#### Obtener tipo de cambio por fecha
```http
GET /exchange-rate/currency/{currency_id}?date=2025-08-09
```

#### Obtener tipos de cambio por rango
```http
GET /exchange-rate/currency/{currency_id}/range?start_date=2025-08-01&end_date=2025-08-31
```

## 🏗 Modelos TypeScript

### Currency Types

```typescript
// types/currency.ts
export interface Currency {
  id: number;
  currency_code: string;
  name: string;
}

export interface CurrencyResponse {
  data: Currency[];
  success: boolean;
  message?: string;
}

export interface SingleCurrencyResponse {
  data: Currency;
  success: boolean;
  message?: string;
}
```

### Payment Method Types

```typescript
// types/paymentMethod.ts
export interface PaymentMethod {
  id: number;
  method_code: string;
  description: string;
}

export interface PaymentMethodResponse {
  data: PaymentMethod[];
  success: boolean;
  message?: string;
}

export interface SinglePaymentMethodResponse {
  data: PaymentMethod;
  success: boolean;
  message?: string;
}
```

### Exchange Rate Types

```typescript
// types/exchangeRate.ts
export interface ExchangeRate {
  id: number;
  currency_id: number;
  rate_to_base: number;
  date: string; // ISO date string
  source?: string;
  created_at: string; // ISO datetime string
}

export interface ExchangeRateResponse {
  data: ExchangeRate;
  success: boolean;
  message?: string;
}

export interface ExchangeRateRangeResponse {
  data: ExchangeRate[];
  success: boolean;
  message?: string;
}

// Tipos auxiliares para formularios
export interface ExchangeRateQuery {
  currency_id: number;
  date?: string; // YYYY-MM-DD format
}

export interface ExchangeRateRangeQuery {
  currency_id: number;
  start_date: string; // YYYY-MM-DD format
  end_date: string;   // YYYY-MM-DD format
}
```

## 🔗 Servicios API

### Currency Service

```typescript
// services/currencyService.ts
import axios from 'axios';
import { Currency, CurrencyResponse, SingleCurrencyResponse } from '../types/currency';

const API_BASE_URL = 'http://localhost:8080';

export class CurrencyService {
  
  /**
   * Obtiene todas las monedas disponibles
   */
  static async getAll(): Promise<Currency[]> {
    try {
      const response = await axios.get<Currency[]>(`${API_BASE_URL}/currencies`);
      return response.data;
    } catch (error) {
      console.error('Error fetching currencies:', error);
      throw new Error('Error al obtener las monedas');
    }
  }

  /**
   * Obtiene una moneda por ID
   */
  static async getById(id: number): Promise<Currency> {
    try {
      const response = await axios.get<Currency>(`${API_BASE_URL}/currencies/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching currency ${id}:`, error);
      throw new Error('Error al obtener la moneda');
    }
  }

  /**
   * Obtiene una moneda por código
   */
  static async getByCode(code: string): Promise<Currency> {
    try {
      const response = await axios.get<Currency>(`${API_BASE_URL}/currencies/code/${code}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching currency ${code}:`, error);
      throw new Error('Error al obtener la moneda');
    }
  }
}
```

### Payment Method Service

```typescript
// services/paymentMethodService.ts
import axios from 'axios';
import { PaymentMethod, PaymentMethodResponse, SinglePaymentMethodResponse } from '../types/paymentMethod';

const API_BASE_URL = 'http://localhost:8080';

export class PaymentMethodService {
  
  /**
   * Obtiene todos los métodos de pago disponibles
   */
  static async getAll(): Promise<PaymentMethod[]> {
    try {
      const response = await axios.get<PaymentMethod[]>(`${API_BASE_URL}/payment-methods`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw new Error('Error al obtener los métodos de pago');
    }
  }

  /**
   * Obtiene un método de pago por ID
   */
  static async getById(id: number): Promise<PaymentMethod> {
    try {
      const response = await axios.get<PaymentMethod>(`${API_BASE_URL}/payment-methods/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching payment method ${id}:`, error);
      throw new Error('Error al obtener el método de pago');
    }
  }

  /**
   * Obtiene un método de pago por código
   */
  static async getByCode(code: string): Promise<PaymentMethod> {
    try {
      const response = await axios.get<PaymentMethod>(`${API_BASE_URL}/payment-methods/code/${code}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching payment method ${code}:`, error);
      throw new Error('Error al obtener el método de pago');
    }
  }
}
```

### Exchange Rate Service

```typescript
// services/exchangeRateService.ts
import axios from 'axios';
import { ExchangeRate, ExchangeRateQuery, ExchangeRateRangeQuery } from '../types/exchangeRate';

const API_BASE_URL = 'http://localhost:8080';

export class ExchangeRateService {
  
  /**
   * Obtiene el tipo de cambio de una moneda en una fecha específica
   */
  static async getByDate(query: ExchangeRateQuery): Promise<ExchangeRate> {
    try {
      const params = new URLSearchParams();
      if (query.date) {
        params.append('date', query.date);
      }
      
      const url = `${API_BASE_URL}/exchange-rate/currency/${query.currency_id}`;
      const fullUrl = params.toString() ? `${url}?${params.toString()}` : url;
      
      const response = await axios.get<ExchangeRate>(fullUrl);
      return response.data;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      throw new Error('Error al obtener el tipo de cambio');
    }
  }

  /**
   * Obtiene tipos de cambio de una moneda en un rango de fechas
   */
  static async getByRange(query: ExchangeRateRangeQuery): Promise<ExchangeRate[]> {
    try {
      const params = new URLSearchParams({
        start_date: query.start_date,
        end_date: query.end_date
      });
      
      const response = await axios.get<ExchangeRate[]>(
        `${API_BASE_URL}/exchange-rate/currency/${query.currency_id}/range?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching exchange rate range:', error);
      throw new Error('Error al obtener los tipos de cambio');
    }
  }

  /**
   * Obtiene el tipo de cambio más reciente de una moneda
   */
  static async getLatest(currencyId: number): Promise<ExchangeRate> {
    return this.getByDate({ currency_id: currencyId });
  }

  /**
   * Convierte un monto de una moneda a otra
   */
  static async convertCurrency(
    amount: number,
    fromCurrencyId: number,
    toCurrencyId: number,
    date?: string
  ): Promise<number> {
    try {
      // Si es la misma moneda, no hay conversión
      if (fromCurrencyId === toCurrencyId) {
        return amount;
      }

      // Obtener tipos de cambio para ambas monedas
      const fromRate = await this.getByDate({ currency_id: fromCurrencyId, date });
      const toRate = await this.getByDate({ currency_id: toCurrencyId, date });

      // Convertir a moneda base y luego a moneda objetivo
      const amountInBase = amount * fromRate.rate_to_base;
      const convertedAmount = amountInBase / toRate.rate_to_base;

      return parseFloat(convertedAmount.toFixed(2));
    } catch (error) {
      console.error('Error converting currency:', error);
      throw new Error('Error al convertir moneda');
    }
  }
}
```

## 🎣 Custom Hooks con React Query

### Currency Hooks

```typescript
// hooks/useCurrencies.ts
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { Currency } from '../types/currency';
import { CurrencyService } from '../services/currencyService';

export const useCurrencies = (): UseQueryResult<Currency[], Error> => {
  return useQuery({
    queryKey: ['currencies'],
    queryFn: CurrencyService.getAll,
    staleTime: 1000 * 60 * 60, // 1 hora (las monedas cambian raramente)
    cacheTime: 1000 * 60 * 60 * 24, // 24 horas
  });
};

export const useCurrency = (id: number): UseQueryResult<Currency, Error> => {
  return useQuery({
    queryKey: ['currency', id],
    queryFn: () => CurrencyService.getById(id),
    enabled: id > 0,
    staleTime: 1000 * 60 * 60, // 1 hora
  });
};

export const useCurrencyByCode = (code: string): UseQueryResult<Currency, Error> => {
  return useQuery({
    queryKey: ['currency', 'code', code],
    queryFn: () => CurrencyService.getByCode(code),
    enabled: code.length > 0,
    staleTime: 1000 * 60 * 60, // 1 hora
  });
};
```

### Payment Method Hooks

```typescript
// hooks/usePaymentMethods.ts
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { PaymentMethod } from '../types/paymentMethod';
import { PaymentMethodService } from '../services/paymentMethodService';

export const usePaymentMethods = (): UseQueryResult<PaymentMethod[], Error> => {
  return useQuery({
    queryKey: ['paymentMethods'],
    queryFn: PaymentMethodService.getAll,
    staleTime: 1000 * 60 * 60, // 1 hora
    cacheTime: 1000 * 60 * 60 * 24, // 24 horas
  });
};

export const usePaymentMethod = (id: number): UseQueryResult<PaymentMethod, Error> => {
  return useQuery({
    queryKey: ['paymentMethod', id],
    queryFn: () => PaymentMethodService.getById(id),
    enabled: id > 0,
    staleTime: 1000 * 60 * 60, // 1 hora
  });
};

export const usePaymentMethodByCode = (code: string): UseQueryResult<PaymentMethod, Error> => {
  return useQuery({
    queryKey: ['paymentMethod', 'code', code],
    queryFn: () => PaymentMethodService.getByCode(code),
    enabled: code.length > 0,
    staleTime: 1000 * 60 * 60, // 1 hora
  });
};
```

### Exchange Rate Hooks

```typescript
// hooks/useExchangeRates.ts
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { ExchangeRate, ExchangeRateQuery, ExchangeRateRangeQuery } from '../types/exchangeRate';
import { ExchangeRateService } from '../services/exchangeRateService';

export const useExchangeRate = (query: ExchangeRateQuery): UseQueryResult<ExchangeRate, Error> => {
  return useQuery({
    queryKey: ['exchangeRate', query.currency_id, query.date],
    queryFn: () => ExchangeRateService.getByDate(query),
    enabled: query.currency_id > 0,
    staleTime: 1000 * 60 * 30, // 30 minutos (tipos de cambio cambian frecuentemente)
    cacheTime: 1000 * 60 * 60 * 2, // 2 horas
  });
};

export const useExchangeRateRange = (query: ExchangeRateRangeQuery): UseQueryResult<ExchangeRate[], Error> => {
  return useQuery({
    queryKey: ['exchangeRateRange', query.currency_id, query.start_date, query.end_date],
    queryFn: () => ExchangeRateService.getByRange(query),
    enabled: query.currency_id > 0 && query.start_date.length > 0 && query.end_date.length > 0,
    staleTime: 1000 * 60 * 60, // 1 hora
    cacheTime: 1000 * 60 * 60 * 4, // 4 horas
  });
};

export const useLatestExchangeRate = (currencyId: number): UseQueryResult<ExchangeRate, Error> => {
  return useQuery({
    queryKey: ['exchangeRate', 'latest', currencyId],
    queryFn: () => ExchangeRateService.getLatest(currencyId),
    enabled: currencyId > 0,
    staleTime: 1000 * 60 * 15, // 15 minutos
    cacheTime: 1000 * 60 * 30, // 30 minutos
  });
};

// Hook personalizado para conversión de monedas
export const useCurrencyConverter = () => {
  const convertCurrency = async (
    amount: number,
    fromCurrencyId: number,
    toCurrencyId: number,
    date?: string
  ): Promise<number> => {
    return ExchangeRateService.convertCurrency(amount, fromCurrencyId, toCurrencyId, date);
  };

  return { convertCurrency };
};
```

## 🧩 Componentes React

### Currency Selector

```tsx
// components/CurrencySelector.tsx
import React from 'react';
import { useCurrencies } from '../hooks/useCurrencies';
import { Currency } from '../types/currency';

interface CurrencySelectorProps {
  value?: number;
  onChange: (currency: Currency | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  value,
  onChange,
  placeholder = "Seleccionar moneda...",
  disabled = false
}) => {
  const { data: currencies, isLoading, error } = useCurrencies();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(event.target.value);
    const selectedCurrency = currencies?.find(c => c.id === selectedId) || null;
    onChange(selectedCurrency);
  };

  if (isLoading) {
    return <select disabled><option>Cargando monedas...</option></select>;
  }

  if (error) {
    return <select disabled><option>Error al cargar monedas</option></select>;
  }

  return (
    <select 
      value={value || ''} 
      onChange={handleChange}
      disabled={disabled}
      className="currency-selector"
    >
      <option value="">{placeholder}</option>
      {currencies?.map((currency) => (
        <option key={currency.id} value={currency.id}>
          {currency.currency_code} - {currency.name}
        </option>
      ))}
    </select>
  );
};
```

### Payment Method Selector

```tsx
// components/PaymentMethodSelector.tsx
import React from 'react';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { PaymentMethod } from '../types/paymentMethod';

interface PaymentMethodSelectorProps {
  value?: number;
  onChange: (paymentMethod: PaymentMethod | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  value,
  onChange,
  placeholder = "Seleccionar método de pago...",
  disabled = false
}) => {
  const { data: paymentMethods, isLoading, error } = usePaymentMethods();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(event.target.value);
    const selectedMethod = paymentMethods?.find(pm => pm.id === selectedId) || null;
    onChange(selectedMethod);
  };

  if (isLoading) {
    return <select disabled><option>Cargando métodos de pago...</option></select>;
  }

  if (error) {
    return <select disabled><option>Error al cargar métodos de pago</option></select>;
  }

  return (
    <select 
      value={value || ''} 
      onChange={handleChange}
      disabled={disabled}
      className="payment-method-selector"
    >
      <option value="">{placeholder}</option>
      {paymentMethods?.map((method) => (
        <option key={method.id} value={method.id}>
          {method.description}
        </option>
      ))}
    </select>
  );
};
```

### Exchange Rate Display

```tsx
// components/ExchangeRateDisplay.tsx
import React from 'react';
import { useLatestExchangeRate } from '../hooks/useExchangeRates';
import { useCurrency } from '../hooks/useCurrencies';

interface ExchangeRateDisplayProps {
  currencyId: number;
  showDate?: boolean;
  showSource?: boolean;
}

export const ExchangeRateDisplay: React.FC<ExchangeRateDisplayProps> = ({
  currencyId,
  showDate = true,
  showSource = false
}) => {
  const { data: exchangeRate, isLoading: rateLoading, error: rateError } = useLatestExchangeRate(currencyId);
  const { data: currency, isLoading: currencyLoading } = useCurrency(currencyId);

  if (rateLoading || currencyLoading) {
    return <div className="exchange-rate-display loading">Cargando...</div>;
  }

  if (rateError || !exchangeRate || !currency) {
    return <div className="exchange-rate-display error">Sin tipo de cambio disponible</div>;
  }

  const formatRate = (rate: number) => {
    return new Intl.NumberFormat('es-PY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(rate);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PY');
  };

  return (
    <div className="exchange-rate-display">
      <div className="rate-info">
        <span className="currency-code">{currency.currency_code}</span>
        <span className="rate-value">{formatRate(exchangeRate.rate_to_base)}</span>
        <span className="base-currency">PYG</span>
      </div>
      {showDate && exchangeRate.date && (
        <div className="rate-date">
          Fecha: {formatDate(exchangeRate.date)}
        </div>
      )}
      {showSource && exchangeRate.source && (
        <div className="rate-source">
          Fuente: {exchangeRate.source}
        </div>
      )}
    </div>
  );
};
```

### Currency Converter Component

```tsx
// components/CurrencyConverter.tsx
import React, { useState, useEffect } from 'react';
import { CurrencySelector } from './CurrencySelector';
import { useCurrencyConverter } from '../hooks/useExchangeRates';
import { Currency } from '../types/currency';

export const CurrencyConverter: React.FC = () => {
  const [amount, setAmount] = useState<number>(0);
  const [fromCurrency, setFromCurrency] = useState<Currency | null>(null);
  const [toCurrency, setToCurrency] = useState<Currency | null>(null);
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { convertCurrency } = useCurrencyConverter();

  const handleConvert = async () => {
    if (!fromCurrency || !toCurrency || amount <= 0) {
      setError('Complete todos los campos');
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      const result = await convertCurrency(amount, fromCurrency.id, toCurrency.id);
      setConvertedAmount(result);
    } catch (err) {
      setError('Error al convertir moneda');
      setConvertedAmount(null);
    } finally {
      setIsConverting(false);
    }
  };

  // Auto-convert cuando cambian los valores
  useEffect(() => {
    if (amount > 0 && fromCurrency && toCurrency) {
      handleConvert();
    }
  }, [amount, fromCurrency, toCurrency]);

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat('es-PY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="currency-converter">
      <h3>Convertidor de Monedas</h3>
      
      <div className="converter-form">
        <div className="input-group">
          <label>Monto:</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            min="0"
            step="0.01"
            placeholder="Ingrese monto"
          />
        </div>

        <div className="input-group">
          <label>De:</label>
          <CurrencySelector
            value={fromCurrency?.id}
            onChange={setFromCurrency}
            placeholder="Moneda origen"
          />
        </div>

        <div className="input-group">
          <label>A:</label>
          <CurrencySelector
            value={toCurrency?.id}
            onChange={setToCurrency}
            placeholder="Moneda destino"
          />
        </div>
      </div>

      {isConverting && (
        <div className="converting">Convirtiendo...</div>
      )}

      {error && (
        <div className="error">{error}</div>
      )}

      {convertedAmount !== null && !isConverting && !error && (
        <div className="conversion-result">
          <strong>
            {formatAmount(amount)} {fromCurrency?.currency_code} = {formatAmount(convertedAmount)} {toCurrency?.currency_code}
          </strong>
        </div>
      )}
    </div>
  );
};
```

## 📝 Formularios de Ejemplo

### Payment Form Integration

```tsx
// components/PaymentForm.tsx
import React, { useState } from 'react';
import { CurrencySelector } from './CurrencySelector';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { ExchangeRateDisplay } from './ExchangeRateDisplay';
import { Currency } from '../types/currency';
import { PaymentMethod } from '../types/paymentMethod';

interface PaymentFormData {
  amount: number;
  currency: Currency | null;
  paymentMethod: PaymentMethod | null;
}

interface PaymentFormProps {
  onSubmit: (data: PaymentFormData) => void;
  isLoading?: boolean;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: 0,
    currency: null,
    paymentMethod: null
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isFormValid = formData.amount > 0 && formData.currency && formData.paymentMethod;

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <h3>Información de Pago</h3>

      <div className="form-group">
        <label>Monto *</label>
        <input
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            amount: parseFloat(e.target.value) || 0 
          }))}
          min="0"
          step="0.01"
          required
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label>Moneda *</label>
        <CurrencySelector
          value={formData.currency?.id}
          onChange={(currency) => setFormData(prev => ({ ...prev, currency }))}
          disabled={isLoading}
        />
        {formData.currency && formData.currency.currency_code !== 'PYG' && (
          <div className="exchange-rate-info">
            <ExchangeRateDisplay currencyId={formData.currency.id} />
          </div>
        )}
      </div>

      <div className="form-group">
        <label>Método de Pago *</label>
        <PaymentMethodSelector
          value={formData.paymentMethod?.id}
          onChange={(paymentMethod) => setFormData(prev => ({ ...prev, paymentMethod }))}
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={!isFormValid || isLoading}
        className="submit-button"
      >
        {isLoading ? 'Procesando...' : 'Procesar Pago'}
      </button>
    </form>
  );
};
```

## 🎨 Estilos CSS

### Basic Styles

```css
/* styles/payments.css */

.currency-selector,
.payment-method-selector {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
}

.currency-selector:disabled,
.payment-method-selector:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.exchange-rate-display {
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #f9f9f9;
  font-size: 12px;
}

.exchange-rate-display.loading {
  background-color: #f0f0f0;
  color: #666;
}

.exchange-rate-display.error {
  background-color: #ffeaea;
  color: #d32f2f;
  border-color: #d32f2f;
}

.rate-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}

.currency-code {
  background-color: #2196f3;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
}

.rate-value {
  color: #1976d2;
  font-family: monospace;
}

.base-currency {
  color: #666;
  font-size: 11px;
}

.rate-date,
.rate-source {
  font-size: 10px;
  color: #666;
  margin-top: 4px;
}

.currency-converter {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  background-color: white;
}

.converter-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-group label {
  font-weight: bold;
  font-size: 14px;
  color: #333;
}

.input-group input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.converting {
  text-align: center;
  color: #666;
  font-style: italic;
}

.error {
  background-color: #ffeaea;
  color: #d32f2f;
  padding: 8px;
  border-radius: 4px;
  text-align: center;
}

.conversion-result {
  background-color: #e8f5e8;
  color: #2e7d32;
  padding: 12px;
  border-radius: 4px;
  text-align: center;
  font-size: 16px;
}

.payment-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: white;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: bold;
  color: #333;
}

.exchange-rate-info {
  margin-top: 8px;
}

.submit-button {
  width: 100%;
  padding: 12px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-button:hover:not(:disabled) {
  background-color: #1976d2;
}

.submit-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

/* Responsive design */
@media (max-width: 768px) {
  .currency-converter,
  .payment-form {
    margin: 10px;
    padding: 12px;
  }
  
  .converter-form {
    gap: 8px;
  }
}
```

## 🧪 Casos de Uso de Integración

### 1. Selector de Monedas en Formulario de Venta

```tsx
// components/SalesForm.tsx
import React, { useState } from 'react';
import { CurrencySelector } from './CurrencySelector';
import { PaymentMethodSelector } from './PaymentMethodSelector';

export const SalesForm: React.FC = () => {
  const [currency, setCurrency] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [amount, setAmount] = useState(0);

  return (
    <form>
      <CurrencySelector value={currency?.id} onChange={setCurrency} />
      <PaymentMethodSelector value={paymentMethod?.id} onChange={setPaymentMethod} />
      <input 
        type="number" 
        value={amount} 
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Monto"
      />
      {/* Resto del formulario */}
    </form>
  );
};
```

### 2. Conversión Automática en Dashboard

```tsx
// components/CurrencyDashboard.tsx
import React from 'react';
import { useCurrencies } from '../hooks/useCurrencies';
import { ExchangeRateDisplay } from './ExchangeRateDisplay';

export const CurrencyDashboard: React.FC = () => {
  const { data: currencies } = useCurrencies();

  return (
    <div className="currency-dashboard">
      <h2>Tipos de Cambio del Día</h2>
      <div className="rates-grid">
        {currencies?.filter(c => c.currency_code !== 'PYG').map(currency => (
          <div key={currency.id} className="rate-card">
            <h3>{currency.name}</h3>
            <ExchangeRateDisplay 
              currencyId={currency.id} 
              showDate={true} 
              showSource={true} 
            />
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 3. Validación en Tiempo Real

```tsx
// hooks/usePaymentValidation.ts
import { useState, useEffect } from 'react';
import { useCurrency } from './useCurrencies';
import { usePaymentMethod } from './usePaymentMethods';
import { useLatestExchangeRate } from './useExchangeRates';

export const usePaymentValidation = (currencyId: number, paymentMethodId: number) => {
  const [errors, setErrors] = useState<string[]>([]);
  const { data: currency } = useCurrency(currencyId);
  const { data: paymentMethod } = usePaymentMethod(paymentMethodId);
  const { data: exchangeRate } = useLatestExchangeRate(currencyId);

  useEffect(() => {
    const newErrors: string[] = [];

    if (currencyId && !currency) {
      newErrors.push('Moneda no válida');
    }

    if (paymentMethodId && !paymentMethod) {
      newErrors.push('Método de pago no válido');
    }

    if (currencyId && currency?.currency_code !== 'PYG' && !exchangeRate) {
      newErrors.push('Tipo de cambio no disponible para esta moneda');
    }

    setErrors(newErrors);
  }, [currencyId, paymentMethodId, currency, paymentMethod, exchangeRate]);

  return {
    isValid: errors.length === 0,
    errors
  };
};
```

## 🔧 Configuración del Proyecto

### Package.json dependencies

```json
{
  "dependencies": {
    "@tanstack/react-query": "^4.29.0",
    "axios": "^1.4.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.0"
  }
}
```

### React Query Setup

```tsx
// src/App.tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 1000 * 60 * 5, // 5 minutos por defecto
      cacheTime: 1000 * 60 * 30, // 30 minutos por defecto
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Tu aplicación aquí */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
```

## 🧪 Testing

### Service Tests

```typescript
// __tests__/services/currencyService.test.ts
import { CurrencyService } from '../../src/services/currencyService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CurrencyService', () => {
  beforeEach(() => {
    mockedAxios.get.mockClear();
  });

  it('should fetch all currencies', async () => {
    const mockCurrencies = [
      { id: 1, currency_code: 'PYG', name: 'Guaranies' },
      { id: 2, currency_code: 'USD', name: 'Dólar estadounidense' }
    ];

    mockedAxios.get.mockResolvedValue({ data: mockCurrencies });

    const result = await CurrencyService.getAll();

    expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:8080/currencies');
    expect(result).toEqual(mockCurrencies);
  });

  it('should handle error when fetching currencies', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network error'));

    await expect(CurrencyService.getAll()).rejects.toThrow('Error al obtener las monedas');
  });
});
```

### Component Tests

```tsx
// __tests__/components/CurrencySelector.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CurrencySelector } from '../../src/components/CurrencySelector';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('CurrencySelector', () => {
  it('should render loading state', () => {
    const mockOnChange = jest.fn();
    
    renderWithQueryClient(
      <CurrencySelector onChange={mockOnChange} />
    );

    expect(screen.getByText('Cargando monedas...')).toBeInTheDocument();
  });

  it('should call onChange when selection changes', () => {
    const mockOnChange = jest.fn();
    
    // Mock successful data response
    renderWithQueryClient(
      <CurrencySelector onChange={mockOnChange} />
    );

    // Simulate currency data loading and selection
    // This would require mocking the hook response
  });
});
```

## 🚀 Mejores Prácticas

### 1. Manejo de Errores

```typescript
// utils/errorHandler.ts
export const handleApiError = (error: any): string => {
  if (error.response) {
    // Error de respuesta del servidor
    switch (error.response.status) {
      case 404:
        return 'Recurso no encontrado';
      case 500:
        return 'Error interno del servidor';
      default:
        return error.response.data?.message || 'Error en la solicitud';
    }
  } else if (error.request) {
    // Error de red
    return 'Error de conexión. Verifique su red.';
  } else {
    // Error inesperado
    return 'Error inesperado';
  }
};
```

### 2. Caché Inteligente

```typescript
// utils/queryKeys.ts
export const queryKeys = {
  currencies: {
    all: ['currencies'] as const,
    detail: (id: number) => ['currencies', id] as const,
    byCode: (code: string) => ['currencies', 'code', code] as const,
  },
  paymentMethods: {
    all: ['paymentMethods'] as const,
    detail: (id: number) => ['paymentMethods', id] as const,
    byCode: (code: string) => ['paymentMethods', 'code', code] as const,
  },
  exchangeRates: {
    latest: (currencyId: number) => ['exchangeRates', 'latest', currencyId] as const,
    byDate: (currencyId: number, date: string) => ['exchangeRates', currencyId, date] as const,
    range: (currencyId: number, startDate: string, endDate: string) => 
      ['exchangeRates', 'range', currencyId, startDate, endDate] as const,
  },
};
```

### 3. Validación de Datos

```typescript
// utils/validation.ts
export const validateCurrency = (currency: any): currency is Currency => {
  return (
    currency &&
    typeof currency.id === 'number' &&
    typeof currency.currency_code === 'string' &&
    typeof currency.name === 'string'
  );
};

export const validatePaymentMethod = (paymentMethod: any): paymentMethod is PaymentMethod => {
  return (
    paymentMethod &&
    typeof paymentMethod.id === 'number' &&
    typeof paymentMethod.method_code === 'string' &&
    typeof paymentMethod.description === 'string'
  );
};

export const validateExchangeRate = (exchangeRate: any): exchangeRate is ExchangeRate => {
  return (
    exchangeRate &&
    typeof exchangeRate.id === 'number' &&
    typeof exchangeRate.currency_id === 'number' &&
    typeof exchangeRate.rate_to_base === 'number' &&
    typeof exchangeRate.date === 'string' &&
    typeof exchangeRate.created_at === 'string'
  );
};
```

## 📚 Recursos Adicionales

### Enlaces Útiles

- [React Query Documentation](https://tanstack.com/query/latest)
- [Axios Documentation](https://axios-http.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### Herramientas Recomendadas

- **Estado del servidor**: TanStack Query (React Query)
- **Cliente HTTP**: Axios
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + Prettier
- **Tipos**: TypeScript estricto

---

**Guía creada**: 22 de Septiembre de 2025  
**Versión de APIs**: Payments v1.0  
**Compatibilidad**: React 18+, TypeScript 5+

**Equipo de desarrollo**: Business Management Frontend Team  
**Próxima actualización**: 22 de Octubre de 2025