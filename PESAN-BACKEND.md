# Permintaan ke Backend — Kontrak API yang Dibutuhkan Frontend

Halo, ini kebutuhan dari sisi **web frontend** (`agricloud_fe`).

## Konteks

- Frontend sekarang menunjuk ke backend di **`http://localhost:8005/api`**.
- Backend di `8005` sudah jalan (Laravel + Sanctum, `/up` → 200, `/sanctum/csrf-cookie` → 204), **tetapi route-route berikut masih 404 / belum tersedia**.
- Mohon dipastikan route di bawah ter-register di `routes/api.php` (dan kalau perlu jalankan `php artisan route:clear`/`optimize:clear`).

## Autentikasi

- Skema: **Bearer token (Sanctum)**.
- Setelah login/register, FE menyimpan token lalu mengirim header: `Authorization: Bearer <token>` di endpoint terproteksi.

## Endpoint yang dibutuhkan

### 1. POST `/api/auth/register`

Request (JSON):

```json
{
  "name": "...",
  "email": "...",
  "phone_number": "...",
  "password": "...",
  "role": "farmer"
}
```

Response (✅ **sudah dibungkus `data`**, seragam dengan login — FE membaca
`response.data.data.access_token`):

```json
{ "data": { "access_token": "...", "token_type": "Bearer" } }
```

### 2. POST `/api/auth/login`

Request (JSON):

```json
{ "email": "...", "password": "..." }
```

Response yang diharapkan FE (FE membaca `response.data.data.access_token`):

```json
{ "data": { "access_token": "..." } }
```

- Kalau kredensial salah, balikan **HTTP 422** (FE sudah handle status ini).

> ✅ **Konsistensi token SUDAH beres** (diverifikasi 2026-06-06): register & login
> dua-duanya `{ "data": { "access_token": ... } }`. FE sudah disesuaikan (register
> tadinya baca flat → diperbaiki jadi nested).

### 3. GET `/api/auth/user` _(Bearer)_

Response yang diharapkan (`response.data.data`):

```json
{
  "data": {
    "id": 1,
    "name": "...",
    "email": "...",
    "email_verified_at": null,
    "phone_number": "...",
    "role": "...",
    "profile_photo": null,
    "created_at": "...",
    "updated_at": "...",
    "profile_photo_url": null
  }
}
```

### 4. GET `/api/myfields` _(Bearer)_ — ✅ **JALAN** (diverifikasi 2026-06-06)

Response nyata (`response.data.data` = array):

```json
{
  "data": [
    {
      "id": 9,
      "name": "...",
      "description": "...",
      "thumbnail": null,
      "location": { "latitude": "-6.8721000", "longitude": "109.0407000" },
      "area": "2.00",
      "boundary": null,
      "crops": [],
      "owner": { "id": 18, "name": "..." },
      "created_at": "2026-06-06T05:32:37.000000Z",
      "updated_at": "2026-06-06T05:32:37.000000Z"
    }
  ]
}
```

> 📌 Catatan dari hasil tes:
>
> - **`area` itu ANGKA meter persegi** (dikembalikan string desimal mis. `"2.00"`),
>   **bukan** "5 Hektar". FE sudah menyesuaikan: input form kirim m², tampilan
>   diformat (`formatArea`: ≥ 1 Ha → "x Ha", < 1 Ha → "x m²").
> - **`crops`** (array crop-template terkait lahan, masih `[]`): **FE SUDAH
>   mengonsumsinya** (`src/lib/crops.ts` → `cropTags`). Kalau terisi → jadi tag
>   tanaman real di kartu & detail; kalau kosong → fallback tebak dari nama.
>   FE mengasumsikan tiap item berbentuk `{ id, name, description? }` (sama seperti
>   §6). Mohon dikonfirmasi kalau bentuknya beda (mis. ada pivot/qty).
> - **`boundary`** (poligon batas, masih `null`): belum dipakai. Rencana: gambar
>   poligon batas lahan di peta (sekarang baru lingkaran). Mohon kabari formatnya
>   (array `[lat,lng]`?) saat sudah terisi.

### 5. POST `/api/myfields` _(Bearer, `multipart/form-data`)_ — ✅ **JALAN** (201)

Field form-data:

