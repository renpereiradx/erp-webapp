/**
 * Reports Store
 * Wave 6: Advanced Analytics & Reporting - Phase 3
 * 
 * State management for report generation, templates, and history
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import reportGenerationService from '@/services/reportGenerationService';
import telemetryService from '@/services/telemetryService';

const useReportsStore = create(
  subscribeWithSelector((set, get) => ({
    // State
    templates: [],
    selectedTemplate: null,
    reportHistory: [],
    currentReport: null,
    isGenerating: false,
    generationProgress: 0,
    error: null,
    
    // Report builder state
    builderState: {
      selectedFields: [],
      filters: {},
      customization: {
        format: 'pdf',
        fontSize: 12,
        fontFamily: 'Arial',
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        includeCharts: true,
        includeSummary: true,
        logo: null
      },
      preview: null
    },

    // Scheduled reports
    scheduledReports: [],
    scheduleModalOpen: false,

    // UI state
    activeTab: 'builder', // builder, history, templates, scheduled
    sidebarCollapsed: false,
    filtersVisible: true,

    // Actions
    /**
     * Load templates
     */
    loadTemplates: async (category = null) => {
      try {
        set({ error: null });
        
        const templates = await reportGenerationService.getTemplates(category);
        set({ templates });
        
        telemetryService.trackEvent('templates_loaded', { 
          count: templates.length,
          category 
        });
        
      } catch (error) {
        console.error('Error loading templates:', error);
        set({ error: error.message });
        telemetryService.trackError(error, { operation: 'load_templates' });
      }
    },

    /**
     * Select template
     */
    selectTemplate: (templateId) => {
      const { templates } = get();
      const template = templates.find(t => t.id === templateId);
      
      if (template) {
        set({ 
          selectedTemplate: template,
          builderState: {
            ...get().builderState,
            selectedFields: template.fields.filter(f => f.required).map(f => f.id)
          }
        });
        
        telemetryService.trackEvent('template_selected', { 
          templateId,
          templateName: template.name 
        });
      }
    },

    /**
     * Create custom template
     */
    createCustomTemplate: async (templateData) => {
      try {
        set({ error: null });
        
        const template = await reportGenerationService.createCustomTemplate(templateData);
        
        set(state => ({
          templates: [...state.templates, template]
        }));
        
        return template;
        
      } catch (error) {
        console.error('Error creating template:', error);
        set({ error: error.message });
        telemetryService.trackError(error, { operation: 'create_template' });
        throw error;
      }
    },

    /**
     * Generate report
     */
    generateReport: async (data, options = {}) => {
      const { selectedTemplate, builderState } = get();
      
      if (!selectedTemplate) {
        throw new Error('No template selected');
      }

      try {
        set({ 
          isGenerating: true, 
          generationProgress: 0, 
          error: null 
        });

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          set(state => ({
            generationProgress: Math.min(state.generationProgress + 10, 90)
          }));
        }, 200);

        const reportOptions = {
          templateId: selectedTemplate.id,
          data,
          format: builderState.customization.format,
          filters: builderState.filters,
          customization: builderState.customization,
          ...options
        };

        const report = await reportGenerationService.generateReport(reportOptions);
        
        clearInterval(progressInterval);
        
        set({ 
          currentReport: report,
          generationProgress: 100,
          isGenerating: false 
        });

        // Refresh history
        get().loadReportHistory();
        
        return report;
        
      } catch (error) {
        console.error('Error generating report:', error);
        set({ 
          error: error.message, 
          isGenerating: false,
          generationProgress: 0 
        });
        telemetryService.trackError(error, { operation: 'generate_report' });
        throw error;
      }
    },

    /**
     * Load report history
     */
    loadReportHistory: async (limit = 20) => {
      try {
        const history = await reportGenerationService.getReportHistory(limit);
        set({ reportHistory: history });
        
      } catch (error) {
        console.error('Error loading report history:', error);
        set({ error: error.message });
      }
    },

    /**
     * Delete report
     */
    deleteReport: async (reportId) => {
      try {
        const success = await reportGenerationService.deleteReport(reportId);
        
        if (success) {
          set(state => ({
            reportHistory: state.reportHistory.filter(r => r.id !== reportId)
          }));
        }
        
        return success;
        
      } catch (error) {
        console.error('Error deleting report:', error);
        set({ error: error.message });
        throw error;
      }
    },

    /**
     * Schedule report
     */
    scheduleReport: async (scheduleOptions) => {
      try {
        set({ error: null });
        
        const schedule = await reportGenerationService.scheduleReport(scheduleOptions);
        
        set(state => ({
          scheduledReports: [...state.scheduledReports, schedule]
        }));
        
        return schedule;
        
      } catch (error) {
        console.error('Error scheduling report:', error);
        set({ error: error.message });
        throw error;
      }
    },

    /**
     * Update builder state
     */
    updateBuilderState: (updates) => {
      set(state => ({
        builderState: {
          ...state.builderState,
          ...updates
        }
      }));
    },

    /**
     * Update selected fields
     */
    updateSelectedFields: (fieldIds) => {
      set(state => ({
        builderState: {
          ...state.builderState,
          selectedFields: fieldIds
        }
      }));
    },

    /**
     * Update filters
     */
    updateFilters: (filters) => {
      set(state => ({
        builderState: {
          ...state.builderState,
          filters: {
            ...state.builderState.filters,
            ...filters
          }
        }
      }));
    },

    /**
     * Update customization
     */
    updateCustomization: (customization) => {
      set(state => ({
        builderState: {
          ...state.builderState,
          customization: {
            ...state.builderState.customization,
            ...customization
          }
        }
      }));
    },

    /**
     * Generate preview
     */
    generatePreview: async (data) => {
      const { selectedTemplate, builderState } = get();
      
      if (!selectedTemplate) return;

      try {
        // Generate a simplified preview
        const previewData = {
          template: selectedTemplate,
          fields: builderState.selectedFields,
          filters: builderState.filters,
          customization: builderState.customization,
          sampleData: data
        };

        set(state => ({
          builderState: {
            ...state.builderState,
            preview: previewData
          }
        }));

        telemetryService.trackEvent('report_preview_generated', {
          templateId: selectedTemplate.id,
          fieldsCount: builderState.selectedFields.length
        });
        
      } catch (error) {
        console.error('Error generating preview:', error);
        set({ error: error.message });
      }
    },

    /**
     * Download report
     */
    downloadReport: (report) => {
      try {
        // In a real implementation, this would trigger file download
        const downloadData = {
          filename: `${report.templateName}_${new Date().toISOString().split('T')[0]}.${report.format}`,
          content: report.content,
          mimeType: this.getMimeType(report.format)
        };

        // Simulate download
        telemetryService.trackEvent('report_downloaded', {
          reportId: report.id,
          format: report.format,
          size: report.size
        });

        // In browser environment, you would create a blob and trigger download
        if (typeof window !== 'undefined') {
          const blob = new Blob([JSON.stringify(report.content)], { 
            type: downloadData.mimeType 
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = downloadData.filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
        
      } catch (error) {
        console.error('Error downloading report:', error);
        set({ error: error.message });
      }
    },

    /**
     * Clear error
     */
    clearError: () => {
      set({ error: null });
    },

    /**
     * Set active tab
     */
    setActiveTab: (tab) => {
      set({ activeTab: tab });
      
      telemetryService.trackEvent('reports_tab_changed', { tab });
    },

    /**
     * Toggle sidebar
     */
    toggleSidebar: () => {
      set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }));
    },

    /**
     * Toggle filters visibility
     */
    toggleFilters: () => {
      set(state => ({ filtersVisible: !state.filtersVisible }));
    },

    /**
     * Reset builder state
     */
    resetBuilder: () => {
      set({
        selectedTemplate: null,
        builderState: {
          selectedFields: [],
          filters: {},
          customization: {
            format: 'pdf',
            fontSize: 12,
            fontFamily: 'Arial',
            primaryColor: '#2563eb',
            secondaryColor: '#64748b',
            includeCharts: true,
            includeSummary: true,
            logo: null
          },
          preview: null
        }
      });
    },

    /**
     * Get available export formats for template
     */
    getAvailableFormats: () => {
      const { selectedTemplate } = get();
      return selectedTemplate?.exportFormats || ['pdf', 'excel', 'csv'];
    },

    /**
     * Get mime type for format
     */
    getMimeType: (format) => {
      const mimeTypes = {
        pdf: 'application/pdf',
        excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        csv: 'text/csv',
        json: 'application/json'
      };
      return mimeTypes[format] || 'application/octet-stream';
    },

    /**
     * Validate current builder state
     */
    validateBuilder: () => {
      const { selectedTemplate, builderState } = get();
      const errors = [];

      if (!selectedTemplate) {
        errors.push('Please select a template');
      }

      if (builderState.selectedFields.length === 0) {
        errors.push('Please select at least one field');
      }

      if (selectedTemplate) {
        const requiredFields = selectedTemplate.fields
          .filter(f => f.required)
          .map(f => f.id);
        
        const missingRequired = requiredFields.filter(
          fieldId => !builderState.selectedFields.includes(fieldId)
        );

        if (missingRequired.length > 0) {
          errors.push(`Missing required fields: ${missingRequired.join(', ')}`);
        }
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    }
  }))
);

// Initialize store
useReportsStore.getState().loadTemplates();
useReportsStore.getState().loadReportHistory();

export default useReportsStore;
