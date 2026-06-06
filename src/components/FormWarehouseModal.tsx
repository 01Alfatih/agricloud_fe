import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import {
  AlertCircle,
  Boxes,
  ImagePlus,
  Loader2,
  LocateFixed,
  MapPin,
  Trash2,
  Warehouse as WarehouseIcon,
  X,
} from 'lucide-react'
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { reverseGeocode } from '@/utils/reversGeocode'

const DEFAULT_CENTER: [number, number] = [-6.2, 106.81] // Jakarta
const GREEN = '#16a34a'

// ── Map picker titik tunggal (gudang = satu lokasi, bukan poligon) ──

function ClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function Recenter({ center }: { center: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.setView(center, Math.max(map.getZoom(), 16))
  }, [center, map])
  return null
}

function WarehouseMapPicker({
  marker,
  onPick,
  initialCenter,
  recenterTo,
}: {
  marker: [number, number] | null
  onPick: (lat: number, lng: number) => void
  initialCenter: [number, number]
  recenterTo: [number, number] | null
}) {
  return (
    <MapContainer
      center={marker ?? initialCenter}
      zoom={15}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onPick} />
      <Recenter center={recenterTo} />
      {marker && (
        <CircleMarker
          center={marker}
          radius={8}
          pathOptions={{
            color: '#ffffff',
            weight: 2,
            fillColor: GREEN,
            fillOpacity: 1,
          }}
        />
      )}
    </MapContainer>
  )
}

// ── Data gudang untuk mode edit (opsional). Tanpa ini = mode tambah. ──
export interface WarehouseInitialData {
  id: number
  name: string
  address: string
  capacity: number
  latitude?: string | number
  longitude?: string | number
  thumbnailUrl?: string | null
}

// Hasil yang dikirim balik ke pemanggil setelah simpan.
export interface WarehouseFormResult {
  id?: number
  name: string
  address: string
  capacity: number
  latitude: number | null
  longitude: number | null
  thumbnail: File | null
  thumbnailUrl: string | null
}

interface FormWarehouseModalProps {
  open: boolean
  onClose: () => void
  // Kalau diisi → modal jadi mode EDIT, isian di-prefill.
  warehouse?: WarehouseInitialData
  // Dipanggil dengan data gudang setelah berhasil divalidasi & disimpan.
  onSave?: (data: WarehouseFormResult) => void
}

type FieldError = Partial<
  Record<'name' | 'address' | 'capacity' | 'location' | 'thumbnail', string>
>

interface FormState {
  name: string
  address: string
  capacity: string
  thumbnail: File | null
}

