import { Link, createFileRoute } from '@tanstack/react-router'
import {
  AlertTriangle,
  Boxes,
  MapPin,
  Pencil,
  Package,
  Plus,
  Search,
  User,
  Warehouse as WarehouseIcon,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  FormWarehouseModal,
  type WarehouseFormResult,
} from '@/components/FormWarehouseModal'

export const Route = createFileRoute('/warehouse-ii')({
  component: RouteComponent,
})

/* ---------------------------------- data ---------------------------------- */
// NOTE: semua dummy/hardcoded — siap disambung ke API per scope nanti.

type Tone = 'success' | 'warning' | 'danger'

const toneStyles: Record<Tone, string> = {
  success:
    'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/25',
  warning:
    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25',
  danger:
    'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/25',
}

const barStyles: Record<Tone, string> = {
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
}

// Status gudang diturunkan dari persentase kapasitas terpakai.
function capacityTone(usage: number): { tone: Tone; label: string } {
  if (usage >= 80) return { tone: 'danger', label: 'Hampir penuh' }
  if (usage >= 55) return { tone: 'warning', label: 'Cukup terisi' }
  return { tone: 'success', label: 'Lega' }
}

interface IWarehouse {
  id: number
  name: string
  address: string
  capacity: number // total kapasitas (unit barang)
  items: number // jumlah barang saat ini
  owner: string
  thumbnail?: string
  latitude?: number
  longitude?: number
}

const DUMMY_WAREHOUSES: Array<IWarehouse> = [
  {
    id: 1,
    name: 'Gudang 1',
    address: 'Brebes, Jl. Netral',
    capacity: 600,
    items: 500,
    owner: 'Yoyo',
    thumbnail: '/lahan.png',
  },
  {
    id: 2,
    name: 'Gudang 2',
    address: 'Brebes, Jl. Netral',
    capacity: 900,
    items: 500,
    owner: 'Yoyo',
    thumbnail: '/lahan1.png',
  },
  {
    id: 3,
    name: 'Gudang 3',
    address: 'Brebes, Jl. Netral',
    capacity: 1800,
    items: 500,
    owner: 'Yoyo',
    thumbnail: '/bg-dashboard.png',
  },
]

