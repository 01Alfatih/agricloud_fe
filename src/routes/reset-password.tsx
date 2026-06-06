import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/ThemeToggle'

// Token & email datang dari link di email reset:
// /reset-password?token=...&email=...
export const Route = createFileRoute('/reset-password')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : '',
    email: typeof search.email === 'string' ? search.email : '',
  }),
  component: RouteComponent,
})

const schema = z
  .object({
    password: z.string().min(6, { message: 'Password minimal 6 karakter' }),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Konfirmasi password tidak cocok',
    path: ['confirm'],
  })

type ResetForm = z.infer<typeof schema>

const inputCls =
  'border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:border-white/10 dark:bg-[#1b2c22] dark:text-gray-100 dark:placeholder:text-gray-500'

function RouteComponent() {
  const navigate = useNavigate()
  const { token, email } = Route.useSearch()
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: ResetForm) => {
    setServerError(null)
    setSubmitting(true)
    try {
      await api.post('/auth/reset-password', {
        token,
        email,
        password: data.password,
        password_confirmation: data.confirm,
      })
      setDone(true)
    } catch (err: any) {
      setServerError(
        err?.response?.data?.message ??
          'Link reset tidak valid atau sudah kadaluarsa.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const invalidLink = !token || !email
  const cardCls =
    'rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#15211a] dark:shadow-none'

  return (
    <div className="relative flex h-screen w-full items-center justify-center bg-white px-6 text-gray-900 dark:bg-[#0c1410] dark:text-gray-100">
      <ThemeToggle className="absolute right-5 top-5 z-10" />

      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center">
          <img src="/logo.png" alt="AgriCloud" className="h-10 w-auto" />
        </div>

        {done ? (
          <div className={cardCls}>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#5cbb70]/15 text-[#2D6A4F] dark:text-[#5cbb70]">
              <CheckCircle2 size={28} />
            </div>
            <h1 className="mb-2 text-xl font-bold text-[#1B4332] dark:text-[#a7d1a7]">
              Password berhasil diubah
            </h1>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Silakan masuk dengan password barumu.
            </p>
            <Button
              onClick={() => navigate({ to: '/login-ii' })}
              className="w-full bg-[#2D6A4F] hover:bg-[#1B4332]"
            >
              KE HALAMAN LOGIN
            </Button>
          </div>
        ) : invalidLink ? (
          <div className={cardCls}>
            <h1 className="mb-2 text-xl font-bold text-[#1B4332] dark:text-[#a7d1a7]">
              Link tidak valid
            </h1>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Link reset password tidak lengkap. Minta link baru dari halaman
              lupa password.
            </p>
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#2D6A4F] hover:underline dark:text-[#5cbb70]"
            >
              <ArrowLeft size={16} /> Minta link baru
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <h1 className="mb-1 text-2xl font-bold text-[#1B4332] dark:text-[#a7d1a7]">
                Atur Ulang Password
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Password baru untuk{' '}
                <span className="text-gray-800 dark:text-gray-200">
                  {email}
                </span>
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="password">Password Baru</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password baru"
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

              <div className="space-y-2">
                <Label htmlFor="confirm">Konfirmasi Password</Label>
                <Input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ulangi password baru"
                  className={inputCls}
                  {...register('confirm')}
                />
                {errors.confirm && (
                  <span className="text-sm text-red-500 dark:text-red-400">
                    {errors.confirm.message}
                  </span>
                )}
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
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                SIMPAN PASSWORD BARU
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
