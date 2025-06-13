import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff } from "lucide-react"
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import axios from 'axios'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"



export const Route = createFileRoute('/login')({
  component: RouteComponent,
})

interface ILogin {
  email: string;
  password: string;
}

const schema = z.object({
  email: z.string().email({ message: "Masukkan email yang valid" }),
  password: z.string().min(6, { message: "Masukkan password minimal 6 karakter" }),
})


function RouteComponent() {

  const navigate = useNavigate();
  const signInLogin = (data: ILogin) => {
    axios.post('http://localhost:8000/api/auth/login', {
      email: data.email,
      password: data.password,
    }).then(async (response) => {
      const token = response.data.access_token;
      localStorage.setItem("token", token);
      await getToken();

    }).catch((error) => {
      if (error.status === 422) {
        alert("Email atau password salah, silahkan coba lagi!"); // Tampilkan pesan error jika email atau password salah
      }
      console.error("Login failed:", error.status); // Handle error jika terjadi kesalahan saat login
    })
  }

  const getToken = async () => {
    const token = await localStorage.getItem("token");
    if (token) {
      navigate({ to: '/dashboard' });
    }
  }
  useEffect(() => {
    getToken();
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ILogin>({
    resolver: zodResolver(schema),
  });

  const [showPassword, setShowPassword] = useState(false)
  return (
    <div className="flex h-screen w-full">
      {/* Left side - Login form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-8 md:px-16 lg:px-24 bg-white">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center items-center mb-8">
            <img src="/logo.png" alt="" className='' />
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-1">Selamat Datang Kembali</h1>
            <p className="text-gray-500 text-sm">Masukkan Email dan Password untuk masuk!</p>
          </div>

          {/* Form */}
          <div className="space-y-6" >
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input id="email" type="email" placeholder="Alamat Email" className="bg-pink-50 border-0"
                {...register("email")}
              />
              {errors.email && (
                <span className="text-red-500">{errors.email.message}</span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="bg-gray-50 border-0 pr-10"
                  {...register("password")}
                />
                {errors.password && (
                  <span className="text-red-500">{errors.password.message}</span>
                )}
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="remember" className="bg-[#1B4332] data-[state=checked]:bg-[#2D6A4F]" />
              <Label htmlFor="remember" className="text-sm">
                Ingat Saya
              </Label>
            </div>

            <Button type="submit" className="w-full bg-[#2D6A4F] hover:bg-[#1B4332]" onClick={handleSubmit(signInLogin)}>
              SIGN IN
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-500">Belum memiliki akun? </span>
              <Link to='/register' className="text-[#2D6A4F] font-medium" >Sign up</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Image */}
      <div
        className="h-[80%] hidden lg:block lg:w-1/2 bg-cover "
      >
        <img src="/login.png" alt="" className='w-full h-full bg-cover object-cover rounded-bl-2xl' />
      </div>
    </div>
  )
}
