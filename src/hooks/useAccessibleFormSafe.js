/**
 * Wave 4: UX & Accessibility Enterprise - React 19 Compatible
 * Accessible Form Hook Safe - WCAG 2.1 AA Compliance
 * 
 * Gestiona formularios accesibles con:
 * - Validación accesible con aria-describedby
 * - Error handling con live regions
 * - Required field management
 * - Keyboard navigation
 * - Screen reader announcements
 * 
 * @since Wave 4 - UX & Accessibility (React 19 Compatible)
 * @author Sistema ERP
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useLiveRegionSafe } from './useLiveRegionSafe';
import { telemetry } from '@/lib/telemetry';

/**
 * Hook React 19 compatible para formularios accesibles según WCAG 2.1 AA
 */
export const useAccessibleFormSafe = (initialValues = {}, validationRules = {}, options = {}) => {
  const {
    enableTelemetry = true,
    debugMode = false,
    validateOnChange = true,
    validateOnBlur = true,
    announceErrors = true,
    clearErrorsOnFocus = true
  } = options;

  // Estados del formulario - React 19 compatible
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  // Referencias
  const fieldRefs = useRef({});
  const errorIdsRef = useRef({});

  // Hook para anuncios accesibles - versión segura
  const { announceFormValidation, announceFormSaved, announceError } = useLiveRegionSafe({
    enableTelemetry,
    debugMode
  });

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

    // Anunciar errores si está habilitado
    if (announceErrors && hasErrors) {
      const errorCount = Object.keys(newErrors).length;
      announceFormValidation(Object.values(newErrors));

      if (enableTelemetry) {
        telemetry.track('accessibility.form.validation_failed', {
          errorCount,
          fields: Object.keys(newErrors),
          formId: 'accessible-form'
        });
      }
    }

    return !hasErrors;
  }, [values, validationRules, validateField, announceErrors, announceFormValidation, enableTelemetry]);

  /**
   * Maneja cambios en los campos
   */
  const handleChange = useCallback((fieldName, value) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));

    // Validación en tiempo real si está habilitada
    if (validateOnChange && touched[fieldName]) {
      const error = validateField(fieldName, value);
      setErrors(prev => ({
        ...prev,
        [fieldName]: error
      }));
    }

    // Limpiar errores al cambiar el foco si está habilitado
    if (clearErrorsOnFocus && errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }

    // Telemetría
    if (enableTelemetry) {
      telemetry.track('accessibility.form.field_changed', {
        fieldName,
        hasError: !!errors[fieldName],
        valueLength: value ? value.toString().length : 0
      });
    }
  }, [validateOnChange, touched, validateField, clearErrorsOnFocus, errors, enableTelemetry]);

  /**
   * Maneja el blur de los campos
   */
  const handleBlur = useCallback((fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));

    if (validateOnBlur) {
      const error = validateField(fieldName, values[fieldName]);
      setErrors(prev => ({
        ...prev,
        [fieldName]: error
      }));

      // Anunciar error específico del campo
      if (error && announceErrors) {
        announceError(`Error en ${fieldName}`, error);
      }
    }
  }, [validateOnBlur, validateField, values, announceErrors, announceError]);

  /**
   * Maneja el focus de los campos
   */
  const handleFocus = useCallback((fieldName) => {
    if (clearErrorsOnFocus && errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }

    // Telemetría
    if (enableTelemetry) {
      telemetry.track('accessibility.form.field_focused', {
        fieldName,
        hadError: !!errors[fieldName]
      });
    }
  }, [clearErrorsOnFocus, errors, enableTelemetry]);

  /**
   * Registra una referencia de campo
   */
  const registerField = useCallback((fieldName, ref) => {
    if (ref) {
      fieldRefs.current[fieldName] = ref;
    }
  }, []);

  /**
   * Enfoca un campo específico
   */
  const focusField = useCallback((fieldName) => {
    const fieldRef = fieldRefs.current[fieldName];
    if (fieldRef && fieldRef.focus) {
      fieldRef.focus();
    }
  }, []);

  /**
   * Enfoca el primer campo con error
   */
  const focusFirstError = useCallback(() => {
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField) {
      focusField(firstErrorField);
    }
  }, [errors, focusField]);

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = useCallback(async (onSubmit) => {
    setSubmitCount(prev => prev + 1);
    setIsSubmitting(true);

    try {
      const isValid = validateForm();
      
      if (!isValid) {
        focusFirstError();
        return { success: false, errors };
      }

      // Ejecutar función de envío
      const result = await onSubmit(values);
      
      // Anunciar éxito
      if (result && result.success !== false) {
        announceFormSaved('Formulario');
      }

      // Telemetría
      if (enableTelemetry) {
        telemetry.track('accessibility.form.submitted', {
          success: result ? result.success !== false : true,
          fieldCount: Object.keys(values).length,
          submitAttempt: submitCount + 1
        });
      }

      return result || { success: true };
    } catch (error) {
      if (announceErrors) {
        announceError('Error al guardar', error.message || 'Error desconocido');
      }

      if (enableTelemetry) {
        telemetry.track('accessibility.form.submit_error', {
          error: error.message,
          submitAttempt: submitCount + 1
        });
      }

      return { success: false, error: error.message };
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, focusFirstError, errors, values, announceFormSaved, announceErrors, announceError, enableTelemetry, submitCount]);

  /**
   * Reinicia el formulario
   */
  const reset = useCallback((newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setSubmitCount(0);
    
    if (enableTelemetry) {
      telemetry.track('accessibility.form.reset', {
        fieldCount: Object.keys(newValues).length
      });
    }
  }, [initialValues, enableTelemetry]);

  /**
   * Props para campos individuales
   */
  const getFieldProps = useCallback((fieldName, fieldType = 'text') => {
    const hasError = !!errors[fieldName];
    const errorId = hasError ? getErrorId(fieldName) : undefined;
    const helpId = getHelpId(fieldName);

    return {
      id: fieldName,
      name: fieldName,
      type: fieldType,
      value: values[fieldName] || '',
      onChange: (e) => handleChange(fieldName, e.target.value),
      onBlur: () => handleBlur(fieldName),
      onFocus: () => handleFocus(fieldName),
      ref: (ref) => registerField(fieldName, ref),
      'aria-invalid': hasError,
      'aria-describedby': [
        hasError ? errorId : null,
        helpId
      ].filter(Boolean).join(' ') || undefined,
      'aria-required': validationRules[fieldName]?.required || false,
      className: hasError ? 'error' : undefined
    };
  }, [values, errors, handleChange, handleBlur, handleFocus, registerField, getErrorId, getHelpId, validationRules]);

  /**
   * Props para mensajes de error
   */
  const getErrorProps = useCallback((fieldName) => {
    const error = errors[fieldName];
    if (!error) return null;

    return {
      id: getErrorId(fieldName),
      role: 'alert',
      'aria-live': 'polite',
      className: 'error-message',
      children: error
    };
  }, [errors, getErrorId]);

  /**
   * Props para mensajes de ayuda
   */
  const getHelpProps = useCallback((fieldName) => {
    return {
      id: getHelpId(fieldName),
      className: 'help-text'
    };
  }, [getHelpId]);

  // Efecto para telemetría de montaje/desmontaje
  useEffect(() => {
    if (enableTelemetry) {
      telemetry.track('accessibility.form.mounted', {
        fieldCount: Object.keys(validationRules).length,
        hasValidation: Object.keys(validationRules).length > 0
      });
    }

    return () => {
      if (enableTelemetry) {
        telemetry.track('accessibility.form.unmounted', {
          submissionAttempts: submitCount,
          hadErrors: Object.keys(errors).length > 0
        });
      }
    };
  }, []);

  return {
    // Estado del formulario
    values,
    errors,
    touched,
    isSubmitting,
    submitCount,
    
    // Métodos principales
    handleSubmit,
    reset,
    validateForm,
    
    // Métodos de campo
    handleChange,
    handleBlur,
    handleFocus,
    registerField,
    focusField,
    focusFirstError,
    
    // Props helpers
    getFieldProps,
    getErrorProps,
    getHelpProps,
    
    // Estado calculado
    isValid: Object.keys(errors).length === 0,
    isDirty: Object.keys(touched).length > 0,
    canSubmit: Object.keys(errors).length === 0 && !isSubmitting
  };
};

export default useAccessibleFormSafe;