import { Link, createFileRoute } from '@tanstack/react-router'
import { MapPin, MoreHorizontal, Plus, Search, Square, User, } from "lucide-react"
import { useEffect, useState } from 'react'
import axios from 'axios'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { reverseGeocode } from '@/utils/reversGeocode'

export const Route = createFileRoute('/field')({
  component: RouteComponent,
})

// const lands = [
//   {
//     id: 1,
//     name: "Lahan 1",
//     crop: "CABAI",
//     cropIcon: "🌶️",
//     owner: "Agung P",
//     location: "Brebes",
//     area: "5 Hektar",
//     image: "/lahan.png",
//   },
//   {
//     id: 2,
//     name: "Lahan 2",
//     crop: "ANGGUR",
//     cropIcon: "🍇",
//     owner: "Agung P",
//     location: "Brebes",
//     area: "5 Hektar",
//     image: "/lahan.png",
//   },
//   {
//     id: 3,
//     name: "Lahan 3",
//     crop: "ANGGUR",
//     cropIcon: "🍅",
//     owner: "Agung P",
//     location: "Brebes",
//     area: "5 Hektar",
//     image: "/lahan.png",
//   },
// ]

interface Ifield {
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

interface IfieldResponse {
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
}

function RouteComponent() {
  const [fields, setFields] = useState<Array<Ifield>>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get<{ data: Array<IfieldResponse> }>('http://localhost:8000/api/myfields', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const enrichedFields: Array<Ifield> = await Promise.all(
          response.data.data.map(async (field) => {
            let address = '';
            try {
              address = await reverseGeocode(field.location.latitude, field.location.longitude);
            } catch (err) {
              console.error("Geocode error:", err);
              address = "Alamat tidak ditemukan";
            }

            return {
              id: field.id,
              name: field.name,
              thumbnail: field.thumbnail,
              description: field.description,
              location: {
                latitude: field.location.latitude,
                longitude: field.location.longitude,
              },
              area: field.area,
              owner: {
                id: field.owner.id,
                name: field.owner.name || 'Tidak diketahui',
              },
              created_at: field.created_at,
              updated_at: field.updated_at,
              address,
            };
          })
        );

        setFields(enrichedFields);
      } catch (error) {
        console.error("Error fetching fields data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className='h-screen w-full relative'>
      {/* Header Image */}
      <img src="/bg-dashboard.png" alt="" className='w-full h-[50%] object-cover' />

      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="absolute top-15 left-[80%] transform -translate-x-1/4">
          <div className="flex justify-end-safe mb-8">
            <div className="relative w-full max-w-md md:max-w-xl">
              <Input
                type="text"
                placeholder="Cari Lahan Anda"
                className="w-full pl-4 pr-12 py-3 rounded-full bg-green-200/80 border-0 placeholder:text-green-800 text-green-800 backdrop-blur-sm"
              />
              <Button
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full bg-white hover:bg-gray-100 text-gray-600 w-8 h-8 p-0"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="absolute top-30 left-1/2 transform -translate-x-1/2 w-full">
          <Card className="mx-[10%] bg-white/95 backdrop-blur-sm shadow-sm">
            <CardContent className="p-6">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Lahan</h1>
                <p className="text-sm text-gray-500">{fields.length} Lahan Digunakan</p>
              </div>

              {/* Grid Lahan */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {fields.map((land) => (
                  <Card key={land.id} className="overflow-hidden border-0 shadow-lg">
                    <div className="relative">
                      {/* Image */}
                      <div
                        className="h-48 bg-cover bg-center relative"
                        style={{ backgroundImage: `url('${land.thumbnail || "/lahan.png"}')` }}
                      >
                        <div className="absolute inset-0 bg-black/30" />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-3 right-3 text-white hover:bg-white/20 rounded-full w-8 h-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                          <div className="text-center mt-2">
                            <span className="bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
                              {land.thumbnail}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-3">{land.name}</h3>
                        <div className="flex justify-between   space-y-2 mb-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-500" />
                            <span>{land.owner.name ?? '-'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-red-500" />
                            <span>{land.address || "Memuat alamat..."}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Square className="h-4 w-4 text-yellow-500" />
                            <span>{land.area}</span>
                          </div>
                        </div>
                        <Link to="/dField/$id" params={{ id: land.id.toString() }}>
                          <Button
                            variant="outline"
                            className="w-full rounded-full border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            LIHAT
                          </Button>
                        </Link>
                      </CardContent>
                    </div>
                  </Card>
                ))}

                {/* Add New Land Card */}
                <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer">
                  <Link to="/formField">
                    <CardContent className="p-8 flex flex-col items-center justify-center h-full min-h-[300px]">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                        <Plus className="h-8 w-8 text-gray-500" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-700 text-center">Tambah Lahan Baru</h3>
                    </CardContent>
                  </Link>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
