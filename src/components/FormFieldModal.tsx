import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import axios from 'axios'
import {
  AlertCircle,
  ImagePlus,
  Loader2,
  LocateFixed,
  MapPin,
  Ruler,
  Sprout,
  Trash2,
  Undo2,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { reverseGeocode } from '@/utils/reversGeocode'
import FieldMapPicker, {
  centroidOf,
  polygonAreaSqMeters,
} from '@/components/FieldMapPicker'
import type { LatLng } from '@/components/FieldMapPicker'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8005/api'
const DEFAULT_CENTER: [number, number] = [-6.2, 106.81] // Jakarta

// Data lahan untuk mode edit (opsional). Tanpa ini = mode tambah.
export interface FieldInitialData {
  id: number
  name: string
  description: string
  area: string
  latitude?: string | number
  longitude?: string | number
  thumbnailUrl?: string | null
  // Titik-titik poligon batas lahan, kalau backend menyimpannya.
  boundary?: Array<[number, number]>
}

interface FormFieldModalProps {
  open: boolean
  onClose: () => void
  // Kalau diisi → modal jadi mode EDIT, isian di-prefill.
  field?: FieldInitialData
  // Dipanggil setelah berhasil simpan (mis. untuk refresh list).
  onSaved?: () => void
}

type FieldError = Partial<
  Record<'name' | 'description' | 'area' | 'location' | 'thumbnail', string>
>

interface FormData {
  name: string
  description: string
  area: string
  thumbnail: File | null
}

export function FormFieldModal({
  open,
  onClose,
  field,
  onSaved,
}: FormFieldModalProps) {
  const isEdit = !!field
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<FormData>({
    name: '',
    description: '',
    area: '',
    thumbnail: null,
  })
  const [points, setPoints] = useState<Array<LatLng>>([])
  const [recenterTo, setRecenterTo] = useState<[number, number] | null>(null)
  const [areaEdited, setAreaEdited] = useState(false)

  const [errors, setErrors] = useState<FieldError>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Preview gambar: object URL untuk file baru, atau URL lama (mode edit).
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [existingThumb, setExistingThumb] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const [addressPreview, setAddressPreview] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [locating, setLocating] = useState(false)

  const area = useMemo(() => polygonAreaSqMeters(points), [points])
  const centroid = useMemo(() => centroidOf(points), [points])

  // Reset / prefill setiap kali modal dibuka.
  useEffect(() => {
    if (!open) return
    setForm({
      name: field?.name ?? '',
      description: field?.description ?? '',
      area: field?.area ?? '',
      thumbnail: null,
    })
    setPoints(field?.boundary?.map(([lat, lng]) => ({ lat, lng })) ?? [])
    setAreaEdited(!!field?.area)
    setErrors({})
    setSubmitError('')
    setPreviewUrl(null)
    setExistingThumb(field?.thumbnailUrl ?? null)
    setDragOver(false)
    // Pusatkan peta ke lokasi lahan saat edit.
    if (field?.latitude && field?.longitude) {
      setRecenterTo([Number(field.latitude), Number(field.longitude)])
    } else {
      setRecenterTo(null)
    }
  }, [open, field])

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

  // Auto-isi luas dari poligon selama user belum override manual.
  useEffect(() => {
    if (!areaEdited && points.length >= 3) {
      setForm((prev) => ({ ...prev, area: String(Math.round(area)) }))
      setErrors((prev) => ({ ...prev, area: undefined, location: undefined }))
    }
  }, [area, points.length, areaEdited])

  // Bersihkan object URL preview saat berganti / unmount.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  // Reverse-geocode (debounce) dari centroid → tampilkan alamat.
  useEffect(() => {
    if (!centroid) {
      setAddressPreview('')
      setGeocoding(false)
      return
    }
    setGeocoding(true)
    const timer = setTimeout(async () => {
      try {
        const address = await reverseGeocode(
          String(centroid.lat),
          String(centroid.lng),
        )
        setAddressPreview(address)
      } catch {
        setAddressPreview('Alamat tidak ditemukan')
      } finally {
        setGeocoding(false)
      }
    }, 700)
    return () => clearTimeout(timer)
  }, [centroid])

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target
    setForm((prev) => ({ ...prev, [id]: value }))
    setErrors((prev) => ({ ...prev, [id]: undefined }))
  }

  // ── Peta ──
  const addPoint = (p: LatLng) => {
    setPoints((prev) => [...prev, p])
    setErrors((prev) => ({ ...prev, location: undefined }))
  }
  const undoPoint = () => setPoints((prev) => prev.slice(0, -1))
  const clearPoints = () => {
    setPoints([])
    setAreaEdited(false)
    setForm((prev) => ({ ...prev, area: '' }))
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

  // Geser peta ke lokasi GPS user (tidak menambah titik).
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

  const validate = (): FieldError => {
    const next: FieldError = {}
    if (!form.name.trim()) next.name = 'Nama lahan wajib diisi.'
    if (!form.description.trim()) next.description = 'Deskripsi wajib diisi.'
    if (points.length < 3 && !isEdit)
      next.location = 'Tandai minimal 3 titik di peta untuk membentuk lahan.'
    if (!form.area.trim()) next.area = 'Luas lahan wajib diisi.'
    else if (Number.isNaN(Number(form.area)))
      next.area = 'Luas lahan harus berupa angka.'
    // Saat edit, gambar lama boleh dipertahankan.
    if (!form.thumbnail && !existingThumb)
      next.thumbnail = 'Gambar lahan wajib dipilih.'
    return next
  }

  const handleSubmit = async () => {
    setSubmitError('')
    const token = localStorage.getItem('token')
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    // Lokasi: pakai centroid baru kalau ada titik, kalau tidak pertahankan lokasi lama (edit).
    const lat =
      centroid?.lat ?? (field?.latitude ? Number(field.latitude) : null)
    const lng =
      centroid?.lng ?? (field?.longitude ? Number(field.longitude) : null)
    if (lat === null || lng === null) {
      setErrors((prev) => ({
        ...prev,
        location: 'Tandai minimal 3 titik di peta untuk membentuk lahan.',
      }))
      return
    }

    const data = new FormData()
    data.append('name', form.name)
    data.append('description', form.description)
    data.append('area', form.area)
    data.append('latitude', String(lat))
    data.append('longitude', String(lng))
    if (points.length >= 3) {
      data.append('boundary', JSON.stringify(points.map((p) => [p.lat, p.lng])))
    }
    if (form.thumbnail) data.append('thumbnail', form.thumbnail)
    // Laravel: spoof method PUT untuk multipart saat edit.
    if (isEdit) data.append('_method', 'PUT')

    setSubmitting(true)
    try {
      const url = isEdit
        ? `${API_BASE_URL}/myfields/${field!.id}`
        : `${API_BASE_URL}/myfields`
      await axios.post(url, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })
      onSaved?.()
      onClose()
    } catch (error) {
      console.error('Gagal menyimpan lahan:', error)
      setSubmitError('Terjadi kesalahan saat menyimpan lahan. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const areaHa = area / 10000
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
        aria-labelledby="form-field-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#15211a] dark:ring-1 dark:ring-white/10"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-[#1b2c22] dark:text-[#5cbb70]">
              <Sprout className="h-5 w-5" />
            </span>
            <h2
              id="form-field-title"
              className="text-base font-semibold text-gray-800 dark:text-[#a7d1a7]"
            >
              {isEdit ? 'Edit Lahan' : 'Tambah Lahan Baru'}
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
          {/* ── Kolom kiri: peta ── */}
          <div className="flex flex-col bg-gray-50/80 p-6 dark:bg-[#1b2c22]/40">
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Klik di peta untuk menaruh titik. Minimal 3 titik untuk membentuk
              area — luas dihitung otomatis.
            </p>

            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-[#5cbb70]/15 dark:text-[#5cbb70]">
                {points.length} titik
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={undoPoint}
                disabled={points.length === 0}
                className="h-8 gap-1.5 px-3 text-xs"
              >
                <Undo2 className="h-3.5 w-3.5" />
                Undo
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={clearPoints}
                disabled={points.length === 0}
                className="h-8 gap-1.5 px-3 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Reset
              </Button>
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
              <FieldMapPicker
                points={points}
                onAddPoint={addPoint}
                initialCenter={DEFAULT_CENTER}
                recenterTo={recenterTo}
              />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white p-3 shadow-xs dark:bg-[#15211a]">
                <p className="text-xs text-gray-400">Perkiraan Luas</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {points.length >= 3
                    ? `${Math.round(area).toLocaleString('id-ID')} m²`
                    : '—'}
                </p>
                {points.length >= 3 && areaHa >= 0.01 && (
                  <p className="text-xs text-gray-400">
                    ≈{' '}
                    {areaHa.toLocaleString('id-ID', {
                      maximumFractionDigits: 2,
                    })}{' '}
                    ha
                  </p>
                )}
              </div>
              <div className="rounded-lg bg-white p-3 shadow-xs dark:bg-[#15211a]">
                <p className="text-xs text-gray-400">Lokasi (titik tengah)</p>
                <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {centroid
                    ? `${centroid.lat.toFixed(5)}, ${centroid.lng.toFixed(5)}`
                    : '—'}
                </p>
                {centroid && (
                  <p className="flex items-center gap-1 truncate text-xs text-gray-400">
                    <MapPin className="h-3 w-3 shrink-0 text-green-600" />
                    {geocoding ? 'Mencari alamat…' : addressPreview || '—'}
                  </p>
                )}
              </div>
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
                Nama Lahan
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={handleChange}
                aria-invalid={!!errors.name}
                placeholder="Contoh: Lahan Cabai Brebes"
                className="dark:border-white/10 dark:text-gray-100"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Deskripsi */}
            <div className="space-y-1.5">
              <Label
                htmlFor="description"
                className="text-sm text-gray-600 dark:text-gray-300"
              >
                Deskripsi
              </Label>
              <textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={handleChange}
                aria-invalid={!!errors.description}
                placeholder="Jenis tanaman, kondisi tanah, catatan lainnya…"
                className={`w-full resize-none rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:text-gray-100 ${
                  errors.description
                    ? 'border-destructive focus-visible:border-destructive'
                    : 'border-input focus-visible:border-ring dark:border-white/10'
                }`}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            {/* Luas */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="area"
                  className="text-sm text-gray-600 dark:text-gray-300"
                >
                  Luas Lahan
                </Label>
                {areaEdited && points.length >= 3 && (
                  <button
                    type="button"
                    onClick={() => {
                      setAreaEdited(false)
                      setForm((prev) => ({
                        ...prev,
                        area: String(Math.round(area)),
                      }))
                    }}
                    className="text-xs text-green-600 hover:underline"
                  >
                    Pakai hasil peta
                  </button>
                )}
              </div>
              <div className="relative">
                <Ruler className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="area"
                  inputMode="numeric"
                  value={form.area}
                  onChange={(e) => {
                    setAreaEdited(true)
                    handleChange(e)
                  }}
                  aria-invalid={!!errors.area}
                  placeholder="Otomatis dari peta"
                  className="pr-12 pl-9 dark:border-white/10 dark:text-gray-100"
                />
                <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-400">
                  m²
                </span>
              </div>
              {errors.area && (
                <p className="text-sm text-red-500">{errors.area}</p>
              )}
            </div>

            {/* Foto */}
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-600 dark:text-gray-300">
                Foto Lahan
              </Label>
              {showImage ? (
                <div className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
                  <img
                    src={showImage}
                    alt="Preview lahan"
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
                  <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-[#5cbb70]/15 dark:text-[#5cbb70]">
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

            {submitError && (
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-500/25 dark:bg-red-500/15 dark:text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}
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
            className="flex-1 gap-2 bg-green-600 font-medium text-white hover:bg-green-700"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan…
              </>
            ) : isEdit ? (
              'Simpan Perubahan'
            ) : (
              'Simpan Lahan'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
