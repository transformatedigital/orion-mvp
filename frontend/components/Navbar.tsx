"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Truck, LayoutDashboard, MessageSquare, Bot, LogOut } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/", label: "Flota", icon: Truck },
  { href: "/chat", label: "Chat IA", icon: Bot },
  { href: "/simular", label: "Simular", icon: MessageSquare },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    document.cookie = "orion_auth=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <nav className="bg-orion-800 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight hidden sm:block">
              Orión
            </span>
            <span className="text-orange-300 text-xs hidden sm:block">AI Monitor</span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? "bg-orion-600 text-white"
                      : "text-slate-300 hover:bg-orion-700 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}

            {/* Logout */}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:bg-orion-700 hover:text-white transition-colors ml-1"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
