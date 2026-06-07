import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import axios from 'axios'

// Sumber kebenaran tunggal untuk preferensi user (tema, bahasa, notifikasi).
// Disimpan di localStorage untuk apply instan (anti-flicker), lalu disinkron
// ke backend lewat kolom JSON `settings` di tabel users (lihat PESAN-BACKEND.md).

export type ThemePref = 'light' | 'dark'
export type LangPref = 'id' | 'en'

// Lokasi user sampai level kecamatan. Koordinat di-resolve sekali saat dipilih
// (lihat src/lib/wilayah.ts) lalu di-cache di sini supaya cuaca dashboard
// tidak perlu geocoding ulang tiap render.
export interface LocationPref {
  provinceId: string
  provinceName: string
  regencyId: string
  regencyName: string
  districtId: string
  districtName: string
  lat: number
  lng: number
  label: string
}

export interface Preferences {
  theme: ThemePref
  language: LangPref
  notifications: boolean
  location: LocationPref | null
}

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'light',
  language: 'id',
  notifications: true,
  location: null,
}

const STORAGE_KEY = 'preferences'
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8005/api'

function readStored(): Preferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) }
    // Migrasi dari key lama 'theme' (dipakai dashboard-ii sebelumnya).
    const legacyTheme = localStorage.getItem('theme')
    if (legacyTheme === 'dark' || legacyTheme === 'light')
      return { ...DEFAULT_PREFERENCES, theme: legacyTheme }
  } catch {
    /* localStorage tidak tersedia / JSON rusak → pakai default */
  }
  return DEFAULT_PREFERENCES
}

function applyToDocument(prefs: Preferences) {
  const root = document.documentElement
  root.classList.toggle('dark', prefs.theme === 'dark')
  root.setAttribute('lang', prefs.language)
}

interface PreferencesContextValue {
  preferences: Preferences
  setPreference: <K extends keyof Preferences>(
    key: K,
    value: Preferences[K],
  ) => void
  save: () => Promise<void>
  saving: boolean
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(readStored)
  const [saving, setSaving] = useState(false)

  // Apply ke <html> + cache lokal setiap preferensi berubah (live, lintas halaman).
  useEffect(() => {
    applyToDocument(preferences)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    } catch {
      /* abaikan kalau storage penuh/diblok */
    }
  }, [preferences])

  // Saat ada token, ambil preferensi dari server (server menang).
  // Aman walau endpoint `settings` belum ada → fallback ke cache lokal.
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    axios
      .get<{ data: { settings?: Partial<Preferences> | null } }>(
        `${API_BASE_URL}/auth/user`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .then((res) => {
        const remote = res.data?.data?.settings
        if (remote) setPreferences((p) => ({ ...p, ...remote }))
      })
      .catch(() => {
        /* settings belum tersedia di backend → tetap pakai cache lokal */
      })
  }, [])

  const setPreference = useCallback(
    <K extends keyof Preferences>(key: K, value: Preferences[K]) =>
      setPreferences((p) => ({ ...p, [key]: value })),
    [],
  )

  // Persist ke backend. Dipanggil dari tombol "Simpan" di halaman Pengaturan.
  const save = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    setSaving(true)
    try {
      await axios.patch(`${API_BASE_URL}/auth/settings`, preferences, {
        headers: { Authorization: `Bearer ${token}` },
      })
    } finally {
      setSaving(false)
    }
  }, [preferences])

  return (
    <PreferencesContext.Provider
      value={{ preferences, setPreference, save, saving }}
    >
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx)
    throw new Error(
      'usePreferences harus dipakai di dalam <PreferencesProvider>',
    )
  return ctx
}

// Kompat dengan pemakaian lama di dashboard-ii: [dark, toggleDark].
export function useDarkMode() {
  const { preferences, setPreference } = usePreferences()
  const dark = preferences.theme === 'dark'
  return [dark, () => setPreference('theme', dark ? 'light' : 'dark')] as const
}
