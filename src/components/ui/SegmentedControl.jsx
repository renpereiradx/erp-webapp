/**
 * SegmentedControl - Componente de control segmentado Fluent Design System 2
 * Permite seleccionar entre múltiples opciones con indicador visual animado
 *
 * @example
 * <SegmentedControl
 *   options={[
 *     { value: 'name', label: 'Por Nombre' },
 *     { value: 'date', label: 'Por Fecha' }
 *   ]}
 *   value={selectedValue}
 *   onChange={handleChange}
 *   aria-label="Tipo de búsqueda"
 * />
 */

import React, { useRef, useEffect, useState } from 'react';

const SegmentedControl = ({
  options = [],
  value,
  onChange,
  'aria-label': ariaLabel,
  className = '',
  size = 'medium'
}) => {
  const containerRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({});

  // Calcular posición y tamaño del indicador cuando cambia el valor
  useEffect(() => {
    if (!containerRef.current || !value) return;

    const activeButton = containerRef.current.querySelector(
      `[data-value="${value}"]`
    );

    if (activeButton) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();

      setIndicatorStyle({
        width: buttonRect.width,
        transform: `translateX(${buttonRect.left - containerRect.left}px)`,
      });
    }
  }, [value, options]);

  // Manejar el cambio de selección
  const handleOptionClick = (optionValue) => {
    if (onChange) {
      onChange(optionValue);
    }
  };

  // Manejar navegación por teclado
  const handleKeyDown = (event, optionValue, index) => {
    const optionsCount = options.length;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        if (index > 0) {
          const prevOption = options[index - 1];
          onChange(prevOption.value);
          // Enfocar el botón anterior
          const prevButton = containerRef.current.querySelector(
            `[data-value="${prevOption.value}"]`
          );
          if (prevButton) prevButton.focus();
        }
        break;

      case 'ArrowRight':
        event.preventDefault();
        if (index < optionsCount - 1) {
          const nextOption = options[index + 1];
          onChange(nextOption.value);
          // Enfocar el botón siguiente
          const nextButton = containerRef.current.querySelector(
            `[data-value="${nextOption.value}"]`
          );
          if (nextButton) nextButton.focus();
        }
        break;

      case 'Home':
        event.preventDefault();
        onChange(options[0].value);
        const firstButton = containerRef.current.querySelector(
          `[data-value="${options[0].value}"]`
        );
        if (firstButton) firstButton.focus();
        break;

      case 'End':
        event.preventDefault();
        onChange(options[optionsCount - 1].value);
        const lastButton = containerRef.current.querySelector(
          `[data-value="${options[optionsCount - 1].value}"]`
        );
        if (lastButton) lastButton.focus();
        break;

      default:
        break;
    }
  };

  if (!options || options.length === 0) {
    return null;
  }

  const sizeClass = size === 'small' ? 'segmented-control--small' : '';

  return (
    <div
      ref={containerRef}
      className={`segmented-control ${sizeClass} ${className}`.trim()}
      role="tablist"
      aria-label={ariaLabel || 'Segmented control'}
    >
      {/* Indicador animado de fondo */}
      <div
        className="segmented-control__indicator"
        style={indicatorStyle}
        aria-hidden="true"
      />

      {/* Opciones */}
      {options.map((option, index) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            data-value={option.value}
            className={`segmented-control__option ${
              isActive ? 'segmented-control__option--active' : ''
            }`}
            onClick={() => handleOptionClick(option.value)}
            onKeyDown={(e) => handleKeyDown(e, option.value, index)}
            role="tab"
            aria-selected={isActive}
            aria-controls={option['aria-controls']}
            tabIndex={isActive ? 0 : -1}
            disabled={option.disabled}
          >
            {option.icon && (
              <span className="segmented-control__icon" aria-hidden="true">
                {option.icon}
              </span>
            )}
            <span className="segmented-control__label">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedControl;