- `name` (string)
- `description` (string)
- `area` (**number** — meter persegi; validasi backend menolak non-angka)
- `latitude` (string)
- `longitude` (string)
- `thumbnail` (file gambar, **opsional/nullable** — boleh dikosongkan)

### 6. GET `/api/crop-templates` _(saat ini FE memanggil tanpa Bearer)_

Response (`json.data` = array):

```json
{ "data": [{ "id": 1, "name": "...", "description": "..." }] }
```

### 7. Preferensi User (Settings) — **BUTUH KOLOM BARU**

FE butuh menyimpan preferensi user (tema gelap/terang, bahasa, notifikasi) agar
**konsisten lintas device** dan bisa diterapkan ke seluruh tampilan saat login.

**a. Skema DB — tambah kolom JSON di tabel `users`:**

```php
// migration baru, JANGAN ubah kolom lama
$table->json('settings')->nullable()->after('email_verified_at');
```

```php
// app/Models/User.php
protected $fillable = [..., 'settings'];
protected function casts(): array {
    return [..., 'settings' => 'array'];
}
```

Bentuk JSON yang FE kirim & harapkan (semua opsional; kalau `null` FE pakai default):

```json
{
  "theme": "light", // "light" | "dark"
  "language": "id", // "id" | "en"
  "notifications": true
}
```

**b. GET `/api/auth/user`** — sertakan `settings` di `data`:

```json
{
  "data": {
    "name": "...",
    "email": "...",
    "settings": { "theme": "dark", "language": "id", "notifications": true }
  }
}
```

> Kalau `settings` masih `null` boleh dikembalikan `null` — FE otomatis fallback ke default.

**c. PATCH `/api/auth/settings`** _(Bearer)_ — simpan preferensi:

Request (JSON, kirim objek penuh):

```json
{ "theme": "dark", "language": "id", "notifications": true }
```

Response yang diharapkan FE (`data` = settings terbaru):

```json
{ "data": { "theme": "dark", "language": "id", "notifications": true } }
```

- Validasi: `theme` ∈ {light,dark}, `language` ∈ {id,en}, `notifications` boolean.
- Sampai endpoint ini ada, **FE tetap jalan** memakai cache `localStorage` (tidak error).

### 8. GET `/api/myfields/{id}` _(Bearer)_ — **BELUM ADA**

Halaman **Detail Lahan** (`/dField-ii/$id`) sekarang terpaksa ambil seluruh list
`/api/myfields` lalu cari by `id` di sisi FE. Tolong sediakan endpoint detail
tunggal supaya efisien.

Response (`response.data.data` = satu objek, bentuk sama seperti item di §4):

```json
{
  "data": {
    "id": 1,
    "name": "...",
    "description": "...",
    "thumbnail": "...",
    "location": { "latitude": "...", "longitude": "..." },
    "area": "...",
    "owner": { "id": 1, "name": "..." },
    "created_at": "...",
    "updated_at": "..."
  }
}
```

### 9. Data kondisi tanaman / jadwal / nutrisi — **BELUM ADA (masih dummy di FE)**

Detail lahan menampilkan **kondisi tanaman** (kadar air, pencahayaan,
kelembapan), **jadwal** (perkiraan panen, waktu siram), dan **tabel nutrisi**.
Semua ini sekarang **hardcoded** di FE karena belum ada sumbernya. Mohon
diskusi bentuk kontraknya (sensor/IoT? input manual per cycle?) supaya FE bisa
menyambungkannya. Untuk sekarang FE tetap jalan dengan data dummy.

### 10. Crop-templates — **metadata tambahan (masih diturunkan di FE)**

Kartu tanaman di katalog (`/cycle-ii`) menampilkan **kategori** dan **estimasi
umur panen**. Saat ini `GET /api/crop-templates` cuma kirim
`{ id, name, description }`, jadi kedua atribut itu **dipetakan dari nama di FE**
(`CROP_RULES` di `src/routes/cycle-ii.tsx`) — datanya kira-kira, belum akurat.

Mohon tambahkan field berikut di tiap item crop-template (semua opsional; kalau
kosong FE fallback ke tebakan dari nama):

