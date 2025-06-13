import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card";


export const Route = createFileRoute('/profile')({
  component: RouteComponent,
})

interface IProfile {
  name: string;
  email: string;
  pNumber: string;
  role: string;
}


interface IProfileResponse {
  id: number,
  name: string,
  email: string,
  email_verified_at: null | string,
  phone_number: string,
  role: string,
  profile_photo: null | string,
  created_at: Date,
  updated_at: Date,
  profile_photo_url: null | string,
}

function RouteComponent() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<IProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    axios.get<{data: IProfileResponse}>('http://localhost:8000/api/auth/user', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      }
    })
      .then((response) => {
        setProfile({
          name: response.data.data.name,
          email: response.data.data.email,
          pNumber: response.data.data.phone_number,
          role: response.data.data.role,
          
        });
      })
      .catch((error) => {
        console.error("Error fetching profile data:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);


  const handleBack = () => {
    navigate({ to: '/dashboard' });
  }
  

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate({ to: '/login' });
  }

  const getToken = async () => {
    const token = await localStorage.getItem("token");
    if (!token) {
      navigate({ to: '/login' });
    }
  }
  useEffect(() => {
    getToken();
    
  }, [])


  if (loading) return <div>Loading...</div>;
  if (!profile) return <div>Gagal memuat data profil.</div>;

  return (
    <div className='h-screen w-screen relative bg-green-50'>
      <div className="flex justify-center bg-gradient-to-br p-4 my-40">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-3xl max-h-[90vh] overflow-auto">
          <div className="flex flex-col items-center ">
            <div className='flex '>
              <img
                src="https://i.pravatar.cc/100"
                alt="Profile"
                className="rounded-full w-24 h-24 object-cover border-4 border-white shadow-md"
              />
              <div className='mx-4'>
                <h2 className="mt-4 text-xl font-semibold">{profile.name}</h2>
                <Badge className="mt-1 bg-green-100 text-green-500" variant="secondary">
                  {profile.role}
                </Badge>
              </div>
            </div>
            <Button className="mt-4 bg-gray-100 text-black hover:bg-green-700 w-[70%]">Edit Profil</Button>
            <Button className="mt-4 bg-gray-100 text-black hover:bg-green-700 w-[70%]" onClick={handleBack}>Kembali</Button>
            <Button className="mt-4 border bg-white text-black hover:bg-white border-red-600 w-[70%]" onClick={handleLogout}>Logout</Button>

          </div>

          <div className="flex flex-col md:flex-row gap-6 mt-8 justify-center items-center text-center">
            <div className="flex-1 ">
              <h3 className="font-semibold mb-2">Data Pribadi</h3>
              <Card className="bg-green-800 text-white mb-2">
                <CardContent className="p-4">{profile.email}</CardContent>
              </Card>
              <Card className="bg-green-800 text-white mb-2">
                <CardContent className="p-4">Gender: Pria</CardContent>
              </Card>
              <Card className="bg-green-800 text-white">
                <CardContent className="p-4">{profile.pNumber}</CardContent>
              </Card>
            </div>

            <div className="flex-1 ">
              <h3 className="font-semibold mb-2 items-center">Data Kepemilikan</h3>
              <Card className="bg-green-800 text-white mb-2">
                <CardContent className="p-4">Lahan: 3</CardContent>
              </Card>
              <Card className="bg-green-800 text-white mb-2">
                <CardContent className="p-4">Tanaman: 3</CardContent>
              </Card>
              <Card className="bg-green-800 text-white">
                <CardContent className="p-4">Gudang: 3</CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
