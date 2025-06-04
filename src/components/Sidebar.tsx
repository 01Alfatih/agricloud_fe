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

