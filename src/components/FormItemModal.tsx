import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Hash,
  Loader2,
  Package,
  Ruler,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ChangeEvent } from 'react'
import type { IItem } from '@/lib/warehouse'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

export type Movement = 'Masuk' | 'Keluar'

// Kategori barang. Tak ada GET /categories di backend → chip hardcoded; nama
// dikirim sbg `category` saat buat item baru (backend firstOrCreate).
const ITEM_TYPES = ['Pupuk', 'Bibit', 'Pestisida', 'Alat', 'Hasil Panen']

interface FormItemModalProps {
  open: boolean
  onClose: () => void
  // Menentukan judul & arah transaksi: 'Masuk' (tambah) / 'Keluar' (gunakan).
  movement: Movement
  // Gudang aktif + daftar barang yang sudah ada (untuk dipilih saat transaksi).
  warehouseId: number
  items: Array<IItem>
  // Dipanggil setelah transaksi/barang berhasil disimpan (parent refetch).
  onSaved?: () => void
}

// Masuk: tambah stok barang lama, atau daftarkan barang baru.
type Mode = 'existing' | 'new'

type FieldError = Partial<
  Record<'item' | 'qty' | 'name' | 'unit' | 'type', string>
>

export function FormItemModal({
  open,
  onClose,
  movement,
  warehouseId,
  items,
  onSaved,
}: FormItemModalProps) {
  const isMasuk = movement === 'Masuk'

  const [mode, setMode] = useState<Mode>('existing')
  const [itemId, setItemId] = useState('')
  const [qty, setQty] = useState('')
  // Field khusus barang baru.
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')
  const [type, setType] = useState('')

  const [errors, setErrors] = useState<FieldError>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Keluar selalu pilih barang lama. Masuk default ke barang lama bila ada.
  const effectiveMode: Mode = isMasuk ? mode : 'existing'

  const selectedItem = useMemo(
    () => items.find((it) => String(it.id) === itemId) ?? null,
    [items, itemId],
  )

  // Reset setiap kali modal dibuka.
  useEffect(() => {
    if (!open) return
    setMode(items.length > 0 ? 'existing' : 'new')
    setItemId(items.length > 0 ? String(items[0].id) : '')
    setQty('')
    setName('')
    setUnit('')
    setType('')
    setErrors({})
    setSubmitError('')
  }, [open, movement, items])

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

  const validate = (): FieldError => {
    const next: FieldError = {}
    const qtyNum = Number(qty)
    if (!qty.trim()) next.qty = 'Jumlah wajib diisi.'
    else if (Number.isNaN(qtyNum) || qtyNum <= 0)
      next.qty = 'Jumlah harus berupa angka lebih dari 0.'

    if (effectiveMode === 'existing') {
      if (!itemId) next.item = 'Pilih barang terlebih dahulu.'
      // Validasi stok keluar di sisi klien (backend tetap penjaga akhir).
      if (
        movement === 'Keluar' &&
        selectedItem &&
        !Number.isNaN(qtyNum) &&
        qtyNum > selectedItem.stock
      )
        next.qty = `Stok tidak cukup (tersedia ${selectedItem.stock}).`
    } else {
      if (!name.trim()) next.name = 'Nama barang wajib diisi.'
      if (!unit.trim()) next.unit = 'Satuan wajib diisi.'
      if (!type) next.type = 'Pilih jenis barang.'
    }
    return next
  }

  const handleSubmit = async () => {
    setSubmitError('')
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      if (effectiveMode === 'new') {
        // Barang baru → daftarkan item (stok 0), lalu catat stok awal sebagai
        // transaksi "Masuk" agar muncul di riwayat & terhitung di Barang Masuk.
        const res = await api.post<{ data?: { id: number } } & { id?: number }>(
          `/warehouses/${warehouseId}/items`,
          { name: name.trim(), unit: unit.trim(), stock: 0, category: type },
        )
        const newId = res.data.data?.id ?? res.data.id
        if (newId != null) {
          await api.post('/movements', {
            item_id: newId,
            type: 'in',
            quantity: Number(qty),
          })
        }
        toast.success(`Barang "${name.trim()}" ditambahkan.`)
      } else {
        // Transaksi stok pada barang yang sudah ada.
        await api.post('/movements', {
          item_id: Number(itemId),
          type: isMasuk ? 'in' : 'out',
          quantity: Number(qty),
        })
        toast.success(
          isMasuk ? 'Stok barang ditambah.' : 'Barang berhasil digunakan.',
        )
      }
      onSaved?.()
      onClose()
    } catch (error: unknown) {
      // Backend balas 422 dgn pesan spesifik (mis. "Stok tidak cukup.").
      const err = error as {
        response?: { data?: { message?: string } }
      }
      const msg = err.response?.data?.message
      console.error('Gagal menyimpan transaksi barang:', error)
      if (msg) setErrors((prev) => ({ ...prev, qty: msg }))
      else setSubmitError('Terjadi kesalahan saat menyimpan. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const noItems = items.length === 0

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
          {/* Toggle mode (hanya saat Masuk) */}
          {isMasuk && (
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1 dark:bg-white/5">
              {(['existing', 'new'] as const).map((m) => {
                const active = mode === m
                const disabled = m === 'existing' && noItems
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setMode(m)
                      setErrors({})
                    }}
                    className={cn(
                      'rounded-md py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                      active
                        ? 'bg-white text-[#0B4619] shadow-sm dark:bg-[#1b2c22] dark:text-[#5cbb70]'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                    )}
                  >
                    {m === 'existing' ? 'Barang Lama' : 'Barang Baru'}
                  </button>
                )
              })}
            </div>
          )}

          {effectiveMode === 'existing' ? (
            <>
              {/* Pilih barang */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="item"
                  className="text-sm text-gray-600 dark:text-gray-300"
                >
                  Pilih Barang
                </Label>
                {noItems ? (
                  <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/15 dark:text-amber-300">
                    Belum ada barang di gudang ini.
                    {isMasuk ? ' Tambahkan barang baru dulu.' : ''}
                  </p>
                ) : (
                  <div className="relative">
                    <Package className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <select
                      id="item"
                      value={itemId}
                      onChange={(e) => {
                        setItemId(e.target.value)
                        setErrors((prev) => ({ ...prev, item: undefined }))
                      }}
                      aria-invalid={!!errors.item}
                      className="h-9 w-full rounded-md border border-input bg-transparent pr-3 pl-9 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:border-white/10 dark:text-gray-100 dark:[color-scheme:dark]"
                    >
                      {items.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.name} — stok {it.stock} {it.unit}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {errors.item && (
                  <p className="text-sm text-red-500">{errors.item}</p>
                )}
                {selectedItem && (
                  <p className="text-xs text-gray-400">
                    Stok saat ini: {selectedItem.stock} {selectedItem.unit}
                    {selectedItem.category ? ` · ${selectedItem.category}` : ''}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Barang baru: nama + satuan */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="name"
                  className="text-sm text-gray-600 dark:text-gray-300"
                >
                  Nama Barang
                </Label>
                <div className="relative">
                  <Package className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setName(e.target.value)
                      setErrors((prev) => ({ ...prev, name: undefined }))
                    }}
                    aria-invalid={!!errors.name}
                    placeholder="Contoh: Pupuk NPK Mutiara"
                    className="pl-9 dark:border-white/10 dark:text-gray-100"
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Jenis barang */}
              <div className="space-y-1.5">
                <Label className="text-sm text-gray-600 dark:text-gray-300">
                  Jenis Barang
                </Label>
                <div className="flex flex-wrap gap-2">
                  {ITEM_TYPES.map((t) => {
                    const active = type === t
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setType(t)
                          setErrors((prev) => ({ ...prev, type: undefined }))
                        }}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                          active
                            ? 'border-[#0B4619] bg-[#0B4619] text-white dark:border-[#5cbb70] dark:bg-[#5cbb70] dark:text-[#0c1410]'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-[#2a7039] hover:text-[#0B4619] dark:border-white/15 dark:bg-transparent dark:text-gray-300 dark:hover:border-[#5cbb70] dark:hover:text-[#5cbb70]',
                        )}
                      >
                        {t}
                      </button>
                    )
                  })}
                </div>
                {errors.type && (
                  <p className="text-sm text-red-500">{errors.type}</p>
                )}
              </div>
            </>
          )}

          {/* Jumlah (+ satuan saat barang baru) */}
          <div
            className={cn(
              'grid gap-4',
              effectiveMode === 'new' ? 'grid-cols-2' : 'grid-cols-1',
            )}
          >
            <div className="space-y-1.5">
              <Label
                htmlFor="qty"
                className="text-sm text-gray-600 dark:text-gray-300"
              >
                {effectiveMode === 'new' ? 'Stok Awal' : 'Jumlah'}
              </Label>
              <div className="relative">
                <Hash className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="qty"
                  inputMode="numeric"
                  value={qty}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setQty(e.target.value)
                    setErrors((prev) => ({ ...prev, qty: undefined }))
                  }}
                  aria-invalid={!!errors.qty}
                  placeholder="0"
                  disabled={effectiveMode === 'existing' && noItems}
                  className="pl-9 dark:border-white/10 dark:text-gray-100"
                />
              </div>
              {errors.qty && (
                <p className="text-sm text-red-500">{errors.qty}</p>
              )}
            </div>

            {effectiveMode === 'new' && (
              <div className="space-y-1.5">
                <Label
                  htmlFor="unit"
                  className="text-sm text-gray-600 dark:text-gray-300"
                >
                  Satuan
                </Label>
                <div className="relative">
                  <Ruler className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="unit"
                    value={unit}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setUnit(e.target.value)
                      setErrors((prev) => ({ ...prev, unit: undefined }))
                    }}
                    aria-invalid={!!errors.unit}
                    placeholder="kg / karung / pcs"
                    className="pl-9 dark:border-white/10 dark:text-gray-100"
                  />
                </div>
                {errors.unit && (
                  <p className="text-sm text-red-500">{errors.unit}</p>
                )}
              </div>
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
            disabled={submitting || (effectiveMode === 'existing' && noItems)}
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
