import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  Bell,
  Check,
  Globe,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Moon,
  Phone,
  ShieldCheck,
  Sun,
  User,
} from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'
import { usePreferences } from '@/lib/preferences'
import type { LangPref, ThemePref } from '@/lib/preferences'
import { LocationPicker } from '@/components/LocationPicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/settings-ii')({
  component: RouteComponent,
})

const API_BASE_URL = 'http://localhost:8005/api'

/* ------------------------------- tipe & data ------------------------------ */

type SectionId =
  | 'profil'
  | 'keamanan'
  | 'lokasi'
  | 'notifikasi'
  | 'tampilan'
  | 'bahasa'

interface NavItem {
  id: SectionId
  label: string
  desc: string
  icon: ComponentType<{ className?: string }>
}

const SECTIONS: NavItem[] = [
  { id: 'profil', label: 'Profil', desc: 'Data akun kamu', icon: User },
  {
    id: 'keamanan',
    label: 'Keamanan',
    desc: 'Kata sandi & login',
    icon: ShieldCheck,
  },
  {
    id: 'lokasi',
    label: 'Lokasi',
    desc: 'Wilayah untuk cuaca',
    icon: MapPin,
  },
  {
    id: 'notifikasi',
    label: 'Notifikasi',
    desc: 'Pemberitahuan aktivitas',
    icon: Bell,
  },
  { id: 'tampilan', label: 'Tampilan', desc: 'Tema antarmuka', icon: Moon },
  { id: 'bahasa', label: 'Bahasa', desc: 'Bahasa antarmuka', icon: Globe },
]

interface IProfile {
  name: string
  email: string
  pNumber: string
  role: string
  photoUrl: string | null
}

interface IProfileResponse {
  id: number
  name: string
  email: string
  phone_number: string
  role: string
  profile_photo_url: null | string
}

/* -------------------------------- komponen -------------------------------- */

