import axios from 'axios'

// Axios instance terpusat untuk seluruh panggilan API AgriCloud.
// baseURL bisa di-override lewat env (VITE_API_URL); default ke backend dev 8005.
// Token Bearer otomatis disuntik dari storage('token').
// Dibaca dari localStorage (Ingat Saya) maupun sessionStorage (sesi sekali jalan).
//
// ⚠️ Key storage sengaja dibiarkan 'token' (bukan 'access_token') karena
// seluruh app existing sudah pakai key ini — migrasi key di luar scope.
export const TOKEN_KEY = 'token'

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8005/api'

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

// Token Sanctum kini ber-TTL (vault Tickets/Auth-TokenTTL). Saat kedaluwarsa,
// endpoint Bearer balas 401 → bersihkan token basi & lempar user ke login.
// Endpoint /auth/* dikecualikan: 401-nya berarti kredensial/ID-token salah
// (mis. Google login), bukan sesi yang habis.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status
    const url: string = error?.config?.url ?? ''
    const hadToken =
      localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
    if (status === 401 && hadToken && !url.includes('/auth/')) {
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
