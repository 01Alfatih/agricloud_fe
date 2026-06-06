// Format luas lahan. Backend menyimpan `area` sebagai angka meter persegi (m²),
// mis. "20000.00". FE menampilkannya ramah-baca: ≥ 1 Ha → hektar, < 1 Ha → m².
// Kalau nilainya bukan angka (mis. dummy "5 Hektar"), dikembalikan apa adanya.
export function formatArea(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return String(value)
  if (n >= 10000) {
    const ha = n / 10000
    return `${ha.toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ha`
  }
  return `${Math.round(n).toLocaleString('id-ID')} m²`
}
