import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  MapPin,
  Pencil,
  Ruler,
  Sprout,
  User,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import MapClient from '@/components/Map'
import { cn } from '@/lib/utils'
import { formatArea } from '@/lib/format'
import { cropTags } from '@/lib/crops'
import type { FieldCrop } from '@/lib/crops'
import { reverseGeocode } from '@/utils/reversGeocode'
import { FormFieldModal } from '@/components/FormFieldModal'
import type { FieldInitialData } from '@/components/FormFieldModal'
import { MulaiTanamModal } from '@/components/MulaiTanamModal'
import { WeatherCard } from '@/components/WeatherCard'
import { ActiveCycleCard } from '@/components/ActiveCycleCard'

export const Route = createFileRoute('/dField-ii/$id')({
  component: RouteComponent,
})

/* ---------------------------------- tipe ---------------------------------- */

interface Ifield {
  id: number
  name: string
  description: string
  thumbnail: string
  location: { latitude: string; longitude: string }
  area: string
  owner: { id: number; name: string }
  crops?: Array<FieldCrop>
  created_at: string
  updated_at: string
  address?: string
}

interface IfieldResponse {
  id: number
  name: string
  description: string
  thumbnail: string
  location: { latitude: string; longitude: string }
  area: string
  owner: { id: number; name: string }
  crops?: Array<FieldCrop>
  created_at: string
  updated_at: string
}

/* ------------------------------ dummy fallback ---------------------------- */
// Dipakai kalau API gagal / lahan dengan id tsb tidak ketemu (mis. preview tanpa login).
const DUMMY_FIELD: Ifield = {
  id: -1,
  name: 'Lahan Cabai Brebes',
  description:
    'Tumpang sari cabai merah keriting & kacang tanah. Jenis hortikultura bernilai ekonomis tinggi, cocok di dataran rendah maupun tinggi pada ketinggian 0–1000 mdpl.',
  thumbnail: '/cabe1.png',
  location: { latitude: '-6.8721', longitude: '109.0407' },
  area: '5 Hektar',
  owner: { id: 0, name: 'Agung P' },
  created_at: '',
  updated_at: '',
  address: 'Brebes, Jawa Tengah',
}

/* -------------------------------- partials -------------------------------- */

function FactTile({
  icon: Icon,
  label,
  value,
  iconClass,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  iconClass: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 dark:border-white/10">
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
          iconClass,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="truncate text-sm font-semibold text-[#1a472a] dark:text-[#a7d1a7]">
          {value}
        </p>
      </div>
    </div>
  )
}

// Format tanggal ISO dari API → "6 Jun 2026". Kosong/invalid → "—".
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

function DetailSkeleton() {
  return (
    <div className="min-h-screen w-full bg-[#e4f0e4] dark:bg-[#0c1410]">
      <div className="h-64 w-full animate-pulse bg-gray-200 dark:bg-white/10 md:h-72" />
      <div className="mx-auto -mt-10 max-w-6xl space-y-6 px-4 pb-16 sm:px-6 lg:px-10">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-40 w-full animate-pulse rounded-xl bg-white/80 shadow-sm dark:bg-[#15211a]"
          />
        ))}
      </div>
    </div>
  )
}

/* -------------------------------- komponen -------------------------------- */

