import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Star, Clock, AlertCircle, TrendingUp, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AnalysisCards = ({ rating, terms }) => {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Payment Rating */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full group transition-all duration-300 hover:shadow-xl">
        <CardContent className="p-8 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-shrink-0 text-center group-hover:scale-105 transition-transform duration-500">
            <div className="text-6xl font-black text-blue-600 mb-2 leading-none tracking-tighter">{rating.score}</div>
            <div className="flex gap-1 justify-center text-blue-600 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`h-5 w-5 ${s <= rating.stars ? 'fill-blue-600' : 'text-slate-200 fill-slate-200'}`} />
              ))}
            </div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Score de Pago</p>
          </div>
          <div className="hidden md:block h-24 w-px bg-slate-200 dark:bg-slate-700 shadow-sm shadow-white/10"></div>
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Calificación de Pago</h4>
              <ShieldCheck className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm font-bold uppercase tracking-tight">
              {rating.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Credit Terms */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm h-full group transition-all duration-300 hover:shadow-xl">
        <CardContent className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-3">
              <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Términos de Crédito</h4>
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <Badge variant="outline" className="text-[10px] font-black text-blue-600 px-3 py-1 bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 uppercase tracking-widest shadow-sm">
              Actualizado hace 2h
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-1 group/item">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Términos Base</p>
              <p className="font-black text-slate-900 dark:text-white tracking-tight text-lg group-hover/item:text-blue-500 transition-colors">{terms.base}</p>
            </div>
            <div className="space-y-1 group/item">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Factura más antigua</p>
              <div className="flex items-center gap-2">
                <p className="font-black text-red-500 tracking-tight text-lg group-hover/item:translate-x-1 transition-transform">{terms.oldestInvoice}</p>
                <AlertCircle className="h-4 w-4 text-red-500 animate-pulse" />
              </div>
            </div>
            <div className="space-y-1 group/item">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Límite de Crédito</p>
              <p className="font-black text-slate-900 dark:text-white tracking-tight text-lg group-hover/item:text-blue-500 transition-colors">
                ${terms.creditLimit.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1 group/item">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Crédito Disponible</p>
              <p className="font-black text-green-600 tracking-tight text-lg group-hover/item:text-green-500 transition-colors">
                ${terms.availableCredit.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default AnalysisCards;
