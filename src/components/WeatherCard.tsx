import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  Sun,
  Wind,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useWeather } from '@/hooks/useWeather'

// WMO weather code → ikon + label Indonesia.
// Ref: https://open-meteo.com/en/docs (WMO Weather interpretation codes)
function describeWeather(code: number): {
  icon: ComponentType<{ className?: string }>
  label: string
} {
  if (code === 0) return { icon: Sun, label: 'Cerah' }
  if (code <= 2) return { icon: CloudSun, label: 'Cerah Berawan' }
  if (code === 3) return { icon: Cloud, label: 'Berawan' }
  if (code <= 48) return { icon: CloudFog, label: 'Berkabut' }
  if (code <= 57) return { icon: CloudDrizzle, label: 'Gerimis' }
  if (code <= 67) return { icon: CloudRain, label: 'Hujan' }
  if (code <= 77) return { icon: CloudSnow, label: 'Salju' }
  if (code <= 82) return { icon: CloudRain, label: 'Hujan Lebat' }
  if (code <= 86) return { icon: CloudSnow, label: 'Salju' }
  return { icon: CloudLightning, label: 'Badai Petir' }
}

// Nama hari singkat dari tanggal ISO (yyyy-mm-dd). "Hari ini" untuk index 0.
function dayLabel(iso: string, index: number): string {
  if (index === 0) return 'Hari ini'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('id-ID', { weekday: 'short' })
}

function WeatherSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-16 w-2/3 animate-pulse rounded-lg bg-gray-200 dark:bg-white/10" />
      <div className="grid grid-cols-5 gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-white/10"
          />
        ))}
      </div>
    </div>
  )
}

export function WeatherCard({
  lat,
  lng,
}: {
  lat: number | null
  lng: number | null
}) {
  const { data, loading, error } = useWeather(lat, lng)

  return (
    <Card className="rounded-xl bg-white shadow-sm dark:border-white/10 dark:bg-[#15211a]">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <h3 className="flex items-center gap-2 text-base font-semibold text-[#1a472a] dark:text-[#a7d1a7]">
          <CloudSun className="h-4 w-4" /> Cuaca Lahan
        </h3>

        {loading ? (
          <WeatherSkeleton />
        ) : error || !data ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500 dark:text-gray-400">
            <Cloud className="mb-3 h-10 w-10 text-gray-300 dark:text-white/15" />
            <p className="text-sm font-medium">Cuaca tidak tersedia</p>
            <p className="text-xs">
              Koordinat lahan tidak valid atau jaringan bermasalah.
            </p>
          </div>
        ) : (
          <>
            {/* Sekarang */}
            {(() => {
              const now = describeWeather(data.current.code)
              const NowIcon = now.icon
              return (
                <div className="flex items-center gap-4 rounded-xl bg-gradient-to-br from-sky-50 to-green-50 p-4 dark:from-sky-500/10 dark:to-green-500/10">
                  <NowIcon className="h-12 w-12 shrink-0 text-sky-600 dark:text-sky-300" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-[#1a472a] dark:text-[#a7d1a7]">
                        {Math.round(data.current.temp)}°
                      </span>
                      <span className="truncate text-sm text-gray-600 dark:text-gray-300">
                        {now.label}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Droplets className="h-3.5 w-3.5" />
                        {data.current.humidity}% lembap
                      </span>
                      <span className="flex items-center gap-1">
                        <CloudRain className="h-3.5 w-3.5" />
                        {data.current.precipitation} mm
                      </span>
                      <span className="flex items-center gap-1">
                        <Wind className="h-3.5 w-3.5" />
                        {Math.round(data.current.windSpeed)} km/j
                      </span>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Ramalan 5 hari */}
            <div className="grid grid-cols-5 gap-2">
              {data.daily.map((d, i) => {
                const desc = describeWeather(d.code)
                const DayIcon = desc.icon
                return (
                  <div
                    key={d.date}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-lg border p-2 text-center',
                      i === 0
                        ? 'border-green-200 bg-green-50/60 dark:border-green-500/25 dark:bg-green-500/10'
                        : 'border-gray-100 dark:border-white/10',
                    )}
                  >
                    <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300">
                      {dayLabel(d.date, i)}
                    </span>
                    <DayIcon
                      className="h-5 w-5 text-sky-600 dark:text-sky-300"
                      aria-label={desc.label}
                    />
                    <span className="text-xs font-semibold text-[#1a472a] dark:text-[#a7d1a7]">
                      {Math.round(d.tempMax)}°
                    </span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">
                      {Math.round(d.tempMin)}°
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] text-sky-600 dark:text-sky-300">
                      <Droplets className="h-2.5 w-2.5" />
                      {d.rainProb}%
                    </span>
                  </div>
                )
              })}
            </div>

            <p className="text-right text-[10px] text-gray-400 dark:text-gray-500">
              Sumber: Open-Meteo
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
