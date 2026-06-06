import { createFileRoute } from '@tanstack/react-router'
import {
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

export const Route = createFileRoute('/dCycle-ii')({
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

const crop = {
  name: 'Cabai',
  land: 'Lahan 1',
  image: '/cabe1.png',
  description:
    'Jenis tanaman hortikultura yang memiliki nilai ekonomis tinggi dan banyak dibudidayakan secara komersial. Cabai merah cocok dibudidayakan baik di dataran rendah maupun dataran tinggi pada lahan sawah atau tegalan dengan ketinggian 0-1000m dpl.',
  plantedAt: '23/12/2024',
  phase: 'Pembungaan',
  progress: 60,
}

// Siklus hidup tanaman: fase yang sudah dilewati, fase sekarang, dan yang akan datang.
type PhaseStatus = 'done' | 'current' | 'upcoming'
const phases: { name: string; date: string; status: PhaseStatus }[] = [
  { name: 'Berkecambah', date: '04 Des', status: 'done' },
  { name: 'Vegetatif Awal', date: '12 Des', status: 'done' },
  { name: 'Vegetatif Lanjut', date: '18 Des', status: 'done' },
  { name: 'Pembungaan', date: '22 Des', status: 'current' },
  { name: 'Pembuahan', date: '—', status: 'upcoming' },
  { name: 'Panen', date: '—', status: 'upcoming' },
]

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
  need: number // kebutuhan (Kg)
  capacity: number // kapasitas (Kg)
  result: number // hasil akhir (Kg)
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

/* -------------------------------- component ------------------------------- */

function RouteComponent() {
  const [dark, toggleDark] = useDarkMode()

  return (
    <div className="min-h-screen bg-[#e4f0e4] transition-colors dark:bg-[#0c1410]">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header: breadcrumb + toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="order-1 flex min-w-0 flex-1 items-center gap-1.5 pl-16 text-sm md:pl-0">
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
            className="order-2 shrink-0 text-[#1a472a] hover:bg-[#a7d1a7]/40 dark:text-[#a7d1a7] dark:hover:bg-white/10"
          >
            {dark ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
          </Button>
        </div>

        {/* Hero: info tanaman */}
        <Card className="overflow-hidden rounded-2xl border-none bg-white shadow-md dark:bg-[#15211a] dark:ring-1 dark:ring-white/10">
          <CardContent className="flex flex-col gap-6 p-5 sm:p-6 md:flex-row">
            <div className="md:w-1/4">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-red-900/80 dark:ring-1 dark:ring-white/10">
                <img
                  src={crop.image}
                  alt={crop.name}
                  className="h-full w-full object-cover transition-[filter] dark:brightness-90 dark:saturate-[.85]"
                />
                {/* lapisan tipis biar foto jenuh nggak ngejreng di atas surface gelap */}
                <div className="pointer-events-none absolute inset-0 hidden dark:block dark:bg-[#0c1410]/15" />
                <Badge className="absolute left-2 top-2 border-none bg-black/40 text-white backdrop-blur">
                  <Sprout className="mr-1 h-3.5 w-3.5" /> {crop.phase}
                </Badge>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl font-bold text-[#1a472a] dark:text-[#a7d1a7]">
                  {crop.name}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e4f0e4] px-2.5 py-1 text-xs font-medium text-[#1a472a] dark:bg-[#1b2c22] dark:text-[#a7d1a7]">
                  <MapPin className="h-3.5 w-3.5" /> {crop.land}
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
                    {crop.progress}%
                  </span>
                </div>
                <Progress
                  value={crop.progress}
                  className="h-2.5 bg-gray-200 dark:bg-white/10 [&>div]:bg-[#2a7039] dark:[&>div]:bg-[#5cbb70]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fase Tanam */}
        <Card className="rounded-2xl bg-white shadow-sm dark:bg-[#15211a] dark:border-white/10">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-bold text-[#1a472a] dark:text-[#a7d1a7]">
                <Sprout className="h-5 w-5" /> Fase Tanam
              </h2>
              <Badge className={cn(toneStyles.warning)}>
                Fase ke-4 dari {phases.length}
              </Badge>
            </div>

            <div className="flex min-w-max gap-0 overflow-x-auto pb-1 sm:min-w-0">
              {phases.map((p, i) => {
                const currentIndex = phases.findIndex(
                  (x) => x.status === 'current',
                )
                const leftFilled = i <= currentIndex
                const rightFilled = i < currentIndex
                return (
                  <div
                    key={p.name}
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
                          i === phases.length - 1
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
          </CardContent>
        </Card>

        {/* Kondisi Tanaman */}
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
