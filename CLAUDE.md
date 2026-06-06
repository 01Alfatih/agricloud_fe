# CLAUDE.md — Web Frontend (`agricloud_fe`)

Patuhi dulu aturan global di `../CLAUDE.md`. File ini menambahkan aturan teknis web.

## Stack

- React 19 + **TanStack Router** (file-based routing di `src/routes/`)
- TypeScript (strict), Vite, **Bun** sebagai package manager
- UI: **shadcn/ui** (Radix) + `lucide-react` + Tailwind CSS v4
- Form: `react-hook-form` + **Zod**
- HTTP: **Axios** → base URL `http://localhost:8005/api`, token di `localStorage` (`access_token`)
- Maps: Leaflet + react-leaflet

## Port Resmi

- **8006** via `bun run dev` (`vite --port 8006`; menggantikan port lama 3000).
- Cek dulu apakah sudah jalan sebelum start. **Jangan** start di port lain.

## Konvensi

- Komponen UI baru → pakai shadcn/ui yang ada di `src/components/ui/` sebelum bikin dari nol.
- Route baru → file di `src/routes/` (mengikuti pola TanStack Router, auto code-split).
- Validasi form → Zod schema + `@hookform/resolvers`.
- Panggilan API lewat Axios; ikuti pola token auth yang sudah ada.
- Alias import `@/*` → `src/*`.
- Format: `bun run check` (Prettier `semi:false, singleQuote:true, trailingComma:all` + ESLint).

## Verifikasi

- Jalankan `bun run build` (termasuk `tsc`) — pastikan tidak ada error TypeScript.
- `bun run test` (Vitest) untuk perubahan logic.
- Cek tampilan di `localhost:8006`; tunjukkan bukti (screenshot/perilaku).
- Pastikan backend `8005` nyala saat tes fitur yang butuh API.
