import { createFileRoute } from '@tanstack/react-router'
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

export const Route = createFileRoute('/warehouse')({
  component: RouteComponent,
})

function RouteComponent() {
  const warehouses = [
    {
      id: 1,
      name: "Gudang 1",
      address: "Alamat Gudang : Brebes Jl. Netral",
      itemCount: "Jumlah Barang : 500",
      owner: "Nama Pemilik : Yoyo",
      image: "https://placehold.co/600x400",
    },
    {
      id: 2,
      name: "Gudang 2",
      address: "Alamat Gudang : Brebes Jl. Netral",
      itemCount: "Jumlah Barang : 500",
      owner: "Nama Pemilik : Yoyo",
      image: "https://placehold.co/600x400",
    },
    {
      id: 3,
      name: "Gudang 3",
      address: "Alamat Gudang : Brebes Jl. Netral",
      itemCount: "Jumlah Barang : 500",
      owner: "Nama Pemilik : Yoyo",
      image: "https://placehold.co/600x400",
    },
  ]

  return (
    <div className=" h-screen w-full">
      <div className="min-h-screen bg-gray-100">
        {/* Header with background image and search */}
        <div
          className="relative h-32 bg-cover bg-center"
          style={{
            backgroundImage: "url(/images/warehouse-header.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-green-200 bg-opacity-20" >
            <div className="relative flex items-center justify-center h-full px-4">
              <div className="relative w-full max-w-md">
                <Input
                  type="text"
                  placeholder="Cari Lahan Anda"
                  className="w-full pl-4 pr-12 py-3 bg-white/90 backdrop-blur-sm border-0 rounded-full text-gray-700 placeholder:text-gray-500"
                />
                <Button
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-teal-600 hover:bg-teal-700 rounded-full p-2 h-8 w-8"
                >
                  <Search className="h-4 w-4 text-white" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Warehouse Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">


            {warehouses.map((warehouse) => (
              <Card key={warehouse.id} className="bg-white shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="relative">
                    <img
                      src={warehouse.image || "/placeholder.svg"}
                      alt={`${warehouse.name} warehouse interior`}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <div className="absolute top-3 right-3 bg-white rounded-full p-1">
                      <div className="w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">!</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">{warehouse.name}</h3>
                    <div className="space-y-1 text-sm text-gray-600 mb-4">
                      <p>{warehouse.address}</p>
                      <p>{warehouse.itemCount}</p>
                      <p>{warehouse.owner}</p>
                    </div>
                    <Button variant="outline" className="w-full border-teal-600 text-teal-600 hover:bg-teal-50">
                      See Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add New Warehouse Card */}
            <Card className="bg-gray-200 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-0">
                <div className="h-full flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mb-4">
                    <Plus className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-gray-600 font-medium">Tambah Gudang Baru</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
