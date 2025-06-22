import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"


export const Route = createFileRoute('/formCycle')({
  component: RouteComponent,
})

interface ICycle {
  crop_template_id: number;
  field_id: number;
  start_date: Date;
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
  const [templates, setTemplates] = useState<Array<ICropTemplate>>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | "">("");
  const [selectedFieldId, setSelectedFieldId] = useState<number | "">("");
  const [fields, setFields] = useState<Array<IField>>([]);
  const [cycle, setCycle] = useState<ICycle>({
    crop_template_id: 0,
    field_id: 0,
    start_date: new Date(),
  });

  // Redirect jika tidak ada token
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTemplates = async () => {
      const response = await fetch('http://localhost:8000/api/crop-templates');
      const json = await response.json();
      setTemplates(json.data);
    };

    const fetchFields = async () => {
      const token = localStorage.getItem("token");
      const response = await fetch('http://localhost:8000/api/myfields', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const json = await response.json();
      setFields(json.data);
    };


    const token = localStorage.getItem("token");
    if (!token) {
      navigate({ to: '/login' });
    }

    fetchFields();
    fetchTemplates();
  }, []);


  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate({ to: '/login' });
      return;
    }

    try {
      await axios.post(
        'http://localhost:8000/api/mycycles',
        {
          crop_template_id: selectedTemplateId,
          field_id: selectedFieldId,
          start_date: cycle.start_date.toISOString().split("T")[0],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      navigate({ to: '/cycle' });
    } catch (error) {
      console.error("Error creating cycle:", error);
    }
  }



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
          <h2 className="text-center text-gray-700 font-medium">Mulai Tanam Baru</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nama-tanaman" className="text-gray-600 text-sm">
              Pilih Template
            </Label>
            <select
              id="template-id"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(Number(e.target.value))}
              className="w-full border-0 border-b border-gray-300 bg-transparent focus:border-gray-500 focus:ring-0 px-0 text-gray-700 text-sm"
            >
              <option value="">-- Pilih Template --</option>
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

          <div className="space-y-2">
            <Label htmlFor="lokasi-lahan" className="text-gray-600 text-sm">
              Lokasi Lahan
            </Label>
            <select
              id="lokasi-id"
              value={selectedFieldId}
              onChange={(e) => setSelectedFieldId(Number(e.target.value))}
              className="w-full border-0 border-b border-gray-300 bg-transparent focus:border-gray-500 focus:ring-0 px-0 text-gray-700 text-sm"
            >
              <option value="">-- Pilih Lahan --</option>
              {fields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tanggal-mulai" className="text-gray-600 text-sm">
              Tanggal Mulai Tanam
            </Label>
            <Input
              id="tanggal-mulai"
              type="date"
              className="border-0 border-b border-gray-300 rounded-none bg-transparent focus:border-gray-500 focus:ring-0 px-0"
              value={cycle.start_date.toISOString().split("T")[0]}
              onChange={(e) =>
                setCycle((prev) => ({
                  ...prev,
                  start_date: new Date(e.target.value),
                }))
              }
            />
          </div>

          <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 mt-8"
            onClick={handleSubmit}
          >Mulai</Button>
        </CardContent>
      </Card>
    </div>
  )
}
