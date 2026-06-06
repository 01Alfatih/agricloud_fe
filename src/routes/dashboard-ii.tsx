import { Link, createFileRoute } from '@tanstack/react-router'
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Cloud,
  CloudRain,
  Droplets,
  Layers,
  MapPin,
  Moon,
  Scissors,
  Search,
  Sprout,
  Sun,
  TrendingUp,
  Warehouse,
  Wind,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ComponentType } from 'react'
import type { IWarehouse, IWarehouseResponse } from '@/lib/warehouse'
import { useDarkMode, usePreferences } from '@/lib/preferences'
import { useWeather } from '@/hooks/useWeather'
import { describeWeather } from '@/components/WeatherCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { formatArea } from '@/lib/format'
import {
  capacityTone,
  localityLabel,
  mapWarehouse,
  usagePercent,
} from '@/lib/warehouse'

export const Route = createFileRoute('/dashboard-ii')({
  component: RouteComponent,
})

/* ------------------------------- tipe & tone ------------------------------ */

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

const dotStyles: Record<Tone, string> = {
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-sky-500',
}

const barStyles: Record<Tone, string> = {
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-sky-500',
}

/* --------------------------- bentuk respons API --------------------------- */

interface IActiveCycle {
  plant_name?: string | null
  phase?: string | null
  progress?: number | null
}

interface IFieldResponse {
  id: number
  name: string
  area: string
  active_cycle?: IActiveCycle | null
}

interface ICycleResponse {
  id: number
  plant_name?: string
  field_id?: number
  start_date?: string
  status?: string
  phase?: string
  progress?: number
  estimated_harvest_date?: string
}

/* ------------------------------- data hook -------------------------------- */

// Siklus yang sudah ditandai lahannya (untuk Fase Tanam & hitung tanaman aktif).
interface ICycle extends ICycleResponse {
  field_id: number
  field_name: string
}

interface IDashboardData {
  loading: boolean
  userName: string
  fields: Array<IFieldResponse>
  warehouses: Array<IWarehouse>
  cycles: Array<ICycle>
}

// Tarik semua sumber data dashboard sekali jalan: profil, lahan, gudang, siklus.
// Siklus diambil per lahan (backend belum punya `GET /cycles` global) — sama
// seperti pola di cycle-ii.
function useDashboardData(): IDashboardData {
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [fields, setFields] = useState<Array<IFieldResponse>>([])
  const [warehouses, setWarehouses] = useState<Array<IWarehouse>>([])
  const [cycles, setCycles] = useState<Array<ICycle>>([])

  useEffect(() => {
    const controller = new AbortController()

    const isAborted = () => controller.signal.aborted

    const run = async () => {
      setLoading(true)
      const opts = { signal: controller.signal }

      // Profil, lahan, gudang paralel — masing-masing tahan gagal sendiri.
      const [fieldsRes, whRes, userRes] = await Promise.allSettled([
        api.get<{ data?: Array<IFieldResponse> }>('/myfields', opts),
        api.get<{ data?: Array<IWarehouseResponse> }>('/warehouses', opts),
        api.get<{ data?: { name?: string } }>('/auth/user', opts),
      ])

      if (isAborted()) return

      const fieldList =
        fieldsRes.status === 'fulfilled'
          ? (fieldsRes.value.data.data ?? [])
          : []
      setFields(fieldList)
      setWarehouses(
        whRes.status === 'fulfilled'
          ? (whRes.value.data.data ?? []).map(mapWarehouse)
          : [],
      )
      if (userRes.status === 'fulfilled') {
        setUserName(userRes.value.data.data?.name ?? '')
      }

      // Siklus per lahan → diratakan jadi satu daftar.
      const nameById = new Map(fieldList.map((f) => [f.id, f.name]))
      const perField = await Promise.all(
        fieldList.map((f) =>
          api
            .get<{ data?: Array<ICycleResponse> }>('/cycles', {
              params: { field_id: f.id },
              ...opts,
            })
            .then((r) =>
              (r.data.data ?? []).map<ICycle>((c) => ({
                ...c,
                field_id: c.field_id ?? f.id,
                field_name: nameById.get(c.field_id ?? f.id) ?? f.name,
              })),
            )
            .catch(() => [] as Array<ICycle>),
        ),
      )

      if (isAborted()) return
      setCycles(perField.flat())
      setLoading(false)
    }

    run().catch((err) => {
      if (!controller.signal.aborted) {
        console.error('Gagal memuat dashboard:', err)
        setLoading(false)
      }
    })

    return () => controller.abort()
  }, [])

  return { loading, userName, fields, warehouses, cycles }
}

