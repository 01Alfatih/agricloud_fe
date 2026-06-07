import { Link, createFileRoute } from '@tanstack/react-router'
import {
  MapPin,
  Pencil,
  Plus,
  Search,
  Sprout,
  Square,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Pagination } from '@/components/ui/pagination'
import { usePagination } from '@/hooks/usePagination'
import { reverseGeocode } from '@/utils/reversGeocode'
import { formatArea } from '@/lib/format'
import type { FieldCrop } from '@/lib/crops'
import { FormFieldModal } from '@/components/FormFieldModal'
import type { FieldInitialData } from '@/components/FormFieldModal'

const API_BASE_URL = import.meta.env.VITE_API_URL

export const Route = createFileRoute('/field-ii')({
  component: RouteComponent,
})

// Ringkasan siklus tanam aktif (lihat PESAN-BACKEND.md §12); null bila belum nanam.
interface IActiveCycle {
  plant_name?: string | null
  phase?: string | null
  progress?: number | null
}

interface Ifield {
  id: number
  name: string
  description: string
  thumbnail: string
  location: {
    latitude: string
    longitude: string
  }
  area: string
  owner: {
    id: number
    name: string
  }
  crops?: Array<FieldCrop>
  active_cycle?: IActiveCycle | null
  created_at: string
  updated_at: string
  address?: string
}

interface IfieldResponse {
  id: number
  name: string
  description: string
  thumbnail: string
  location: {
    latitude: string
    longitude: string
  }
  area: string
  owner: {
    id: number
    name: string
  }
  crops?: Array<FieldCrop>
  active_cycle?: IActiveCycle | null
  created_at: string
  updated_at: string
}

