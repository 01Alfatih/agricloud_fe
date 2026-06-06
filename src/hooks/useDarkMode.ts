import { useEffect, useState } from 'react'

// Dark mode global: toggle class `.dark` di <html>, persist ke localStorage('theme'),
// fallback ke preferensi OS. Sumber kebenaran tunggal dipakai sidebar (global) &
// halaman -ii lain. Default: dark.
export function useDarkMode() {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return true // default: dark
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return [dark, () => setDark((d) => !d)] as const
}
