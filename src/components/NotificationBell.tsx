import { useEffect, useRef, useState } from 'react'
import {
  Bell,
  CalendarClock,
  CheckCheck,
  ClipboardList,
  Truck,
  Warehouse,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { usePreferences } from '@/lib/preferences'
import { cn } from '@/lib/utils'

// Lonceng notifikasi untuk header sidebar + panel dropdown.
// Konsumsi backend in-app (lihat hooks/useNotifications). Tanpa dependency baru:
// dropdown ringan pakai state lokal + klik-luar + ESC.

// Ikon per jenis notifikasi (kosmetik; cocokkan dengan `type` dari backend).
const TYPE_ICON: Record<string, ReactNode> = {
  low_stock: <Warehouse size={16} />,
  phase_schedule: <CalendarClock size={16} />,
  movement_status: <Truck size={16} />,
  needs_unfulfilled: <ClipboardList size={16} />,
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return ''
  const diffSec = Math.round((Date.now() - then) / 1000)
  if (diffSec < 60) return 'baru saja'
  const min = Math.round(diffSec / 60)
  if (min < 60) return `${min} mnt lalu`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr} jam lalu`
  const day = Math.round(hr / 24)
  if (day < 7) return `${day} hari lalu`
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  })
}

export function NotificationBell() {
  const { preferences } = usePreferences()
  const enabled = preferences.notifications
  const { items, unreadCount, loading, error, markRead, markAllRead } =
    useNotifications({ enabled })

  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Tutup saat klik di luar / ESC.
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Notifikasi dinonaktifkan di Pengaturan → sembunyikan lonceng sepenuhnya.
  if (!enabled) return null

  const badge = unreadCount > 99 ? '99+' : String(unreadCount)

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifikasi"
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-white/85 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            'absolute left-0 top-full z-50 mt-2 w-80 max-w-[78vw] overflow-hidden rounded-xl border shadow-xl',
            'border-black/10 bg-white text-gray-900',
            'dark:border-white/10 dark:bg-[#15211a] dark:text-gray-100',
          )}
        >
          {/* Header panel */}
          <div className="flex items-center justify-between gap-2 border-b border-black/5 px-4 py-3 dark:border-white/5">
            <span className="text-sm font-semibold">Notifikasi</span>
            <button
              type="button"
              onClick={() => void markAllRead()}
              disabled={unreadCount === 0}
              className="flex items-center gap-1 text-xs font-medium text-[#0B4619] transition-colors hover:underline disabled:cursor-not-allowed disabled:text-gray-400 dark:text-[#5cbb70] dark:disabled:text-gray-600"
            >
              <CheckCheck size={14} />
              Tandai semua
            </button>
          </div>

          {/* Body */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded-lg bg-black/5 dark:bg-white/5"
                  />
                ))}
              </div>
            ) : error ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Gagal memuat notifikasi.
              </p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Belum ada notifikasi.
              </p>
            ) : (
              <ul className="divide-y divide-black/5 dark:divide-white/5">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => void markRead(n.id)}
                      className={cn(
                        'flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-black/[0.03] dark:hover:bg-white/5',
                        !n.is_read &&
                          'bg-[#0B4619]/[0.04] dark:bg-[#5cbb70]/[0.06]',
                      )}
                    >
                      <span className="mt-0.5 shrink-0 text-[#0B4619] dark:text-[#5cbb70]">
                        {TYPE_ICON[n.type] ?? <Bell size={16} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {n.title}
                          </span>
                          {!n.is_read && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                          )}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs text-gray-600 dark:text-gray-400">
                          {n.body}
                        </span>
                        <span className="mt-1 block text-[11px] text-gray-400 dark:text-gray-500">
                          {relativeTime(n.created_at)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
