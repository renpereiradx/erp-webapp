import React from 'react';

/**
 * Analysis Section (Rating & Terms).
 * 100% STITCH FIDELITY - RESPONSIVE
 */
const AnalysisCards = ({ rating, terms }) => {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 animate-in fade-in">
      {/* Payment Rating */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-6 md:gap-10">
        <div className="flex-shrink-0 text-center">
          <div className="text-4xl md:text-5xl font-bold text-[#137fec] mb-2">{rating.score}</div>
          <div className="flex gap-1 text-[#137fec] justify-center">
            <span className="material-icons-round text-sm md:text-base">star</span>
            <span className="material-icons-round text-sm md:text-base">star</span>
            <span className="material-icons-round text-sm md:text-base">star</span>
            <span className="material-icons-round text-sm md:text-base">star</span>
            <span className="material-icons-round text-sm md:text-base">star_half</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-medium uppercase tracking-widest">Score de Pago</p>
        </div>
        <div className="hidden md:block h-16 w-px bg-slate-200 dark:bg-slate-700"></div>
        <div>
          <h4 className="text-base md:text-lg font-bold mb-2">Calificación de Pago</h4>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {rating.description}
          </p>
        </div>
      </div>

      {/* Credit Terms */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <h4 className="text-base md:text-lg font-bold">Términos de Crédito</h4>
          <span className="text-[10px] font-semibold text-[#137fec] px-3 py-1 bg-blue-50/50 dark:bg-blue-900/20 rounded-full">Hace 2h</span>
        </div>
        <div className="grid grid-cols-2 gap-y-4 gap-x-4">
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 uppercase truncate">Términos Base</p>
            <p className="text-sm md:text-base font-bold truncate">{terms.base}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 uppercase truncate">Factura antigua</p>
            <p className="text-sm md:text-base font-bold text-[#dc3545] truncate">{terms.oldestInvoice}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 uppercase truncate">Límite</p>
            <p className="text-sm md:text-base font-bold truncate">${terms.creditLimit.toLocaleString()}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 uppercase truncate">Disponible</p>
            <p className="text-sm md:text-base font-bold text-[#28a745] truncate">${terms.availableCredit.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnalysisCards;
