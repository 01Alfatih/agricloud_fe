import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import {
  Bell,
  ChevronRight,
  Globe,
  KeyRound,
  Mail,
  Moon,
  Pencil,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const API_BASE_URL = import.meta.env.VITE_API_URL

export const Route = createFileRoute('/profile-ii')({
  component: RouteComponent,
})

interface IProfile {
  name: string
  email: string
  pNumber: string
  role: string
}

interface IProfileResponse {
  id: number
  name: string
  email: string
  email_verified_at: null | string
  phone_number: string
  role: string
  profile_photo: null | string
  created_at: Date
  updated_at: Date
  profile_photo_url: null | string
}

// Ganti URL ini kalau mau banner sawah yang lain
const BANNER_URL =
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=60'

function RouteComponent() {
  const navigate = useNavigate()

  const [profile, setProfile] = useState<IProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // State pengaturan — lokal dulu, belum di-persist ke backend
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [englishLang, setEnglishLang] = useState(false)

  useEffect(() => {
    axios
      .get<{ data: IProfileResponse }>(`${API_BASE_URL}/auth/user`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      .then((response) => {
        setProfile({
          name: response.data.data.name,
          email: response.data.data.email,
          pNumber: response.data.data.phone_number,
          role: response.data.data.role,
        })
      })
      .catch((error) => {
        console.error('Error fetching profile data:', error)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate({ to: '/login' })
    }
  }, [])

  const handleSave = () => {
    // TODO: kirim pengaturan ke backend kalau endpoint-nya sudah ada
    console.log('Simpan pengaturan:', { darkMode, notifications, englishLang })
    toast.success('Pengaturan tersimpan')
  }

  if (loading)
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-green-50 text-green-800">
        Loading...
      </div>
    )
  if (!profile)
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-green-50 text-red-600">
        Gagal memuat data profil.
      </div>
    )

  return (
    <div className="min-h-screen bg-green-50 py-8 sm:py-12">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-3 sm:px-4">
        {/* ============ KARTU PROFIL ============ */}
        <Card className="overflow-hidden rounded-3xl border-none p-0 shadow-xl">
          {/* Banner sawah */}
          <div
            className="h-36 w-full bg-green-600 bg-cover bg-center sm:h-44"
            style={{ backgroundImage: `url(${BANNER_URL})` }}
          />

          <CardContent className="px-5 pb-8 sm:px-8">
            {/* Avatar + Nama + Badge */}
            <div className="-mt-16 flex flex-wrap items-center gap-4 sm:-mt-20 sm:gap-5">
              <div className="relative shrink-0">
                <img
                  src="https://i.pravatar.cc/160"
                  alt="Profile"
                  className="size-28 rounded-full border-4 border-white object-cover shadow-md sm:size-36"
                />
                <button
                  type="button"
                  aria-label="Edit foto profil"
                  className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-full bg-gray-900 text-white shadow-md transition-colors hover:bg-gray-700"
                >
                  <Pencil className="size-4" />
                </button>
              </div>

              <div className="flex flex-col">
                <h2 className="text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl">
                  {profile.name}
                </h2>
                <Badge
                  className="mt-2 w-fit bg-green-100 px-3 py-1 capitalize text-green-600"
                  variant="secondary"
                >
                  {profile.role}
                </Badge>
              </div>
            </div>

            {/* Data Pribadi (kiri) + Data Kepemilikan (kanan) */}
            <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
              <div className="flex flex-col gap-4">
                <FieldPill
                  icon={<Mail className="size-4" />}
                  label="Email"
                  value={profile.email}
                />
                <FieldPill
                  icon={<User className="size-4" />}
                  label="Gender"
                  value="Pria"
                />
                <FieldPill
                  icon={<Phone className="size-4" />}
                  label="Telepon"
                  value={profile.pNumber}
                />
              </div>

              <div>
                <h3 className="mb-3 text-center font-semibold text-gray-800">
                  Data kepemilikan
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <OwnStat label="Lahan" value={3} />
                  <OwnStat label="Tanaman" value={3} />
                  <OwnStat label="Gudang" value={3} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ============ PANEL PENGATURAN ============ */}
        <Card className="rounded-3xl border-none shadow-xl">
          <CardContent className="flex min-h-[320px] flex-col p-6 sm:p-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Pengaturan
              </h3>
              <p className="mb-4 text-sm text-gray-400">
                Atur preferensi tampilan dan akun kamu.
              </p>

              <div className="flex flex-col divide-y divide-gray-100">
                <SettingToggle
                  icon={<Moon className="size-5 text-green-700" />}
                  title="Mode Gelap"
                  desc="Ubah tema antarmuka jadi gelap"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                  id="setting-dark"
                />
                <SettingToggle
                  icon={<Bell className="size-5 text-green-700" />}
                  title="Notifikasi"
                  desc="Terima pemberitahuan aktivitas lahan"
                  checked={notifications}
                  onCheckedChange={setNotifications}
                  id="setting-notif"
                />
                <SettingToggle
                  icon={<Globe className="size-5 text-green-700" />}
                  title="Bahasa Inggris"
                  desc="Tampilkan antarmuka dalam Bahasa Inggris"
                  checked={englishLang}
                  onCheckedChange={setEnglishLang}
                  id="setting-lang"
                />
                <SettingLink
                  icon={<KeyRound className="size-5 text-green-700" />}
                  title="Ganti Password"
                  desc="Perbarui kata sandi akun kamu"
                  onClick={() => {
                    /* TODO: arahkan ke halaman ganti password */
                  }}
                />
                <SettingLink
                  icon={<ShieldCheck className="size-5 text-green-700" />}
                  title="Keamanan & Privasi"
                  desc="Kelola sesi login dan data akun"
                  onClick={() => {
                    /* TODO: arahkan ke halaman keamanan */
                  }}
                />
              </div>
            </div>

            {/* Tombol Simpan — pojok kanan bawah */}
            <div className="mt-auto flex justify-end pt-6">
              <Button
                className="min-w-32 bg-green-700 text-white hover:bg-green-800"
                onClick={handleSave}
              >
                Simpan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function FieldPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-1 text-sm font-semibold text-gray-700">{label}</p>
      <div className="flex items-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-white">
        <span className="shrink-0 opacity-80">{icon}</span>
        <span className="min-w-0 truncate text-sm">{value}</span>
      </div>
    </div>
  )
}

function OwnStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-green-600 px-2 py-4 text-white">
      <span className="text-xs opacity-90">{label}</span>
      <span className="text-2xl font-bold leading-tight">{value}</span>
    </div>
  )
}

function SettingToggle({
  icon,
  title,
  desc,
  checked,
  onCheckedChange,
  id,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
  id: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-100">
          {icon}
        </span>
        <div className="min-w-0">
          <Label
            htmlFor={id}
            className="cursor-pointer text-sm font-medium text-gray-800"
          >
            {title}
          </Label>
          <p className="truncate text-xs text-gray-400">{desc}</p>
        </div>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

function SettingLink({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between gap-3 py-4 text-left transition-colors hover:bg-gray-50"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-100">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800">{title}</p>
          <p className="truncate text-xs text-gray-400">{desc}</p>
        </div>
      </div>
      <ChevronRight className="size-5 shrink-0 text-gray-300" />
    </button>
  )
}
