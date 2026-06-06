// Util tanaman lahan — dipakai field-ii (kartu) & dField-ii (detail).
// Backend mulai mengirim `crops` (array crop-template terkait lahan) di
// GET /api/myfields. Kalau sudah terisi → pakai itu; kalau masih kosong →
// fallback tebak dari nama/deskripsi lahan (API lama belum punya relasi crop).

export interface CropTag {
  icon: string
  label: string
}

// Bentuk item `crops` dari backend = crop-template ringkas (lihat §6).
export interface FieldCrop {
  id: number
  name: string
  description?: string | null
}

// Kamus kata kunci → emoji. Dipakai untuk emoji crop asli & tebakan dari teks.
const CROP_DICT = [
  { keys: ['cabai', 'cabe'], icon: '🌶️', label: 'Cabai' },
  { keys: ['anggur'], icon: '🍇', label: 'Anggur' },
  { keys: ['tomat'], icon: '🍅', label: 'Tomat' },
  { keys: ['padi', 'sawah', 'beras'], icon: '🌾', label: 'Padi' },
  { keys: ['jagung'], icon: '🌽', label: 'Jagung' },
  { keys: ['kacang'], icon: '🥜', label: 'Kacang Tanah' },
  { keys: ['bayam', 'kangkung', 'sawi'], icon: '🥬', label: 'Sayuran Daun' },
  { keys: ['selada', 'lettuce'], icon: '🥗', label: 'Selada' },
  { keys: ['terong', 'terung'], icon: '🍆', label: 'Terong' },
  { keys: ['timun', 'mentimun'], icon: '🥒', label: 'Timun' },
  { keys: ['wortel'], icon: '🥕', label: 'Wortel' },
  { keys: ['kentang'], icon: '🥔', label: 'Kentang' },
]

// Emoji untuk satu nama tanaman (cocokkan kata kunci); default 🌱.
function emojiForCrop(name: string): string {
  const t = name.toLowerCase()
  const found = CROP_DICT.find((c) => c.keys.some((k) => t.includes(k)))
  return found?.icon ?? '🌱'
}

// Tebak tanaman dari teks bebas (nama + deskripsi lahan) → bisa lebih dari satu
// (tumpang sari). Kalau tidak ada yang cocok → satu tag generik.
function guessCropsFromText(text: string): Array<CropTag> {
  const t = text.toLowerCase()
  const found = CROP_DICT.filter((c) => c.keys.some((k) => t.includes(k)))
  return found.length
    ? found.map(({ icon, label }) => ({ icon, label }))
    : [{ icon: '🌱', label: 'Tanaman' }]
}

// Tag tanaman untuk sebuah lahan: utamakan `crops` asli dari backend; kalau
// kosong/undefined, fallback tebak dari teks.
export function cropTags(
  crops: Array<FieldCrop> | undefined | null,
  fallbackText: string,
): Array<CropTag> {
  if (crops && crops.length > 0) {
    return crops.map((c) => ({ icon: emojiForCrop(c.name), label: c.name }))
  }
  return guessCropsFromText(fallbackText)
}
