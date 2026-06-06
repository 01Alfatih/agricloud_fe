import { Outlet, createRootRoute, useRouterState } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import { SidebarDs } from '@/components/Sidebar'
import { Toaster } from '@/components/ui/sonner'
import { PreferencesProvider } from '@/lib/preferences'

// Halaman tanpa navigasi: auth/redirect + form full-page (mis. peta lahan).
// Form pendek pakai modal jadi tetap di halaman list (sidebar tetap tampil).
const NO_NAV_PATHS = [
  '/',
  '/login',
  '/login-ii',
  '/register',
  '/register-ii',
  '/forgot-password',
  '/reset-password',
  '/formField',
  '/formField-ii',
  '/formCycle',
]

export const Route = createRootRoute({
  component: () => {
    const { location } = useRouterState()

    const hideNav = NO_NAV_PATHS.some(
      (path) =>
        location.pathname === path ||
        location.pathname === `${path}/` ||
        (path !== '/' && location.pathname.startsWith(`${path}/`)),
    )

    return (
      <PreferencesProvider>
        {!hideNav && <SidebarDs />}
        {/* SATU-SATUNYA tempat offset konten selebar sidebar (280px = lebar `aside`
            di Sidebar.tsx). Di mobile sidebar jadi drawer, konten full-width.
            ⚠️ Halaman JANGAN menambah `md:ml-[280px]`/`pl-[280px]` sendiri —
            nanti dobel offset (lihat bug gap putih). Root yang pegang ini. */}
        <main className={hideNav ? '' : 'md:pl-[280px]'}>
          <Outlet />
        </main>

        <Toaster />
        <TanStackRouterDevtools />
      </PreferencesProvider>
    )
  },
})
