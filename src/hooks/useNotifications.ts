import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'

// Konsumsi notifikasi in-app dari backend (Tier 1, lihat vault Logs/Notif-Backend-Hasil).
// Endpoint (group auth:sanctum):
//   GET  /notifications            → { data: NotificationItem[], links, meta }
//   GET  /notifications/unread-count → { data: { unread_count } }
//   POST /notifications/{id}/read    → { data: NotificationItem }
//   POST /notifications/read-all     → { data: { unread_count } }
// Polling unread-count berkala untuk badge live (belum WebSocket).

export interface NotificationItem {
  id: string
  type: string
  title: string
  body: string
  data: Record<string, unknown>
  is_read: boolean
  created_at: string
}

interface UseNotificationsOptions {
  // Polling dimatikan saat user menonaktifkan notifikasi di Pengaturan.
  enabled?: boolean
  // Interval polling unread-count (ms). Default 60 dtk.
  pollMs?: number
}

interface UseNotificationsResult {
  items: Array<NotificationItem>
  unreadCount: number
  loading: boolean
  error: boolean
  refresh: () => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
}

export function useNotifications(
  options: UseNotificationsOptions = {},
): UseNotificationsResult {
  const { enabled = true, pollMs = 60_000 } = options

  const [items, setItems] = useState<Array<NotificationItem>>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Hindari setState setelah unmount.
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  // Mirror items terkini untuk dibaca di callback tanpa stale closure.
  const itemsRef = useRef(items)
  itemsRef.current = items

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get<{ data?: { unread_count?: number } }>(
        '/notifications/unread-count',
      )
      if (mounted.current) setUnreadCount(res.data.data?.unread_count ?? 0)
    } catch {
      /* diam — badge cukup pertahankan nilai terakhir */
    }
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await api.get<{ data?: Array<NotificationItem> }>(
        '/notifications',
      )
      if (!mounted.current) return
      setItems(res.data.data ?? [])
    } catch {
      if (mounted.current) setError(true)
    } finally {
      if (mounted.current) setLoading(false)
    }
    await fetchUnreadCount()
  }, [fetchUnreadCount])

  const markRead = useCallback(async (id: string) => {
    // Optimistik: tandai dibaca + kurangi badge sebelum request balik.
    const wasUnread = itemsRef.current.some((n) => n.id === id && !n.is_read)
    if (!wasUnread) return
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    )
    setUnreadCount((c) => Math.max(0, c - 1))
    try {
      await api.post(`/notifications/${id}/read`)
    } catch {
      /* gagal → biarkan optimistik; akan terkoreksi saat refresh berikutnya */
    }
  }, [])

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
    try {
      await api.post('/notifications/read-all')
    } catch {
      /* gagal → akan terkoreksi saat refresh berikutnya */
    }
  }, [])

  // Muat awal + polling unread-count.
  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    void refresh()
    const id = setInterval(() => void fetchUnreadCount(), pollMs)
    return () => clearInterval(id)
  }, [enabled, pollMs, refresh, fetchUnreadCount])

  return { items, unreadCount, loading, error, refresh, markRead, markAllRead }
}
