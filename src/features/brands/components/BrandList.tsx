import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Image } from 'lucide-react'

import { Button } from '@/components/ui/button'
import EmptyState from '@/components/ui/EmptyState'
import { useI18n } from '@/lib/i18n'

import type { Brand } from '../types/brand'

interface BrandListProps {
  brands: Brand[]
  selectedBrandId: string | null
  onSelectBrand: (id: string) => void
}

const ITEMS_PER_PAGE = 8

/** Master del workspace de marcas: directorio paginado (la búsqueda vive en la toolbar de la página). */
export const BrandList: React.FC<BrandListProps> = ({
  brands,
  selectedBrandId,
  onSelectBrand,
}) => {
  const { t } = useI18n()
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(brands.length / ITEMS_PER_PAGE)

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedBrands = brands.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Reset to page 1 when the list changes (filter applied from the toolbar)
  useEffect(() => {
    setCurrentPage(1)
  }, [brands.length])

  return (
    <div className="bg-surface rounded-md shadow-whisper border-0 p-lg flex flex-col">
      {brands.length === 0 ? (
        <EmptyState
          icon={Image}
          size="small"
          title={t('brands.table.empty')}
          description={t('brands.table.empty_description')}
        />
      ) : (
        <>
          <div className="overflow-auto custom-scrollbar">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr>
                  <th className="text-label-caps uppercase text-on-surface-deep pb-sm pl-sm w-16">{t('brands.table.logo')}</th>
                  <th className="text-label-caps uppercase text-on-surface-deep pb-sm">{t('brands.table.name')}</th>
                  <th className="text-label-caps uppercase text-on-surface-deep pb-sm">{t('brands.table.slug')}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBrands.map((brand) => (
                  <tr
                    key={brand.id}
                    onClick={() => onSelectBrand(String(brand.id))}
                    className={`rounded-md transition-colors duration-150 group cursor-pointer border ${
                      selectedBrandId === String(brand.id)
                        ? 'bg-surface-muted border-primary/40'
                        : 'bg-surface border-transparent hover:bg-surface-muted'
                    }`}
                  >
                    <td className="py-sm pl-sm rounded-l-md">
                      {brand.logoUrl ? (
                        <img
                          src={brand.logoUrl}
                          alt={brand.name}
                          className="w-8 h-8 rounded-sm object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-sm bg-surface-subtle flex items-center justify-center text-on-surface-deep">
                          <Image className="w-4 h-4" />
                        </div>
                      )}
                    </td>
                    <td className="py-sm text-body-md-bold text-foreground">{brand.name}</td>
                    <td className="py-sm pr-sm text-data-mono font-data-mono text-on-surface-deep rounded-r-md">{brand.slug}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-md pt-sm border-t border-border-subtle flex justify-between items-center">
            <span className="text-body-md text-on-surface-deep">
              {t('brands.pagination.showing', {
                from: paginatedBrands.length > 0 ? startIndex + 1 : 0,
                to: Math.min(startIndex + ITEMS_PER_PAGE, brands.length),
                total: brands.length,
              })}
            </span>
            <div className="flex gap-xs">
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('common.pagination.previous')}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('common.pagination.next')}
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default BrandList
