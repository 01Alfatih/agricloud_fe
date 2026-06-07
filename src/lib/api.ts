import axios from 'axios'

// Axios instance terpusat untuk seluruh panggilan API AgriCloud.
// baseURL WAJIB datang dari env (VITE_API_URL) — TANPA fallback localhost.
// Kalau env tak di-set, baseURL `undefined` → request gagal terang-terangan
// (bukan diam-diam nyasar ke localhost saat deploy).
// Token Bearer otomatis disuntik dari storage('token').
// Dibaca dari localStorage (Ingat Saya) maupun sessionStorage (sesi sekali jalan).
//
// ⚠️ Key storage sengaja dibiarkan 'token' (bukan 'access_token') karena
// seluruh app existing sudah pakai key ini — migrasi key di luar scope.
export const TOKEN_KEY = 'token'

export const API_BASE_URL = import.meta.env.VITE_API_URL

export const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Endpoint kredensial: 401-nya berarti kredensial/ID-token salah (bukan sesi
// habis), jadi JANGAN bersihkan token / redirect. `/auth/user` SENGAJA tidak
// di sini — itu cek sesi, 401-nya = token kedaluwarsa/invalid → harus logout.
const CREDENTIAL_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/google',
  '/auth/forgot-password',
  '/auth/reset-password',
]

// Token kini ber-TTL (vault Tickets/Auth-TokenTTL). Saat kedaluwarsa, endpoint
// Bearer balas 401 → bersihkan token basi & lempar user ke login.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status
    const url: string = error?.config?.url ?? ''
    const isCredentialCall = CREDENTIAL_ENDPOINTS.some((p) => url.includes(p))
    const hadToken =
      localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
    if (status === 401 && hadToken && !isCredentialCall) {
      localStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(TOKEN_KEY)
      if (window.location.pathname !== '/login-ii') {
        window.location.href = '/login-ii'
      }
    }
    return Promise.reject(error)
  },
)

export default api
