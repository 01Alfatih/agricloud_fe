import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Hash,
  Loader2,
  Package,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type Movement = 'Masuk' | 'Keluar'

// Jenis barang yang didukung (selaras dengan ITEM_TYPE_TONE di detail gudang).
const ITEM_TYPES = ['Pupuk', 'Bibit', 'Pestisida', 'Alat', 'Hasil Panen']

export interface ItemFormResult {
  date: string // format tampilan dd/mm/yyyy
  itemName: string
  qty: number
  type: string
  movement: Movement
}

interface FormItemModalProps {
  open: boolean
  onClose: () => void
  // Menentukan judul & arah transaksi: 'Masuk' (tambah) / 'Keluar' (gunakan).
  movement: Movement
  // Daftar nama barang yang sudah ada → jadi saran (datalist).
  suggestions?: Array<string>
  onSave?: (data: ItemFormResult) => void
}

type FieldError = Partial<Record<'itemName' | 'qty' | 'type' | 'date', string>>

interface FormState {
  itemName: string
  qty: string
  type: string
  date: string // yyyy-mm-dd dari <input type="date">
}

// yyyy-mm-dd → dd/mm/yyyy (selaras dengan baris riwayat yang sudah ada).
function toDisplayDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

// Tanggal hari ini dalam format yyyy-mm-dd untuk nilai awal input.
function todayISO(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function FormItemModal({
  open,
  onClose,
  movement,
  suggestions = [],
  onSave,
}: FormItemModalProps) {
  const isMasuk = movement === 'Masuk'

  const [form, setForm] = useState<FormState>({
    itemName: '',
    qty: '',
    type: '',
    date: '',
  })
  const [errors, setErrors] = useState<FieldError>({})
  const [submitting, setSubmitting] = useState(false)

  // Reset setiap kali modal dibuka.
  useEffect(() => {
    if (!open) return
    setForm({ itemName: '', qty: '', type: '', date: todayISO() })
    setErrors({})
  }, [open, movement])

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

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setForm((prev) => ({ ...prev, [id]: value }))
    setErrors((prev) => ({ ...prev, [id]: undefined }))
  }

  const pickType = (type: string) => {
    setForm((prev) => ({ ...prev, type }))
    setErrors((prev) => ({ ...prev, type: undefined }))
  }

  const validate = (): FieldError => {
    const next: FieldError = {}
    if (!form.itemName.trim()) next.itemName = 'Nama barang wajib diisi.'
    if (!form.qty.trim()) next.qty = 'Jumlah wajib diisi.'
    else if (Number.isNaN(Number(form.qty)) || Number(form.qty) <= 0)
      next.qty = 'Jumlah harus berupa angka lebih dari 0.'
    if (!form.type) next.type = 'Pilih jenis barang.'
    if (!form.date) next.date = 'Tanggal wajib diisi.'
    return next
  }

  const handleSubmit = () => {
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    // Catatan: backend gudang/inventory belum ada. Data dikembalikan ke
    // pemanggil lewat onSave (update list lokal). Ganti dengan POST saat siap.
    onSave?.({
      date: toDisplayDate(form.date),
      itemName: form.itemName.trim(),
      qty: Number(form.qty),
      type: form.type,
      movement,
    })
    setSubmitting(false)
    onClose()
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
        aria-labelledby="form-item-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#15211a] dark:ring-1 dark:ring-white/10"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full',
                isMasuk
                  ? 'bg-green-100 text-green-600 dark:bg-[#1b2c22] dark:text-[#5cbb70]'
                  : 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
              )}
            >
              {isMasuk ? (
                <ArrowDownLeft className="h-5 w-5" />
              ) : (
                <ArrowUpRight className="h-5 w-5" />
              )}
            </span>
            <h2
              id="form-item-title"
              className="text-base font-semibold text-[#1a472a] dark:text-[#a7d1a7]"
            >
              {isMasuk ? 'Tambah Barang' : 'Gunakan Barang'}
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
        <div className="flex flex-col gap-5 overflow-y-auto p-6">
          {/* Nama Barang */}
          <div className="space-y-1.5">
            <Label
              htmlFor="itemName"
              className="text-sm text-gray-600 dark:text-gray-300"
            >
              Nama Barang
            </Label>
            <div className="relative">
              <Package className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="itemName"
                list="item-suggestions"
                value={form.itemName}
                onChange={handleChange}
                aria-invalid={!!errors.itemName}
                placeholder="Contoh: Pupuk NPK Mutiara"
                className="pl-9 dark:border-white/10 dark:text-gray-100"
              />
              {suggestions.length > 0 && (
                <datalist id="item-suggestions">
                  {suggestions.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              )}
            </div>
            {errors.itemName && (
              <p className="text-sm text-red-500">{errors.itemName}</p>
            )}
          </div>

          {/* Jumlah + Tanggal */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="qty"
                className="text-sm text-gray-600 dark:text-gray-300"
              >
                Jumlah
              </Label>
              <div className="relative">
                <Hash className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="qty"
                  inputMode="numeric"
                  value={form.qty}
                  onChange={handleChange}
                  aria-invalid={!!errors.qty}
                  placeholder="0"
                  className="pr-10 pl-9 dark:border-white/10 dark:text-gray-100"
                />
                <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-400">
                  unit
                </span>
              </div>
              {errors.qty && (
                <p className="text-sm text-red-500">{errors.qty}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="date"
                className="text-sm text-gray-600 dark:text-gray-300"
              >
                Tanggal
              </Label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  aria-invalid={!!errors.date}
                  className="pl-9 dark:border-white/10 dark:text-gray-100 dark:[color-scheme:dark]"
                />
              </div>
              {errors.date && (
                <p className="text-sm text-red-500">{errors.date}</p>
              )}
            </div>
          </div>

          {/* Jenis Barang */}
          <div className="space-y-1.5">
            <Label className="text-sm text-gray-600 dark:text-gray-300">
              Jenis Barang
            </Label>
            <div className="flex flex-wrap gap-2">
              {ITEM_TYPES.map((type) => {
                const active = form.type === type
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => pickType(type)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                      active
                        ? 'border-[#0B4619] bg-[#0B4619] text-white dark:border-[#5cbb70] dark:bg-[#5cbb70] dark:text-[#0c1410]'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-[#2a7039] hover:text-[#0B4619] dark:border-white/15 dark:bg-transparent dark:text-gray-300 dark:hover:border-[#5cbb70] dark:hover:text-[#5cbb70]',
                    )}
                  >
                    {type}
                  </button>
                )
              })}
            </div>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type}</p>
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
            className={cn(
              'flex-1 gap-2 font-medium text-white',
              isMasuk
                ? 'bg-[#0B4619] hover:bg-[#2a7039] dark:bg-[#5cbb70] dark:text-[#0c1410] dark:hover:bg-[#5cbb70]/90'
                : 'bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-600',
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan…
              </>
            ) : isMasuk ? (
              'Tambah Barang'
            ) : (
              'Gunakan Barang'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
