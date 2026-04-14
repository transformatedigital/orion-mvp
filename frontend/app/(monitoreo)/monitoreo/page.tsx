// M2 — Monitoreo: Dashboard
import Link from "next/link";

export default function MonitoreoPage() {
  return (
    <div className="grid gap-6">
      {/* Resumen flota */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="text-sm text-slate-600">Total Unidades</div>
          <div className="text-3xl font-bold text-blue-600">6</div>
          <div className="text-xs text-slate-500">flota activa</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="text-sm text-slate-600">En Operación</div>
          <div className="text-3xl font-bold text-green-600">5</div>
          <div className="text-xs text-slate-500">activas ahora</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="text-sm text-slate-600">Alertas Activas</div>
          <div className="text-3xl font-bold text-red-600">2</div>
          <div className="text-xs text-slate-500">requieren atención</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="text-sm text-slate-600">Temperatura Promedio</div>
          <div className="text-3xl font-bold text-cyan-600">-18°C</div>
          <div className="text-xs text-slate-500">dentro de rango</div>
        </div>
      </div>

      {/* Acceso a submódulos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/monitoreo/unidades">
          <div className="bg-gradient-to-br from-cyan-50 to-blue-100 p-6 rounded-lg border border-cyan-200 hover:shadow-lg transition cursor-pointer">
            <div className="text-2xl mb-2">🚚</div>
            <h3 className="font-semibold text-cyan-900">Unidades</h3>
            <p className="text-sm text-cyan-700">Ubicación y estado en tiempo real</p>
          </div>
        </Link>

        <Link href="/monitoreo/alertas">
          <div className="bg-gradient-to-br from-orange-50 to-red-100 p-6 rounded-lg border border-orange-200 hover:shadow-lg transition cursor-pointer">
            <div className="text-2xl mb-2">⚠️</div>
            <h3 className="font-semibold text-orange-900">Alertas</h3>
            <p className="text-sm text-orange-700">Eventos críticos y notificaciones</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
