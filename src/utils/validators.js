/**
 * Validators Utility
 * Basic validation functions for testing purposes
 */

export const validateAmount = (amount) => {
  if (typeof amount !== 'number') {
    return {
      isValid: false,
      error: 'Amount must be a number'
    };
  }
  
  if (amount <= 0) {
    return {
      isValid: false,
      error: 'Amount must be greater than 0'
    };
  }
  
  if (amount > 1000000) {
    return {
      isValid: false,
      error: 'Amount exceeds maximum limit'
    };
  }
  
  return {
    isValid: true,
    error: null
  };
};

export const validateCardNumber = (cardNumber) => {
  if (!cardNumber || typeof cardNumber !== 'string') {
    return {
      isValid: false,
      error: 'Card number is required'
    };
  }
  
  // Basic card number validation (simplified)
  const cleaned = cardNumber.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(cleaned)) {
    return {
      isValid: false,
      error: 'Invalid card number format'
    };
  }
  
  return {
    isValid: true,
    error: null
  };
};

export const validateCVV = (cvv) => {
  if (!cvv || typeof cvv !== 'string') {
    return {
      isValid: false,
      error: 'CVV is required'
    };
  }
  
  if (!/^\d{3,4}$/.test(cvv)) {
    return {
      isValid: false,
      error: 'Invalid CVV format'
    };
  }
  
  return {
    isValid: true,
    error: null
  };
};
