import { Link , createFileRoute, useNavigate} from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { MoreHorizontal, Plus, Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const Route = createFileRoute('/cycle')({
  component: RouteComponent,
})




interface ICycle {
  id: number;
  name: string;
  description: string;
  location: string;
  status: string;
  progress: number;
  thumbnail: string | null; // Bisa string atau null
  start_date: string;       // Format "YYYY-MM-DD"
  created_at: string;       // Format "YYYY-MM-DDTHH:mm:ss.SSSSSSZ"
  updated_at: string;       // Format "YYYY-MM-DDTHH:mm:ss.SSSSSSZ"
}



function RouteComponent() {
const [cycle, setCycle] = useState<Array<ICycle>>([]);
const navigate = useNavigate();

  const fetchCycles = async () => {
    try {
      const res = await axios.get<{ data: Array<ICycle> }>('http://localhost:8000/api/mycycles', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setCycle(res.data.data);
    } catch (err) {
      console.error("Gagal memuat data cycle:", err);
    }
  };

  useEffect(() => {
    fetchCycles();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus tanaman ini?")) return;
    try {
      await axios.delete(`http://localhost:8000/api/mycycles/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setCycle((prev) => prev.filter((cycles) => cycles.id !== id));
      alert("Siklus berhasil dihapus.");
    } catch (error) {
      console.error("Gagal menghapus siklus:", error);
      alert("Gagal menghapus siklus.");
    }
  };



  return (
    <div className='h-screen w-full relative'>
      <img src="/bg-dashboard.png" alt="" className=' w-full h-[50%] object-cover' />

      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="absolute top-15 left-[80%] transform -translate-x-1/4">
          <div className="flex justify-end-safe mb-8 ">
            <div className="relative w-full max-w-md">
              <Input
                type="text"
                placeholder="Cari Tanaman Anda"
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


        {/* Main Content Card */}
        <div className="absolute top-30 left-1/2 transform -translate-x-1/2 w-full ">
          <Card className=" mx-[10%] bg-white/95 backdrop-blur-sm shadow-sm">
            <CardContent className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Tanaman</h1>
                <p className="text-sm text-gray-500">{cycle.length} Tanaman Tersedia</p>
              </div>

              {/* Plant Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {cycle.map((plant) => (
                  <Card className="overflow-hidden border-0 shadow-lg relative" key={plant.id}>
                    <div className="relative">
                      <img
                        src={plant.thumbnail || "/cabe1.png"}
                        alt={plant.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-2 right-2 z-10">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-white hover:bg-white/20 rounded-full w-8 h-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="z-50">
                            <DropdownMenuItem onClick={() => navigate({ to: '/formCycleEdit/$id', params: { id: plant.id.toString() } })}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(plant.id)} className="text-red-600">
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="absolute top-2 left-2 bg-white rounded-full px-2 py-0.5 text-xs z-10">
                        {plant.progress.toFixed(0)}%
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <p className="text-xs text-gray-500">Tanaman</p>
                      <h3 className="font-medium mb-1">{plant.name}</h3>
                      <p className="text-xs text-gray-500 mb-2">{plant.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Link to="/dCycle/$id" params={{ id: plant.id.toString() }}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8 px-4 rounded-full border-gray-300"
                          >
                            LIHAT
                          </Button>
                        </Link>
                        <Progress value={plant.progress} className="w-16 h-1.5" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              

              {/* Add New Plant Card */}
              <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer">
                <Link to="/formCycle">
                <CardContent className="p-8 flex flex-col items-center justify-center h-full min-h-[300px]">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                    <Plus className="h-8 w-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 text-center">Tambah Tanaman Baru</h3>

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
