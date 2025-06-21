import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import axios from 'axios'
import type { ChangeEvent } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"



export const Route = createFileRoute('/formFieldEdit/$id')({
  component: RouteComponent,
})

interface IMyField {
  id: number;
  name: string;
  description: string;
  area: string;
  location: {
    latitude: string;
    longitude: string;
  };
  thumbnail: File | null;
}



function RouteComponent() {
  const { id } = useParams({ from: '/formFieldEdit/$id' });
  const navigate = useNavigate();
  const [locationString, setLocationString] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof IMyField | 'locationString', string>>>({});
  const [isLoading, setIsLoading] = useState(true);
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

  // Cek token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate({ to: '/login' });
  }, []);

  // Fetch existing data
  useEffect(() => {
    const fetchField = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate({ to: '/login' });
        return;
      }

      try {
        const response = await axios.get(`http://localhost:8000/api/myfields/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const fetchData = response.data.data;

        setFormData({
          id: fetchData.id,
          name: fetchData.name,
          description: fetchData.description,
          area: fetchData.area,
          location: {
            latitude: fetchData.location.latitude,
            longitude: fetchData.location.longitude,
          },
          thumbnail: null, // file tetap null karena tidak bisa preload ke <input type="file">
        });

        // Set string lokasi
        setLocationString(`${fetchData.location.latitude}, ${fetchData.location.longitude}`);

        // Simpan URL thumbnail sementara untuk preview (gunakan state baru jika mau)
        setThumbnailUrl(fetchData.thumbnail);

        console.log("Data lahan berhasil dimuat:", fetchData);
      } catch (error) {
        console.error("Gagal memuat data:", error);
        alert("Data tidak ditemukan.");
        navigate({ to: '/field' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchField();
  }, [id]);

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
    data.append('_method', 'PUT');

    try {
      const response = await axios.post(`http://localhost:8000/api/myfields/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log("Lahan berhasil diperbarui:", response.data);
      navigate({ to: '/field' });
    } catch (error) {
      console.error("Gagal memperbarui lahan:", error);
      alert("Terjadi kesalahan saat mengirim data.");
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id: inputId, value } = e.target;
    setFormData((prev) => ({ ...prev, [inputId]: value }));
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

  if (isLoading) return <div className="text-center mt-10">Memuat data...</div>;

  return (<div
    className="min-h-screen w-full bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center p-4"
    style={{ backgroundImage: "url('/form.png')" }}
  >
    <div className="flex items-center gap-2 mb-8">
      <img src="/logo1.png" alt="logo" className='w-xs' />
    </div>

    <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <h2 className="text-center text-gray-700 font-medium">Edit Lahan</h2>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField label="Nama Lahan" id="name" value={formData.name} onChange={handleChange} error={errors.name} />
        <FormField label="Lokasi Lahan" id="location" value={locationString} onChange={handleLocationChange} error={errors.locationString} placeholder="-6.20, 106.81" />
        <FormField label="Deskripsi" id="description" value={formData.description} onChange={handleChange} error={errors.description} />
        <FormField label="Luas Lahan" id="area" value={formData.area} onChange={handleChange} error={errors.area} placeholder="Contoh: 1000 m²" />
        <div className="space-y-2">
          <Label htmlFor="thumbnail" className="text-gray-600 text-sm">Gambar Lahan (opsional)</Label>
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
              setFormData((prev) => ({ ...prev, thumbnail: file }));
              if (file) {
                setThumbnailUrl(URL.createObjectURL(file));
              }
            }}
            className="border-0 border-b border-gray-300 rounded-none bg-transparent focus:border-gray-500 focus:ring-0 px-0"
          />
          {errors.thumbnail && <p className="text-red-500 text-sm">{errors.thumbnail}</p>}
        </div>
        <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 mt-8" onClick={handleSubmit}>Perbarui</Button>
      </CardContent>
    </Card>
  </div>
  );
}

// Komponen FormField untuk mengurangi pengulangan kode
function FormField({
  label, id, value, onChange, error, placeholder = ''
}: {
  label: string;
  id: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-gray-600 text-sm">{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="border-0 border-b border-gray-300 rounded-none bg-transparent focus:border-gray-500 focus:ring-0 px-0"
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
}
