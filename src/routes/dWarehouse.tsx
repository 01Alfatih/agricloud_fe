import { createFileRoute } from '@tanstack/react-router'
import { BarChart3, Calendar, CheckCircle, Package, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export const Route = createFileRoute('/dWarehouse')({
  component: RouteComponent,
})

function RouteComponent() {
  const tableData = [
    {
      date: "11/11/2022",
      itemName: "Fire&Blood",
      owner: "George R.R Martin",
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
        return "bg-red-100 text-red-800"
      case "Bibit":
        return "bg-blue-100 text-blue-800"
      case "Self-help":
        return "bg-green-100 text-green-800"
      case "Fiction":
        return "bg-purple-100 text-purple-800"
      case "Sappy":
        return "bg-yellow-100 text-yellow-800"
      case "Sci-fi":
        return "bg-indigo-100 text-indigo-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }
  return (
    <div className='h-screen w-full'>
      <div className="min-h-screen bg-green-50">
        {/* Header with background image */}
        <div
          className="relative h-40 bg-cover bg-center"
          style={{
            backgroundImage: "url(/aerial-fields.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-green-200 bg-opacity-20" />
          <div className="relative z-10 flex items-center justify-center h-full px-4">
            <div className="w-full max-w-md">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Cari Lahan Anda..."
                  className="w-full pl-4 pr-12 py-3 bg-white/90 backdrop-blur-sm border-0 rounded-full text-gray-700 placeholder:text-gray-500"
                />
                <Button
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full bg-gray-600 hover:bg-gray-700 p-2"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Detail Gudang</h1>

          {/* Warehouse details card */}
          <Card className="mb-6 bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <span className="font-medium text-gray-700 w-32">Alamat Gudang</span>
                  <span className="text-gray-600">:</span>
                  <span className="text-gray-800">Nama Jalan, Desa, Kecamatan, Kabupaten, Provinsi.</span>
                </div>
                <div className="flex items-start gap-4">
                  <span className="font-medium text-gray-700 w-32">Jumlah Barang</span>
                  <span className="text-gray-600">:</span>
                  <span className="text-gray-800">500</span>
                </div>
                <div className="flex items-start gap-4">
                  <span className="font-medium text-gray-700 w-32">Nama Pemilik</span>
                  <span className="text-gray-600">:</span>
                  <span className="text-gray-800">Yoyo</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex justify-end gap-4 mb-6">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md">Gunakan Barang</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md">Tambah Barang</Button>
          </div>

          {/* Data table */}
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-medium text-gray-700 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Date
                      </div>
                    </TableHead>
                    <TableHead className="font-medium text-gray-700">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Nama Barang
                      </div>
                    </TableHead>
                    <TableHead className="font-medium text-gray-700">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Jumlah Barang
                      </div>
                    </TableHead>
                    <TableHead className="font-medium text-gray-700">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Jenis Barang
                      </div>
                    </TableHead>
                    <TableHead className="font-medium text-gray-700">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Status
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.map((row, index) => (
                    <TableRow key={index} className="border-b border-gray-100">
                      <TableCell className="py-4 text-gray-700">{row.date}</TableCell>
                      <TableCell className="text-gray-800 font-medium">{row.itemName}</TableCell>
                      <TableCell className="text-gray-700">{row.owner}</TableCell>
                      <TableCell>
                        <Badge className={`${getTypeColor(row.type)} border-0`}>{row.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700">{row.status}</span>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
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