// Inisial dari nama pemilik buat avatar di card (maks 2 huruf).
function initials(name?: string | null): string {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

// Dummy lahan buat preview tampilan card saat data API kosong / belum login.
const DUMMY_FIELDS: Array<Ifield> = [
  {
    id: -1,
    name: 'Lahan Cabai Brebes',
    description: 'Tumpang sari cabai merah keriting & kacang tanah',
    thumbnail: '/cabe1.png',
    location: { latitude: '-6.8721', longitude: '109.0407' },
    area: '5 Hektar',
    owner: { id: 0, name: 'Agung P' },
    created_at: '',
    updated_at: '',
    address: 'Brebes, Jawa Tengah',
  },
  {
    id: -2,
    name: 'Kebun Anggur Probolinggo',
    description: 'Kebun anggur varietas import',
    thumbnail: '/anggur1.png',
    location: { latitude: '-7.7543', longitude: '113.2159' },
    area: '3 Hektar',
    owner: { id: 0, name: 'Agung P' },
    created_at: '',
    updated_at: '',
    address: 'Probolinggo, Jawa Timur',
  },
  {
    id: -3,
    name: 'Lahan Tomat Malang',
    description: 'Lahan tomat dataran tinggi',
    thumbnail: '/tomat1.png',
    location: { latitude: '-7.9839', longitude: '112.6214' },
    area: '4 Hektar',
    owner: { id: 0, name: 'Agung P' },
    created_at: '',
    updated_at: '',
    address: 'Malang, Jawa Timur',
  },
]

function FieldCardSkeleton() {
  return (
    <Card className="overflow-hidden border-0 shadow-md dark:border dark:border-white/10 dark:bg-[#15211a]">
      <div className="h-48 w-full animate-pulse bg-gray-200 dark:bg-white/10" />
      <CardContent className="space-y-3 p-4">
        <div className="h-5 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
        <div className="h-9 w-full animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
      </CardContent>
    </Card>
  )
}

function RouteComponent() {
  const [fields, setFields] = useState<Array<Ifield>>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  // undefined = mode tambah; objek = mode edit.
  const [editTarget, setEditTarget] = useState<FieldInitialData | undefined>(
    undefined,
  )

  const openAdd = () => {
    setEditTarget(undefined)
    setModalOpen(true)
  }
  const openEdit = (land: Ifield) => {
    setEditTarget({
      id: land.id,
      name: land.name,
      description: land.description,
      area: land.area,
      latitude: land.location.latitude,
      longitude: land.location.longitude,
      thumbnailUrl: land.thumbnail,
    })
    setModalOpen(true)
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await axios.get<{ data: Array<IfieldResponse> }>(
        `${API_BASE_URL}/myfields`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        },
      )
      const enrichedFields: Array<Ifield> = await Promise.all(
        response.data.data.map(async (field) => {
          let address = ''
          try {
            address = await reverseGeocode(
              field.location.latitude,
              field.location.longitude,
            )
          } catch (err) {
            console.error('Geocode error:', err)
            address = 'Alamat tidak ditemukan'
          }

          return {
            id: field.id,
            name: field.name,
            thumbnail: field.thumbnail,
            description: field.description,
            location: {
              latitude: field.location.latitude,
              longitude: field.location.longitude,
            },
            area: field.area,
            owner: {
              id: field.owner.id,
              name: field.owner.name || 'Tidak diketahui',
            },
            crops: field.crops,
            active_cycle: field.active_cycle,
            created_at: field.created_at,
            updated_at: field.updated_at,
            address,
          }
        }),
      )

      // Kalau API belum ngembaliin lahan, pakai dummy buat preview.
      setFields(enrichedFields.length > 0 ? enrichedFields : DUMMY_FIELDS)
    } catch (error) {
      console.error('Error fetching fields data:', error)
      setFields(DUMMY_FIELDS)
    } finally {
      setLoading(false)
    }
  }

  // Hapus lahan → DELETE /api/myfields/{id}, lalu refresh list.
  const handleDelete = async (land: Ifield) => {
    // Lahan dummy preview (id negatif) tidak punya record di backend.
    if (land.id < 0) {
      toast.error('Lahan contoh tidak bisa dihapus.')
      return
    }
    const ok = window.confirm(
      `Hapus lahan "${land.name}"? Tindakan ini tidak bisa dibatalkan.`,
    )
    if (!ok) return

    try {
      await axios.delete(`${API_BASE_URL}/myfields/${land.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      toast.success(`Lahan "${land.name}" dihapus.`)
      fetchData()
    } catch (error) {
      console.error('Gagal menghapus lahan:', error)
      toast.error('Gagal menghapus lahan. Coba lagi.')
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filtered = fields.filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase()),
  )

  const { page, setPage, totalPages, pageItems, total, from, to } =
    usePagination(filtered, 9)

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-[#0c1410]">
      {/* Hero */}
      <div className="relative h-72 w-full md:h-80">
        <img
          src="/bg-dashboard.png"
          alt="Lahan pertanian"
          className="h-full w-full object-cover"
        />
        {/* Gradient overlay biar teks & search kebaca */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-gray-50 dark:to-[#0c1410]" />

        <div className="absolute inset-0">
          <div className="container mx-auto flex h-full flex-col justify-center px-6 md:px-[10%]">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="text-white">
                <h1 className="text-3xl font-bold drop-shadow-sm md:text-4xl">
                  Lahan Saya
                </h1>
                <p className="mt-1 text-sm text-white/90 md:text-base">
                  Kelola dan pantau semua lahan pertanianmu di satu tempat.
                </p>
              </div>

              {/* Search */}
              <div className="relative w-full max-w-md">
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari Lahan Anda"
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
      <div className="container mx-auto -mt-16 px-4 pb-16 md:px-[10%]">
        <Card className="border-0 bg-white/95 shadow-xl backdrop-blur-sm dark:border dark:border-white/10 dark:bg-[#15211a]">
          <CardContent className="p-6 md:p-8">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-[#a7d1a7]">
                  Lahan
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {loading
                    ? 'Memuat data…'
                    : `${fields.length} Lahan Digunakan`}
                </p>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {loading ? (
                <>
                  <FieldCardSkeleton />
                  <FieldCardSkeleton />
                  <FieldCardSkeleton />
                </>
              ) : (
                pageItems.map((land) => {
                  return (
                    <Card
                      key={land.id}
                      className="group overflow-hidden border-0 p-0 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border dark:border-white/10 dark:bg-[#15211a]"
                    >
                      {/* Image */}
                      <div
                        className="relative h-48 bg-cover bg-center"
                        style={{
                          backgroundImage: `url('${land.thumbnail || '/lahan.png'}')`,
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                        {/* Aksi: edit & hapus lahan */}
                        <div className="absolute top-3 right-3 flex gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(land)}
                            aria-label={`Edit ${land.name}`}
                            className="h-8 w-8 rounded-full bg-black/30 p-0 text-white backdrop-blur-sm hover:bg-black/55"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(land)}
                            aria-label={`Hapus ${land.name}`}
                            className="h-8 w-8 rounded-full bg-black/30 p-0 text-white backdrop-blur-sm hover:bg-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Nama lahan di atas gambar */}
                        <h3 className="absolute right-3 bottom-3 left-3 truncate text-lg font-semibold text-white drop-shadow">
                          {land.name}
                        </h3>
                      </div>

                      {/* Content */}
                      <CardContent className="p-4">
                        {/* Owner — baris penuh biar nama gak kepotong */}
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-xs font-semibold text-green-700 dark:text-green-300">
                            {initials(land.owner.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                              {land.owner.name ?? '-'}
                            </p>
                            <p className="text-xs whitespace-nowrap text-gray-400 dark:text-gray-500">
                              Pemilik lahan
                            </p>
                          </div>
                        </div>

                        <div className="my-3 h-px bg-gray-100 dark:bg-white/10" />

                        {/* Lokasi (kiri) + luas pill (kanan) */}
                        <div className="mb-4 flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <span className="truncate">
                              {land.address || 'Memuat alamat…'}
                            </span>
                          </div>
                          <Badge className="shrink-0 gap-1 border-0 bg-green-500/10 font-semibold text-green-700 hover:bg-green-500/10 dark:bg-green-500/15 dark:text-green-300">
                            <Square className="h-3.5 w-3.5" />
                            {formatArea(land.area)}
                          </Badge>
                        </div>

                        {/* Tanaman aktif — badge fase + progress siklus (§12) */}
                        {land.active_cycle?.plant_name ? (
                          <div className="mb-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge className="gap-1 border-0 bg-green-500/10 font-medium text-green-700 hover:bg-green-500/10 dark:bg-green-500/15 dark:text-green-300">
                                <Sprout className="h-3.5 w-3.5" />
                                <span className="max-w-[10rem] truncate">
                                  {land.active_cycle.plant_name}
                                </span>
                              </Badge>
                              {land.active_cycle.phase && (
                                <Badge className="border-0 bg-green-600/90 text-xs text-white hover:bg-green-600/90">
                                  {land.active_cycle.phase}
                                </Badge>
                              )}
                            </div>
                            {typeof land.active_cycle.progress === 'number' && (
                              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-green-600/15">
                                <div
                                  className="h-full rounded-full bg-green-600 dark:bg-green-500"
                                  style={{
                                    width: `${land.active_cycle.progress}%`,
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="mb-4">
                            <Badge className="gap-1 border-0 bg-gray-100 font-medium text-gray-500 hover:bg-gray-100 dark:bg-white/5 dark:text-gray-400">
                              <Sprout className="h-3.5 w-3.5" />
                              Belum ada tanam
                            </Badge>
                          </div>
                        )}

                        <Link
                          to="/dField-ii/$id"
                          params={{ id: land.id.toString() }}
                        >
                          <Button className="w-full rounded-full bg-green-600 text-white hover:bg-green-700">
                            Lihat Detail
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )
                })
              )}

              {/* Add New Land Card → buka modal tambah lahan */}
              {!loading && (
                <button
                  type="button"
                  onClick={openAdd}
                  className="block h-full w-full text-left"
                >
                  <Card className="flex h-full min-h-[340px] cursor-pointer items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50/50 transition-colors hover:border-green-500 hover:bg-green-50/50 dark:border-white/15 dark:bg-white/5 dark:hover:border-green-500 dark:hover:bg-green-500/10">
                    <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 transition-transform group-hover:scale-110 dark:bg-green-500/15 dark:text-green-300">
                        <Plus className="h-8 w-8" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">
                        Tambah Lahan Baru
                      </h3>
                      <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                        Daftarkan lahan pertanian baru ke AgriCloud
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
                summary={`Menampilkan ${from}–${to} dari ${total} lahan`}
              />
            )}

            {/* Empty state hasil pencarian */}
            {!loading && fields.length > 0 && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500 dark:text-gray-400">
                <Sprout className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
                <p className="font-medium">Lahan tidak ditemukan</p>
                <p className="text-sm">
                  Tidak ada lahan dengan nama “{query}”.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal tambah / edit lahan */}
      <FormFieldModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        field={editTarget}
        onSaved={fetchData}
      />
    </div>
  )
}