```json
{
  "id": 1,
  "name": "Cabai",
  "description": "...",
  "thumbnail": "...", // URL foto (FE masih pakai aset lokal /public)
  "category": "Hortikultura", // Sayuran Daun | Buah | Pangan | Umbi | Hortikultura | ...
  "growth_days": 90 // estimasi umur panen (hari)
}
```

> ⚠️ **Progress bar (`{plant.progress}%`) dan lokasi lahan (`{plant.land}`) di
> kartu** sekarang masih **dummy** (ditebak dari id). Keduanya milik **siklus
> tanam aktif**, bukan template — idealnya datang dari endpoint cycles (lihat
> §9). Mohon sediakan per cycle: `progress` (0–100) atau data fase, plus relasi
> `field` (`{ id, name }`) supaya nama lahannya bisa ditampilkan.

### 11. `/api/cycles` _(Bearer)_ — 🔴 **ROUTE BELUM ADA SAMA SEKALI** (GET & POST 404)

> ⚠️ Diverifikasi 2026-06-06: `POST /api/cycles` **dan** `GET /api/cycles?field_id=`
> dua-duanya balas `404 "The route api/cycles could not be found."`. Artinya
> **tombol "Mulai Tanam" (MulaiTanamModal) juga gagal** karena POST-nya ke sini.
> Mohon route `cycles` (minimal POST untuk mulai tanam + GET dengan filter
> `field_id`) di-register di `routes/api.php`.

Halaman **Detail Lahan** menampilkan kartu **Siklus Tanam Aktif** (tanaman yang
sedang ditanam di lahan itu). Sekarang FE memanggil endpoint ini; karena belum
ada, FE otomatis menampilkan empty state ("Belum ada tanam" + tombol Mulai
Tanam). Begitu endpoint tersedia, kartu langsung terisi.

Request: query `field_id` (filter siklus milik lahan tsb).

Response (`response.data.data` = array siklus; FE ambil yang `status` ≠
`harvested`/`done`):

```json
{
  "data": [
    {
      "id": 1,
      "plant_name": "Cabai Merah",
      "field_id": 1,
      "start_date": "2026-05-01",
      "status": "active",
      "phase": "Pembungaan",
      "progress": 60,
      "estimated_harvest_date": "2026-08-01"
    }
  ]
}
```

> Field `phase`, `progress`, `estimated_harvest_date` opsional — FE menyembunyikan
> bagian yang null. Minimal `id`, `plant_name`, `start_date` sudah cukup.

### 12. Ringkasan `active_cycle` di `GET /api/myfields` — **opsional tapi disarankan**

Kartu lahan di list (`/field-ii`) ingin menampilkan **status tanam** (lagi nanam
apa + progress) tanpa harus panggil `/cycles` per kartu (N request). Mohon
sertakan ringkasan siklus aktif di tiap item `myfields`:

```json
{
  "active_cycle": {
    "plant_name": "Cabai Merah",
    "phase": "Pembungaan",
    "progress": 60
  }
}
```

> Kalau lahan belum ada siklus aktif → `active_cycle: null`. FE menampilkan badge
> "Belum ada tanam".

> ℹ️ Catatan: kartu **kondisi/sensor** (kadar air, pencahayaan, kelembapan) &
> tabel nutrisi yang dulu hardcoded **sudah dihapus** dari detail lahan, diganti
> **widget Cuaca real** (Open-Meteo, langsung dari browser pakai koordinat lahan —
> tidak butuh backend). Jadi kebutuhan sensor cuaca di §9 tak perlu lagi.

### 13. POST `/api/auth/forgot-password` — **BELUM ADA**

Halaman **Lupa Password** (`/forgot-password`) mengirim email user; backend kirim
email berisi **link reset** ke FE.

Request (JSON):

```json
{ "email": "user@example.com" }
```

Response yang diharapkan FE (terdaftar atau tidak, balikan **200** biar tidak
bocor info email mana yang terdaftar / anti-enumeration):

```json
{ "message": "Jika email terdaftar, link reset sudah dikirim." }
```

- Link di email **wajib** mengarah ke FE, format:
  `http://localhost:8006/reset-password?token=<token>&email=<email>`
  (set config Laravel password broker / `APP_FRONTEND_URL` ke origin FE `8006`).
- Standar Laravel `Password::sendResetLink` sudah cukup.

