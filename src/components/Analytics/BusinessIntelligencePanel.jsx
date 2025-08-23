/**
 * Business Intelligence Panel Component
 * Wave 6: Advanced Analytics & Reporting - Phase 2
 * 
 * AI-powered business insights panel with predictive analytics,
 * recommendations, alerts, and intelligent business intelligence.
 */

import React, { memo, useMemo, useState, useCallback, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, AlertTriangle, Target, 
  Brain, Lightbulb, Zap, Clock, DollarSign,
  Users, Package, ShoppingCart, Calendar,
  ChevronRight, Star, AlertCircle, CheckCircle2,
  ArrowUp, ArrowDown, Minus, Sparkles,
  BarChart3, PieChart, LineChart, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatNumber, formatPercentage, formatDate } from '@/utils/formatting';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

const BusinessIntelligencePanel = memo(({
  data,
  loading = false,
  className = "",
  onInsightClick,
  onRecommendationClick,
  onAlertClick
}) => {

  const [activeTab, setActiveTab] = useState('insights'); // insights, predictions, recommendations, alerts
  const [timeHorizon, setTimeHorizon] = useState('30d'); // 7d, 30d, 90d, 1y
  const [insightFilter, setInsightFilter] = useState('all'); // all, high, medium, low
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Process insights data
  const insights = useMemo(() => {
    if (!data?.insights) return [];

    return data.insights.map(insight => ({
      ...insight,
      priorityColor: insight.priority === 'high' ? 'text-red-600' :
                    insight.priority === 'medium' ? 'text-yellow-600' : 'text-green-600',
      priorityBg: insight.priority === 'high' ? 'bg-red-50 border-red-200' :
                  insight.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' : 
                  'bg-green-50 border-green-200',
      impactValue: insight.estimatedImpact?.value || 0,
      formattedImpact: insight.estimatedImpact?.value ? 
        formatCurrency(insight.estimatedImpact.value) : 'N/A',
      confidenceScore: insight.confidence || 0,
      createdDate: formatDate(insight.timestamp, { format: 'short' })
    }));
  }, [data?.insights]);

  // Process predictions data
  const predictions = useMemo(() => {
    if (!data?.predictions) return [];

    return data.predictions.map(prediction => ({
      ...prediction,
      trendIcon: prediction.trend === 'up' ? ArrowUp :
                prediction.trend === 'down' ? ArrowDown : Minus,
      trendColor: prediction.trend === 'up' ? 'text-green-600' :
                 prediction.trend === 'down' ? 'text-red-600' : 'text-gray-600',
      formattedValue: prediction.predictedValue ? 
        formatCurrency(prediction.predictedValue) : formatNumber(prediction.predictedValue),
      accuracyScore: prediction.accuracy || 0,
      timeToRealization: prediction.timeframe || 'N/A'
    }));
  }, [data?.predictions]);

  // Process recommendations
  const recommendations = useMemo(() => {
    if (!data?.recommendations) return [];

    return data.recommendations.map(recommendation => ({
      ...recommendation,
      categoryIcon: recommendation.category === 'sales' ? DollarSign :
                   recommendation.category === 'inventory' ? Package :
                   recommendation.category === 'customers' ? Users :
                   recommendation.category === 'marketing' ? Target : Lightbulb,
      priorityLevel: recommendation.priority || 'medium',
      estimatedROI: recommendation.expectedROI || 0,
      formattedROI: recommendation.expectedROI ? 
        formatPercentage(recommendation.expectedROI) : 'N/A',
      implementationEffort: recommendation.effort || 'medium',
      createdDate: formatDate(recommendation.timestamp, { format: 'short' })
    }));
  }, [data?.recommendations]);

  // Process alerts
  const alerts = useMemo(() => {
    if (!data?.alerts) return [];

    return data.alerts.map(alert => ({
      ...alert,
      severityIcon: alert.severity === 'critical' ? AlertTriangle :
                   alert.severity === 'warning' ? AlertCircle : CheckCircle2,
      severityColor: alert.severity === 'critical' ? 'text-red-600' :
                    alert.severity === 'warning' ? 'text-yellow-600' : 'text-green-600',
      severityBg: alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
                  alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' : 
                  'bg-green-50 border-green-200',
      isNew: Date.now() - new Date(alert.timestamp).getTime() < 24 * 60 * 60 * 1000,
      createdDate: formatDate(alert.timestamp, { format: 'short' })
    }));
  }, [data?.alerts]);

  // Filter insights by priority
  const filteredInsights = useMemo(() => {
    if (insightFilter === 'all') return insights;
    return insights.filter(insight => insight.priority === insightFilter);
  }, [insights, insightFilter]);

  // Key metrics for the overview
  const overviewMetrics = useMemo(() => {
    return {
      totalInsights: insights.length,
      highPriorityInsights: insights.filter(i => i.priority === 'high').length,
      activePredictions: predictions.length,
      pendingRecommendations: recommendations.filter(r => r.status === 'pending').length,
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
      averageConfidence: insights.length > 0 ? 
        insights.reduce((sum, i) => sum + i.confidenceScore, 0) / insights.length : 0
    };
  }, [insights, predictions, recommendations, alerts]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Trigger data refresh - this would be handled by parent component
      console.log('Auto-refreshing BI data...');
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Loading skeleton
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
            <Skeleton className="h-80 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || (!insights.length && !predictions.length && !recommendations.length && !alerts.length)) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Business Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            <div className="text-center">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay datos de inteligencia de negocio disponibles</p>
              <p className="text-sm mt-2">Los insights se generarán automáticamente con más datos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Business Intelligence
              <Badge variant="outline" className="ml-2">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Powered
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Insights inteligentes y análisis predictivo automatizado
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <Activity className="w-4 h-4 mr-2" />
              Auto-refresh
            </Button>

            <Select value={timeHorizon} onValueChange={setTimeHorizon}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 días</SelectItem>
                <SelectItem value="30d">30 días</SelectItem>
                <SelectItem value="90d">90 días</SelectItem>
                <SelectItem value="1y">1 año</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Overview Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Lightbulb className="w-6 h-6 mx-auto mb-1 text-blue-600" />
            <p className="text-lg font-bold text-blue-900">{overviewMetrics.totalInsights}</p>
            <p className="text-xs text-blue-700">Insights</p>
          </div>

          <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <TrendingUp className="w-6 h-6 mx-auto mb-1 text-purple-600" />
            <p className="text-lg font-bold text-purple-900">{overviewMetrics.activePredictions}</p>
            <p className="text-xs text-purple-700">Predicciones</p>
          </div>

          <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
            <Target className="w-6 h-6 mx-auto mb-1 text-green-600" />
            <p className="text-lg font-bold text-green-900">{overviewMetrics.pendingRecommendations}</p>
            <p className="text-xs text-green-700">Recomendaciones</p>
          </div>

          <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-6 h-6 mx-auto mb-1 text-red-600" />
            <p className="text-lg font-bold text-red-900">{overviewMetrics.criticalAlerts}</p>
            <p className="text-xs text-red-700">Alertas</p>
          </div>

          <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Star className="w-6 h-6 mx-auto mb-1 text-yellow-600" />
            <p className="text-lg font-bold text-yellow-900">{overviewMetrics.highPriorityInsights}</p>
            <p className="text-xs text-yellow-700">Alta Prioridad</p>
          </div>

          <div className="text-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <Zap className="w-6 h-6 mx-auto mb-1 text-gray-600" />
            <p className="text-lg font-bold text-gray-900">{formatPercentage(overviewMetrics.averageConfidence)}</p>
            <p className="text-xs text-gray-700">Confianza</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="insights" className="relative">
              Insights
              {overviewMetrics.highPriorityInsights > 0 && (
                <Badge variant="destructive" className="ml-2 h-4 w-4 p-0 text-xs">
                  {overviewMetrics.highPriorityInsights}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="predictions">Predicciones</TabsTrigger>
            <TabsTrigger value="recommendations">Recomendaciones</TabsTrigger>
            <TabsTrigger value="alerts">
              Alertas
              {overviewMetrics.criticalAlerts > 0 && (
                <Badge variant="destructive" className="ml-2 h-4 w-4 p-0 text-xs">
                  {overviewMetrics.criticalAlerts}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Insights de Negocio</h4>
              <Select value={insightFilter} onValueChange={setInsightFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="high">Alta prioridad</SelectItem>
                  <SelectItem value="medium">Media prioridad</SelectItem>
                  <SelectItem value="low">Baja prioridad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="h-96">
              <div className="space-y-3">
                {filteredInsights.map((insight, index) => (
                  <div 
                    key={insight.id || index}
                    className={cn(
                      "p-4 border rounded-lg cursor-pointer hover:shadow-md transition-all",
                      insight.priorityBg
                    )}
                    onClick={() => onInsightClick?.(insight)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Lightbulb className={cn("w-4 h-4", insight.priorityColor)} />
                        <Badge variant="outline" size="sm">
                          {insight.category}
                        </Badge>
                        <Badge 
                          variant={insight.priority === 'high' ? 'destructive' : 'secondary'}
                          size="sm"
                        >
                          {insight.priority}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{insight.formattedImpact}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatPercentage(insight.confidenceScore)} confianza
                        </p>
                      </div>
                    </div>

                    <h5 className="font-medium mb-1">{insight.title}</h5>
                    <p className="text-sm text-muted-foreground mb-2">
                      {insight.description}
                    </p>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{insight.createdDate}</span>
                      <div className="flex items-center gap-1">
                        <ChevronRight className="w-3 h-3" />
                        <span>Ver detalles</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="space-y-4">
            <h4 className="text-sm font-medium">Análisis Predictivo</h4>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {predictions.map((prediction, index) => (
                  <div 
                    key={prediction.id || index}
                    className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <prediction.trendIcon className={cn("w-4 h-4", prediction.trendColor)} />
                        <Badge variant="outline" size="sm">
                          {prediction.metric}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{prediction.formattedValue}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatPercentage(prediction.accuracyScore)} precisión
                        </p>
                      </div>
                    </div>

                    <h5 className="font-medium mb-1">{prediction.title}</h5>
                    <p className="text-sm text-muted-foreground mb-2">
                      {prediction.description}
                    </p>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Horizonte: {prediction.timeToRealization}
                      </span>
                      <Badge variant="secondary" size="sm">
                        {prediction.trend}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4">
            <h4 className="text-sm font-medium">Recomendaciones Inteligentes</h4>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {recommendations.map((recommendation, index) => (
                  <div 
                    key={recommendation.id || index}
                    className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onRecommendationClick?.(recommendation)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <recommendation.categoryIcon className="w-4 h-4 text-blue-600" />
                        <Badge variant="outline" size="sm">
                          {recommendation.category}
                        </Badge>
                        <Badge 
                          variant={recommendation.priorityLevel === 'high' ? 'destructive' : 'secondary'}
                          size="sm"
                        >
                          {recommendation.priorityLevel}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">
                          ROI: {recommendation.formattedROI}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Esfuerzo: {recommendation.implementationEffort}
                        </p>
                      </div>
                    </div>

                    <h5 className="font-medium mb-1">{recommendation.title}</h5>
                    <p className="text-sm text-muted-foreground mb-2">
                      {recommendation.description}
                    </p>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{recommendation.createdDate}</span>
                      <Button size="sm" variant="outline" className="h-6 text-xs">
                        Implementar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            <h4 className="text-sm font-medium">Alertas del Sistema</h4>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <Alert 
                    key={alert.id || index}
                    className={cn(
                      "cursor-pointer hover:shadow-md transition-all",
                      alert.severityBg,
                      alert.isNew && "ring-2 ring-blue-200"
                    )}
                    onClick={() => onAlertClick?.(alert)}
                  >
                    <alert.severityIcon className={cn("h-4 w-4", alert.severityColor)} />
                    <AlertDescription>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{alert.title}</span>
                            {alert.isNew && (
                              <Badge variant="secondary" size="sm">Nuevo</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {alert.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {alert.createdDate}
                          </p>
                        </div>
                        <Badge 
                          variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                          className="ml-2"
                        >
                          {alert.severity}
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
});

BusinessIntelligencePanel.displayName = 'BusinessIntelligencePanel';

export default BusinessIntelligencePanel;
