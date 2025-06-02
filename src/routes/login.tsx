import { createFileRoute } from '@tanstack/react-router'
import { Eye, EyeOff } from "lucide-react"
import { useState } from 'react'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"



export const Route = createFileRoute('/login')({
  component: RouteComponent,
})

function RouteComponent() {
  const [showPassword, setShowPassword] = useState(false)
  return (
    <div className="flex h-screen w-full">
      {/* Left side - Login form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-8 md:px-16 lg:px-24 bg-white">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center items-center mb-8">
            <img src="" alt="" className='bg-gray-400 h-20 w-40'/>
            <span className="text-3xl font-semibold text-[#1B4332]">AgriCloud</span>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-1">Selamat Datang Kembali</h1>
            <p className="text-gray-500 text-sm">Masukkan Email dan Password untuk masuk!</p>
          </div>

          {/* Form */}
          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input id="email" type="email" placeholder="Alamat Email" className="bg-pink-50 border-0" />
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
                />
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

            <Button type="submit" className="w-full bg-[#2D6A4F] hover:bg-[#1B4332]">
              SIGN IN
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-500">Belum memiliki akun? </span>
              <a href="#" className="text-[#2D6A4F] font-medium">
                Sign up
              </a>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Image */}
      <div
        className="h-[80%] hidden lg:block lg:w-1/2 bg-cover bg-center rounded-bl-2xl"
        
        style={{
          backgroundImage:
            "url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-60VaBInt6d7Pi8Hi4JLCeXWBuAC7qO.png')",
        }}
      ></div>
    </div>
  )
}
