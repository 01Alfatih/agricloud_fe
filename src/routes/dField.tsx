import { createFileRoute } from '@tanstack/react-router'
import {  Droplet, MapPin, Sun, Thermometer } from "lucide-react"

import { Card, CardContent  } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import MapClient from '@/components/Map'

export const Route = createFileRoute('/dField')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="h-screen w-full">
      <div className="min-h-screen bg-green-100 flex flex-col">
        {/* Header */}
        <header className="p-4 bg-green-900">
          <div className="max-w-6xl mx-auto">
            <div className="flex gap-2 text-white/80 text-sm">
              <span className="bg-green-500/80 px-3 py-1 rounded">Dashboard</span>
              <span className="px-3 py-1">/</span>
              <span className="bg-green-500/80 px-3 py-1 rounded">Lahan</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4">
          <div className="max-w-6xl mx-auto space-y-4">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardContent className="p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alamat Lahan</TableHead>
                      <TableHead>Nama Jalan, Desa, Kecamatan, Kabupaten, Provinsi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Luas Lahan</TableCell>
                      <TableCell>5 Hektar</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Nama Pemilik</TableCell>
                      <TableCell>Agung</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            {/* Plant Info Card */}
            <Card className="bg-white/95 shadow-md">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/4">
                    <div className="rounded-lg overflow-hidden bg-red-800">
                      <img
                        src="/placeholder.svg?height=200&width=300"
                        alt="Cabai (Red Chili Peppers)"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="md:w-3/4 space-y-3">
                    <div className="flex justify-between items-start">
                      <h2 className="text-2xl font-bold">Lahan 1</h2>
                      <span className="text-sm text-gray-500">Cabai </span>

                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Jenis tanaman hortikultura yang memiliki nilai ekonomis tinggi dan banyak dibudidayakan secara
                      komersial. Cabai merah cocok dibudidayakan, baik di dataran rendah maupun dataran tinggi, pada lahan
                      sawah atau tegalan dengan ketinggian 0-1000m dpl.
                    </p>
                    <div className="pt-2">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">5 Hektar</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/95 shadow-md h-[50vh] w-[100%]">
              <CardContent className="p-6 h-[50vh] w-[100%] ">

                    <MapClient center={[-6.625701, 106.837406]} zoom={20} radius={20}/>

              </CardContent>
            </Card>

            {/* Plant Condition Card */}
            <Card className="bg-white/95 shadow-md">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Kondisi Tanaman</h2>

                {/* Icons */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-200/80 p-4 rounded-lg flex flex-col items-center justify-center">
                    <Droplet className="h-8 w-8 text-green-800 mb-2" />
                    <span className="text-sm">Kadar Air</span>
                    <span className="text-sm font-medium">Baik</span>
                  </div>
                  <div className="bg-green-200/80 p-4 rounded-lg flex flex-col items-center justify-center">
                    <Sun className="h-8 w-8 text-green-800 mb-2" />
                    <span className="text-sm">Pencahayaan</span>
                    <span className="text-sm font-medium">80%</span>
                  </div>
                  <div className="bg-green-200/80 p-4 rounded-lg flex flex-col items-center justify-center">
                    <Thermometer className="h-8 w-8 text-green-800 mb-2" />
                    <span className="text-sm">Kelembapan</span>
                    <span className="text-sm font-medium">Baik</span>
                  </div>
                </div>

                {/* Nutrient Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Jenis Nutrisi</th>
                        <th className="text-left py-2 font-medium">Kebutuhan</th>
                        <th className="text-left py-2 font-medium">Kapasitas</th>
                        <th className="text-left py-2 font-medium">Hasil Akhir</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                            <span>Bio-Regulasi</span>
                          </div>
                          <div className="text-xs text-gray-500">NPK 16-16-16</div>
                        </td>
                        <td className="py-2">200 Kg</td>
                        <td className="py-2">50 Kg</td>
                        <td className="py-2">150 Kg</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                            <span>Zat Pengatur</span>
                          </div>
                          <div className="text-xs text-gray-500">NPK 16-16-16</div>
                        </td>
                        <td className="py-2">100 Kg</td>
                        <td className="py-2">50 Kg</td>
                        <td className="py-2">50 Kg</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                            <span>Perlindungan Bagian Luar</span>
                          </div>
                          <div className="text-xs text-gray-500">NPK 16-16-16</div>
                        </td>
                        <td className="py-2">200 Kg</td>
                        <td className="py-2">50 Kg</td>
                        <td className="py-2">150 Kg</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                            <span>Perlindungan Bagian Awal</span>
                          </div>
                          <div className="text-xs text-gray-500">NPK 16-16-16</div>
                        </td>
                        <td className="py-2">200 Kg</td>
                        <td className="py-2">50 Kg</td>
                        <td className="py-2">150 Kg</td>
                      </tr>
                      <tr>
                        <td className="py-2">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                            <span>Perkembangan</span>
                          </div>
                          <div className="text-xs text-gray-500">NPK 16-16-16</div>
                        </td>
                        <td className="py-2">200 Kg</td>
                        <td className="py-2">50 Kg</td>
                        <td className="py-2">150 Kg</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-green-900 text-white p-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <span className="text-green-800 font-bold">A</span>
                  </div>
                  <span className="text-xl font-bold">AgriCloud</span>
                </div>
                <p className="text-sm text-gray-300 mb-4">
                  Platform monitoring tanaman dan pertanian digital untuk meningkatkan produktivitas pertanian.
                </p>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-xs">f</span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-xs">t</span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-xs">in</span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-xs">ig</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-4">Explore</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span>•</span>
                    <span>Home</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>•</span>
                    <span>About</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>•</span>
                    <span>Our Work</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>•</span>
                    <span>Gallery</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>•</span>
                    <span>Contact</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold mb-4">Contact</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span>📞</span>
                    <span>+123456789</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>✉️</span>
                    <span>info@agricloud.com</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>📍</span>
                    <span>Jl. Pertanian Utama No. 123, Kota, Indonesia</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-green-800 text-xs text-gray-400 flex flex-col md:flex-row justify-between gap-2">
              <span>© 2024 AgriCloud. All rights reserved.</span>
              <div className="flex gap-4">
                <span>Terms of Use</span>
                <span>Privacy Policy</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
