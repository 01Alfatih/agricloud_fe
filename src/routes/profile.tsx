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
  profilePhotoUrl: string | null;
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
  const [form, setForm] = useState({
    name: '',
    email: '',
    pNumber: '',
    profilePhotoUrl: '',
  })
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
  const checkAndFetch = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate({ to: '/login' });
      return;
    }
    await fetchProfile();
  };

  checkAndFetch(); // panggil function
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get<{ data: any }>(
        'http://localhost:8000/api/auth/user',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )

      const data = res.data.data
      const user: IProfile = {
        name: data.name,
        email: data.email,
        pNumber: data.phone_number,
        role: data.role,
        profilePhotoUrl: data.profile_photo_url,
      }

      setProfile(user)
      setForm({
        name: user.name,
        email: user.email,
        pNumber: user.pNumber,
        profilePhotoUrl: user.profilePhotoUrl || '',
      })
    } catch (err) {
      console.error('Gagal fetch profil:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append("_method", "PUT");
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("phone_number", form.pNumber);

      if (selectedFile) {
        formData.append("profile_photo", selectedFile); // ✅ harus match backend
      }

      await axios.post(
        "http://localhost:8000/api/auth/user/update", // or PATCH if allowed
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
            "Accept": "application/json",
          },
        }
      );

      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      console.error("Gagal update profil:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate({ to: '/login' })
  }

  const handleBack = () => {
    navigate({ to: '/dashboard' })
  }

  if (loading) return <div>Loading...</div>
  if (!profile) return <div>Gagal memuat data profil.</div>

  return (
    <div className='h-screen w-screen relative bg-green-50'>
      <div className="flex justify-center bg-gradient-to-br p-4 my-40">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-3xl max-h-[90vh] overflow-auto">
          <div className="flex flex-col items-center ">
            <div className='flex '>
              {isEditing ? (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                    }
                  }}
                  className="mt-4 w-[70%] text-sm"
                />) :(
                  <img
                    src={
                      selectedFile
                        ? URL.createObjectURL(selectedFile)
                        : form.profilePhotoUrl || 'https://i.pravatar.cc/100'
                    }
                    alt="Profile"
                    className="rounded-full w-24 h-24 object-cover border-4 border-white shadow-md"
                  />
                )              
              }
              <div className='mx-4'>
                {isEditing ? (
                  <input
                    className="text-xl font-semibold border p-1 rounded"
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                  />
                ) : (
                  <h2 className="mt-4 text-xl font-semibold">
                    {profile.name}
                  </h2>
                )}
                <Badge className="mt-1 bg-green-100 text-green-500" variant="secondary">
                  {profile.role}
                </Badge>
              </div>
            </div>
            <Button
              className="mt-4 bg-gray-100 text-black hover:bg-green-700 w-[70%]"
              onClick={
                isEditing ? handleSave : () => setIsEditing(true)
              }
            >
              {isEditing ? 'Simpan' : 'Edit Profil'}
            </Button>
            <Button className="mt-4 bg-gray-100 text-black hover:bg-green-700 w-[70%]" onClick={handleBack}>Kembali</Button>
            <Button className="mt-4 border bg-white text-black hover:bg-white border-red-600 w-[70%]" onClick={handleLogout}>Logout</Button>

          </div>

          <div className="flex flex-col md:flex-row gap-6 mt-8 justify-center items-center text-center">
            <div className="flex-1 ">
              <h3 className="font-semibold mb-2">Data Pribadi</h3>
                {/* Email */}
                <Card className="bg-green-800 text-white mb-2">
                  <label htmlFor="email">Email</label>
                  <CardContent className="p-4">
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleInputChange}
                        className="text-black p-2 rounded w-full"
                        placeholder="Email"
                      />
                    ) : (
                      profile.email
                    )}
                  </CardContent>
                </Card>

                {/* Role (readonly) */}
                <Card className="bg-green-800 text-white mb-2">
                  <CardContent className="p-4">{profile.role}</CardContent>
                </Card>

                {/* Phone Number */}
                <Card className="bg-green-800 text-white">
                  <CardContent className="p-4">
                    {isEditing ? (
                      <input
                        type="text"
                        name="pNumber"
                        value={form.pNumber}
                        onChange={handleInputChange}
                        className="text-black p-2 rounded w-full"
                        placeholder="Nomor HP"
                      />
                    ) : (
                      profile.pNumber
                    )}
                  </CardContent>
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
