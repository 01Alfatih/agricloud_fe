import { useEffect } from 'react'
import { Circle, MapContainer, Polygon, TileLayer, useMap } from 'react-leaflet'
import type { LatLngBoundsExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapClientProps {
  center: [number, number]
  zoom?: number
  radius?: number
  // Titik-titik poligon batas lahan ([lat, lng]) dari backend. ≥3 titik = bentuk asli.
  boundary?: Array<[number, number]> | null
}

// Pas-kan view ke seluruh poligon (mengganti zoom statik) saat batas tersedia.
function FitBounds({ positions }: { positions: Array<[number, number]> }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(positions as LatLngBoundsExpression, { padding: [24, 24] })
    }
  }, [map, positions])
  return null
}

// Warna selaras dengan FieldMapPicker biar bentuk di detail = bentuk saat menggambar.
const GREEN = '#16a34a'

export default function MapClient({
  center,
  radius = 50,
  zoom = 15,
  boundary,
}: MapClientProps) {
  const hasPolygon = Array.isArray(boundary) && boundary.length >= 3

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {hasPolygon ? (
        <>
          <Polygon
            positions={boundary}
            pathOptions={{
              color: GREEN,
              weight: 2,
              fillColor: '#22c55e',
              fillOpacity: 0.3,
            }}
          />
          <FitBounds positions={boundary} />
        </>
      ) : (
        // Fallback: lahan lama tanpa boundary → tetap tampilkan penanda lingkaran.
        <Circle
          center={center}
          radius={radius} // in meters
          pathOptions={{
            color: 'blue',
            fillColor: 'lightblue',
            fillOpacity: 0.4,
          }}
        />
      )}
    </MapContainer>
  )
}
