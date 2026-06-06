import { useEffect, useState } from 'react'
import { Crosshair, Loader2, MapPin } from 'lucide-react'
import type { LocationPref } from '@/lib/preferences'
import type { Wilayah } from '@/lib/wilayah'
import {
  fetchDistricts,
  fetchProvinces,
  fetchRegencies,
  findWilayah,
  getBrowserPosition,
  resolveCoords,
  reverseGeocode,
  titleCase,
} from '@/lib/wilayah'
import { cn } from '@/lib/utils'

// Pemilih lokasi bertingkat Provinsi → Kabupaten/Kota → Kecamatan.
// Saat kecamatan dipilih, koordinat di-resolve lalu dikirim lewat onChange
// sebagai LocationPref lengkap (siap dipakai cuaca dashboard).

function Select({
  value,
  onChange,
  disabled,
  loading,
  placeholder,
  options,
}: {
  value: string
  onChange: (id: string) => void
  disabled?: boolean
  loading?: boolean
  placeholder: string
  options: Array<Wilayah>
}) {
  return (
    <div className="relative">
      <select
        value={value}
        disabled={disabled || loading}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full appearance-none rounded-xl border border-[#1a472a]/15 bg-[#f3f9f3] px-4 py-2.5 text-sm text-[#1a472a] outline-none transition-colors',
          'focus:border-[#0B4619] disabled:cursor-not-allowed disabled:opacity-50',
          'dark:border-white/10 dark:bg-white/5 dark:text-[#a7d1a7]',
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {titleCase(o.name)}
          </option>
        ))}
      </select>
      {loading && (
        <Loader2 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-[#0B4619] dark:text-[#5cbb70]" />
      )}
    </div>
  )
}

