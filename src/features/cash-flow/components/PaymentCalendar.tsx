import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import type { ScheduledPaymentGroup } from '../types';

interface PaymentCalendarProps {
  /** Grupos por día desde /payables/schedule */
  pendingPayments: ScheduledPaymentGroup[];
}

const PaymentCalendar = ({ pendingPayments }: PaymentCalendarProps) => {
  const { t } = useI18n();
  return (
    <Card className="border-border-subtle shadow-sm overflow-hidden h-full">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border-subtle px-6 py-5">
        <CardTitle className="text-lg font-black text-foreground uppercase tracking-tight">{t('bi.cashflow.calendar.title', 'Calendario de Pagos Pendientes')}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {pendingPayments.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-bold text-on-surface-deep">{t('bi.cashflow.calendar.empty', 'Sin pagos programados en el período seleccionado.')}</p>
          </div>
        )}
        <div className="divide-y divide-border-subtle">
          {pendingPayments.map((group, idx) => (
            <div key={idx} className={group.isToday ? "" : "bg-surface-muted/30"}>
              <div className="bg-surface-muted/50 px-6 py-3 border-b border-border-subtle flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {group.isToday && (
                    <Badge className="bg-primary hover:bg-primary text-on-primary font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-tighter">{t('bi.cashflow.calendar.today', 'HOY')}</Badge>
                  )}
                  <span className="font-black text-foreground text-xs uppercase tracking-tight">{group.date}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-black text-on-surface-deep uppercase block tracking-widest leading-none mb-1">{t('bi.cashflow.calendar.subtotal', 'Subtotal Salidas')}</span>
                  <span className="text-sm font-mono font-black text-warning tracking-tight tabular-nums">Gs. {group.subtotal.toLocaleString('es-PY')}</span>
                </div>
              </div>
              <div className="divide-y divide-border-subtle">
                {group.items.map((item) => (
                  <div key={item.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-primary/5 transition-colors gap-4 group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-surface-muted flex items-center justify-center font-mono font-black text-on-surface-deep text-xs border border-transparent group-hover:border-primary/20 transition-all">
                        {item.code}
                      </div>
                      <div>
                        <div className="font-black text-foreground text-sm tracking-tight">{item.name}</div>
                        <div className="text-[10px] text-on-surface-deep font-bold mt-0.5">{item.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-12 w-full sm:w-auto">
                      <div className="text-right hidden md:block">
                        <div className="text-[9px] text-on-surface-deep font-black uppercase tracking-widest mb-1">{t('bi.cashflow.calendar.category', 'Categoría')}</div>
                        <div className="text-[11px] font-bold text-on-surface-deep uppercase">{item.category}</div>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <div className="font-mono font-black text-foreground tracking-tight tabular-nums">Gs. {item.amount.toLocaleString('es-PY')}</div>
                        <Badge
                          variant="outline"
                          className={`mt-1 text-[8px] font-black border-none px-0 tracking-tighter ${
                            item.priority === 'PRIORIDAD ALTA' ? 'text-warning' : 'text-on-surface-deep'
                          }`}
                        >
                          {item.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentCalendar;
