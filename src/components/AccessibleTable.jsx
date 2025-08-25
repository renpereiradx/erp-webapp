/**
 * Wave 4: UX & Accessibility Enterprise
 * Accessible Table Component - WCAG 2.1 AA Compliant
 * 
 * Características implementadas:
 * - ARIA labels y roles semánticos
 * - Navegación por teclado (Arrow keys, Home, End)
 * - Sorteo accesible con anuncios
 * - Selección múltiple accesible
 * - Headers asociados con datos
 * - Live region para cambios dinámicos
 * 
 * @since Wave 4 - UX & Accessibility
 * @author Sistema ERP
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/i18n/hooks';
import { useThemeStyles } from '@/themes/themeUtils';
import { useFocusManagement, useLiveRegion } from '@/accessibility';
import { telemetry } from '@/lib/telemetry';

/**
 * Tabla accesible según estándares WCAG 2.1 AA
 */
export const AccessibleTable = ({
  data = [],
  columns = [],
  sortable = true,
  selectable = false,
  multiSelect = false,
  caption,
  summary,
  onSort,
  onSelect,
  selectedRows = [],
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  className = '',
  enableTelemetry = true,
  tableId,
  ...props
}) => {
  const { t } = useI18n();
  const { table: themeTable, button: themeButton } = useThemeStyles();
  
  // Estados locales
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [focusedCell, setFocusedCell] = useState({ row: -1, col: -1 });
  
  // Referencias
  const tableRef = useRef(null);
  const cellRefs = useRef({});
  
  // Hooks de accesibilidad
  const { useArrowNavigation } = useFocusManagement();
  const { 
    announceTableUpdate, 
    announceSelectionChange,
    announce,
    liveRegionProps 
  } = useLiveRegion();

  // ID único para la tabla
  const uniqueTableId = tableId || `table-${Date.now()}`;
  const captionId = `${uniqueTableId}-caption`;
  const summaryId = `${uniqueTableId}-summary`;

  /**
   * Maneja el ordenamiento de columnas
   */
  const handleSort = useCallback((columnKey, columnLabel) => {
    if (!sortable) return;

    const direction = 
      sortConfig.key === columnKey && sortConfig.direction === 'asc' 
        ? 'desc' 
        : 'asc';

    const newSortConfig = { key: columnKey, direction };
    setSortConfig(newSortConfig);

    // Anunciar cambio de ordenamiento
    const directionText = direction === 'asc' ? 'ascendente' : 'descendente';
    announce(t('accessibility.tables.sortChanged', { 
      column: columnLabel, 
      direction: directionText 
    }));

    // Callback externo
    if (onSort) {
      onSort(newSortConfig);
    }

    if (enableTelemetry) {
      telemetry.record('accessibility.table.sorted', {
        column: columnKey,
        direction,
        tableId: uniqueTableId
      });
    }
  }, [sortable, sortConfig, onSort, announce, t, enableTelemetry, uniqueTableId]);

  /**
   * Maneja la selección de filas
   */
  const handleRowSelect = useCallback((rowIndex, rowData) => {
    if (!selectable) return;

    let newSelectedRows;
    
    if (multiSelect) {
      const isSelected = selectedRows.includes(rowIndex);
      newSelectedRows = isSelected
        ? selectedRows.filter(index => index !== rowIndex)
        : [...selectedRows, rowIndex];
    } else {
      newSelectedRows = selectedRows.includes(rowIndex) ? [] : [rowIndex];
    }

    // Anunciar cambio de selección
    announceSelectionChange(newSelectedRows.length, data.length, 'filas');

    // Callback externo
    if (onSelect) {
      onSelect(newSelectedRows, rowData);
    }

    if (enableTelemetry) {
      telemetry.record('accessibility.table.row_selected', {
        rowIndex,
        selectedCount: newSelectedRows.length,
        totalRows: data.length,
        tableId: uniqueTableId
      });
    }
  }, [
    selectable,
    multiSelect,
    selectedRows,
    data.length,
    announceSelectionChange,
    onSelect,
    enableTelemetry,
    uniqueTableId
  ]);

  /**
   * Maneja la selección de todas las filas
   */
  const handleSelectAll = useCallback(() => {
    if (!selectable || !multiSelect) return;

    const allSelected = selectedRows.length === data.length;
    const newSelectedRows = allSelected ? [] : data.map((_, index) => index);

    // Anunciar selección masiva
    if (allSelected) {
      announce(t('accessibility.tables.allRowsDeselected'));
    } else {
      announce(t('accessibility.tables.allRowsSelected'));
    }

    // Callback externo
    if (onSelect) {
      onSelect(newSelectedRows);
    }

    if (enableTelemetry) {
      telemetry.record('accessibility.table.select_all', {
        action: allSelected ? 'deselect' : 'select',
        rowCount: data.length,
        tableId: uniqueTableId
      });
    }
  }, [
    selectable,
    multiSelect,
    selectedRows.length,
    data.length,
    announce,
    t,
    onSelect,
    enableTelemetry,
    uniqueTableId
  ]);

  /**
   * Navegación por teclado en las celdas
   */
  const handleCellKeyDown = useCallback((event, rowIndex, colIndex) => {
    const { key } = event;
    
    let newRow = rowIndex;
    let newCol = colIndex;
    let shouldPreventDefault = false;

    switch (key) {
      case 'ArrowUp':
        newRow = Math.max(0, rowIndex - 1);
        shouldPreventDefault = true;
        break;
      case 'ArrowDown':
        newRow = Math.min(data.length - 1, rowIndex + 1);
        shouldPreventDefault = true;
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, colIndex - 1);
        shouldPreventDefault = true;
        break;
      case 'ArrowRight':
        newCol = Math.min(columns.length - 1, colIndex + 1);
        shouldPreventDefault = true;
        break;
      case 'Home':
        newCol = 0;
        shouldPreventDefault = true;
        break;
      case 'End':
        newCol = columns.length - 1;
        shouldPreventDefault = true;
        break;
      case 'Space':
      case 'Enter':
        if (selectable) {
          handleRowSelect(rowIndex, data[rowIndex]);
          shouldPreventDefault = true;
        }
        break;
    }

    if (shouldPreventDefault) {
      event.preventDefault();
      
      if (newRow !== rowIndex || newCol !== colIndex) {
        setFocusedCell({ row: newRow, col: newCol });
        
        // Enfocar la nueva celda
        const cellKey = `${newRow}-${newCol}`;
        if (cellRefs.current[cellKey]) {
          cellRefs.current[cellKey].focus();
        }
      }
    }

    if (enableTelemetry) {
      telemetry.record('accessibility.table.keyboard_navigation', {
        key,
        fromRow: rowIndex,
        fromCol: colIndex,
        toRow: newRow,
        toCol: newCol,
        tableId: uniqueTableId
      });
    }
  }, [
    data.length,
    columns.length,
    selectable,
    handleRowSelect,
    data,
    enableTelemetry,
    uniqueTableId
  ]);

  /**
   * Genera el ID de celda para referencias
   */
  const getCellId = useCallback((rowIndex, colIndex) => {
    return `${uniqueTableId}-cell-${rowIndex}-${colIndex}`;
  }, [uniqueTableId]);

  /**
   * Genera el ID de header para asociación
   */
  const getHeaderId = useCallback((colIndex) => {
    return `${uniqueTableId}-header-${colIndex}`;
  }, [uniqueTableId]);

  /**
   * Renderiza el header de la tabla
   */
  const renderTableHeader = () => (
    <thead className={themeTable.header}>
      <tr role="row">
        {/* Checkbox de selección masiva */}
        {selectable && multiSelect && (
          <th 
            className={themeTable.headerCell}
            scope="col"
            role="columnheader"
          >
            <input
              type="checkbox"
              className={themeTable.checkbox}
              checked={selectedRows.length === data.length && data.length > 0}
              onChange={handleSelectAll}
              aria-label={t('accessibility.tables.selectAll')}
            />
          </th>
        )}
        
        {/* Headers de columnas */}
        {columns.map((column, colIndex) => (
          <th
            key={column.key || colIndex}
            id={getHeaderId(colIndex)}
            className={`${themeTable.headerCell} ${sortable ? 'cursor-pointer' : ''}`}
            scope="col"
            role="columnheader"
            aria-sort={
              sortConfig.key === column.key 
                ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                : 'none'
            }
            onClick={() => sortable && handleSort(column.key, column.label)}
            onKeyDown={(e) => {
              if (sortable && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                handleSort(column.key, column.label);
              }
            }}
            tabIndex={sortable ? 0 : -1}
          >
            <div className="flex items-center justify-between">
              <span>{column.label}</span>
              
              {sortable && (
                <span className="ml-2 flex-shrink-0">
                  {sortConfig.key === column.key ? (
                    sortConfig.direction === 'asc' ? (
                      <ChevronUpIcon className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                    )
                  ) : (
                    <ChevronUpIcon className="h-4 w-4 opacity-30" aria-hidden="true" />
                  )}
                </span>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );

  /**
   * Renderiza el cuerpo de la tabla
   */
  const renderTableBody = () => {
    if (loading) {
      return (
        <tbody>
          <tr>
            <td 
              colSpan={columns.length + (selectable ? 1 : 0)}
              className={`${themeTable.cell} text-center`}
            >
              <div role="status" aria-live="polite">
                {t('accessibility.status.loading')}
              </div>
            </td>
          </tr>
        </tbody>
      );
    }

    if (data.length === 0) {
      return (
        <tbody>
          <tr>
            <td 
              colSpan={columns.length + (selectable ? 1 : 0)}
              className={`${themeTable.cell} text-center`}
            >
              {emptyMessage}
            </td>
          </tr>
        </tbody>
      );
    }

    return (
      <tbody className={themeTable.body}>
        {data.map((row, rowIndex) => (
          <tr
            key={row.id || rowIndex}
            className={`
              ${themeTable.row}
              ${selectedRows.includes(rowIndex) ? themeTable.selectedRow : ''}
            `}
            role="row"
            aria-selected={selectable ? selectedRows.includes(rowIndex) : undefined}
          >
            {/* Checkbox de selección */}
            {selectable && (
              <td className={themeTable.cell} role="gridcell">
                <input
                  type="checkbox"
                  className={themeTable.checkbox}
                  checked={selectedRows.includes(rowIndex)}
                  onChange={() => handleRowSelect(rowIndex, row)}
                  aria-label={t('accessibility.tables.selectRow', { index: rowIndex + 1 })}
                />
              </td>
            )}
            
            {/* Celdas de datos */}
            {columns.map((column, colIndex) => (
              <td
                key={column.key || colIndex}
                id={getCellId(rowIndex, colIndex)}
                className={themeTable.cell}
                role="gridcell"
                headers={getHeaderId(colIndex)}
                tabIndex={-1}
                ref={(el) => {
                  cellRefs.current[`${rowIndex}-${colIndex}`] = el;
                }}
                onKeyDown={(e) => handleCellKeyDown(e, rowIndex, colIndex)}
                onFocus={() => setFocusedCell({ row: rowIndex, col: colIndex })}
              >
                {column.render 
                  ? column.render(row[column.key], row, rowIndex)
                  : row[column.key]
                }
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  };

  // Anunciar actualizaciones de la tabla
  useEffect(() => {
    if (!loading) {
      announceTableUpdate(data.length, 'tabla');
    }
  }, [data.length, loading, announceTableUpdate]);

  return (
    <div className={`${themeTable.container} ${className}`} {...props}>
      {/* Live Region para anuncios */}
      <div {...liveRegionProps} />
      
      {/* Caption y Summary */}
      {caption && (
        <div id={captionId} className="sr-only">
          {caption}
        </div>
      )}
      
      {summary && (
        <div id={summaryId} className="sr-only">
          {summary}
        </div>
      )}
      
      {/* Tabla principal */}
      <table
        ref={tableRef}
        id={uniqueTableId}
        className={themeTable.table}
        role="table"
        aria-labelledby={caption ? captionId : undefined}
        aria-describedby={summary ? summaryId : undefined}
        aria-rowcount={data.length}
        aria-colcount={columns.length + (selectable ? 1 : 0)}
      >
        {renderTableHeader()}
        {renderTableBody()}
      </table>
    </div>
  );
};

export default AccessibleTable;
