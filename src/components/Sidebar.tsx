import { HelpCircle, Home, Layers, Leaf, Settings, Warehouse } from "lucide-react"
import { Link } from "@tanstack/react-router";
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
    return (
        <div className="fixed inset-y-0 left-0 w-[280px] bg-[#0B4619] text-white flex flex-col rounded-r-2xl ">
            {/* Logo */}
            <div className="p-6 flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 17.5C22 19.9853 19.9853 22 17.5 22C15.0147 22 13 19.9853 13 17.5C13 15.0147 15.0147 13 17.5 13C19.9853 13 22 15.0147 22 17.5Z" />
                    <path d="M15 6.5C15 8.98528 12.9853 11 10.5 11C8.01472 11 6 8.98528 6 6.5C6 4.01472 8.01472 2 10.5 2C12.9853 2 15 4.01472 15 6.5Z" />
                    <path d="M11 17.5C11 14.4624 13.4624 12 16.5 12C19.5376 12 22 14.4624 22 17.5C22 20.5376 19.5376 23 16.5 23C13.4624 23 11 20.5376 11 17.5Z" />
                    <path d="M2 17.5C2 15.0147 4.01472 13 6.5 13C8.98528 13 11 15.0147 11 17.5C11 19.9853 8.98528 22 6.5 22C4.01472 22 2 19.9853 2 17.5Z" />
                </svg>
                <span className="text-xl font-semibold">AgriCloud</span>
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
                        <div className="font-medium">Jhon doe</div>
                        <div className="text-xs text-[#a3e0b5]">Jhon.doe@email.com</div>
                    </div>
                </div>
                <NavItem icon={<HelpCircle size={20} />} label="Pusat Bantuan" variant="bottom" to="" />
                <NavItem icon={<Settings size={20} />} label="Pengaturan" variant="bottom" to=""/>
            </div>
        </div>
    )
}

