import { GoogleLogin } from '@react-oauth/google'
import api from '@/lib/api'
import { extractToken, saveToken } from '@/lib/auth'

// Tombol "Masuk dengan Google" — handshake-nya FE (Google Identity Services).
// FE dapat `id_token` (credential JWT) → POST /api/auth/google { id_token } →
// backend verifikasi & balikan access_token Sanctum (lihat PESAN-BACKEND.md).
// Hanya muncul bila VITE_GOOGLE_CLIENT_ID terisi.
const HAS_GOOGLE = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)

interface Props {
  onAuthed: () => void
  onError?: (message: string) => void
}

export function GoogleAuthButton({ onAuthed, onError }: Props) {
  if (!HAS_GOOGLE) return null

  return (
    <div className="flex justify-center [color-scheme:light]">
      <GoogleLogin
        theme="filled_black"
        shape="pill"
        text="continue_with"
        width="320"
        onSuccess={async (cred) => {
          if (!cred.credential) {
            onError?.('Tidak ada kredensial dari Google.')
            return
          }
          try {
            const res = await api.post('/auth/google', {
              id_token: cred.credential,
            })
            const token = extractToken(res.data)
            if (!token) throw new Error('token kosong')
            saveToken(token)
            onAuthed()
          } catch {
            onError?.('Gagal masuk dengan Google. Coba lagi.')
          }
        }}
        onError={() => onError?.('Login Google dibatalkan atau gagal.')}
      />
    </div>
  )
}

export default GoogleAuthButton
