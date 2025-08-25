/**
 * Wave 4: UX & Accessibility Enterprise
 * Accessible Form Hook - WCAG 2.1 AA Compliance
 * 
 * Gestiona formularios accesibles con:
 * - Validación accesible con aria-describedby
 * - Error handling con live regions
 * - Required field management
 * - Keyboard navigation
 * - Screen reader announcements
 * 
 * @since Wave 4 - UX & Accessibility
 * @author Sistema ERP
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useLiveRegion } from './useLiveRegion';
import { telemetry } from '@/lib/telemetry';

/**
 * Hook para formularios accesibles según WCAG 2.1 AA
 */
export const useAccessibleForm = (initialValues = {}, validationRules = {}, options = {}) => {
  const {
    enableTelemetry = true,
    debugMode = false,
    validateOnChange = true,
    validateOnBlur = true,
    announceErrors = true,
    clearErrorsOnFocus = true
  } = options;

  // Estados del formulario
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  // Referencias
  const fieldRefs = useRef({});
  const errorIdsRef = useRef({});

  // Hook para anuncios accesibles
  const { announceFormValidation, announceFormSaved, announceError } = useLiveRegion();

  /**
   * Genera un ID único para los elementos de error
   */
  const getErrorId = useCallback((fieldName) => {
    if (!errorIdsRef.current[fieldName]) {
      errorIdsRef.current[fieldName] = `error-${fieldName}-${Date.now()}`;
    }
    return errorIdsRef.current[fieldName];
  }, []);

  /**
   * Genera un ID único para los elementos de ayuda
   */
  const getHelpId = useCallback((fieldName) => {
    return `help-${fieldName}`;
  }, []);

  /**
   * Valida un campo individual
   */
  const validateField = useCallback((fieldName, value) => {
    const rules = validationRules[fieldName];
    if (!rules) return null;

    // Validación required
    if (rules.required && (!value || value.toString().trim() === '')) {
      return rules.requiredMessage || `${fieldName} es requerido`;
    }

    // Validación de longitud mínima
    if (rules.minLength && value && value.toString().length < rules.minLength) {
      return rules.minLengthMessage || `${fieldName} debe tener al menos ${rules.minLength} caracteres`;
    }

    // Validación de longitud máxima
    if (rules.maxLength && value && value.toString().length > rules.maxLength) {
      return rules.maxLengthMessage || `${fieldName} no puede tener más de ${rules.maxLength} caracteres`;
    }

    // Validación de patrón (regex)
    if (rules.pattern && value && !rules.pattern.test(value.toString())) {
      return rules.patternMessage || `${fieldName} tiene un formato inválido`;
    }

    // Validación personalizada
    if (rules.validate && typeof rules.validate === 'function') {
      const customError = rules.validate(value, values);
      if (customError) {
        return customError;
      }
    }

    return null;
  }, [validationRules, values]);

  /**
   * Valida todos los campos del formulario
   */
  const validateForm = useCallback(() => {
    const newErrors = {};
    let hasErrors = false;

    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    return !hasErrors;
  }, [validationRules, values, validateField]);

  /**
   * Maneja el cambio de valor en un campo
   */
  const handleChange = useCallback((fieldName, value) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));

    // Limpiar error al enfocar si está configurado
    if (clearErrorsOnFocus && errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }

    // Validación en tiempo real si está habilitada
    if (validateOnChange && touched[fieldName]) {
      const error = validateField(fieldName, value);
      setErrors(prev => ({
        ...prev,
        [fieldName]: error || undefined
      }));

      // Anunciar error si existe
      if (error && announceErrors) {
        announceFormValidation(fieldName, error);
      }
    }

    if (enableTelemetry) {
      telemetry.record('accessibility.form.field_changed', {
        fieldName,
        hasError: !!errors[fieldName],
        valueLength: value ? value.toString().length : 0
      });
    }
  }, [
    clearErrorsOnFocus,
    errors,
    validateOnChange,
    touched,
    validateField,
    announceErrors,
    announceFormValidation,
    enableTelemetry
  ]);

  /**
   * Maneja el blur (pérdida de foco) en un campo
   */
  const handleBlur = useCallback((fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));

    // Validación en blur si está habilitada
    if (validateOnBlur) {
      const error = validateField(fieldName, values[fieldName]);
      setErrors(prev => ({
        ...prev,
        [fieldName]: error || undefined
      }));

      // Anunciar error si existe
      if (error && announceErrors) {
        announceFormValidation(fieldName, error);
      }
    }

    if (enableTelemetry) {
      telemetry.record('accessibility.form.field_blurred', {
        fieldName,
        hasError: !!errors[fieldName],
        isTouched: true
      });
    }
  }, [
    validateOnBlur,
    validateField,
    values,
    announceErrors,
    announceFormValidation,
    enableTelemetry,
    errors
  ]);

  /**
   * Maneja el foco en un campo
   */
  const handleFocus = useCallback((fieldName) => {
    if (enableTelemetry) {
      telemetry.record('accessibility.form.field_focused', {
        fieldName,
        hasError: !!errors[fieldName]
      });
    }
  }, [enableTelemetry, errors]);

  /**
   * Maneja el submit del formulario
   */
  const handleSubmit = useCallback(async (onSubmit) => {
    setIsSubmitting(true);
    setSubmitCount(prev => prev + 1);

    // Marcar todos los campos como touched
    const allFieldNames = Object.keys(validationRules);
    setTouched(allFieldNames.reduce((acc, field) => ({ ...acc, [field]: true }), {}));

    // Validar formulario
    const isValid = validateForm();

    if (!isValid) {
      setIsSubmitting(false);
      
      // Enfocar el primer campo con error
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField && fieldRefs.current[firstErrorField]) {
        fieldRefs.current[firstErrorField].focus();
      }

      // Anunciar errores de validación
      if (announceErrors) {
        const errorCount = Object.keys(errors).length;
        announceError(`El formulario tiene ${errorCount} error${errorCount > 1 ? 'es' : ''} de validación`);
      }

      if (enableTelemetry) {
        telemetry.record('accessibility.form.submit_failed_validation', {
          errorCount: Object.keys(errors).length,
          submitAttempt: submitCount
        });
      }

      return { success: false, errors };
    }

    try {
      const result = await onSubmit(values);
      
      if (result.success !== false) {
        // Reset form on successful submit
        setValues(initialValues);
        setErrors({});
        setTouched({});
        
        if (announceErrors) {
          announceFormSaved();
        }

        if (enableTelemetry) {
          telemetry.record('accessibility.form.submit_success', {
            submitAttempt: submitCount
          });
        }
      }

      setIsSubmitting(false);
      return result;
    } catch (error) {
      setIsSubmitting(false);
      
      if (announceErrors) {
        announceError('Error al enviar el formulario');
      }

      if (enableTelemetry) {
        telemetry.record('accessibility.form.submit_error', {
          error: error.message,
          submitAttempt: submitCount
        });
      }

      throw error;
    }
  }, [
    validationRules,
    validateForm,
    errors,
    announceErrors,
    announceError,
    announceFormSaved,
    enableTelemetry,
    submitCount,
    values,
    initialValues
  ]);

  /**
   * Reinicia el formulario
   */
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setSubmitCount(0);

    if (enableTelemetry) {
      telemetry.record('accessibility.form.reset');
    }
  }, [initialValues, enableTelemetry]);

  /**
   * Genera props accesibles para un campo del formulario
   */
  const getFieldProps = useCallback((fieldName, fieldType = 'text') => {
    const hasError = !!errors[fieldName];
    const rules = validationRules[fieldName];
    const isRequired = rules?.required || false;

    const props = {
      id: fieldName,
      name: fieldName,
      value: values[fieldName] || '',
      onChange: (e) => handleChange(fieldName, e.target.value),
      onBlur: () => handleBlur(fieldName),
      onFocus: () => handleFocus(fieldName),
      ref: (el) => {
        fieldRefs.current[fieldName] = el;
      },
      'aria-required': isRequired,
      'aria-invalid': hasError
    };

    // Agregar aria-describedby para errores y ayuda
    const describedBy = [];
    if (hasError) {
      describedBy.push(getErrorId(fieldName));
    }
    if (rules?.helpText) {
      describedBy.push(getHelpId(fieldName));
    }
    if (describedBy.length > 0) {
      props['aria-describedby'] = describedBy.join(' ');
    }

    return props;
  }, [
    errors,
    validationRules,
    values,
    handleChange,
    handleBlur,
    handleFocus,
    getErrorId,
    getHelpId
  ]);

  /**
   * Genera props para el elemento de error
   */
  const getErrorProps = useCallback((fieldName) => {
    const hasError = !!errors[fieldName];
    
    return {
      id: getErrorId(fieldName),
      role: 'alert',
      'aria-live': 'polite',
      className: hasError ? 'error-message' : 'error-message hidden',
      children: errors[fieldName] || ''
    };
  }, [errors, getErrorId]);

  /**
   * Genera props para el elemento de ayuda
   */
  const getHelpProps = useCallback((fieldName) => {
    const rules = validationRules[fieldName];
    
    return {
      id: getHelpId(fieldName),
      className: 'help-text',
      children: rules?.helpText || ''
    };
  }, [validationRules, getHelpId]);

  return {
    // Estado del formulario
    values,
    errors,
    touched,
    isSubmitting,
    isValid: Object.keys(errors).length === 0,
    
    // Handlers principales
    handleSubmit,
    handleChange,
    handleBlur,
    handleFocus,
    reset,
    
    // Validación
    validateField,
    validateForm,
    
    // Props generators
    getFieldProps,
    getErrorProps,
    getHelpProps,
    
    // Utilidades
    setFieldValue: (fieldName, value) => handleChange(fieldName, value),
    setFieldError: (fieldName, error) => setErrors(prev => ({ ...prev, [fieldName]: error })),
    clearFieldError: (fieldName) => setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    })
  };
};

export default useAccessibleForm;
