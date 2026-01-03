// Payment API Types - Based on PAYMENT_CONFIG_API.md documentation

// Currency Types
/**
 * @typedef {Object} Currency
 * @property {number} id - Currency ID
 * @property {string} currency_code - Currency code (e.g., "USD", "PYG")
 * @property {string} currency_name - Currency display name
 * @property {string} [name] - Legacy alias for currency_name
 * @property {string} [symbol] - Currency symbol (e.g., "$", "₲")
 * @property {number} [decimal_places] - Number of decimal places (0-2)
 * @property {boolean} [is_base_currency] - Legacy: Whether this is the system base currency
 * @property {boolean} [is_base] - New: Whether this is the system base currency
 */

/**
 * @typedef {Object} CurrencyEnriched
 * @property {number} id - Currency ID
 * @property {string} currency_code - Currency code (e.g., "USD", "PYG")
 * @property {string} name - Currency display name
 * @property {string} symbol - Currency symbol (e.g., "$", "₲")
 * @property {number} decimal_places - Number of decimal places (0-2)
 * @property {boolean} is_base - Whether this is the system base currency
 */

/**
 * @typedef {Object} CurrencyResponse
 * @property {Currency[]} data - Array of currencies
 * @property {boolean} success - Response success status
 * @property {number} [total] - Total number of currencies
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
 * @property {string} [icon] - Optional icon name (e.g., "banknotes")
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
 * @property {string} date - ISO date string (YYYY-MM-DD)
 * @property {string} [source] - Optional source of exchange rate (e.g., "manual")
 * @property {string} [created_at] - ISO datetime string
 */

/**
 * @typedef {Object} ExchangeRateEnriched
 * @property {number} id - Exchange rate ID
 * @property {number} currency_id - Currency ID reference
 * @property {string} currency_code - Currency code (e.g., "USD")
 * @property {string} currency_name - Currency name
 * @property {number} rate_to_base - Rate conversion to base currency
 * @property {string} date - ISO date string (YYYY-MM-DD)
 * @property {string} [source] - Optional source of exchange rate (e.g., "manual")
 * @property {string} [created_at] - ISO datetime string
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

/**
 * @typedef {Object} PaginatedResponse
 * @property {Array} data - Array of results
 * @property {number} total - Total number of records available
 * @property {number} page - Current page number (1-based)
 * @property {number} page_size - Page size requested
 * @property {number} total_pages - Total number of pages
 */

/**
 * @typedef {PaginatedResponse & { data: ExchangeRateEnriched[] }} ExchangeRateEnrichedPaginatedResponse
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

// New API Conversion Types (based on PAYMENT_CONFIG_API.md)
/**
 * @typedef {Object} ConversionCurrencyInfo
 * @property {string} code - Currency code
 * @property {string} name - Currency name
 * @property {number} amount - Amount in this currency
 * @property {number} rate - Exchange rate to base
 */

/**
 * @typedef {Object} CurrencyConversionApiResult
 * @property {boolean} success - Whether conversion was successful
 * @property {ConversionCurrencyInfo} from - Source currency info
 * @property {ConversionCurrencyInfo} to - Target currency info
 * @property {string} date - Date of exchange rate used (YYYY-MM-DD)
 * @property {string} timestamp - ISO timestamp of conversion
 */

// Bootstrap Types (based on PAYMENT_CONFIG_API.md)
/**
 * @typedef {Object} BootstrapCurrency
 * @property {number} id - Currency ID
 * @property {string} currency_code - Currency code
 * @property {string} name - Currency display name
 * @property {string} symbol - Currency symbol
 * @property {number} decimal_places - Decimal places (0-2)
 * @property {boolean} is_base - Whether this is base currency
 */

/**
 * @typedef {Object} BootstrapPaymentMethod
 * @property {number} id - Payment method ID
 * @property {string} method_code - Method code
 * @property {string} description - Method description
 * @property {string} [icon] - Optional icon name
 */

/**
 * @typedef {Object} BootstrapExchangeRate
 * @property {number} currency_id - Currency ID
 * @property {string} currency_code - Currency code
 * @property {number} rate_to_base - Rate to base currency
 */

/**
 * @typedef {Object} BootstrapExchangeRates
 * @property {string} date - ISO date string
 * @property {BootstrapExchangeRate[]} rates - Array of exchange rates
 */

/**
 * @typedef {Object} BootstrapConfig
 * @property {number} base_currency_id - Base currency ID
 * @property {string} base_currency_code - Base currency code
 * @property {number} default_decimals - Default decimal places
 */

/**
 * @typedef {Object} PaymentBootstrapResponse
 * @property {BootstrapCurrency[]} currencies - Available currencies
 * @property {BootstrapPaymentMethod[]} payment_methods - Available payment methods
 * @property {BootstrapExchangeRates} exchange_rates - Current exchange rates
 * @property {BootstrapConfig} config - System configuration
 * @property {string} generated_at - ISO datetime when bootstrap was generated
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

// API Error Types (based on PAYMENT_CONFIG_API.md)
/**
 * @typedef {Object} PaymentApiError
 * @property {boolean} success - Always false for errors
 * @property {Object} error - Error details
 * @property {string} error.code - Error code (e.g., "NOT_FOUND", "INVALID_ID")
 * @property {string} error.message - Error message
 */

export {}
