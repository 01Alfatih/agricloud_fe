import { Link } from '@tanstack/react-router'
import { CalendarDays, ChevronRight, Sprout, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

const API_BASE_URL = 'http://localhost:8005/api'

// Kontrak yang diharapkan FE — lihat PESAN-BACKEND.md (GET /api/cycles?field_id=).
// Semua opsional supaya FE tahan kalau backend belum lengkap.
interface ICycleResponse {
  id: number
  plant_name?: string
  start_date?: string
  status?: string
  phase?: string
  progress?: number
  estimated_harvest_date?: string
}

interface IActiveCycle {
  id: number
  plantName: string
  startDate: string
  phase: string
  progress: number | null
  estimatedHarvest: string
}

function formatDate(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Selisih hari dari tanggal mulai sampai sekarang (≥ 0).
function daysSince(iso?: string): number | null {
  if (!iso) return null
  const start = new Date(iso)
  if (Number.isNaN(start.getTime())) return null
  const diff = Math.floor((Date.now() - start.getTime()) / 86_400_000)
  return Math.max(0, diff)
}

export function ActiveCycleCard({
  fieldId,
  onStartPlanting,
  refreshKey = 0,
}: {
  fieldId: string
  onStartPlanting: () => void
  // Naikkan nilainya untuk memaksa fetch ulang (mis. setelah mulai tanam baru).
  refreshKey?: number
}) {
  const [cycle, setCycle] = useState<IActiveCycle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)

    axios
      .get<{ data: Array<ICycleResponse> }>(`${API_BASE_URL}/cycles`, {
        params: { field_id: fieldId },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        signal: controller.signal,
      })
      .then((res) => {
        const list = res.data.data ?? []
        // Siklus aktif = belum panen/selesai. Fallback: ambil yang pertama.
        const active =
          list.find((c) => c.status !== 'harvested' && c.status !== 'done') ??
          list[0]
        if (!active) {
          setCycle(null)
          return
        }
        setCycle({
          id: active.id,
          plantName: active.plant_name || 'Tanaman',
          startDate: active.start_date || '',
          phase: active.phase || 'Berjalan',
          progress:
            typeof active.progress === 'number' ? active.progress : null,
          estimatedHarvest: active.estimated_harvest_date || '',
        })
      })
      .catch((err) => {
        if (err.name === 'CanceledError') return
        // Endpoint belum ada / error → perlakukan sebagai "belum ada siklus".
        console.error('Gagal memuat siklus:', err)
        setCycle(null)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [fieldId, refreshKey])

  return (
    <Card className="rounded-xl bg-white shadow-sm dark:border-white/10 dark:bg-[#15211a]">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <h3 className="flex items-center gap-2 text-base font-semibold text-[#1a472a] dark:text-[#a7d1a7]">
          <Sprout className="h-4 w-4" /> Siklus Tanam Aktif
        </h3>

        {loading ? (
          <div className="space-y-3">
            <div className="h-5 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
            <div className="h-2.5 w-full animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
          </div>
        ) : !cycle ? (
          // Empty state — belum ada siklus berjalan di lahan ini.
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-300">
              <Sprout className="h-7 w-7" />
            </div>
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-200">
                Belum ada tanam
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Mulai siklus tanam baru untuk lahan ini.
              </p>
            </div>
            <Button
              onClick={onStartPlanting}
              className="gap-2 rounded-full bg-[#0B4619] text-white hover:bg-[#2a7039] dark:bg-[#5cbb70] dark:text-[#0c1410] dark:hover:bg-[#5cbb70]/90"
            >
              <Sprout className="h-4 w-4" /> Mulai Tanam
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-gray-800 dark:text-gray-100">
                  {cycle.plantName}
                </p>
                {daysSince(cycle.startDate) !== null && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Hari ke-{daysSince(cycle.startDate)} sejak tanam
                  </p>
                )}
              </div>
              <Badge className="shrink-0 bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300">
                {cycle.phase}
              </Badge>
            </div>

            {cycle.progress !== null && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <TrendingUp className="h-3.5 w-3.5" /> Progress
                  </span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {cycle.progress}%
                  </span>
                </div>
                <Progress
                  value={cycle.progress}
                  className="bg-gray-100 dark:bg-white/10 [&>[data-slot=progress-indicator]]:bg-green-500"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <CalendarDays className="h-4 w-4 shrink-0 text-sky-500" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Mulai Tanam
                  </p>
                  <p className="truncate">{formatDate(cycle.startDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <Sprout className="h-4 w-4 shrink-0 text-green-500" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Perkiraan Panen
                  </p>
                  <p className="truncate">
                    {formatDate(cycle.estimatedHarvest)}
                  </p>
                </div>
              </div>
            </div>

            <Link to="/dCycle-ii">
              <Button
                variant="outline"
                className="w-full gap-2 rounded-full border-[#0B4619] text-[#0B4619] hover:bg-green-50 dark:border-white/15 dark:text-[#a7d1a7] dark:hover:bg-white/5"
              >
                Lihat Detail Siklus <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
