import { createFileRoute, useParams } from '@tanstack/react-router'
import { Droplet, MapPin, Sun, Thermometer } from "lucide-react"
import axios from 'axios'

import { useEffect, useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import MapClient from '@/components/Map'
import { Calendar } from '@/components/ui/calendar'
import { reverseGeocode } from '@/utils/reversGeocode'

export const Route = createFileRoute('/dField/$id')({
  component: RouteComponent,
})

interface IMyField {
  id: number;
  name: string;
  description: string;
  thumbnail: string;
  location: {
    latitude: string;
    longitude: string;
  };
  area: string;
  owner: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
  address?: string;
}



function RouteComponent() {
  const [date, setDate] = useState<Date | undefined>(new Date(2020, 9, 8))
  const [field, setField] = useState<IMyField | null>(null);
  const { id } = useParams({ from: '/dField/$id' })

  useEffect(() => {
    const fetchField = async () => {
      try {
        const res = await axios.get<{ data: IMyField }>(
          `http://localhost:8000/api/myfields/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        const fetchData = res.data.data;

        let address = '';
        try {
          address = await reverseGeocode(fetchData.location.latitude, fetchData.location.longitude);
        } catch (err) {
          console.error("Reverse geocode failed:", err);
          address = 'Alamat tidak ditemukan';
        }

        setField({
          id: fetchData.id,
          name: fetchData.name,
          description: fetchData.description,
          thumbnail: fetchData.thumbnail,
          location: {
            latitude: fetchData.location.latitude,
            longitude: fetchData.location.longitude,
          },
          area: fetchData.area,
          owner: {
            id: fetchData.owner.id,
            name: fetchData.owner.name,
          },
          created_at: fetchData.created_at,
          updated_at: fetchData.updated_at,
          address: address,
        });
      } catch (error) {
        console.error('Error fetching field data:', error);
      }
    };

    fetchField();
  }, [id]);


  return (
    <div className="h-screen w-full relative">
      <img src="/bg-dashboard.png" alt="" className=' w-full h-[50%] object-cover' />
      <div className='absolute top-15 '>
        <div className="min-h-screen ">
          {/* Header */}
          <header className="mb-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex gap-2 text-white/80 text-sm">
                <span className="bg-green-500/80 px-3 py-1 rounded">Dashboard</span>
                <span className="px-3 py-1">/</span>
                <span className="bg-green-500/80 px-3 py-1 rounded">Lahan</span>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex p-4">
            <div className="max-w-6xl mx-auto space-y-4">
              <Card className="bg-white/90 backdrop-blur-sm">
                <CardContent className="p-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Alamat Lahan</TableHead>
                        <TableHead>{field?.address ?? 'Alamat belum tersedia'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Luas Lahan</TableCell>
                        <TableCell>{field?.area} M{'\u00b2'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Nama Pemilik</TableCell>
                        <TableCell>{field?.owner.name}</TableCell>
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
                          src="/lahan1.png"
                          alt="lahan 1"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="md:w-3/4 space-y-3">
                      <div className="flex justify-between items-start">
                        <h2 className="text-2xl font-bold">{field?.name}</h2>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {field?.description || 'Deskripsi belum tersedia.'}
                      </p>
                      <div className="pt-2">
                        <MapPin className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-600">{field?.area} M{'\u00b2'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className='flex'>
                <Card className='mr-5'>
                  <CardContent>
                    <div className="text-center">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}

                        className="rounded-md border"
                        defaultMonth={new Date(2020, 9)}
                      />
                    </div>
                    <div className="mt-4 ">
                      <div className="my-3">
                        <span className="text-sm font-medium">8 Oktober</span>
                        <p className="text-sm text-gray-600">Perkiraan Panen</p>
                      </div>
                      <div className="my-3 ">
                        <span className="text-sm font-medium">2 Oktober 15:00</span>
                        <p className="text-sm text-gray-600">Waktu Siram</p>
                      </div>
                      <div className="my-3 ">
                        <span className="text-sm font-medium">11 Oktober 15:00</span>
                        <p className="text-sm text-gray-600">Waktu Siram</p>
                      </div>
                      <div className="my-3">
                        <span className="text-sm font-medium">15 Oktober</span>
                        <p className="text-sm text-gray-600">Ceremony</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/95 shadow-md h-[50vh] w-[100%]">
                  <CardContent className="p-6 h-[50vh] w-[100%] ">
                    {field && (
                      <MapClient
                        center={[parseFloat(field.location.latitude), parseFloat(field.location.longitude)] as [number, number]}
                        radius={parseFloat(field.area)}
                        zoom={18}
                      />
                    )}
                  </CardContent>
                </Card>

              </div>
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
          <footer className="bg-green-900 text-white mt-5 w-full h-full">
            <div className="mx-10 ">
              <div className="grid grid-cols-1 md:grid-cols-3  ">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <img src="/logo1.png" alt="" className='w-xs' />
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
    </div>
  )
}
