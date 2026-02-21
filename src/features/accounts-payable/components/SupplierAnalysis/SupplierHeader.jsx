import React from 'react';
import { 
  Fingerprint, 
  MapPin, 
  Mail, 
  MessageSquare, 
  ShoppingBag 
} from "lucide-react";

/**
 * Supplier Header Component.
 * 100% STITCH FIDELITY - RESPONSIVE OPTIMIZED
 */
const SupplierHeader = ({ supplier }) => {
  return (
    <header className="flex flex-col xl:flex-row items-start xl:items-end justify-between gap-6 mb-2 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex-shrink-0">
          <img 
            alt="Supplier Logo" 
            className="w-full h-full object-cover" 
            src={supplier.logoUrl} 
          />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white truncate">{supplier.name}</h1>
            <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold rounded-full tracking-wider border border-red-200 dark:border-red-800 uppercase">CRÍTICA</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 text-xs md:text-sm font-medium"><span className="material-icons-round text-sm">fingerprint</span> {supplier.id}</span>
            <span className="flex items-center gap-1 text-xs md:text-sm font-medium"><span className="material-icons-round text-sm">location_on</span> {supplier.location}</span>
            <span className="flex items-center gap-1 text-xs md:text-sm font-medium"><span className="material-icons-round text-sm">mail</span> {supplier.email}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3 w-full xl:w-auto">
        <button className="flex-1 sm:flex-none px-4 md:px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 text-sm">
          <span className="material-icons-round text-lg">chat_bubble_outline</span>
          <span className="hidden xs:inline">Contactar</span>
        </button>
        <button className="flex-1 sm:flex-none px-4 md:px-6 py-2.5 bg-[#137fec] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 text-sm">
          <span className="material-icons-round text-lg">shopping_bag</span>
          <span>Órdenes</span>
        </button>
      </div>
    </header>
  );
};

export default SupplierHeader;
