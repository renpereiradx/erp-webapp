import React from 'react';
import { useI18n } from '@/lib/i18n';
import ProductCard from '@/features/products/components/ProductCard';
import { VirtuosoGrid } from 'react-virtuoso';

// Grid virtualizado para listas grandes.
// Props:
// - products: Array de productos
// - isNeoBrutalism: boolean
// - getCategoryName: (id) => string
// - onView/onEdit/onDelete: handlers
// - itemMinWidth: ancho mínimo de card en la grilla (default 260px)
// - gap: separación entre items (default 1.5rem)
export default function ProductGrid({
  products,
  isNeoBrutalism,
  getCategoryName,
  onView,
  onEdit,
  onDelete,
  itemMinWidth = 300,
  gap = '1.5rem',
  onToggleSelect,
  selectedIds = [],
  inlineEditingId,
  onStartInlineEdit,
  onCancelInlineEdit,
  onInlineSave,
}) {
  const [focusedIndex, setFocusedIndex] = React.useState(0);
  const itemRefs = React.useRef({});
  const listContainerRef = React.useRef(null);
  const [cols, setCols] = React.useState(1);
  const { t } = useI18n();

  React.useEffect(() => {
    if (products.length === 0) {
      setFocusedIndex(0);
      return;
    }
    // Clamp el índice si cambia el largo
    setFocusedIndex((idx) => Math.max(0, Math.min(idx, products.length - 1)));
  }, [products.length]);

  const setRef = React.useCallback((index, el) => {
    if (el) itemRefs.current[index] = el;
  }, []);

  const focusIndex = React.useCallback((index) => {
    setFocusedIndex(index);
    // Encolar focus para que el nodo exista tras virtualización
    requestAnimationFrame(() => {
      const node = itemRefs.current[index];
      if (node && typeof node.focus === 'function') {
        node.focus();
        if (typeof node.scrollIntoView === 'function') {
          node.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
      }
    });
  }, []);

  const handleKeyDown = React.useCallback((e, index) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown': {
        e.preventDefault();
        // Down avanza por filas según número de columnas
        const next = e.key === 'ArrowDown' ? index + cols : index + 1;
        if (next <= products.length - 1) focusIndex(next);
        break;
      }
      case 'ArrowLeft':
      case 'ArrowUp': {
        e.preventDefault();
        const prev = e.key === 'ArrowUp' ? index - cols : index - 1;
        if (prev >= 0) focusIndex(prev);
        break;
      }
      case 'Home': {
        e.preventDefault();
        focusIndex(0);
        break;
      }
      case 'End': {
        e.preventDefault();
        focusIndex(products.length - 1);
        break;
      }
      case 'Enter':
      case ' ': {
        // Abrir vista rápida del producto
        e.preventDefault();
        onView?.(products[index]);
        break;
      }
      default:
        break;
    }
  }, [focusIndex, onView, products, cols]);

  // Observa el contenedor de la grilla para calcular columnas visibles
  React.useEffect(() => {
    const el = listContainerRef.current;
    if (!el) return;

    const computeCols = () => {
      const width = el.clientWidth;
      const styles = getComputedStyle(el);
      const colGapPx = parseFloat(styles.columnGap || styles.gap || '0') || 0;
      const total = Math.max(1, Math.floor((width + colGapPx) / (itemMinWidth + colGapPx)));
      setCols(total);
    };

    computeCols();

    const ro = new ResizeObserver(() => computeCols());
    ro.observe(el);
    window.addEventListener('orientationchange', computeCols);
    window.addEventListener('resize', computeCols);
    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', computeCols);
      window.removeEventListener('resize', computeCols);
    };
  }, [itemMinWidth]);
  const List = React.useMemo(() => {
    return React.forwardRef(function ListComponent({ style, children, className }, ref) {
      return (
        <div
          ref={(node) => {
            // Referencia para Virtuoso
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
            // Referencia local para calcular columnas
            listContainerRef.current = node;
          }}
          data-testid="product-grid-list"
          style={{
            ...style,
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(${itemMinWidth}px, 1fr))`,
            gap,
            alignContent: 'start',
            paddingTop: '0.25rem',
          }}
          className={`${className || ''} virtuoso-grid-list`.trim()}
          role="list"
          aria-label={t('products.list_label')}
        >
          {children}
        </div>
      );
    });
  }, [itemMinWidth, gap]);

  const Item = React.useMemo(() => {
    return function ItemComponent({ children, ...rest }) {
      const cls = rest.className ? `${rest.className} virtuoso-grid-item` : 'virtuoso-grid-item';
      return (
        <div {...rest} className={cls} style={{ width: '100%' }}>
          {children}
        </div>
      );
    };
  }, []);

  return (
    <VirtuosoGrid
      useWindowScroll
      totalCount={products.length}
      overscan={300}
      itemContent={(index) => (
        <div
          ref={(el) => setRef(index, el)}
          data-testid={products[index] ? `product-grid-item-${products[index].id}` : undefined}
          tabIndex={focusedIndex === index ? 0 : -1}
          role="listitem"
          aria-current={focusedIndex === index ? 'true' : undefined}
          aria-label={t('products.item_aria', { nameOrId: products[index]?.name || products[index]?.id || index + 1 })}
          onFocus={() => setFocusedIndex(index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          style={{ outline: 'none' }}
        >
          <ProductCard
            key={products[index].id}
            product={products[index]}
            isNeoBrutalism={isNeoBrutalism}
            getCategoryName={getCategoryName}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleSelect={onToggleSelect}
            selected={selectedIds.includes(products[index].id)}
            enableInlineEdit
            inlineEditing={inlineEditingId === products[index].id}
            onStartInlineEdit={() => onStartInlineEdit?.(products[index].id)}
            onCancelInlineEdit={onCancelInlineEdit}
            onInlineSave={onInlineSave}
          />
        </div>
      )}
      components={{ List, Item }}
      computeItemKey={(index) => products[index].id}
      endReached={() => {
        try {
          // batch size metric (approx: items rendered length)
          const batch = products.length;
          import('@/utils/telemetry').then(m => m.telemetry.record('products.render.batch', { batch }));
        } catch {}
      }}
    />
  );
}
