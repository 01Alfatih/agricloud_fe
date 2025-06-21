import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import axios from 'axios'
import type { ChangeEvent } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"


export const Route = createFileRoute('/formField')({
  component: RouteComponent,
})

interface IMyField {
  id: number;
  name: string;
  description: string;
  thumbnail: File | null;
  location: {
    latitude: string;
    longitude: string;
  };
  area: string;
}




function RouteComponent() {
  const navigate = useNavigate();
  const [locationString, setLocationString] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof IMyField | 'locationString', string>>>({});
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState<IMyField>({
    id: 0,
    name: '',
    description: '',
    area: '',
    location: {
      latitude: '',
      longitude: '',
    },
    thumbnail: null,
  });

  // Redirect jika tidak ada token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate({ to: '/login' });
    }
  }, []);

  // Handle kirim form
  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate({ to: '/login' });
      return;
    }

    const newErrors: Partial<Record<keyof IMyField | 'locationString', string>> = {};

    if (!formData.name.trim()) newErrors.name = "Nama lahan wajib diisi.";
    if (!formData.description.trim()) newErrors.description = "Deskripsi wajib diisi.";
    if (!formData.area.trim()) newErrors.area = "Luas lahan wajib diisi.";
    if (!locationString.trim()) {
      newErrors.locationString = "Lokasi wajib diisi.";
    } else {
      const [lat, lon] = locationString.split(',').map((part) => part.trim());
      if (!lat || !lon || isNaN(Number(lat)) || isNaN(Number(lon))) {
        newErrors.locationString = "Format lokasi harus 'latitude, longitude'.";
      }
    }
    if (!formData.thumbnail) newErrors.thumbnail = "Gambar lahan wajib dipilih.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const [lat, lon] = locationString.split(',').map((part) => part.trim());
    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('area', formData.area);
    data.append('latitude', lat);
    data.append('longitude', lon);
    if (formData.thumbnail) data.append('thumbnail', formData.thumbnail);

    try {
      const response = await axios.post('http://localhost:8000/api/myfields', data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log("Lahan berhasil ditambahkan:", response.data);
      navigate({ to: '/field' });
    } catch (error) {
      console.error("Gagal mengirim data lahan:", error);
      alert("Terjadi kesalahan saat mengirim data.");
    }
  };



  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleLocationChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocationString(value);

    const [lat, lon] = value.split(',').map((part) => part.trim());
    setFormData((prev) => ({
      ...prev,
      location: {
        latitude: lat || '',
        longitude: lon || '',
      },
    }));
  };


  return (
    <div
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center p-4"
      style={{
        backgroundImage: "url('/form.png')",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <img src="/logo1.png" alt="" className='w-xs' />
      </div>

      {/* Form Card */}
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <h2 className="text-center text-gray-700 font-medium">Tambah Lahan Baru</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-600 text-sm">
              Nama Lahan
            </Label>
            <Input
              id="name"
              className="border-0 border-b border-gray-300 rounded-none bg-transparent focus:border-gray-500 focus:ring-0 px-0"
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="jenis-tanaman" className="text-gray-600 text-sm">
              Lokasi Lahan
            </Label>
            <Input
              className="border-0 border-b border-gray-300 rounded-none bg-transparent focus:border-gray-500 focus:ring-0 px-0"
              id="location"
              value={locationString}
              onChange={handleLocationChange}
              placeholder="-6.20, 106.81"
            />
            {errors.locationString && <p className="text-red-500 text-sm">{errors.locationString}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lokasi-lahan" className="text-gray-600 text-sm">
              Deskripsi
            </Label>
            <Input
              className="border-0 border-b border-gray-300 rounded-none bg-transparent focus:border-gray-500 focus:ring-0 px-0"
              id="description"
              value={formData.description}
              onChange={handleChange}
            />
            {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lokasi-lahan" className="text-gray-600 text-sm">
              Luas Lahan
            </Label>
            <Input
              className="border-0 border-b border-gray-300 rounded-none bg-transparent focus:border-gray-500 focus:ring-0 px-0"
              placeholder='Contoh: 1000 m²'
              id="area"
              value={formData.area}
              onChange={handleChange}
            />
            {errors.area && <p className="text-red-500 text-sm">{errors.area}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lokasi-lahan" className="text-gray-600 text-sm">
              Tambah Gambar Lahan
            </Label>
            {thumbnailUrl && (
              <img
                src={thumbnailUrl}
                alt="Gambar Lahan"
                className="w-full h-48 object-cover rounded mb-2"
              />
            )}
            <Input
              id="thumbnail"
              type="file"
              accept="image/*"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0] || null;
                setFormData({ ...formData, thumbnail: file });
                if (file) {
                  setThumbnailUrl(URL.createObjectURL(file)); //  Generate preview URL dari file yang dipilih
                } else {
                  setThumbnailUrl(null); // jika file dihapus
                }
              }}
              className="border-0 border-b border-gray-300 rounded-none bg-transparent focus:border-gray-500 focus:ring-0 px-0"
            />
            {errors.thumbnail && <p className="text-red-500 text-sm">{errors.thumbnail}</p>}
          </div>


          {/* <div className="space-y-2">
            <Label htmlFor="tanggal-mulai" className="text-gray-600 text-sm">
              Tanggal Mulai Tanam
            </Label>
            <Input
              id="tanggal-mulai"
              type="date"
              className="border-0 border-b border-gray-300 rounded-none bg-transparent focus:border-gray-500 focus:ring-0 px-0"
            />
          </div> */}

          <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 mt-8"
            onClick={handleSubmit}
          >Mulai</Button>
        </CardContent>
      </Card>
    </div>
  )
}
