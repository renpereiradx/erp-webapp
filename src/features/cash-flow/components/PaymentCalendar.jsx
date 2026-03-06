import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * @param {Object} props
 * @param {Array} props.pendingPayments
 */
const PaymentCalendar = ({ pendingPayments }) => {
  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 dark:border-slate-800/50 px-6 py-5">
        <CardTitle className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Calendario de Pagos Pendientes</CardTitle>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ChevronLeft className="h-4 w-4 text-slate-400" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
          {pendingPayments.map((group, idx) => (
            <div key={idx} className={group.isToday ? "" : "bg-slate-50/30 dark:bg-slate-900/10"}>
              <div className="bg-slate-50/50 dark:bg-slate-800/30 px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {group.isToday && (
                    <Badge className="bg-blue-600 hover:bg-blue-600 text-white font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-tighter">HOY</Badge>
                  )}
                  <span className="font-black text-slate-700 dark:text-slate-200 text-xs uppercase tracking-tight">{group.date}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-black text-slate-400 uppercase block tracking-widest leading-none mb-1">Subtotal Salidas</span>
                  <span className="text-sm font-black text-orange-600 tracking-tight">Gs. {group.subtotal.toLocaleString('es-PY')}</span>
                </div>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {group.items.map((item) => (
                  <div key={item.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors gap-4 group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 text-xs border border-transparent group-hover:border-blue-200 transition-all">
                        {item.code}
                      </div>
                      <div>
                        <div className="font-black text-slate-900 dark:text-white text-sm tracking-tight">{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold mt-0.5">{item.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-12 w-full sm:w-auto">
                      <div className="text-right hidden md:block">
                        <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Categoría</div>
                        <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">{item.category}</div>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <div className="font-black text-slate-900 dark:text-white tracking-tight">Gs. {item.amount.toLocaleString('es-PY')}</div>
                        <Badge 
                          variant="outline" 
                          className={`mt-1 text-[8px] font-black border-none px-0 tracking-tighter ${
                            item.priority === 'PRIORIDAD ALTA' ? 'text-orange-600' : 
                            item.priority === 'RECURRENTE' ? 'text-blue-600' : 'text-slate-500'
                          }`}
                        >
                          {item.priority}
                        </Badge>
                      </div>
                      <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-black text-[10px] h-8 px-3 uppercase tracking-tighter">Programar</Button>
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
