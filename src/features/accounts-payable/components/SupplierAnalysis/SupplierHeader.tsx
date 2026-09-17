import { Mail } from "lucide-react";
import type { SupplierAnalysisData } from '../../types';

interface SupplierHeaderProps {
  supplier: Pick<SupplierAnalysisData, 'name' | 'importance' | 'id' | 'contact'>;
}

/**
 * Supplier Header Component. Sin logo (el BE no lo provee → iniciales),
 * badge de importancia real del dto y sin botones decorativos muertos
 * ("Contactar"/"Órdenes" — auditoría BI 2A).
 */
const SupplierHeader = ({ supplier }: SupplierHeaderProps) => {
  const initials = (supplier.name || '??').substring(0, 2).toUpperCase();

  return (
    <header className="flex flex-col gap-6 mb-2 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-surface rounded-xl flex items-center justify-center border border-border-subtle shadow-sm shrink-0">
          <span className="text-2xl md:text-3xl font-black text-on-surface-deep">{initials}</span>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground truncate">{supplier.name}</h1>
            {supplier.importance && (
              <span className="px-3 py-1 bg-error-container text-on-error-container text-[10px] font-bold rounded-full tracking-wider border border-error/20 uppercase">
                {supplier.importance}
              </span>
            )}
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 text-on-surface-deep">
            <span className="flex items-center gap-1 text-xs md:text-sm font-medium">
              <span className="material-icons-round text-sm">fingerprint</span> {supplier.id}
            </span>
            {supplier.contact && supplier.contact !== 'No disponible' && (
              <span className="flex items-center gap-1 text-xs md:text-sm font-medium">
                <Mail className="h-3.5 w-3.5" /> {supplier.contact}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default SupplierHeader;
