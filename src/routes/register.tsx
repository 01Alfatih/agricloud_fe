import { createFileRoute, redirect } from '@tanstack/react-router'

// Route lama → redirect ke tampilan baru (register-ii).
export const Route = createFileRoute('/register')({
  beforeLoad: () => {
    throw redirect({ to: '/register-ii' })
  },
})
