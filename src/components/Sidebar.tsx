import {
  HelpCircle,
  Home,
  Layers,
  Leaf,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  Warehouse,
  X,
} from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { NotificationBell } from '@/components/NotificationBell'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { clearToken, getToken } from '@/lib/auth'

type NavLink = {
  icon: ReactNode
  label: string
  to?: string
}

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
  email_verified_at: null | string
  phone_number: string
  role: string
  profile_photo: null | string
  created_at: Date
  updated_at: Date
  profile_photo_url: null | string
}

// Menu utama — tambah/ubah item cukup di sini.
const MAIN_NAV: NavLink[] = [
  { icon: <Home size={18} />, label: 'Dashboard', to: '/dashboard-ii' },
  { icon: <Layers size={18} />, label: 'Lahan', to: '/field-ii' },
  { icon: <Leaf size={18} />, label: 'Tanaman', to: '/cycle-ii' },
  { icon: <Warehouse size={18} />, label: 'Gudang', to: '/warehouse-ii' },
]

const SECONDARY_NAV: NavLink[] = [
  // Pusat Bantuan masih statis (belum ada route) — biarkan tanpa `to` dulu.
  { icon: <HelpCircle size={18} />, label: 'Pusat Bantuan' },
  { icon: <Settings size={18} />, label: 'Pengaturan', to: '/settings-ii' },
]

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

const navItemClass =
  'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white'

const navActiveClass =
  'bg-[#2a7039] text-white hover:bg-[#2a7039] dark:bg-[#1d3327] dark:hover:bg-[#1d3327] before:absolute before:left-0 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-[#a3e0b5] dark:before:bg-[#5cbb70]'

function NavItem({
  icon,
  label,
  to,
  onNavigate,
}: NavLink & { onNavigate?: () => void }) {
  const content = (
    <>
      <span className="shrink-0 text-[#a3e0b5] transition-colors group-hover:text-white dark:text-[#5cbb70]">
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </>
  )

  // Item tanpa route → render sebagai tombol placeholder (statis).
  if (!to) {
    return (
      <button type="button" onClick={onNavigate} className={navItemClass}>
        {content}
      </button>
    )
  }

  return (
    <Link
      to={to}
      onClick={onNavigate}
      activeOptions={{ exact: false }}
      className={navItemClass}
      activeProps={{ className: navActiveClass }}
    >
      {content}
    </Link>
  )
}

function SidebarSkeleton() {
  return (
    <div className="flex-1 space-y-2 px-3 py-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-lg bg-white/10" />
      ))}
    </div>
  )
}

export function SidebarDs() {
  const navigate = useNavigate()
  const [dark, toggleDark] = useDarkMode()
  const [profile, setProfile] = useState<IProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [open, setOpen] = useState<boolean>(false)
  const closeSidebar = () => setOpen(false)

  // Redirect ke login kalau token tidak ada (cek localStorage & sessionStorage).
  useEffect(() => {
    if (!getToken()) {
      navigate({ to: '/login-ii' })
    }
  }, [navigate])

  // Ambil data profil (dinamis dari API). Pakai instance `api` terpusat agar
  // token Bearer ikut aturan storage "Ingat Saya" (local/session) yang sama.
  useEffect(() => {
    api
      .get<{ data: IProfileResponse }>('/auth/user')
      .then((response) => {
        const data = response.data.data
        setProfile({
          name: data.name,
          email: data.email,
          pNumber: data.phone_number,
          role: data.role,
          photoUrl: data.profile_photo_url,
        })
      })
      .catch((error) => {
        console.error('Error fetching profile data:', error)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  // Tutup drawer dengan tombol ESC + kunci scroll body saat terbuka (mobile).
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSidebar()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open])

  const handleLogout = () => {
    clearToken()
    toast.success('Berhasil keluar')
    navigate({ to: '/login-ii' })
  }

  return (
    <>
      {/* Hamburger toggle (mobile only) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buka menu"
        aria-expanded={open}
        className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-[#0B4619] text-white shadow-md md:hidden dark:bg-[#15211a]"
      >
        <Menu size={20} />
      </button>

      {/* Backdrop (mobile only, when open) */}
      {open && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar — lebar 280px HARUS sinkron dgn `md:pl-[280px]` di __root.tsx */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col bg-[#0B4619] text-white shadow-xl dark:bg-[#0f1812] dark:border-r dark:border-white/5',
          'transition-transform duration-300 ease-in-out md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo + notifikasi + close (mobile) */}
        <div className="flex items-center justify-between gap-2 px-5 pt-7 pb-4">
          <img src="/logo1.png" alt="AgriCloud" className="h-7 w-auto" />
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button
              type="button"
              onClick={closeSidebar}
              aria-label="Tutup menu"
              className="text-white/70 transition-colors hover:text-white md:hidden"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        {loading ? (
          <SidebarSkeleton />
        ) : (
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
            <p className="px-3 pt-1 pb-2 text-[11px] font-semibold tracking-widest text-[#a3e0b5]/60 uppercase">
              Menu
            </p>
            {MAIN_NAV.map((item) => (
              <NavItem key={item.label} {...item} onNavigate={closeSidebar} />
            ))}

            <p className="px-3 pt-5 pb-2 text-[11px] font-semibold tracking-widest text-[#a3e0b5]/60 uppercase">
              Lainnya
            </p>
            {SECONDARY_NAV.map((item) => (
              <NavItem key={item.label} {...item} onNavigate={closeSidebar} />
            ))}

            {/* Toggle tema — kontrol global dark/light untuk semua halaman. */}
            <button
              type="button"
              onClick={toggleDark}
              aria-label="Ganti mode terang/gelap"
              className={navItemClass}
            >
              <span className="shrink-0 text-[#a3e0b5] transition-colors group-hover:text-white dark:text-[#5cbb70]">
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </span>
              <span className="truncate">
                {dark ? 'Mode Terang' : 'Mode Gelap'}
              </span>
            </button>
          </nav>
        )}

        {/* User Profile (footer card) */}
        <div className="p-3">
          <div className="rounded-xl bg-black/20 p-3 dark:bg-[#15211a]">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 shrink-0 ring-2 ring-[#2a7039] dark:ring-[#1d3327]">
                {profile?.photoUrl ? (
                  <AvatarImage src={profile.photoUrl} alt={profile.name} />
                ) : null}
                <AvatarFallback className="bg-[#2a7039] text-sm font-semibold text-white dark:bg-[#1d3327]">
                  {profile ? getInitials(profile.name) : '?'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">
                    {profile?.name ?? 'Memuat...'}
                  </span>
                  {profile?.role ? (
                    <span className="shrink-0 rounded-full bg-[#2a7039] px-2 py-0.5 text-[10px] font-medium text-[#a3e0b5] capitalize dark:bg-[#1d3327] dark:text-[#5cbb70]">
                      {profile.role}
                    </span>
                  ) : null}
                </div>
                <div className="truncate text-xs text-white/60">
                  {profile?.email ?? ''}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut size={16} />
              Keluar
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
