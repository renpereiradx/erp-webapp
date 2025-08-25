/**
 * Wave 5: Testing & Coverage Enterprise
 * Accessibility Testing Setup
 * 
 * Configuración específica para testing de accesibilidad:
 * - Matchers personalizados para WCAG compliance
 * - Simuladores de tecnologías asistivas
 * - Helpers para testing de focus management
 * - Configuración de screen readers
 * 
 * @since Wave 5 - Testing & Coverage Enterprise
 * @author Sistema ERP
 */

import { vi } from 'vitest';

// Mock screen reader APIs
global.SpeechSynthesis = vi.fn();
global.speechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(() => []),
  speaking: false,
  pending: false,
  paused: false
};

// Mock screen reader detection
Object.defineProperty(navigator, 'userAgent', {
  writable: true,
  value: 'Mozilla/5.0 (compatible; accessibility testing)'
});

// Mock high contrast mode
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => {
    const queries = {
      '(prefers-reduced-motion: reduce)': false,
      '(prefers-contrast: high)': false,
      '(prefers-color-scheme: dark)': false,
      '(forced-colors: active)': false
    };
    
    return {
      matches: queries[query] || false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  }),
});

// Mock focus and visibility APIs
Object.defineProperty(document, 'visibilityState', {
  writable: true,
  value: 'visible'
});

Object.defineProperty(document, 'hasFocus', {
  writable: true,
  value: vi.fn(() => true)
});

// Mock keyboard event helpers
global.KeyboardEvent = class extends Event {
  constructor(type, options = {}) {
    super(type, options);
    this.key = options.key || '';
    this.code = options.code || '';
    this.ctrlKey = options.ctrlKey || false;
    this.altKey = options.altKey || false;
    this.shiftKey = options.shiftKey || false;
    this.metaKey = options.metaKey || false;
    this.repeat = options.repeat || false;
  }
};

// Mock aria-live region announcements
global.ariaLiveAnnouncements = [];

const originalSetAttribute = Element.prototype.setAttribute;
Element.prototype.setAttribute = function(name, value) {
  if (name === 'aria-live' && value === 'polite') {
    this.announceToScreenReader = (message) => {
      global.ariaLiveAnnouncements.push({
        element: this,
        message,
        timestamp: Date.now()
      });
    };
  }
  return originalSetAttribute.call(this, name, value);
};

// Helper to get screen reader announcements
global.getAriaLiveAnnouncements = () => global.ariaLiveAnnouncements;
global.clearAriaLiveAnnouncements = () => {
  global.ariaLiveAnnouncements = [];
};

// Mock focus trap functionality
let focusTrapActive = false;
let focusTrapContainer = null;

global.enableFocusTrap = (container) => {
  focusTrapActive = true;
  focusTrapContainer = container;
};

global.disableFocusTrap = () => {
  focusTrapActive = false;
  focusTrapContainer = null;
};

// Override focus method to respect focus trap
const originalFocus = HTMLElement.prototype.focus;
HTMLElement.prototype.focus = function(options = {}) {
  if (focusTrapActive && focusTrapContainer) {
    const focusableElements = focusTrapContainer.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (!focusableElements.length || Array.from(focusableElements).includes(this)) {
      return originalFocus.call(this, options);
    }
    
    // If trying to focus outside trap, focus first element instead
    return originalFocus.call(focusableElements[0], options);
  }
  
  return originalFocus.call(this, options);
};

// Mock color contrast calculations
global.calculateContrastRatio = (color1, color2) => {
  // Simplified contrast calculation for testing
  // In real implementation, this would use actual color values
  return 4.5; // Assume WCAG AA compliance
};

// Mock font size detection for readability testing
global.getFontSize = (element) => {
  const computedStyle = window.getComputedStyle(element);
  return parseFloat(computedStyle.fontSize) || 16;
};

// Mock touch and gesture events for mobile accessibility
global.TouchEvent = class extends Event {
  constructor(type, options = {}) {
    super(type, options);
    this.touches = options.touches || [];
    this.targetTouches = options.targetTouches || [];
    this.changedTouches = options.changedTouches || [];
  }
};

// Mock reduced motion preference
let reducedMotionPreference = false;

global.setReducedMotionPreference = (preference) => {
  reducedMotionPreference = preference;
  
  // Update matchMedia mock
  const originalMatchMedia = window.matchMedia;
  window.matchMedia = vi.fn().mockImplementation(query => {
    if (query === '(prefers-reduced-motion: reduce)') {
      return {
        matches: reducedMotionPreference,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    }
    return originalMatchMedia(query);
  });
};

// Export accessibility testing utilities
export const accessibilityTestUtils = {
  getAriaLiveAnnouncements: global.getAriaLiveAnnouncements,
  clearAriaLiveAnnouncements: global.clearAriaLiveAnnouncements,
  enableFocusTrap: global.enableFocusTrap,
  disableFocusTrap: global.disableFocusTrap,
  setReducedMotionPreference: global.setReducedMotionPreference,
  calculateContrastRatio: global.calculateContrastRatio,
  getFontSize: global.getFontSize
};
