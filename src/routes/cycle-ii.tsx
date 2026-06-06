import { Link, createFileRoute } from '@tanstack/react-router'
import { Clock, Leaf, MapPin, Plus, Search, Sprout } from 'lucide-react'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { MulaiTanamModal } from '@/components/MulaiTanamModal'

export const Route = createFileRoute('/cycle-ii')({
  component: RouteComponent,
})

interface ICropMeta {
  image: string | null
  icon: string
  category: string
  growthDays: number // estimasi umur panen (hari)
}

interface IPlant extends ICropMeta {
  id: number
  name: string
  description: string
  land: string // lahan tempat ditanam (dummy, milik siklus tanam — lihat PESAN-BACKEND.md §9)
  progress: number // % pertumbuhan siklus tanam (dummy, lihat PESAN-BACKEND.md §9)
}

interface ICropTemplateResponse {
  id: number
  name: string
  description: string | null
  // Metadata dari backend (CropTemplate-Metadata) — semua nullable, kalau kosong
  // FE fallback ke tebakan `decorateCrop` dari nama.
  thumbnail?: string | null
  category?: string | null
  growth_days?: number | null
}

// Metadata tanaman. Backend `GET /api/crop-templates` kini mengirim
// thumbnail/category/growth_days (tiket CropTemplate-Metadata, semua nullable),
// dan FE memprioritaskannya. `decorateCrop` di bawah dipertahankan untuk emoji
// `icon` (belum dikirim backend) + fallback saat field backend null. Tanaman
// tanpa foto pakai placeholder gradient + emoji (bukan foto sawah menyesatkan).
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
    meta: {
      image: null,
      icon: '🥬',
      category: 'Sayuran Daun',
      growthDays: 30,
    },
  },
  {
    match: ['kangkung'],
    meta: {
      image: null,
      icon: '🥬',
      category: 'Sayuran Daun',
      growthDays: 28,
    },
  },
  {
    match: ['selada', 'lettuce'],
    meta: {
      image: null,
      icon: '🥗',
      category: 'Sayuran Daun',
      growthDays: 45,
    },
  },
  {
    match: ['sawi'],
    meta: {
      image: null,
      icon: '🥬',
      category: 'Sayuran Daun',
      growthDays: 40,
    },
  },
  {
    match: ['padi', 'beras'],
    meta: {
      image: null,
      icon: '🌾',
      category: 'Pangan',
      growthDays: 110,
    },
  },
  {
    match: ['jagung'],
    meta: {
      image: null,
      icon: '🌽',
      category: 'Pangan',
      growthDays: 100,
    },
  },
  {
    match: ['terong', 'terung'],
    meta: {
      image: null,
      icon: '🍆',
      category: 'Hortikultura',
      growthDays: 80,
    },
  },
  {
    match: ['timun', 'mentimun'],
    meta: {
      image: null,
      icon: '🥒',
      category: 'Hortikultura',
      growthDays: 60,
    },
  },
  {
    match: ['wortel'],
    meta: {
      image: null,
      icon: '🥕',
      category: 'Umbi',
      growthDays: 90,
    },
  },
  {
    match: ['kentang'],
    meta: {
      image: null,
      icon: '🥔',
      category: 'Umbi',
      growthDays: 100,
    },
  },
  {
    match: ['bawang'],
    meta: {
      image: null,
      icon: '🧅',
      category: 'Umbi',
      growthDays: 70,
    },
  },
  {
    match: ['jeruk'],
    meta: {
      image: null,
      icon: '🍊',
      category: 'Buah',
      growthDays: 240,
    },
  },
  {
    match: ['strawberry', 'stroberi'],
    meta: {
      image: null,
      icon: '🍓',
      category: 'Buah',
      growthDays: 60,
    },
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

// PLACEHOLDER: progress pertumbuhan & lahan idealnya datang dari siklus tanam
// aktif (lihat PESAN-BACKEND.md §9), bukan dari crop-template yang cuma katalog.
// Sementara ditebak deterministik dari id biar preview tetap bervariasi.
function placeholderProgress(seed: number): number {
  return 25 + ((Math.abs(seed) * 37) % 70) // 25..94
}

function placeholderLand(seed: number): string {
  return `Lahan ${(Math.abs(seed) % 3) + 1}`
}

// Dummy tanaman buat preview saat API kosong / belum login.
const DUMMY_PLANTS: Array<IPlant> = [
  {
    id: -1,
    name: 'Cabai',
    description: 'Cabai adalah tanaman hortikultura bernilai ekonomis tinggi.',
    land: 'Lahan 1',
    progress: 60,
    ...decorateCrop('Cabai'),
  },
  {
    id: -2,
    name: 'Anggur',
    description: 'Anggur cocok ditanam di iklim sedang dan tropis.',
    land: 'Lahan 2',
    progress: 60,
    ...decorateCrop('Anggur'),
  },
  {
    id: -3,
    name: 'Tomat',
    description: 'Tomat kaya akan vitamin dan mudah dibudidayakan.',
    land: 'Lahan 1',
    progress: 40,
    ...decorateCrop('Tomat'),
  },
]

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
function PlantImage({ plant }: { plant: IPlant }) {
  if (plant.image) {
    return (
      <div className="relative h-44">
        <img
          src={plant.image}
          alt={plant.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <Badge className="absolute top-3 left-3 gap-1 bg-white/90 text-gray-800 shadow-sm hover:bg-white">
          <span>{plant.icon}</span>
          {plant.category}
        </Badge>
      </div>
    )
  }

  return (
    <div className="relative h-44 overflow-hidden bg-gradient-to-br from-green-500 via-green-600 to-emerald-700">
      {/* Pola dekoratif samar */}
      <div className="absolute -top-6 -right-6 h-28 w-28 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -left-4 h-24 w-24 rounded-full bg-white/10" />
      <div className="flex h-full items-center justify-center">
        <span className="text-6xl drop-shadow-sm transition-transform duration-300 group-hover:scale-110">
          {plant.icon}
        </span>
      </div>
      <Badge className="absolute top-3 left-3 gap-1 bg-white/90 text-gray-800 shadow-sm hover:bg-white">
        <span>{plant.icon}</span>
        {plant.category}
      </Badge>
    </div>
  )
}

function RouteComponent() {
  const [plants, setPlants] = useState<Array<IPlant>>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const response = await axios.get<{
          data: Array<ICropTemplateResponse>
        }>('http://localhost:8005/api/crop-templates', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })

        const enriched: Array<IPlant> = response.data.data.map((tpl) => {
          // Tebakan dari nama sebagai fallback (icon + saat field backend null).
          const guess = decorateCrop(tpl.name)
          return {
            id: tpl.id,
            name: tpl.name,
            description: tpl.description ?? '',
            land: placeholderLand(tpl.id),
            progress: placeholderProgress(tpl.id),
            ...guess,
            // Utamakan metadata real dari backend; null → pakai tebakan.
            image: tpl.thumbnail ?? guess.image,
            category: tpl.category ?? guess.category,
            growthDays: tpl.growth_days ?? guess.growthDays,
          }
        })

        // Kalau API belum ngembaliin tanaman, pakai dummy buat preview.
        setPlants(enriched.length > 0 ? enriched : DUMMY_PLANTS)
      } catch (error) {
        console.error('Error fetching crop templates:', error)
        setPlants(DUMMY_PLANTS)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filtered = plants.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()),
  )

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
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="text-white">
                <h1 className="flex items-center gap-2 text-3xl font-bold drop-shadow-sm md:text-4xl">
                  <Leaf className="h-8 w-8" />
                  Tanaman
                </h1>
                <p className="mt-1 text-sm text-white/90 md:text-base">
                  Jelajahi dan kelola katalog tanaman untuk lahanmu.
                </p>
              </div>

              {/* Search */}
              <div className="relative w-full max-w-md">
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari Tanaman Anda"
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
                  Tanaman
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {loading
                    ? 'Memuat data…'
                    : `${plants.length} Tanaman Tersedia`}
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
                filtered.map((plant) => (
                  <Card
                    key={plant.id}
                    className="group overflow-hidden border-0 p-0 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border dark:border-white/10 dark:bg-[#15211a]"
                  >
                    <PlantImage plant={plant} />
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                          {plant.name}
                        </h3>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-500/10 dark:text-green-300">
                          <Clock className="h-3 w-3" />~{plant.growthDays} hr
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                        <MapPin className="h-3 w-3 shrink-0 text-green-600 dark:text-green-400" />
                        <span className="truncate">{plant.land}</span>
                      </div>

                      <p className="line-clamp-2 min-h-[2rem] text-xs text-gray-500 dark:text-gray-400">
                        {plant.description || 'Belum ada deskripsi.'}
                      </p>

                      {/* Progress pertumbuhan tanaman */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-500 dark:text-gray-400">
                            Progress
                          </span>
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            {plant.progress}%
                          </span>
                        </div>
                        <Progress
                          value={plant.progress}
                          className="h-1.5 bg-gray-100 [&>div]:bg-green-600 dark:bg-white/10 dark:[&>div]:bg-green-500"
                        />
                      </div>

                      <Link to="/dCycle-ii" className="block pt-1">
                        <Button
                          size="sm"
                          className="w-full rounded-full bg-green-600 text-xs text-white hover:bg-green-700"
                        >
                          Lihat
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))
              )}

              {/* Add New Plant Card → buka modal "Mulai Tanam Baru" */}
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
                        Tambah Tanaman Baru
                      </h3>
                      <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                        Mulai siklus tanam baru di AgriCloud
                      </p>
                    </CardContent>
                  </Card>
                </button>
              )}
            </div>

            {/* Empty state hasil pencarian */}
            {!loading && plants.length > 0 && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500 dark:text-gray-400">
                <Sprout className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
                <p className="font-medium">Tanaman tidak ditemukan</p>
                <p className="text-sm">
                  Tidak ada tanaman dengan nama “{query}”.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Mulai Tanam Baru */}
      <MulaiTanamModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
