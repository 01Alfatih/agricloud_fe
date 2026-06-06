// Data wilayah Indonesia (Provinsi → Kabupaten/Kota → Kecamatan) dari
// emsifa/api-wilayah-indonesia — statis, gratis, tanpa key, CORS-friendly.
// Koordinat tidak disediakan di sini, jadi setelah kecamatan dipilih kita
// resolve lat/lng lewat Open-Meteo Geocoding (vendor yang sama dengan cuaca).

export interface Wilayah {
  id: string
  name: string
}

const WILAYAH_BASE = 'https://www.emsifa.com/api-wilayah-indonesia/api'
const GEOCODE_BASE = 'https://geocoding-api.open-meteo.com/v1/search'

// Cache in-memory per-URL: daftar wilayah jarang berubah & user bisa bolak-balik
// buka section Lokasi tanpa fetch ulang.
const cache = new Map<string, Promise<Array<Wilayah>>>()

function fetchList(url: string): Promise<Array<Wilayah>> {
  const cached = cache.get(url)
  if (cached) return cached
  const p = fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`Wilayah HTTP ${res.status}`)
      return res.json() as Promise<Array<Wilayah>>
    })
    .catch((err) => {
      cache.delete(url) // jangan cache kegagalan supaya bisa retry
      throw err
    })
  cache.set(url, p)
  return p
}

export function fetchProvinces(): Promise<Array<Wilayah>> {
  return fetchList(`${WILAYAH_BASE}/provinces.json`)
}

export function fetchRegencies(provinceId: string): Promise<Array<Wilayah>> {
  return fetchList(`${WILAYAH_BASE}/regencies/${provinceId}.json`)
}

export function fetchDistricts(regencyId: string): Promise<Array<Wilayah>> {
  return fetchList(`${WILAYAH_BASE}/districts/${regencyId}.json`)
}

// Nama wilayah emsifa kapital semua ("KABUPATEN PURWAKARTA"). Untuk tampilan
// dan geocoding kita rapikan jadi Title Case.
export function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bDki\b/g, 'DKI')
}

// Buang prefix administratif + lowercase untuk pencocokan longgar antara nama
// dari reverse-geocode (sering singkat: "Jakarta", "Yogyakarta") dengan nama
// resmi emsifa ("DKI JAKARTA", "DAERAH ISTIMEWA YOGYAKARTA").
function matchKey(s: string): string {
  return s
    .toLowerCase()
    .replace(
      /^(kabupaten|kota administrasi|kota|kab\.?|provinsi|daerah istimewa|dki|di)\s+/i,
      '',
    )
    .trim()
}

// Cari wilayah yang namanya cocok longgar dengan salah satu kandidat.
export function findWilayah(
  list: Array<Wilayah>,
  candidates: Array<string>,
): Wilayah | undefined {
  for (const c of candidates) {
    const key = matchKey(c)
    if (!key) continue
    const hit = list.find((w) => {
      const wk = matchKey(w.name)
      return wk === key || wk.includes(key) || key.includes(wk)
    })
    if (hit) return hit
  }
  return undefined
}

// Inti nama kabupaten/kota tanpa prefix administratif — prefix "Kabupaten"/
// "Kota" bikin geocoder Open-Meteo gagal ("Kabupaten Cirebon" → 0 hasil,
// "Cirebon" → ketemu).
function regencyCore(regencyName: string): string {
  return titleCase(regencyName).replace(/^(Kabupaten|Kota)\s+/i, '')
}

interface GeoResult {
  name: string
  latitude: number
  longitude: number
  admin1?: string
  admin2?: string
}

async function geocode(query: string): Promise<Array<GeoResult>> {
  const params = new URLSearchParams({
    name: query,
    count: '10',
    language: 'id',
    countryCode: 'ID',
  })
  const res = await fetch(`${GEOCODE_BASE}?${params.toString()}`)
  if (!res.ok) return []
  const json = (await res.json()) as { results?: Array<GeoResult> }
  return json.results ?? []
}

function norm(s: string | undefined): string {
  return (s ?? '').toLowerCase()
}

export interface ResolvedCoords {
  lat: number
  lng: number
}

// Resolve koordinat dari pilihan administratif. Strategi berjenjang dari yang
// paling presisi: nama kecamatan (difilter agar provinsi & kabupaten cocok) →
// nama kecamatan dalam provinsi → inti nama kabupaten dalam provinsi → provinsi.
// Mengembalikan null kalau semua jenjang gagal (cuaca lalu tampil "tidak tersedia").
export async function resolveCoords(args: {
  provinceName: string
  regencyName: string
  districtName: string
}): Promise<ResolvedCoords | null> {
  const province = titleCase(args.provinceName)
  const core = regencyCore(args.regencyName)
  const district = titleCase(args.districtName)
  const provKey = norm(province).replace(/^(provinsi|daerah istimewa)\s+/i, '')
  const coreKey = norm(core)

  const pick = (rs: Array<GeoResult>): ResolvedCoords | null =>
    rs.length ? { lat: rs[0].latitude, lng: rs[0].longitude } : null

  // Hanya hasil di provinsi yang sama (hindari "Plered" salah provinsi).
  const inProvince = (rs: Array<GeoResult>) =>
    rs.filter((r) => norm(r.admin1).includes(provKey))

  // 1. Kecamatan, dipersempit ke kabupaten yang benar.
  const byDistrict = await geocode(district)
  const exact = inProvince(byDistrict).filter((r) =>
    norm(r.admin2).includes(coreKey),
  )
  if (exact.length) return pick(exact)

  // 2. Kecamatan, cukup cocok provinsi.
  const distInProv = inProvince(byDistrict)
  if (distInProv.length) return pick(distInProv)

  // 3. Inti nama kabupaten/kota dalam provinsi.
  const byRegency = inProvince(await geocode(core))
  if (byRegency.length) return pick(byRegency)

  // 4. Provinsi sebagai upaya terakhir.
  const byProvince = await geocode(provKey)
  return pick(byProvince)
}

/* ---------------------------- reverse geocoding --------------------------- */

export interface DetectedPlace {
  provinceName: string
  regencyName: string
  // Kandidat nama kecamatan dari beberapa field — dicocokkan satu per satu.
  districtCandidates: Array<string>
  lat: number
  lng: number
}

interface BigDataCloudResponse {
  city?: string
  locality?: string
  principalSubdivision?: string
  localityInfo?: {
    administrative?: Array<{ adminLevel?: number; name?: string }>
  }
}

// Reverse-geocode koordinat GPS → nama admin Indonesia lewat BigDataCloud
// (gratis, tanpa key, CORS-friendly). lvl4 ≈ provinsi, lvl5 ≈ kabupaten/kota,
// lvl6/locality/city ≈ kecamatan.
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<DetectedPlace | null> {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=id`
  const res = await fetch(url)
  if (!res.ok) return null
  const d = (await res.json()) as BigDataCloudResponse
  const adm: Record<number, string> = {}
  for (const a of d.localityInfo?.administrative ?? []) {
    if (typeof a.adminLevel === 'number' && a.name) adm[a.adminLevel] = a.name
  }
  const provinceName = adm[4] || d.principalSubdivision || ''
  const regencyName = adm[5] || ''
  const districtCandidates = [adm[6], d.locality, d.city].filter(
    (x): x is string => Boolean(x),
  )
  if (!provinceName) return null
  return { provinceName, regencyName, districtCandidates, lat, lng }
}

// Tipe hasil getCurrentPosition tanpa bergantung pada lib DOM "dom" penuh.
export function getBrowserPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation tidak didukung browser ini.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  })
}