function RouteComponent() {
  const { id } = Route.useParams()
  const [field, setField] = useState<Ifield | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [tanamOpen, setTanamOpen] = useState(false)
  // Dinaikkan setelah berhasil mulai tanam → memaksa ActiveCycleCard fetch ulang.
  const [cycleRefresh, setCycleRefresh] = useState(0)

  const fetchData = async () => {
    setLoading(true)
    try {
      // Endpoint detail tunggal (lebih efisien dari ambil seluruh list).
      const response = await axios.get<{ data: IfieldResponse }>(
        `http://localhost:8005/api/myfields/${id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        },
      )
      const found = response.data.data
      if (!found) {
        setField(DUMMY_FIELD)
        return
      }

      let address = ''
      try {
        address = await reverseGeocode(
          found.location.latitude,
          found.location.longitude,
        )
      } catch (err) {
        console.error('Geocode error:', err)
        address = 'Alamat tidak ditemukan'
      }

      setField({
        ...found,
        owner: { ...found.owner, name: found.owner.name || 'Tidak diketahui' },
        address,
      })
    } catch (error) {
      console.error('Error fetching field detail:', error)
      setField(DUMMY_FIELD)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) return <DetailSkeleton />
  if (!field) return null

  const crops = cropTags(field.crops, `${field.name} ${field.description}`)
  const lat = Number(field.location.latitude)
  const lng = Number(field.location.longitude)
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng)

  const editTarget: FieldInitialData = {
    id: field.id,
    name: field.name,
    description: field.description,
    area: field.area,
    latitude: field.location.latitude,
    longitude: field.location.longitude,
    thumbnailUrl: field.thumbnail,
  }

  return (
    <div className="min-h-screen w-full bg-[#e4f0e4] dark:bg-[#0c1410]">
      {/* Hero — thumbnail lahan + gradient */}
      <div className="relative h-64 w-full md:h-72">
        <img
          src={field.thumbnail || '/lahan.png'}
          alt={field.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/45 to-[#e4f0e4] dark:to-[#0c1410]" />

        {/* Back — digeser ke kanan di mobile biar nggak nabrak hamburger sidebar */}
        <Link
          to="/field-ii"
          aria-label="Kembali ke daftar lahan"
          className="absolute top-4 left-16 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50 md:left-6"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        {/* Edit */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setModalOpen(true)}
          aria-label={`Edit ${field.name}`}
          className="absolute top-4 right-4 z-20 h-9 w-9 rounded-full bg-black/30 p-0 text-white backdrop-blur-sm hover:bg-black/50"
        >
          <Pencil className="h-4 w-4" />
        </Button>

        {/* Identitas lahan */}
        <div className="absolute inset-0">
          <div className="mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-7 lg:px-10">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {crops.map((crop) => (
                <Badge
                  key={crop.label}
                  className="gap-1 bg-white/90 text-gray-800 shadow-sm hover:bg-white"
                >
                  <span>{crop.icon}</span>
                  {crop.label}
                </Badge>
              ))}
            </div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-white drop-shadow-sm md:text-4xl">
              <Sprout className="h-7 w-7 shrink-0" />
              <span className="truncate">{field.name}</span>
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-white/90 drop-shadow">
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4 shrink-0" />
                {field.owner.name}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" />
                {field.address || 'Memuat alamat…'}
              </span>
              <span className="flex items-center gap-1.5">
                <Ruler className="h-4 w-4 shrink-0" />
                {formatArea(field.area)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Konten — ditarik naik ke atas hero. `relative z-10` wajib: kalau tidak,
          blok judul hero yang `absolute` akan ke-cat di atas kartu pertama. */}
      <div className="relative z-10 mx-auto -mt-10 max-w-6xl space-y-6 px-4 pb-16 sm:px-6 lg:px-10">
        {/* Action bar — sambungan ke alur siklus tanam */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link to="/cycle-ii">
            <Button
              variant="outline"
              className="w-full gap-2 rounded-full border-[#0B4619] text-[#0B4619] hover:bg-green-50 sm:w-auto dark:border-white/15 dark:text-[#a7d1a7] dark:hover:bg-white/5"
            >
              Lihat Siklus <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            onClick={() => setTanamOpen(true)}
            className="w-full gap-2 rounded-full bg-[#0B4619] text-white hover:bg-[#2a7039] sm:w-auto dark:bg-[#5cbb70] dark:text-[#0c1410] dark:hover:bg-[#5cbb70]/90"
          >
            <Sprout className="h-4 w-4" /> Mulai Tanam
          </Button>
        </div>

        {/* Info lahan */}
        <Card className="rounded-xl border-none bg-white p-0 shadow-sm dark:border dark:border-white/10 dark:bg-[#15211a]">
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div>
              <h2 className="text-lg font-semibold text-[#1a472a] dark:text-[#a7d1a7]">
                Tentang Lahan
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {field.description || 'Belum ada deskripsi untuk lahan ini.'}
              </p>
            </div>
            {/* Info pelengkap — pemilik/alamat/luas sudah ada di hero, jadi
                di sini cuma tampilkan yang belum: koordinat + jejak waktu. */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <a
                href={`https://www.google.com/maps?q=${field.location.latitude},${field.location.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:[&>div]:border-green-300 dark:hover:[&>div]:border-green-500/30"
              >
                <FactTile
                  icon={MapPin}
                  label="Koordinat (buka peta)"
                  value={`${field.location.latitude}, ${field.location.longitude}`}
                  iconClass="bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300"
                />
              </a>
              <FactTile
                icon={CalendarDays}
                label="Terdaftar"
                value={formatDate(field.created_at)}
                iconClass="bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
              />
              <FactTile
                icon={CalendarDays}
                label="Diperbarui"
                value={formatDate(field.updated_at)}
                iconClass="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
              />
            </div>
          </CardContent>
        </Card>

        {/* Siklus tanam aktif — data real dari /api/cycles (empty state + CTA
            kalau belum ada / endpoint belum tersedia). */}
        <ActiveCycleCard
          fieldId={id}
          onStartPlanting={() => setTanamOpen(true)}
          refreshKey={cycleRefresh}
        />

        {/* Cuaca (real, per-koordinat lahan) + Peta */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <WeatherCard
            lat={hasCoords ? lat : null}
            lng={hasCoords ? lng : null}
          />

          {/* Peta */}
          <Card className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-[#15211a] dark:border-white/10">
            <CardContent className="space-y-4 p-5 sm:p-6">
              <h3 className="flex items-center gap-2 text-base font-semibold text-[#1a472a] dark:text-[#a7d1a7]">
                <MapPin className="h-4 w-4" /> Lokasi Lahan
              </h3>
              <div className="h-[360px] w-full overflow-hidden rounded-lg">
                {hasCoords ? (
                  <MapClient center={[lat, lng]} zoom={17} radius={50} />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gray-100 text-sm text-gray-500 dark:bg-white/5 dark:text-gray-400">
                    Koordinat lahan tidak tersedia
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal edit lahan */}
      <FormFieldModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        field={editTarget}
        onSaved={fetchData}
      />

      {/* Modal mulai tanam (siklus baru) */}
      <MulaiTanamModal
        open={tanamOpen}
        onClose={() => setTanamOpen(false)}
        field={{ id: field.id, name: field.name }}
        onCreated={() => setCycleRefresh((n) => n + 1)}
      />
    </div>
  )
}
