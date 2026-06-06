import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/** Hasilkan deret nomor halaman dengan ellipsis: 1 … 4 5 6 … 20 */
function pageRange(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | 'ellipsis')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  if (start > 2) pages.push('ellipsis')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push('ellipsis')

  pages.push(total)
  return pages
}

type PaginationProps = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  /** Teks ringkasan opsional, mis. "1–9 dari 42". */
  summary?: string
  className?: string
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  summary,
  className,
}: PaginationProps) {
  if (totalPages <= 1) {
    // Tetap tampilkan ringkasan kalau ada, tapi tanpa kontrol.
    return summary ? (
      <div
        className={cn(
          'flex items-center justify-end pt-4 text-xs text-gray-500 dark:text-gray-400',
          className,
        )}
      >
        {summary}
      </div>
    ) : null
  }

  const pages = pageRange(page, totalPages)

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between gap-3 pt-4 sm:flex-row',
        className,
      )}
    >
      {summary ? (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {summary}
        </span>
      ) : (
        <span />
      )}

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="size-4" />
        </Button>

        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span
              key={`e-${i}`}
              className="px-1 text-gray-400 dark:text-gray-500"
            >
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? 'default' : 'outline'}
              size="icon"
              className="size-8"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </Button>
          ),
        )}

        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
