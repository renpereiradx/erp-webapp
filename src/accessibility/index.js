/**
 * Wave 4: UX & Accessibility Enterprise - Hooks Index
 * Exportaciones centralizadas de hooks de accesibilidad
 * 
 * @since Wave 4 - UX & Accessibility
 * @author Sistema ERP
 */

// Focus Management
export { useFocusManagement } from './useFocusManagement';

// Live Regions & Announcements  
export { useLiveRegion, LiveRegion } from './useLiveRegion';

// Accessible Forms
export { useAccessibleForm } from './useAccessibleForm';

// Re-export existing accessibility hooks
export { useA11yAnnouncer } from './hooks';

/**
 * Hook compuesto para características de accesibilidad completas
 * Combina focus management, live regions y anuncios
 */
export const useAccessibility = (options = {}) => {
  const {
    enableFocusManagement = true,
    enableLiveRegions = true,
    enableTelemetry = true,
    debugMode = false
  } = options;

  const focusManagement = enableFocusManagement ? useFocusManagement({
    enableTelemetry,
    debugMode
  }) : null;

  const liveRegion = enableLiveRegions ? useLiveRegion({
    enableTelemetry,
    debugMode
  }) : null;

  return {
    // Focus management
    ...(focusManagement && {
      saveFocus: focusManagement.saveFocus,
      restoreFocus: focusManagement.restoreFocus,
      setupFocusTrap: focusManagement.setupFocusTrap,
      useArrowNavigation: focusManagement.useArrowNavigation
    }),

    // Live regions
    ...(liveRegion && {
      announce: liveRegion.announce,
      announceLoading: liveRegion.announceLoading,
      announceSuccess: liveRegion.announceSuccess,
      announceError: liveRegion.announceError,
      announceWarning: liveRegion.announceWarning,
      liveRegionProps: liveRegion.liveRegionProps
    }),

    // Estado combinado
    isAccessibilityReady: !!(focusManagement || liveRegion)
  };
};

// Tipos de politeness para live regions
export const LIVE_REGION_POLITENESS = {
  POLITE: 'polite',
  ASSERTIVE: 'assertive',
  OFF: 'off'
};

// Constantes para ARIA roles comunes
export const ARIA_ROLES = {
  ALERT: 'alert',
  ALERTDIALOG: 'alertdialog',
  APPLICATION: 'application',
  ARTICLE: 'article',
  BANNER: 'banner',
  BUTTON: 'button',
  CELL: 'cell',
  CHECKBOX: 'checkbox',
  COLUMNHEADER: 'columnheader',
  COMBOBOX: 'combobox',
  COMPLEMENTARY: 'complementary',
  CONTENTINFO: 'contentinfo',
  DIALOG: 'dialog',
  DOCUMENT: 'document',
  FEED: 'feed',
  FIGURE: 'figure',
  FORM: 'form',
  GRID: 'grid',
  GRIDCELL: 'gridcell',
  GROUP: 'group',
  HEADING: 'heading',
  IMG: 'img',
  LINK: 'link',
  LIST: 'list',
  LISTBOX: 'listbox',
  LISTITEM: 'listitem',
  MAIN: 'main',
  MENU: 'menu',
  MENUBAR: 'menubar',
  MENUITEM: 'menuitem',
  NAVIGATION: 'navigation',
  OPTION: 'option',
  PRESENTATION: 'presentation',
  PROGRESSBAR: 'progressbar',
  RADIO: 'radio',
  RADIOGROUP: 'radiogroup',
  REGION: 'region',
  ROW: 'row',
  ROWGROUP: 'rowgroup',
  ROWHEADER: 'rowheader',
  SEARCH: 'search',
  SEARCHBOX: 'searchbox',
  SEPARATOR: 'separator',
  SLIDER: 'slider',
  SPINBUTTON: 'spinbutton',
  STATUS: 'status',
  SWITCH: 'switch',
  TAB: 'tab',
  TABLE: 'table',
  TABLIST: 'tablist',
  TABPANEL: 'tabpanel',
  TEXTBOX: 'textbox',
  TIMER: 'timer',
  TOOLBAR: 'toolbar',
  TOOLTIP: 'tooltip',
  TREE: 'tree',
  TREEITEM: 'treeitem'
};

export default {
  useFocusManagement,
  useLiveRegion,
  useAccessibleForm,
  useAccessibility,
  LIVE_REGION_POLITENESS,
  ARIA_ROLES
};
