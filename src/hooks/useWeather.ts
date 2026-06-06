import { useEffect, useState } from 'react'

// Cuaca per-lahan dari Open-Meteo (gratis, tanpa API key, CORS-friendly).
// Dipanggil langsung dari browser pakai koordinat lahan — bukan lewat backend.

export interface WeatherCurrent {
  temp: number
  humidity: number
  precipitation: number
  windSpeed: number
  code: number
}

export interface WeatherDaily {
  date: string
  code: number
  tempMax: number
  tempMin: number
  rainProb: number
}

export interface WeatherData {
  current: WeatherCurrent
  daily: Array<WeatherDaily>
}

interface OpenMeteoResponse {
  current: {
    temperature_2m: number
    relative_humidity_2m: number
    precipitation: number
    weather_code: number
    wind_speed_10m: number
  }
  daily: {
    time: Array<string>
    weather_code: Array<number>
    temperature_2m_max: Array<number>
    temperature_2m_min: Array<number>
    precipitation_probability_max: Array<number>
  }
}

interface UseWeatherResult {
  data: WeatherData | null
  loading: boolean
  error: boolean
}

export function useWeather(
  lat: number | null,
  lng: number | null,
): UseWeatherResult {
  const [data, setData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (
      lat === null ||
      lng === null ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      setLoading(false)
      setError(true)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(false)

    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lng),
      current:
        'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
      daily:
        'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      timezone: 'auto',
      forecast_days: '5',
    })

    fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Weather HTTP ${res.status}`)
        return res.json() as Promise<OpenMeteoResponse>
      })
      .then((json) => {
        setData({
          current: {
            temp: json.current.temperature_2m,
            humidity: json.current.relative_humidity_2m,
            precipitation: json.current.precipitation,
            windSpeed: json.current.wind_speed_10m,
            code: json.current.weather_code,
          },
          daily: json.daily.time.map((date, i) => ({
            date,
            code: json.daily.weather_code[i],
            tempMax: json.daily.temperature_2m_max[i],
            tempMin: json.daily.temperature_2m_min[i],
            rainProb: json.daily.precipitation_probability_max[i],
          })),
        })
        setError(false)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        console.error('Gagal memuat cuaca:', err)
        setError(true)
      })
      .finally(() => {
        // AbortError tidak boleh mematikan loading state milik request baru.
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [lat, lng])

  return { data, loading, error }
}
