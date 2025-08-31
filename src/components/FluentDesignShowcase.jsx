import React, { useState } from 'react';
// useTheme removido para MVP - sin hooks problemáticos
import { createFluentStyles, applyFluentMotion } from '../utils/fluentDesignUtils';

/**
 * Fluent Design System Showcase
 * Demonstrates the Fluent Design 2.0 system with various components
 */
const FluentDesignShowcase = () => {
  // Para MVP - tema fijo sin hooks problemáticos
  const theme = 'default';
  const isFluent = theme?.includes('fluent');

  if (!isFluent) {
    return null;
  }

  return (
    <div className="fluent-typography w-full max-w-6xl mx-auto p-6 space-y-8">
      {/* Typography Showcase */}
      <section className="space-y-4 fluent-motion-fade-in">
        <h1 className="fluent-display" style={{ color: 'var(--fluent-brand-primary)' }}>
          Fluent Design
        </h1>
        <h2 className="fluent-large-title">Typography System</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="fluent-title mb-3">Display & Title Styles</h3>
            <div className="fluent-large-title">Large Title</div>
            <div className="fluent-title">Title</div>
            <div className="fluent-subtitle">Subtitle</div>
          </div>
          <div className="space-y-3">
            <h3 className="fluent-title mb-3">Body & Caption Styles</h3>
            <div className="fluent-body-large">Body Large - Natural in every platform</div>
            <div className="fluent-body">Body - Built for focus and productivity</div>
            <div className="fluent-body-strong">Body Strong - One for all, all for one</div>
            <div className="fluent-caption">Caption - Supporting information</div>
            <div className="fluent-caption-strong">Caption Strong - Emphasized details</div>
          </div>
        </div>
      </section>

      {/* Color System */}
      <section className="space-y-4 fluent-motion-slide-up">
        <h2 className="fluent-large-title">Color System</h2>
        
        <div className="space-y-6">
          {/* Brand Colors */}
          <div>
            <h3 className="fluent-title mb-3">Brand Colors</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="fluent-brand-primary p-4 rounded-lg fluent-corner-large">
                <div className="fluent-body-strong">Primary</div>
                <div className="fluent-caption opacity-90">Brand identity</div>
              </div>
              <div 
                className="p-4 rounded-lg fluent-corner-large"
                style={{ 
                  backgroundColor: 'var(--fluent-brand-primary-hover)', 
                  color: 'var(--fluent-text-on-accent)' 
                }}
              >
                <div className="fluent-body-strong">Primary Hover</div>
                <div className="fluent-caption opacity-90">Interactive state</div>
              </div>
              <div 
                className="p-4 rounded-lg fluent-corner-large"
                style={{ 
                  backgroundColor: 'var(--fluent-brand-secondary)', 
                  color: 'var(--fluent-text-primary)' 
                }}
              >
                <div className="fluent-body-strong">Secondary</div>
                <div className="fluent-caption opacity-90">Support color</div>
              </div>
              <div 
                className="p-4 rounded-lg fluent-corner-large border"
                style={{ 
                  backgroundColor: 'var(--fluent-surface-card)', 
                  color: 'var(--fluent-text-primary)',
                  borderColor: 'var(--fluent-border-neutral)'
                }}
              >
                <div className="fluent-body-strong">Surface</div>
                <div className="fluent-caption opacity-70">Content surface</div>
              </div>
            </div>
          </div>

          {/* Semantic Colors */}
          <div>
            <h3 className="fluent-title mb-3">Semantic Colors</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="fluent-semantic-success p-4 rounded-lg fluent-corner-large">
                <div className="fluent-body-strong">Success</div>
                <div className="fluent-caption opacity-90">Positive feedback</div>
              </div>
              <div className="fluent-semantic-warning p-4 rounded-lg fluent-corner-large">
                <div className="fluent-body-strong" style={{ color: 'var(--fluent-text-primary)' }}>
                  Warning
                </div>
                <div className="fluent-caption opacity-70" style={{ color: 'var(--fluent-text-primary)' }}>
                  Caution state
                </div>
              </div>
              <div className="fluent-semantic-danger p-4 rounded-lg fluent-corner-large">
                <div className="fluent-body-strong">Danger</div>
                <div className="fluent-caption opacity-90">Error state</div>
              </div>
              <div 
                className="p-4 rounded-lg fluent-corner-large"
                style={{ 
                  backgroundColor: 'var(--fluent-semantic-info)', 
                  color: 'var(--fluent-text-on-accent)' 
                }}
              >
                <div className="fluent-body-strong">Info</div>
                <div className="fluent-caption opacity-90">Information</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Elevation System */}
      <section className="space-y-4 fluent-motion-scale-in">
        <h2 className="fluent-large-title">Elevation System</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[2, 4, 8, 16, 28, 64].map(level => (
            <div 
              key={level}
              className={`fluent-surface-card p-4 rounded-lg fluent-corner-large fluent-elevation-${level}`}
              style={{ 
                backgroundColor: 'var(--fluent-surface-card)', 
                color: 'var(--fluent-text-primary)' 
              }}
            >
              <div className="fluent-body-strong">Level {level}</div>
              <div className="fluent-caption opacity-70">Elevation</div>
            </div>
          ))}
        </div>
      </section>

      {/* Components Showcase */}
      <section className="space-y-6">
        <h2 className="fluent-large-title">Components</h2>
        
        {/* Buttons */}
        <div className="space-y-4">
          <h3 className="fluent-title">Buttons</h3>
          <div className="flex flex-wrap gap-4">
            <FluentButton appearance="primary">
              ✓ Primary Button
            </FluentButton>
            <FluentButton appearance="outline">
              ✎ Outline Button
            </FluentButton>
            <FluentButton appearance="subtle">
              ⚙ Subtle Button
            </FluentButton>
            <FluentButton appearance="transparent">
              ℹ Transparent Button
            </FluentButton>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <FluentButton appearance="primary" size="small">
              Small
            </FluentButton>
            <FluentButton appearance="primary" size="medium">
              Medium
            </FluentButton>
            <FluentButton appearance="primary" size="large">
              Large
            </FluentButton>
          </div>
        </div>

        {/* Cards */}
        <div className="space-y-4">
          <h3 className="fluent-title">Cards</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FluentCard elevation={2}>
              <div className="fluent-subtitle mb-2">Basic Card</div>
              <div className="fluent-body mb-3">
                This is a basic card with elevation level 2. Cards organize content into focused groups.
              </div>
              <div className="fluent-caption opacity-70">Updated 2 hours ago</div>
            </FluentCard>
            
            <FluentCard elevation={8} interactive>
              <div className="fluent-subtitle mb-2">Interactive Card</div>
              <div className="fluent-body mb-4">
                This card responds to hover and click interactions with smooth transitions.
              </div>
              <div className="flex gap-2">
                <FluentButton appearance="subtle" size="small">
                  View
                </FluentButton>
                <FluentButton appearance="transparent" size="small">
                  Edit
                </FluentButton>
              </div>
            </FluentCard>
            
            <FluentCard elevation={16}>
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center fluent-corner-circular"
                  style={{ 
                    backgroundColor: 'var(--fluent-brand-primary)', 
                    color: 'var(--fluent-text-on-accent)' 
                  }}
                >
                  👤
                </div>
                <div>
                  <div className="fluent-body-strong">User Profile</div>
                  <div className="fluent-caption opacity-70">Active now</div>
                </div>
              </div>
              <div className="fluent-body">
                Enhanced card with user information and high elevation for visual prominence.
              </div>
            </FluentCard>
          </div>
        </div>

        {/* Input Fields */}
        <div className="space-y-4">
          <h3 className="fluent-title">Input Fields</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FluentInput 
              label="Email address"
              placeholder="Enter your email"
              type="email"
            />
            <FluentInput 
              label="Password"
              placeholder="Enter your password"
              type="password"
            />
            <FluentInput 
              label="Search"
              placeholder="Search documents..."
              size="large"
            />
            <FluentInput 
              label="Error field"
              placeholder="This field has an error"
              error={true}
              helperText="Please enter a valid value"
            />
          </div>
        </div>

        {/* Status Cards */}
        <div className="space-y-4">
          <h3 className="fluent-title">Status Components</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatusCard 
              type="success" 
              title="Operation Complete" 
              description="Your changes have been saved successfully."
            />
            <StatusCard 
              type="warning" 
              title="Warning Notice" 
              description="Please review your settings before proceeding."
            />
            <StatusCard 
              type="danger" 
              title="Error Occurred" 
              description="Unable to process your request. Please try again."
            />
            <StatusCard 
              type="info" 
              title="Information" 
              description="New features are available in the latest update."
            />
          </div>
        </div>
      </section>

      {/* Spacing System */}
      <section className="space-y-4">
        <h2 className="fluent-large-title">Spacing System</h2>
        <div className="space-y-3">
          <p className="fluent-body">Fluent Design uses a token-based spacing system for consistent layouts:</p>
          {[20, 40, 80, 120, 160, 200, 240, 320, 480].map(spacing => (
            <div key={spacing} className="flex items-center gap-4">
              <div className="fluent-body-strong w-24">
                size{spacing}
              </div>
              <div 
                className="h-4"
                style={{ 
                  width: `var(--fluent-size-${spacing})`,
                  backgroundColor: 'var(--fluent-brand-primary)'
                }}
              />
              <div className="fluent-caption opacity-70">
                {spacing / 10}px
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

/**
 * Fluent Design Button Component
 */
const FluentButton = ({ 
  children, 
  appearance = 'primary', 
  size = 'medium',
  onClick,
  disabled = false,
  ...props 
}) => {
  const styles = createFluentStyles.button('default', size, appearance);
  
  return (
    <button
      className="fluent-component fluent-interactive"
      style={{
        ...styles,
        opacity: disabled ? 0.4 : 1,
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
 * Fluent Design Card Component
 */
const FluentCard = ({ children, elevation = 4, interactive = false, className = '', ...props }) => {
  const styles = createFluentStyles.card(elevation, interactive);
  
  return (
    <div
      className={`fluent-component ${interactive ? 'fluent-interactive' : ''} ${className}`}
      style={styles}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Fluent Design Input Component
 */
const FluentInput = ({ 
  label, 
  placeholder, 
  type = 'text',
  size = 'medium',
  value,
  onChange,
  error = false,
  helperText,
  ...props 
}) => {
  const styles = createFluentStyles.input(size, error);
  
  return (
    <div className="space-y-1">
      {label && (
        <label className="fluent-body-strong block" style={{ color: 'var(--fluent-text-primary)' }}>
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="fluent-component w-full"
        style={styles}
        {...props}
      />
      {helperText && (
        <div 
          className="fluent-caption"
          style={{ 
            color: error ? 'var(--fluent-semantic-danger)' : 'var(--fluent-text-secondary)' 
          }}
        >
          {helperText}
        </div>
      )}
    </div>
  );
};

/**
 * Status Card Component
 */
const StatusCard = ({ type, title, description }) => {
  const getStatusStyles = (type) => {
    const statusMap = {
      success: {
        backgroundColor: 'var(--fluent-semantic-success)',
        color: 'var(--fluent-text-on-accent)',
        icon: '✓'
      },
      warning: {
        backgroundColor: 'var(--fluent-semantic-warning)',
        color: 'var(--fluent-text-primary)',
        icon: '⚠'
      },
      danger: {
        backgroundColor: 'var(--fluent-semantic-danger)',
        color: 'var(--fluent-text-on-accent)',
        icon: '✕'
      },
      info: {
        backgroundColor: 'var(--fluent-semantic-info)',
        color: 'var(--fluent-text-on-accent)',
        icon: 'ℹ'
      }
    };
    return statusMap[type] || statusMap.info;
  };

  const statusStyles = getStatusStyles(type);

  return (
    <div 
      className="p-4 rounded-lg fluent-corner-large fluent-elevation-4"
      style={{ 
        backgroundColor: statusStyles.backgroundColor,
        color: statusStyles.color
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="fluent-body-strong">{statusStyles.icon}</span>
        <div className="fluent-body-strong">{title}</div>
      </div>
      <div className="fluent-caption opacity-90">
        {description}
      </div>
    </div>
  );
};

export default FluentDesignShowcase;
export { FluentButton, FluentCard, FluentInput, StatusCard };
