import { createFileRoute, redirect } from '@tanstack/react-router'

// Route lama → redirect ke tampilan baru (login-ii). Dipertahankan supaya
// semua navigate({ to: '/login' }) & bookmark lama tetap mendarat di UI baru.
export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    throw redirect({ to: '/login-ii' })
  },
})