export function FormWarehouseModal({
  open,
  onClose,
  warehouse,
  onSave,
}: FormWarehouseModalProps) {
  const isEdit = !!warehouse
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<FormState>({
    name: '',
    address: '',
    capacity: '',
    thumbnail: null,
  })
  const [marker, setMarker] = useState<[number, number] | null>(null)
  const [recenterTo, setRecenterTo] = useState<[number, number] | null>(null)
  const [addressEdited, setAddressEdited] = useState(false)

  const [errors, setErrors] = useState<FieldError>({})
  const [submitting, setSubmitting] = useState(false)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [existingThumb, setExistingThumb] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const [geocoding, setGeocoding] = useState(false)
  const [locating, setLocating] = useState(false)

  // Reset / prefill setiap kali modal dibuka.
  useEffect(() => {
    if (!open) return
    setForm({
      name: warehouse?.name ?? '',
      address: warehouse?.address ?? '',
      capacity: warehouse ? String(warehouse.capacity) : '',
      thumbnail: null,
    })
    setAddressEdited(!!warehouse?.address)
    setErrors({})
    setPreviewUrl(null)
    setExistingThumb(warehouse?.thumbnailUrl ?? null)
    setDragOver(false)
    if (warehouse?.latitude && warehouse?.longitude) {
      const pos: [number, number] = [
        Number(warehouse.latitude),
        Number(warehouse.longitude),
      ]
      setMarker(pos)
      setRecenterTo(pos)
    } else {
      setMarker(null)
      setRecenterTo(null)
    }
  }, [open, warehouse])

  // Tutup dengan ESC + kunci scroll body.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  // Bersihkan object URL preview saat berganti / unmount.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  // Reverse-geocode (debounce) dari marker → isi alamat selama belum diedit manual.
  useEffect(() => {
    if (!marker || addressEdited) {
      setGeocoding(false)
      return
    }
    setGeocoding(true)
    const timer = setTimeout(async () => {
      try {
        const address = await reverseGeocode(
          String(marker[0]),
          String(marker[1]),
        )
        setForm((prev) => ({ ...prev, address }))
        setErrors((prev) => ({ ...prev, address: undefined }))
      } catch {
        // Biarkan user isi manual kalau gagal.
      } finally {
        setGeocoding(false)
      }
    }, 700)
    return () => clearTimeout(timer)
  }, [marker, addressEdited])

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target
    setForm((prev) => ({ ...prev, [id]: value }))
    setErrors((prev) => ({ ...prev, [id]: undefined }))
  }

  // ── Peta ──
  const pickPoint = (lat: number, lng: number) => {
    setMarker([lat, lng])
    setAddressEdited(false) // izinkan reverse-geocode mengisi ulang
    setErrors((prev) => ({ ...prev, location: undefined }))
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setErrors((prev) => ({
        ...prev,
        location: 'Browser tidak mendukung geolokasi.',
      }))
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        pickPoint(pos.coords.latitude, pos.coords.longitude)
        setRecenterTo([pos.coords.latitude, pos.coords.longitude])
        setLocating(false)
      },
      () => {
        setErrors((prev) => ({
          ...prev,
          location: 'Gagal mengambil lokasi. Izinkan akses lokasi.',
        }))
        setLocating(false)
      },
    )
  }

  // ── Gambar ──
  const applyFile = (file: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, thumbnail: 'File harus berupa gambar.' }))
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setForm((prev) => ({ ...prev, thumbnail: file }))
    setPreviewUrl(URL.createObjectURL(file))
    setExistingThumb(null)
    setErrors((prev) => ({ ...prev, thumbnail: undefined }))
  }
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) =>
    applyFile(e.target.files?.[0] ?? null)
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    applyFile(e.dataTransfer.files?.[0] ?? null)
  }
  const removeImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setExistingThumb(null)
    setForm((prev) => ({ ...prev, thumbnail: null }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const validate = (): FieldError => {
    const next: FieldError = {}
    if (!form.name.trim()) next.name = 'Nama gudang wajib diisi.'
    if (!form.address.trim()) next.address = 'Alamat gudang wajib diisi.'
    if (!form.capacity.trim()) next.capacity = 'Kapasitas wajib diisi.'
    else if (Number.isNaN(Number(form.capacity)) || Number(form.capacity) <= 0)
      next.capacity = 'Kapasitas harus berupa angka lebih dari 0.'
    if (!marker && !isEdit) next.location = 'Tandai lokasi gudang di peta.'
    return next
  }

  const handleSubmit = async () => {
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    // Catatan: backend gudang belum ada. Untuk sekarang data dikembalikan ke
    // pemanggil lewat onSave (mis. update list lokal). Saat endpoint siap,
    // ganti blok ini dengan POST/PUT multipart bergaya FormFieldModal.
    onSave?.({
      id: warehouse?.id,
      name: form.name.trim(),
      address: form.address.trim(),
      capacity: Number(form.capacity),
      latitude: marker
        ? marker[0]
        : warehouse?.latitude != null
          ? Number(warehouse.latitude)
          : null,
      longitude: marker
        ? marker[1]
        : warehouse?.longitude != null
          ? Number(warehouse.longitude)
          : null,
      thumbnail: form.thumbnail,
      thumbnailUrl: previewUrl ?? existingThumb,
    })
    setSubmitting(false)
    onClose()
  }

  if (!open) return null

  const showImage = previewUrl ?? existingThumb

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-warehouse-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#15211a] dark:ring-1 dark:ring-white/10"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#a7d1a7]/50 text-[#0B4619] dark:bg-[#1b2c22] dark:text-[#5cbb70]">
              <WarehouseIcon className="h-5 w-5" />
            </span>
            <h2
              id="form-warehouse-title"
              className="text-base font-semibold text-[#1a472a] dark:text-[#a7d1a7]"
            >
              {isEdit ? 'Edit Gudang' : 'Tambah Gudang Baru'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body (scroll) */}
        <div className="grid grid-cols-1 gap-0 overflow-y-auto lg:grid-cols-2">
          {/* ── Kolom kiri: peta lokasi ── */}
          <div className="flex flex-col bg-gray-50/80 p-6 dark:bg-[#1b2c22]/40">
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Klik di peta untuk menandai lokasi gudang. Alamat akan terisi
              otomatis dan masih bisa Anda sesuaikan.
            </p>

            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#a7d1a7]/50 px-3 py-1 text-xs font-medium text-[#0B4619] dark:bg-[#5cbb70]/15 dark:text-[#5cbb70]">
                {marker ? 'Lokasi ditandai' : 'Belum ditandai'}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={useMyLocation}
                disabled={locating}
                className="ml-auto h-8 gap-1.5 px-3 text-xs"
              >
                {locating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <LocateFixed className="h-3.5 w-3.5" />
                )}
                Lokasi Saya
              </Button>
            </div>

            <div className="h-[260px] overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 lg:flex-1">
              <WarehouseMapPicker
                marker={marker}
                onPick={pickPoint}
                initialCenter={DEFAULT_CENTER}
                recenterTo={recenterTo}
              />
            </div>

            <div className="mt-3 rounded-lg bg-white p-3 shadow-xs dark:bg-[#15211a]">
              <p className="text-xs text-gray-400">Koordinat</p>
              <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                {marker
                  ? `${marker[0].toFixed(5)}, ${marker[1].toFixed(5)}`
                  : '—'}
              </p>
              {marker && (
                <p className="flex items-center gap-1 truncate text-xs text-gray-400">
                  <MapPin className="h-3 w-3 shrink-0 text-[#2a7039] dark:text-[#5cbb70]" />
                  {geocoding ? 'Mencari alamat…' : form.address || '—'}
                </p>
              )}
            </div>

            {errors.location && (
              <p className="mt-2 flex items-center gap-1 text-sm text-red-500">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.location}
              </p>
            )}
          </div>

          {/* ── Kolom kanan: detail ── */}
          <div className="flex flex-col gap-5 p-6">
            {/* Nama */}
            <div className="space-y-1.5">
              <Label
                htmlFor="name"
                className="text-sm text-gray-600 dark:text-gray-300"
              >
                Nama Gudang
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={handleChange}
                aria-invalid={!!errors.name}
                placeholder="Contoh: Gudang Utama Brebes"
                className="dark:border-white/10 dark:text-gray-100"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Alamat */}
            <div className="space-y-1.5">
              <Label
                htmlFor="address"
                className="text-sm text-gray-600 dark:text-gray-300"
              >
                Alamat
              </Label>
              <textarea
                id="address"
                rows={3}
                value={form.address}
                onChange={(e) => {
                  setAddressEdited(true)
                  handleChange(e)
                }}
                aria-invalid={!!errors.address}
                placeholder="Nama jalan, desa, kecamatan, kabupaten…"
                className={`w-full resize-none rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:text-gray-100 ${
                  errors.address
                    ? 'border-destructive focus-visible:border-destructive'
                    : 'border-input focus-visible:border-ring dark:border-white/10'
                }`}
              />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address}</p>
              )}
            </div>

            {/* Kapasitas */}
            <div className="space-y-1.5">
              <Label
                htmlFor="capacity"
                className="text-sm text-gray-600 dark:text-gray-300"
              >
                Kapasitas
              </Label>
              <div className="relative">
                <Boxes className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="capacity"
                  inputMode="numeric"
                  value={form.capacity}
                  onChange={handleChange}
                  aria-invalid={!!errors.capacity}
                  placeholder="Mis. 1000"
                  className="pr-14 pl-9 dark:border-white/10 dark:text-gray-100"
                />
                <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-400">
                  unit
                </span>
              </div>
              {errors.capacity && (
                <p className="text-sm text-red-500">{errors.capacity}</p>
              )}
            </div>

            {/* Foto */}
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-600 dark:text-gray-300">
                Foto Gudang{' '}
                <span className="text-xs font-normal text-gray-400">
                  (opsional)
                </span>
              </Label>
              {showImage ? (
                <div className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
                  <img
                    src={showImage}
                    alt="Preview gudang"
                    className="h-40 w-full object-cover"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={removeImage}
                    className="absolute top-2 right-2 h-8 gap-1 rounded-full px-3 text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Hapus
                  </Button>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) =>
                    (e.key === 'Enter' || e.key === ' ') &&
                    fileInputRef.current?.click()
                  }
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition-colors ${
                    dragOver
                      ? 'border-green-500 bg-green-50 dark:bg-[#5cbb70]/10'
                      : errors.thumbnail
                        ? 'border-red-300 bg-red-50/40'
                        : 'border-gray-300 bg-white hover:border-green-400 hover:bg-green-50/40 dark:border-white/15 dark:bg-transparent dark:hover:bg-white/5'
                  }`}
                >
                  <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-[#a7d1a7]/50 text-[#0B4619] dark:bg-[#5cbb70]/15 dark:text-[#5cbb70]">
                    <ImagePlus className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Klik atau seret gambar
                  </p>
                  <p className="text-xs text-gray-400">JPG / PNG</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {errors.thumbnail && (
                <p className="flex items-center gap-1 text-sm text-red-500">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.thumbnail}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 gap-3 border-t border-gray-100 px-6 py-4 dark:border-white/10">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 dark:border-white/10 dark:bg-transparent dark:text-gray-200 dark:hover:bg-white/5"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 gap-2 bg-[#0B4619] font-medium text-white hover:bg-[#2a7039] dark:bg-[#5cbb70] dark:text-[#0c1410] dark:hover:bg-[#5cbb70]/90"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan…
              </>
            ) : isEdit ? (
              'Simpan Perubahan'
            ) : (
              'Simpan Gudang'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
