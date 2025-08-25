/**
 * Business Intelligence Dashboard - Wave 6: Advanced Analytics & Reporting
 * Enterprise-grade business intelligence with predictive analytics and insights
 * 
 * Features:
 * - Predictive analytics and forecasting
 * - Market opportunity analysis
 * - Customer segmentation insights
 * - Performance optimization recommendations
 * - Risk assessment and alerts
 * - Trend analysis and pattern recognition
 * 
 * Architecture: AI-powered insights with real-time data processing
 * Enfoque: Hardened Implementation - Production ready from day 1
 */

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Brain,
  TrendingUp,
  Target,
  AlertTriangle,
  Lightbulb,
  Users,
  DollarSign,
  PieChart,
  BarChart3,
  LineChart,
  Zap,
  Award,
  ShieldAlert,
  Clock,
  ArrowRight,
  CheckCircle,
  XCircle,
  Info,
  Star,
  Filter,
  RefreshCw,
  Download
} from 'lucide-react';

import { useAnalyticsStore } from '@/store/useAnalyticsStore';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { t } from '@/lib/i18n';
import { telemetry } from '@/utils/telemetry';

// Insight card component
const InsightCard = ({ 
  insight, 
  type = 'recommendation', 
  priority = 'medium',
  onAction = null 
}) => {
  const { getCardStyles, getTextStyles, getButtonStyles } = useThemeStyles();

  const getTypeIcon = () => {
    switch (type) {
      case 'prediction': return Brain;
      case 'opportunity': return Target;
      case 'risk': return AlertTriangle;
      case 'recommendation': return Lightbulb;
      default: return Info;
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'prediction': return 'text-blue-600 bg-blue-100';
      case 'opportunity': return 'text-green-600 bg-green-100';
      case 'risk': return 'text-red-600 bg-red-100';
      case 'recommendation': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityBorder = () => {
    switch (priority) {
      case 'high': return 'border-l-4 border-red-500';
      case 'medium': return 'border-l-4 border-yellow-500';
      case 'low': return 'border-l-4 border-green-500';
      default: return 'border-l-4 border-gray-300';
    }
  };

  const TypeIcon = getTypeIcon();

  return (
    <div className={`${getCardStyles()} p-6 ${getPriorityBorder()}`}>
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-full ${getTypeColor()}`}>
          <TypeIcon className="w-5 h-5" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className={`${getTextStyles('primary')} font-semibold`}>
              {insight.title}
            </h3>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              priority === 'high' ? 'bg-red-100 text-red-700' :
              priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {priority}
            </span>
          </div>
          
          <p className={`${getTextStyles('secondary')} mb-4`}>
            {insight.description}
          </p>
          
          {insight.metrics && (
            <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded">
              {insight.metrics.map((metric, index) => (
                <div key={index} className="text-center">
                  <p className={`${getTextStyles('primary')} font-bold text-lg`}>
                    {metric.value}
                  </p>
                  <p className={`${getTextStyles('secondary')} text-xs`}>
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
          )}
          
          {insight.recommendations && (
            <div className="mb-4">
              <h4 className={`${getTextStyles('primary')} font-medium mb-2`}>
                Recomendaciones:
              </h4>
              <ul className="space-y-1">
                {insight.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className={`${getTextStyles('secondary')} text-sm`}>
                      {rec}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {onAction && (
            <button
              onClick={() => onAction(insight)}
              className={`${getButtonStyles('primary')} px-4 py-2 text-sm flex items-center space-x-2`}
            >
              <span>Aplicar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Prediction card component
const PredictionCard = ({ prediction, timeframe = '30d' }) => {
  const { getCardStyles, getTextStyles } = useThemeStyles();

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.8) return 'Alta';
    if (confidence >= 0.6) return 'Media';
    return 'Baja';
  };

  return (
    <div className={`${getCardStyles()} p-6`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`${getTextStyles('primary')} font-semibold`}>
          {prediction.title}
        </h3>
        <div className="flex items-center space-x-2">
          <Brain className="w-4 h-4 text-blue-600" />
          <span className={`text-sm font-medium ${getConfidenceColor(prediction.confidence)}`}>
            {getConfidenceLabel(prediction.confidence)}
          </span>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <p className={`${getTextStyles('secondary')} text-sm mb-2`}>
            Predicción para los próximos {timeframe}:
          </p>
          <p className={`${getTextStyles('primary')} text-2xl font-bold`}>
            {prediction.predictedValue}
          </p>
          {prediction.change && (
            <div className={`flex items-center space-x-1 mt-1 ${
              prediction.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">{prediction.change}</span>
            </div>
          )}
        </div>
        
        {prediction.factors && (
          <div>
            <h4 className={`${getTextStyles('primary')} font-medium mb-2`}>
              Factores clave:
            </h4>
            <div className="space-y-1">
              {prediction.factors.map((factor, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className={`${getTextStyles('secondary')} text-sm`}>
                    {factor.name}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${factor.impact * 100}%` }}
                      />
                    </div>
                    <span className={`${getTextStyles('secondary')} text-xs`}>
                      {Math.round(factor.impact * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Market opportunity component
const MarketOpportunityCard = ({ opportunity, onExplore = null }) => {
  const { getCardStyles, getTextStyles, getButtonStyles } = useThemeStyles();

  return (
    <div className={`${getCardStyles()} p-6`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-full">
            <Target className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className={`${getTextStyles('primary')} font-semibold`}>
              {opportunity.title}
            </h3>
            <p className={`${getTextStyles('secondary')} text-sm`}>
              {opportunity.category}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <p className={`${getTextStyles('primary')} font-bold text-lg`}>
            {opportunity.potentialValue}
          </p>
          <p className={`${getTextStyles('secondary')} text-xs`}>
            Potencial estimado
          </p>
        </div>
      </div>
      
      <p className={`${getTextStyles('secondary')} mb-4`}>
        {opportunity.description}
      </p>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className={`${getTextStyles('primary')} font-bold`}>
            {opportunity.probability}%
          </p>
          <p className={`${getTextStyles('secondary')} text-xs`}>
            Probabilidad
          </p>
        </div>
        
        <div className="text-center">
          <p className={`${getTextStyles('primary')} font-bold`}>
            {opportunity.timeToRealize}
          </p>
          <p className={`${getTextStyles('secondary')} text-xs`}>
            Tiempo
          </p>
        </div>
        
        <div className="text-center">
          <p className={`${getTextStyles('primary')} font-bold`}>
            {opportunity.difficulty}
          </p>
          <p className={`${getTextStyles('secondary')} text-xs`}>
            Dificultad
          </p>
        </div>
      </div>
      
      {onExplore && (
        <button
          onClick={() => onExplore(opportunity)}
          className={`${getButtonStyles('secondary')} w-full py-2 text-sm`}
        >
          Explorar Oportunidad
        </button>
      )}
    </div>
  );
};

// Customer segmentation component
const CustomerSegmentCard = ({ segment }) => {
  const { getCardStyles, getTextStyles } = useThemeStyles();

  return (
    <div className={`${getCardStyles()} p-6`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`${getTextStyles('primary')} font-semibold`}>
          {segment.name}
        </h3>
        <div className="flex items-center space-x-1">
          <Users className="w-4 h-4 text-blue-600" />
          <span className={`${getTextStyles('secondary')} text-sm`}>
            {segment.size.toLocaleString()} clientes
          </span>
        </div>
      </div>
      
      <p className={`${getTextStyles('secondary')} text-sm mb-4`}>
        {segment.description}
      </p>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className={`${getTextStyles('secondary')} text-sm`}>
            Valor promedio
          </span>
          <span className={`${getTextStyles('primary')} font-medium`}>
            ${segment.averageValue.toLocaleString()}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className={`${getTextStyles('secondary')} text-sm`}>
            Frecuencia de compra
          </span>
          <span className={`${getTextStyles('primary')} font-medium`}>
            {segment.purchaseFrequency}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className={`${getTextStyles('secondary')} text-sm`}>
            Retención
          </span>
          <span className={`${getTextStyles('primary')} font-medium`}>
            {segment.retentionRate}%
          </span>
        </div>
      </div>
      
      {segment.recommendations && segment.recommendations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className={`${getTextStyles('primary')} font-medium mb-2 text-sm`}>
            Estrategias recomendadas:
          </h4>
          <ul className="space-y-1">
            {segment.recommendations.slice(0, 2).map((rec, index) => (
              <li key={index} className="flex items-start space-x-2">
                <Star className="w-3 h-3 text-yellow-500 mt-1 flex-shrink-0" />
                <span className={`${getTextStyles('secondary')} text-xs`}>
                  {rec}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Main business intelligence component
export const BusinessIntelligenceDashboard = () => {
  const { getTextStyles, getButtonStyles } = useThemeStyles();
  
  // Store hooks
  const {
    businessIntelligence,
    filters,
    loading,
    errors,
    loadBusinessIntelligence,
    updateFilters,
    generateInsight,
    exportData,
    clearError
  } = useAnalyticsStore();

  // Local state
  const [activeTab, setActiveTab] = useState('insights');
  const [refreshing, setRefreshing] = useState(false);

  // Load business intelligence data
  const loadBIData = async () => {
    try {
      setRefreshing(true);
      await loadBusinessIntelligence(filters);
      
      telemetry.record('business_intelligence.data_loaded', {
        filters,
        hasErrors: errors.businessIntelligence !== null
      });
    } catch (error) {
      telemetry.record('business_intelligence.load_error', {
        error: error.message,
        filters
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Handle insight action
  const handleInsightAction = async (insight) => {
    try {
      telemetry.record('business_intelligence.insight_action', {
        insightType: insight.type,
        priority: insight.priority
      });
      
      // TODO: Implement insight action logic
      console.log('Applying insight:', insight);
    } catch (error) {
      console.error('Insight action failed:', error);
    }
  };

  // Handle opportunity exploration
  const handleExploreOpportunity = async (opportunity) => {
    try {
      telemetry.record('business_intelligence.explore_opportunity', {
        opportunityType: opportunity.category,
        potentialValue: opportunity.potentialValue
      });
      
      // TODO: Implement opportunity exploration logic
      console.log('Exploring opportunity:', opportunity);
    } catch (error) {
      console.error('Opportunity exploration failed:', error);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadBIData();
  }, []);

  // Tabs configuration
  const tabs = [
    { id: 'insights', label: 'Insights', icon: Brain },
    { id: 'predictions', label: 'Predicciones', icon: TrendingUp },
    { id: 'opportunities', label: 'Oportunidades', icon: Target },
    { id: 'segments', label: 'Segmentos', icon: Users }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className={`${getTextStyles('primary')} text-3xl font-bold`}>
            Business Intelligence
          </h1>
          <p className={`${getTextStyles('secondary')} mt-1`}>
            Análisis predictivo e insights inteligentes
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={loadBIData}
            disabled={refreshing}
            className={`${getButtonStyles('secondary')} px-4 py-2 flex items-center space-x-2`}
            aria-label="Actualizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
          
          <button
            onClick={() => exportData({ 
              format: 'pdf', 
              dataType: 'business_intelligence', 
              filters 
            })}
            className={`${getButtonStyles('primary')} px-4 py-2 flex items-center space-x-2`}
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Error Messages */}
      {errors.businessIntelligence && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">Error en Business Intelligence</h3>
                <p className="text-red-600 text-sm mt-1">{errors.businessIntelligence.message}</p>
              </div>
            </div>
            <button
              onClick={() => clearError('businessIntelligence')}
              className="text-red-600 hover:text-red-800"
              aria-label="Cerrar error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'insights' && (
          <div className="space-y-6">
            <h2 className={`${getTextStyles('primary')} text-xl font-semibold`}>
              Insights Inteligentes
            </h2>
            
            <div className="space-y-4">
              {businessIntelligence.insights.map((insight, index) => (
                <InsightCard
                  key={index}
                  insight={insight}
                  type={insight.type}
                  priority={insight.priority}
                  onAction={handleInsightAction}
                />
              ))}
              
              {businessIntelligence.insights.length === 0 && !loading.businessIntelligence && (
                <div className="text-center py-12">
                  <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className={`${getTextStyles('secondary')}`}>
                    No hay insights disponibles en este momento
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'predictions' && (
          <div className="space-y-6">
            <h2 className={`${getTextStyles('primary')} text-xl font-semibold`}>
              Predicciones y Pronósticos
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {businessIntelligence.predictions.salesForecast.map((prediction, index) => (
                <PredictionCard
                  key={index}
                  prediction={prediction}
                  timeframe={filters.timeRange}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'opportunities' && (
          <div className="space-y-6">
            <h2 className={`${getTextStyles('primary')} text-xl font-semibold`}>
              Oportunidades de Mercado
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {businessIntelligence.market.opportunityAreas.map((opportunity, index) => (
                <MarketOpportunityCard
                  key={index}
                  opportunity={opportunity}
                  onExplore={handleExploreOpportunity}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'segments' && (
          <div className="space-y-6">
            <h2 className={`${getTextStyles('primary')} text-xl font-semibold`}>
              Segmentación de Clientes
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {businessIntelligence.customer.segments.map((segment, index) => (
                <CustomerSegmentCard
                  key={index}
                  segment={segment}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading.businessIntelligence && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className={`${getTextStyles('secondary')} ml-3`}>
            Cargando insights...
          </span>
        </div>
      )}
    </div>
  );
};

export default BusinessIntelligenceDashboard;
