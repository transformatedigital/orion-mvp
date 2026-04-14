"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Truck,
  LayoutDashboard,
  MessageSquare,
  Bot,
  LogOut,
  Camera,
  BarChart3,
  BookOpen,
  CheckCircle2,
  DollarSign,
  FileText,
  Menu,
  X,
  Home,
} from "lucide-react";

// Orden lógico del proceso según flujo del cliente
const sidebarLinks = [
  { href: "http://localhost:8000/solicitudes-ui", label: "1. Solicitudes ⭐", icon: FileText, section: "Operación", external: true },
  { href: "/aprobaciones", label: "2. Aprobaciones", icon: CheckCircle2, section: "Operación" },
  { href: "/", label: "3. Flota Viva", icon: Truck, section: "Operación" },
  { href: "/bitacora-diaria", label: "4. Bitácora Diaria", icon: BookOpen, section: "Monitoreo" },
  { href: "/evidencias", label: "5. Evidencias", icon: Camera, section: "Monitoreo" },
  { href: "/liquidaciones", label: "6. Liquidaciones", icon: DollarSign, section: "Administración" },
  { href: "/reportes", label: "7. Reportes", icon: BarChart3, section: "Administración" },
  { href: "/dashboard", label: "Dashboard", isPrimary: true, icon: LayoutDashboard, section: "General" },
  { href: "/chat", label: "Chat IA", icon: Bot, section: "General" },
  { href: "/simular", label: "Simular", icon: MessageSquare, section: "General" },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    document.cookie = "orion_auth=; path=/; max-age=0";
    router.push("/login");
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Agrupar links por sección
  const sections = ["Operación", "Monitoreo", "Administración", "General"];
  const linksBySection = sections.reduce((acc, section) => {
    acc[section] = sidebarLinks.filter((link) => link.section === section);
    return acc;
  }, {} as Record<string, typeof sidebarLinks>);

  return (
    <>
      {/* Mobile hamburger button — fixed en top-left */}
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-orion-700 hover:bg-orion-600 text-white transition-colors"
        aria-label="Toggle menu"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay en móvil */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — fixed en desktop, overlay en móvil */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-orion-900 text-white transition-transform duration-300 z-40 flex flex-col w-64
          ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          lg:flex lg:w-64`}
      >
        {/* Header del sidebar */}
        <div className="p-4 border-b border-orion-700">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 hover:opacity-80 transition"
            onClick={() => setOpen(false)}
          >
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold">Orión</div>
              <div className="text-xs text-orange-300">Cryo</div>
            </div>
          </Link>
        </div>

        {/* Navigation links — scroll en móvil */}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {sections.map((section) => (
            <div key={section} className="mb-6">
              <div className="px-2 mb-2 text-xs font-semibold text-orion-400 uppercase tracking-wider">
                {section}
              </div>
              <div className="space-y-1">
                {linksBySection[section].map(({ href, label, icon: Icon, external }) => {
                  const active = isActive(href);
                  const linkProps = external
                    ? { href, target: "_blank", rel: "noopener noreferrer" }
                    : { href };

                  return (
                    <Link
                      key={href}
                      {...linkProps}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                        active
                          ? "bg-orange-600 text-white font-medium"
                          : "text-orion-300 hover:bg-orion-700 hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer — Logout */}
        <div className="border-t border-orion-700 p-2">
          <button
            onClick={() => {
              logout();
              setOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-orion-300 hover:bg-orion-700 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Spacer para que el contenido no se superponga en desktop */}
      <div className="hidden lg:block lg:w-64" />
    </>
  );
}
