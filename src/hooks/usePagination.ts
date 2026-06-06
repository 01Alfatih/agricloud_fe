import { useEffect, useMemo, useState } from 'react'

/**
 * Pagination client-side sederhana untuk array yang sudah di-fetch penuh.
 * Otomatis reset ke halaman 1 saat panjang data berubah (mis. hasil search),
 * dan men-clamp halaman aktif bila total halaman menyusut.
 */
export function usePagination<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1)

  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  // Reset/clamp halaman saat jumlah data berubah.
  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages))
  }, [totalPages])

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return { page, setPage, totalPages, pageItems, total, from, to, pageSize }
}
