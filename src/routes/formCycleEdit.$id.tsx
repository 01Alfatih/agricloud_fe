import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import axios from 'axios';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute('/formCycleEdit/$id')({
  component: RouteComponent,
})

interface ICycle {
  id: number;
  crop_template_id: number;
  field_id: number;
  start_date: string;
  created_at: string;
  updated_at: string;
}

interface ICropTemplate {
  id: number;
  name: string;
  description: string;
  kategori: string | null;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
}

interface IField {
  id: number;
  name: string;
  description: string | null;
  thumbnail: string | null;
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
  const navigate = useNavigate();
  const { id } = useParams({ from: '/formCycleEdit/$id' });
  const [templates, setTemplates] = useState<Array<ICropTemplate>>([]);
  const [fields, setFields] = useState<Array<IField>>([]);
  const [cycle, setCycle] = useState<ICycle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate({ to: '/login' });
      return;
    }

    const fetchData = async () => {
      try {
        const [cycleRes, templateRes, fieldRes] = await Promise.all([
          axios.get<{ data: ICycle }>(`http://localhost:8000/api/mycycles/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get<{ data: Array<ICropTemplate> }>('http://localhost:8000/api/crop-templates'),
          axios.get<{ data: Array<IField> }>('http://localhost:8000/api/myfields', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setCycle(cycleRes.data.data);
        setTemplates(templateRes.data.data);
        setFields(fieldRes.data.data);
        setLoading(false);
      } catch (error) {
        console.error("Gagal memuat data:", error);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleUpdate = async () => {
    if (!cycle) return;
    const token = localStorage.getItem("token");
    if (!token) return navigate({ to: '/login' });

    try {
      await axios.put(
        `http://localhost:8000/api/mycycles/${id}`,
        {
          crop_template_id: cycle.crop_template_id,
          field_id: cycle.field_id,
          start_date: cycle.start_date,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Cycle berhasil diperbarui");
      navigate({ to: '/cycle' });
    } catch (error) {
      console.error("Gagal memperbarui cycle:", error);
      alert("Gagal memperbarui data");
    }
  };

  if (loading || !cycle) return <div className="text-center mt-10">Memuat data...</div>;

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center p-4"
      style={{ backgroundImage: "url('/form.png')" }}
    >
      <div className="flex items-center gap-2 mb-8">
        <img src="/logo1.png" alt="Logo" className="w-xs" />
      </div>

      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <h2 className="text-center text-gray-700 font-medium">Edit Tanaman</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="template-id" className="text-gray-600 text-sm">
              Pilih Template
            </Label>
            <select
              id="template-id"
              value={cycle.crop_template_id}
              onChange={(e) =>
                setCycle({ ...cycle, crop_template_id: Number(e.target.value) })
              }
              className="w-full border-0 border-b border-gray-300 bg-transparent focus:border-gray-500 focus:ring-0 px-0 text-gray-700 text-sm"
            >
              {cycle.crop_template_id === 0 && (
                <option value="">-- Pilih Template --</option>
              )}
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jenis-tanaman" className="text-gray-600 text-sm">
              Jenis Tanaman
            </Label>
            <Input
              id="jenis-tanaman"
              className="border-0 border-b border-gray-300 rounded-none bg-transparent focus:border-gray-500 focus:ring-0 px-0"
            />
          </div>

          {/* Field Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="field-id" className="text-gray-600 text-sm">
              Lokasi Lahan
            </Label>
            <select
              id="field-id"
              value={cycle.field_id}
              onChange={(e) =>
                setCycle({ ...cycle, field_id: Number(e.target.value) })
              }
              className="w-full border-0 border-b border-gray-300 bg-transparent focus:border-gray-500 focus:ring-0 px-0 text-gray-700 text-sm"
            >
              {cycle.field_id === 0 && (
                <option value="">-- Pilih Lahan --</option>
              )}
              {fields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tanggal Mulai */}
          <div className="space-y-2">
            <Label htmlFor="start-date" className="text-gray-600 text-sm">
              Tanggal Mulai
            </Label>
            <Input
              id="start-date"
              type="date"
              value={cycle.start_date}
              onChange={(e) =>
                setCycle({ ...cycle, start_date: e.target.value })
              }
              className="border-0 border-b border-gray-300 bg-transparent text-gray-700"
            />
          </div>

          {/* Submit */}
          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 mt-8"
            onClick={handleUpdate}
          >
            Simpan Perubahan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}