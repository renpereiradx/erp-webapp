/**
 * Enhanced Purchases Page - Wave 4 UX & Accessibility
 * Página principal con accesibilidad WCAG 2.1 AA y diseño responsive
 * 
 * @since Wave 4 - UX & Accessibility Enterprise
 * @author Sistema ERP
 */

import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter,
  Grid,
  List,
  Settings,
  MoreVertical
} from 'lucide-react';

// Wave 4: Accessibility and responsive imports
import { 
  useAccessibility, 
  useFocusManagement, 
  useScreenReaderAnnouncement,
  useKeyboardNavigation 
} from '@/accessibility/hooks';
import { 
  ScreenReaderOnly,
  SkipLink,
  AccessibleButton,
  AccessibleModal,
  AriaLive
} from '@/components/accessibility/AccessibleComponents';
import { useResponsive, useMediaQuery } from '@/responsive/hooks';
import { useTheme, useThemeClasses } from '@/themes/ThemeProvider';
import ThemeSelector from '@/components/ui/ThemeSelector';

// Wave 3: Performance imports
import { useTelemetry } from '@/hooks/useTelemetry';
import { usePerformanceOptimizations } from '@/hooks/usePerformanceOptimizations';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useAnalyticsWorker } from '@/hooks/useAnalyticsWorker';

// Wave 1-2: Core functionality
import usePurchaseStore from '@/store/usePurchaseStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import PageHeader from '@/components/ui/PageHeader';

// Lazy loaded components
const VirtualizedPurchaseList = lazy(() => import('@/components/purchases/VirtualizedPurchaseList'));
const PurchaseModal = lazy(() => import('@/components/purchases/PurchaseModal'));
const PurchaseFilters = lazy(() => import('@/components/purchases/PurchaseFilters'));
const Wave3StatusPanel = lazy(() => import('@/components/Wave3StatusPanel'));

