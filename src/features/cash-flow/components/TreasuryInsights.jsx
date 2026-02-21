import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Lightbulb, 
  AlertTriangle, 
  Building2, 
  CheckCircle2 
} from "lucide-react";

/**
 * @param {Object} props
 * @param {Array} props.bankPositions
 */
const TreasuryInsights = ({ bankPositions }) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Insights de Tesorería</h3>
      </div>

      {/* Insight Card: Optimization */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-5 rounded-xl space-y-3 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 text-blue-100 dark:text-blue-800/20 group-hover:text-blue-200 transition-colors pointer-events-none">
          <Lightbulb className="h-10 w-10" />
        </div>
        <div className="flex items-center justify-between">
          <div className="font-black text-blue-900 dark:text-blue-200 text-xs uppercase tracking-widest">Optimización de Descuento</div>
          <Lightbulb className="h-4 w-4 text-blue-500" />
        </div>
        <p className="text-[11px] text-blue-800/80 dark:text-blue-300 leading-relaxed font-bold tracking-tight">
          El proveedor <strong className="font-black text-blue-900 dark:text-blue-100">Logística Global</strong> ofrece un 2% de descuento por pronto pago si se liquida antes del 18 de Octubre. 
          <br/>
          Ahorro potencial: <span className="font-black text-green-600">$2,450.00</span>.
        </p>
        <div className="pt-2 flex gap-3">
          <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700 border-none text-[10px] font-black h-8 shadow-sm uppercase tracking-tighter px-4">Aplicar Pago Ahora</Button>
          <Button size="sm" variant="ghost" className="text-blue-600 dark:text-blue-400 hover:bg-blue-100/50 hover:text-blue-700 text-[10px] font-black h-8 uppercase tracking-tighter px-4">Omitir</Button>
        </div>
      </div>

      {/* Insight Card: Risk */}
      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-5 rounded-xl space-y-3">
        <div className="flex items-start justify-between">
          <div className="font-black text-orange-900 dark:text-orange-200 text-xs uppercase tracking-widest">Riesgo de Liquidez</div>
          <AlertTriangle className="h-4 w-4 text-orange-500" />
        </div>
        <p className="text-[11px] text-orange-800/80 dark:text-orange-300 leading-relaxed font-bold tracking-tight">
          Se proyecta un balance negativo de <span className="font-black text-orange-900 dark:text-orange-100">-$14,200</span> el día 22 de Octubre debido a la coincidencia de pagos de nómina e impuestos.
        </p>
        <div className="pt-2">
          <Button size="sm" variant="outline" className="w-full bg-white dark:bg-slate-800 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 hover:bg-orange-50 hover:text-orange-800 text-[10px] font-black h-9 uppercase tracking-tighter shadow-sm">
            Ver Escenarios de Ajuste
          </Button>
        </div>
      </div>

      {/* Bank Positions Card */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm p-6 overflow-hidden relative">
        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-5 leading-none">Posición por Banco</h4>
        <div className="space-y-4">
          {bankPositions.map((bank, i) => (
            <div key={i} className="flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-50 transition-colors border border-transparent group-hover:border-blue-100">
                  <Building2 className="h-4 w-4 text-slate-400 group-hover:text-blue-500" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors tracking-tight uppercase">{bank.name}</div>
                  <div className="text-[9px] font-black text-slate-400 tracking-widest">{bank.account}</div>
                </div>
              </div>
              <div className="text-xs font-black text-slate-900 dark:text-white tracking-tighter">{bank.amount}</div>
            </div>
          ))}
        </div>
        <Button variant="ghost" className="w-full mt-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-[10px] font-black uppercase tracking-widest h-8 transition-all border border-transparent hover:border-blue-100">
          Conciliar todas las cuentas
        </Button>
      </Card>
    </div>
  );
};

export default TreasuryInsights;
