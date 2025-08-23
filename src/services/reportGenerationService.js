/**
 * Report Generation Service
 * Wave 6: Advanced Analytics & Reporting - Phase 3
 * 
 * Advanced report generation with multiple export formats,
 * custom templates, and scheduled reporting capabilities
 */

import { formatCurrency, formatNumber, formatPercentage, formatDate } from '@/utils/formatting';
import { validateAnalyticsData, validateDateRange } from '@/utils/validation';
import telemetryService from '@/services/telemetryService';

class ReportGenerationService {
  constructor() {
    this.templates = new Map();
    this.reportHistory = [];
    this.maxHistoryEntries = 100;
    this.supportedFormats = ['pdf', 'excel', 'csv', 'json'];
    this.reportQueue = [];
    this.isProcessing = false;
    
    this.initializeDefaultTemplates();
  }

  /**
   * Initialize default report templates
   */
  initializeDefaultTemplates() {
    const defaultTemplates = [
      {
        id: 'sales-summary',
        name: 'Resumen de Ventas',
        description: 'Reporte completo de ventas por período',
        category: 'sales',
        fields: [
          { id: 'totalRevenue', label: 'Ingresos Totales', type: 'currency', required: true },
          { id: 'totalSales', label: 'Total de Ventas', type: 'number', required: true },
          { id: 'averageTicket', label: 'Ticket Promedio', type: 'currency', required: true },
          { id: 'topProducts', label: 'Productos Top', type: 'array', required: false },
          { id: 'salesTrends', label: 'Tendencias', type: 'chart', required: false }
        ],
        layout: 'standard',
        exportFormats: ['pdf', 'excel', 'csv']
      },
      {
        id: 'product-performance',
        name: 'Rendimiento de Productos',
        description: 'Análisis detallado del rendimiento por producto',
        category: 'products',
        fields: [
          { id: 'productSales', label: 'Ventas por Producto', type: 'table', required: true },
          { id: 'categoryAnalysis', label: 'Análisis por Categoría', type: 'chart', required: true },
          { id: 'inventoryTurnover', label: 'Rotación de Inventario', type: 'number', required: false },
          { id: 'profitMargins', label: 'Márgenes de Ganancia', type: 'percentage', required: false }
        ],
        layout: 'detailed',
        exportFormats: ['pdf', 'excel']
      },
      {
        id: 'customer-analysis',
        name: 'Análisis de Clientes',
        description: 'Comportamiento y segmentación de clientes',
        category: 'customers',
        fields: [
          { id: 'customerSegments', label: 'Segmentos de Clientes', type: 'chart', required: true },
          { id: 'purchaseFrequency', label: 'Frecuencia de Compra', type: 'number', required: true },
          { id: 'customerLifetimeValue', label: 'Valor de Vida del Cliente', type: 'currency', required: true },
          { id: 'churnRate', label: 'Tasa de Abandono', type: 'percentage', required: false }
        ],
        layout: 'analytics',
        exportFormats: ['pdf', 'excel', 'csv']
      },
      {
        id: 'payment-methods',
        name: 'Métodos de Pago',
        description: 'Análisis de métodos de pago utilizados',
        category: 'payments',
        fields: [
          { id: 'paymentDistribution', label: 'Distribución de Pagos', type: 'chart', required: true },
          { id: 'transactionFees', label: 'Comisiones por Transacción', type: 'currency', required: true },
          { id: 'paymentTrends', label: 'Tendencias de Pago', type: 'chart', required: false }
        ],
        layout: 'standard',
        exportFormats: ['pdf', 'csv']
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * Get available report templates
   */
  getTemplates(category = null) {
    const templates = Array.from(this.templates.values());
    
    if (category) {
      return templates.filter(template => template.category === category);
    }
    
    return templates;
  }

  /**
   * Get specific template by ID
   */
  getTemplate(templateId) {
    return this.templates.get(templateId);
  }

  /**
   * Create custom template
   */
  createCustomTemplate(templateData) {
    const validation = this.validateTemplateData(templateData);
    if (!validation.isValid) {
      throw new Error(`Invalid template data: ${validation.errors.join(', ')}`);
    }

    const template = {
      id: templateData.id || `custom-${Date.now()}`,
      name: templateData.name,
      description: templateData.description || '',
      category: templateData.category || 'custom',
      fields: templateData.fields,
      layout: templateData.layout || 'standard',
      exportFormats: templateData.exportFormats || ['pdf', 'excel'],
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    this.templates.set(template.id, template);
    
    telemetryService.trackEvent('report_template_created', {
      templateId: template.id,
      category: template.category,
      fieldsCount: template.fields.length
    });

    return template;
  }

  /**
   * Generate report
   */
  async generateReport(options) {
    const startTime = performance.now();
    
    try {
      const validation = this.validateReportOptions(options);
      if (!validation.isValid) {
        throw new Error(`Invalid report options: ${validation.errors.join(', ')}`);
      }

      const {
        templateId,
        data,
        format = 'pdf',
        filters = {},
        customization = {}
      } = options;

      const template = this.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Validate data against template requirements
      const dataValidation = this.validateReportData(data, template);
      if (!dataValidation.isValid) {
        throw new Error(`Invalid data: ${dataValidation.errors.join(', ')}`);
      }

      // Process data according to template
      const processedData = this.processReportData(data, template, filters);

      // Generate report based on format
      let reportContent;
      switch (format.toLowerCase()) {
        case 'pdf':
          reportContent = await this.generatePDFReport(processedData, template, customization);
          break;
        case 'excel':
          reportContent = await this.generateExcelReport(processedData, template, customization);
          break;
        case 'csv':
          reportContent = await this.generateCSVReport(processedData, template, customization);
          break;
        case 'json':
          reportContent = this.generateJSONReport(processedData, template, customization);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      const duration = performance.now() - startTime;
      
      // Create report metadata
      const report = {
        id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        templateId,
        templateName: template.name,
        format,
        generatedAt: new Date().toISOString(),
        duration,
        size: this.calculateContentSize(reportContent),
        filters,
        customization,
        content: reportContent
      };

      // Add to history
      this.addToHistory(report);

      // Track generation
      telemetryService.trackEvent('report_generated', {
        templateId,
        format,
        duration,
        size: report.size
      });

      return report;

    } catch (error) {
      const duration = performance.now() - startTime;
      
      telemetryService.trackError(error, {
        operation: 'report_generation',
        templateId: options.templateId,
        format: options.format,
        duration
      });
      
      throw error;
    }
  }

  /**
   * Generate PDF report
   */
  async generatePDFReport(data, template, customization) {
    // In a real implementation, this would use a PDF library like jsPDF or Puppeteer
    const pdfContent = {
      type: 'pdf',
      metadata: {
        title: template.name,
        author: 'ERP Analytics System',
        subject: template.description,
        createdAt: new Date().toISOString()
      },
      pages: [],
      styles: {
        fontSize: customization.fontSize || 12,
        fontFamily: customization.fontFamily || 'Arial',
        colors: {
          primary: customization.primaryColor || '#2563eb',
          secondary: customization.secondaryColor || '#64748b'
        }
      }
    };

    // Generate header page
    pdfContent.pages.push({
      type: 'header',
      content: {
        title: template.name,
        subtitle: template.description,
        generatedAt: formatDate(new Date()),
        logo: customization.logo || null
      }
    });

    // Generate content pages based on template fields
    template.fields.forEach(field => {
      if (data[field.id] !== undefined) {
        const page = this.createPDFPage(field, data[field.id], customization);
        pdfContent.pages.push(page);
      }
    });

    // Generate summary page
    if (customization.includeSummary !== false) {
      pdfContent.pages.push({
        type: 'summary',
        content: this.generateReportSummary(data, template)
      });
    }

    return pdfContent;
  }

  /**
   * Generate Excel report
   */
  async generateExcelReport(data, template, customization) {
    // In a real implementation, this would use a library like ExcelJS
    const excelContent = {
      type: 'excel',
      workbook: {
        properties: {
          title: template.name,
          subject: template.description,
          creator: 'ERP Analytics System',
          created: new Date()
        },
        worksheets: []
      }
    };

    // Create summary worksheet
    excelContent.workbook.worksheets.push({
      name: 'Resumen',
      data: this.createExcelSummaryData(data, template),
      formatting: {
        headerStyle: {
          font: { bold: true, color: { argb: 'FFFFFF' } },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: customization.primaryColor || '2563eb' } }
        }
      }
    });

    // Create detailed worksheets for each data type
    template.fields.forEach(field => {
      if (data[field.id] !== undefined && ['table', 'array'].includes(field.type)) {
        const worksheet = this.createExcelWorksheet(field, data[field.id], customization);
        excelContent.workbook.worksheets.push(worksheet);
      }
    });

    return excelContent;
  }

  /**
   * Generate CSV report
   */
  async generateCSVReport(data, template, customization) {
    const csvContent = {
      type: 'csv',
      files: []
    };

    // Generate main CSV file
    const mainData = this.flattenDataForCSV(data, template);
    csvContent.files.push({
      name: `${template.name.replace(/\s+/g, '_')}_main.csv`,
      content: this.convertToCSV(mainData)
    });

    // Generate additional CSV files for complex data
    template.fields.forEach(field => {
      if (data[field.id] && ['table', 'array'].includes(field.type)) {
        const fieldData = Array.isArray(data[field.id]) ? data[field.id] : [data[field.id]];
        csvContent.files.push({
          name: `${template.name.replace(/\s+/g, '_')}_${field.id}.csv`,
          content: this.convertToCSV(fieldData)
        });
      }
    });

    return csvContent;
  }

  /**
   * Generate JSON report
   */
  generateJSONReport(data, template, customization) {
    return {
      type: 'json',
      report: {
        metadata: {
          templateId: template.id,
          templateName: template.name,
          description: template.description,
          generatedAt: new Date().toISOString(),
          customization
        },
        data,
        summary: this.generateReportSummary(data, template)
      }
    };
  }

  /**
   * Process report data according to template
   */
  processReportData(rawData, template, filters) {
    let processedData = { ...rawData };

    // Apply filters
    if (filters.dateRange) {
      processedData = this.applyDateFilter(processedData, filters.dateRange);
    }

    if (filters.categories && filters.categories.length > 0) {
      processedData = this.applyCategoryFilter(processedData, filters.categories);
    }

    if (filters.threshold) {
      processedData = this.applyThresholdFilter(processedData, filters.threshold);
    }

    // Process each field according to its type
    template.fields.forEach(field => {
      if (processedData[field.id] !== undefined) {
        processedData[field.id] = this.processFieldData(
          processedData[field.id], 
          field.type, 
          field.options || {}
        );
      }
    });

    return processedData;
  }

  /**
   * Process field data based on type
   */
  processFieldData(data, type, options) {
    switch (type) {
      case 'currency':
        return typeof data === 'number' ? formatCurrency(data) : data;
      
      case 'number':
        return typeof data === 'number' ? formatNumber(data) : data;
      
      case 'percentage':
        return typeof data === 'number' ? formatPercentage(data) : data;
      
      case 'date':
        return data instanceof Date ? formatDate(data) : data;
      
      case 'array':
        return Array.isArray(data) ? data.slice(0, options.limit || 10) : data;
      
      case 'table':
        return this.processTableData(data, options);
      
      case 'chart':
        return this.processChartData(data, options);
      
      default:
        return data;
    }
  }

  /**
   * Get report history
   */
  getReportHistory(limit = 20) {
    return this.reportHistory
      .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))
      .slice(0, limit);
  }

  /**
   * Delete report from history
   */
  deleteReport(reportId) {
    const index = this.reportHistory.findIndex(report => report.id === reportId);
    if (index !== -1) {
      this.reportHistory.splice(index, 1);
      telemetryService.trackEvent('report_deleted', { reportId });
      return true;
    }
    return false;
  }

  /**
   * Schedule report generation
   */
  scheduleReport(options) {
    const schedule = {
      id: `schedule-${Date.now()}`,
      ...options,
      createdAt: new Date().toISOString(),
      nextRun: this.calculateNextRun(options.frequency),
      isActive: true
    };

    // In a real implementation, this would integrate with a job scheduler
    telemetryService.trackEvent('report_scheduled', {
      templateId: options.templateId,
      frequency: options.frequency
    });

    return schedule;
  }

  /**
   * Validate template data
   */
  validateTemplateData(templateData) {
    const errors = [];

    if (!templateData.name || templateData.name.trim() === '') {
      errors.push('Template name is required');
    }

    if (!templateData.fields || !Array.isArray(templateData.fields) || templateData.fields.length === 0) {
      errors.push('Template must have at least one field');
    }

    if (templateData.fields) {
      templateData.fields.forEach((field, index) => {
        if (!field.id || !field.label || !field.type) {
          errors.push(`Field ${index + 1} is missing required properties (id, label, type)`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate report options
   */
  validateReportOptions(options) {
    const errors = [];

    if (!options.templateId) {
      errors.push('Template ID is required');
    }

    if (!options.data) {
      errors.push('Data is required');
    }

    if (options.format && !this.supportedFormats.includes(options.format.toLowerCase())) {
      errors.push(`Unsupported format: ${options.format}. Supported formats: ${this.supportedFormats.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate report data against template
   */
  validateReportData(data, template) {
    const errors = [];

    const requiredFields = template.fields.filter(field => field.required);
    
    requiredFields.forEach(field => {
      if (data[field.id] === undefined || data[field.id] === null) {
        errors.push(`Required field missing: ${field.label}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Helper methods
  addToHistory(report) {
    this.reportHistory.unshift({
      id: report.id,
      templateId: report.templateId,
      templateName: report.templateName,
      format: report.format,
      generatedAt: report.generatedAt,
      duration: report.duration,
      size: report.size
    });

    // Maintain history limit
    if (this.reportHistory.length > this.maxHistoryEntries) {
      this.reportHistory = this.reportHistory.slice(0, this.maxHistoryEntries);
    }
  }

  calculateContentSize(content) {
    return JSON.stringify(content).length;
  }

  generateReportSummary(data, template) {
    const summary = {
      generatedAt: new Date().toISOString(),
      templateName: template.name,
      fieldsCount: template.fields.length,
      dataPoints: Object.keys(data).length
    };

    // Add specific summaries based on data type
    if (data.totalRevenue) {
      summary.totalRevenue = formatCurrency(data.totalRevenue);
    }

    if (data.totalSales) {
      summary.totalSales = formatNumber(data.totalSales);
    }

    return summary;
  }

  createPDFPage(field, data, customization) {
    return {
      type: 'content',
      field: field.id,
      title: field.label,
      content: data,
      style: {
        alignment: customization.alignment || 'left',
        spacing: customization.spacing || 'normal'
      }
    };
  }

  createExcelSummaryData(data, template) {
    const summaryData = [
      ['Reporte', template.name],
      ['Generado', formatDate(new Date())],
      ['', ''] // Empty row
    ];

    template.fields.forEach(field => {
      if (data[field.id] !== undefined) {
        summaryData.push([field.label, data[field.id]]);
      }
    });

    return summaryData;
  }

  createExcelWorksheet(field, data, customization) {
    return {
      name: field.label.substring(0, 31), // Excel worksheet name limit
      data: Array.isArray(data) ? data : [data],
      formatting: {
        headerStyle: {
          font: { bold: true }
        }
      }
    };
  }

  flattenDataForCSV(data, template) {
    const flattened = [];
    
    template.fields.forEach(field => {
      if (data[field.id] !== undefined && !['table', 'array', 'chart'].includes(field.type)) {
        flattened.push({
          field: field.label,
          value: data[field.id],
          type: field.type
        });
      }
    });

    return flattened;
  }

  convertToCSV(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }

  processTableData(data, options) {
    if (!Array.isArray(data)) return data;
    
    let processed = [...data];
    
    if (options.sortBy) {
      processed.sort((a, b) => {
        const aVal = a[options.sortBy];
        const bVal = b[options.sortBy];
        return options.sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      });
    }
    
    if (options.limit) {
      processed = processed.slice(0, options.limit);
    }
    
    return processed;
  }

  processChartData(data, options) {
    // Process chart data for better visualization
    if (!Array.isArray(data)) return data;
    
    return data.map(item => ({
      ...item,
      formatted: true,
      chartType: options.chartType || 'line'
    }));
  }

  applyDateFilter(data, dateRange) {
    // Apply date filtering logic
    return data;
  }

  applyCategoryFilter(data, categories) {
    // Apply category filtering logic  
    return data;
  }

  applyThresholdFilter(data, threshold) {
    // Apply threshold filtering logic
    return data;
  }

  calculateNextRun(frequency) {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(now.getMonth() + 1);
        return nextMonth;
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }
}

// Create singleton instance
const reportGenerationService = new ReportGenerationService();

export default reportGenerationService;

// Named exports for convenience
export const {
  getTemplates,
  getTemplate,
  createCustomTemplate,
  generateReport,
  getReportHistory,
  deleteReport,
  scheduleReport
} = reportGenerationService;
