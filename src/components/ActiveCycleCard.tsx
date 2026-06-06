import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Plus,
  Sprout,
  TrendingUp,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { emojiForCrop } from '@/lib/crops'

const API_BASE_URL = 'http://localhost:8005/api'

// Kontrak yang diharapkan FE — lihat CycleResource backend (GET /api/cycles?field_id=).
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

interface ICycle {
  id: number
  plantName: string
  startDate: string
  status: string
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

// Siklus "aktif" = masih berjalan (active) atau belum mulai (pending). Sisanya
// (done/harvested/failed) masuk grup riwayat yang dipudarkan.
function isActiveGroup(status: string): boolean {
  return status === 'active' || status === 'pending'
}

// Urutan tampil: aktif → menunggu → selesai → gagal. Dalam grup, terbaru dulu.
function statusRank(status: string): number {
  if (status === 'active') return 0
  if (status === 'pending') return 1
  if (status === 'done' || status === 'harvested') return 2
  if (status === 'failed') return 3
  return 4
}

// Label + warna badge per status (untuk kartu riwayat).
function statusMeta(status: string): { label: string; className: string } {
  switch (status) {
    case 'pending':
      return {
        label: 'Menunggu',
        className:
          'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
      }
    case 'failed':
      return {
        label: 'Gagal',
        className:
          'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
      }
    case 'done':
    case 'harvested':
      return {
        label: 'Selesai',
        className:
          'bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-gray-300',
      }
    case 'active':
    default:
      return {
        label: 'Aktif',
        className:
          'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',
      }
  }
}

/* ------------------------------ sub-komponen ------------------------------ */

// Satu kartu siklus dalam carousel. Aktif → full color + badge fase + "Hari ke-N".
// Riwayat (selesai/gagal) → dipudarkan; terang + naik saat hover. Seluruh kartu
// adalah link ke detail siklus.
function CycleCard({ cycle, fieldId }: { cycle: ICycle; fieldId: string }) {
  const active = isActiveGroup(cycle.status)
  const status = statusMeta(cycle.status)
  const days = daysSince(cycle.startDate)

  return (
    <Link
      to="/dCycle-ii/$id"
      params={{ id: String(cycle.id) }}
      search={{ field_id: Number(fieldId) }}
      title={`Lihat detail siklus ${cycle.plantName}`}
      className={cn(
        'group flex w-72 shrink-0 snap-start flex-col gap-3 rounded-xl border border-gray-100 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:hover:bg-white/5',
        !active && 'opacity-60 grayscale hover:opacity-100 hover:grayscale-0',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-2xl leading-none">
            {emojiForCrop(cycle.plantName)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-800 dark:text-gray-100">
              {cycle.plantName}
            </p>
            {active && days !== null && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Hari ke-{days} sejak tanam
              </p>
            )}
          </div>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
            active
              ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300'
              : status.className,
          )}
        >
          {active ? cycle.phase : status.label}
        </span>
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

      <div className="mt-auto grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-sky-500" />
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 dark:text-gray-500">
              Mulai
            </p>
            <p className="truncate">{formatDate(cycle.startDate)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
          <Sprout className="h-3.5 w-3.5 shrink-0 text-green-500" />
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 dark:text-gray-500">
              Panen
            </p>
            <p className="truncate">{formatDate(cycle.estimatedHarvest)}</p>
          </div>
        </div>
      </div>

      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#0B4619] group-hover:underline dark:text-[#a7d1a7]">
        Lihat Detail <ChevronRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  )
}

// Kartu "tambah" di ujung carousel → buka modal mulai tanam.
function AddCycleCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-44 shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 p-4 text-center transition-colors hover:border-green-500 hover:bg-green-50/50 dark:border-white/15 dark:hover:border-green-500 dark:hover:bg-green-500/10"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-300">
        <Plus className="h-5 w-5" />
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
        Mulai Tanam
      </span>
    </button>
  )
}

/* -------------------------------- komponen -------------------------------- */

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
  const [cycles, setCycles] = useState<Array<ICycle>>([])
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
        const list = (res.data.data ?? []).map<ICycle>((c) => ({
          id: c.id,
          plantName: c.plant_name || 'Tanaman',
          startDate: c.start_date || '',
          status: c.status || 'active',
          phase: c.phase || 'Berjalan',
          progress: typeof c.progress === 'number' ? c.progress : null,
          estimatedHarvest: c.estimated_harvest_date || '',
        }))
        // Urutkan: aktif dulu, lalu riwayat; dalam grup, mulai-tanam terbaru dulu.
        list.sort((a, b) => {
          const r = statusRank(a.status) - statusRank(b.status)
          if (r !== 0) return r
          return (
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          )
        })
        setCycles(list)
      })
      .catch((err) => {
        if (err.name === 'CanceledError') return
        // Endpoint belum ada / error → perlakukan sebagai "belum ada siklus".
        console.error('Gagal memuat siklus:', err)
        setCycles([])
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [fieldId, refreshKey])

  const activeCount = cycles.filter((c) => isActiveGroup(c.status)).length

  return (
    <Card className="rounded-xl bg-white shadow-sm dark:border-white/10 dark:bg-[#15211a]">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-base font-semibold text-[#1a472a] dark:text-[#a7d1a7]">
            <Sprout className="h-4 w-4" /> Siklus Tanam
          </h3>
          {!loading && cycles.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {activeCount} aktif · {cycles.length} total
              </span>
              <Link
                to="/cycle-ii"
                search={{ field_id: Number(fieldId) }}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#0B4619] hover:underline dark:text-[#a7d1a7]"
              >
                Lihat Semua <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-44 w-72 shrink-0 animate-pulse rounded-xl bg-gray-200 dark:bg-white/10"
              />
            ))}
          </div>
        ) : cycles.length === 0 ? (
          // Empty state — belum ada siklus sama sekali di lahan ini.
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
          // Carousel horizontal — geser ke samping; aktif di depan, riwayat dipudarkan.
          <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
            {cycles.map((cycle) => (
              <CycleCard key={cycle.id} cycle={cycle} fieldId={fieldId} />
            ))}
            <AddCycleCard onClick={onStartPlanting} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
