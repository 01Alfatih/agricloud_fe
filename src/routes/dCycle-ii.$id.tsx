import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  Droplet,
  Leaf,
  MapPin,
  Moon,
  Sprout,
  Sun,
  Thermometer,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

const API_BASE_URL = 'http://localhost:8005/api'

// Detail satu siklus tanam. `field_id` wajib karena backend belum punya
// `GET /api/cycles/{id}`; kita ambil `GET /api/cycles?field_id=` lalu cari by id.
export const Route = createFileRoute('/dCycle-ii/$id')({
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

/* ---------------------------------- tipe ---------------------------------- */

type Tone = 'success' | 'warning' | 'danger' | 'info'

const toneStyles: Record<Tone, string> = {
  success:
    'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/25',
  warning:
    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25',
  danger:
    'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/25',
  info: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/25',
}

// Bentuk satu fase dari riwayat (lihat tiket Dashboard-PhaseTimeline).
// Semua opsional supaya FE tahan saat backend belum kirim `phases[]`.
interface ICyclePhaseResponse {
  name?: string
  reached_at?: string | null
  status?: string // 'done' | 'active' | 'upcoming'
  order?: number
}

// Bentuk item dari `GET /api/cycles?field_id=` (lihat CycleResource backend).
interface ICycleResponse {
  id: number
  plant_name?: string
  field_id?: number
  start_date?: string
  status?: string
  phase?: string
  progress?: number
  estimated_harvest_date?: string
  description?: string // belum ada di backend; future-proof
  phases?: Array<ICyclePhaseResponse> // belum ada di backend; tiket Dashboard-PhaseTimeline
}

// Metadata template tanaman dari katalog (deskripsi + foto real).
interface ICropTemplate {
  id: number
  name: string
  description: string | null
  thumbnail: string | null
}

type PhaseStatus = 'done' | 'current' | 'upcoming'
interface IPhase {
  name: string
  date: string
  status: PhaseStatus
}

interface ICycleDetail {
  id: number
  plantName: string
  fieldName: string
  description: string
  image: string | null
  plantedAt: string
  phase: string
  progress: number | null
  estimatedHarvest: string
  phases: Array<IPhase>
}

/* --------------------------------- helpers -------------------------------- */

// "23/12/2024"
function formatDateFull(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// "04 Des"
function formatDateShort(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

function mapPhaseStatus(s?: string): PhaseStatus {
  if (s === 'done') return 'done'
  if (s === 'active' || s === 'current') return 'current'
  return 'upcoming'
}

// Susun timeline fase dari `phases[]` backend. Kalau backend belum kirim
// (tiket Dashboard-PhaseTimeline masih open), fallback: tampilkan fase terkini
// saja sebagai satu langkah aktif.
function buildPhases(
  raw: Array<ICyclePhaseResponse> | undefined,
  currentPhase?: string,
): Array<IPhase> {
  if (raw && raw.length) {
    return [...raw]
      .sort((a, b) => {
        if (a.order != null && b.order != null) return a.order - b.order
        const ta = a.reached_at ? new Date(a.reached_at).getTime() : Infinity
        const tb = b.reached_at ? new Date(b.reached_at).getTime() : Infinity
        return ta - tb
      })
      .map((p) => ({
        name: p.name || '—',
        date: formatDateShort(p.reached_at),
        status: mapPhaseStatus(p.status),
      }))
  }
  if (currentPhase) {
    return [{ name: currentPhase, date: '—', status: 'current' }]
  }
  return []
}

/* ----------------------- data dummy (belum ada endpoint) ------------------ */
// Kondisi tanaman & tabel nutrisi masih hardcoded — belum ada endpoint backend.

const conditions: {
  label: string
  value: string
  icon: ComponentType<{ className?: string }>
  tone: Tone
  hint: string
}[] = [
  {
    label: 'Kadar Air',
    value: 'Baik',
    icon: Droplet,
    tone: 'info',
    hint: 'Lembap optimal',
  },
  {
    label: 'Pencahayaan',
    value: '80%',
    icon: Sun,
    tone: 'warning',
    hint: 'Cukup terang',
  },
  {
    label: 'Kelembapan',
    value: 'Baik',
    icon: Thermometer,
    tone: 'success',
    hint: 'Stabil',
  },
]

const nutrients: {
  id: number
  name: string
  npk: string
  need: number
  capacity: number
  result: number
  dot: string
}[] = [
  {
    id: 1,
    name: 'Bio-Regulasi',
    npk: 'NPK 16-16-16',
    need: 200,
    capacity: 50,
    result: 150,
    dot: 'bg-blue-500',
  },
  {
    id: 2,
    name: 'Zat Pengatur',
    npk: 'NPK 16-16-16',
    need: 100,
    capacity: 50,
    result: 50,
    dot: 'bg-red-500',
  },
  {
    id: 3,
    name: 'Perlindungan Bagian Luar',
    npk: 'NPK 16-16-16',
    need: 200,
    capacity: 50,
    result: 150,
    dot: 'bg-green-500',
  },
  {
    id: 4,
    name: 'Perlindungan Bagian Awal',
    npk: 'NPK 16-16-16',
    need: 200,
    capacity: 50,
    result: 150,
    dot: 'bg-purple-500',
  },
  {
    id: 5,
    name: 'Perkembangan',
    npk: 'NPK 16-16-16',
    need: 200,
    capacity: 50,
    result: 150,
    dot: 'bg-yellow-500',
  },
]

/* -------------------------------- dark mode ------------------------------- */

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return true
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return true // default: dark
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return [dark, () => setDark((d) => !d)] as const
}

/* -------------------------------- skeleton -------------------------------- */

function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#e4f0e4] dark:bg-[#0c1410]">
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <div className="h-56 w-full animate-pulse rounded-2xl bg-white/70 dark:bg-[#15211a]" />
        <div className="h-40 w-full animate-pulse rounded-2xl bg-white/70 dark:bg-[#15211a]" />
        <div className="h-48 w-full animate-pulse rounded-2xl bg-white/70 dark:bg-[#15211a]" />
      </div>
    </div>
  )
}

/* -------------------------------- component ------------------------------- */

function RouteComponent() {
  const { id } = Route.useParams()
  const { field_id } = Route.useSearch()
  const [dark, toggleDark] = useDarkMode()

  const [crop, setCrop] = useState<ICycleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` }
    const cycleId = Number(id)

    const fetchData = async () => {
      setLoading(true)
      setNotFound(false)
      try {
        // 1. Siklus pada lahan (butuh field_id; backend belum punya detail by id).
        const cyclesRes = await axios.get<{ data: Array<ICycleResponse> }>(
          `${API_BASE_URL}/cycles`,
          {
            params: { field_id },
            headers,
            signal: controller.signal,
          },
        )
        const found = (cyclesRes.data.data ?? []).find((c) => c.id === cycleId)
        if (!found) {
          setNotFound(true)
          setCrop(null)
          return
        }

        // 2. Nama lahan (badge) — best-effort, tahan error.
        let fieldName = 'Lahan'
        try {
          const fieldsRes = await axios.get<{
            data: Array<{ id: number; name: string }>
          }>(`${API_BASE_URL}/myfields`, { headers, signal: controller.signal })
          const fid = found.field_id ?? field_id
          fieldName =
            fieldsRes.data.data?.find((f) => f.id === fid)?.name ?? fieldName
        } catch {
          // biarkan default
        }

        // 3. Deskripsi + foto real dari katalog (match nama tanaman) — best-effort.
        let description = found.description ?? ''
        let image: string | null = null
        try {
          const tplRes = await axios.get<{ data: Array<ICropTemplate> }>(
            `${API_BASE_URL}/crop-templates`,
            { signal: controller.signal },
          )
          const name = (found.plant_name ?? '').toLowerCase()
          const tpl = tplRes.data.data?.find(
            (t) => t.name.toLowerCase() === name,
          )
          description = description || tpl?.description || ''
          image = tpl?.thumbnail ?? null
        } catch {
          // biarkan default
        }

        setCrop({
          id: found.id,
          plantName: found.plant_name || 'Tanaman',
          fieldName,
          description: description || 'Belum ada deskripsi untuk tanaman ini.',
          image,
          plantedAt: formatDateFull(found.start_date),
          phase: found.phase || 'Berjalan',
          progress: typeof found.progress === 'number' ? found.progress : null,
          estimatedHarvest: formatDateFull(found.estimated_harvest_date),
          phases: buildPhases(found.phases, found.phase),
        })
      } catch (error) {
        if (axios.isCancel(error)) return
        console.error('Gagal memuat detail siklus:', error)
        setNotFound(true)
        setCrop(null)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    fetchData()
    return () => controller.abort()
  }, [id, field_id])

  if (loading) return <DetailSkeleton />

  if (notFound || !crop) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#e4f0e4] px-6 text-center dark:bg-[#0c1410]">
        <Sprout className="h-14 w-14 text-gray-300 dark:text-gray-600" />
        <div>
          <p className="text-lg font-semibold text-[#1a472a] dark:text-[#a7d1a7]">
            Siklus tidak ditemukan
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Data siklus tanam ini tidak tersedia.
          </p>
        </div>
        <Link to="/cycle-ii">
          <Button className="gap-2 rounded-full bg-[#0B4619] text-white hover:bg-[#2a7039] dark:bg-[#5cbb70] dark:text-[#0c1410]">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Tanaman
          </Button>
        </Link>
      </div>
    )
  }

  // Posisi fase aktif untuk badge "Fase ke-N dari M".
  const currentIndex = crop.phases.findIndex((p) => p.status === 'current')
  const stepNo =
    currentIndex >= 0
      ? currentIndex + 1
      : crop.phases.filter((p) => p.status === 'done').length
  // Riwayat fase belum lengkap kalau backend cuma kasih satu fase terkini.
  const phaseHistoryReady = crop.phases.length > 1

  const backLink =
    field_id != null
      ? { to: '/cycle-ii' as const, search: { field_id } }
      : { to: '/cycle-ii' as const, search: {} }

  return (
    <div className="min-h-screen bg-[#e4f0e4] transition-colors dark:bg-[#0c1410]">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header: breadcrumb + toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            {...backLink}
            aria-label="Kembali ke daftar tanaman"
            className="order-1 ml-16 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#a7d1a7]/40 text-[#1a472a] transition-colors hover:bg-[#a7d1a7]/70 md:ml-0 dark:bg-white/10 dark:text-[#a7d1a7] dark:hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="order-2 flex min-w-0 flex-1 items-center gap-1.5 text-sm">
            <span className="rounded-md bg-[#a7d1a7] px-2.5 py-1 font-medium text-[#1a472a] dark:bg-[#1b2c22] dark:text-[#a7d1a7]">
              Dashboard
            </span>
            <ChevronRight className="h-4 w-4 text-[#1a472a]/40 dark:text-[#a7d1a7]/40" />
            <span className="rounded-md bg-[#0B4619] px-2.5 py-1 font-medium text-white dark:bg-[#5cbb70] dark:text-[#0c1410]">
              Tanaman
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDark}
            aria-label="Ganti mode terang/gelap"
            className="order-3 shrink-0 text-[#1a472a] hover:bg-[#a7d1a7]/40 dark:text-[#a7d1a7] dark:hover:bg-white/10"
          >
            {dark ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
          </Button>
        </div>

        {/* Hero: info tanaman */}
        <Card className="overflow-hidden rounded-2xl border-none bg-white shadow-md dark:bg-[#15211a] dark:ring-1 dark:ring-white/10">
          <CardContent className="flex flex-col gap-6 p-5 sm:p-6 md:flex-row">
            <div className="md:w-1/4">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 dark:ring-1 dark:ring-white/10">
                {crop.image ? (
                  <img
                    src={crop.image}
                    alt={crop.plantName}
                    className="h-full w-full object-cover transition-[filter] dark:brightness-90 dark:saturate-[.85]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Sprout className="h-16 w-16 text-white/80" />
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 hidden dark:block dark:bg-[#0c1410]/15" />
                <Badge className="absolute left-2 top-2 border-none bg-black/40 text-white backdrop-blur">
                  <Sprout className="mr-1 h-3.5 w-3.5" /> {crop.phase}
                </Badge>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl font-bold text-[#1a472a] dark:text-[#a7d1a7]">
                  {crop.plantName}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e4f0e4] px-2.5 py-1 text-xs font-medium text-[#1a472a] dark:bg-[#1b2c22] dark:text-[#a7d1a7]">
                  <MapPin className="h-3.5 w-3.5" /> {crop.fieldName}
                </span>
              </div>

              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {crop.description}
              </p>

              <div className="space-y-2 rounded-xl bg-[#f3f8f3] p-4 dark:bg-[#1b2c22]">
                <div className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <CalendarDays className="h-4 w-4" /> Penanaman
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    Progress
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1a472a] dark:text-gray-100">
                    {crop.plantedAt}
                  </span>
                  <span className="font-semibold text-[#2a7039] dark:text-[#5cbb70]">
                    {crop.progress !== null
                      ? `${crop.progress}%`
                      : 'Belum dihitung'}
                  </span>
                </div>
                <Progress
                  value={crop.progress ?? 0}
                  className="h-2.5 bg-gray-200 dark:bg-white/10 [&>div]:bg-[#2a7039] dark:[&>div]:bg-[#5cbb70]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fase Tanam */}
        <Card className="rounded-2xl bg-white shadow-sm dark:bg-[#15211a] dark:border-white/10">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-base font-bold text-[#1a472a] dark:text-[#a7d1a7]">
                <Sprout className="h-5 w-5" /> Fase Tanam
              </h2>
              {crop.phases.length > 0 && (
                <Badge className={cn(toneStyles.warning)}>
                  Fase ke-{stepNo} dari {crop.phases.length}
                </Badge>
              )}
            </div>

            {crop.phases.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Belum ada data fase untuk siklus ini.
              </p>
            ) : (
              <>
                <div className="flex min-w-max gap-0 overflow-x-auto pb-1 sm:min-w-0">
                  {crop.phases.map((p, i) => {
                    const leftFilled = i <= currentIndex
                    const rightFilled = i < currentIndex
                    return (
                      <div
                        key={`${p.name}-${i}`}
                        className="flex w-24 flex-col items-center sm:w-auto sm:flex-1"
                      >
                        {/* dot + connector line */}
                        <div className="flex w-full items-center">
                          <div
                            className={cn(
                              'h-0.5 flex-1',
                              i === 0
                                ? 'opacity-0'
                                : leftFilled
                                  ? 'bg-[#2a7039] dark:bg-[#5cbb70]'
                                  : 'bg-gray-200 dark:bg-white/10',
                            )}
                          />
                          <div
                            className={cn(
                              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                              p.status === 'done' &&
                                'bg-[#2a7039] text-white dark:bg-[#5cbb70] dark:text-[#0c1410]',
                              p.status === 'current' &&
                                'bg-[#0B4619] text-white ring-4 ring-[#2a7039]/20 dark:bg-[#5cbb70] dark:text-[#0c1410] dark:ring-[#5cbb70]/25',
                              p.status === 'upcoming' &&
                                'border-2 border-gray-300 bg-white dark:border-white/20 dark:bg-[#15211a]',
                            )}
                          >
                            {p.status === 'done' ? (
                              <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            ) : p.status === 'current' ? (
                              <span className="h-2 w-2 rounded-full bg-white dark:bg-[#0c1410]" />
                            ) : (
                              <span className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-white/20" />
                            )}
                          </div>
                          <div
                            className={cn(
                              'h-0.5 flex-1',
                              i === crop.phases.length - 1
                                ? 'opacity-0'
                                : rightFilled
                                  ? 'bg-[#2a7039] dark:bg-[#5cbb70]'
                                  : 'bg-gray-200 dark:bg-white/10',
                            )}
                          />
                        </div>
                        {/* label */}
                        <p
                          className={cn(
                            'mt-2 px-1 text-center text-xs leading-tight',
                            p.status === 'current'
                              ? 'font-semibold text-[#1a472a] dark:text-[#a7d1a7]'
                              : p.status === 'done'
                                ? 'font-medium text-gray-700 dark:text-gray-300'
                                : 'text-gray-400 dark:text-gray-500',
                          )}
                        >
                          {p.name}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                          {p.date}
                        </p>
                      </div>
                    )
                  })}
                </div>
                {!phaseHistoryReady && (
                  <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
                    Menampilkan fase terkini — riwayat fase lengkap menyusul.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Kondisi Tanaman — NOTE: masih dummy, belum ada endpoint backend. */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[#1a472a] dark:text-[#a7d1a7]">
            <Leaf className="h-5 w-5" /> Kondisi Tanaman
          </h2>

          {/* stat cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {conditions.map((c) => (
              <Card
                key={c.label}
                className="rounded-xl bg-white shadow-sm dark:bg-[#15211a] dark:border-white/10"
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div
                    className={cn(
                      'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border',
                      toneStyles[c.tone],
                    )}
                  >
                    <c.icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {c.label}
                    </p>
                    <p className="text-lg font-semibold text-[#1a472a] leading-tight dark:text-gray-100">
                      {c.value}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">
                      {c.hint}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabel nutrisi */}
          <Card className="rounded-xl bg-white shadow-sm dark:bg-[#15211a] dark:border-white/10">
            <CardContent className="p-4 sm:p-5">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-white/10">
                      <TableHead className="text-xs text-gray-500 dark:text-gray-400">
                        Jenis Nutrisi
                      </TableHead>
                      <TableHead className="text-xs text-gray-500 dark:text-gray-400">
                        Kebutuhan
                      </TableHead>
                      <TableHead className="text-xs text-gray-500 dark:text-gray-400">
                        Kapasitas
                      </TableHead>
                      <TableHead className="text-xs text-gray-500 dark:text-gray-400">
                        Hasil Akhir
                      </TableHead>
                      <TableHead className="w-32 text-xs text-gray-500 dark:text-gray-400">
                        Pemenuhan
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nutrients.map((n) => {
                      const pct = Math.round((n.result / n.need) * 100)
                      const barTone =
                        pct >= 75
                          ? 'bg-green-500'
                          : pct >= 50
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                      return (
                        <TableRow
                          key={n.id}
                          className="dark:border-white/10 dark:hover:bg-white/5"
                        >
                          <TableCell className="py-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'h-2.5 w-2.5 shrink-0 rounded-full',
                                  n.dot,
                                )}
                              />
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                {n.name}
                              </span>
                            </div>
                            <div className="ml-4.5 text-xs text-gray-400 dark:text-gray-500">
                              {n.npk}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                            {n.need} Kg
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                            {n.capacity} Kg
                          </TableCell>
                          <TableCell className="text-sm font-medium text-gray-800 dark:text-gray-100">
                            {n.result} Kg
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                                <div
                                  className={cn('h-full rounded-full', barTone)}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 tabular-nums dark:text-gray-400">
                                {pct}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
