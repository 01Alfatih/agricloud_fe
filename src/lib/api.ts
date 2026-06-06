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

export default api
