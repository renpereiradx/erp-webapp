import React from 'react';
import { useCategoryManagement, CategoryTree, CategoryDetailForm, TaxRatesPanel } from '@/features/categories';
import { Category } from '@/features/categories/types';

export default function CategoriesPage() {
  const {
    categories,
    filteredCategories,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    openCreate,
    openEdit,
    handleSave,
    confirmDelete,
    isMutating,
    isDrawerOpen,
    closeDrawer
  } = useCategoryManagement();
  
  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden relative bg-surface-container-lowest dark:bg-[#121212]">
      <header className="flex justify-between items-center w-full px-lg max-w-container-max mx-auto h-16 shrink-0 z-30 bg-surface shadow-sm">
        <div className="flex items-center gap-lg flex-1">
          <h2 className="font-headline-md text-headline-md font-black text-on-surface hidden lg:block">Categorías e Impuestos</h2>
          <div className="relative w-full max-w-md ml-0 lg:ml-lg">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input 
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-transparent rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
              placeholder="Buscar categorías..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 p-md md:p-gutter flex flex-col overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg h-full pb-xl">
          {/* Column 1: Árbol de Categorías */}
          <div className="lg:col-span-4 h-full">
            <CategoryTree
              categories={filteredCategories}
              selectedCategory={selectedCategory}
              onSelectCategory={openEdit}
              onAddCategory={openCreate}
            />
          </div>

          {/* Column 2: Formularios y Configuración */}
          <div className="lg:col-span-8 flex flex-col gap-lg h-full overflow-y-auto pr-sm custom-scrollbar pb-10">
            <CategoryDetailForm
              selectedCategory={selectedCategory}
              categories={categories}
              handleSave={handleSave}
              confirmDelete={() => confirmDelete()}
              isMutating={isMutating}
              onCancel={closeDrawer}
              isOpen={isDrawerOpen}
            />
            
            <TaxRatesPanel />
          </div>
        </div>
      </main>
    </div>
  );
}