/* -------------------------------- helpers --------------------------------- */

function greetingForNow(): string {
  const h = new Date().getHours()
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 18) return 'Selamat sore'
  return 'Selamat malam'
}

const todayLabel = new Date().toLocaleDateString('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function formatShortDate(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

// Status lahan diturunkan dari siklus aktif (field.active_cycle).
function landStatus(c?: IActiveCycle | null): { label: string; tone: Tone } {
  if (!c?.plant_name) return { label: 'Belum tanam', tone: 'warning' }
  if (typeof c.progress === 'number' && c.progress >= 90)
    return { label: 'Siap panen', tone: 'info' }
  return { label: c.phase || 'Sehat', tone: 'success' }
}

// Nama hari singkat dari tanggal ISO; index 0 = "Hari ini".
function dayLabel(iso: string, index: number): string {
  if (index === 0) return 'Hari ini'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('id-ID', { weekday: 'short' })
}

/* ------------------------------ Cuaca (real) ------------------------------ */

// Kartu cuaca dashboard — pakai koordinat lokasi dari Pengaturan (kecamatan).
// Tanpa lokasi → ajak user mengaturnya. Desain hero hijau dipertahankan.
function DashboardWeather() {
  const { preferences } = usePreferences()
  const loc = preferences.location
  const { data, loading, error } = useWeather(
    loc?.lat ?? null,
    loc?.lng ?? null,
  )

  const shell =
    'overflow-hidden rounded-xl border-none bg-gradient-to-br from-[#2a7039] to-[#0B4619] text-white shadow-md dark:border dark:border-white/10 dark:from-[#1d3327] dark:to-[#13201a]'

  // Belum set lokasi → CTA ke Pengaturan.
  if (!loc) {
    return (
      <Card className={shell}>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <MapPin className="h-9 w-9 text-amber-200" />
          <div>
            <p className="font-semibold">Lokasi belum diatur</p>
            <p className="mt-1 text-sm text-white/80">
              Atur wilayah sampai kecamatan untuk melihat cuaca lahanmu.
            </p>
          </div>
          <Link
            to="/settings-ii"
            className="mt-1 rounded-lg bg-white/15 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/25"
          >
            Atur Lokasi
          </Link>
        </CardContent>
      </Card>
    )
  }

  const now = data ? describeWeather(data.current.code) : null
  const NowIcon = now?.icon ?? Cloud

  return (
    <Card className={shell}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-sm text-white/80">
              <MapPin className="h-4 w-4" /> {loc.label}
            </div>
            {loading ? (
              <div className="mt-2 h-12 w-40 animate-pulse rounded-lg bg-white/15" />
            ) : error || !data ? (
              <p className="mt-3 text-sm text-white/80">
                Cuaca tidak tersedia saat ini.
              </p>
            ) : (
              <div className="mt-2 flex items-center gap-3">
                <NowIcon className="h-12 w-12 text-amber-300" />
                <div>
                  <p className="text-4xl font-semibold leading-none">
                    {Math.round(data.current.temp)}°C
                  </p>
                  <p className="text-sm text-white/80">{now?.label}</p>
                </div>
              </div>
            )}
          </div>
          {data && !loading && !error && (
            <div className="space-y-1.5 text-sm text-white/85">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4" /> Lembap {data.current.humidity}%
              </div>
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4" /> Angin{' '}
                {Math.round(data.current.windSpeed)} km/j
              </div>
              <div className="flex items-center gap-2">
                <CloudRain className="h-4 w-4" /> Hujan{' '}
                {data.daily[0]?.rainProb}%
              </div>
            </div>
          )}
        </div>

        {data && !loading && !error && (
          <div className="mt-4 grid grid-cols-5 gap-2 border-t border-white/15 pt-3 dark:border-white/10">
            {data.daily.map((d, i) => {
              const desc = describeWeather(d.code)
              const DayIcon = desc.icon
              return (
                <div
                  key={d.date}
                  className="flex flex-col items-center gap-1 text-center"
                >
                  <span className="text-[11px] text-white/70">
                    {dayLabel(d.date, i)}
                  </span>
                  <DayIcon className="h-5 w-5 text-amber-200" />
                  <span className="text-sm font-medium">
                    {Math.round(d.tempMax)}°
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* -------------------------------- component ------------------------------- */

function RouteComponent() {
  const [dark, toggleDark] = useDarkMode()
  const { loading, userName, fields, warehouses, cycles } = useDashboardData()
  const [query, setQuery] = useState('')

  /* --- Fase Tanam: kelompokkan siklus per lahan (dukung tumpang sari) --- */
  type Crop = {
    id: number
    plant: string
    current: string
    progress: number | null
    startDate: string
    harvest: string
  }
  type FieldPlot = { id: number; land: string; crops: Array<Crop> }

  const fieldPlots: Array<FieldPlot> = useMemo(() => {
    const byField = new Map<number, FieldPlot>()
    for (const c of cycles) {
      if (!byField.has(c.field_id)) {
        byField.set(c.field_id, {
          id: c.field_id,
          land: c.field_name,
          crops: [],
        })
      }
      byField.get(c.field_id)!.crops.push({
        id: c.id,
        plant: c.plant_name || 'Tanaman',
        current: c.phase || 'Berjalan',
        progress: typeof c.progress === 'number' ? c.progress : null,
        startDate: c.start_date || '',
        harvest: c.estimated_harvest_date || '',
      })
    }
    return [...byField.values()].filter((p) => p.crops.length > 0)
  }, [cycles])

  const [activeLandId, setActiveLandId] = useState<number | null>(null)
  const [activeCropId, setActiveCropId] = useState<number | null>(null)

  // Eksplisit `| undefined`: array bisa kosong (data belum / habis difilter),
  // sementara tsconfig tak pakai noUncheckedIndexedAccess.
  const activeField: FieldPlot | undefined =
    fieldPlots.find((f) => f.id === activeLandId) ?? fieldPlots.at(0)
  const activeCrop: Crop | undefined =
    activeField?.crops.find((c) => c.id === activeCropId) ??
    activeField?.crops.at(0)

  const selectLand = (field: FieldPlot) => {
    setActiveLandId(field.id)
    setActiveCropId(field.crops[0].id)
  }

  /* --- Tindakan: diturunkan dari sinyal nyata (gudang/lahan/siklus) --- */
  const alerts = useMemo(() => {
    const out: Array<{
      id: string
      title: string
      sub: string
      icon: ComponentType<{ className?: string }>
      tone: Tone
      badge: string
    }> = []

    // Gudang hampir penuh → perlu distribusi.
    for (const w of warehouses) {
      const usage = usagePercent(w.items, w.capacity)
      if (usage >= 80) {
        out.push({
          id: `w-${w.id}`,
          title: 'Distribusi hasil panen',
          sub: `${w.name} • ${usage}% terisi`,
          icon: Warehouse,
          tone: 'danger',
          badge: 'Gudang penuh',
        })
      }
    }

    // Siklus aktif yang hampir matang → siap panen.
    for (const f of fields) {
      const c = f.active_cycle
      if (c?.plant_name && typeof c.progress === 'number' && c.progress >= 90) {
        out.push({
          id: `h-${f.id}`,
          title: 'Perkiraan panen',
          sub: `${f.name} • ${c.plant_name}`,
          icon: Scissors,
          tone: 'success',
          badge: 'Siap panen',
        })
      }
    }

    // Lahan tanpa siklus aktif → ajakan mulai tanam.
    for (const f of fields) {
      if (!f.active_cycle?.plant_name) {
        out.push({
          id: `e-${f.id}`,
          title: 'Lahan belum ditanami',
          sub: f.name,
          icon: Sprout,
          tone: 'info',
          badge: 'Lahan kosong',
        })
      }
    }

    return out
  }, [warehouses, fields])

  /* --- KPI dari data nyata --- */
  const totalAreaM2 = fields.reduce((sum, f) => sum + (Number(f.area) || 0), 0)
  const activePlants = cycles.filter(
    (c) => !c.status || c.status === 'active',
  ).length

  const kpis: Array<{
    label: string
    value: string
    hint: string
    icon: ComponentType<{ className?: string }>
    tone: Tone
  }> = [
    {
      label: 'Total Lahan',
      value: loading ? '—' : String(fields.length),
      hint: 'lahan terdaftar',
      icon: Layers,
      tone: 'info',
    },
    {
      label: 'Luas Total',
      value: loading ? '—' : formatArea(totalAreaM2),
      hint: 'tertanam',
      icon: MapPin,
      tone: 'success',
    },
    {
      label: 'Tanaman Aktif',
      value: loading ? '—' : String(activePlants),
      hint: 'siklus berjalan',
      icon: Sprout,
      tone: 'success',
    },
    {
      label: 'Perlu Perhatian',
      value: loading ? '—' : String(alerts.length),
      hint: 'butuh tindakan',
      icon: AlertTriangle,
      tone: alerts.length > 0 ? 'warning' : 'success',
    },
  ]

  /* --- Filter pencarian untuk tabel Lahan & Gudang --- */
  const q = query.trim().toLowerCase()
  const filteredFields = fields.filter(
    (f) =>
      !q ||
      f.name.toLowerCase().includes(q) ||
      (f.active_cycle?.plant_name ?? '').toLowerCase().includes(q),
  )
  const filteredWarehouses = warehouses.filter(
    (w) =>
      !q ||
      w.name.toLowerCase().includes(q) ||
      w.address.toLowerCase().includes(q),
  )

  const fullestWarehouse = warehouses
    .map((w) => ({ w, usage: usagePercent(w.items, w.capacity) }))
    .filter((x) => x.usage >= 80)
    .sort((a, b) => b.usage - a.usage)
    .at(0)

  return (
    <div className="min-h-screen bg-[#e4f0e4] transition-colors dark:bg-[#0c1410]">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="order-1 min-w-0 flex-1 pl-16 md:pl-0">
            <h1 className="text-lg sm:text-xl font-semibold text-[#1a472a] truncate dark:text-[#a7d1a7]">
              {greetingForNow()}
              {userName ? `, ${userName}` : ''} 👋
            </h1>
            <p className="text-xs sm:text-sm text-[#1a472a]/60 dark:text-[#a7d1a7]/60">
              {todayLabel} · Ringkasan kebun Anda hari ini
            </p>
          </div>
          <div className="relative order-3 w-full md:order-2 md:w-56 lg:w-72">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari lahan / tanaman..."
              className="w-full pl-4 pr-10 py-2 rounded-full bg-[#a7d1a7] text-[#1a472a] placeholder:text-[#1a472a]/70 border-none focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-[#1f3329] dark:text-[#a7d1a7] dark:placeholder:text-[#a7d1a7]/50"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#1a472a] dark:text-[#a7d1a7]" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDark}
            aria-label="Ganti mode terang/gelap"
            className="order-2 shrink-0 text-[#1a472a] hover:bg-[#a7d1a7]/40 md:order-3 dark:text-[#a7d1a7] dark:hover:bg-white/10"
          >
            {dark ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
          </Button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {kpis.map((kpi) => (
            <Card
              key={kpi.label}
              className="bg-white rounded-xl shadow-sm dark:bg-[#15211a] dark:border-white/10"
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
                    toneStyles[kpi.tone],
                  )}
                >
                  <kpi.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 truncate dark:text-gray-400">
                    {kpi.label}
                  </p>
                  <p className="text-xl font-semibold text-[#1a472a] leading-tight dark:text-[#a7d1a7]">
                    {kpi.value}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate dark:text-gray-500">
                    {kpi.hint}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Cuaca + Tindakan + Fase Tanam */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Kolom kiri: cuaca + tindakan */}
          <div className="lg:col-span-2 space-y-4">
            {/* Cuaca (real, per-lokasi dari Pengaturan) */}
            <DashboardWeather />

            {/* Tindakan hari ini — diturunkan dari kondisi nyata gudang/lahan */}
            <Card className="rounded-xl bg-white shadow-sm dark:bg-[#15211a] dark:border-white/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold text-[#1a472a] dark:text-[#a7d1a7]">
                  Perlu Tindakan
                </CardTitle>
                <Badge className="border-amber-200 bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25">
                  {alerts.length} hal
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {loading ? (
                  <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-14 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-white/5"
                      />
                    ))}
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4 text-sm text-green-700 dark:bg-green-500/10 dark:text-green-300">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    Semua aman — tidak ada yang perlu tindakan saat ini.
                  </div>
                ) : (
                  alerts.slice(0, 6).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5"
                    >
                      <div
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                          toneStyles[task.tone],
                        )}
                      >
                        <task.icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                          {task.title}
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {task.sub}
                        </p>
                      </div>
                      <Badge className={cn('shrink-0', toneStyles[task.tone])}>
                        {task.badge}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Kolom kanan: fase tanam (real dari siklus) */}
          <Card className="rounded-xl bg-white shadow-sm dark:bg-[#15211a] dark:border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#1a472a] dark:text-[#a7d1a7]">
                <CalendarDays className="h-4 w-4" /> Fase Tanam
              </CardTitle>

              {!loading && fieldPlots.length > 0 && (
                <>
                  {/* 1) Pilih lahan */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {fieldPlots.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => selectLand(f)}
                        className={cn(
                          'flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors',
                          f.id === (activeField?.id ?? -1)
                            ? 'border-transparent bg-[#0B4619] text-white dark:bg-[#5cbb70] dark:text-[#0c1410]'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-white/15 dark:text-gray-300 dark:hover:bg-white/5',
                        )}
                      >
                        {f.land}
                        {f.crops.length > 1 && (
                          <span
                            className={cn(
                              'rounded-full px-1 text-[10px] leading-tight',
                              f.id === (activeField?.id ?? -1)
                                ? 'bg-white/20 dark:bg-black/20'
                                : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400',
                            )}
                          >
                            {f.crops.length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* 2) Pilih tanaman — hanya bila lahan punya >1 (tumpang sari) */}
                  {activeField && activeField.crops.length > 1 && (
                    <div className="mt-2">
                      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-[#1a472a]/60 dark:text-[#a7d1a7]/60">
                        <Sprout className="h-3.5 w-3.5" />
                        Tumpang sari · {activeField.crops.length} tanaman aktif
                      </div>
                      <div className="inline-flex flex-wrap rounded-lg bg-gray-100 p-0.5 dark:bg-white/10">
                        {activeField.crops.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setActiveCropId(c.id)}
                            className={cn(
                              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                              c.id === (activeCrop?.id ?? -1)
                                ? 'bg-white text-[#0B4619] shadow-sm dark:bg-[#1b2c22] dark:text-[#5cbb70]'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                            )}
                          >
                            {c.plant}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Konteks siklus aktif: tanaman + fase aktif */}
                  {activeCrop && (
                    <div className="mt-2 rounded-lg bg-[#e4f0e4] px-3 py-2 dark:bg-[#1b2c22]">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#1a472a] dark:text-[#a7d1a7]">
                        <Sprout className="h-4 w-4" /> {activeCrop.plant}
                      </div>
                      <div className="mt-1">
                        <Badge className="border-green-200 bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/25">
                          {activeCrop.current}
                        </Badge>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-6 w-full animate-pulse rounded bg-gray-100 dark:bg-white/5"
                    />
                  ))}
                </div>
              ) : !activeCrop ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500 dark:text-gray-400">
                  <Sprout className="mb-2 h-10 w-10 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm font-medium">Belum ada siklus tanam</p>
                  <Link
                    to="/cycle-ii"
                    className="mt-2 text-xs font-medium text-[#2a7039] hover:underline dark:text-[#5cbb70]"
                  >
                    Mulai tanam →
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Fase terkini sebagai satu langkah aktif (riwayat menyusul) */}
                  <div className="flex">
                    <div className="relative mr-3">
                      <div
                        className={cn(
                          'relative z-10 flex h-6 w-6 items-center justify-center rounded-full',
                          dotStyles.success,
                        )}
                      >
                        <div className="h-2.5 w-2.5 rounded-full bg-white" />
                      </div>
                    </div>
                    <div className="-mt-0.5">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                        {activeCrop.current}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Tanam {formatShortDate(activeCrop.startDate)}
                      </p>
                    </div>
                  </div>

                  {/* Progress siklus (real) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <TrendingUp className="h-3.5 w-3.5" /> Progress
                      </span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {activeCrop.progress !== null
                          ? `${activeCrop.progress}%`
                          : 'Belum dihitung'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-green-600 dark:bg-green-500"
                        style={{ width: `${activeCrop.progress ?? 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Perkiraan panen */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0 text-sky-500" />
                    Perkiraan panen {formatShortDate(activeCrop.harvest)}
                  </div>

                  <Link
                    to="/dCycle-ii/$id"
                    params={{ id: String(activeCrop.id) }}
                    search={{ field_id: activeField?.id }}
                    className="block"
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-full text-xs text-[#2a7039] dark:text-[#5cbb70]"
                    >
                      Lihat detail siklus →
                    </Button>
                  </Link>

                  <p className="text-center text-[11px] text-gray-400 dark:text-gray-500">
                    Menampilkan fase terkini — riwayat fase lengkap menyusul.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lahan + Gudang */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Lahan */}
          <Card className="rounded-xl bg-white shadow-sm dark:bg-[#15211a] dark:border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#1a472a] dark:text-[#a7d1a7]">
                <Layers className="h-4 w-4" /> Lahan
              </CardTitle>
              <Link to="/field-ii">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-[#2a7039] dark:text-[#5cbb70]"
                >
                  Lihat semua
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {!loading && filteredFields.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  {fields.length === 0
                    ? 'Belum ada lahan terdaftar.'
                    : 'Lahan tidak ditemukan.'}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-white/10">
                      <TableHead className="text-xs text-gray-500 dark:text-gray-400">
                        Nama
                      </TableHead>
                      <TableHead className="text-xs text-gray-500 dark:text-gray-400">
                        Tanaman
                      </TableHead>
                      <TableHead className="text-xs text-gray-500 dark:text-gray-400">
                        Luas
                      </TableHead>
                      <TableHead className="text-xs text-gray-500 dark:text-gray-400">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading
                      ? [0, 1, 2].map((i) => (
                          <TableRow key={i} className="dark:border-white/10">
                            <TableCell colSpan={4}>
                              <div className="h-5 w-full animate-pulse rounded bg-gray-100 dark:bg-white/5" />
                            </TableCell>
                          </TableRow>
                        ))
                      : filteredFields.map((land) => {
                          const status = landStatus(land.active_cycle)
                          return (
                            <TableRow
                              key={land.id}
                              className="dark:border-white/10 dark:hover:bg-white/5"
                            >
                              <TableCell className="text-sm font-medium dark:text-gray-100">
                                {land.name}
                              </TableCell>
                              <TableCell className="text-sm dark:text-gray-300">
                                {land.active_cycle?.plant_name ?? '—'}
                              </TableCell>
                              <TableCell className="text-sm dark:text-gray-300">
                                {formatArea(land.area)}
                              </TableCell>
                              <TableCell>
                                <Badge className={cn(toneStyles[status.tone])}>
                                  {status.label}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Gudang */}
          <Card className="rounded-xl bg-white shadow-sm dark:bg-[#15211a] dark:border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#1a472a] dark:text-[#a7d1a7]">
                <Warehouse className="h-4 w-4" /> Gudang
              </CardTitle>
              <Link to="/warehouse-ii">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-[#2a7039] dark:text-[#5cbb70]"
                >
                  Lihat semua
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {loading ? (
                [0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-full animate-pulse rounded bg-gray-100 dark:bg-white/5"
                  />
                ))
              ) : filteredWarehouses.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  {warehouses.length === 0
                    ? 'Belum ada gudang terdaftar.'
                    : 'Gudang tidak ditemukan.'}
                </p>
              ) : (
                <>
                  {filteredWarehouses.map((w) => {
                    const usage = usagePercent(w.items, w.capacity)
                    const { tone } = capacityTone(usage)
                    return (
                      <div key={w.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-800 dark:text-gray-100">
                              {w.name}
                            </p>
                            {w.address && (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">
                                  {localityLabel(w.address)}
                                </span>
                              </span>
                            )}
                          </div>
                          <span
                            className={cn(
                              'shrink-0 text-xs font-medium',
                              tone === 'danger'
                                ? 'text-red-600 dark:text-red-400'
                                : tone === 'warning'
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-green-600 dark:text-green-400',
                            )}
                          >
                            {usage}% terpakai
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              barStyles[tone],
                            )}
                            style={{ width: `${usage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                  {fullestWarehouse && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-300">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      {fullestWarehouse.w.name} hampir penuh — pertimbangkan
                      distribusi hasil panen.
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer ringkas */}
        <div className="flex flex-wrap items-center gap-2 pb-2 text-xs text-gray-500 dark:text-gray-400">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          Data per {todayLabel}
          <span className="inline-flex items-center gap-1 text-[#2a7039] dark:text-[#5cbb70]">
            <Layers className="h-3.5 w-3.5" /> {fields.length} lahan ·{' '}
            {activePlants} tanaman aktif · {warehouses.length} gudang
          </span>
        </div>
      </div>
    </div>
  )
}
