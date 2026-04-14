// M3 — Mantenimiento: Dashboard
import Link from "next/link";

export default function MantenimientoPage() {
  return (
    <div className="grid gap-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="text-sm text-slate-600">Órdenes Abiertas</div>
          <div className="text-3xl font-bold text-blue-600">4</div>
          <div className="text-xs text-slate-500">pendientes</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="text-sm text-slate-600">Autorizaciones Pendientes</div>
          <div className="text-3xl font-bold text-yellow-600">2</div>
          <div className="text-xs text-slate-500">requieren aprobación</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="text-sm text-slate-600">En Taller</div>
          <div className="text-3xl font-bold text-orange-600">1</div>
          <div className="text-xs text-slate-500">en reparación</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="text-sm text-slate-600">Disponibilidad Flota</div>
          <div className="text-3xl font-bold text-green-600">83%</div>
          <div className="text-xs text-slate-500">operativo</div>
        </div>
      </div>

      {/* Acceso */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/mantenimiento/ordenes">
          <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-lg border border-purple-200 hover:shadow-lg transition cursor-pointer">
            <div className="text-2xl mb-2">📋</div>
            <h3 className="font-semibold text-purple-900">Órdenes</h3>
            <p className="text-sm text-purple-700">Gestionar órdenes de mantenimiento</p>
          </div>
        </Link>

        <Link href="/mantenimiento/flota">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-100 p-6 rounded-lg border border-indigo-200 hover:shadow-lg transition cursor-pointer">
            <div className="text-2xl mb-2">🏭</div>
            <h3 className="font-semibold text-indigo-900">Flota</h3>
            <p className="text-sm text-indigo-700">Disponibilidad y programación</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