function RouteComponent() {
  const navigate = useNavigate()
  const { save, saving } = usePreferences()

  const [active, setActive] = useState<SectionId>('profil')
  const [profile, setProfile] = useState<IProfile | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)

  // Redirect ke login kalau belum punya token.
  useEffect(() => {
    if (!localStorage.getItem('token')) navigate({ to: '/login' })
  }, [navigate])

  // Ambil data profil (dipakai section Profil + header).
  useEffect(() => {
    axios
      .get<{ data: IProfileResponse }>(`${API_BASE_URL}/auth/user`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then((res) => {
        const d = res.data.data
        setProfile({
          name: d.name,
          email: d.email,
          pNumber: d.phone_number,
          role: d.role,
          photoUrl: d.profile_photo_url,
        })
      })
      .catch((err) => console.error('Gagal memuat profil:', err))
  }, [])

  // Persist preferensi ke backend; tampilkan flash "Tersimpan" sebentar.
  const handleSave = async () => {
    await save()
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }

  const activeMeta = SECTIONS.find((s) => s.id === active)!

  return (
    <div className="min-h-screen bg-[#e4f0e4] transition-colors dark:bg-[#0c1410]">
      <div className="mx-auto max-w-6xl space-y-6 p-4 pt-16 sm:p-6 md:pt-6">
        {/* Header halaman */}
        <div className="pl-1">
          <h1 className="text-2xl font-bold text-[#0B4619] sm:text-3xl dark:text-[#a7d1a7]">
            Pengaturan
          </h1>
          <p className="mt-1 text-sm text-[#1a472a]/70 dark:text-[#a7d1a7]/60">
            Kelola profil, keamanan, dan preferensi akun kamu.
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* ----------------------- left sub-nav ----------------------- */}
          <nav className="flex shrink-0 gap-2 overflow-x-auto lg:w-64 lg:flex-col lg:overflow-visible">
            {SECTIONS.map((s) => {
              const Icon = s.icon
              const isActive = s.id === active
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActive(s.id)}
                  className={cn(
                    'group flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors lg:w-full',
                    isActive
                      ? 'bg-[#0B4619] text-white shadow-sm dark:bg-[#1d3327]'
                      : 'text-[#1a472a] hover:bg-[#d3e7d3] dark:text-[#a7d1a7] dark:hover:bg-white/5',
                  )}
                >
                  <span
                    className={cn(
                      'shrink-0',
                      isActive
                        ? 'text-[#a3e0b5] dark:text-[#5cbb70]'
                        : 'text-[#0B4619] dark:text-[#5cbb70]',
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {s.label}
                    </span>
                    <span
                      className={cn(
                        'hidden truncate text-xs lg:block',
                        isActive
                          ? 'text-white/70'
                          : 'text-[#1a472a]/60 dark:text-[#a7d1a7]/50',
                      )}
                    >
                      {s.desc}
                    </span>
                  </span>
                </button>
              )
            })}
          </nav>

          {/* ------------------------- konten ------------------------- */}
          <div className="min-w-0 flex-1">
            <Card className="border-0 shadow-md dark:border dark:border-white/10 dark:bg-[#15211a]">
              <CardContent className="p-5 sm:p-7">
                <SectionHeader meta={activeMeta} />

                <div className="mt-6">
                  {active === 'profil' && <ProfileSection profile={profile} />}
                  {active === 'keamanan' && <SecuritySection />}
                  {active === 'lokasi' && <LocationSection />}
                  {active === 'notifikasi' && <NotificationSection />}
                  {active === 'tampilan' && <AppearanceSection />}
                  {active === 'bahasa' && <LanguageSection />}
                </div>

                {/* Tombol simpan — hanya relevan untuk preferensi. */}
                {active !== 'profil' && active !== 'keamanan' && (
                  <div className="mt-8 flex items-center justify-end gap-3 border-t border-[#1a472a]/10 pt-5 dark:border-white/10">
                    {savedFlash && (
                      <span className="flex items-center gap-1.5 text-sm font-medium text-green-700 dark:text-green-400">
                        <Check className="size-4" /> Tersimpan
                      </span>
                    )}
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="min-w-32 bg-[#0B4619] text-white hover:bg-[#0a3d16] dark:bg-[#1d3327] dark:hover:bg-[#244031]"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="size-4 animate-spin" /> Menyimpan…
                        </>
                      ) : (
                        'Simpan'
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ----------------------------- sub-komponen ------------------------------- */

function SectionHeader({ meta }: { meta: NavItem }) {
  const Icon = meta.icon
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#d3e7d3] text-[#0B4619] dark:bg-[#1d3327] dark:text-[#5cbb70]">
        <Icon className="size-5" />
      </span>
      <div>
        <h2 className="text-lg font-semibold text-[#0B4619] dark:text-[#a7d1a7]">
          {meta.label}
        </h2>
        <p className="text-sm text-[#1a472a]/60 dark:text-[#a7d1a7]/50">
          {meta.desc}
        </p>
      </div>
    </div>
  )
}

function ProfileSection({ profile }: { profile: IProfile | null }) {
  if (!profile)
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-12 w-full animate-pulse rounded-xl bg-[#d3e7d3] dark:bg-white/5"
          />
        ))}
      </div>
    )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <img
          src={profile.photoUrl ?? 'https://i.pravatar.cc/120'}
          alt={profile.name}
          className="size-20 rounded-full border-4 border-white object-cover shadow-md dark:border-white/10"
        />
        <div>
          <p className="text-xl font-bold text-[#0B4619] dark:text-[#a7d1a7]">
            {profile.name}
          </p>
          <span className="mt-1 inline-block rounded-full bg-[#d3e7d3] px-3 py-0.5 text-xs font-medium text-[#0B4619] capitalize dark:bg-[#1d3327] dark:text-[#5cbb70]">
            {profile.role}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ReadField icon={Mail} label="Email" value={profile.email} />
        <ReadField icon={Phone} label="Telepon" value={profile.pNumber} />
      </div>

      <p className="text-xs text-[#1a472a]/50 dark:text-[#a7d1a7]/40">
        Pengeditan data profil mengikuti halaman Profil — fitur edit menyusul
        saat endpoint update tersedia.
      </p>
    </div>
  )
}

function ReadField({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: ReactNode
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-[#1a472a] dark:text-[#a7d1a7]">
        {label}
      </p>
      <div className="flex items-center gap-2 rounded-xl border border-[#1a472a]/10 bg-[#f3f9f3] px-4 py-2.5 text-sm text-[#1a472a] dark:border-white/10 dark:bg-white/5 dark:text-[#a7d1a7]">
        <Icon className="size-4 shrink-0 opacity-60" />
        <span className="min-w-0 truncate">{value}</span>
      </div>
    </div>
  )
}

function SecuritySection() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  const tooShort = form.next.length > 0 && form.next.length < 8
  const mismatch = form.confirm.length > 0 && form.next !== form.confirm

  return (
    <div className="max-w-md space-y-5">
      {/* Backend belum punya endpoint ganti password (lihat PESAN-BACKEND §16). */}
      <div className="flex items-start gap-2 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
        <KeyRound className="mt-0.5 size-4 shrink-0" />
        <span>
          Endpoint ganti kata sandi belum tersedia di backend. Form ini siap
          dipakai begitu API-nya jadi.
        </span>
      </div>

      <PasswordField
        label="Kata sandi saat ini"
        value={form.current}
        onChange={set('current')}
      />
      <PasswordField
        label="Kata sandi baru"
        value={form.next}
        onChange={set('next')}
        hint={tooShort ? 'Minimal 8 karakter.' : undefined}
        error={tooShort}
      />
      <PasswordField
        label="Konfirmasi kata sandi baru"
        value={form.confirm}
        onChange={set('confirm')}
        hint={mismatch ? 'Konfirmasi tidak cocok.' : undefined}
        error={mismatch}
      />

      <Button
        type="button"
        disabled
        className="min-w-40 bg-[#0B4619] text-white hover:bg-[#0a3d16] dark:bg-[#1d3327]"
      >
        Perbarui Kata Sandi
      </Button>
    </div>
  )
}