const PurchasesEnhanced = () => {
  const { t } = useTranslation();
  const themeClasses = useThemeClasses();
  const { currentTheme } = useTheme();
  
  // Accessibility hooks
  const { 
    isUsingKeyboard, 
    isUsingScreenReader, 
    shouldReduceMotion 
  } = useAccessibility();
  
  const { announce, announceError, announceSuccess, AnnouncementRegion } = useScreenReaderAnnouncement();
  const { saveFocus, restoreFocus } = useFocusManagement();
  
  // Responsive hooks
  const { 
    isMobileRange, 
    isTabletUp, 
    currentBreakpoint, 
    columns 
  } = useResponsive();
  
  const isNarrowScreen = useMediaQuery('(max-width: 768px)');
  
  // Store y performance
  const {
    purchases,
    loading,
    error,
    loadPurchases,
    createPurchase,
    updatePurchase,
    deletePurchase
  } = usePurchaseStore();
  
  const { trackEvent } = useTelemetry();
  const swState = useServiceWorker();
  const workerState = useAnalyticsWorker();
  
  // Estado local
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState(isMobileRange ? 'list' : 'grid');
  const [selectedPurchases, setSelectedPurchases] = useState([]);
  
  // Keyboard shortcuts
  const shortcuts = useMemo(() => ({
    'ctrl+n': () => handleCreatePurchase(),
    'ctrl+f': () => document.getElementById('search-input')?.focus(),
    'ctrl+shift+f': () => setShowFilters(prev => !prev),
    'escape': () => {
      if (isModalOpen) {
        handleCloseModal();
      } else if (showFilters) {
        setShowFilters(false);
      } else if (showSettings) {
        setShowSettings(false);
      }
    },
    'ctrl+shift+t': () => setShowSettings(prev => !prev),
    'ctrl+shift+v': () => toggleViewMode()
  }), [isModalOpen, showFilters, showSettings]);
  
  useKeyboardNavigation(shortcuts);
  
  // Efectos
  useEffect(() => {
    loadPurchases();
    announce(t('purchases.messages.loading'));
  }, [loadPurchases, announce, t]);
  
  useEffect(() => {
    if (error) {
      announceError(t('purchases.messages.error'));
    }
  }, [error, announceError, t]);
  
  useEffect(() => {
    if (purchases?.length > 0) {
      announce(t('purchases.messages.loaded', { count: purchases.length }));
    }
  }, [purchases, announce, t]);
  
  // Ajustar view mode según breakpoint
  useEffect(() => {
    setViewMode(isMobileRange ? 'list' : 'grid');
  }, [isMobileRange]);
  
  // Handlers
  const handleCreatePurchase = useCallback(() => {
    setEditingPurchase(null);
    setIsModalOpen(true);
    saveFocus();
    announce(t('accessibility.modals.openModal', { type: t('purchases.create') }));
    trackEvent('purchase.modal.open', { type: 'create' });
  }, [saveFocus, announce, t, trackEvent]);
  
  const handleEditPurchase = useCallback((purchase) => {
    setEditingPurchase(purchase);
    setIsModalOpen(true);
    saveFocus();
    announce(t('accessibility.modals.openModal', { type: t('purchases.edit') }));
    trackEvent('purchase.modal.open', { type: 'edit', id: purchase.id });
  }, [saveFocus, announce, t, trackEvent]);
  
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingPurchase(null);
    restoreFocus();
    announce(t('accessibility.modals.closeModal'));
  }, [restoreFocus, announce, t]);
  
  const handleSubmitPurchase = useCallback(async (data) => {
    try {
      if (editingPurchase) {
        await updatePurchase(editingPurchase.id, data);
        announceSuccess(t('purchases.messages.updated'));
      } else {
        await createPurchase(data);
        announceSuccess(t('purchases.messages.created'));
      }
      handleCloseModal();
    } catch (error) {
      announceError(t('purchases.messages.error'));
    }
  }, [editingPurchase, updatePurchase, createPurchase, handleCloseModal, announceSuccess, announceError, t]);
  
  const handleDeletePurchase = useCallback(async (id) => {
    if (window.confirm(t('purchases.messages.deleteConfirm'))) {
      try {
        await deletePurchase(id);
        announceSuccess(t('purchases.messages.deleted'));
        trackEvent('purchase.deleted', { id });
      } catch (error) {
        announceError(t('purchases.messages.error'));
      }
    }
  }, [deletePurchase, announceSuccess, announceError, t, trackEvent]);
  
  const toggleViewMode = useCallback(() => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
    trackEvent('purchases.view_mode.toggle', { mode: viewMode === 'grid' ? 'list' : 'grid' });
  }, [viewMode, trackEvent]);
  
  const handleSearch = useCallback((value) => {
    setSearchQuery(value);
    trackEvent('purchases.search', { query: value });
  }, [trackEvent]);
  
  // Filtros de búsqueda
  const filteredPurchases = useMemo(() => {
    if (!searchQuery) return purchases;
    
    return purchases.filter(purchase => 
      purchase.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.supplier?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.total?.toString().includes(searchQuery)
    );
  }, [purchases, searchQuery]);
  
  // Clases responsive
  const containerClasses = useMemo(() => ({
    main: `
      min-h-screen transition-colors duration-300
      ${themeClasses.bg.primary} ${themeClasses.text.primary}
      ${shouldReduceMotion ? '' : 'transition-all duration-300'}
    `,
    header: `
      ${themeClasses.bg.secondary} ${themeClasses.border.primary}
      border-b p-4 md:p-6
    `,
    content: `
      p-4 md:p-6 space-y-6
    `,
    toolbar: `
      flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between
      ${themeClasses.bg.secondary} ${themeClasses.border.primary}
      p-4 rounded-lg border
    `,
    grid: viewMode === 'grid' 
      ? `grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(columns, 3)}`
      : 'space-y-4'
  }), [themeClasses, shouldReduceMotion, viewMode, columns]);
  
  return (
    <div className={containerClasses.main}>
      {/* Skip Links */}
      <SkipLink href="#main-content" />
      <SkipLink href="#search-input">{t('accessibility.skipToSearch')}</SkipLink>
      
      {/* Header */}
      <header className={containerClasses.header}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${themeClasses.text.primary}`}>
              {t('purchases.title')}
            </h1>
            <p className={`mt-1 ${themeClasses.text.secondary}`}>
              {t('purchases.subtitle')}
            </p>
          </div>
          
          {/* Theme selector - mobile en dropdown, desktop visible */}
          <div className="flex items-center gap-2">
            {isTabletUp ? (
              <ThemeSelector compact />
            ) : (
              <AccessibleButton
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
                aria-label={t('accessibility.openSettings')}
                icon={Settings}
              />
            )}
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main id="main-content" className={containerClasses.content}>
        {/* Toolbar */}
        <div className={containerClasses.toolbar}>
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <label htmlFor="search-input" className="sr-only">
                {t('purchases.search')}
              </label>
              <Input
                id="search-input"
                type="text"
                placeholder={t('purchases.search')}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className={`pl-10 ${themeClasses.focusRing}`}
                aria-describedby="search-help"
              />
              <Search 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" 
                aria-hidden="true"
              />
              <ScreenReaderOnly id="search-help">
                {t('accessibility.searchHelp')}
              </ScreenReaderOnly>
            </div>
            
            {/* Filters */}
            <AccessibleButton
              variant="outline"
              onClick={() => setShowFilters(prev => !prev)}
              aria-expanded={showFilters}
              aria-label={t('accessibility.filterButton')}
              icon={Filter}
            >
              {!isMobileRange && t('common.filter')}
            </AccessibleButton>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* View mode toggle - solo en desktop */}
            {isTabletUp && (
              <AccessibleButton
                variant="outline"
                size="sm"
                onClick={toggleViewMode}
                aria-label={t('accessibility.toggleView', { mode: viewMode })}
                icon={viewMode === 'grid' ? List : Grid}
              />
            )}
            
            {/* Create button */}
            <AccessibleButton
              variant="primary"
              onClick={handleCreatePurchase}
              icon={Plus}
              aria-describedby="create-help"
            >
              {isMobileRange ? '' : t('purchases.create')}
              <ScreenReaderOnly id="create-help">
                {t('accessibility.createPurchaseHelp')}
              </ScreenReaderOnly>
            </AccessibleButton>
          </div>
        </div>
        
        {/* Filters Panel */}
        {showFilters && (
          <Card className={`${themeClasses.bg.primary} ${themeClasses.border.primary}`}>
            <CardHeader>
              <CardTitle>{t('purchases.filters.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>{t('common.loading')}</div>}>
                <PurchaseFilters onClose={() => setShowFilters(false)} />
              </Suspense>
            </CardContent>
          </Card>
        )}
        
        {/* Performance Status - solo desktop */}
        {isTabletUp && (
          <Suspense fallback={null}>
            <Wave3StatusPanel
              serviceWorker={swState}
              analyticsWorker={workerState}
              virtualScrolling={filteredPurchases?.length > 100}
              className="lg:max-w-md"
            />
          </Suspense>
        )}
        
        {/* Content */}
        {loading ? (
          <div 
            className="flex items-center justify-center py-12"
            role="status"
            aria-live="polite"
          >
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
              <p>{t('purchases.messages.loading')}</p>
            </div>
          </div>
        ) : error ? (
          <div 
            className="text-center py-12"
            role="alert"
            aria-live="assertive"
          >
            <p className="text-red-600">{t('purchases.messages.error')}</p>
            <AccessibleButton
              variant="outline"
              onClick={() => loadPurchases()}
              className="mt-4"
            >
              {t('common.retry')}
            </AccessibleButton>
          </div>
        ) : filteredPurchases?.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('purchases.messages.empty')}
            </h3>
            <AccessibleButton
              variant="primary"
              onClick={handleCreatePurchase}
            >
              {t('purchases.create')}
            </AccessibleButton>
          </div>
        ) : (
          <div className={containerClasses.grid}>
            <Suspense 
              fallback={
                <div role="status" aria-label={t('common.loading')}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div 
                      key={i}
                      className="h-48 bg-gray-200 rounded-lg animate-pulse"
                      aria-hidden="true"
                    />
                  ))}
                </div>
              }
            >
              <VirtualizedPurchaseList
                purchases={filteredPurchases}
                viewMode={viewMode}
                onEdit={handleEditPurchase}
                onDelete={handleDeletePurchase}
                selectedItems={selectedPurchases}
                onSelectItems={setSelectedPurchases}
              />
            </Suspense>
          </div>
        )}
      </main>
      
      {/* Modal */}
      {isModalOpen && (
        <Suspense fallback={null}>
          <PurchaseModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSubmit={handleSubmitPurchase}
            initialData={editingPurchase}
            mode={editingPurchase ? 'edit' : 'create'}
          />
        </Suspense>
      )}
      
      {/* Settings Modal - Mobile */}
      {showSettings && isMobileRange && (
        <AccessibleModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          title={t('common.settings')}
          size="sm"
        >
          <div className="space-y-6">
            <ThemeSelector />
          </div>
        </AccessibleModal>
      )}
      
      {/* Announcements for screen readers */}
      <AnnouncementRegion />
      
      {/* Live region for dynamic updates */}
      <AriaLive priority="polite">
        {loading && t('purchases.messages.loading')}
      </AriaLive>
    </div>
  );
};

export default PurchasesEnhanced;
