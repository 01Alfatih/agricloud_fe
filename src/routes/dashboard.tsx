import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from "react"
import { Bell, ChevronLeft, ChevronRight, Search } from "lucide-react"
import Autoplay from "embla-carousel-autoplay"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();

  const getToken = async () => {
    const token = await localStorage.getItem("token");
    if (!token){
      navigate({ to: '/login' }); 
    }
  } 
  useEffect(()=> {
    getToken();
  }, [])
  const [activePage, setActivePage] = useState(0)

  const landData = [
    { id: 1, name: "Lahan 1 Tanam Cabai", plant: "Cabai", area: "15 Hektare" },
    { id: 2, name: "Lahan 2 Tanam Anggur", plant: "Anggur", area: "10 Hektare" },
    { id: 3, name: "Lahan 3 Tanam Tomat", plant: "Tomat", area: "10 Hektare" },
  ]

  const warehouseData = [
    { id: 1, name: "Gudang 1", location: "Cirebon" },
    { id: 2, name: "Gudang 2", location: "Cirebon" },
    { id: 3, name: "Gudang 3", location: "Cirebon" },
  ]

  const plantingPhases = [
    { id: 1, phase: "Pembungahan", date: "22 DEC 7:20 PM", status: "warning" },
    { id: 2, phase: "Pembungahan", date: "21 DEC 11:21 PM", status: "error" },
    { id: 3, phase: "Pertumbuhan Vegetatif Lanjut", date: "21 DEC 7:28 PM", status: "success" },
    { id: 4, phase: "Pertumbuhan Vegetatif Awal", date: "20 DEC 3:52 PM", status: "success" },
    { id: 5, phase: "Berkecambah", date: "19 DEC 11:35 PM", status: "success" },
  ]

  const plantDetails = [
    {
      id: 1,
      name: "Cabai",
      land: "Lahan 1",
      image: "/cabe.png",
      description:
        "Jenis tanaman hortikultura yang memiliki nilai ekonomis tinggi dan banyak dibudidayakan secara komersial. Cabai merah cocok dibudidayakan, baik di dataran rendah maupun dataran tinggi, pada lahan sawah atau tegalan dengan ketinggian 0-1000m dpl.",
    },
    {
      id: 2,
      name: "Anggur",
      land: "Lahan 2",
      image: "/anggur.png",
      description:
        "Anggur adalah tanaman buah yang tumbuh merambat, cocok ditanam di iklim sedang dan tropis. Anggur memiliki nilai ekonomis tinggi dan banyak dibudidayakan secara komersial.",
    },
    {
      id: 3,
      name: "Tomat",
      land: "Lahan 3",
      image: "/tomat.png",
      description:
        "Tomat adalah tanaman sayuran yang kaya akan vitamin dan mudah dibudidayakan. Tomat dapat tumbuh baik di berbagai jenis tanah dengan perawatan yang tepat.",
    },
  ]
  const plugin = useRef(
    Autoplay({ delay: 2000, stopOnInteraction: true })
  )

  const handlePrevious = () => {
    setActivePage((prev) => (prev > 0 ? prev - 1 : plantDetails.length - 1))
  }

  const handleNext = () => {
    setActivePage((prev) => (prev < plantDetails.length - 1 ? prev + 1 : 0))
  }

  return (
    <div className='h-screen w-full '>
      <div className="min-h-screen bg-[#e4f0e4] p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header with search */}
          <div className="flex justify-end mb-6">
            <Button variant="ghost" size="icon" className="text-[#1a472a]">
              <Bell className="h-6 w-6" />
            </Button>
            <div className="relative flex-1 max-w-md mx-4">
              <div className="relative">
                <Input
                  placeholder="Cari Tanaman Anda"
                  className="pl-4 pr-10 py-2 rounded-full bg-[#a7d1a7] text-[#1a472a] placeholder:text-[#1a472a] border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#1a472a]" />
              </div>
            </div>
            <div className="w-6"></div> {/* Spacer for alignment */}
          </div>

          <div className="2xl:pl-0 pl-32">
            {/* Land section */}
            <div className='flex md:flex-row flex-col gap-4 mb-6 '>
              <Card className="bg-white rounded-lg shadow-sm w-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Lahan</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs text-gray-500">Nama Lahan</TableHead>
                        <TableHead className="text-xs text-gray-500">Tanaman</TableHead>
                        <TableHead className="text-xs text-gray-500">Luas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {landData.map((land) => (
                        <TableRow key={land.id}>
                          <TableCell className="text-sm">{land.name}</TableCell>
                          <TableCell className="text-sm">{land.plant}</TableCell>
                          <TableCell className="text-sm">{land.area}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Warehouse section */}
              <Card className="bg-white rounded-lg shadow-sm w-full ">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Gudang</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs text-gray-500">Nama Gudang</TableHead>
                        <TableHead className="text-xs text-gray-500">Lokasi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {warehouseData.map((warehouse) => (
                        <TableRow key={warehouse.id}>
                          <TableCell className="text-sm">{warehouse.name}</TableCell>
                          <TableCell className="text-sm">{warehouse.location}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
            {/* Plant detail section */}
            <Carousel
              plugins={[plugin.current]}
              className="w-full "
              onMouseEnter={plugin.current.stop}
              onMouseLeave={plugin.current.reset}
            >
              <CarouselContent>
                {plantDetails.map((plant) => (
                  <CarouselItem key={plant.id}>
                    <div className="flex justify-center items-center gap-4 h-[40vh]">
                      {/* Tanaman Card */}
                      <Card className="bg-white overflow-hidden shadow-lg rounded-lg w-full h-full">
                        <div className="h-full flex flex-col ">
                          {/* Gambar */}
                          <div className="h-48 w-full overflow-hidden px-4">
                            <img
                              src={plant.image}
                              alt={plant.name}
                              className="w-full h-full object-cover rounded-2xl "
                            />
                          </div>

                          {/* Deskripsi */}
                          <div className="p-4 flex-1">
                            <h3 className="text-lg font-medium mb-1">{plant.name}</h3>
                            <p className="text-sm text-gray-500 mb-2">{plant.land}</p>
                            <p className="text-sm text-gray-700 line-clamp-4">{plant.description}</p>
                          </div>
                        </div>
                      </Card>

                      {/* Fase Tanam */}
                      <Card className="bg-white rounded-lg shadow-lg w-[45%] h-full">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-medium">Fase Tanam</CardTitle>
                          <p className="text-xs text-gray-500">this month</p>
                        </CardHeader>
                        <CardContent>
                          <div className="relative">
                            {plantingPhases.map((phase, index) => (
                              <div key={phase.id} className="flex mb-4 last:mb-0">
                                <div className="mr-3 relative">
                                  <div
                                    className={`h-6 w-6 rounded-full flex items-center justify-center z-10 relative ${phase.status === "success"
                                        ? "bg-green-500"
                                        : phase.status === "warning"
                                          ? "bg-yellow-500"
                                          : "bg-red-500"
                                      }`}
                                  >
                                    <div className="h-3 w-3 bg-white rounded-full" />
                                  </div>
                                  {index < plantingPhases.length - 1 && (
                                    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gray-200 z-0" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{phase.phase}</p>
                                  <p className="text-xs text-gray-500">{phase.date}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>
      </div>
    </div>
  )
}