/* -------------------------------- partials -------------------------------- */

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  tone: Tone
}) {
  return (
    <Card className="rounded-xl bg-white shadow-sm dark:bg-[#15211a] dark:border-white/10">
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
            toneStyles[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <p className="text-xl font-semibold leading-tight text-[#1a472a] dark:text-[#a7d1a7]">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

/* -------------------------------- component ------------------------------- */

function RouteComponent() {
  const [warehouses, setWarehouses] =
    useState<Array<IWarehouse>>(DUMMY_WAREHOUSES)
  const [query, setQuery] = useState('')

  // Modal form: null = tertutup, 'new' = tambah, objek = edit.
  const [editing, setEditing] = useState<IWarehouse | 'new' | null>(null)

  // Terima hasil dari modal → tambah baru atau update yang ada (data lokal,
  // backend gudang belum tersedia).
  const handleSave = (data: WarehouseFormResult) => {
    setWarehouses((prev) => {
      if (data.id != null) {
        return prev.map((w) =>
          w.id === data.id
            ? {
                ...w,
                name: data.name,
                address: data.address,
                capacity: data.capacity,
                thumbnail: data.thumbnailUrl ?? w.thumbnail,
                latitude: data.latitude ?? w.latitude,
                longitude: data.longitude ?? w.longitude,
              }
            : w,
        )
      }
      const nextId = prev.reduce((max, w) => Math.max(max, w.id), 0) + 1
      return [
        ...prev,
        {
          id: nextId,
          name: data.name,
          address: data.address,
          capacity: data.capacity,
          items: 0,
          owner: 'Saya',
          thumbnail: data.thumbnailUrl ?? '',
          latitude: data.latitude ?? undefined,
          longitude: data.longitude ?? undefined,
        },
      ]
    })
  }

  const filtered = warehouses.filter(
    (w) =>
      w.name.toLowerCase().includes(query.toLowerCase()) ||
      w.address.toLowerCase().includes(query.toLowerCase()),
  )

  const stats = useMemo(() => {
    const totalItems = warehouses.reduce((sum, w) => sum + w.items, 0)
    const totalCapacity = warehouses.reduce((sum, w) => sum + w.capacity, 0)
    const nearlyFull = warehouses.filter(
      (w) => (w.items / w.capacity) * 100 >= 80,
    ).length
    const usage = totalCapacity
      ? Math.round((totalItems / totalCapacity) * 100)
      : 0
    return { totalItems, nearlyFull, usage }
  }, [warehouses])

  return (
    <div className="min-h-screen w-full bg-[#e4f0e4] dark:bg-[#0c1410]">
      {/* Hero */}
      <div className="relative h-64 w-full md:h-72">
        <img
          src="/bg-dashboard.png"
          alt="Gudang penyimpanan"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/35 to-[#e4f0e4] dark:to-[#0c1410]" />

        <div className="absolute inset-0">
          <div className="mx-auto flex h-full max-w-6xl flex-col justify-center px-6 lg:px-10">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="text-white">
                <h1 className="flex items-center gap-2 text-3xl font-bold drop-shadow-sm md:text-4xl">
                  <WarehouseIcon className="h-8 w-8" />
                  Gudang Saya
                </h1>
                <p className="mt-1 text-sm text-white/90 md:text-base">
                  Kelola dan pantau semua gudang penyimpanan hasil panen Anda.
                </p>
              </div>

              {/* Search */}
              <div className="relative w-full max-w-md">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari gudang…"
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

      {/* Konten — ditarik naik ke atas hero (z-10 biar tak ketutup hero) */}
      <div className="relative z-10 mx-auto -mt-14 max-w-6xl space-y-6 px-4 pb-16 sm:px-6 lg:px-10">
        {/* Ringkasan */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          <StatCard
            icon={WarehouseIcon}
            label="Total Gudang"
            value={`${warehouses.length}`}
            tone="success"
          />
          <StatCard
            icon={Boxes}
            label="Total Barang"
            value={`${stats.totalItems}`}
            tone="warning"
          />
          <StatCard
            icon={AlertTriangle}
            label="Hampir Penuh"
            value={`${stats.nearlyFull}`}
            tone="danger"
          />
        </div>

        {/* Grid gudang */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((w) => {
            const usage = Math.min(
              100,
              Math.round((w.items / w.capacity) * 100),
            )
            const { tone, label } = capacityTone(usage)
            return (
              <Card
                key={w.id}
                className="group overflow-hidden rounded-xl border-none bg-white p-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:bg-[#15211a] dark:border dark:border-white/10"
              >
                {/* Thumbnail */}
                <div className="relative h-44 overflow-hidden bg-gradient-to-br from-[#2a7039] to-[#0B4619] dark:from-[#1c4d29] dark:to-[#06310f]">
                  {w.thumbnail ? (
                    <img
                      src={w.thumbnail}
                      alt={w.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <WarehouseIcon className="h-16 w-16 text-white/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                  <Badge
                    className={cn(
                      'absolute top-3 left-3 gap-1 shadow-sm',
                      toneStyles[tone],
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        barStyles[tone],
                      )}
                    />
                    {label}
                  </Badge>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing(w)}
                    className="absolute top-2 right-2 h-8 w-8 rounded-full text-white hover:bg-white/20"
                    aria-label={`Edit ${w.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <h3 className="absolute right-3 bottom-3 left-3 truncate text-lg font-semibold text-white drop-shadow">
                    {w.name}
                  </h3>
                </div>

                {/* Konten */}
                <CardContent className="space-y-3 p-4">
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-[#2a7039] dark:text-[#5cbb70]" />
                      <span className="truncate">{w.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 shrink-0 text-[#2a7039] dark:text-[#5cbb70]" />
                      <span>{w.items} barang tersimpan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 shrink-0 text-[#2a7039] dark:text-[#5cbb70]" />
                      <span className="truncate">{w.owner}</span>
                    </div>
                  </div>

                  {/* Kapasitas */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">
                        Kapasitas
                      </span>
                      <span
                        className={cn(
                          'font-medium',
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

                  <Link
                    to="/dWarehouse-ii/$id"
                    params={{ id: w.id.toString() }}
                  >
                    <Button className="w-full rounded-full bg-[#0B4619] text-white hover:bg-[#2a7039] dark:bg-[#5cbb70] dark:text-[#0c1410] dark:hover:bg-[#5cbb70]/90">
                      Lihat Detail
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}

          {/* Tambah gudang baru */}
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#2a7039]/30 bg-white/40 p-8 text-center transition-colors hover:border-[#2a7039] hover:bg-[#a7d1a7]/20 dark:border-white/15 dark:bg-[#15211a]/40 dark:hover:border-[#5cbb70] dark:hover:bg-white/5"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#a7d1a7]/40 text-[#0B4619] transition-transform hover:scale-110 dark:bg-[#5cbb70]/15 dark:text-[#5cbb70]">
              <Plus className="h-8 w-8" />
            </div>
            <p className="text-lg font-medium text-[#1a472a] dark:text-[#a7d1a7]">
              Tambah Gudang Baru
            </p>
            <p className="mt-1 text-sm text-[#1a472a]/50 dark:text-[#a7d1a7]/50">
              Daftarkan gudang penyimpanan ke AgriCloud
            </p>
          </button>
        </div>

        {/* Empty state hasil pencarian */}
        {warehouses.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500 dark:text-gray-400">
            <WarehouseIcon className="mb-3 h-12 w-12 text-gray-300 dark:text-white/15" />
            <p className="font-medium">Gudang tidak ditemukan</p>
            <p className="text-sm">
              Tidak ada gudang yang cocok dengan “{query}”.
            </p>
          </div>
        )}
      </div>

      {/* Modal tambah / edit gudang */}
      <FormWarehouseModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        warehouse={
          editing && editing !== 'new'
            ? {
                id: editing.id,
                name: editing.name,
                address: editing.address,
                capacity: editing.capacity,
                latitude: editing.latitude,
                longitude: editing.longitude,
                thumbnailUrl: editing.thumbnail || null,
              }
            : undefined
        }
        onSave={handleSave}
      />
    </div>
  )
}
