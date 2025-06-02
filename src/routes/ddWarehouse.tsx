import { createFileRoute } from '@tanstack/react-router'
import { CheckCircle, Search, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

export const Route = createFileRoute('/ddWarehouse')({
  component: RouteComponent,
})

const warehouseData = [
  {
    date: "11/11/2022",
    itemName: "Fire&Blood",
    owner: "George R R Martin",
    type: "Pupuk",
    status: "Masuk",
  },
  {
    date: "22/10/2022",
    itemName: "Bridge of clay",
    owner: "Markus Suzak",
    type: "Bibit",
    status: "Masuk",
  },
  {
    date: "22/05/2022",
    itemName: "Do Epic Shit",
    owner: "Ankur Warikoo",
    type: "Self-help",
    status: "Masuk",
  },
  {
    date: "14/07/2020",
    itemName: "My Sister's Keeper",
    owner: "Jodi Picoult",
    type: "Fiction",
    status: "Keluar",
    additionalType: "Sappy",
  },
  {
    date: "12/04/2021",
    itemName: "Atomic Habits",
    owner: "James Clear",
    type: "Self-help",
    status: "Keluar",
  },
  {
    date: "02/02/2022",
    itemName: "Dune",
    owner: "Frank Herbert",
    type: "Sci-fi",
    status: "Keluar",
  },
]

const getTypeColor = (type: string) => {
  switch (type) {
    case "Pupuk":
      return "bg-purple-100 text-purple-800"
    case "Bibit":
      return "bg-blue-100 text-blue-800"
    case "Self-help":
      return "bg-green-100 text-green-800"
    case "Fiction":
      return "bg-orange-100 text-orange-800"
    case "Sci-fi":
      return "bg-gray-100 text-gray-800"
    case "Sappy":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}



function RouteComponent() {
  return (
    <div className='h-screen w-full relative'>
      <div className="min-h-screen bg-gray-100">
        {/* Header with background image */}
        <div
          className="relative h-40 bg-cover bg-center"
          style={{
            backgroundImage: `url('/farmland-bg.png')`,
          }}
        >
          <div className="absolute inset-0 bg-green-200 bg-opacity-20" />
          <div className="relative flex justify-end p-4">
            <div className="relative w-80">
              <Input placeholder="Cari Lahan Anda..." className="pr-10 bg-white/80 backdrop-blur-sm border-gray-300" />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="p-6">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">Detail Gudang</h1>

          {/* Warehouse info card */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex">
                  <span className="w-32 text-gray-600">Alamat Gudang</span>
                  <span className="mr-4">:</span>
                  <span className="text-gray-800">Nama Jalan, Desa, Kecamatan, Kabupaten, Provinsi.</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-gray-600">Jumlah Barang</span>
                  <span className="mr-4">:</span>
                  <span className="text-gray-800">500</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-gray-600">Nama Pemilik</span>
                  <span className="mr-4">:</span>
                  <span className="text-gray-800">Yoyo</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex justify-end gap-4 mb-6">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">Gunakan Barang</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white">Tambah Barang</Button>
          </div>

          {/* Data table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="text-gray-700">📅 Date</TableHead>
                    <TableHead className="text-gray-700">📦 Nama Barang</TableHead>
                    <TableHead className="text-gray-700">👤 Jumlah Barang</TableHead>
                    <TableHead className="text-gray-700">📋 Jenis Barang</TableHead>
                    <TableHead className="text-gray-700">📊 Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouseData.map((item, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell className="font-medium">{item.date}</TableCell>
                      <TableCell>{item.itemName}</TableCell>
                      <TableCell>{item.owner}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge variant="secondary" className={getTypeColor(item.type)}>
                            {item.type}
                          </Badge>
                          {item.additionalType && (
                            <Badge variant="secondary" className={getTypeColor(item.additionalType)}>
                              {item.additionalType}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{item.status}</span>
                          {item.status === "Masuk" ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
