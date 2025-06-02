import { Link } from '@tanstack/react-router'
import { Bell, Home, Layers, Leaf, Warehouse } from "lucide-react"
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
            </svg>
            <span className="text-xl font-semibold">AgriCloud</span>
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
            <Avatar>
              <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
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
