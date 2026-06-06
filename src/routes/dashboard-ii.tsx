import { createFileRoute } from '@tanstack/react-router'
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  Cloud,
  CloudRain,
  Droplets,
  Layers,
  Leaf,
  MapPin,
  Moon,
  Scissors,
  Search,
  Sprout,
  Sun,
  Thermometer,
  TrendingUp,
  Warehouse,
  Wind,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { useState } from 'react'
import { useDarkMode } from '@/lib/preferences'
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

export const Route = createFileRoute('/dashboard-ii')({
  component: RouteComponent,
})

/* ---------------------------------- data ---------------------------------- */
// NOTE: semua dummy/hardcoded — siap disambung ke API per scope nanti.

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

const kpis: {
  label: string
  value: string
  hint: string
  icon: ComponentType<{ className?: string }>
  tone: Tone
}[] = [
  {
    label: 'Total Lahan',
    value: '3',
    hint: 'lahan aktif',
    icon: Layers,
    tone: 'info',
  },
  {
    label: 'Luas Total',
    value: '35 Ha',
    hint: 'tertanam',
    icon: MapPin,
    tone: 'success',
  },
  {
    label: 'Tanaman Aktif',
    value: '3',
    hint: 'jenis tanaman',
    icon: Sprout,
    tone: 'success',
  },
  {
    label: 'Perlu Perhatian',
    value: '2',
    hint: 'butuh tindakan',
    icon: AlertTriangle,
    tone: 'warning',
  },
]

const forecast = [
  { time: 'Sekarang', icon: Sun, temp: '31°' },
  { time: '13:00', icon: Sun, temp: '33°' },
  { time: '15:00', icon: Cloud, temp: '30°' },
  { time: '17:00', icon: CloudRain, temp: '27°' },
  { time: '19:00', icon: CloudRain, temp: '25°' },
]

const tasks: {
  id: number
  title: string
  land: string
  icon: ComponentType<{ className?: string }>
  tone: Tone
  badge: string
}[] = [
  {
    id: 1,
    title: 'Penyiraman lahan',
    land: 'Lahan 2 — Anggur',
    icon: Droplets,
    tone: 'info',
    badge: 'Hari ini',
  },
  {
    id: 2,
    title: 'Pemupukan susulan',
    land: 'Lahan 1 — Cabai',
    icon: Leaf,
    tone: 'warning',
    badge: 'Jatuh tempo',
  },
  {
    id: 3,
    title: 'Pengecekan hama',
    land: 'Lahan 1 — Cabai',
    icon: AlertTriangle,
    tone: 'danger',
    badge: 'Mendesak',
  },
  {
    id: 4,
    title: 'Estimasi panen',
    land: 'Lahan 3 — Tomat',
    icon: Scissors,
    tone: 'success',
    badge: '3 hari lagi',
  },
]

// Fase tanam: 1 lahan bisa punya >1 siklus tanam yang berjalan bersamaan
// (mis. tumpang sari). Struktur: Lahan → banyak Tanaman(cycle) → banyak Fase.
type Phase = { id: number; phase: string; date: string; tone: Tone }
type Crop = {
  id: number
  plant: string
  current: string // fase terkini
  phases: Phase[]
}
type FieldPlot = {
  id: number
  land: string
  crops: Crop[]
}

const fieldPlots: FieldPlot[] = [
  {
    id: 1,
    land: 'Lahan 1',
    // contoh tumpang sari: dua tanaman aktif sekaligus di satu lahan
    crops: [
      {
        id: 11,
        plant: 'Cabai',
        current: 'Pembungaan',
        phases: [
          {
            id: 1,
            phase: 'Pembungaan',
            date: '22 Des, 19:20',
            tone: 'warning',
          },
          {
            id: 2,
            phase: 'Pertumbuhan Vegetatif Lanjut',
            date: '18 Des, 09:10',
            tone: 'success',
          },
          {
            id: 3,
            phase: 'Pertumbuhan Vegetatif Awal',
            date: '12 Des, 15:52',
            tone: 'success',
          },
          {
            id: 4,
            phase: 'Berkecambah',
            date: '04 Des, 08:35',
            tone: 'success',
          },
        ],
      },
      {
        id: 12,
        plant: 'Kacang Tanah',
        current: 'Pertumbuhan Vegetatif Awal',
        phases: [
          {
            id: 1,
            phase: 'Pertumbuhan Vegetatif Awal',
            date: '20 Des, 08:00',
            tone: 'success',
          },
          {
            id: 2,
            phase: 'Berkecambah',
            date: '14 Des, 07:10',
            tone: 'success',
          },
        ],
      },
    ],
  },
  {
    id: 2,
    land: 'Lahan 2',
    crops: [
      {
        id: 21,
        plant: 'Anggur',
        current: 'Pertumbuhan Vegetatif Lanjut',
        phases: [
          {
            id: 1,
            phase: 'Pertumbuhan Vegetatif Lanjut',
            date: '21 Des, 19:28',
            tone: 'success',
          },
          {
            id: 2,
            phase: 'Pertumbuhan Vegetatif Awal',
            date: '13 Des, 11:05',
            tone: 'success',
          },
          {
            id: 3,
            phase: 'Berkecambah',
            date: '02 Des, 07:40',
            tone: 'success',
          },
        ],
      },
    ],
  },
  {
    id: 3,
    land: 'Lahan 3',
    crops: [
      {
        id: 31,
        plant: 'Tomat',
        current: 'Pembuahan',
        phases: [
          { id: 1, phase: 'Pembuahan', date: '23 Des, 06:15', tone: 'info' },
          {
            id: 2,
            phase: 'Pembungaan',
            date: '17 Des, 16:48',
            tone: 'success',
          },
          {
            id: 3,
            phase: 'Pertumbuhan Vegetatif Lanjut',
            date: '10 Des, 10:20',
            tone: 'success',
          },
          {
            id: 4,
            phase: 'Berkecambah',
            date: '01 Des, 09:00',
            tone: 'success',
          },
        ],
      },
    ],
  },
]

