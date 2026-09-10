import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, BanknoteArrowDown, CalendarClock } from 'lucide-react';

import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import clientCreditService, {
  type ClientCredit,
} from '@/services/clientCreditService';
import { PaymentMethodService } from '@/services/paymentMethodService';

interface CreditAccountSectionProps {
  clientId: string;
}

const formatCurrency = (value: number | null | undefined): string =>
  new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(
    value ?? 0,
  );

/**
 * Bloque "Crédito" de la ficha de cliente
 * (PLAN_MONOROL_DESCUENTOS_CREDITO_CLIENTE C6): deuda por moneda con chips
 * de aging, saldo a favor, términos/límite y cobro a cuenta (cash:write).
 * Las allocations son FIFO automáticas por vencimiento en el backend.
 */
export function CreditAccountSection({ clientId }: CreditAccountSectionProps) {
  const { t } = useI18n() as unknown as { t: (key: string, fallback?: string, vars?: Record<string, unknown>) => string };
  const { hasPermission } = useAuth() as unknown as { hasPermission: (p: string) => boolean };
  const canCollect = hasPermission('cash:write');

  const [credit, setCredit] = useState<ClientCredit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collecting, setCollecting] = useState(false);
  const [amount, setAmount] = useState('');
  const [methodId, setMethodId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadCredit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCredit(await clientCreditService.getCredit(clientId));
    } catch (err: unknown) {
      console.error('Error loading client credit:', err);
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    void loadCredit();
  }, [loadCredit]);

  // React Query ya está configurado en la app (pedidos/pagos); lo reuso para
  // los métodos de pago del select de cobro.
  const methodsQuery = useQuery({
    queryKey: ['payment-methods', 'credit-section'],
    queryFn: () => PaymentMethodService.getAll(),
    enabled: canCollect && collecting,
    staleTime: 5 * 60 * 1000,
  });
  const methods = useMemo(() => {
    const list = (methodsQuery.data ?? []) as Array<{ id?: number; description?: string; name?: string }>;
    return list;
  }, [methodsQuery.data]);

  const openDebt = credit?.by_currency.reduce((acc, row) => acc + (row.total_debt ?? 0), 0) ?? 0;

  const startCollect = () => {
    setAmount(openDebt > 0 ? String(openDebt) : '');
    setCollecting(true);
  };

  const submitCollect = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error(t('clients.credit.invalidAmount', 'Ingresá un monto válido.'));
      return;
    }
    setSubmitting(true);
    try {
      const result = await clientCreditService.registerAccountPayment(clientId, {
        amount: value,
        payment_method_id: methodId ? Number(methodId) : undefined,
      });
      toast.success(
        t(
          'clients.credit.collectSuccess',
          'Cobro registrado: {allocated} asignados, {unapplied} a favor.',
          {
            allocated: formatCurrency(result.allocated_total),
            unapplied: formatCurrency(result.unapplied_amount),
          },
        ),
      );
      setCollecting(false);
      setAmount('');
      await loadCredit();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('clients.credit.collectError', 'No se pudo registrar el cobro.'));
    } finally {
      setSubmitting(false);
    }
  };

  const agingChips = (row: ClientCredit['by_currency'][number]) => {
    const chips: string[] = [];
    const push = (label: string, value: number) => {
      if (value > 0) chips.push(`${label}: ${formatCurrency(value)}`);
    };
    push(t('clients.credit.bucket.current', 'Al día'), row.bucket_current);
    push(t('clients.credit.bucket.1_30', '1-30'), row.bucket_1_30);
    push(t('clients.credit.bucket.31_60', '31-60'), row.bucket_31_60);
    push(t('clients.credit.bucket.61_90', '61-90'), row.bucket_61_90);
    push(t('clients.credit.bucket.over_90', '+90'), row.bucket_over_90);
    return chips;
  };

  if (loading) {
    return (
      <div className="p-md rounded-md border border-border-subtle bg-surface-muted text-body-sm text-muted-foreground">
        {t('clients.credit.loading', 'Cargando cuenta corriente…')}
      </div>
    );
  }
  if (error || !credit) {
    return null;
  }

  return (
    <div className="md:col-span-2 space-y-sm">
      <div className="flex items-center justify-between">
        <h4 className="text-label-caps uppercase text-on-surface-deep flex items-center gap-xs">
          <CalendarClock className="size-4 text-primary" />
          {t('clients.credit.title', 'Cuenta Corriente')}
        </h4>
        {canCollect && !collecting && (
          <Button variant="secondary" size="sm" onClick={startCollect} data-testid="credit-collect-button">
            <BanknoteArrowDown className="size-4 mr-xs" />
            {t('clients.credit.collect', 'Registrar cobro a cuenta')}
          </Button>
        )}
      </div>

      {credit.credit_warning && (
        <div className="p-sm rounded-md border border-warning/40 bg-warning/10 text-body-sm text-warning flex items-start gap-xs" role="alert">
          <AlertTriangle className="size-4 mt-0.5 shrink-0" />
          {credit.credit_warning}
        </div>
      )}

      <div className="p-md rounded-md border border-border-subtle bg-surface-muted space-y-sm">
        <div className="flex flex-wrap gap-md text-body-sm">
          <span className="text-muted-foreground">
            {t('clients.credit.terms', 'Términos')}: {credit.credit_terms_days ?? credit.default_credit_terms_days}{' '}
            {t('clients.credit.days', 'días')}
          </span>
          <span className="text-muted-foreground">
            {t('clients.credit.limit', 'Límite')}:{' '}
            {credit.credit_limit != null ? formatCurrency(credit.credit_limit) : t('clients.credit.noLimit', 'sin límite')}
          </span>
          {credit.unapplied_total > 0 && (
            <Badge variant="secondary" size="sm">
              {t('clients.credit.unapplied', 'Saldo a favor')}: {formatCurrency(credit.unapplied_total)}
            </Badge>
          )}
        </div>

        {credit.by_currency.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">
            {t('clients.credit.noDebt', 'Sin deuda pendiente.')}
          </p>
        ) : (
          credit.by_currency.map((row) => (
            <div key={`${row.currency_id ?? 'na'}`} className="flex flex-wrap items-center gap-xs">
              <span className="text-body-md-bold text-foreground">
                {row.currency_code ?? '—'}: {formatCurrency(row.total_debt)}
              </span>
              <span className="text-body-sm text-muted-foreground">
                ({row.open_sales} {t('clients.credit.openSales', 'ventas abiertas')})
              </span>
              {agingChips(row).map((chip) => (
                <span
                  key={chip}
                  className="px-xs py-0.5 rounded bg-surface border border-border-subtle text-label-caps text-muted-foreground"
                >
                  {chip}
                </span>
              ))}
            </div>
          ))
        )}
      </div>

      {canCollect && collecting && (
        <div className="p-md rounded-md border border-primary/30 bg-primary/5 space-y-sm" data-testid="credit-collect-form">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
            <label className="space-y-xs">
              <span className="text-label-caps uppercase text-muted-foreground">{t('clients.credit.amount', 'Monto del cobro')}</span>
              <Input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                aria-label={t('clients.credit.amount', 'Monto del cobro')}
              />
            </label>
            <label className="space-y-xs">
              <span className="text-label-caps uppercase text-muted-foreground">{t('clients.credit.method', 'Método de pago')}</span>
              <select
                value={methodId}
                onChange={(e) => setMethodId(e.target.value)}
                aria-label={t('clients.credit.method', 'Método de pago')}
                className="h-10 w-full rounded-md border border-border-subtle bg-surface px-sm text-body-md text-foreground"
              >
                <option value="">{t('clients.credit.methodDefault', 'Usar el predeterminado')}</option>
                {methods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.description || m.name || m.id}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-body-sm text-muted-foreground">
            {t('clients.credit.fifoNote', 'El cobro se asigna automáticamente a las ventas más viejas por vencimiento (FIFO).')}
          </p>
          <div className="flex gap-sm justify-end">
            <Button variant="secondary" size="sm" onClick={() => setCollecting(false)} disabled={submitting}>
              {t('action.cancel', 'Cancelar')}
            </Button>
            <Button variant="primary" size="sm" onClick={() => void submitCollect()} disabled={submitting} data-testid="credit-collect-confirm">
              {submitting ? t('common.saving', 'Guardando…') : t('clients.credit.confirm', 'Registrar cobro')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreditAccountSection;
