import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/ThemeToggle'

export const Route = createFileRoute('/forgot-password')({
  component: RouteComponent,
})

const schema = z.object({
  email: z.string().email({ message: 'Masukkan email yang valid' }),
})

type ForgotForm = z.infer<typeof schema>

const inputCls =
  'border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:border-white/10 dark:bg-[#1b2c22] dark:text-gray-100 dark:placeholder:text-gray-500'

function RouteComponent() {
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotForm>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: ForgotForm) => {
    setServerError(null)
    setSubmitting(true)
    try {
      await api.post('/auth/forgot-password', { email: data.email })
      // Selalu tampilkan sukses (anti email-enumeration), selama request tak error server.
      setSent(true)
    } catch (err: any) {
      setServerError(
        err?.response?.data?.message ??
          'Tidak bisa mengirim email reset. Coba lagi nanti.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex h-screen w-full items-center justify-center bg-white px-6 text-gray-900 dark:bg-[#0c1410] dark:text-gray-100">
      <ThemeToggle className="absolute right-5 top-5 z-10" />

      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center">
          <img src="/logo.png" alt="AgriCloud" className="h-10 w-auto" />
        </div>

        {sent ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#15211a] dark:shadow-none">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#5cbb70]/15 text-[#2D6A4F] dark:text-[#5cbb70]">
              <MailCheck size={28} />
            </div>
            <h1 className="mb-2 text-xl font-bold text-[#1B4332] dark:text-[#a7d1a7]">
              Cek email kamu
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Kalau{' '}
              <span className="text-gray-800 dark:text-gray-200">
                {getValues('email')}
              </span>{' '}
              terdaftar, kami sudah mengirim link untuk reset password. Cek juga
              folder spam.
            </p>
            <Link
              to="/login-ii"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#2D6A4F] hover:underline dark:text-[#5cbb70]"
            >
              <ArrowLeft size={16} /> Kembali ke login
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <h1 className="mb-1 text-2xl font-bold text-[#1B4332] dark:text-[#a7d1a7]">
                Lupa Password?
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Masukkan email kamu, kami kirim link untuk mengatur ulang
                password.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
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
                KIRIM LINK RESET
              </Button>
            </form>

            <Link
              to="/login-ii"
              className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-[#2D6A4F] hover:underline dark:text-[#5cbb70]"
            >
              <ArrowLeft size={16} /> Kembali ke login
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
