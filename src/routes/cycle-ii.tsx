import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowLeft,
  CalendarDays,
  Leaf,
  MapPin,
  Plus,
  Search,
  Sprout,
  TrendingUp,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Pagination } from '@/components/ui/pagination'
import { usePagination } from '@/hooks/usePagination'
import { MulaiTanamModal } from '@/components/MulaiTanamModal'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8005/api'

// Halaman "Tanaman Saya": daftar siklus tanam (cycles) MILIK user — bukan katalog
// crop-templates (itu master data semua jenis tanaman, dipakai di modal Mulai
// Tanam). Dua mode dalam satu route:
//   - tanpa `field_id`  → semua siklus user, lintas lahan
//   - `?field_id={id}`  → ke-filter per lahan (dari tombol "Lihat Siklus")
export const Route = createFileRoute('/cycle-ii')({
  validateSearch: (search: Record<string, unknown>): { field_id?: number } => {
    const raw = search.field_id
    const n =
      typeof raw === 'number'
        ? raw
        : typeof raw === 'string'
          ? Number(raw)
          : NaN
    return Number.isFinite(n) ? { field_id: n } : {}
  },
  component: RouteComponent,
})

interface ICropMeta {
  image: string | null
  icon: string
  category: string
  growthDays: number // estimasi umur panen (hari)
}

// Bentuk item dari `GET /api/cycles` (lihat tiket Cycle-MyCyclesList).
// `field_name` baru ada setelah backend selesai; sementara FE isi dari /myfields.
interface ICycleResponse {
  id: number
  plant_name?: string
  field_id?: number
  field_name?: string
  start_date?: string
  status?: string
  phase?: string
  progress?: number
  estimated_harvest_date?: string
}

// Siklus tanam yang sudah dirapikan untuk dipakai kartu.
interface ICycle {
  id: number
  plantName: string
  fieldId: number
  fieldName: string
  startDate: string
  status: string
  phase: string
  progress: number | null
  estimatedHarvest: string
  meta: ICropMeta
}

// Metadata tampilan tanaman (emoji + foto + kategori) ditebak dari nama tanaman.
// Murni untuk dekorasi kartu; data inti (progress/fase/tanggal) datang dari backend.
const CROP_RULES: Array<{ match: Array<string>; meta: ICropMeta }> = [
  {
    match: ['cabai', 'cabe'],
    meta: {
      image: '/cabe1.png',
      icon: '🌶️',
      category: 'Hortikultura',
      growthDays: 90,
    },
  },
  {
    match: ['anggur'],
    meta: {
      image: '/anggur1.png',
      icon: '🍇',
      category: 'Buah',
      growthDays: 120,
    },
  },
  {
    match: ['tomat'],
    meta: {
      image: '/tomat1.png',
      icon: '🍅',
      category: 'Hortikultura',
      growthDays: 75,
    },
  },
  {
    match: ['bayam'],
    meta: { image: null, icon: '🥬', category: 'Sayuran Daun', growthDays: 30 },
  },
  {
    match: ['kangkung'],
    meta: { image: null, icon: '🥬', category: 'Sayuran Daun', growthDays: 28 },
  },
  {
    match: ['selada', 'lettuce'],
    meta: { image: null, icon: '🥗', category: 'Sayuran Daun', growthDays: 45 },
  },
  {
    match: ['sawi'],
    meta: { image: null, icon: '🥬', category: 'Sayuran Daun', growthDays: 40 },
  },
  {
    match: ['padi', 'beras'],
    meta: { image: null, icon: '🌾', category: 'Pangan', growthDays: 110 },
  },
  {
    match: ['jagung'],
    meta: { image: null, icon: '🌽', category: 'Pangan', growthDays: 100 },
  },
  {
    match: ['terong', 'terung'],
    meta: { image: null, icon: '🍆', category: 'Hortikultura', growthDays: 80 },
  },
  {
    match: ['timun', 'mentimun'],
    meta: { image: null, icon: '🥒', category: 'Hortikultura', growthDays: 60 },
  },
  {
    match: ['wortel'],
    meta: { image: null, icon: '🥕', category: 'Umbi', growthDays: 90 },
  },
  {
    match: ['kentang'],
    meta: { image: null, icon: '🥔', category: 'Umbi', growthDays: 100 },
  },
  {
    match: ['bawang'],
    meta: { image: null, icon: '🧅', category: 'Umbi', growthDays: 70 },
  },
  {
    match: ['jeruk'],
    meta: { image: null, icon: '🍊', category: 'Buah', growthDays: 240 },
  },
  {
    match: ['strawberry', 'stroberi'],
    meta: { image: null, icon: '🍓', category: 'Buah', growthDays: 60 },
  },
]

