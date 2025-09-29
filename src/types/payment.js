// Payment API Types - Based on PAYMENT_API.md documentation

// Currency Types
/**
 * @typedef {Object} Currency
 * @property {number} id - Currency ID
 * @property {string} currency_code - Currency code (e.g., "USD", "PYG")
 * @property {string} name - Currency name
 */

/**
 * @typedef {Object} CurrencyResponse
 * @property {Currency[]} data - Array of currencies
 * @property {boolean} success - Response success status
 * @property {string} [message] - Optional message
 */

/**
 * @typedef {Object} SingleCurrencyResponse
 * @property {Currency} data - Single currency object
 * @property {boolean} success - Response success status
 * @property {string} [message] - Optional message
 */

// Payment Method Types
/**
 * @typedef {Object} PaymentMethod
 * @property {number} id - Payment method ID
 * @property {string} method_code - Payment method code
 * @property {string} description - Payment method description
 */

/**
 * @typedef {Object} PaymentMethodResponse
 * @property {PaymentMethod[]} data - Array of payment methods
 * @property {boolean} success - Response success status
 * @property {string} [message] - Optional message
 */

/**
 * @typedef {Object} SinglePaymentMethodResponse
 * @property {PaymentMethod} data - Single payment method object
 * @property {boolean} success - Response success status
 * @property {string} [message] - Optional message
 */

// Exchange Rate Types
/**
 * @typedef {Object} ExchangeRate
 * @property {number} id - Exchange rate ID
 * @property {number} currency_id - Currency ID reference
 * @property {number} rate_to_base - Rate conversion to base currency
 * @property {string} date - ISO date string
 * @property {string} [source] - Optional source of exchange rate
 * @property {string} created_at - ISO datetime string
 */

/**
 * @typedef {Object} ExchangeRateResponse
 * @property {ExchangeRate} data - Single exchange rate object
 * @property {boolean} success - Response success status
 * @property {string} [message] - Optional message
 */

/**
 * @typedef {Object} ExchangeRateRangeResponse
 * @property {ExchangeRate[]} data - Array of exchange rates
 * @property {boolean} success - Response success status
 * @property {string} [message] - Optional message
 */

// Query Types for API requests
/**
 * @typedef {Object} ExchangeRateQuery
 * @property {number} currency_id - Currency ID to query
 * @property {string} [date] - Optional date in YYYY-MM-DD format
 */

/**
 * @typedef {Object} ExchangeRateRangeQuery
 * @property {number} currency_id - Currency ID to query
 * @property {string} start_date - Start date in YYYY-MM-DD format
 * @property {string} end_date - End date in YYYY-MM-DD format
 */

// Form data types for components
/**
 * @typedef {Object} PaymentFormData
 * @property {number} amount - Payment amount
 * @property {Currency|null} currency - Selected currency
 * @property {PaymentMethod|null} paymentMethod - Selected payment method
 */

/**
 * @typedef {Object} CurrencyConversionRequest
 * @property {number} amount - Amount to convert
 * @property {number} fromCurrencyId - Source currency ID
 * @property {number} toCurrencyId - Target currency ID
 * @property {string} [date] - Optional date for historical rates
 */

/**
 * @typedef {Object} CurrencyConversionResult
 * @property {number} originalAmount - Original amount
 * @property {number} convertedAmount - Converted amount
 * @property {Currency} fromCurrency - Source currency
 * @property {Currency} toCurrency - Target currency
 * @property {ExchangeRate} fromRate - Source currency rate
 * @property {ExchangeRate} toRate - Target currency rate
 * @property {string} conversionDate - Date of conversion
 */

// Validation types
/**
 * @typedef {Object} PaymentValidationResult
 * @property {boolean} isValid - Whether payment data is valid
 * @property {string[]} errors - Array of validation error messages
 */

/**
 * @typedef {Object} ExchangeRateValidation
 * @property {boolean} hasRate - Whether exchange rate exists
 * @property {boolean} isRecent - Whether rate is recent (less than 24h old)
 * @property {string} [warning] - Optional warning message
 */

export {};