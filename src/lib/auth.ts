import { TOKEN_KEY } from './api'

// Helper auth bersama login/register/oauth/reset.
// Backend kadang membungkus token nested (`data.data.access_token`, dari login)
// kadang flat (`data.access_token`, dari register lama) — fungsi ini menormalkan
// keduanya jadi satu sumber kebenaran sampai backend diseragamkan
// (lihat PESAN-BACKEND.md §2).

export function extractToken(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, any>
  return (
    root.data?.data?.access_token ??
    root.data?.access_token ??
    root.access_token ??
    null
  )
}

// "Ingat Saya" diputuskan murni di frontend lewat pilihan storage:
// - remember=true  → localStorage (tahan walau browser ditutup)
// - remember=false → sessionStorage (hangus saat tab/browser ditutup)
// Storage lawan selalu dibersihkan agar tidak ada token basah yang nyangkut.
// (Kalau backend nanti mau atur masa kadaluarsa token, lihat PESAN-BACKEND.md §17.)
export function saveToken(token: string, remember = true) {
  const target = remember ? localStorage : sessionStorage
  const other = remember ? sessionStorage : localStorage
  other.removeItem(TOKEN_KEY)
  target.setItem(TOKEN_KEY, token)
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}

export function isAuthed(): boolean {
  return Boolean(getToken())
}
