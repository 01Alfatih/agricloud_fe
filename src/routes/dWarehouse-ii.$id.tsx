import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Boxes,
  Calendar,
  MapPin,
  Package,
  PackageMinus,
  PackagePlus,
  Search,
  User,
  Warehouse as WarehouseIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ComponentType } from 'react'
import type { Movement } from '@/components/FormItemModal'
import type {
  IItem,
  IMovementResponse,
  IWarehouse,
  IWarehouseResponse,
  MovementDirection,
} from '@/lib/warehouse'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { usePagination } from '@/hooks/usePagination'
import { cn } from '@/lib/utils'
import { FormItemModal } from '@/components/FormItemModal'
import { api } from '@/lib/api'
import {
  formatDate,
  localityLabel,
  mapWarehouse,
  usagePercent,
} from '@/lib/warehouse'

export const Route = createFileRoute('/dWarehouse-ii/$id')({
  component: RouteComponent,
})

/* ---------------------------------- data ---------------------------------- */

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const toneStyles: Record<Tone, string> = {
  success:
    'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/25',
  warning:
    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25',
  danger:
    'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/25',
  info: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/25',
  neutral:
    'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/25',
}

const barStyles: Record<'success' | 'warning' | 'danger', string> = {
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
}

// Jenis barang → warna badge (tone dark-aware). Default 'info' bila tak dikenal.
const ITEM_TYPE_TONE: Record<string, Tone> = {
  Pupuk: 'warning',
  Bibit: 'success',
  Pestisida: 'danger',
  Obat: 'danger',
  Alat: 'info',
  'Hasil Panen': 'neutral',
}

// Baris riwayat hasil transformasi dari MovementResource backend.
interface IInventoryRow {
  id: number
  date: string
  itemName: string
  qty: number
  type: string
  direction: MovementDirection
}

/* -------------------------------- partials -------------------------------- */

