import { createFileRoute } from '@tanstack/react-router'
import { Cloud, Leaf } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"


export const Route = createFileRoute('/formField')({
  component: RouteComponent,
})

function RouteComponent() {
  return ( 
  <div
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center p-4"
      style={{
        backgroundImage: "url('https://cdn.antaranews.com/cache/1200x800/2022/01/26/IMG_20211107_070110.jpg')",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="relative">
          <Cloud className="w-12 h-12 text-white" />
          <Leaf className="w-6 h-6 text-white absolute top-2 left-3" />
        </div>
        <h1 className="text-white text-4xl font-light">AgriCloud</h1>
      </div>

      {/* Form Card */}
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <h2 className="text-center text-gray-700 font-medium">Tambah Tanam Baru</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nama-tanaman" className="text-gray-600 text-sm">
              Nama Lahan
            </Label>
            <Input
              id="nama-tanaman"
              className="border-0 border-b border-gray-300 rounded-none bg-transparent focus:border-gray-500 focus:ring-0 px-0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jenis-tanaman" className="text-gray-600 text-sm">
              Lokasi Lahan
            </Label>
            <Input
              id="jenis-tanaman"
              className="border-0 border-b border-gray-300 rounded-none bg-transparent focus:border-gray-500 focus:ring-0 px-0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lokasi-lahan" className="text-gray-600 text-sm">
              Luas Lahan
            </Label>
            <Input
              id="lokasi-lahan"
              className="border-0 border-b border-gray-300 rounded-none bg-transparent focus:border-gray-500 focus:ring-0 px-0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tanggal-mulai" className="text-gray-600 text-sm">
              Tanggal Mulai Tanam
            </Label>
            <Input
              id="tanggal-mulai"
              type="date"
              className="border-0 border-b border-gray-300 rounded-none bg-transparent focus:border-gray-500 focus:ring-0 px-0"
            />
          </div>

          <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 mt-8">Mulai</Button>
        </CardContent>
      </Card>
    </div>
  )
}
