import { HelpCircle, Home, Layers, Leaf, Settings, Warehouse } from "lucide-react"
import { Link, useNavigate } from "@tanstack/react-router";
import axios from "axios";
import { useEffect, useState } from "react";
import type { ReactNode } from "@tanstack/react-router";
import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

type NavItemProps = {
  active?: boolean;
  icon: ReactNode;
  label?: string;
  variant?: "default" | "bottom";
  to: string;
};

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


function NavItem({ active = false, icon, label, variant = "default", to }: NavItemProps) {
  return (

    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm mb-1 cursor-pointer transition-colors",
        active && variant === "default" ? "bg-[#2a7039]" : "hover:bg-[#1a5e2b]",
        variant === "bottom" ? "bg-[#2a7039] mb-2" : "",
      )}
    >
      <span className="text-[#a3e0b5]">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}



export function SidebarDs() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<IProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    axios.get<{ data: IProfileResponse }>('http://localhost:8000/api/auth/user', {
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

    <div className="fixed inset-y-0 left-0 w-[280px] bg-[#0B4619] text-white flex flex-col rounded-r-2xl ">
      {/* Logo */}
      <div className="p-6 flex items-center gap-2">
        <img src="/public/logo1.png" alt="AgriCloud" />
      </div>

      {/* Navigation */}
      <nav className="px-3 py-2 flex-1">
        <NavItem icon={<Home size={20} />} label="Dashboard" to="/dashboard" active />
        <NavItem icon={<Layers size={20} />} label="Lahan" to="/field" />
        <NavItem icon={<Leaf size={20} />} label="Tanaman" to="/cycle" />
        <NavItem icon={<Warehouse size={20} />} label="Gudang" to="/warehouse" />
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-[#0a3d16]">
        <div className="flex items-center gap-3 mb-3 p-2">
          <Avatar className="h-10 w-10 border-2 border-[#1a5e2b]">
            <img src="https://i.pravatar.cc/100" alt="User avatar" />
          </Avatar>
          <div>
            <div className="font-medium">{profile.name}</div>
            <div className="text-xs text-[#a3e0b5]">{profile.email}</div>
          </div>
        </div>
        <NavItem icon={<HelpCircle size={20} />} label="Pusat Bantuan" variant="bottom" to="" />
        <NavItem icon={<Settings size={20} />} label="Pengaturan" variant="bottom" to="/profile" />
      </div>
    </div>
  )
}

