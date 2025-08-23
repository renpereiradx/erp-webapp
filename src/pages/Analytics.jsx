/**
 * Analytics Page - Wave 6 Implementation
 * Wave 6: Advanced Analytics & Reporting - Phase 3
 * 
 * Complete analytics dashboard with advanced reporting capabilities
 */

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Users, Brain, FileText, Settings } from 'lucide-react';

// Wave 6 Analytics Components - Phase 2
import SalesAnalyticsDashboard from '@/components/Analytics/SalesAnalyticsDashboard';
import ProductPerformanceChart from '@/components/Analytics/ProductPerformanceChart';
import CustomerAnalyticsChart from '@/components/Analytics/CustomerAnalyticsChart';
import BusinessIntelligencePanel from '@/components/Analytics/BusinessIntelligencePanel';

// Wave 6 Phase 3 - Advanced Reporting Components
import ReportsDashboard from '@/components/Analytics/ReportsDashboard';
import ReportBuilder from '@/components/Analytics/ReportBuilder';

// Services
import { salesAnalyticsService } from '@/services/salesAnalyticsService';

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simular carga de datos desde el servicio
      const [
        salesData,
        productData,
        customerData,
        biData
      ] = await Promise.all([
        salesAnalyticsService.getSalesMetrics(),
        salesAnalyticsService.getProductAnalytics(),
        salesAnalyticsService.getCustomerAnalytics(),
        salesAnalyticsService.getBusinessIntelligence()
      ]);

      setAnalyticsData({
        sales: salesData,
        products: productData,
        customers: customerData,
        businessIntelligence: biData
      });
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAnalyticsData();
  };

  if (error) {
      return (
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Error loading Analytics
            </h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button 
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics & Reporting Dashboard</h1>
            <p className="text-muted-foreground">
              Advanced Analytics & Business Intelligence - Wave 6 Phase 3
            </p>
          </div>
                  <button 
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="intelligence" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Intelligence
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="builder" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Builder
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - Sales Dashboard */}
          <TabsContent value="overview" className="space-y-6">
            <SalesAnalyticsDashboard
              data={analyticsData?.sales}
              loading={loading}
              onRefresh={handleRefresh}
            />
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <ProductPerformanceChart
              data={analyticsData?.products}
              loading={loading}
              onProductClick={(product) => {
                console.log('Product clicked:', product);
                // Navigate to product details
              }}
              onCategoryClick={(category) => {
                console.log('Category clicked:', category);
                // Filter by category
              }}
            />
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            <CustomerAnalyticsChart
              data={analyticsData?.customers}
              loading={loading}
              onSegmentClick={(segment) => {
                console.log('Customer segment clicked:', segment);
                // Navigate to customer segment analysis
              }}
              onCustomerClick={(customer) => {
                console.log('Customer clicked:', customer);
                // Navigate to customer details
              }}
            />
          </TabsContent>

          {/* Business Intelligence Tab */}
          <TabsContent value="intelligence" className="space-y-6">
            <BusinessIntelligencePanel
              data={analyticsData?.businessIntelligence}
              loading={loading}
              onInsightClick={(insight) => {
                console.log('Business insight clicked:', insight);
                // Navigate to detailed insight analysis
              }}
              onRecommendationClick={(recommendation) => {
                console.log('Recommendation clicked:', recommendation);
                // Navigate to recommendation implementation
              }}
            />
          </TabsContent>

          {/* Reports Tab - Phase 3 */}
          <TabsContent value="reports" className="space-y-6">
            <ReportsDashboard
              analyticsData={analyticsData}
              className="w-full"
            />
          </TabsContent>

          {/* Report Builder Tab - Phase 3 */}
          <TabsContent value="builder" className="space-y-6">
            <ReportBuilder
              analyticsData={analyticsData}
              onReportGenerated={(report) => {
                console.log('Report generated:', report);
                // Handle report generation completion
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Development Info */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg border-l-4 border-blue-500">
          <h3 className="font-semibold text-sm text-blue-700 mb-2">
            Wave 6 Phase 3 - Advanced Reporting System
          </h3>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>✅ <strong>SalesAnalyticsDashboard:</strong> Real-time metrics dashboard</p>
            <p>✅ <strong>ProductPerformanceChart:</strong> Product and category performance analysis</p>
            <p>✅ <strong>CustomerAnalyticsChart:</strong> Customer segmentation and behavior analysis</p>
            <p>✅ <strong>BusinessIntelligencePanel:</strong> AI-powered insights and predictions</p>
            <p>✅ <strong>ReportsDashboard:</strong> Advanced reporting hub with templates and history</p>
            <p>✅ <strong>ReportBuilder:</strong> Drag-and-drop report builder with real-time preview</p>
            <p>✅ <strong>Phase 3:</strong> Complete advanced reporting system implemented</p>
          </div>
        </div>
      </div>
    );
  };

  export default AnalyticsPage;
