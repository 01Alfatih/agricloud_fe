import { Link, useNavigate } from '@tanstack/react-router'
import { Bell, Home, Layers, Leaf, Warehouse } from "lucide-react"
import { useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

type NavbarProps = {
  currentPath: string;
  label: string;
  icon: React.ReactNode;
  to: string;
  active: boolean;
};

export default function AgriCloudNavbar({ currentPath }: NavbarProps) {
  const navigate = useNavigate();

  const getToken = async () => {
    const token = await localStorage.getItem("token");
    if (!token) {
      navigate({ to: '/login' });
    }
  }
  useEffect(() => {
    getToken();
  }, [])

  const navItems = [
    { label: "Dashboard", paths: ["/dashboard"], icon: <Home size={20} /> },
    { label: "Lahan", paths: ["/field", "/dfield"], icon: <Layers size={20} /> },
    { label: "Tanaman", paths: ["/cycle", "/dCycle", "/tanaman"], icon: <Leaf size={20} /> },
    { label: "Gudang", paths: ["/warehouse", "/storage"], icon: <Warehouse size={20} /> }
  ];

  return (
    <div className="w-full bg-[#1a3b2a] text-white border-b border-[#2a4b3a] rounded-b-2xl">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-2">
            <img src="/logo1.png" alt="" className='w-40' />
          </div>

          {/* Navigation */}
          {navItems.map(({ label, paths, icon }) => (
            <NavItem
              key={label}
              icon={icon}
              label={label}
              to={paths[0]} // Use the first path as the link target
              active={paths.some((p) => currentPath.startsWith(p))}
            />
          ))}

          {/* Right Side - Notifications and Profile */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-white">
              <Bell className="h-5 w-5" />
            </Button>
            <Link to="/profile">
              <Avatar>
                <AvatarImage src="https://i.pravatar.cc/100" alt="User" />
                <AvatarFallback>asdassddasd</AvatarFallback>
              </Avatar>
              </Link>
          </div>
        </div>
      </div>

      {/* Decorative bottom border */}
    </div>
  )
}

interface NavItemProps {
  label: string
  active: boolean
  to: string
  icon: React.ReactNode
}

function NavItem({ label, active, to, icon }: NavItemProps) {
  return (
    <Link to={to}>
      {active ? (
        <Button variant="secondary" className="bg-[#4a8c64] hover:bg-[#5a9c74] text-white rounded-md flex items-center gap-2">
          {icon}
          {label}
        </Button>
      ) : (
        <Button variant="ghost" className="text-white hover:bg-[#2a4b3a] flex items-center gap-2">
          {icon}
          {label}
        </Button>
      )}
    </Link>
  )
}
