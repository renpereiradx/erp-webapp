import React from 'react';
import { ProductVariantsManager } from '@/features/products/components/ProductVariantsManager';

interface VariantsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

export const VariantsManagerModal: React.FC<VariantsManagerModalProps> = ({ isOpen, onClose, product }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1010] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-6xl h-[85vh] rounded-2xl shadow-fluent-16 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <header className="flex justify-between items-center w-full px-6 py-4 border-b border-outline-variant/30 bg-surface">
          <div className="flex items-center gap-md">
            <h2 className="font-headline-md text-headline-md font-extrabold text-primary">Matriz de Variantes</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <main className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <div className="max-w-[1400px] mx-auto flex flex-col gap-lg">
            {/* Top Context Header Card */}
            <div className="bg-surface-container-lowest rounded-xl p-lg shadow-whisper flex flex-col md:flex-row md:items-center justify-between gap-md border border-outline-variant/30 mb-6">
              <div>
                <div className="flex items-center gap-xs text-primary mb-xs">
                  <span className="material-symbols-outlined text-[18px]">package</span>
                  <span className="font-label-md text-label-md uppercase tracking-wider">Matriz de Variantes</span>
                </div>
                <h2 className="font-headline-lg text-headline-lg text-on-surface mb-sm">Producto: {product?.name || product?.product_name}</h2>
              </div>
            </div>

            <ProductVariantsManager 
              productId={product?.id} 
              categoryId={product?.categoryId || product?.category_id || product?.category?.id || product?.category} 
            />
          </div>
        </main>
      </div>
    </div>
  );
};
