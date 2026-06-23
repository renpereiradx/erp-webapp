import React from 'react';
import { useBrands } from '../features/brands/hooks/useBrands';
import { BrandList } from '../features/brands/components/BrandList';
import { BrandDetailForm } from '../features/brands/components/BrandDetailForm';

export const BrandsPage: React.FC = () => {
  const {
    brands,
    totalBrands,
    selectedBrandId,
    selectedBrand,
    searchQuery,
    setSearchQuery,
    handleSelectBrand,
    handleCreateNew,
    handleSaveBrand,
    handleDeleteBrand,
    handleCloseDetail,
  } = useBrands();

  const brandForForm = selectedBrandId === 'new' ? { id: 'new' as const } : selectedBrand;

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden relative bg-surface-container-lowest dark:bg-[#121212]">
      {/* TopNavBar Header equivalent */}
      <header className="flex justify-between items-center w-full px-lg max-w-container-max mx-auto h-16 shrink-0 z-30 bg-surface shadow-[0px_4px_20px_rgba(24,28,34,0.04)] border-b border-outline-variant/10">
        <div className="flex items-center space-x-lg">
          <h2 className="font-headline-md text-headline-md font-black text-primary">Gestión de Marcas</h2>
        </div>
        <div className="flex items-center gap-md">
          <button 
            onClick={handleCreateNew}
            className="gradient-primary text-on-primary font-body-md-bold text-body-md-bold px-lg py-2 rounded-xl flex items-center gap-sm shadow-[0px_4px_12px_rgba(0,91,175,0.2)] transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>Nueva Marca</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 p-md md:p-gutter flex flex-col overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg h-full pb-xl">
          <div className={`${brandForForm ? 'lg:col-span-8' : 'lg:col-span-12'} h-full transition-all duration-300`}>
            <BrandList 
              brands={brands} 
              totalBrands={totalBrands} 
              selectedBrandId={selectedBrandId} 
              onSelectBrand={handleSelectBrand} 
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
          
          {brandForForm && (
            <div className="lg:col-span-4 h-full animate-in-slide">
              <BrandDetailForm 
                brand={brandForForm}
                onSave={handleSaveBrand}
                onCancel={handleCloseDetail}
                onDelete={handleDeleteBrand}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
