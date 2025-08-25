/**
 * Reports Dashboard Component
 * Wave 6: Advanced Analytics & Reporting - Phase 3
 * 
 * Central hub for report management, generation, and scheduling
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  FileText, 
  Plus,
  Download, 
  Eye, 
  Calendar,
  Clock,
  Search,
  Filter,
  MoreVertical,
  Copy,
  Trash2,
  Edit,
  Share,
  Schedule,
  History,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  FilePdf,
  FileType,
  PlayCircle,
  PauseCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Mail
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatDate, formatFileSize } from '@/utils/formatting';
import useReportsStore from '@/store/useReportsStore';
import ReportBuilder from './ReportBuilder';

const ReportsDashboard = ({ 
  className = "",
  analyticsData = {}
}) => {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  const {
    templates,
    reportHistory,
    scheduledReports,
    isGenerating,
    error,
    activeTab,
    loadTemplates,
    loadReportHistory,
    generateReport,
    deleteReport,
    downloadReport,
    setActiveTab,
    clearError
  } = useReportsStore();

  useEffect(() => {
    loadTemplates();
    loadReportHistory();
  }, []);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const filteredHistory = reportHistory.filter(report => {
    return report.templateName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getFormatIcon = (format) => {
    switch (format.toLowerCase()) {
      case 'pdf':
        return <FilePdf className="h-4 w-4 text-red-600" />;
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
      case 'csv':
        return <FileType className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const QuickStatsCard = ({ title, value, icon: Icon, trend, color = "blue" }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <p className="text-xs text-gray-500 mt-1">{trend}</p>
            )}
          </div>
          <div className={`p-3 rounded-full bg-${color}-100`}>
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const TemplateCard = ({ template }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">{template.name}</h3>
            <p className="text-xs text-gray-600 mb-2">{template.description}</p>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {template.category}
              </Badge>
              <span className="text-xs text-gray-500">
                {template.fields.length} {t('reports.fields')}
              </span>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                // Set selected template and open builder
                setBuilderOpen(true);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                {t('reports.useTemplate')}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" />
                {t('reports.duplicate')}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share className="h-4 w-4 mr-2" />
                {t('reports.share')}
              </DropdownMenuItem>
              {template.isCustom && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('common.delete')}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {template.exportFormats.map(format => (
              <Badge key={format} variant="outline" className="text-xs px-1 py-0">
                {format.toUpperCase()}
              </Badge>
            ))}
          </div>
          
          <Button 
            size="sm" 
            onClick={() => setBuilderOpen(true)}
            className="text-xs"
          >
            <PlayCircle className="h-3 w-3 mr-1" />
            {t('reports.generate')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const HistoryItem = ({ report }) => (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getFormatIcon(report.format)}
            <div>
              <h4 className="font-semibold text-sm">{report.templateName}</h4>
              <p className="text-xs text-gray-600">
                {t('reports.generatedOn')} {formatDate(new Date(report.generatedAt))}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-xs text-gray-500">
                {formatFileSize(report.size)} • {report.duration}ms
              </p>
              <Badge variant="outline" className="text-xs">
                {report.format.toUpperCase()}
              </Badge>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => downloadReport(report)}>
                  <Download className="h-4 w-4 mr-2" />
                  {t('common.download')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setSelectedReport(report);
                  setPreviewOpen(true);
                }}>
                  <Eye className="h-4 w-4 mr-2" />
                  {t('common.preview')}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share className="h-4 w-4 mr-2" />
                  {t('reports.share')}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="h-4 w-4 mr-2" />
                  {t('reports.duplicate')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => deleteReport(report.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ScheduledReportItem = ({ schedule }) => (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${schedule.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
              {schedule.isActive ? (
                <PlayCircle className="h-4 w-4 text-green-600" />
              ) : (
                <PauseCircle className="h-4 w-4 text-gray-600" />
              )}
            </div>
            <div>
              <h4 className="font-semibold text-sm">{schedule.name}</h4>
              <p className="text-xs text-gray-600">
                {schedule.frequency} • {t('reports.nextRun')}: {formatDate(new Date(schedule.nextRun))}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant={schedule.isActive ? 'default' : 'secondary'}>
              {schedule.isActive ? t('common.active') : t('common.paused')}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  {t('reports.editSchedule')}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  {schedule.isActive ? (
                    <>
                      <PauseCircle className="h-4 w-4 mr-2" />
                      {t('reports.pauseSchedule')}
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      {t('reports.resumeSchedule')}
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('reports.runNow')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('reports.title')}</h1>
          <p className="text-gray-600">{t('reports.description')}</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button 
            variant="outline"
            onClick={() => {
              loadReportHistory();
              loadTemplates();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.refresh')}
          </Button>
          
          <Button onClick={() => setBuilderOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('reports.newReport')}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-700">{error}</span>
          <Button variant="ghost" size="sm" onClick={clearError}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickStatsCard
          title={t('reports.stats.totalReports')}
          value={reportHistory.length}
          icon={FileText}
          trend={t('reports.stats.thisMonth')}
          color="blue"
        />
        <QuickStatsCard
          title={t('reports.stats.templates')}
          value={templates.length}
          icon={BarChart3}
          trend={`${templates.filter(t => t.isCustom).length} ${t('reports.stats.custom')}`}
          color="green"
        />
        <QuickStatsCard
          title={t('reports.stats.scheduled')}
          value={scheduledReports.length}
          icon={Calendar}
          trend={`${scheduledReports.filter(s => s.isActive).length} ${t('common.active')}`}
          color="purple"
        />
        <QuickStatsCard
          title={t('reports.stats.thisWeek')}
          value={reportHistory.filter(r => {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return new Date(r.generatedAt) > weekAgo;
          }).length}
          icon={TrendingUp}
          trend={t('reports.stats.weeklyTrend')}
          color="orange"
        />
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <TabsList className="grid w-full sm:w-auto grid-cols-3">
            <TabsTrigger value="templates">{t('reports.templates')}</TabsTrigger>
            <TabsTrigger value="history">{t('reports.history')}</TabsTrigger>
            <TabsTrigger value="scheduled">{t('reports.scheduled')}</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            {activeTab === 'templates' && (
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">{t('reports.allCategories')}</option>
                <option value="sales">{t('reports.categories.sales')}</option>
                <option value="products">{t('reports.categories.products')}</option>
                <option value="customers">{t('reports.categories.customers')}</option>
                <option value="payments">{t('reports.categories.payments')}</option>
                <option value="custom">{t('reports.categories.custom')}</option>
              </select>
            )}
          </div>
        </div>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <TemplateCard key={template.id} template={template} />
            ))}
            
            {filteredTemplates.length === 0 && (
              <div className="col-span-full text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('reports.noTemplates')}
                </h3>
                <p className="text-gray-600 mb-4">{t('reports.noTemplatesDescription')}</p>
                <Button onClick={() => setBuilderOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('reports.createTemplate')}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {filteredHistory.map(report => (
            <HistoryItem key={report.id} report={report} />
          ))}
          
          {filteredHistory.length === 0 && (
            <div className="text-center py-12">
              <History className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('reports.noHistory')}
              </h3>
              <p className="text-gray-600">{t('reports.noHistoryDescription')}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          {scheduledReports.map(schedule => (
            <ScheduledReportItem key={schedule.id} schedule={schedule} />
          ))}
          
          {scheduledReports.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('reports.noScheduled')}
              </h3>
              <p className="text-gray-600 mb-4">{t('reports.noScheduledDescription')}</p>
              <Button>
                <Schedule className="h-4 w-4 mr-2" />
                {t('reports.scheduleReport')}
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Report Builder Dialog */}
      <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
        <DialogContent className="max-w-7xl w-full h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('reports.builder.title')}</DialogTitle>
            <DialogDescription>
              {t('reports.builder.description')}
            </DialogDescription>
          </DialogHeader>
          
          <ReportBuilder
            analyticsData={analyticsData}
            onReportGenerated={(report) => {
              setBuilderOpen(false);
              // Optionally show success message or redirect
            }}
            onClose={() => setBuilderOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Report Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t('reports.preview')}</DialogTitle>
            <DialogDescription>
              {selectedReport?.templateName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">{t('reports.metadata')}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">{t('reports.format')}:</span>
                    <span className="ml-2">{selectedReport.format.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">{t('reports.size')}:</span>
                    <span className="ml-2">{formatFileSize(selectedReport.size)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">{t('reports.generated')}:</span>
                    <span className="ml-2">{formatDate(new Date(selectedReport.generatedAt))}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">{t('reports.duration')}:</span>
                    <span className="ml-2">{selectedReport.duration}ms</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button onClick={() => downloadReport(selectedReport)}>
                  <Download className="h-4 w-4 mr-2" />
                  {t('common.download')}
                </Button>
                <Button variant="outline">
                  <Share className="h-4 w-4 mr-2" />
                  {t('reports.share')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportsDashboard;