function StatTile({
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
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            toneStyles[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <p className="text-lg font-semibold leading-tight text-[#1a472a] dark:text-[#a7d1a7]">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function MovementBadge({ direction }: { direction: MovementDirection }) {
  if (direction === 'Masuk')
    return (
      <Badge className={cn('gap-1', toneStyles.success)}>
        <ArrowDownLeft className="h-3 w-3" /> Masuk
      </Badge>
    )
  if (direction === 'Keluar')
    return (
      <Badge className={cn('gap-1', toneStyles.danger)}>
        <ArrowUpRight className="h-3 w-3" /> Keluar
      </Badge>
    )
  return (
    <Badge className={cn('gap-1', toneStyles.info)}>
      <ArrowLeftRight className="h-3 w-3" /> Transfer
    </Badge>
  )
}

/* -------------------------------- component ------------------------------- */

function RouteComponent() {
  const { id } = Route.useParams()
  const [query, setQuery] = useState('')

  const [warehouse, setWarehouse] = useState<IWarehouse | null>(null)
  const [items, setItems] = useState<Array<IItem>>([])
  const [inventory, setInventory] = useState<Array<IInventoryRow>>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  // null = modal tertutup; selain itu = arah transaksi yang sedang dibuka.
  const [itemModal, setItemModal] = useState<Movement | null>(null)

  // Ambil detail gudang + daftar barang + riwayat transaksi sekaligus.
  const fetchData = async () => {
    setLoading(true)
    try {
      const [whRes, itemsRes, movRes] = await Promise.all([
        api.get<{ data: IWarehouseResponse }>(`/warehouses/${id}`),
        api.get<{ data: Array<IItem> }>(`/warehouses/${id}/items`),
        api.get<{ data: Array<IMovementResponse> }>(
          `/warehouses/${id}/movements`,
        ),
      ])
      setWarehouse(mapWarehouse(whRes.data.data))
      setItems(itemsRes.data.data)
      setInventory(
        movRes.data.data.map((m, i) => ({
          id: i,
          date: formatDate(m.created_at),
          itemName: m.item_name ?? '—',
          qty: m.qty,
          type: m.category ?? 'Lainnya',
          direction: m.direction,
        })),
      )
      setNotFound(false)
    } catch (error) {
      console.error('Gagal memuat gudang:', error)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  // Total stok aktual = Σ stok semua barang (lebih akurat dari items_count).
  const totalStock = useMemo(
    () => items.reduce((s, it) => s + it.stock, 0),
    [items],
  )

  const usage = warehouse ? usagePercent(totalStock, warehouse.capacity) : 0
  const usageTone: 'success' | 'warning' | 'danger' =
    usage >= 80 ? 'danger' : usage >= 55 ? 'warning' : 'success'

  const stats = useMemo(() => {
    const masuk = inventory
      .filter((r) => r.direction === 'Masuk')
      .reduce((s, r) => s + r.qty, 0)
    const keluar = inventory
      .filter((r) => r.direction === 'Keluar')
      .reduce((s, r) => s + r.qty, 0)
    return { masuk, keluar }
  }, [inventory])

  const filtered = inventory.filter(
    (r) =>
      r.itemName.toLowerCase().includes(query.toLowerCase()) ||
      r.type.toLowerCase().includes(query.toLowerCase()),
  )

  const itemsPg = usePagination(items, 10)
  const invPg = usePagination(filtered, 10)

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#e4f0e4] dark:bg-[#0c1410]">
        <div className="flex flex-col items-center gap-3 text-[#1a472a] dark:text-[#a7d1a7]">
          <WarehouseIcon className="h-10 w-10 animate-pulse" />
          <p className="text-sm">Memuat gudang…</p>
        </div>
      </div>
    )
  }

  if (notFound || !warehouse) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-[#e4f0e4] px-6 text-center dark:bg-[#0c1410]">
        <WarehouseIcon className="h-12 w-12 text-gray-300 dark:text-white/15" />
        <div>
          <p className="font-semibold text-[#1a472a] dark:text-[#a7d1a7]">
            Gudang tidak ditemukan
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gudang tidak ada atau bukan milik Anda.
          </p>
        </div>
        <Link to="/warehouse-ii">
          <Button className="gap-2 rounded-full bg-[#0B4619] text-white hover:bg-[#2a7039] dark:bg-[#5cbb70] dark:text-[#0c1410]">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Gudang
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#e4f0e4] dark:bg-[#0c1410]">
      {/* Hero — gambar gudang bersangkutan (fallback gradient) */}
      <div className="relative h-64 w-full md:h-72">
        {warehouse.thumbnail ? (
          <img
            src={warehouse.thumbnail}
            alt={warehouse.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#2a7039] to-[#0B4619] dark:from-[#1c4d29] dark:to-[#06310f]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/45 to-[#e4f0e4] dark:to-[#0c1410]" />

        {/* Back — digeser ke kanan di mobile biar nggak nabrak hamburger sidebar */}
        <Link
          to="/warehouse-ii"
          aria-label="Kembali ke daftar gudang"
          className="absolute top-4 left-16 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50 md:left-6"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        {/* Identitas gudang */}
        <div className="absolute inset-0">
          <div className="mx-auto flex h-full max-w-6xl flex-col justify-center px-6 lg:px-10">
            <Badge
              className={cn(
                'mb-2 w-fit gap-1 shadow-sm',
                toneStyles[usageTone],
              )}
            >
              <span
                className={cn('h-1.5 w-1.5 rounded-full', barStyles[usageTone])}
              />
              {usage}% terpakai
            </Badge>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-white drop-shadow-sm md:text-4xl">
              <WarehouseIcon className="h-7 w-7 shrink-0" />
              <span className="truncate">{warehouse.name}</span>
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-white/90 drop-shadow">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" />
                {localityLabel(warehouse.address)}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4 shrink-0" />
                {warehouse.owner}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Konten — ditarik naik ke atas hero (z-10 biar tak ketutup hero) */}
      <div className="relative z-10 mx-auto -mt-10 max-w-6xl space-y-6 px-4 pb-16 sm:px-6 lg:px-10">
        {/* Kapasitas */}
        <Card className="rounded-xl border-none bg-white p-0 shadow-sm dark:border dark:border-white/10 dark:bg-[#15211a]">
          <CardContent className="flex flex-col gap-2 p-5 sm:p-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                Kapasitas terpakai
              </span>
              <span
                className={cn(
                  'font-semibold',
                  usageTone === 'danger'
                    ? 'text-red-600 dark:text-red-400'
                    : usageTone === 'warning'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-green-600 dark:text-green-400',
                )}
              >
                {usage}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  barStyles[usageTone],
                )}
                style={{ width: `${usage}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {totalStock} dari {warehouse.capacity} unit
            </p>
          </CardContent>
        </Card>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatTile
            icon={Boxes}
            label="Total Stok"
            value={`${totalStock}`}
            tone="success"
          />
          <StatTile
            icon={Package}
            label="Jenis Barang"
            value={`${items.length}`}
            tone="info"
          />
          <StatTile
            icon={ArrowDownLeft}
            label="Barang Masuk"
            value={`${stats.masuk}`}
            tone="success"
          />
          <StatTile
            icon={ArrowUpRight}
            label="Barang Keluar"
            value={`${stats.keluar}`}
            tone="danger"
          />
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => setItemModal('Keluar')}
            className="gap-2 rounded-full border-amber-500 text-amber-600 hover:bg-amber-50 dark:border-amber-500/40 dark:text-amber-400 dark:hover:bg-amber-500/10"
          >
            <PackageMinus className="h-4 w-4" /> Gunakan Barang
          </Button>
          <Button
            onClick={() => setItemModal('Masuk')}
            className="gap-2 rounded-full bg-[#0B4619] text-white hover:bg-[#2a7039] dark:bg-[#5cbb70] dark:text-[#0c1410] dark:hover:bg-[#5cbb70]/90"
          >
            <PackagePlus className="h-4 w-4" /> Tambah Barang
          </Button>
        </div>

        {/* Stok Barang — daftar barang yang ada di gudang ini (bukan riwayat) */}
        <Card className="rounded-xl bg-white shadow-sm dark:bg-[#15211a] dark:border-white/10">
          <CardContent className="space-y-4 p-4 sm:p-5">
            <h3 className="flex items-center gap-2 text-base font-semibold text-[#1a472a] dark:text-[#a7d1a7]">
              <Boxes className="h-4 w-4" /> Stok Barang
            </h3>

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500 dark:text-gray-400">
                <Package className="mb-3 h-10 w-10 text-gray-300 dark:text-white/15" />
                <p className="font-medium">Belum ada barang</p>
                <p className="text-sm">
                  Tambahkan barang untuk mulai mengisi gudang ini.
                </p>
              </div>
            ) : (
              <>
                {/* Tabel (desktop) */}
                <div className="hidden overflow-x-auto md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="dark:border-white/10">
                        <TableHead className="text-xs text-gray-500 dark:text-gray-400">
                          Nama Barang
                        </TableHead>
                        <TableHead className="text-xs text-gray-500 dark:text-gray-400">
                          Jenis
                        </TableHead>
                        <TableHead className="text-right text-xs text-gray-500 dark:text-gray-400">
                          Stok
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itemsPg.pageItems.map((it) => (
                        <TableRow
                          key={it.id}
                          className="dark:border-white/10 dark:hover:bg-white/5"
                        >
                          <TableCell className="text-sm font-medium text-gray-800 dark:text-gray-100">
                            {it.name}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                toneStyles[
                                  ITEM_TYPE_TONE[it.category ?? ''] ?? 'info'
                                ],
                              )}
                            >
                              {it.category ?? 'Lainnya'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm text-gray-600 dark:text-gray-300">
                            {it.stock} {it.unit}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Card list (mobile) */}
                <div className="space-y-3 md:hidden">
                  {itemsPg.pageItems.map((it) => (
                    <div
                      key={it.id}
                      className="flex items-start justify-between gap-2 rounded-lg border border-gray-100 p-3 dark:border-white/10"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                          {it.name}
                        </p>
                        <div className="mt-1">
                          <Badge
                            className={cn(
                              toneStyles[
                                ITEM_TYPE_TONE[it.category ?? ''] ?? 'info'
                              ],
                            )}
                          >
                            {it.category ?? 'Lainnya'}
                          </Badge>
                        </div>
                      </div>
                      <span className="shrink-0 text-sm font-medium text-gray-600 dark:text-gray-300">
                        {it.stock} {it.unit}
                      </span>
                    </div>
                  ))}
                </div>

                <Pagination
                  page={itemsPg.page}
                  totalPages={itemsPg.totalPages}
                  onPageChange={itemsPg.setPage}
                  summary={`Menampilkan ${itemsPg.from}–${itemsPg.to} dari ${itemsPg.total} barang`}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Inventory */}
        <Card className="rounded-xl bg-white shadow-sm dark:bg-[#15211a] dark:border-white/10">
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="flex items-center gap-2 text-base font-semibold text-[#1a472a] dark:text-[#a7d1a7]">
                <Package className="h-4 w-4" /> Riwayat Barang
              </h3>
              <div className="relative w-full sm:w-64">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari barang / jenis…"
                  className="w-full rounded-full border-none bg-[#a7d1a7] py-2 pr-10 pl-4 text-[#1a472a] placeholder:text-[#1a472a]/70 focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-[#1f3329] dark:text-[#a7d1a7] dark:placeholder:text-[#a7d1a7]/50"
                />
                <Search className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#1a472a] dark:text-[#a7d1a7]" />
              </div>
            </div>

            {/* Tabel (desktop) */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-white/10">
                    <TableHead className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> Tanggal
                      </span>
                    </TableHead>
                    <TableHead className="text-xs text-gray-500 dark:text-gray-400">
                      Nama Barang
                    </TableHead>
                    <TableHead className="text-xs text-gray-500 dark:text-gray-400">
                      Jumlah
                    </TableHead>
                    <TableHead className="text-xs text-gray-500 dark:text-gray-400">
                      Jenis
                    </TableHead>
                    <TableHead className="text-xs text-gray-500 dark:text-gray-400">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invPg.pageItems.map((row) => (
                    <TableRow
                      key={row.id}
                      className="dark:border-white/10 dark:hover:bg-white/5"
                    >
                      <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                        {row.date}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-800 dark:text-gray-100">
                        {row.itemName}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                        {row.qty} unit
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            toneStyles[ITEM_TYPE_TONE[row.type] ?? 'info'],
                          )}
                        >
                          {row.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <MovementBadge direction={row.direction} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Card list (mobile) */}
            <div className="space-y-3 md:hidden">
              {invPg.pageItems.map((row) => (
                <div
                  key={row.id}
                  className="rounded-lg border border-gray-100 p-3 dark:border-white/10"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                        {row.itemName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {row.date} · {row.qty} unit
                      </p>
                    </div>
                    <MovementBadge direction={row.direction} />
                  </div>
                  <div className="mt-2">
                    <Badge
                      className={cn(
                        toneStyles[ITEM_TYPE_TONE[row.type] ?? 'info'],
                      )}
                    >
                      {row.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length > 0 && (
              <Pagination
                page={invPg.page}
                totalPages={invPg.totalPages}
                onPageChange={invPg.setPage}
                summary={`Menampilkan ${invPg.from}–${invPg.to} dari ${invPg.total} riwayat`}
              />
            )}

            {/* Empty state */}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500 dark:text-gray-400">
                <Package className="mb-3 h-10 w-10 text-gray-300 dark:text-white/15" />
                <p className="font-medium">Belum ada riwayat</p>
                <p className="text-sm">
                  {query
                    ? `Tidak ada barang yang cocok dengan “${query}”.`
                    : 'Catat transaksi masuk/keluar untuk mengisi riwayat.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal tambah / gunakan barang */}
      <FormItemModal
        open={itemModal !== null}
        onClose={() => setItemModal(null)}
        movement={itemModal ?? 'Masuk'}
        warehouseId={warehouse.id}
        items={items}
        onSaved={fetchData}
      />
    </div>
  )
}
