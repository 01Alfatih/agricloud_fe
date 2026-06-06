import { Toaster as Sonner } from 'sonner'

import { usePreferences } from '@/lib/preferences'

type ToasterProps = React.ComponentProps<typeof Sonner>

// Toaster global. Tema ikut preferensi (light/dark) supaya senada dashboard.
export function Toaster(props: ToasterProps) {
  const { preferences } = usePreferences()

  return (
    <Sonner
      theme={preferences.theme}
      position="top-right"
      richColors
      closeButton
      {...props}
    />
  )
}
