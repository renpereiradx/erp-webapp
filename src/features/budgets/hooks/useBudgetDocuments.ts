/**
 * useBudgetDocuments — impresión de comprobantes de presupuesto (PLAN
 * presupuestos: impresión con impresora + PDF).
 *
 * Comparte el patrón del panel fiscal (useSaleFiscalPanel): la impresión es
 * OPCIONAL — `printConfigured` consulta /api/v1/printers y expone si hay una
 * RECEIPT activa+default; sin impresora el caller deshabilita con hint
 * (título) en lugar de golpear el 404 del backend. Las acciones exigen
 * documents:read (VNDR01/CAJA01 lo tienen).
 *
 * Usado por BudgetDetail (botones Imprimir/PDF + modal post-aprobación) y
 * BudgetManagement (acción de fila "Imprimir PDF").
 */
import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { budgetService } from '@/services/budgetService';
import { printersService } from '@/features/printers/services/printersService';

/** Dispara la descarga del blob en el navegador (a[download] + object URL). */
const saveBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export interface BudgetDocumentsState {
  /** true = el usuario puede interactuar con documents (documents:read). */
  canUseDocuments: boolean;
  /** true = hay RECEIPT activa+default; false = sin impresora; null = indeterminado. */
  printConfigured: boolean | null;
  printing: boolean;
  downloading: boolean;
  print: (budgetId: string) => Promise<void>;
  downloadPdf: (budgetId: string) => Promise<void>;
}

export const useBudgetDocuments = (): BudgetDocumentsState => {
  const { t } = useI18n();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canUseDocuments = hasPermission('documents:read');

  const [printing, setPrinting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { data: printers } = useQuery({
    queryKey: ['printers-active'] as const,
    queryFn: () => printersService.list({ active: true }),
    enabled: canUseDocuments,
  });
  const printConfigured: boolean | null = !canUseDocuments
    ? false
    : printers
      ? printers.some((p) => p.purpose === 'RECEIPT' && p.is_default)
      : null;

  const print = useCallback(
    async (budgetId: string) => {
      setPrinting(true);
      try {
        const result = await budgetService.printTicket(budgetId);
        toast.success(
          t('budgets.print.printSent', 'Ticket enviado a {printer}', { printer: result.printer }),
        );
      } catch {
        toast.error(t('budgets.print.printError', 'No se pudo imprimir el ticket'));
      } finally {
        setPrinting(false);
      }
    },
    [t, toast],
  );

  const downloadPdf = useCallback(
    async (budgetId: string) => {
      setDownloading(true);
      try {
        const { blob, filename } = await budgetService.downloadPdf(budgetId);
        saveBlob(blob, filename);
        toast.success(t('budgets.print.pdfOk', 'PDF descargado'));
      } catch {
        toast.error(t('budgets.print.pdfError', 'No se pudo descargar el PDF'));
      } finally {
        setDownloading(false);
      }
    },
    [t, toast],
  );

  return { canUseDocuments, printConfigured, printing, downloading, print, downloadPdf };
};
