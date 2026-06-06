import { useEffect } from 'react'
import {
  CircleMarker,
  MapContainer,
  Polygon,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export interface LatLng {
  lat: number
  lng: number
}

// Luas poligon geodesic dalam m² — formula spherical excess (dipakai Leaflet.draw).
// Cukup akurat untuk skala lahan; tidak butuh library tambahan seperti Turf.
export function polygonAreaSqMeters(points: Array<LatLng>): number {
  if (points.length < 3) return 0
  const R = 6378137 // radius bumi (meter)
  const toRad = (d: number) => (d * Math.PI) / 180
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i]
    const p2 = points[(i + 1) % points.length]
    area +=
      toRad(p2.lng - p1.lng) *
      (2 + Math.sin(toRad(p1.lat)) + Math.sin(toRad(p2.lat)))
  }
  return Math.abs((area * R * R) / 2)
}

// Centroid sederhana (rata-rata titik) → dipakai sebagai koordinat lokasi lahan.
export function centroidOf(points: Array<LatLng>): LatLng | null {
  if (points.length === 0) return null
  const sum = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 },
  )
  return { lat: sum.lat / points.length, lng: sum.lng / points.length }
}

// Tangkap klik di peta → tambah titik poligon.
function ClickHandler({ onAdd }: { onAdd: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onAdd({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

// Pindahkan view saat center berubah (mis. tombol "Lokasi Saya").
function Recenter({ center }: { center: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.setView(center, Math.max(map.getZoom(), 16))
  }, [center, map])
  return null
}

interface Props {
  points: Array<LatLng>
  onAddPoint: (p: LatLng) => void
  initialCenter: [number, number]
  recenterTo: [number, number] | null
}

const GREEN = '#16a34a'

export default function FieldMapPicker({
  points,
  onAddPoint,
  initialCenter,
  recenterTo,
}: Props) {
  const positions = points.map((p) => [p.lat, p.lng] as [number, number])

  return (
    <MapContainer
      center={initialCenter}
      zoom={15}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onAdd={onAddPoint} />
      <Recenter center={recenterTo} />

      {/* 2 titik: garis. ≥3 titik: poligon terisi. */}
      {points.length === 2 && (
        <Polyline positions={positions} pathOptions={{ color: GREEN }} />
      )}
      {points.length >= 3 && (
        <Polygon
          positions={positions}
          pathOptions={{
            color: GREEN,
            weight: 2,
            fillColor: '#22c55e',
            fillOpacity: 0.3,
          }}
        />
      )}

      {/* Vertex pakai CircleMarker → hindari masalah ikon default Leaflet di bundler. */}
      {points.map((p, i) => (
        <CircleMarker
          key={`${p.lat}-${p.lng}-${i}`}
          center={[p.lat, p.lng]}
          radius={6}
          pathOptions={{
            color: '#ffffff',
            weight: 2,
            fillColor: GREEN,
            fillOpacity: 1,
          }}
        />
      ))}
    </MapContainer>
  )
}
