import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { isAuthed } from '@/lib/auth'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate({ to: isAuthed() ? '/dashboard' : '/login-ii' })
  }, [navigate])

  return <div></div>
}
