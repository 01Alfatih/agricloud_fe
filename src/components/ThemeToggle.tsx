import { Moon, Sun } from 'lucide-react'
import { useDarkMode } from '@/lib/preferences'

// Tombol ganti tema (light/dark) untuk halaman auth yang berdiri sendiri
// (tanpa sidebar). Nyambung ke PreferencesProvider global → pilihan tersimpan
// & konsisten lintas halaman.
export function ThemeToggle({ className = '' }: { className?: string }) {
  const [dark, toggle] = useDarkMode()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Ganti tema"
      title={dark ? 'Mode terang' : 'Mode gelap'}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:bg-[#15211a] dark:text-gray-300 dark:hover:bg-white/5 ${className}`}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}

export default ThemeToggle
