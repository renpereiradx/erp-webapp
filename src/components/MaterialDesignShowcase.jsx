import React from 'react';
import { useTheme } from 'next-themes';
import { createMaterialStyles } from '../utils/materialDesignUtils';

/**
 * Material Design Component Showcase
 * Demonstrates the Material Design theme system with various components
 */
const MaterialDesignShowcase = () => {
  const { theme } = useTheme();
  const isMaterial = theme?.includes('material');

  if (!isMaterial) {
    return null;
  }

  return (
    <div className="md-typography w-full max-w-6xl mx-auto p-6 space-y-8">
      {/* Typography Showcase */}
      <section className="space-y-4">
        <h1 className="md-display-large text-primary">Material Design</h1>
        <h2 className="md-headline-large">Typography Scale</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="md-headline-medium mb-2">Display Styles</h3>
            <div className="md-display-small">Display Small</div>
            <div className="md-headline-large">Headline Large</div>
            <div className="md-headline-medium">Headline Medium</div>
            <div className="md-headline-small">Headline Small</div>
          </div>
          <div>
            <h3 className="md-headline-medium mb-2">Body & Label Styles</h3>
            <div className="md-title-large">Title Large</div>
            <div className="md-title-medium">Title Medium</div>
            <div className="md-body-large">Body Large - Lorem ipsum dolor sit amet</div>
            <div className="md-body-medium">Body Medium - Lorem ipsum dolor sit amet</div>
            <div className="md-label-large">Label Large</div>
            <div className="md-label-medium">Label Medium</div>
            <div className="md-label-small">Label Small</div>
          </div>
        </div>
      </section>

      {/* Color Palette */}
      <section className="space-y-4">
        <h2 className="md-headline-large">Color System</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="md-primary p-4 rounded-lg md-corner-md">
            <div className="md-label-large">Primary</div>
            <div className="md-body-medium opacity-80">Main color</div>
          </div>
          <div className="md-secondary p-4 rounded-lg md-corner-md">
            <div className="md-label-large">Secondary</div>
            <div className="md-body-medium opacity-80">Accent color</div>
          </div>
          <div className="md-surface p-4 rounded-lg md-corner-md border border-outline">
            <div className="md-label-large">Surface</div>
            <div className="md-body-medium opacity-80">Container color</div>
          </div>
          <div className="md-error p-4 rounded-lg md-corner-md">
            <div className="md-label-large">Error</div>
            <div className="md-body-medium opacity-80">Error state</div>
          </div>
        </div>
      </section>

      {/* Elevation Showcase */}
      <section className="space-y-4">
        <h2 className="md-headline-large">Elevation System</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[0, 1, 2, 3, 4, 5].map(level => (
            <div 
              key={level}
              className={`md-surface p-4 rounded-lg md-corner-md md-elevation-${level}`}
              style={{ backgroundColor: 'var(--md-surface-main)', color: 'var(--md-on-surface)' }}
            >
              <div className="md-label-large">Level {level}</div>
              <div className="md-body-medium opacity-70">Elevation</div>
            </div>
          ))}
        </div>
      </section>

      {/* Components Showcase */}
      <section className="space-y-4">
        <h2 className="md-headline-large">Components</h2>
        
        {/* Buttons */}
        <div className="space-y-4">
          <h3 className="md-headline-medium">Buttons</h3>
          <div className="flex flex-wrap gap-4">
            <MaterialButton variant="filled" color="primary">
              <span className="material-symbols-outlined">add</span>
              Filled Button
            </MaterialButton>
            <MaterialButton variant="outlined" color="primary">
              <span className="material-symbols-outlined">edit</span>
              Outlined Button
            </MaterialButton>
            <MaterialButton variant="text" color="primary">
              <span className="material-symbols-outlined">info</span>
              Text Button
            </MaterialButton>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <MaterialButton variant="filled" color="secondary" size="small">
              Small
            </MaterialButton>
            <MaterialButton variant="filled" color="secondary" size="medium">
              Medium
            </MaterialButton>
            <MaterialButton variant="filled" color="secondary" size="large">
              Large
            </MaterialButton>
          </div>
        </div>

        {/* Cards */}
        <div className="space-y-4">
          <h3 className="md-headline-medium">Cards</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MaterialCard elevation={1}>
              <div className="md-title-large mb-2">Basic Card</div>
              <div className="md-body-medium">
                This is a basic card with elevation level 1. Cards contain content and actions about a single subject.
              </div>
            </MaterialCard>
            
            <MaterialCard elevation={2}>
              <div className="md-title-large mb-2">Elevated Card</div>
              <div className="md-body-medium mb-4">
                This card has elevation level 2, creating more visual separation from the background.
              </div>
              <div className="flex gap-2">
                <MaterialButton variant="text" color="primary" size="small">
                  Action 1
                </MaterialButton>
                <MaterialButton variant="text" color="primary" size="small">
                  Action 2
                </MaterialButton>
              </div>
            </MaterialCard>
            
            <MaterialCard elevation={3}>
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--md-primary-main)', color: 'var(--md-on-primary)' }}
                >
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div>
                  <div className="md-title-medium">User Card</div>
                  <div className="md-body-medium opacity-70">Active now</div>
                </div>
              </div>
              <div className="md-body-medium">
                Complex card with avatar and actions. Elevation level 3 provides strong emphasis.
              </div>
            </MaterialCard>
          </div>
        </div>

        {/* Text Fields */}
        <div className="space-y-4">
          <h3 className="md-headline-medium">Text Fields</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MaterialTextField 
              label="Email"
              placeholder="Enter your email"
              type="email"
            />
            <MaterialTextField 
              label="Password"
              placeholder="Enter your password"
              type="password"
            />
          </div>
        </div>
      </section>

      {/* Spacing Showcase */}
      <section className="space-y-4">
        <h2 className="md-headline-large">Spacing System (8dp Grid)</h2>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 8].map(spacing => (
            <div key={spacing} className="flex items-center gap-4">
              <div className="md-label-medium w-20">
                md-spacing-{spacing}
              </div>
              <div 
                className="bg-primary h-4"
                style={{ 
                  width: `var(--md-spacing-${spacing})`,
                  backgroundColor: 'var(--md-primary-main)'
                }}
              />
              <div className="md-body-medium opacity-70">
                {spacing * 8}px
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

/**
 * Material Design Button Component
 */
const MaterialButton = ({ 
  children, 
  variant = 'filled', 
  color = 'primary', 
  size = 'medium',
  onClick,
  disabled = false,
  ...props 
}) => {
  const styles = createMaterialStyles.button(variant, color, size);
  
  return (
    <button
      className="md-component md-state-layer"
      style={{
        ...styles,
        opacity: disabled ? 0.38 : 1,
        pointerEvents: disabled ? 'none' : 'auto'
      }}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * Material Design Card Component
 */
const MaterialCard = ({ children, elevation = 1, className = '', ...props }) => {
  const styles = createMaterialStyles.card(elevation);
  
  return (
    <div
      className={`md-component ${className}`}
      style={styles}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Material Design Text Field Component
 */
const MaterialTextField = ({ 
  label, 
  placeholder, 
  type = 'text',
  value,
  onChange,
  error = false,
  helperText,
  ...props 
}) => {
  const styles = createMaterialStyles.textField();
  
  return (
    <div className="space-y-1">
      {label && (
        <label className="md-body-medium block" style={{ color: 'var(--md-on-surface)' }}>
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="md-component w-full"
        style={{
          ...styles,
          borderColor: error ? 'var(--md-error-main)' : 'var(--md-outline)'
        }}
        {...props}
      />
      {helperText && (
        <div 
          className="md-body-medium"
          style={{ 
            color: error ? 'var(--md-error-main)' : 'var(--md-on-surface-variant)' 
          }}
        >
          {helperText}
        </div>
      )}
    </div>
  );
};

export default MaterialDesignShowcase;
export { MaterialButton, MaterialCard, MaterialTextField };
