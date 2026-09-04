/**
 * PrintersPage — administración de impresoras de tickets (contexto documents
 * del backend). Workspace maestro-detalle: listado con búsqueda + formulario
 * de alta/edición. Ruta /configuracion/impresoras, gating documents:read.
 *
 * La impresión es OPCIONAL en el sistema: sin impresoras registradas las
 * demás UI degradan (sin botón de impresión), nunca fallan.
 */
import React from 'react';
import { Plus, Printer as PrinterIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GenericSkeletonList from '@/components/ui/GenericSkeletonList';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { useI18n } from '@/lib/i18n';
import { usePrinters } from '@/features/printers/hooks/usePrinters';
import PrinterList from '@/features/printers/components/PrinterList';
import PrinterDetailForm from '@/features/printers/components/PrinterDetailForm';

export const PrintersPage: React.FC = () => {
  const { t } = useI18n();
  const {
    printers, totalPrinters, isLoading, error, refetch,
    selectedId, selectedPrinter,
    searchQuery, setSearchQuery,
    selectPrinter, startCreate, closeDetail,
    savePrinter, deletePrinter, testPrinter,
    saving, deleting, testing,
  } = usePrinters();

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header de página */}
      <div className="flex flex-wrap items-center justify-between gap-md">
        <div>
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-text-main flex items-center gap-3">
            <span className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <PrinterIcon size={20} />
            </span>
            {t('printers.title', 'Impresoras de tickets')}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {t('printers.subtitle', 'Impresoras térmicas para tickets POS (red, puerto 9100)')}
          </p>
        </div>
        {selectedId === null && (
          <Button variant="primary" size="sm" className="h-9 text-xs font-bold gap-1.5" onClick={startCreate}>
            <Plus size={14} /> {t('printers.empty.action', 'Nueva impresora')}
          </Button>
        )}
      </div>

      {isLoading && <GenericSkeletonList count={4} data-testid="printers-skeleton" />}

      {!isLoading && error && (
        <ErrorState
          title={t('printers.error.load', 'No se pudieron cargar las impresoras')}
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => { void refetch(); }}
        />
      )}

      {/* Maestro-detalle: list 8 col + form 4 col cuando hay selección */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
          <div className={selectedId !== null ? 'lg:col-span-8' : 'lg:col-span-12'}>
            {totalPrinters === 0 && !searchQuery ? (
              <EmptyState
                icon={PrinterIcon}
                title={t('printers.empty.title', 'Sin impresoras configuradas')}
                description={t('printers.empty.description', 'Registrá una impresora de red para imprimir tickets desde el POS')}
                actionLabel={t('printers.empty.action', 'Nueva impresora')}
                onAction={startCreate}
              />
            ) : (
              <PrinterList
                printers={printers}
                totalPrinters={totalPrinters}
                selectedPrinterId={selectedId === 'new' ? null : selectedId}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSelectPrinter={selectPrinter}
              />
            )}
          </div>

          {selectedId !== null && (
            <div className="lg:col-span-4 animate-in fade-in duration-150">
              <PrinterDetailForm
                key={selectedId}
                printer={selectedPrinter}
                saving={saving}
                testing={testing}
                deleting={deleting}
                onSave={(values) => { void savePrinter(values); }}
                onDelete={(id) => { void deletePrinter(id); }}
                onTest={(id) => { void testPrinter(id); }}
                onCancel={closeDetail}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrintersPage;