function PasswordField({
  label,
  value,
  onChange,
  hint,
  error,
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  hint?: string
  error?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-[#1a472a] dark:text-[#a7d1a7]">
        {label}
      </Label>
      <Input
        type="password"
        value={value}
        onChange={onChange}
        aria-invalid={error}
        placeholder="••••••••"
        className="bg-white dark:bg-white/5"
      />
      {hint && (
        <p
          className={cn(
            'text-xs',
            error ? 'text-red-600 dark:text-red-400' : 'text-[#1a472a]/50',
          )}
        >
          {hint}
        </p>
      )}
    </div>
  )
}

function LocationSection() {
  const { preferences, setPreference } = usePreferences()
  return (
    <div className="max-w-md space-y-4">
      <p className="text-sm text-[#1a472a]/70 dark:text-[#a7d1a7]/60">
        Pilih wilayah sampai tingkat kecamatan. Lokasi ini dipakai untuk
        menampilkan cuaca di dashboard. Jangan lupa tekan{' '}
        <span className="font-medium">Simpan</span>.
      </p>
      <LocationPicker
        value={preferences.location}
        onChange={(loc) => setPreference('location', loc)}
      />
    </div>
  )
}

function NotificationSection() {
  const { preferences, setPreference } = usePreferences()
  return (
    <ToggleRow
      icon={Bell}
      title="Notifikasi aktivitas"
      desc="Terima pemberitahuan terkait aktivitas lahan, siklus tanam, dan gudang."
      checked={preferences.notifications}
      onCheckedChange={(v) => setPreference('notifications', v)}
    />
  )
}

function ToggleRow({
  icon: Icon,
  title,
  desc,
  checked,
  onCheckedChange,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  desc: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[#1a472a]/10 bg-[#f3f9f3] px-4 py-4 dark:border-white/10 dark:bg-white/5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#d3e7d3] text-[#0B4619] dark:bg-[#1d3327] dark:text-[#5cbb70]">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#1a472a] dark:text-[#a7d1a7]">
            {title}
          </p>
          <p className="text-xs text-[#1a472a]/60 dark:text-[#a7d1a7]/50">
            {desc}
          </p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

function AppearanceSection() {
  const { preferences, setPreference } = usePreferences()
  const options: { value: ThemePref; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Terang', icon: Sun },
    { value: 'dark', label: 'Gelap', icon: Moon },
  ]
  return (
    <div className="grid max-w-md grid-cols-2 gap-3">
      {options.map((o) => {
        const Icon = o.icon
        const isActive = preferences.theme === o.value
        return (
          <ChoiceCard
            key={o.value}
            active={isActive}
            onClick={() => setPreference('theme', o.value)}
          >
            <Icon className="size-6" />
            <span className="text-sm font-medium">{o.label}</span>
          </ChoiceCard>
        )
      })}
    </div>
  )
}

function LanguageSection() {
  const { preferences, setPreference } = usePreferences()
  const options: { value: LangPref; label: string; flag: string }[] = [
    { value: 'id', label: 'Indonesia', flag: '🇮🇩' },
    { value: 'en', label: 'English', flag: '🇬🇧' },
  ]
  return (
    <div className="grid max-w-md grid-cols-2 gap-3">
      {options.map((o) => (
        <ChoiceCard
          key={o.value}
          active={preferences.language === o.value}
          onClick={() => setPreference('language', o.value)}
        >
          <span className="text-2xl leading-none">{o.flag}</span>
          <span className="text-sm font-medium">{o.label}</span>
        </ChoiceCard>
      ))}
    </div>
  )
}

function ChoiceCard({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 px-4 py-6 transition-colors',
        active
          ? 'border-[#0B4619] bg-[#d3e7d3] text-[#0B4619] dark:border-[#5cbb70] dark:bg-[#1d3327] dark:text-[#a7d1a7]'
          : 'border-[#1a472a]/10 bg-[#f3f9f3] text-[#1a472a] hover:border-[#0B4619]/40 dark:border-white/10 dark:bg-white/5 dark:text-[#a7d1a7] dark:hover:border-white/25',
      )}
    >
      {active && (
        <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-[#0B4619] text-white dark:bg-[#5cbb70] dark:text-[#0c1410]">
          <Check className="size-3" />
        </span>
      )}
      {children}
    </button>
  )
}
