import { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import {
  AlertCircle,
  CalendarDays,
  Loader2,
  MapPin,
  Sprout,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const API_BASE_URL = 'http://localhost:8005/api'

interface ITemplate {
  id: number
  name: string
  description: string
}

interface IField {
  id: number
  name: string
}

interface MulaiTanamModalProps {
  open: boolean
  onClose: () => void
  // Dipanggil setelah berhasil membuat siklus tanam (mis. untuk refresh list).
  onCreated?: () => void
  // Kalau diisi (mis. dibuka dari detail lahan) → lahan otomatis terpilih & dikunci.
  field?: IField
}

type FormError = Partial<
  Record<'template' | 'plant' | 'field' | 'date', string>
>

export function MulaiTanamModal({
  open,
  onClose,
  onCreated,
  field,
}: MulaiTanamModalProps) {
  const [templates, setTemplates] = useState<Array<ITemplate>>([])
  const [fields, setFields] = useState<Array<IField>>([])

  const [templateId, setTemplateId] = useState<number | ''>('')
  const [plant, setPlant] = useState('')
  const [fieldId, setFieldId] = useState<number | ''>('')
  const [startDate, setStartDate] = useState('')

  const [errors, setErrors] = useState<FormError>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Reset isian tiap kali modal dibuka.
  useEffect(() => {
    if (!open) return
    setTemplateId('')
    setPlant('')
    // Lahan dikunci ke `field` kalau modal dibuka dari detail lahan.
    setFieldId(field?.id ?? '')
    setStartDate('')
    setErrors({})
    setSubmitError('')
  }, [open, field])

  // Tutup dengan ESC + kunci scroll body selama modal terbuka.
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

  // Ambil template tanaman + lahan milik user saat modal dibuka.
  useEffect(() => {
    if (!open) return
    const token = localStorage.getItem('token')
    const headers = { Authorization: `Bearer ${token}` }

    axios
      .get<{ data: Array<ITemplate> }>(`${API_BASE_URL}/crop-templates`, {
        headers,
      })
      .then((res) => setTemplates(res.data.data ?? []))
      .catch((err) => console.error('Gagal memuat template:', err))

    axios
      .get<{ data: Array<IField> }>(`${API_BASE_URL}/myfields`, { headers })
      .then((res) => setFields(res.data.data ?? []))
      .catch((err) => console.error('Gagal memuat lahan:', err))
  }, [open])

  // Pilih template → auto-isi jenis tanaman (boleh diubah manual).
  const handleTemplateChange = (value: string) => {
    const id = value ? Number(value) : ''
    setTemplateId(id)
    setErrors((prev) => ({ ...prev, template: undefined }))
    const tpl = templates.find((t) => t.id === id)
    if (tpl) {
      setPlant(tpl.name)
      setErrors((prev) => ({ ...prev, plant: undefined }))
    }
  }

  const validate = (): FormError => {
    const next: FormError = {}
    if (!templateId) next.template = 'Pilih template tanaman.'
    if (!plant.trim()) next.plant = 'Jenis tanaman wajib diisi.'
    if (!fieldId) next.field = 'Pilih lokasi lahan.'
    if (!startDate) next.date = 'Tanggal mulai tanam wajib diisi.'
    return next
  }

  const handleSubmit = async () => {
    setSubmitError('')
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const token = localStorage.getItem('token')
    setSubmitting(true)
    try {
      // Kontrak backend POST /cycles: land_id, crop_id (exists:crops), name,
      // start_date (nullable). `crop-templates` adalah Crop, jadi templateId = crop_id.
      await axios.post(
        `${API_BASE_URL}/cycles`,
        {
          land_id: fieldId,
          crop_id: templateId,
          name: plant,
          start_date: startDate,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      toast.success('Siklus tanam berhasil dimulai')
      onCreated?.()
      onClose()
    } catch (error) {
      console.error('Gagal memulai tanam:', error)
      // Petakan error validasi Laravel (422) ke field form bila ada.
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        const apiErrors = error.response.data?.errors as
          | Record<string, Array<string>>
          | undefined
        if (apiErrors) {
          setErrors((prev) => ({
            ...prev,
            field: apiErrors.land_id?.[0] ?? prev.field,
            template: apiErrors.crop_id?.[0] ?? prev.template,
            plant: apiErrors.name?.[0] ?? prev.plant,
            date: apiErrors.start_date?.[0] ?? prev.date,
          }))
        }
        setSubmitError(
          error.response.data?.message ?? 'Periksa kembali isian formulir.',
        )
        toast.error('Periksa kembali isian formulir.')
      } else {
        setSubmitError('Gagal memulai tanam. Coba lagi sebentar.')
        toast.error('Gagal memulai tanam. Coba lagi sebentar.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

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
        aria-labelledby="mulai-tanam-title"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#15211a] dark:ring-1 dark:ring-white/10"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-[#1b2c22] dark:text-[#5cbb70]">
              <Sprout className="h-5 w-5" />
            </span>
            <h2
              id="mulai-tanam-title"
              className="text-base font-semibold text-gray-800 dark:text-[#a7d1a7]"
            >
              Mulai Tanam Baru
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

        {/* Body */}
        <div className="space-y-5 px-6 py-5">
          {/* Template */}
          <div className="space-y-1.5">
            <Label
              htmlFor="template"
              className="text-sm text-gray-600 dark:text-gray-300"
            >
              Pilih Template
            </Label>
            <select
              id="template"
              value={templateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              aria-invalid={!!errors.template}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-gray-700 shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:border-white/10 dark:text-gray-100"
            >
              <option value="" className="dark:bg-[#15211a]">
                -- Pilih Template --
              </option>
              {templates.map((t) => (
                <option key={t.id} value={t.id} className="dark:bg-[#15211a]">
                  {t.name}
                </option>
              ))}
            </select>
            {errors.template && (
              <p className="text-sm text-red-500">{errors.template}</p>
            )}
          </div>

          {/* Jenis Tanaman */}
          <div className="space-y-1.5">
            <Label
              htmlFor="plant"
              className="text-sm text-gray-600 dark:text-gray-300"
            >
              Jenis Tanaman
            </Label>
            <Input
              id="plant"
              value={plant}
              onChange={(e) => {
                setPlant(e.target.value)
                setErrors((prev) => ({ ...prev, plant: undefined }))
              }}
              aria-invalid={!!errors.plant}
              placeholder="Contoh: Cabai Merah"
              className="dark:border-white/10 dark:text-gray-100"
            />
            {errors.plant && (
              <p className="text-sm text-red-500">{errors.plant}</p>
            )}
          </div>

          {/* Lokasi Lahan */}
          <div className="space-y-1.5">
            <Label
              htmlFor="field"
              className="text-sm text-gray-600 dark:text-gray-300"
            >
              Lokasi Lahan
            </Label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              {field ? (
                // Dibuka dari detail lahan → lahan terkunci, gak bisa diganti.
                <div className="flex h-9 w-full items-center rounded-md border border-input bg-gray-50 pr-3 pl-9 text-sm text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-100">
                  {field.name}
                </div>
              ) : (
                <select
                  id="field"
                  value={fieldId}
                  onChange={(e) => {
                    setFieldId(e.target.value ? Number(e.target.value) : '')
                    setErrors((prev) => ({ ...prev, field: undefined }))
                  }}
                  aria-invalid={!!errors.field}
                  className="h-9 w-full rounded-md border border-input bg-transparent pr-3 pl-9 text-sm text-gray-700 shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:border-white/10 dark:text-gray-100"
                >
                  <option value="" className="dark:bg-[#15211a]">
                    -- Pilih Lahan --
                  </option>
                  {fields.map((f) => (
                    <option
                      key={f.id}
                      value={f.id}
                      className="dark:bg-[#15211a]"
                    >
                      {f.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {errors.field && (
              <p className="text-sm text-red-500">{errors.field}</p>
            )}
          </div>

          {/* Tanggal Mulai */}
          <div className="space-y-1.5">
            <Label
              htmlFor="date"
              className="text-sm text-gray-600 dark:text-gray-300"
            >
              Tanggal Mulai Tanam
            </Label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setErrors((prev) => ({ ...prev, date: undefined }))
                }}
                aria-invalid={!!errors.date}
                className="pl-9 dark:border-white/10 dark:text-gray-100"
              />
            </div>
            {errors.date && (
              <p className="text-sm text-red-500">{errors.date}</p>
            )}
          </div>

          {submitError && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-500/25 dark:bg-red-500/15 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-gray-100 px-6 py-4 dark:border-white/10">
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
                Memulai…
              </>
            ) : (
              'Mulai'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
