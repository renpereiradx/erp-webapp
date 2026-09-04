import { useState } from 'react'
import { Plus, Search } from 'lucide-react'

import { useI18n } from '@/lib/i18n'
import PageHeader from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import SegmentedControl from '@/components/ui/SegmentedControl'
import GenericSkeletonList from '@/components/ui/GenericSkeletonList'
import ErrorState from '@/components/ui/ErrorState'
import WorkspaceLayout from '@/components/layout/WorkspaceLayout'

import {
  AttributeEditor,
  AttributesTable,
  TagEditor,
  TagsTable,
  useAttributes,
} from '@/features/attributes'

type AttributesTabKey = 'attributes' | 'tags'

/**
 * Attributes Page — Atributos y Etiquetas.
 * Workspace maestro-detalle (conductor/PLAN_CATALOG_WORKSPACE_LAYOUT_FRONTEND.md):
 * tabs + búsqueda en la toolbar, listado a la izquierda, editor sticky a la derecha.
 */
export const AttributesPage: React.FC = () => {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<AttributesTabKey>('attributes')
  const {
    filteredAttributes,
    filteredTags,
    searchAttrTerm,
    setSearchAttrTerm,
    searchTagTerm,
    setSearchTagTerm,
    selectedAttribute,
    setSelectedAttribute,
    selectedTag,
    setSelectedTag,
    categories,
    loading,
    error,
    handleCreateNew,
    handleCreateNewTag,
    handleSaveAttribute,
    handleDeleteAttribute,
    handleSaveTag,
    handleDeleteTag,
    refetch,
  } = useAttributes()

  const tabOptions = [
    { value: 'attributes' as const, label: t('attributes.tab.attributes') },
    { value: 'tags' as const, label: t('attributes.tab.tags') },
  ]
  const isAttrTab = activeTab === 'attributes'
  const searchTerm = isAttrTab ? searchAttrTerm : searchTagTerm
  const resultCount = isAttrTab ? filteredAttributes.length : filteredTags.length

  const searchPlaceholder = isAttrTab
    ? t('attributes.search.placeholder_attr')
    : t('attributes.search.placeholder_tag')

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('nav.attributesTags')}
          title={t('attributes.title')}
          subtitle={t('attributes.subtitle')}
          actions={
            <Button
              variant="primary"
              onClick={isAttrTab ? handleCreateNew : handleCreateNewTag}
            >
              <Plus className="w-4 h-4 mr-xs" />
              {isAttrTab ? t('attributes.action.new_attribute') : t('attributes.action.new_tag')}
            </Button>
          }
        />

        {error ? (
          <section className="mt-lg">
            <ErrorState title={t('errors.load_title')} message={error} onRetry={refetch} />
          </section>
        ) : loading && filteredAttributes.length === 0 && filteredTags.length === 0 ? (
          <section className="mt-lg">
            <GenericSkeletonList count={5} data-testid="page-loading" />
          </section>
        ) : (
          <section className="mt-lg">
            <WorkspaceLayout
              testId="attributes-workspace"
              sticky="detail"
              masterClassName="lg:col-span-8"
              detailClassName="lg:col-span-4"
              toolbar={
                <>
                  <SegmentedControl
                    options={tabOptions}
                    value={activeTab}
                    onChange={(v) => setActiveTab(v as AttributesTabKey)}
                    aria-label={t('attributes.tab.attributes')}
                  />
                  <div className="flex items-center gap-md">
                    <div className="relative w-full sm:w-64">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-deep pointer-events-none" />
                      <Input
                        className="pl-10 bg-surface border-border-subtle"
                        placeholder={searchPlaceholder}
                        type="text"
                        value={searchTerm}
                        onChange={(e) =>
                          isAttrTab ? setSearchAttrTerm(e.target.value) : setSearchTagTerm(e.target.value)
                        }
                        aria-label={searchPlaceholder}
                      />
                    </div>
                    <Badge variant="secondary">
                      {isAttrTab
                        ? t('attributes.count', { count: resultCount })
                        : t('attributes.count_tags', { count: resultCount })}
                    </Badge>
                  </div>
                </>
              }
              master={
                isAttrTab ? (
                  <AttributesTable
                    attributes={filteredAttributes}
                    selectedAttribute={selectedAttribute}
                    onSelectAttribute={setSelectedAttribute}
                    loading={loading}
                  />
                ) : (
                  <TagsTable
                    tags={filteredTags}
                    selectedTag={selectedTag}
                    onSelectTag={setSelectedTag}
                    loading={loading}
                  />
                )
              }
              detail={
                isAttrTab ? (
                  <AttributeEditor
                    selectedAttribute={selectedAttribute}
                    onSelectAttribute={setSelectedAttribute}
                    categories={categories}
                    onSaveAttribute={handleSaveAttribute}
                    onDeleteAttribute={handleDeleteAttribute}
                    loading={loading}
                  />
                ) : (
                  <TagEditor
                    selectedTag={selectedTag}
                    onSelectTag={setSelectedTag}
                    categories={categories}
                    onSaveTag={handleSaveTag}
                    onDeleteTag={handleDeleteTag}
                    loading={loading}
                  />
                )
              }
            />
          </section>
        )}
      </div>
    </div>
  )
}

export default AttributesPage
