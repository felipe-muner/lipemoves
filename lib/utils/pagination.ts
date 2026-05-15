/** Server-safe helpers for paging through tables via URL params. */
export interface PaginationParams {
  /** 1-based page number. */
  page: number
  perPage: number
  offset: number
}

const ALLOWED_PER_PAGE = [10, 25, 50, 100]

export function parsePagination(
  raw: { page?: string; perPage?: string } | undefined,
  defaultPerPage: number = 25,
): PaginationParams {
  const rawPage = Number(raw?.page ?? "1")
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1

  const rawPP = Number(raw?.perPage ?? defaultPerPage)
  const perPage = ALLOWED_PER_PAGE.includes(rawPP) ? rawPP : defaultPerPage

  return { page, perPage, offset: (page - 1) * perPage }
}

export function pageCount(total: number, perPage: number): number {
  return Math.max(1, Math.ceil(total / perPage))
}
