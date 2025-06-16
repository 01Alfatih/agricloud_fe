import { Outlet, createRootRoute, useRouterState } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

// import Header from '@/components/Header'
import { SidebarDs } from '@/components/Sidebar'
import AgriCloudNavbar from '@/components/Header'

export const Route = createRootRoute({
  component: () => {
    const { location } = useRouterState()

    const basePathsHide = [
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
      '/dField',
      '/dField/',
      '/dCycle',
      '/dCycle/',
      '/dWarehouse',
      '/dWarehouse/',
      '/profile',
      '/profile/',
      '/'
    ]



    const basePaths = [
      '/cycle',
      '/cycle/',
      '/crop',
      '/crop/',
      '/warehouse',
      '/warehouse/',
      '/field',
      '/field/',
      '/dField',
      '/dField/',
      '/dCycle',
      '/dCycle/',
      '/dWarehouse',
      '/dWarehouse/',
      '/ddWarehouse',
      '/ddWarehouse/',
      '/profile',
      '/profile/',
      '/eProfile/',
      '/eProfile/$id',
      
    ]

    const showHeader = basePaths.some(path => 
  location.pathname === path || location.pathname.startsWith(`${path}/`)
); 

    const hideHeader = basePathsHide.some(path => 
  location.pathname === path || location.pathname.startsWith(`${path}/`)
); 

    return (
      <>
        {showHeader && <AgriCloudNavbar  currentPath={location.pathname} />}
        <div className=" ">
          {!hideHeader && <SidebarDs />}
          <Outlet />
          
        </div>

        <TanStackRouterDevtools />
      </>
    )
  },
}) 