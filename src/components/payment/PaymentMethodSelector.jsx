import React, { useState, useEffect } from 'react';
import { ChevronDown, AlertCircle, Loader2, Search, CreditCard } from 'lucide-react';
import { PaymentMethodService } from '../../services/paymentMethodService.js';

/**
 * Payment Method Selector Component
 * Allows users to select a payment method from available options
 */
const PaymentMethodSelector = ({
  value,
  onChange,
  placeholder = "Seleccionar método de pago...",
  disabled = false,
  showSearch = false,
  filterByType = null, // 'cash', 'card', 'digital', 'bank'
  className = ""
}) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Load payment methods on component mount
  useEffect(() => {
    loadPaymentMethods();
  }, [filterByType]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPaymentMethods = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = filterByType
        ? await PaymentMethodService.getByType(filterByType)
        : await PaymentMethodService.getAll();

      setPaymentMethods(data);
    } catch (err) {
      console.error('Error loading payment methods:', err);
      setError('Error al cargar los métodos de pago');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter payment methods based on search term
  const filteredMethods = paymentMethods.filter(method => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      method.description.toLowerCase().includes(searchLower) ||
      method.method_code.toLowerCase().includes(searchLower)
    );
  });

  // Find selected payment method
  const selectedMethod = paymentMethods.find(m => m.id === value);

  const handleMethodSelect = (method) => {
    onChange(method);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Get icon for payment method
  const getMethodIcon = (methodCode) => {
    const code = methodCode.toLowerCase();
    if (code.includes('card') || code.includes('tarjeta')) {
      return <CreditCard className="w-4 h-4" />;
    }
    // Default icon
    return <CreditCard className="w-4 h-4" />;
  };

  // Get method type badge color
  const getMethodBadgeColor = (methodCode) => {
    const code = methodCode.toLowerCase();
    if (code.includes('cash') || code.includes('efectivo')) {
      return 'bg-green-500';
    }
    if (code.includes('card') || code.includes('tarjeta')) {
      return 'bg-blue-500';
    }
    if (code.includes('bank') || code.includes('banco')) {
      return 'bg-purple-500';
    }
    return 'bg-gray-500';
  };

  if (isLoading) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center justify-center p-3 border border-gray-300 rounded-md bg-gray-50">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          <span className="text-sm text-gray-600">Cargando métodos de pago...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center p-3 border border-red-300 rounded-md bg-red-50">
          <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
          <span className="text-sm text-red-600">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main selector button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          w-full p-3 text-left border rounded-md bg-white flex items-center justify-between
          ${disabled
            ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200'
            : 'hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 border-gray-300'
          }
          ${error ? 'border-red-300' : ''}
        `}
      >
        <div className="flex items-center">
          {selectedMethod ? (
            <>
              <div className="flex items-center mr-3">
                {getMethodIcon(selectedMethod.method_code)}
                <span className={`ml-2 inline-block px-2 py-1 text-xs font-mono font-bold text-white rounded ${getMethodBadgeColor(selectedMethod.method_code)}`}>
                  {selectedMethod.method_code}
                </span>
              </div>
              <span className="text-sm">{selectedMethod.description}</span>
            </>
          ) : (
            <span className="text-gray-500 text-sm">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search input */}
          {showSearch && (
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar método de pago..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Payment method options */}
          <div className="max-h-48 overflow-y-auto">
            {filteredMethods.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                {searchTerm ? 'No se encontraron métodos de pago' : 'No hay métodos de pago disponibles'}
              </div>
            ) : (
              filteredMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => handleMethodSelect(method)}
                  className={`
                    w-full p-3 text-left hover:bg-blue-50 flex items-center transition-colors
                    ${selectedMethod?.id === method.id ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}
                  `}
                >
                  <div className="flex items-center mr-3">
                    {getMethodIcon(method.method_code)}
                    <span className={`ml-2 inline-block px-2 py-1 text-xs font-mono font-bold text-white rounded ${getMethodBadgeColor(method.method_code)}`}>
                      {method.method_code}
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm">{method.description}</span>
                    {PaymentMethodService.requiresAdditionalInfo(method) && (
                      <div className="text-xs text-gray-500 mt-1">
                        Requiere información adicional
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Click outside handler */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default PaymentMethodSelector;
