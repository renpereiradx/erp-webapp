import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Fingerprint, 
  MapPin, 
  Mail, 
  MessageSquare, 
  ShoppingBag 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SupplierHeader = ({ supplier }) => {
  return (
    <header className="flex flex-col xl:flex-row items-start xl:items-end justify-between gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-6">
        <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden group">
          <img 
            alt="Supplier Logo" 
            className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" 
            src={supplier.logoUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuDe2QTxzZ89a5V4fxyYTWP_qzjPwQtaLYHhcHwjZM4WYSbyo4x52veAY--gHLwyfYlZ-qCW1QYQ-i7-OncCXTcgW_M-lFG0i3GrFbWKUgyCnOhw22uVB42g09G2ABqSF-u-rUbt7beXYdCM4TexjMia9Lo1B4Sc9MncYvn9mVSsDMBuBR-fq6___KJ5OkYZNTbTU28XIrhedAG5X-v52tlttc8PCt_04Jm0oKg0Th62HZ7Z2FfVoFGSws_fBPYmYqzTq0sshGx_Sg"} 
          />
        </div>
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">{supplier.name}</h1>
            <Badge variant="destructive" className="px-3 py-1 font-black text-[10px] tracking-widest uppercase border-2 border-red-500/20 shadow-lg shadow-red-500/10">
              CRÍTICA
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">
            <span className="flex items-center gap-2 hover:text-blue-500 transition-colors cursor-pointer">
              <Fingerprint className="h-4 w-4" /> {supplier.id}
            </span>
            <span className="flex items-center gap-2 hover:text-blue-500 transition-colors cursor-pointer">
              <MapPin className="h-4 w-4" /> {supplier.location}
            </span>
            <span className="flex items-center gap-2 hover:text-blue-500 transition-colors cursor-pointer normal-case">
              <Mail className="h-4 w-4" /> {supplier.email}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4 w-full xl:w-auto">
        <Button variant="outline" className="flex-1 xl:flex-none px-6 h-12 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95 flex items-center gap-2 text-xs uppercase tracking-widest shadow-sm">
          <MessageSquare className="h-4 w-4" />
          Contactar
        </Button>
        <Button className="flex-1 xl:flex-none px-6 h-12 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all active:scale-95 flex items-center gap-2 shadow-xl shadow-blue-600/20 text-xs uppercase tracking-widest">
          <ShoppingBag className="h-4 w-4" />
          Órdenes de Compra
        </Button>
      </div>
    </header>
  );
};

export default SupplierHeader;