### 14. POST `/api/auth/reset-password` — **BELUM ADA**

Halaman **Reset Password** (`/reset-password`) baca `token` & `email` dari query
string lalu submit password baru.

Request (JSON):

```json
{
  "token": "<dari link email>",
  "email": "user@example.com",
  "password": "rahasiabaru",
  "password_confirmation": "rahasiabaru"
}
```

Response sukses (**200**): `{ "message": "Password berhasil diubah." }`

- Token invalid/kadaluarsa → **422** dengan `message` (FE tampilkan apa adanya).
- Standar Laravel `Password::reset`.

### 15. POST `/api/auth/google` — **BELUM ADA** (Google OAuth, ID-token flow)

Handshake Google ditangani **di FE** (Google Identity Services). FE kirim
`id_token` (credential JWT), backend **verifikasi** ke Google lalu balikan token
Sanctum yang **seragam** dengan login biasa. Detail lengkap + migration ada di
plan vault `Plans/Integration-GoogleOAuth.md` (sudah di-approve).

Request (JSON, publik): `{ "id_token": "<google id_token>" }`

Response sukses (**200**, sama bentuk dgn login — FE baca via fallback
`data.data.access_token` → `data.access_token`):

```json
{ "data": { "access_token": "...", "token_type": "Bearer" } }
```

- `id_token` invalid → **401**.
- Verifikasi wajib di backend (`Socialite::driver('google')->stateless()->userFromToken($idToken)`),
  validasi `aud` = Client ID kita.
- Butuh migration `users`: `google_id` (unique nullable), `provider` nullable,
  `password` jadi nullable.
- FE & backend pakai **Web Client ID** yang sama (`VITE_GOOGLE_CLIENT_ID` di FE;
  `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` di backend). Authorized JS origin:
  `http://localhost:8006`.

### 16. POST `/api/auth/change-password` _(Bearer)_ — **BELUM ADA**

Section **Keamanan** di halaman Pengaturan (`/settings-ii`) menyediakan form ganti
kata sandi untuk user yang **sudah login** (beda dari reset-password yang pakai
token email). Tombol submit di FE saat ini **disabled** sampai endpoint ini ada.

Request (JSON, Bearer):

```json
{
  "current_password": "rahasialama",
  "password": "rahasiabaru",
  "password_confirmation": "rahasiabaru"
}
```

Response sukses (**200**): `{ "message": "Kata sandi berhasil diperbarui." }`

- `current_password` salah → **422** dengan `message` (FE tampilkan apa adanya).
- Validasi `password` min 8 + `confirmed` (standar Laravel).
- Tidak perlu kolom baru; cukup `Hash::check` + `update(['password' => Hash::make(...)])`.

### 17. "Ingat Saya" / masa berlaku token — **OPSIONAL (FE sudah handle sendiri)**

Fitur **"Ingat Saya"** di halaman login **sudah berfungsi tanpa perubahan backend**.
FE memutuskannya murni lewat pilihan storage di sisi klien:

- Dicentang → token disimpan di `localStorage` (bertahan walau browser ditutup).
- Tidak dicentang → token disimpan di `sessionStorage` (hangus saat tab/browser ditutup).

**Tidak ada yang perlu dikerjakan backend untuk fitur ini berjalan.**

Permintaan **opsional** (kalau mau lebih aman, bukan blocker):

- Saat ini token Sanctum yang dikembalikan `/api/auth/login` (lihat §2) tampaknya
  **tanpa masa kadaluarsa**. Idealnya token punya TTL, dan kalau memungkinkan
  TTL bisa berbeda untuk sesi "remember" vs "non-remember".
- Kalau backend ingin mengatur ini, sediakan cara FE mengirim preferensi remember
  (mis. field `remember: true` di body login) dan backend menetapkan expiry token
  sesuai. FE akan menyesuaikan kalau endpoint mendukung.

## Hal lain yang perlu dipastikan

- **CORS**: izinkan origin `http://localhost:8006` (dan `http://172.24.170.241:8006`) karena FE jalan di port **8006**.
- Pastikan response **konsisten dibungkus `data`** seperti contoh di atas; kalau ada perbedaan bentuk, mohon dikabari supaya FE menyesuaikan parsing-nya.