const landData: {
  id: number
  name: string
  plant: string
  area: string
  status: string
  tone: Tone
}[] = [
  {
    id: 1,
    name: 'Lahan 1',
    plant: 'Cabai',
    area: '15 Ha',
    status: 'Perlu pupuk',
    tone: 'warning',
  },
  {
    id: 2,
    name: 'Lahan 2',
    plant: 'Anggur',
    area: '10 Ha',
    status: 'Sehat',
    tone: 'success',
  },
  {
    id: 3,
    name: 'Lahan 3',
    plant: 'Tomat',
    area: '10 Ha',
    status: 'Siap panen',
    tone: 'info',
  },
]

const warehouseData: {
  id: number
  name: string
  location: string
  usage: number
  tone: Tone
}[] = [
  { id: 1, name: 'Gudang 1', location: 'Cirebon', usage: 82, tone: 'danger' },
  { id: 2, name: 'Gudang 2', location: 'Cirebon', usage: 55, tone: 'warning' },
  { id: 3, name: 'Gudang 3', location: 'Cirebon', usage: 30, tone: 'success' },
]

/* -------------------------------- component ------------------------------- */

function RouteComponent() {
  const [dark, toggleDark] = useDarkMode()
  const [activeLandId, setActiveLandId] = useState(fieldPlots[0].id)
  const [activeCropId, setActiveCropId] = useState(fieldPlots[0].crops[0].id)

  const activeField =
    fieldPlots.find((f) => f.id === activeLandId) ?? fieldPlots[0]
  const activeCrop =
    activeField.crops.find((c) => c.id === activeCropId) ?? activeField.crops[0]

  const selectLand = (field: FieldPlot) => {
    setActiveLandId(field.id)
    setActiveCropId(field.crops[0].id) // reset ke tanaman pertama lahan itu
  }

  return (
    <div className="min-h-screen bg-[#e4f0e4] transition-colors dark:bg-[#0c1410]">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="order-1 min-w-0 flex-1 pl-16 md:pl-0">
            <h1 className="text-lg sm:text-xl font-semibold text-[#1a472a] truncate dark:text-[#a7d1a7]">
              Selamat pagi, Pak Tani 👋
            </h1>
            <p className="text-xs sm:text-sm text-[#1a472a]/60 dark:text-[#a7d1a7]/60">
              Jumat, 6 Juni 2026 · Ringkasan kebun Anda hari ini
            </p>
          </div>
          <div className="relative order-3 w-full md:order-2 md:w-56 lg:w-72">
            <Input
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
          <Button
            variant="ghost"
            size="icon"
            className="relative order-2 shrink-0 text-[#1a472a] md:order-3 dark:text-[#a7d1a7]"
          >
            <Bell className="h-6 w-6" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
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
            {/* Cuaca */}
            <Card className="overflow-hidden rounded-xl border-none bg-gradient-to-br from-[#2a7039] to-[#0B4619] text-white shadow-md dark:border dark:border-white/10 dark:from-[#1d3327] dark:to-[#13201a]">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-sm text-white/80">
                      <MapPin className="h-4 w-4" /> Cirebon, Jawa Barat
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <Sun className="h-12 w-12 text-amber-300" />
                      <div>
                        <p className="text-4xl font-semibold leading-none">
                          31°C
                        </p>
                        <p className="text-sm text-white/80">Cerah berawan</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm text-white/85">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4" /> Lembap 68%
                    </div>
                    <div className="flex items-center gap-2">
                      <Wind className="h-4 w-4" /> Angin 12 km/j
                    </div>
                    <div className="flex items-center gap-2">
                      <CloudRain className="h-4 w-4" /> Hujan 40% sore
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-5 gap-2 border-t border-white/15 pt-3 dark:border-white/10">
                  {forecast.map((f) => (
                    <div
                      key={f.time}
                      className="flex flex-col items-center gap-1 text-center"
                    >
                      <span className="text-[11px] text-white/70">
                        {f.time}
                      </span>
                      <f.icon className="h-5 w-5 text-amber-200" />
                      <span className="text-sm font-medium">{f.temp}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tindakan hari ini */}
            <Card className="rounded-xl bg-white shadow-sm dark:bg-[#15211a] dark:border-white/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold text-[#1a472a] dark:text-[#a7d1a7]">
                  Perlu Tindakan Hari Ini
                </CardTitle>
                <Badge className="border-amber-200 bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25">
                  {tasks.length} tugas
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {tasks.map((task) => (
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
                        {task.land}
                      </p>
                    </div>
                    <Badge className={cn('shrink-0', toneStyles[task.tone])}>
                      {task.badge}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Kolom kanan: fase tanam */}
          <Card className="rounded-xl bg-white shadow-sm dark:bg-[#15211a] dark:border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#1a472a] dark:text-[#a7d1a7]">
                <CalendarDays className="h-4 w-4" /> Fase Tanam
              </CardTitle>
              {/* 1) Pilih lahan */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {fieldPlots.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => selectLand(f)}
                    className={cn(
                      'flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors',
                      f.id === activeLandId
                        ? 'border-transparent bg-[#0B4619] text-white dark:bg-[#5cbb70] dark:text-[#0c1410]'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-white/15 dark:text-gray-300 dark:hover:bg-white/5',
                    )}
                  >
                    {f.land}
                    {f.crops.length > 1 && (
                      <span
                        className={cn(
                          'rounded-full px-1 text-[10px] leading-tight',
                          f.id === activeLandId
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

              {/* 2) Pilih tanaman — hanya muncul bila lahan punya >1 tanaman (tumpang sari) */}
              {activeField.crops.length > 1 && (
                <div className="mt-2">
                  <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-[#1a472a]/60 dark:text-[#a7d1a7]/60">
                    <Sprout className="h-3.5 w-3.5" />
                    Tumpang sari · {activeField.crops.length} tanaman aktif
                  </div>
                  <div className="inline-flex rounded-lg bg-gray-100 p-0.5 dark:bg-white/10">
                    {activeField.crops.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setActiveCropId(c.id)}
                        className={cn(
                          'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                          c.id === activeCrop.id
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

              {/* Konteks siklus aktif: tanaman + fase aktif (dua baris) */}
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
            </CardHeader>
            <CardContent>
              <div className="relative">
                {activeCrop.phases.map((phase, index) => (
                  <div key={phase.id} className="flex pb-5 last:pb-0">
                    <div className="relative mr-3">
                      <div
                        className={cn(
                          'relative z-10 flex h-6 w-6 items-center justify-center rounded-full',
                          dotStyles[phase.tone],
                        )}
                      >
                        <div className="h-2.5 w-2.5 rounded-full bg-white" />
                      </div>
                      {index < activeCrop.phases.length - 1 && (
                        <div className="absolute left-1/2 top-6 z-0 h-full w-0.5 -translate-x-1/2 bg-gray-200 dark:bg-white/10" />
                      )}
                    </div>
                    <div className="-mt-0.5">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                        {phase.phase}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {phase.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
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
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-[#2a7039] dark:text-[#5cbb70]"
              >
                Lihat semua
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
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
                  {landData.map((land) => (
                    <TableRow
                      key={land.id}
                      className="cursor-pointer dark:border-white/10 dark:hover:bg-white/5"
                    >
                      <TableCell className="text-sm font-medium dark:text-gray-100">
                        {land.name}
                      </TableCell>
                      <TableCell className="text-sm dark:text-gray-300">
                        {land.plant}
                      </TableCell>
                      <TableCell className="text-sm dark:text-gray-300">
                        {land.area}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(toneStyles[land.tone])}>
                          {land.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Gudang */}
          <Card className="rounded-xl bg-white shadow-sm dark:bg-[#15211a] dark:border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#1a472a] dark:text-[#a7d1a7]">
                <Warehouse className="h-4 w-4" /> Gudang
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-[#2a7039] dark:text-[#5cbb70]"
              >
                Lihat semua
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {warehouseData.map((w) => (
                <div key={w.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-gray-800 dark:text-gray-100">
                        {w.name}
                      </span>
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <MapPin className="h-3 w-3" /> {w.location}
                      </span>
                    </div>
                    <span
                      className={cn(
                        'text-xs font-medium',
                        w.tone === 'danger'
                          ? 'text-red-600 dark:text-red-400'
                          : w.tone === 'warning'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-green-600 dark:text-green-400',
                      )}
                    >
                      {w.usage}% terpakai
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        barStyles[w.tone],
                      )}
                      style={{ width: `${w.usage}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-300">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Gudang 1 hampir penuh — pertimbangkan distribusi hasil panen.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer ringkas */}
        <div className="flex flex-wrap items-center gap-2 pb-2 text-xs text-gray-500 dark:text-gray-400">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          Data per 6 Juni 2026, 07:00
          <span className="inline-flex items-center gap-1 text-[#2a7039] dark:text-[#5cbb70]">
            <TrendingUp className="h-3.5 w-3.5" /> Produktivitas naik 8% bln ini
          </span>
          <span className="inline-flex items-center gap-1">
            <Thermometer className="h-3.5 w-3.5" /> Kondisi cuaca mendukung
          </span>
        </div>
      </div>
    </div>
  )
}
