import React from 'react';
import { Search, Calendar, Building } from 'lucide-react';
import { usePurchasesLogic } from '@/features/purchases/hooks/usePurchasesLogic';

export type SupplierSelectionCardProps = Pick<
  ReturnType<typeof usePurchasesLogic>,
  | 'supplierSearchRef'
  | 'supplierSearch'
  | 'setSupplierSearch'
  | 'setShowSupplierDropdown'
  | 'handleSupplierSearchKeyDown'
  | 'searchingSuppliers'
  | 'showSupplierDropdown'
  | 'supplierResults'
  | 'activeSupplierIndex'
  | 'handleSupplierSelect'
  | 'setActiveSupplierIndex'
  | 'getSupplierName'
  | 'selectedSupplier'
  | 'formatDate'
>;

export const SupplierSelectionCard: React.FC<SupplierSelectionCardProps> = ({
  supplierSearchRef,
  supplierSearch,
  setSupplierSearch,
  setShowSupplierDropdown,
  handleSupplierSearchKeyDown,
  searchingSuppliers,
  showSupplierDropdown,
  supplierResults,
  activeSupplierIndex,
  handleSupplierSelect,
  setActiveSupplierIndex,
  getSupplierName,
  selectedSupplier,
  formatDate,
}) => {
  return (
    <section className='bg-surface-container-lowest rounded-md border border-surface-variant shadow-whisper p-5 animate-in slide-in-from-right-2 duration-500'>
      <h3 className='text-base font-semibold text-on-surface mb-4'>
        Proveedor del Pedido
      </h3>

      <div className='space-y-4'>
        <div className='relative' ref={supplierSearchRef}>
          <label className='text-xs font-medium text-on-surface-variant mb-1.5 block'>
            Buscar Empresa
          </label>
          <div className='relative'>
            <Search
              className='absolute left-3 top-1/2 -translate-y-1/2 text-outline'
              size={16}
            />
            <input
              type='text'
              placeholder='Nombre del proveedor...'
              className='w-full pl-9 pr-9 py-2 bg-surface-container-low border border-surface-variant rounded-md text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all'
              value={supplierSearch}
              onChange={e => setSupplierSearch(e.target.value)}
              onFocus={() => setShowSupplierDropdown(true)}
              onKeyDown={handleSupplierSearchKeyDown}
            />
            {searchingSuppliers && (
              <div className='absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[var(--fluent-brand-primary,#0078D4)] border-t-transparent rounded-full animate-spin'></div>
            )}
          </div>

          {showSupplierDropdown && supplierResults.length > 0 && (
            <div className='absolute top-full left-0 right-0 mt-1 bg-surface-container-lowest rounded-md shadow-md border border-surface-variant overflow-hidden z-30 py-1 max-h-[220px] overflow-y-auto'>
              {supplierResults.map((s, index) => {
                const isActive = activeSupplierIndex === index;
                return (
                  <button
                    key={s.id}
                    className={`w-full px-4 py-2.5 text-left border-b border-surface-variant last:border-none flex justify-between items-center transition-colors ${
                      isActive
                        ? 'bg-[var(--fluent-surface-tertiary,#F3F2F1)] dark:bg-[var(--fluent-neutral-grey-130,#605E5C)] ring-1 ring-inset ring-[var(--fluent-brand-primary,#0078D4)]'
                        : 'hover:bg-surface-container-highest'
                    }`}
                    onClick={() => handleSupplierSelect(s)}
                    onMouseEnter={() => setActiveSupplierIndex(index)}
                  >
                    <span className={`font-medium text-sm ${isActive ? 'text-primary' : 'text-on-surface'}`}>
                      {getSupplierName(s)}
                    </span>
                    <span className='text-xs text-outline'>
                      ID: {s.id}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selectedSupplier && (
          <div className='p-4 bg-[rgba(0,120,212,0.08)] dark:bg-[rgba(0,120,212,0.15)] border border-[rgba(0,120,212,0.2)] rounded-[var(--fluent-corner-radius-large,6px)]'>
            <div className='font-semibold text-primary text-sm flex items-center gap-2'>
              <div className='w-2 h-2 rounded-full bg-[var(--fluent-brand-primary,#0078D4)] animate-pulse'></div>
              {getSupplierName(selectedSupplier)}
            </div>
            <div className='mt-3 space-y-1.5'>
              <div className='flex items-center gap-2 text-xs text-on-surface-variant'>
                <Calendar size={12} /> Registrado:{' '}
                {formatDate(selectedSupplier.created_at)}
              </div>
              {selectedSupplier.tax_id && (
                <div className='flex items-center gap-2 text-xs text-on-surface-variant'>
                  <Building size={12} /> RUC / Tax ID:{' '}
                  <span className='font-semibold'>{selectedSupplier.tax_id}</span>
                </div>
              )}
              <div className='text-xs text-outline'>
                ID: {selectedSupplier.id}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
