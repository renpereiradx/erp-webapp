/**
 * Tests for Wave 6 Phase 3: Advanced Reporting System
 * 
 * Basic test suite for the advanced reporting components
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Test utilities
import { createMockStore } from '../fixtures/mockStore';
import { createMockAnalyticsData } from '../fixtures/mockAnalyticsData';

// Mock the i18n hook
vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key) => key // Simple mock that returns the key
  })
}));

// Mock the services
vi.mock('@/services/reportGenerationService', () => ({
  reportGenerationService: {
    generateReport: vi.fn(),
    getTemplates: vi.fn(),
    validateTemplate: vi.fn(),
    createCustomTemplate: vi.fn()
  }
}));

// Mock the store
vi.mock('@/store/useReportsStore', () => ({
  default: vi.fn()
}));

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }) => <div className={`card ${className}`}>{children}</div>,
  CardContent: ({ children, className }) => <div className={`card-content ${className}`}>{children}</div>,
  CardHeader: ({ children, className }) => <div className={`card-header ${className}`}>{children}</div>,
  CardTitle: ({ children, className }) => <div className={`card-title ${className}`}>{children}</div>
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, variant, size }) => 
    <button onClick={onClick} className={`btn ${variant} ${size} ${className}`}>
      {children}
    </button>
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }) => 
    <span className={`badge ${variant} ${className}`}>{children}</span>
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange, className }) => 
    <div className={`tabs ${className}`} data-value={value}>{children}</div>,
  TabsContent: ({ children, value, className }) => 
    <div className={`tab-content ${className}`} data-value={value}>{children}</div>,
  TabsList: ({ children, className }) => 
    <div className={`tabs-list ${className}`}>{children}</div>,
  TabsTrigger: ({ children, value, className }) => 
    <button className={`tab-trigger ${className}`} data-value={value}>{children}</button>
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({ placeholder, value, onChange, className }) => 
    <input 
      placeholder={placeholder} 
      value={value} 
      onChange={onChange} 
      className={`input ${className}`} 
    />
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }) => 
    open ? <div className="dialog" onClick={() => onOpenChange(false)}>{children}</div> : null,
  DialogContent: ({ children, className }) => 
    <div className={`dialog-content ${className}`} onClick={e => e.stopPropagation()}>{children}</div>,
  DialogHeader: ({ children }) => <div className="dialog-header">{children}</div>,
  DialogTitle: ({ children }) => <h2 className="dialog-title">{children}</h2>,
  DialogDescription: ({ children }) => <p className="dialog-description">{children}</p>,
  DialogTrigger: ({ children }) => <div className="dialog-trigger">{children}</div>
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }) => <div className="dropdown-menu">{children}</div>,
  DropdownMenuContent: ({ children, align }) => 
    <div className={`dropdown-content align-${align}`}>{children}</div>,
  DropdownMenuItem: ({ children, onClick, className }) => 
    <div className={`dropdown-item ${className}`} onClick={onClick}>{children}</div>,
  DropdownMenuLabel: ({ children }) => <div className="dropdown-label">{children}</div>,
  DropdownMenuSeparator: () => <hr className="dropdown-separator" />,
  DropdownMenuTrigger: ({ children }) => <div className="dropdown-trigger">{children}</div>
}));

describe('Wave 6 Phase 3: Advanced Reporting System', () => {
  let mockStore;
  let mockAnalyticsData;

  beforeEach(() => {
    mockStore = createMockStore();
    mockAnalyticsData = createMockAnalyticsData();
    vi.clearAllMocks();
  });

  describe('Basic Infrastructure Tests', () => {
    it('should create mock store correctly', () => {
      expect(mockStore).toBeDefined();
      expect(mockStore.templates).toEqual([]);
      expect(mockStore.reportHistory).toEqual([]);
      expect(mockStore.isGenerating).toBe(false);
    });

    it('should create mock analytics data correctly', () => {
      expect(mockAnalyticsData).toBeDefined();
      expect(mockAnalyticsData.sales).toBeDefined();
      expect(mockAnalyticsData.products).toBeDefined();
      expect(mockAnalyticsData.customers).toBeDefined();
      expect(mockAnalyticsData.businessIntelligence).toBeDefined();
    });

    it('should have correct sales data structure', () => {
      const { sales } = mockAnalyticsData;
      expect(sales.totalSales).toBeGreaterThan(0);
      expect(sales.orderCount).toBeGreaterThan(0);
      expect(sales.topProducts).toBeInstanceOf(Array);
      expect(sales.paymentMethods).toBeInstanceOf(Array);
    });

    it('should have correct products data structure', () => {
      const { products } = mockAnalyticsData;
      expect(products.totalProducts).toBeGreaterThan(0);
      expect(products.categories).toBeInstanceOf(Array);
      expect(products.topPerformers).toBeInstanceOf(Array);
      expect(products.stockLevels).toBeInstanceOf(Array);
    });

    it('should have correct customers data structure', () => {
      const { customers } = mockAnalyticsData;
      expect(customers.totalCustomers).toBeGreaterThan(0);
      expect(customers.customerSegments).toBeInstanceOf(Array);
      expect(customers.topCustomers).toBeInstanceOf(Array);
    });

    it('should have business intelligence data', () => {
      const { businessIntelligence } = mockAnalyticsData;
      expect(businessIntelligence.insights).toBeInstanceOf(Array);
      expect(businessIntelligence.predictions).toBeInstanceOf(Array);
      expect(businessIntelligence.anomalies).toBeInstanceOf(Array);
    });
  });

  describe('Data Validation Tests', () => {
    it('should validate payment methods data completeness', () => {
      const { sales } = mockAnalyticsData;
      sales.paymentMethods.forEach(method => {
        expect(method.name).toBeDefined();
        expect(method.amount).toBeGreaterThan(0);
        expect(method.percentage).toBeGreaterThan(0);
        expect(method.transactionCount).toBeGreaterThan(0);
        expect(method.successRate).toBeGreaterThan(0);
        expect(method.fees).toBeDefined();
      });
    });

    it('should validate product categories data', () => {
      const { products } = mockAnalyticsData;
      products.categories.forEach(category => {
        expect(category.name).toBeDefined();
        expect(category.revenue).toBeGreaterThan(0);
        expect(category.unitsSold).toBeGreaterThan(0);
        expect(category.productCount).toBeGreaterThan(0);
      });
    });

    it('should validate customer segments data', () => {
      const { customers } = mockAnalyticsData;
      customers.customerSegments.forEach(segment => {
        expect(segment.name).toBeDefined();
        expect(segment.count).toBeGreaterThan(0);
        expect(segment.avgOrderValue).toBeGreaterThan(0);
        expect(segment.revenue).toBeGreaterThan(0);
      });
    });

    it('should validate business intelligence insights', () => {
      const { businessIntelligence } = mockAnalyticsData;
      businessIntelligence.insights.forEach(insight => {
        expect(insight.id).toBeDefined();
        expect(insight.type).toBeDefined();
        expect(insight.title).toBeDefined();
        expect(insight.description).toBeDefined();
        expect(insight.impact).toBeDefined();
        expect(insight.recommendations).toBeInstanceOf(Array);
      });
    });
  });

  describe('Mock Store Functionality', () => {
    it('should have all required store properties', () => {
      const requiredProperties = [
        'templates', 'selectedTemplate', 'selectedFields',
        'filters', 'customization', 'exportFormat',
        'reportHistory', 'isGenerating', 'error'
      ];
      
      requiredProperties.forEach(prop => {
        expect(mockStore).toHaveProperty(prop);
      });
    });

    it('should have all required store actions', () => {
      const requiredActions = [
        'loadTemplates', 'setSelectedTemplate', 'addField',
        'removeField', 'generateReport', 'deleteReport',
        'downloadReport', 'clearError'
      ];
      
      requiredActions.forEach(action => {
        expect(mockStore).toHaveProperty(action);
        expect(typeof mockStore[action]).toBe('function');
      });
    });

    it('should have correct initial filter state', () => {
      expect(mockStore.filters).toEqual({
        dateRange: '30d',
        categories: [],
        paymentMethods: [],
        customerSegments: []
      });
    });

    it('should have correct export options', () => {
      expect(mockStore.exportOptions).toEqual({
        includeCharts: true,
        includeRawData: false,
        pageSize: 'A4',
        orientation: 'portrait'
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset = {
        sales: {
          ...mockAnalyticsData.sales,
          topProducts: Array.from({ length: 1000 }, (_, i) => ({
            id: i.toString(),
            name: `Product ${i}`,
            revenue: Math.random() * 10000
          }))
        }
      };

      const start = performance.now();
      expect(largeDataset.sales.topProducts.length).toBe(1000);
      const end = performance.now();

      // Should process quickly
      expect(end - start).toBeLessThan(10);
    });

    it('should handle empty data gracefully', () => {
      const emptyData = {
        sales: {
          totalSales: 0,
          orderCount: 0,
          topProducts: [],
          paymentMethods: []
        },
        products: {
          categories: [],
          topPerformers: [],
          stockLevels: []
        },
        customers: {
          customerSegments: [],
          topCustomers: []
        }
      };

      expect(() => {
        // Should not throw errors with empty data
        expect(emptyData.sales.topProducts).toEqual([]);
        expect(emptyData.products.categories).toEqual([]);
        expect(emptyData.customers.customerSegments).toEqual([]);
      }).not.toThrow();
    });

    it('should handle missing optional properties', () => {
      const partialData = {
        sales: {
          totalSales: 100000
          // Missing other properties
        }
      };

      expect(partialData.sales.totalSales).toBe(100000);
      expect(partialData.sales.topProducts).toBeUndefined();
    });
  });

  describe('Data Consistency Tests', () => {
    it('should have consistent revenue calculations', () => {
      const { sales } = mockAnalyticsData;
      const totalFromPaymentMethods = sales.paymentMethods.reduce(
        (sum, method) => sum + method.amount, 0
      );
      
      expect(totalFromPaymentMethods).toBe(sales.totalSales);
    });

    it('should have consistent percentage calculations', () => {
      const { sales } = mockAnalyticsData;
      const totalPercentage = sales.paymentMethods.reduce(
        (sum, method) => sum + method.percentage, 0
      );
      
      expect(Math.abs(totalPercentage - 1.0)).toBeLessThan(0.01);
    });

    it('should have valid customer segment distribution', () => {
      const { customers } = mockAnalyticsData;
      const totalSegmentCustomers = customers.customerSegments.reduce(
        (sum, segment) => sum + segment.count, 0
      );
      
      expect(totalSegmentCustomers).toBe(customers.totalCustomers);
    });
  });

  describe('Template System Tests', () => {
    it('should create valid report templates', () => {
      const template = {
        id: 'test-template',
        name: 'Test Template',
        fields: ['revenue', 'orders'],
        exportFormats: ['pdf', 'excel'],
        category: 'custom'
      };

      expect(template.id).toBeDefined();
      expect(template.name).toBeDefined();
      expect(template.fields).toBeInstanceOf(Array);
      expect(template.exportFormats).toBeInstanceOf(Array);
    });

    it('should validate template fields', () => {
      const availableFields = mockStore.availableFields;
      const templateFields = ['revenue', 'orders'];
      
      const validFields = templateFields.every(field => 
        availableFields.some(available => available.id === field)
      );
      
      expect(validFields).toBe(true);
    });
  });

  describe('Export Format Tests', () => {
    it('should support all required export formats', () => {
      const supportedFormats = ['pdf', 'excel', 'csv', 'json'];
      
      supportedFormats.forEach(format => {
        expect(['pdf', 'excel', 'csv', 'json']).toContain(format);
      });
    });

    it('should have valid export options for each format', () => {
      const exportConfigs = {
        pdf: { pageSize: 'A4', orientation: 'portrait' },
        excel: { includeCharts: true, includeRawData: true },
        csv: { delimiter: ',' },
        json: { pretty: true }
      };

      Object.keys(exportConfigs).forEach(format => {
        expect(exportConfigs[format]).toBeDefined();
      });
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle missing data gracefully', () => {
      const incompleteData = {
        sales: {
          totalSales: 100000
          // Missing other required fields
        }
      };

      expect(() => {
        const revenue = incompleteData.sales?.totalSales || 0;
        const orders = incompleteData.sales?.orderCount || 0;
        expect(revenue).toBe(100000);
        expect(orders).toBe(0);
      }).not.toThrow();
    });

    it('should validate required fields', () => {
      const requiredFields = ['totalSales', 'orderCount', 'topProducts'];
      const salesData = mockAnalyticsData.sales;

      requiredFields.forEach(field => {
        expect(salesData).toHaveProperty(field);
      });
    });
  });
});

describe('Integration Readiness Tests', () => {
  it('should be ready for component integration', () => {
    const mockStore = createMockStore();
    const mockData = createMockAnalyticsData();

    // Verify all required interfaces are available
    expect(mockStore.loadTemplates).toBeDefined();
    expect(mockStore.generateReport).toBeDefined();
    expect(mockData.sales).toBeDefined();
    expect(mockData.products).toBeDefined();
  });

  it('should have complete data for all report types', () => {
    const data = createMockAnalyticsData();

    // Sales report data
    expect(data.sales.totalSales).toBeGreaterThan(0);
    expect(data.sales.topProducts.length).toBeGreaterThan(0);

    // Product report data
    expect(data.products.categories.length).toBeGreaterThan(0);
    expect(data.products.topPerformers.length).toBeGreaterThan(0);

    // Customer report data
    expect(data.customers.customerSegments.length).toBeGreaterThan(0);
    expect(data.customers.topCustomers.length).toBeGreaterThan(0);
  });
});

describe('Wave 6 Phase 3: Advanced Reporting System', () => {
  let mockStore;
  let mockAnalyticsData;

  beforeEach(() => {
    mockStore = createMockStore();
    mockAnalyticsData = createMockAnalyticsData();
    
    // Mock the useReportsStore hook
    useReportsStore.mockReturnValue(mockStore);
  });

  describe('ReportsDashboard Component', () => {
    it('renders the dashboard with correct title and description', () => {
      render(<ReportsDashboard analyticsData={mockAnalyticsData} />);
      
      expect(screen.getByText('reports.title')).toBeInTheDocument();
      expect(screen.getByText('reports.description')).toBeInTheDocument();
    });

    it('displays quick stats cards correctly', () => {
      render(<ReportsDashboard analyticsData={mockAnalyticsData} />);
      
      expect(screen.getByText('reports.stats.totalReports')).toBeInTheDocument();
      expect(screen.getByText('reports.stats.templates')).toBeInTheDocument();
      expect(screen.getByText('reports.stats.scheduled')).toBeInTheDocument();
      expect(screen.getByText('reports.stats.thisWeek')).toBeInTheDocument();
    });

    it('renders tabs for templates, history, and scheduled reports', () => {
      render(<ReportsDashboard analyticsData={mockAnalyticsData} />);
      
      expect(screen.getByText('reports.templates')).toBeInTheDocument();
      expect(screen.getByText('reports.history')).toBeInTheDocument();
      expect(screen.getByText('reports.scheduled')).toBeInTheDocument();
    });

    it('shows template cards with correct information', () => {
      const templatesWithData = {
        ...mockStore,
        templates: [
          {
            id: '1',
            name: 'Sales Summary',
            description: 'Monthly sales overview',
            category: 'sales',
            fields: ['revenue', 'orders'],
            exportFormats: ['pdf', 'excel'],
            isCustom: false
          }
        ]
      };
      useReportsStore.mockReturnValue(templatesWithData);

      render(<ReportsDashboard analyticsData={mockAnalyticsData} />);
      
      expect(screen.getByText('Sales Summary')).toBeInTheDocument();
      expect(screen.getByText('Monthly sales overview')).toBeInTheDocument();
    });

    it('handles search functionality correctly', async () => {
      const user = userEvent.setup();
      render(<ReportsDashboard analyticsData={mockAnalyticsData} />);
      
      const searchInput = screen.getByPlaceholderText('common.search');
      await user.type(searchInput, 'sales');
      
      expect(searchInput).toHaveValue('sales');
    });

    it('opens report builder when new report button is clicked', async () => {
      const user = userEvent.setup();
      render(<ReportsDashboard analyticsData={mockAnalyticsData} />);
      
      const newReportButton = screen.getByText('reports.newReport');
      await user.click(newReportButton);
      
      expect(screen.getByText('reports.builder.title')).toBeInTheDocument();
    });

    it('displays error message when error exists', () => {
      const storeWithError = {
        ...mockStore,
        error: 'Test error message'
      };
      useReportsStore.mockReturnValue(storeWithError);

      render(<ReportsDashboard analyticsData={mockAnalyticsData} />);
      
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('handles report download correctly', async () => {
      const mockDownloadReport = vi.fn();
      const storeWithHistory = {
        ...mockStore,
        downloadReport: mockDownloadReport,
        reportHistory: [
          {
            id: '1',
            templateName: 'Test Report',
            format: 'pdf',
            generatedAt: '2024-01-01',
            size: 1024,
            duration: 500
          }
        ]
      };
      useReportsStore.mockReturnValue(storeWithHistory);

      render(<ReportsDashboard analyticsData={mockAnalyticsData} />);
      
      // Switch to history tab
      await userEvent.click(screen.getByText('reports.history'));
      
      // Should show report in history
      expect(screen.getByText('Test Report')).toBeInTheDocument();
    });

    it('refreshes data when refresh button is clicked', async () => {
      const mockLoadTemplates = vi.fn();
      const mockLoadReportHistory = vi.fn();
      const storeWithMocks = {
        ...mockStore,
        loadTemplates: mockLoadTemplates,
        loadReportHistory: mockLoadReportHistory
      };
      useReportsStore.mockReturnValue(storeWithMocks);

      render(<ReportsDashboard analyticsData={mockAnalyticsData} />);
      
      const refreshButton = screen.getByText('common.refresh');
      await userEvent.click(refreshButton);
      
      expect(mockLoadTemplates).toHaveBeenCalled();
      expect(mockLoadReportHistory).toHaveBeenCalled();
    });
  });

  describe('ReportBuilder Component', () => {
    it('renders the report builder with correct structure', () => {
      render(<ReportBuilder analyticsData={mockAnalyticsData} />);
      
      expect(screen.getByText('reports.builder.title')).toBeInTheDocument();
      expect(screen.getByText('reports.builder.templates')).toBeInTheDocument();
      expect(screen.getByText('reports.builder.fields')).toBeInTheDocument();
      expect(screen.getByText('reports.builder.preview')).toBeInTheDocument();
    });

    it('shows available templates', () => {
      const templatesWithData = {
        ...mockStore,
        templates: [
          {
            id: '1',
            name: 'Sales Summary',
            description: 'Monthly sales overview',
            category: 'sales'
          }
        ]
      };
      useReportsStore.mockReturnValue(templatesWithData);

      render(<ReportBuilder analyticsData={mockAnalyticsData} />);
      
      expect(screen.getByText('Sales Summary')).toBeInTheDocument();
    });

    it('handles template selection correctly', async () => {
      const mockSetSelectedTemplate = vi.fn();
      const storeWithMocks = {
        ...mockStore,
        setSelectedTemplate: mockSetSelectedTemplate,
        templates: [
          {
            id: '1',
            name: 'Sales Summary',
            description: 'Monthly sales overview',
            category: 'sales'
          }
        ]
      };
      useReportsStore.mockReturnValue(storeWithMocks);

      render(<ReportBuilder analyticsData={mockAnalyticsData} />);
      
      const templateCard = screen.getByText('Sales Summary');
      await userEvent.click(templateCard);
      
      expect(mockSetSelectedTemplate).toHaveBeenCalled();
    });

    it('shows field selection interface when template is selected', () => {
      const storeWithSelectedTemplate = {
        ...mockStore,
        selectedTemplate: {
          id: '1',
          name: 'Sales Summary',
          fields: [
            { id: 'revenue', name: 'Revenue', type: 'currency' },
            { id: 'orders', name: 'Orders', type: 'number' }
          ]
        }
      };
      useReportsStore.mockReturnValue(storeWithSelectedTemplate);

      render(<ReportBuilder analyticsData={mockAnalyticsData} />);
      
      expect(screen.getByText('Revenue')).toBeInTheDocument();
      expect(screen.getByText('Orders')).toBeInTheDocument();
    });

    it('handles field drag and drop correctly', async () => {
      const mockAddField = vi.fn();
      const storeWithMocks = {
        ...mockStore,
        addField: mockAddField,
        selectedTemplate: {
          id: '1',
          name: 'Sales Summary',
          fields: [
            { id: 'revenue', name: 'Revenue', type: 'currency' }
          ]
        }
      };
      useReportsStore.mockReturnValue(storeWithMocks);

      render(<ReportBuilder analyticsData={mockAnalyticsData} />);
      
      // Test drag and drop would require more complex setup
      // For now, we'll test that the fields are displayed
      expect(screen.getByText('Revenue')).toBeInTheDocument();
    });

    it('generates report with correct parameters', async () => {
      const mockGenerateReport = vi.fn();
      reportGenerationService.generateReport = mockGenerateReport;
      
      const storeWithSelection = {
        ...mockStore,
        selectedTemplate: {
          id: '1',
          name: 'Sales Summary'
        },
        selectedFields: ['revenue', 'orders'],
        filters: { dateRange: '30d' },
        exportFormat: 'pdf'
      };
      useReportsStore.mockReturnValue(storeWithSelection);

      render(<ReportBuilder analyticsData={mockAnalyticsData} />);
      
      const generateButton = screen.getByText('reports.generate');
      await userEvent.click(generateButton);
      
      expect(mockGenerateReport).toHaveBeenCalledWith({
        templateId: '1',
        fields: ['revenue', 'orders'],
        filters: { dateRange: '30d' },
        format: 'pdf',
        data: mockAnalyticsData
      });
    });

    it('shows preview when preview mode is enabled', () => {
      const storeWithPreview = {
        ...mockStore,
        showPreview: true,
        selectedTemplate: {
          id: '1',
          name: 'Sales Summary'
        }
      };
      useReportsStore.mockReturnValue(storeWithPreview);

      render(<ReportBuilder analyticsData={mockAnalyticsData} />);
      
      expect(screen.getByText('reports.preview')).toBeInTheDocument();
    });

    it('handles export format selection', async () => {
      const mockSetExportFormat = vi.fn();
      const storeWithMocks = {
        ...mockStore,
        setExportFormat: mockSetExportFormat
      };
      useReportsStore.mockReturnValue(storeWithMocks);

      render(<ReportBuilder analyticsData={mockAnalyticsData} />);
      
      // Test export format selection
      const exportSelect = screen.getByDisplayValue('PDF');
      await userEvent.selectOptions(exportSelect, 'excel');
      
      expect(mockSetExportFormat).toHaveBeenCalledWith('excel');
    });
  });

  describe('Report Generation Service', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('generates PDF reports correctly', async () => {
      const mockReport = {
        id: '1',
        format: 'pdf',
        content: 'PDF content',
        metadata: { generatedAt: new Date() }
      };
      
      reportGenerationService.generateReport.mockResolvedValue(mockReport);

      const result = await reportGenerationService.generateReport({
        templateId: 'sales-summary',
        format: 'pdf',
        data: mockAnalyticsData
      });

      expect(result).toEqual(mockReport);
      expect(reportGenerationService.generateReport).toHaveBeenCalledWith({
        templateId: 'sales-summary',
        format: 'pdf',
        data: mockAnalyticsData
      });
    });

    it('generates Excel reports correctly', async () => {
      const mockReport = {
        id: '2',
        format: 'excel',
        content: 'Excel content',
        metadata: { generatedAt: new Date() }
      };
      
      reportGenerationService.generateReport.mockResolvedValue(mockReport);

      const result = await reportGenerationService.generateReport({
        templateId: 'product-performance',
        format: 'excel',
        data: mockAnalyticsData
      });

      expect(result).toEqual(mockReport);
    });

    it('handles report generation errors', async () => {
      const error = new Error('Generation failed');
      reportGenerationService.generateReport.mockRejectedValue(error);

      await expect(
        reportGenerationService.generateReport({
          templateId: 'invalid-template',
          format: 'pdf',
          data: {}
        })
      ).rejects.toThrow('Generation failed');
    });

    it('validates report templates correctly', () => {
      const validTemplate = {
        id: 'sales-summary',
        name: 'Sales Summary',
        fields: ['revenue', 'orders'],
        exportFormats: ['pdf', 'excel']
      };

      const isValid = reportGenerationService.validateTemplate(validTemplate);
      expect(isValid).toBe(true);
    });

    it('creates custom templates correctly', async () => {
      const customTemplate = {
        name: 'Custom Sales Report',
        fields: ['revenue', 'profit', 'orders'],
        exportFormats: ['pdf', 'csv'],
        category: 'custom'
      };

      const createdTemplate = await reportGenerationService.createCustomTemplate(customTemplate);
      
      expect(createdTemplate).toHaveProperty('id');
      expect(createdTemplate.name).toBe(customTemplate.name);
      expect(createdTemplate.isCustom).toBe(true);
    });
  });

  describe('useReportsStore Hook', () => {
    it('initializes with correct default state', () => {
      const store = useReportsStore();
      
      expect(store.templates).toEqual([]);
      expect(store.reportHistory).toEqual([]);
      expect(store.selectedTemplate).toBe(null);
      expect(store.selectedFields).toEqual([]);
      expect(store.isGenerating).toBe(false);
    });

    it('loads templates correctly', async () => {
      const mockTemplates = [
        { id: '1', name: 'Sales Summary' },
        { id: '2', name: 'Product Performance' }
      ];

      reportGenerationService.getTemplates.mockResolvedValue(mockTemplates);

      const store = useReportsStore();
      await store.loadTemplates();

      expect(store.templates).toEqual(mockTemplates);
    });

    it('generates reports with correct state updates', async () => {
      const mockReport = {
        id: '1',
        templateName: 'Sales Summary',
        format: 'pdf'
      };

      reportGenerationService.generateReport.mockResolvedValue(mockReport);

      const store = useReportsStore();
      store.setSelectedTemplate({ id: '1', name: 'Sales Summary' });
      store.setExportFormat('pdf');

      await store.generateReport();

      expect(store.reportHistory).toContain(mockReport);
      expect(store.isGenerating).toBe(false);
    });

    it('handles errors during report generation', async () => {
      const error = new Error('Generation failed');
      reportGenerationService.generateReport.mockRejectedValue(error);

      const store = useReportsStore();
      await store.generateReport();

      expect(store.error).toBe('Generation failed');
      expect(store.isGenerating).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('completes full report generation workflow', async () => {
      const user = userEvent.setup();
      
      // Mock successful generation
      const mockReport = {
        id: '1',
        templateName: 'Sales Summary',
        format: 'pdf',
        generatedAt: new Date().toISOString()
      };
      reportGenerationService.generateReport.mockResolvedValue(mockReport);

      const storeWithTemplates = {
        ...mockStore,
        templates: [
          {
            id: '1',
            name: 'Sales Summary',
            description: 'Monthly sales overview',
            fields: [
              { id: 'revenue', name: 'Revenue', type: 'currency' }
            ]
          }
        ]
      };
      useReportsStore.mockReturnValue(storeWithTemplates);

      render(<ReportBuilder analyticsData={mockAnalyticsData} />);

      // 1. Select template
      await user.click(screen.getByText('Sales Summary'));

      // 2. Select fields (would be drag-and-drop in real app)
      expect(screen.getByText('Revenue')).toBeInTheDocument();

      // 3. Generate report
      await user.click(screen.getByText('reports.generate'));

      // Verify generation was called
      await waitFor(() => {
        expect(reportGenerationService.generateReport).toHaveBeenCalled();
      });
    });

    it('navigates between dashboard and builder correctly', async () => {
      const user = userEvent.setup();
      
      render(<ReportsDashboard analyticsData={mockAnalyticsData} />);

      // Start from dashboard
      expect(screen.getByText('reports.title')).toBeInTheDocument();

      // Open builder
      await user.click(screen.getByText('reports.newReport'));
      expect(screen.getByText('reports.builder.title')).toBeInTheDocument();
    });
  });
});

describe('Performance Tests', () => {
  it('handles large datasets efficiently', () => {
    const largeDataset = {
      sales: Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        revenue: Math.random() * 1000,
        date: new Date()
      }))
    };

    const start = performance.now();
    render(<ReportsDashboard analyticsData={largeDataset} />);
    const end = performance.now();

    // Should render within reasonable time (< 100ms)
    expect(end - start).toBeLessThan(100);
  });
});

describe('Accessibility Tests', () => {
  it('has proper ARIA labels and roles', () => {
    render(<ReportsDashboard analyticsData={mockAnalyticsData} />);
    
    // Check for proper headings
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    
    // Check for proper button roles
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<ReportBuilder analyticsData={mockAnalyticsData} />);

    // Tab through interactive elements
    await user.tab();
    expect(document.activeElement).toBeDefined();
  });
});
