import { useEffect } from 'react'

// Layar loading pasca-login: logo AgriCloud putih yang perlahan terisi cairan
// hijau dari bawah (efek liquid fill + gelombang). Dipakai login/register/oauth
// success → tampil sebentar → onDone() (navigate ke dashboard).
//
// Mekanisme: logo dipakai sebagai CSS `mask`, di dalamnya ada lapisan putih
// (base) + blok hijau yang tingginya beranimasi 0%→112% (lihat styles.css).

const SPLASH_DURATION = 2400 // ms — sinkron dgn animasi rise (2.1s) + fade (0.5s)

export function SplashLiquid({ onDone }: { onDone?: () => void }) {
  useEffect(() => {
    if (!onDone) return
    const t = setTimeout(onDone, SPLASH_DURATION)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="splash-fade fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-gradient-to-b from-[#0c1410] to-[#15211a]">
      <div
        className="splash-logo w-[min(70vw,420px)]"
        style={{ aspectRatio: '3696 / 599' }}
      >
        <div className="splash-base" />
        <div className="splash-liquid">
          <div className="splash-wave" />
        </div>
      </div>

      <p className="text-sm font-medium tracking-wide text-[#a7d1a7]">
        Menyiapkan ladang digitalmu…
      </p>
    </div>
  )
}

export default SplashLiquid
