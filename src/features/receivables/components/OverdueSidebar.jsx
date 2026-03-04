import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { Calendar, Play, ChevronRight, Sparkles, MoreHorizontal } from 'lucide-react';

/**
 * Widgets laterales para la página de Cuentas Vencidas.
 * Fiel al diseño de Stitch y todo en español.
 */
const OverdueSidebar = ({ toast }) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-6">
      
      {/* Widget 1: Tareas de Hoy */}
      <div className="bg-white dark:bg-[#1A2633] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">Tareas de Hoy</h3>
          <button 
            disabled
            onClick={() => toast.info(t('common.not_implemented'))}
            className="text-[10px] font-bold text-slate-300 dark:text-slate-600 cursor-not-allowed uppercase tracking-wider"
          >
            Ver Calendario
          </button>
        </div>
        
        {/* Mockup de Círculo de Progreso */}
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative size-32">
            <svg className="size-full" viewBox="0 0 36 36">
              <path
                className="text-slate-100 dark:text-slate-800 stroke-current"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[#137fec] stroke-current"
                strokeWidth="3"
                strokeDasharray="50, 100"
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-800 dark:text-white">28</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg text-center border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Completadas</p>
            <p className="text-lg font-black text-slate-800 dark:text-white">14</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg text-center border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Pendientes</p>
            <p className="text-lg font-black text-slate-800 dark:text-white">14</p>
          </div>
        </div>

        <Button 
          disabled
          onClick={() => toast.info(t('common.not_implemented'))}
          className="w-full mt-6 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-none shadow-none text-xs font-bold h-10 rounded-lg cursor-not-allowed"
        >
          <Play className="size-3 mr-2 fill-current" />
          Iniciar Sesión de Llamadas
        </Button>
      </div>

      {/* Widget 2: Mayores Deudores */}
      <div className="bg-white dark:bg-[#1A2633] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">Mayores Deudores</h3>
          <button className="text-slate-400 hover:text-slate-600 transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </div>

        <div className="space-y-5">
          {[
            { name: 'Industrias Globales', amount: '$52k', color: 'bg-red-500', width: '90%' },
            { name: 'Blue Moon Ltd', amount: '$38k', color: 'bg-orange-500', width: '70%' },
            { name: 'Acme Corp', amount: '$25k', color: 'bg-[#137fec]', width: '50%' },
            { name: 'Zenith Partners', amount: '$12k', color: 'bg-[#137fec]', width: '30%' }
          ].map((debtor, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{i+1}. {debtor.name}</span>
                <span className="text-[11px] font-black text-slate-900 dark:text-white">{debtor.amount}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className={`${debtor.color} h-full rounded-full transition-all duration-1000`} style={{ width: debtor.width }}></div>
              </div>
            </div>
          ))}
        </div>

        <button 
          disabled
          onClick={() => toast.info(t('common.not_implemented'))}
          className="w-full mt-6 text-[10px] font-bold text-slate-300 dark:text-slate-600 cursor-not-allowed uppercase tracking-wider flex items-center justify-center"
        >
          Ver Ranking Completo <ChevronRight size={12} className="ml-1" />
        </button>
      </div>

      {/* Widget 3: AI Insights */}
      <div className="bg-[#137fec] rounded-xl shadow-lg p-6 text-white relative overflow-hidden group border border-[#137fec]">
        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
          <Sparkles size={48} />
        </div>
        <div className="size-10 bg-white/20 rounded-lg flex items-center justify-center mb-4 backdrop-blur-sm border border-white/10">
          <Sparkles size={20} className="text-white" />
        </div>
        <h3 className="text-base font-bold mb-2">Análisis Predictivo</h3>
        <p className="text-xs text-blue-100/80 mb-6 leading-relaxed font-medium">
          Optimiza tu estrategia de cobranza con análisis predictivo impulsado por IA.
        </p>
        <button 
          disabled
          onClick={() => toast.info(t('common.not_implemented'))}
          className="px-4 py-2 bg-white/50 text-[#137fec]/50 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-not-allowed shadow-md"
        >
          Probar Beta
        </button>
      </div>

    </div>
  );
};

export default OverdueSidebar;
