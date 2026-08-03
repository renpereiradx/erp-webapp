/**
 * Extractor unificado de respuestas de lista + paginación.
 *
 * El backend aún tiene 5 wrappers de lista distintos (§3.1 de la auditoría de
 * integración), así que saleService y purchaseService mantenían dos copias casi
 * idénticas de esta heurística defensiva (~267 líneas). Este helper las unifica
 * SIN cambiar comportamiento: mismas claves candidatas, mismo orden de prioridad.
 *
 * Cuando el backend unifique los wrappers, este archivo colapsa a ~5 líneas —
 * es el punto de medición único del progreso (§6.1).
 */

interface ExtractListOptions {
  /** Claves específicas de items en la respuesta (p.ej. ['sales'] o ['purchases']). */
  itemKeys: string[];
  /** Detector del caso "la respuesta ES un item único" (p.ej. sale_id || id). */
  isSingleItem: (response: any) => boolean;
  /** Claves de fallback para pageSize en `fallback`, en orden de prioridad. */
  pageSizeFallbackKeys: string[];
  /** Claves extra de totalRecords leídas en `response` y `response.data`. */
  extraTotalKeys: string[];
  /** true emite además los alias legacy de paginación (page_size, total_pages, ...). */
  includeLegacyPaginationKeys: boolean;
}

const firstDefined = (...values: any[]): any => {
  for (const value of values) {
    if (value !== undefined && value !== null) return value
  }
  return undefined
}

export function extractListResponse(
  response: any,
  options: ExtractListOptions,
  fallback: any = {},
): { data: any[]; pagination: Record<string, any> } {
  const {
    itemKeys,
    isSingleItem,
    pageSizeFallbackKeys,
    extraTotalKeys,
    includeLegacyPaginationKeys,
  } = options

  const arrayCandidates = [
    response,
    response?.data,
    response?.data?.data,
    ...itemKeys.map(key => response?.[key]),
    ...itemKeys.map(key => response?.data?.[key]),
    response?.results,
    response?.data?.results,
    response?.items,
    response?.data?.items,
    response?.rows,
    response?.data?.rows,
  ]

  let data: any[] = []
  for (const candidate of arrayCandidates) {
    if (Array.isArray(candidate)) {
      data = candidate
      break
    }
  }

  if (
    data.length === 0 &&
    response &&
    typeof response === 'object' &&
    isSingleItem(response)
  ) {
    data = [response]
  }

  const paginationSource =
    (response?.pagination && typeof response.pagination === 'object'
      ? response.pagination
      : null) ||
    (response?.data?.pagination &&
    typeof response.data.pagination === 'object'
      ? response.data.pagination
      : null) ||
    (response?.meta?.pagination &&
    typeof response.meta.pagination === 'object'
      ? response.meta.pagination
      : null) ||
    (response?.data?.meta?.pagination &&
    typeof response.data.meta.pagination === 'object'
      ? response.data.meta.pagination
      : null)

  const pageRaw = firstDefined(
    paginationSource?.page,
    paginationSource?.current_page,
    response?.page,
    response?.data?.page,
    fallback.page,
  )
  const page = Number(pageRaw ?? 1)
  const normalizedPage = Number.isFinite(page) && page > 0 ? page : 1

  const pageSizeRaw = firstDefined(
    paginationSource?.page_size,
    paginationSource?.pageSize,
    paginationSource?.per_page,
    response?.page_size,
    response?.data?.page_size,
    ...pageSizeFallbackKeys.map(key => fallback?.[key]),
  )
  const pageSize = Number(pageSizeRaw ?? 50)
  const normalizedPageSize =
    Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 50

  const totalPagesRaw = firstDefined(
    paginationSource?.total_pages,
    paginationSource?.totalPages,
    response?.total_pages,
    response?.data?.total_pages,
  )
  const totalPages = Number(totalPagesRaw ?? 0)
  const normalizedTotalPages =
    Number.isFinite(totalPages) && totalPages > 0 ? totalPages : null

  const totalRecordsRaw = firstDefined(
    paginationSource?.total_records,
    paginationSource?.totalRecords,
    paginationSource?.total_items,
    paginationSource?.totalItems,
    response?.total_records,
    response?.data?.total_records,
    response?.total_items,
    response?.data?.total_items,
    ...extraTotalKeys.map(key => response?.[key]),
    ...extraTotalKeys.map(key => response?.data?.[key]),
  )
  const totalRecords = Number(totalRecordsRaw ?? 0)
  const normalizedTotalRecords =
    Number.isFinite(totalRecords) && totalRecords >= 0 ? totalRecords : null

  const hasNextFromSource = firstDefined(
    paginationSource?.has_next,
    paginationSource?.hasNext,
    paginationSource?.has_more,
    paginationSource?.hasMore,
  )

  const hasPreviousFromSource = firstDefined(
    paginationSource?.has_previous,
    paginationSource?.hasPrevious,
  )

  const hasNext =
    typeof hasNextFromSource === 'boolean'
      ? hasNextFromSource
      : normalizedTotalPages
        ? normalizedPage < normalizedTotalPages
        : data.length >= normalizedPageSize

  const hasPrevious =
    typeof hasPreviousFromSource === 'boolean'
      ? hasPreviousFromSource
      : normalizedPage > 1

  const pagination: Record<string, any> = {
    page: normalizedPage,
    pageSize: normalizedPageSize,
    totalPages: normalizedTotalPages,
    totalRecords: normalizedTotalRecords,
    hasNext,
    hasPrevious,
  }

  if (includeLegacyPaginationKeys) {
    pagination.page_size = normalizedPageSize
    pagination.total_pages = normalizedTotalPages
    pagination.total_records = normalizedTotalRecords
    pagination.has_next = hasNext
    pagination.has_previous = hasPrevious
  }

  return { data, pagination }
}
