import { Link , createFileRoute } from '@tanstack/react-router'
import { useState } from "react"
import { Apple, Eye, EyeOff, Facebook } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export const Route = createFileRoute('/register')({
  component: RouteComponent,
})

function RouteComponent() {
  const [showPassword, setShowPassword] = useState(false)
  return (
    <div className='h-screen w-full'>
      <div className="min-h-screen items-center justify-center bg-slate-100 p-4 h-screen relative">
        <img src="/div.banner-thumb.png" alt="" className=' w-full h-[50%] object-cover rounded-2xl' />
        <div className="flex flex-1 flex-col ">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center absolute top-25  left-1/2 -translate-x-1/2">
              <h1 className="text-3xl font-bold text-green-900 mb-2 ">Selamat Datang</h1>
              <p className="text-gray-600 text-center">
                Use these awesome forms to login or create new
                <br />
                account in your project for free.
              </p>
            </div>
            <div className=" w-1/4 rounded-lg p-6 shadow-sm absolute top-60 bg-white left-1/2 -translate-x-1/2">
              <div className="mb-6">
                <h2 className="text-lg font-medium mb-4 text-center">Register with</h2>
                <div className="flex justify-center gap-4">
                  <Button variant="outline" size="icon" className="rounded-md h-12 w-12">
                    <Facebook className="h-5 w-5 text-[#1877F2]" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-md h-12 w-12">
                    <Apple className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-md h-12 w-12">
                    <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                  </Button>
                </div>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-500">or</span>
                </div>
              </div>

              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Your full name" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Your email address" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Your password" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2 py-2">
                  <Switch id="remember" className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300" />
                  <Label htmlFor="remember" className="text-sm">
                    Remember me
                  </Label>
                </div>

                <Button className="w-full bg-green-500 hover:bg-green-700" size="lg">
                  SIGN UP
                </Button>

                <div className="mt-4 text-center text-sm text-gray-500">
                  Already have an account?{" "}
                  <Link to='/login' className="text-green-600 hover:underline">Sign in</Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
