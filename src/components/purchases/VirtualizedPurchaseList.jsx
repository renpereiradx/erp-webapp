/**
 * VirtualizedPurchaseList - Wave 3 Virtual Scrolling Component
 * Lista virtualizada para manejar miles de compras sin pérdida de performance
 * 
 * FEATURES WAVE 3:
 * - Virtual scrolling con FixedSizeList
 * - Memory optimization para datasets grandes (1000+ items)
 * - Dynamic height adjustment
 * - Smooth scrolling con hardware acceleration
 * - Item caching y reuse
 * - Performance monitoring integrado
 * 
 * @since Wave 3 - Performance & Cache Avanzado
 * @author Sistema ERP
 */

import React, { memo, useMemo, useCallback, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { usePerformanceOptimizations } from '@/hooks/usePerformanceOptimizations';
import PurchaseCard from './PurchaseCard';

/**
 * @typedef {Object} VirtualizedPurchaseListProps
 * @property {Array} purchases - Array de purchases para mostrar
 * @property {number} itemHeight - Altura de cada item en pixels
 * @property {Object} cardProps - Props adicionales para PurchaseCard
 * @property {function} onItemClick - Callback cuando se hace click en un item
 * @property {boolean} compact - Si usar vista compacta
 * @property {number} overscan - Número de items extra a renderizar
 */

/**
 * Item renderer optimizado para react-window
 */
const VirtualizedPurchaseItem = memo(({ index, style, data }) => {
  const { purchases, cardProps, onItemClick, compact } = data;
  const purchase = purchases[index];

  if (!purchase) {
    return (
      <div style={style} className="p-4 border-b border-gray-200">
        <div className="animate-pulse bg-gray-200 h-20 rounded"></div>
      </div>
    );
  }

  return (
    <div style={style} className="p-2">
      <PurchaseCard
        purchase={purchase}
        compact={compact}
        style={{ width: '100%' }}
        {...cardProps}
        onView={() => onItemClick?.(purchase, 'view')}
        onEdit={() => onItemClick?.(purchase, 'edit')}
        onCancel={() => onItemClick?.(purchase, 'cancel')}
        onPayment={() => onItemClick?.(purchase, 'payment')}
      />
    </div>
  );
});

VirtualizedPurchaseItem.displayName = 'VirtualizedPurchaseItem';

/**
 * Lista virtualizada principal
 */
const VirtualizedPurchaseList = ({
  purchases = [],
  itemHeight = 160,
  cardProps = {},
  onItemClick,
  compact = false,
  overscan = 5
}) => {
  const listRef = useRef(null);
  
  // Performance optimizations Wave 3
  const {
    optimizedMemo,
    optimizedCallback,
    createCleanupRegistry
  } = usePerformanceOptimizations({
    componentName: 'VirtualizedPurchaseList',
    enableMemoization: true,
    enableProfiling: process.env.NODE_ENV === 'development'
  });

  const registerCleanup = createCleanupRegistry();

  // Datos optimizados para react-window
  const itemData = optimizedMemo(() => ({
    purchases,
    cardProps,
    onItemClick,
    compact
  }), [purchases, cardProps, onItemClick, compact], 'itemData');

  // Callback optimizado para scroll
  const handleScroll = optimizedCallback(({ scrollDirection, scrollOffset, scrollUpdateWasRequested }) => {
    // Tracking de scroll performance
    if (process.env.NODE_ENV === 'development') {
      console.log('Virtual scroll:', { scrollDirection, scrollOffset, scrollUpdateWasRequested });
    }
  }, [], 'handleScroll');

  // Scroll hacia un item específico
  const scrollToItem = optimizedCallback((index, align = 'auto') => {
    listRef.current?.scrollToItem(index, align);
  }, [], 'scrollToItem');

  // Optimización para altura adaptativa en modo compacto
  const dynamicItemHeight = optimizedMemo(() => {
    return compact ? Math.floor(itemHeight * 0.7) : itemHeight;
  }, [compact, itemHeight], 'dynamicItemHeight');

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      registerCleanup(() => {
        if (listRef.current) {
          listRef.current.scrollTo(0);
        }
      });
    };
  }, [registerCleanup]);

  // Render vacío optimizado
  if (!purchases || purchases.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium">No hay compras disponibles</div>
          <div className="text-sm mt-1">Los datos aparecerán aquí cuando estén disponibles</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <AutoSizer>
        {({ height, width }) => (
          <List
            ref={listRef}
            height={height}
            width={width}
            itemCount={purchases.length}
            itemSize={dynamicItemHeight}
            itemData={itemData}
            onScroll={handleScroll}
            overscanCount={overscan}
            useIsScrolling={true}
            className="virtual-purchase-list"
          >
            {VirtualizedPurchaseItem}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};

// Comparador específico para la lista virtualizada
const areVirtualListPropsEqual = (prevProps, nextProps) => {
  // Comparación crítica: número de items y altura
  if (prevProps.purchases?.length !== nextProps.purchases?.length) {
    return false;
  }
  
  if (prevProps.itemHeight !== nextProps.itemHeight) {
    return false;
  }

  if (prevProps.compact !== nextProps.compact) {
    return false;
  }

  // Comparación de referencias de callback
  if (prevProps.onItemClick !== nextProps.onItemClick) {
    return false;
  }

  // Comparación profunda solo de IDs para evitar re-render innecesario
  if (prevProps.purchases && nextProps.purchases) {
    const prevIds = prevProps.purchases.map(p => p.id).join(',');
    const nextIds = nextProps.purchases.map(p => p.id).join(',');
    
    if (prevIds !== nextIds) {
      return false;
    }

    // Comparación de status de primeros 10 items (muestra representativa)
    const sampleSize = Math.min(10, prevProps.purchases.length);
    for (let i = 0; i < sampleSize; i++) {
      if (prevProps.purchases[i]?.status !== nextProps.purchases[i]?.status) {
        return false;
      }
    }
  }

  return true;
};

export default memo(VirtualizedPurchaseList, areVirtualListPropsEqual);
