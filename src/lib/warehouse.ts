// Tipe & helper bersama untuk fitur Gudang (warehouse-ii, dWarehouse-ii, modal).
// Menyambung backend trio Gudang (Warehouse/Items/Movements) yang sudah selesai.
import { API_BASE_URL } from '@/lib/api'

// Origin backend (tanpa /api) untuk merangkai URL aset (/storage/...).
// API_BASE_URL bisa undefined kalau VITE_API_URL tak di-set — pakai '' agar
// tak crash; request tetap gagal terang-terangan, bukan nyasar ke localhost.
const ASSET_ORIGIN = (API_BASE_URL ?? '').replace(/\/api\/?$/, '')

// Backend memetakan thumbnail dari Storage::url() yang bisa berupa path relatif
// (`/storage/...`). Rangkai ke origin backend; URL absolut dibiarkan apa adanya.
export function assetUrl(path?: string | null): string | undefined {
  if (!path) return undefined
  if (/^https?:\/\//.test(path)) return path
  return `${ASSET_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`
}

/* ------------------------------- Warehouse -------------------------------- */

// Bentuk respons mentah dari WarehouseResource backend.
export interface IWarehouseResponse {
  id: number
  name: string
  thumbnail: string | null
  address: string | null
  capacity: number | null
  description?: string | null
  items_count?: number
  stock_total?: number
  location: { latitude: number | null; longitude: number | null } | null
  owner: { id: number; name: string | null } | null
  created_at?: string
  updated_at?: string
}

// Bentuk yang dipakai komponen FE.
export interface IWarehouse {
  id: number
  name: string
  address: string
  capacity: number
  items: number // = items_count (jumlah jenis barang)
  stockTotal: number // = stock_total (Σ stok semua barang)
  owner: string
  thumbnail?: string
  latitude?: number
  longitude?: number
  description?: string
}

export function mapWarehouse(w: IWarehouseResponse): IWarehouse {
  return {
    id: w.id,
    name: w.name,
    address: w.address ?? '',
    capacity: w.capacity ?? 0,
    items: w.items_count ?? 0,
    stockTotal: w.stock_total ?? 0,
    owner: w.owner?.name ?? 'Tidak diketahui',
    thumbnail: assetUrl(w.thumbnail),
    latitude: w.location?.latitude ?? undefined,
    longitude: w.location?.longitude ?? undefined,
    description: w.description ?? undefined,
  }
}

/* ---------------------------------- Items --------------------------------- */

export interface IItem {
  id: number
  name: string
  unit: string
  stock: number
  category: string | null
  category_id: number | null
  warehouse_id: number
}

/* -------------------------------- Movements ------------------------------- */

export type MovementDirection = 'Masuk' | 'Keluar' | 'Transfer'

// Bentuk respons mentah dari MovementResource backend.
export interface IMovementResponse {
  date: string
  item_id: number
  item_name: string | null
  category: string | null
  qty: number
  note: string | null
  status: string | null
  direction: MovementDirection
  created_at: string
}

/* --------------------------------- Helpers -------------------------------- */

export type CapacityTone = 'success' | 'warning' | 'danger'

// Status gudang diturunkan dari persentase kapasitas terpakai.
export function capacityTone(usage: number): {
  tone: CapacityTone
  label: string
} {
  if (usage >= 80) return { tone: 'danger', label: 'Hampir penuh' }
  if (usage >= 55) return { tone: 'warning', label: 'Cukup terisi' }
  return { tone: 'success', label: 'Lega' }
}

// Persentase terpakai (0–100, dibatasi), aman saat kapasitas 0.
export function usagePercent(items: number, capacity: number): number {
  if (!capacity) return 0
  return Math.min(100, Math.round((items / capacity) * 100))
}

// Alamat dari reverse-geocode Nominatim berformat
// "Pondok Cina, Beji, Depok, West Java, Java, 16340, Indonesia".
// Untuk tampilan ringkas, ambil hanya segmen pertama (level kelurahan/desa).
export function localityLabel(address: string): string {
  const first = address.split(',')[0]?.trim()
  return first || address
}

// Timestamp ISO → dd/mm/yyyy (lokal id-ID) untuk baris riwayat.
export function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
