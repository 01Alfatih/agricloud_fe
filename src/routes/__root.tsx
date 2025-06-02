import { Outlet, createRootRoute, useRouterState } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

// import Header from '@/components/Header'
import { SidebarDs } from '@/components/Sidebar'
import AgriCloudNavbar from '@/components/Header'

export const Route = createRootRoute({
  component: () => {
    const { location } = useRouterState()

    const hideHeader = [
      '/login',
      '/login/',
      '/register',
      '/register/',
      '/cycle',
      '/cycle/',
      '/crop',
      '/crop/',
      '/warehouse',
      '/warehouse/',
      '/field',
      '/field/',
      '/formCycle',
      '/formCycle/',
      '/formField',
      '/formField/',
      '/dfield',
      '/dfield/',
      '/dCycle',
      '/dCycle/',
      '/dWarehouse',
      '/dWarehouse/',
    ].includes(location.pathname)

    const showHeader = [
      '/cycle',
      '/cycle/',
      '/crop',
      '/crop/',
      '/warehouse',
      '/warehouse/',
      '/field',
      '/field/',
      '/dfield',
      '/dfield/',
      '/dCycle',
      '/dCycle/',
      '/dWarehouse',
      '/dWarehouse/',
      '/ddWarehouse',
      '/ddWarehouse/',
    ].includes(location.pathname)

    return (
      <>
        {showHeader && <AgriCloudNavbar  currentPath={location.pathname} />}
        <div className="flex ">
          {!hideHeader && <SidebarDs />}
          <Outlet />
        </div>

        <TanStackRouterDevtools />
      </>
    )
  },
}) 