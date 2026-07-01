import React, { useState } from 'react';
import { ProductVariantsManager } from '@/features/products/components/ProductVariantsManager';
import { ProductAttributesManager } from '@/features/products/components/ProductAttributesManager';
import { ProductTagsManager } from '@/features/products/components/ProductTagsManager';

interface VariantsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

export const VariantsManagerModal: React.FC<VariantsManagerModalProps> = ({ isOpen, onClose, product }) => {
  const [activeTab, setActiveTab] = useState<'variants' | 'attributes'>('variants');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1010] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-6xl h-[85vh] rounded-2xl shadow-fluent-16 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <header className="flex justify-between items-center w-full px-6 py-4 border-b border-outline-variant/30 bg-surface">
          <div className="flex items-center gap-md">
            <h2 className="font-headline-md text-headline-md font-extrabold text-primary">Administrar Variantes, Atributos y Etiquetas</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        {/* Tabs superiores */}
        <div className="flex border-b border-outline-variant/30 bg-surface-container-lowest px-6 gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('variants')}
            className={`py-3 px-1 text-sm font-bold uppercase tracking-wider border-b-2 transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'variants'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">package</span>
            <span>Variantes (SKUs)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attributes')}
            className={`py-3 px-1 text-sm font-bold uppercase tracking-wider border-b-2 transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'attributes'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">layers</span>
            <span>FICHA TÉCNICA (ATRIBUTOS Y ETIQUETAS)</span>
          </button>
        </div>

        <main className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <div className="max-w-[1400px] mx-auto flex flex-col gap-lg">
            {/* Top Context Header Card */}
            <div className="bg-surface-container-lowest rounded-xl p-lg shadow-whisper flex flex-col md:flex-row md:items-center justify-between gap-md border border-outline-variant/30 mb-6">
              <div>
                <div className="flex items-center gap-xs text-primary mb-xs">
                  <span className="material-symbols-outlined text-[18px]">{activeTab === 'variants' ? 'package' : 'layers'}</span>
                  <span className="font-label-md text-label-md uppercase tracking-wider">
                    {activeTab === 'variants' ? 'Matriz de Variantes' : 'Ficha Técnica'}
                  </span>
                </div>
                <h2 className="font-headline-lg text-headline-lg text-on-surface mb-sm">Producto: {product?.name || product?.product_name}</h2>
                {activeTab === 'attributes' && (
                  <p className="text-sm text-on-surface-variant max-w-4xl mt-2 leading-relaxed">
                    <strong className="text-primary font-bold">Atributos:</strong> Definen características intrínsecas y técnicas (talla, color, dimensiones).<br/>
                    <strong className="text-primary font-bold">Etiquetas:</strong> Son agrupadores transversales rápidos para marketing o estado (Nuevo, Oferta, Destacado).
                  </p>
                )}
              </div>
            </div>

            {activeTab === 'variants' && (
              <ProductVariantsManager 
                productId={product?.id || product?.product_id} 
                categoryId={product?.categoryId || product?.category_id || product?.category?.id || product?.category} 
              />
            )}

            {activeTab === 'attributes' && (
              <div className="space-y-8">
                {/* Sección de Etiquetas (Tags) */}
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-[20px]">sell</span>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Etiquetas del Producto</h3>
                  </div>
                  <ProductTagsManager 
                    productId={product?.id || product?.product_id} 
                    categoryId={product?.categoryId || product?.category_id || product?.category?.id || product?.category} 
                  />
                  <p className="text-[11px] text-on-surface-variant font-medium mt-3 uppercase tracking-wider">
                    Agregue etiquetas rápidas para filtros y catálogos (Ej. "Nuevo", "Oferta", "Destacado").
                  </p>
                </div>

                {/* Sección de Atributos (Ficha Técnica) */}
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-[20px]">list_alt</span>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Atributos Descriptivos</h3>
                  </div>
                  <ProductAttributesManager 
                    productId={product?.id || product?.product_id} 
                    categoryId={product?.categoryId || product?.category_id || product?.category?.id || product?.category} 
                  />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

