import React from 'react';
import type { Category } from '../types';

interface CategoryTreeProps {
  categories: Category[];
  selectedCategory: Category | null;
  onSelectCategory: (category: Category) => void;
  onAddCategory: () => void;
}

export function CategoryTree({
  categories,
  selectedCategory,
  onSelectCategory,
  onAddCategory,
}: CategoryTreeProps) {
  const [expandedNodes, setExpandedNodes] = React.useState<Set<number | string>>(new Set());

  const toggleExpand = (id: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Build a tree structure from flat categories list
  const isRoot = (c: Category) => {
    if (!c.parent_id || c.parent_id === 0 || c.parent_id === '0' || c.parent_id === 'none' || c.parent_id === 'null') return true;
    // Treat as root if parent doesn't exist in the list (orphan)
    return !categories.some(parent => Number(parent.id) === Number(c.parent_id));
  };
  
  const rootCategories = categories.filter(isRoot);
  const getChildren = (parentId: number | string) => 
    categories.filter((c) => !isRoot(c) && Number(c.parent_id) === Number(parentId));

  const renderCategory = (cat: Category, level: number = 0) => {
    const isSelected = selectedCategory?.id === cat.id;
    const children = getChildren(cat.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes.has(cat.id);

    return (
      <React.Fragment key={cat.id}>
        <div
          onClick={() => onSelectCategory(cat)}
          className={`flex items-center justify-between p-sm rounded-lg cursor-pointer transition-colors group mt-xs ${
            isSelected
              ? 'bg-primary/10 text-primary font-bold'
              : 'hover:bg-surface-container-low text-on-surface-variant'
          }`}
          style={{ marginLeft: `${level * 1.5}rem` }}
        >
          <div className="flex items-center gap-xs">
            <span 
              onClick={(e) => hasChildren && toggleExpand(cat.id, e)}
              className={`material-symbols-outlined text-[18px] transition-colors ${
                hasChildren ? 'cursor-pointer hover:text-primary' : 'opacity-0'
              } ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`}
            >
              {hasChildren ? (isExpanded ? 'keyboard_arrow_down' : 'chevron_right') : 'remove'}
            </span>
            <span className="material-symbols-outlined text-[18px] text-secondary">
              {hasChildren ? (isExpanded ? 'folder_open' : 'folder') : 'topic'}
            </span>
            <span className="text-body-sm font-body-sm">{cat.name}</span>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="flex flex-col">
            {children.map((child) => renderCategory(child, level + 1))}
          </div>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="flex flex-col bg-surface rounded-[16px] shadow-sm border border-outline-variant/30 p-lg h-full min-h-[500px]">
      <div className="flex justify-between items-center mb-md border-b border-outline-variant/20 pb-sm">
        <h2 className="text-title-md font-title-md text-on-surface font-bold">Árbol de Categorías</h2>
        <button
          onClick={onAddCategory}
          type="button"
          className="text-primary hover:bg-primary/5 p-1 rounded transition-colors flex items-center justify-center"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto pr-xs custom-scrollbar">
        {categories.length === 0 ? (
          <div className="p-sm text-on-surface-variant text-body-sm">No hay categorías.</div>
        ) : (
          rootCategories.map((cat) => renderCategory(cat, 0))
        )}
      </div>
    </div>
  );
}

export default CategoryTree;
