import { GoogleLogin, useGoogleOneTapLogin } from '@react-oauth/google'
import api from '@/lib/api'
import { extractToken, isAuthed, saveToken } from '@/lib/auth'

// Tombol "Masuk dengan Google" + Google One Tap (auto-select).
// Handshake-nya FE (Google Identity Services). FE dapat `id_token` (credential JWT)
// → POST /api/auth/google { id_token } → backend verifikasi & balikan access_token
// Sanctum (lihat PESAN-BACKEND.md §15 / [[Integration-GoogleOAuth-Hasil]]).
//
// One Tap (`auto_select: true`): returning user yang sudah pernah consent &
// punya satu sesi Google akan auto-login tanpa harus pilih akun lagi. Prompt
// dimatikan bila user sudah punya token app (isAuthed) agar tak mengganggu.
// Hanya muncul bila VITE_GOOGLE_CLIENT_ID terisi.
const HAS_GOOGLE = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)

interface Props {
  onAuthed: () => void
  onError?: (message: string) => void
}

export function GoogleAuthButton({ onAuthed, onError }: Props) {
  // Hook harus dipanggil tanpa syarat (rules of hooks) — `disabled` yang
  // mengatur aktif/tidaknya One Tap, bukan early-return.
  useGoogleOneTapLogin({
    auto_select: true,
    disabled: !HAS_GOOGLE || isAuthed(),
    onSuccess: (cred) => exchangeToken(cred.credential),
    onError: () => onError?.('Login Google dibatalkan atau gagal.'),
  })

  if (!HAS_GOOGLE) return null

  // Tukar Google id_token → access_token Sanctum lalu lapor ke pemanggil.
  // Dipakai bersama oleh tombol klik dan One Tap.
  async function exchangeToken(credential?: string) {
    if (!credential) {
      onError?.('Tidak ada kredensial dari Google.')
      return
    }
    try {
      const res = await api.post('/auth/google', { id_token: credential })
      const token = extractToken(res.data)
      if (!token) throw new Error('token kosong')
      saveToken(token)
      onAuthed()
    } catch (err: any) {
      // 401 = kredensial Google ditolak; selain itu anggap masalah jaringan/server.
      onError?.(
        err?.response?.status === 401
          ? 'Sesi Google tidak valid, coba lagi.'
          : 'Gagal masuk dengan Google. Coba lagi.',
      )
    }
  }

  return (
    <div className="flex justify-center [color-scheme:light]">
      <GoogleLogin
        theme="filled_black"
        shape="pill"
        text="continue_with"
        width="320"
        onSuccess={(cred) => exchangeToken(cred.credential)}
        onError={() => onError?.('Login Google dibatalkan atau gagal.')}
      />
    </div>
  )
}

export default GoogleAuthButton
