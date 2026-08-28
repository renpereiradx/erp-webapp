import React, { useState } from 'react';
import { Brand } from '../types/brand';

interface BrandListProps {
  brands: Brand[];
  totalBrands: number;
  selectedBrandId: string | null;
  onSelectBrand: (id: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const BrandList: React.FC<BrandListProps> = ({
  brands,
  selectedBrandId,
  onSelectBrand,
  searchQuery = '',
  onSearchChange,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(brands.length / itemsPerPage);
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBrands = brands.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, brands.length]);
  return (
    <div className="bg-background rounded-[16px] shadow-sm border border-divider/30 p-lg flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center mb-md border-b border-divider/20 pb-sm">
        <h3 className="font-title-md text-title-md text-foreground">Directorio de Marcas</h3>
        <div className="flex gap-sm items-center w-full max-w-[240px]">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
            <input 
              className="w-full pl-9 pr-3 py-1.5 bg-surface border border-divider rounded-lg font-body-md text-body-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" 
              placeholder="Buscar marcas..." 
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-separate border-spacing-y-2">
          <thead className="sticky top-0 bg-surface z-10">
            <tr>
              <th className="font-label-caps text-label-caps text-on-surface-deep pb-sm pl-sm w-16">Logo</th>
              <th className="font-label-caps text-label-caps text-on-surface-deep pb-sm">Nombre</th>
              <th className="font-label-caps text-label-caps text-on-surface-deep pb-sm">Slug</th>
            </tr>
          </thead>
          <tbody>
            {paginatedBrands.map((brand) => (
              <tr
                key={brand.id}
                onClick={() => onSelectBrand(String(brand.id))}
                className={`rounded-xl transition-colors group cursor-pointer border ${
                  selectedBrandId === brand.id
                    ? 'bg-surface-muted border-primary/40'
                    : 'bg-surface border-transparent hover:bg-surface-muted hover:border-primary/20'
                }`}
              >
                <td className="py-sm pl-sm rounded-l-xl">
                  {brand.logoUrl ? (
                    <img
                      src={brand.logoUrl}
                      alt={brand.name}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-surface-subtle flex items-center justify-center text-on-surface-deep">
                      <span className="material-symbols-outlined text-[16px]">{brand.icon || 'public'}</span>
                    </div>
                  )}
                </td>
                <td className="py-sm font-body-md-bold text-body-md-bold text-foreground">{brand.name}</td>
                <td className="py-sm pr-sm font-data-mono text-data-mono text-on-surface-deep">{brand.slug}</td>
              </tr>
            ))}
            {brands.length === 0 && (
              <tr>
                <td colSpan={3} className="py-lg text-center text-on-surface-deep">
                  No se encontraron marcas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-md pt-sm border-t border-divider flex justify-between items-center">
        <span className="font-body-md text-body-md text-on-surface-deep">
          Mostrando {paginatedBrands.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + itemsPerPage, brands.length)} de {brands.length} marcas
        </span>
        <div className="flex gap-xs">
          <button 
            className="p-1 rounded text-foreground hover:bg-surface-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={currentPage === 1}
            onClick={handlePrevPage}
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button 
            className="p-1 rounded text-foreground hover:bg-surface-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={handleNextPage}
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
};
