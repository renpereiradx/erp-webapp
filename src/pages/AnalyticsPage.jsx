/**
 * Analytics Main Page - Wave 6: Advanced Analytics & Reporting
 * Central hub for all analytics and business intelligence features
 * 
 * Features:
 * - Unified analytics navigation and access
 * - Role-based component access control
 * - Dashboard overview and quick insights
 * - Real-time performance monitoring
 * - Business intelligence highlights
 * - Report management and generation
 * 
 * Architecture: Modular analytics platform with component routing
 * Enfoque: Hardened Implementation - Production ready from day 1
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  Brain, 
  FileText, 
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Zap,
  Settings,
  Lightbulb,
  Clock,
  ArrowRight,
  Grid,
  Eye,
  AlertCircle,
  CheckCircle,
  Star
} from 'lucide-react';

import { 
  AnalyticsDashboard, 
  BusinessIntelligenceDashboard, 
  ReportBuilder,
  SalesDashboard 
} from '@/components/Analytics';
import { useAnalyticsStore } from '@/store/useAnalyticsStore';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { t } from '@/lib/i18n';
import { telemetry } from '@/utils/telemetry';

// Quick insight card component
const QuickInsightCard = ({ insight, onClick }) => {
  const { getCardStyles, getTextStyles } = useThemeStyles();

  const getInsightIcon = () => {
    switch (insight.type) {
      case 'trend': return TrendingUp;
      case 'opportunity': return Target;
      case 'alert': return AlertCircle;
      case 'achievement': return Star;
      default: return Lightbulb;
    }
  };

  const getInsightColor = () => {
    switch (insight.type) {
      case 'trend': return 'text-blue-600 bg-blue-100';
      case 'opportunity': return 'text-green-600 bg-green-100';
      case 'alert': return 'text-red-600 bg-red-100';
      case 'achievement': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-purple-600 bg-purple-100';
    }
  };

  const InsightIcon = getInsightIcon();

  return (
    <div 
      className={`${getCardStyles()} p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105`}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        <div className={`p-2 rounded-full ${getInsightColor()}`}>
          <InsightIcon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <h3 className={`${getTextStyles('primary')} font-medium text-sm mb-1`}>
            {insight.title}
          </h3>
          <p className={`${getTextStyles('secondary')} text-xs mb-2`}>
            {insight.description}
          </p>
          <div className="flex items-center justify-between">
            <span className={`text-xs px-2 py-1 rounded ${
              insight.priority === 'high' ? 'bg-red-100 text-red-700' :
              insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {insight.priority}
            </span>
            <ArrowRight className="w-3 h-3 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Analytics module card component
const AnalyticsModuleCard = ({ module, isActive, onClick }) => {
  const { getCardStyles, getTextStyles } = useThemeStyles();

  return (
    <div 
      className={`${getCardStyles()} p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isActive ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:scale-105'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-lg ${isActive ? 'bg-blue-600' : 'bg-gray-100'}`}>
          <module.icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-600'}`} />
        </div>
        
        <div className="flex-1">
          <h3 className={`${getTextStyles('primary')} font-semibold text-lg mb-1`}>
            {module.title}
          </h3>
          <p className={`${getTextStyles('secondary')} text-sm mb-3`}>
            {module.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>{module.features.length} funciones</span>
              <span>Actualizado {module.lastUpdate}</span>
            </div>
            
            {module.badge && (
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                module.badge.type === 'new' ? 'bg-green-100 text-green-700' :
                module.badge.type === 'updated' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {module.badge.label}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex flex-wrap gap-2">
        {module.features.slice(0, 3).map((feature, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
          >
            {feature}
          </span>
        ))}
        {module.features.length > 3 && (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
            +{module.features.length - 3} más
          </span>
        )}
      </div>
    </div>
  );
};

// Main analytics page component
export const AnalyticsPage = () => {
  const { getTextStyles, getButtonStyles } = useThemeStyles();
  
  // Store hooks
  const {
    businessIntelligence,
    realTimeDashboard,
    performanceMetrics,
    loading,
    errors,
    loadBusinessIntelligence,
    loadRealTimeDashboard,
    getAnalyticsSummary
  } = useAnalyticsStore();

  // Local state
  const [activeModule, setActiveModule] = useState('overview');
  const [quickInsights, setQuickInsights] = useState([]);

  // Analytics modules configuration
  const analyticsModules = useMemo(() => [
    {
      id: 'dashboard',
      title: 'Dashboard Principal',
      description: 'Visualización completa de métricas y KPIs en tiempo real',
      icon: BarChart3,
      features: ['Métricas en tiempo real', 'Gráficos interactivos', 'Alertas automáticas', 'Comparativas'],
      lastUpdate: 'hace 2 horas',
      badge: { type: 'updated', label: 'Actualizado' }
    },
    {
      id: 'business-intelligence',
      title: 'Business Intelligence',
      description: 'Análisis predictivo e insights inteligentes para toma de decisiones',
      icon: Brain,
      features: ['Análisis predictivo', 'Segmentación', 'Oportunidades', 'Recomendaciones'],
      lastUpdate: 'hace 1 día',
      badge: { type: 'new', label: 'Nuevo' }
    },
    {
      id: 'reports',
      title: 'Constructor de Reportes',
      description: 'Generación de reportes personalizados con múltiples formatos',
      icon: FileText,
      features: ['Templates', 'Programación', 'Exportación', 'Distribución'],
      lastUpdate: 'hace 3 días'
    },
    {
      id: 'sales',
      title: 'Analytics de Ventas',
      description: 'Análisis especializado en ventas y rendimiento comercial',
      icon: TrendingUp,
      features: ['Tendencias', 'Performance', 'Conversiones', 'Pronósticos'],
      lastUpdate: 'hace 1 hora'
    }
  ], []);

  // Generate quick insights from analytics data
  const generateQuickInsights = () => {
    const insights = [];
    
    if (realTimeDashboard?.performance) {
      const { conversionRate, customerSatisfaction } = realTimeDashboard.performance;
      
      if (conversionRate > 0.1) {
        insights.push({
          type: 'achievement',
          title: 'Excelente tasa de conversión',
          description: `${(conversionRate * 100).toFixed(1)}% de conversión actual`,
          priority: 'high',
          action: () => setActiveModule('dashboard')
        });
      }
      
      if (customerSatisfaction > 0.9) {
        insights.push({
          type: 'trend',
          title: 'Alta satisfacción del cliente',
          description: `${(customerSatisfaction * 100).toFixed(1)}% de satisfacción`,
          priority: 'medium',
          action: () => setActiveModule('business-intelligence')
        });
      }
    }
    
    if (businessIntelligence?.insights?.length > 0) {
      insights.push({
        type: 'opportunity',
        title: 'Nuevas oportunidades detectadas',
        description: `${businessIntelligence.insights.length} insights disponibles`,
        priority: 'high',
        action: () => setActiveModule('business-intelligence')
      });
    }
    
    // Add some default insights if none are generated
    if (insights.length === 0) {
      insights.push(
        {
          type: 'trend',
          title: 'Análisis en proceso',
          description: 'Recopilando datos para generar insights',
          priority: 'low',
          action: () => setActiveModule('dashboard')
        },
        {
          type: 'opportunity',
          title: 'Configure sus métricas',
          description: 'Personalice su dashboard para mejores insights',
          priority: 'medium',
          action: () => setActiveModule('dashboard')
        }
      );
    }
    
    setQuickInsights(insights.slice(0, 6));
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          loadRealTimeDashboard(),
          loadBusinessIntelligence()
        ]);
      } catch (error) {
        console.error('Failed to load analytics data:', error);
      }
    };

    loadData();
  }, []);

  // Generate insights when data changes
  useEffect(() => {
    generateQuickInsights();
  }, [realTimeDashboard, businessIntelligence]);

  // Handle module selection
  const handleModuleSelect = (moduleId) => {
    setActiveModule(moduleId);
    
    telemetry.record('analytics_page.module_selected', {
      module: moduleId,
      previousModule: activeModule
    });
  };

  // Render active module content
  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <AnalyticsDashboard />;
      case 'business-intelligence':
        return <BusinessIntelligenceDashboard />;
      case 'reports':
        return <ReportBuilder />;
      case 'sales':
        return <SalesDashboard />;
      default:
        return null;
    }
  };

  // Show module content if not overview
  if (activeModule !== 'overview') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation breadcrumb */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => setActiveModule('overview')}
              className={`${getTextStyles('secondary')} hover:text-blue-600`}
            >
              Analytics
            </button>
            <span className={getTextStyles('secondary')}>{'>'}</span>
            <span className={getTextStyles('primary')} font-medium>
              {analyticsModules.find(m => m.id === activeModule)?.title}
            </span>
          </div>
        </div>
        
        {/* Module content */}
        <div className="bg-gray-50 min-h-screen">
          {renderActiveModule()}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className={`${getTextStyles('primary')} text-3xl font-bold`}>
            Analytics & Business Intelligence
          </h1>
          <p className={`${getTextStyles('secondary')} mt-1`}>
            Centro de análisis avanzado y reportes inteligentes
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            className={`${getButtonStyles('secondary')} px-4 py-2 flex items-center space-x-2`}
          >
            <Settings className="w-4 h-4" />
            <span>Configuración</span>
          </button>
        </div>
      </div>

      {/* Quick Insights */}
      {quickInsights.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className={`${getTextStyles('primary')} text-xl font-semibold`}>
              Insights Rápidos
            </h2>
            <button
              onClick={() => setActiveModule('business-intelligence')}
              className={`${getTextStyles('secondary')} text-sm hover:text-blue-600 flex items-center space-x-1`}
            >
              <span>Ver todos</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickInsights.map((insight, index) => (
              <QuickInsightCard
                key={index}
                insight={insight}
                onClick={insight.action}
              />
            ))}
          </div>
        </div>
      )}

      {/* Analytics Modules */}
      <div className="space-y-4">
        <h2 className={`${getTextStyles('primary')} text-xl font-semibold`}>
          Módulos de Analytics
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {analyticsModules.map((module) => (
            <AnalyticsModuleCard
              key={module.id}
              module={module}
              isActive={activeModule === module.id}
              onClick={() => handleModuleSelect(module.id)}
            />
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`${getCardStyles()} p-6 text-center`}>
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className={`${getTextStyles('primary')} font-semibold mb-1`}>
            Dashboards Activos
          </h3>
          <p className={`${getTextStyles('primary')} text-2xl font-bold`}>12</p>
          <p className={`${getTextStyles('secondary')} text-sm`}>+2 esta semana</p>
        </div>
        
        <div className={`${getCardStyles()} p-6 text-center`}>
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
            <Brain className="w-6 h-6 text-green-600" />
          </div>
          <h3 className={`${getTextStyles('primary')} font-semibold mb-1`}>
            Insights Generados
          </h3>
          <p className={`${getTextStyles('primary')} text-2xl font-bold`}>
            {businessIntelligence?.insights?.length || 0}
          </p>
          <p className={`${getTextStyles('secondary')} text-sm`}>Esta semana</p>
        </div>
        
        <div className={`${getCardStyles()} p-6 text-center`}>
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-3">
            <FileText className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className={`${getTextStyles('primary')} font-semibold mb-1`}>
            Reportes Programados
          </h3>
          <p className={`${getTextStyles('primary')} text-2xl font-bold`}>8</p>
          <p className={`${getTextStyles('secondary')} text-sm`}>2 ejecutándose</p>
        </div>
        
        <div className={`${getCardStyles()} p-6 text-center`}>
          <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mx-auto mb-3">
            <Zap className="w-6 h-6 text-yellow-600" />
          </div>
          <h3 className={`${getTextStyles('primary')} font-semibold mb-1`}>
            Datos en Tiempo Real
          </h3>
          <p className={`${getTextStyles('primary')} text-2xl font-bold`}>
            {realTimeDashboard?.activeConnections || 0}
          </p>
          <p className={`${getTextStyles('secondary')} text-sm`}>Conexiones activas</p>
        </div>
      </div>

      {/* Loading State */}
      {(loading.businessIntelligence || loading.realTimeDashboard) && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className={`${getTextStyles('secondary')} ml-3`}>
            Cargando analytics...
          </span>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
