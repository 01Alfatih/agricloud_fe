import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import api from '@/lib/api'
import { extractToken, isAuthed, saveToken } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { GoogleAuthButton } from '@/components/GoogleAuthButton'
import { SplashLiquid } from '@/components/SplashLiquid'
import { ThemeToggle } from '@/components/ThemeToggle'

export const Route = createFileRoute('/login-ii')({
  component: RouteComponent,
})

const schema = z.object({
  email: z.string().email({ message: 'Masukkan email yang valid' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter' }),
})

type LoginForm = z.infer<typeof schema>

const inputCls =
  'border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:border-white/10 dark:bg-[#1b2c22] dark:text-gray-100 dark:placeholder:text-gray-500'

function RouteComponent() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showSplash, setShowSplash] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [remember, setRemember] = useState(true)

  // Sudah login → langsung ke dashboard (tanpa splash).
  useEffect(() => {
    if (isAuthed()) navigate({ to: '/dashboard-ii' })
  }, [navigate])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: LoginForm) => {
    setServerError(null)
    setSubmitting(true)
    try {
      // `remember` dikirim ke backend agar TTL token menyesuaikan:
      // true → TTL panjang (30 hari), false → TTL default (1 hari).
      // (selaras pilihan storage di saveToken — lihat vault Tickets/Auth-TokenTTL.)
      const res = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
        remember,
      })
      const token = extractToken(res.data)
      if (!token) throw new Error('token kosong')
      saveToken(token, remember)
      setShowSplash(true)
    } catch (err: any) {
      setServerError(
        err?.response?.status === 422
          ? 'Email atau password salah, silakan coba lagi.'
          : 'Tidak bisa terhubung ke server. Coba lagi nanti.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (showSplash) {
    return <SplashLiquid onDone={() => navigate({ to: '/dashboard-ii' })} />
  }

  return (
    <div className="relative flex h-screen w-full bg-white text-gray-900 dark:bg-[#0c1410] dark:text-gray-100">
      <ThemeToggle className="absolute right-5 top-5 z-10" />

      {/* Kiri — form */}
      <div className="flex w-full flex-col items-center justify-center px-8 md:px-16 lg:w-1/2 lg:px-24">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-center">
            <img src="/logo.png" alt="AgriCloud" className="h-10 w-auto" />
          </div>

          <div className="mb-8 text-center">
            <h1 className="mb-1 text-2xl font-bold text-[#1B4332] dark:text-[#a7d1a7]">
              Selamat Datang Kembali
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Masukkan email dan password untuk masuk
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Alamat email"
                className={inputCls}
                {...register('email')}
              />
              {errors.email && (
                <span className="text-sm text-red-500 dark:text-red-400">
                  {errors.email.message}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className={`${inputCls} pr-10`}
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <span className="text-sm text-red-500 dark:text-red-400">
                  {errors.password.message}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="remember"
                  checked={remember}
                  onCheckedChange={setRemember}
                  className="data-[state=checked]:bg-[#5cbb70]"
                />
                <Label
                  htmlFor="remember"
                  className="text-sm text-gray-600 dark:text-gray-300"
                >
                  Ingat Saya
                </Label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-[#2D6A4F] hover:underline dark:text-[#5cbb70]"
              >
                Lupa password?
              </Link>
            </div>

            {serverError && (
              <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:bg-red-500/15 dark:text-red-300">
                {serverError}
              </p>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#2D6A4F] hover:bg-[#1B4332]"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              MASUK
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
            <div className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
            atau
            <div className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
          </div>

          <GoogleAuthButton
            onAuthed={() => setShowSplash(true)}
            onError={setServerError}
          />

          <div className="mt-8 text-center text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              Belum memiliki akun?{' '}
            </span>
            <Link
              to="/register-ii"
              className="font-medium text-[#2D6A4F] dark:text-[#5cbb70]"
            >
              Daftar
            </Link>
          </div>
        </div>
      </div>

      {/* Kanan — gambar */}
      <div className="hidden lg:block lg:w-1/2">
        <img
          src="/login.png"
          alt=""
          className="h-full w-full rounded-bl-3xl object-cover"
        />
      </div>
    </div>
  )
}
