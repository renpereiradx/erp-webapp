/**
 * Componente de información de caché de categorías
 * Para debugging y monitoreo del estado del caché
 */

import React from 'react';
import { Info, RefreshCw, Trash2, Database } from 'lucide-react';
import useProductStore from '@/store/useProductStore';

const CategoryCacheInfo = ({ compact = false }) => {
  const { 
    categories, 
    refreshCategoriesFromAPI, 
    clearCategoriesCache, 
    getCacheInfo 
  } = useProductStore();

  const cacheInfo = getCacheInfo();

  if (compact) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 8px',
        backgroundColor: 'var(--muted)',
        borderRadius: '4px',
        fontSize: '0.75rem',
        color: 'var(--muted-foreground)'
      }}>
        <Database size={12} />
        <span>
          {categories.length} categorías
          {cacheInfo.hasCache && (
            <> • Caché: {cacheInfo.ageMinutes}min</>
          )}
        </span>
      </div>
    );
  }

  return (
    <div style={{
      padding: '16px',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      backgroundColor: 'var(--card)',
      marginBottom: '16px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <Info size={16} />
        <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600' }}>
          Estado del Caché de Categorías
        </h4>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px',
        marginBottom: '12px'
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
            Categorías cargadas:
          </span>
          <div style={{ fontWeight: '600' }}>
            {categories.length}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
            Estado del caché:
          </span>
          <div style={{ fontWeight: '600' }}>
            {cacheInfo.hasCache ? (
              <span style={{ color: 'var(--success)' }}>
                ✅ Activo
              </span>
            ) : (
              <span style={{ color: 'var(--warning)' }}>
                ⚠️ Sin caché
              </span>
            )}
          </div>
        </div>

        {cacheInfo.hasCache && (
          <>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                Edad del caché:
              </span>
              <div style={{ fontWeight: '600' }}>
                {cacheInfo.ageMinutes} min
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                Estado:
              </span>
              <div style={{ fontWeight: '600' }}>
                {cacheInfo.isExpired ? (
                  <span style={{ color: 'var(--warning)' }}>
                    ⚠️ Expirado
                  </span>
                ) : (
                  <span style={{ color: 'var(--success)' }}>
                    ✅ Válido
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={refreshCategoriesFromAPI}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            fontSize: '0.75rem',
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={12} />
          Actualizar desde API
        </button>

        <button
          onClick={clearCategoriesCache}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            fontSize: '0.75rem',
            backgroundColor: 'var(--destructive)',
            color: 'var(--destructive-foreground)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          <Trash2 size={12} />
          Limpiar caché
        </button>
      </div>

      {categories.length > 0 && (
        <details style={{ marginTop: '12px' }}>
          <summary style={{
            fontSize: '0.75rem',
            color: 'var(--muted-foreground)',
            cursor: 'pointer'
          }}>
            Ver categorías ({categories.length})
          </summary>
          <div style={{
            marginTop: '8px',
            maxHeight: '120px',
            overflow: 'auto',
            fontSize: '0.75rem'
          }}>
            {categories.map(cat => (
              <div key={cat.id} style={{
                padding: '2px 0',
                borderBottom: '1px solid var(--border)'
              }}>
                <strong>{cat.id}</strong>: {cat.name}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

export default CategoryCacheInfo;