export function LocationPicker({
  value,
  onChange,
}: {
  value: LocationPref | null
  onChange: (loc: LocationPref) => void
}) {
  const [provinces, setProvinces] = useState<Array<Wilayah>>([])
  const [regencies, setRegencies] = useState<Array<Wilayah>>([])
  const [districts, setDistricts] = useState<Array<Wilayah>>([])

  const [provinceId, setProvinceId] = useState(value?.provinceId ?? '')
  const [regencyId, setRegencyId] = useState(value?.regencyId ?? '')
  const [districtId, setDistrictId] = useState(value?.districtId ?? '')

  const [loadingRegencies, setLoadingRegencies] = useState(false)
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [error, setError] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [detectError, setDetectError] = useState<string | null>(null)

  // Provinsi sekali di awal.
  useEffect(() => {
    fetchProvinces()
      .then(setProvinces)
      .catch(() => setError(true))
  }, [])

  // Kabupaten/kota saat provinsi berubah.
  useEffect(() => {
    if (!provinceId) {
      setRegencies([])
      return
    }
    setLoadingRegencies(true)
    fetchRegencies(provinceId)
      .then(setRegencies)
      .catch(() => setError(true))
      .finally(() => setLoadingRegencies(false))
  }, [provinceId])

  // Kecamatan saat kabupaten berubah.
  useEffect(() => {
    if (!regencyId) {
      setDistricts([])
      return
    }
    setLoadingDistricts(true)
    fetchDistricts(regencyId)
      .then(setDistricts)
      .catch(() => setError(true))
      .finally(() => setLoadingDistricts(false))
  }, [regencyId])

  const handleProvince = (id: string) => {
    setProvinceId(id)
    setRegencyId('')
    setDistrictId('')
    setDistricts([])
  }

  const handleRegency = (id: string) => {
    setRegencyId(id)
    setDistrictId('')
  }

  const handleDistrict = async (id: string) => {
    setDistrictId(id)
    if (!id) return
    const province = provinces.find((p) => p.id === provinceId)
    const regency = regencies.find((r) => r.id === regencyId)
    const district = districts.find((d) => d.id === id)
    if (!province || !regency || !district) return

    setResolving(true)
    setError(false)
    try {
      const coords = await resolveCoords({
        provinceName: province.name,
        regencyName: regency.name,
        districtName: district.name,
      })
      if (!coords) {
        setError(true)
        return
      }
      onChange({
        provinceId: province.id,
        provinceName: titleCase(province.name),
        regencyId: regency.id,
        regencyName: titleCase(regency.name),
        districtId: district.id,
        districtName: titleCase(district.name),
        lat: coords.lat,
        lng: coords.lng,
        label: `${titleCase(district.name)}, ${titleCase(regency.name)}, ${titleCase(province.name)}`,
      })
    } catch {
      setError(true)
    } finally {
      setResolving(false)
    }
  }

  // Deteksi otomatis: GPS browser → reverse-geocode → cocokkan ke daftar
  // wilayah. Koordinat yang disimpan adalah koordinat GPS presisi (paling
  // akurat untuk cuaca), bukan hasil resolve nama.
  const handleDetect = async () => {
    setDetecting(true)
    setDetectError(null)
    setError(false)
    try {
      const pos = await getBrowserPosition()
      const place = await reverseGeocode(pos.lat, pos.lng)
      if (!place) {
        setDetectError('Tidak bisa mengenali wilayah dari lokasimu.')
        return
      }

      const provList = provinces.length ? provinces : await fetchProvinces()
      if (!provinces.length) setProvinces(provList)
      const prov = findWilayah(provList, [place.provinceName])

      let regList: Array<Wilayah> = []
      let reg: Wilayah | undefined
      let distList: Array<Wilayah> = []
      let dist: Wilayah | undefined

      if (prov) {
        regList = await fetchRegencies(prov.id)
        reg = findWilayah(regList, [place.regencyName])
        if (reg) {
          distList = await fetchDistricts(reg.id)
          dist = findWilayah(distList, place.districtCandidates)
        }
      }

      // Sinkronkan dropdown dengan hasil deteksi.
      setProvinceId(prov?.id ?? '')
      setRegencies(regList)
      setRegencyId(reg?.id ?? '')
      setDistricts(distList)
      setDistrictId(dist?.id ?? '')

      // Nama untuk label: pakai nama resmi emsifa kalau cocok, kalau tidak pakai
      // hasil reverse-geocode.
      const provName = prov
        ? titleCase(prov.name)
        : titleCase(place.provinceName)
      const regName = reg
        ? titleCase(reg.name)
        : place.regencyName
          ? titleCase(place.regencyName)
          : ''
      const distName = dist
        ? titleCase(dist.name)
        : place.districtCandidates[0]
          ? titleCase(place.districtCandidates[0])
          : ''
      const label = [distName, regName, provName].filter(Boolean).join(', ')

      onChange({
        provinceId: prov?.id ?? '',
        provinceName: provName,
        regencyId: reg?.id ?? '',
        regencyName: regName,
        districtId: dist?.id ?? '',
        districtName: distName,
        lat: pos.lat,
        lng: pos.lng,
        label,
      })
    } catch (err) {
      const code = (err as GeolocationPositionError)?.code
      setDetectError(
        code === 1
          ? 'Izin lokasi ditolak. Aktifkan akses lokasi di browser lalu coba lagi.'
          : 'Gagal mendeteksi lokasi. Coba lagi atau pilih manual.',
      )
    } finally {
      setDetecting(false)
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleDetect}
        disabled={detecting || resolving}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-xl border border-[#0B4619]/30 bg-[#0B4619]/5 px-4 py-2.5 text-sm font-medium text-[#0B4619] transition-colors',
          'hover:bg-[#0B4619]/10 disabled:cursor-not-allowed disabled:opacity-60',
          'dark:border-[#5cbb70]/30 dark:bg-[#5cbb70]/10 dark:text-[#a7d1a7] dark:hover:bg-[#5cbb70]/15',
        )}
      >
        {detecting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Crosshair className="size-4" />
        )}
        {detecting ? 'Mendeteksi lokasi…' : 'Deteksi Otomatis (GPS)'}
      </button>

      {detectError && (
        <p className="text-xs text-red-600 dark:text-red-400">{detectError}</p>
      )}

      <div className="flex items-center gap-3 py-0.5">
        <span className="h-px flex-1 bg-[#1a472a]/10 dark:bg-white/10" />
        <span className="text-xs text-[#1a472a]/45 dark:text-[#a7d1a7]/40">
          atau pilih manual
        </span>
        <span className="h-px flex-1 bg-[#1a472a]/10 dark:bg-white/10" />
      </div>

      <Select
        value={provinceId}
        onChange={handleProvince}
        loading={provinces.length === 0 && !error}
        placeholder="Pilih provinsi"
        options={provinces}
      />
      <Select
        value={regencyId}
        onChange={handleRegency}
        disabled={!provinceId}
        loading={loadingRegencies}
        placeholder="Pilih kabupaten/kota"
        options={regencies}
      />
      <Select
        value={districtId}
        onChange={handleDistrict}
        disabled={!regencyId}
        loading={loadingDistricts}
        placeholder="Pilih kecamatan"
        options={districts}
      />

      {resolving && (
        <p className="flex items-center gap-1.5 text-xs text-[#1a472a]/60 dark:text-[#a7d1a7]/50">
          <Loader2 className="size-3.5 animate-spin" /> Menentukan koordinat
          lokasi…
        </p>
      )}

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">
          Gagal memuat data wilayah atau menentukan koordinat. Periksa koneksi
          lalu coba lagi.
        </p>
      )}

      {value && !resolving && (
        <div className="flex items-start gap-2 rounded-xl border border-[#1a472a]/10 bg-[#f3f9f3] px-4 py-3 text-sm text-[#1a472a] dark:border-white/10 dark:bg-white/5 dark:text-[#a7d1a7]">
          <MapPin className="mt-0.5 size-4 shrink-0 text-[#0B4619] dark:text-[#5cbb70]" />
          <div className="min-w-0">
            <p className="font-medium">{value.label}</p>
            <p className="text-xs text-[#1a472a]/55 dark:text-[#a7d1a7]/45">
              {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
