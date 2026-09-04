import { Fragment, useState } from 'react'
import { ChevronDown, ChevronRight, Folder, FolderOpen, FolderTree, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import EmptyState from '@/components/ui/EmptyState'
import { useI18n } from '@/lib/i18n'

import type { Category } from '../types'

interface CategoryTreeProps {
  categories: Category[]
  selectedCategory: Category | null
  onSelectCategory: (category: Category) => void
  onAddCategory: () => void
}

/** parent_id puede llegar como número o como string legacy ('0', 'none', 'null'). */
const isRootId = (parentId: Category['parent_id']) => {
  const pid = String(parentId ?? '')
  return !pid || pid === '0' || pid === 'none' || pid === 'null'
}

export function CategoryTree({
  categories,
  selectedCategory,
  onSelectCategory,
  onAddCategory,
}: CategoryTreeProps) {
  const { t } = useI18n()
  const [expandedNodes, setExpandedNodes] = useState<Set<number | string>>(() => new Set())

  const toggleExpand = (id: number | string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const isRoot = (c: Category) => {
    if (isRootId(c.parent_id)) return true
    // Huérfanas (el padre no existe en la lista) se tratan como raíz.
    return !categories.some((parent) => Number(parent.id) === Number(c.parent_id))
  }

  const rootCategories = categories.filter(isRoot)
  const getChildren = (parentId: number | string) =>
    categories.filter((c) => !isRoot(c) && Number(c.parent_id) === Number(parentId))

  const renderCategory = (cat: Category, level: number = 0) => {
    const isSelected = selectedCategory?.id === cat.id
    const children = getChildren(cat.id)
    const hasChildren = children.length > 0
    const isExpanded = expandedNodes.has(cat.id)
    const Chevron = isExpanded ? ChevronDown : ChevronRight

    return (
      <Fragment key={cat.id}>
        <button
          type="button"
          onClick={() => onSelectCategory(cat)}
          aria-expanded={hasChildren ? isExpanded : undefined}
          className={`flex items-center justify-between w-full p-sm rounded-sm cursor-pointer transition-colors duration-150 mt-xs text-left ${
            isSelected
              ? 'bg-primary/10 text-primary'
              : 'hover:bg-surface-muted text-on-surface-deep'
          }`}
          style={{ marginLeft: `${level * 1.25}rem` }}
        >
          <span className="flex items-center gap-xs min-w-0">
            <Chevron
              className={`w-4 h-4 shrink-0 transition-colors ${
                hasChildren
                  ? `${isSelected ? 'text-primary' : 'text-on-surface-deep'} cursor-pointer hover:text-primary`
                  : 'opacity-0'
              }`}
              onClick={(e) => hasChildren && toggleExpand(cat.id, e)}
            />
            {hasChildren && isExpanded ? (
              <FolderOpen className="w-4 h-4 shrink-0 text-secondary" />
            ) : (
              <Folder className="w-4 h-4 shrink-0 text-secondary" />
            )}
            <span className="text-body-md truncate">{cat.name}</span>
          </span>
        </button>
        {hasChildren && isExpanded ? (
          <div className="flex flex-col">
            {children.map((child) => renderCategory(child, level + 1))}
          </div>
        ) : null}
      </Fragment>
    )
  }

  return (
    <div className="flex flex-col bg-surface rounded-md shadow-whisper border-0 p-lg h-full max-h-[70vh]">
      <div className="flex justify-between items-center mb-md border-b border-border-subtle pb-sm">
        <h2 className="text-title-md text-foreground">{t('categories.tree.title')}</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onAddCategory}
          type="button"
          aria-label={t('categories.tree.add')}
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto pr-xs custom-scrollbar">
        {categories.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            size="small"
            title={t('categories.tree.empty')}
            description={t('categories.tree.empty_description')}
            actionLabel={t('categories.tree.add')}
            onAction={onAddCategory}
          />
        ) : (
          rootCategories.map((cat) => renderCategory(cat, 0))
        )}
      </div>
    </div>
  )
}

export default CategoryTree
