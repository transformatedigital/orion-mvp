// M1 — Operación: Dashboard y resumen
import Link from "next/link";

export default function OperacionPage() {
  return (
    <div className="grid gap-6">
      {/* Resumen rápido */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="text-sm text-slate-600">Servicios Activos</div>
          <div className="text-3xl font-bold text-blue-600">12</div>
          <div className="text-xs text-slate-500">en ruta ahora</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="text-sm text-slate-600">Incidencias Abiertas</div>
          <div className="text-3xl font-bold text-red-600">3</div>
          <div className="text-xs text-slate-500">requieren acción</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="text-sm text-slate-600">Documentación Pendiente</div>
          <div className="text-3xl font-bold text-yellow-600">5</div>
          <div className="text-xs text-slate-500">servicios incompletos</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="text-sm text-slate-600">OTD (Hoy)</div>
          <div className="text-3xl font-bold text-green-600">87%</div>
          <div className="text-xs text-slate-500">meta: 85%</div>
        </div>
      </div>

      {/* Acceso a módulos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/operacion/servicios">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200 hover:shadow-lg transition cursor-pointer">
            <div className="text-2xl mb-2">📦</div>
            <h3 className="font-semibold text-blue-900">Servicios</h3>
            <p className="text-sm text-blue-700">Crear, ver y actualizar servicios</p>
          </div>
        </Link>

        <Link href="/operacion/incidencias">
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg border border-red-200 hover:shadow-lg transition cursor-pointer">
            <div className="text-2xl mb-2">⚠️</div>
            <h3 className="font-semibold text-red-900">Incidencias</h3>
            <p className="text-sm text-red-700">Abrir, asignar y resolver problemas</p>
          </div>
        </Link>

        <Link href="/operacion/checklist">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200 hover:shadow-lg transition cursor-pointer">
            <div className="text-2xl mb-2">✅</div>
            <h3 className="font-semibold text-green-900">Checklist Documental</h3>
            <p className="text-sm text-green-700">Validar documentación de servicios</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