const DEFAULT_META: ICropMeta = {
  image: null,
  icon: '🌱',
  category: 'Tanaman',
  growthDays: 90,
}

function decorateCrop(name: string): ICropMeta {
  const t = name.toLowerCase()
  return (
    CROP_RULES.find((r) => r.match.some((m) => t.includes(m)))?.meta ??
    DEFAULT_META
  )
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Status siklus → label + warna badge.
function statusMeta(status: string): { label: string; className: string } {
  switch (status) {
    case 'pending':
      return {
        label: 'Menunggu',
        className:
          'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
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

function PlantCardSkeleton() {
  return (
    <Card className="overflow-hidden border-0 p-0 shadow-md dark:border dark:border-white/10 dark:bg-[#15211a]">
      <div className="h-44 w-full animate-pulse bg-gray-200 dark:bg-white/10" />
      <CardContent className="space-y-3 p-4">
        <div className="h-5 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-white/10" />
        <div className="h-8 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
      </CardContent>
    </Card>
  )
}

// Area gambar kartu: foto kalau ada, kalau tidak placeholder gradient + emoji.
// Badge kategori TIDAK lagi di-overlay di sini — dipindah ke bawah thumbnail
// (di dalam CardContent) supaya tidak menutupi gambar.
function PlantImage({ meta, name }: { meta: ICropMeta; name: string }) {
  if (meta.image) {
    return (
      <div className="h-44 overflow-hidden">
        <img
          src={meta.image}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 dark:brightness-75"
        />
      </div>
    )
  }

  return (
    <div className="relative h-44 overflow-hidden bg-gradient-to-br from-green-500 via-green-600 to-emerald-700">
      <div className="absolute -top-6 -right-6 h-28 w-28 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -left-4 h-24 w-24 rounded-full bg-white/10" />
      <div className="flex h-full items-center justify-center">
        <span className="text-6xl drop-shadow-sm transition-transform duration-300 group-hover:scale-110">
          {meta.icon}
        </span>
      </div>
    </div>
  )
}

function RouteComponent() {
  const { field_id } = Route.useSearch()
  const [cycles, setCycles] = useState<Array<ICycle>>([])
  const [fieldName, setFieldName] = useState('') // nama lahan saat mode filter
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  // Dinaikkan setelah berhasil mulai tanam → memaksa fetch ulang.
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const headers = {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    }

    // COMPOSE INTERIM (lihat tiket Cycle-MyCyclesList): backend belum punya
    // `GET /api/cycles` tanpa field_id + `field_name`. Sementara: ambil lahan
    // user dulu (untuk nama lahan + daftar target), lalu fetch cycles per lahan.
    const fetchData = async () => {
      setLoading(true)
      try {
        const fieldsRes = await axios.get<{
          data: Array<{ id: number; name: string }>
        }>(`${API_BASE_URL}/myfields`, { headers, signal: controller.signal })
        const fields = fieldsRes.data.data ?? []
        const nameById = new Map(fields.map((f) => [f.id, f.name]))

        // Target lahan: satu (mode filter) atau semua (mode default).
        const targetIds =
          field_id != null
            ? nameById.has(field_id)
              ? [field_id]
              : [field_id] // tetap coba walau tak ada di /myfields
            : fields.map((f) => f.id)

        const perField = await Promise.all(
          targetIds.map((fid) =>
            axios
              .get<{ data: Array<ICycleResponse> }>(`${API_BASE_URL}/cycles`, {
                params: { field_id: fid },
                headers,
                signal: controller.signal,
              })
              .then((r) => (r.data.data ?? []).map((c) => ({ c, fid })))
              .catch(() => [] as Array<{ c: ICycleResponse; fid: number }>),
          ),
        )

        const mapped: Array<ICycle> = perField.flat().map(({ c, fid }) => ({
          id: c.id,
          plantName: c.plant_name || 'Tanaman',
          fieldId: c.field_id ?? fid,
          fieldName: c.field_name || nameById.get(fid) || 'Lahan',
          startDate: c.start_date || '',
          status: c.status || 'active',
          phase: c.phase || '',
          progress: typeof c.progress === 'number' ? c.progress : null,
          estimatedHarvest: c.estimated_harvest_date || '',
          meta: decorateCrop(c.plant_name || ''),
        }))

        setCycles(mapped)
        setFieldName(field_id != null ? (nameById.get(field_id) ?? '') : '')
      } catch (error) {
        if (axios.isCancel(error)) return
        console.error('Gagal memuat siklus tanam:', error)
        setCycles([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    fetchData()
    return () => controller.abort()
  }, [field_id, reloadKey])

  const filtered = cycles.filter(
    (c) =>
      c.plantName.toLowerCase().includes(query.toLowerCase()) ||
      c.fieldName.toLowerCase().includes(query.toLowerCase()),
  )

  const { page, setPage, totalPages, pageItems, total, from, to } =
    usePagination(filtered, 9)

  const isFiltered = field_id != null
  const title = isFiltered
    ? fieldName
      ? `Tanaman di ${fieldName}`
      : 'Tanaman di Lahan Ini'
    : 'Tanaman Saya'

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-[#0c1410]">
      {/* Hero */}
      <div className="relative h-64 w-full md:h-72">
        <img
          src="/bg-dashboard.png"
          alt="Kebun tanaman"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/35 to-gray-50 dark:to-[#0c1410]" />

        <div className="absolute inset-0">
          <div className="mx-auto flex h-full max-w-6xl flex-col justify-center px-6 lg:px-10">
            {/* Saat mode filter → tautan balik ke detail lahan */}
            {isFiltered && (
              <Link
                to="/dField-ii/$id"
                params={{ id: String(field_id) }}
                className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm text-white backdrop-blur-sm transition-colors hover:bg-white/30"
              >
                <ArrowLeft className="h-4 w-4" /> Kembali ke lahan
              </Link>
            )}
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="text-white">
                <h1 className="flex items-center gap-2 text-3xl font-bold drop-shadow-sm md:text-4xl">
                  <Leaf className="h-8 w-8" />
                  {title}
                </h1>
                <p className="mt-1 text-sm text-white/90 md:text-base">
                  {isFiltered
                    ? 'Siklus tanam yang berjalan di lahan ini.'
                    : 'Semua tanaman yang sedang kamu budidayakan.'}
                </p>
              </div>

              {/* Search */}
              <div className="relative w-full max-w-md">
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari tanaman / lahan"
                  className="w-full rounded-full border-0 bg-white/90 py-3 pr-12 pl-5 text-gray-800 shadow-lg backdrop-blur-sm placeholder:text-gray-500 dark:bg-[#1f3329] dark:text-gray-100 dark:placeholder:text-gray-400"
                />
                <Button
                  size="sm"
                  className="absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2 rounded-full bg-green-600 p-0 text-white hover:bg-green-700"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Konten — ditarik naik ke atas hero pakai negative margin */}
      <div className="mx-auto -mt-14 max-w-6xl px-4 pb-16 sm:px-6 lg:px-10">
        <Card className="border-0 bg-white/95 shadow-xl backdrop-blur-sm dark:border dark:border-white/10 dark:bg-[#15211a]">
          <CardContent className="p-5 md:p-8">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-[#a7d1a7]">
                  Siklus Tanam
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {loading
                    ? 'Memuat data…'
                    : `${cycles.length} tanaman ditanam`}
                </p>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {loading ? (
                <>
                  <PlantCardSkeleton />
                  <PlantCardSkeleton />
                  <PlantCardSkeleton />
                </>
              ) : (
                pageItems.map((cycle) => {
                  const status = statusMeta(cycle.status)
                  return (
                    <Card
                      key={cycle.id}
                      className="group overflow-hidden border-0 p-0 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border dark:border-white/10 dark:bg-[#15211a]"
                    >
                      <PlantImage meta={cycle.meta} name={cycle.plantName} />
                      <CardContent className="space-y-3 px-4 pt-3 pb-4">
                        {/* Badge kategori — di bawah thumbnail, tidak menutupi gambar */}
                        <Badge className="gap-1 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-300">
                          <span>{cycle.meta.icon}</span>
                          {cycle.meta.category}
                        </Badge>

                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                            {cycle.plantName}
                          </h3>
                          <span
                            className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                          <MapPin className="h-3 w-3 shrink-0 text-green-600 dark:text-green-400" />
                          <span className="truncate">{cycle.fieldName}</span>
                          {cycle.phase && (
                            <>
                              <span className="text-gray-300 dark:text-gray-600">
                                •
                              </span>
                              <span className="truncate">{cycle.phase}</span>
                            </>
                          )}
                        </div>

                        {/* Progress pertumbuhan. Backend masih sering kirim
                            `progress = null` (tiket Cycle-NewCycle-ProgressPhase:
                            end_date belum keisi) — tetap render bar-nya (kosong)
                            biar konsisten, label jadi "Belum dihitung". */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                              <TrendingUp className="h-3 w-3" /> Progress
                            </span>
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              {cycle.progress !== null
                                ? `${cycle.progress}%`
                                : 'Belum dihitung'}
                            </span>
                          </div>
                          <Progress
                            value={cycle.progress ?? 0}
                            className="h-1.5 bg-gray-100 [&>div]:bg-green-600 dark:bg-white/10 dark:[&>div]:bg-green-500"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                          <CalendarDays className="h-3 w-3 shrink-0 text-sky-500" />
                          <span>Tanam {formatDate(cycle.startDate)}</span>
                          <span className="text-gray-300 dark:text-gray-600">
                            →
                          </span>
                          <span>
                            Panen {formatDate(cycle.estimatedHarvest)}
                          </span>
                        </div>

                        <Link
                          to="/dCycle-ii/$id"
                          params={{ id: String(cycle.id) }}
                          search={{ field_id: cycle.fieldId }}
                          className="block pt-1"
                        >
                          <Button
                            size="sm"
                            className="w-full rounded-full bg-green-600 text-xs text-white hover:bg-green-700"
                          >
                            Lihat
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )
                })
              )}

              {/* Mulai tanam baru → buka modal */}
              {!loading && (
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="block h-full w-full text-left"
                >
                  <Card className="group flex h-full min-h-[280px] cursor-pointer items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50/50 transition-colors hover:border-green-500 hover:bg-green-50/50 dark:border-white/15 dark:bg-white/5 dark:hover:border-green-500 dark:hover:bg-green-500/10">
                    <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 transition-transform group-hover:scale-110 dark:bg-green-500/15 dark:text-green-300">
                        <Plus className="h-8 w-8" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">
                        Mulai Tanam Baru
                      </h3>
                      <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                        Pilih jenis tanaman dari katalog & tanam di lahanmu
                      </p>
                    </CardContent>
                  </Card>
                </button>
              )}
            </div>

            {/* Pagination */}
            {!loading && filtered.length > 0 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                summary={`Menampilkan ${from}–${to} dari ${total} tanaman`}
              />
            )}

            {/* Empty state: belum ada siklus tanam sama sekali */}
            {!loading && cycles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500 dark:text-gray-400">
                <Sprout className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
                <p className="font-medium">
                  {isFiltered
                    ? 'Belum ada tanaman di lahan ini'
                    : 'Belum ada tanaman yang kamu tanam'}
                </p>
                <p className="text-sm">
                  Mulai siklus tanam baru lewat tombol di atas.
                </p>
              </div>
            )}

            {/* Empty state hasil pencarian */}
            {!loading && cycles.length > 0 && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500 dark:text-gray-400">
                <Sprout className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
                <p className="font-medium">Tanaman tidak ditemukan</p>
                <p className="text-sm">
                  Tidak ada tanaman dengan kata “{query}”.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Mulai Tanam Baru — saat mode filter, lahan otomatis terkunci */}
      <MulaiTanamModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        field={
          isFiltered && field_id != null
            ? { id: field_id, name: fieldName }
            : undefined
        }
        onCreated={() => setReloadKey((n) => n + 1)}
      />
    </div>
  )
}
