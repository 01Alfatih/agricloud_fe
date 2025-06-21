import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react';



export const Route = createFileRoute('/')({
  component: App,
})




function App() {
  const navigate = useNavigate();

  const getToken = async () => {
      const token = await localStorage.getItem("token");
      if (token || !token ) {
        navigate({ to: '/login' });
      }
    }
    useEffect(() => {
      getToken();
    }, [])

  return (
    <div >

    </div>
  )
}
