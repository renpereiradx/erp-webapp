/**
 * Mock Store for Testing
 * 
 * Creates mock implementations of stores for testing
 */

export const createMockStore = () => ({
  // Templates state
  templates: [],
  selectedTemplate: null,
  templateCategories: ['sales', 'products', 'customers', 'payments', 'custom'],
  
  // Fields and customization
  selectedFields: [],
  availableFields: [
    { id: 'revenue', name: 'Revenue', type: 'currency' },
    { id: 'orders', name: 'Orders', type: 'number' },
    { id: 'customers', name: 'Customers', type: 'number' },
    { id: 'date', name: 'Date', type: 'date' }
  ],
  fieldOrder: [],
  
  // Filters and options
  filters: {
    dateRange: '30d',
    categories: [],
    paymentMethods: [],
    customerSegments: []
  },
  customization: {
    title: '',
    description: '',
    groupBy: null,
    sortBy: 'date',
    sortOrder: 'desc'
  },
  
  // Export and generation
  exportFormat: 'pdf',
  exportOptions: {
    includeCharts: true,
    includeRawData: false,
    pageSize: 'A4',
    orientation: 'portrait'
  },
  
  // Report history and management
  reportHistory: [],
  scheduledReports: [],
  
  // UI state
  activeTab: 'templates',
  showPreview: false,
  isGenerating: false,
  error: null,
  
  // Actions (mocked)
  loadTemplates: () => Promise.resolve([]),
  loadReportHistory: () => Promise.resolve([]),
  setSelectedTemplate: () => {},
  addField: () => {},
  removeField: () => {},
  updateFieldOrder: () => {},
  setFilters: () => {},
  setCustomization: () => {},
  setExportFormat: () => {},
  setExportOptions: () => {},
  generateReport: () => Promise.resolve({}),
  deleteReport: () => Promise.resolve(),
  downloadReport: () => Promise.resolve(),
  setActiveTab: () => {},
  togglePreview: () => {},
  clearError: () => {},
  
  // Advanced features
  createCustomTemplate: () => Promise.resolve({}),
  saveTemplate: () => Promise.resolve({}),
  scheduleReport: () => Promise.resolve({}),
  updateSchedule: () => Promise.resolve({})
});

export const createMockReportsStore = (overrides = {}) => ({
  ...createMockStore(),
  ...overrides
});

export default { createMockStore, createMockReportsStore };
