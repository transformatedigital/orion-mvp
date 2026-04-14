// M5 — Administración: Dashboard
import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="grid gap-6">
      {/* Resumen financiero */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="text-sm text-slate-600">Facturas Pendientes</div>
          <div className="text-3xl font-bold text-red-600">$245,000</div>
          <div className="text-xs text-slate-500">14 facturas vencidas</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="text-sm text-slate-600">Cuentas por Cobrar</div>
          <div className="text-3xl font-bold text-orange-600">$580,000</div>
          <div className="text-xs text-slate-500">42 días promedio</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="text-sm text-slate-600">Tasa de Cobranza</div>
          <div className="text-3xl font-bold text-green-600">76%</div>
          <div className="text-xs text-slate-500">este mes</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="text-sm text-slate-600">Ingresos (Hoy)</div>
          <div className="text-3xl font-bold text-blue-600">$18,500</div>
          <div className="text-xs text-slate-500">3 servicios cerrados</div>
        </div>
      </div>

      {/* Acceso */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/facturas">
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-lg border border-green-200 hover:shadow-lg transition cursor-pointer">
            <div className="text-2xl mb-2">📄</div>
            <h3 className="font-semibold text-green-900">Facturas</h3>
            <p className="text-sm text-green-700">Generar y gestionar facturación</p>
          </div>
        </Link>

        <Link href="/admin/cobranza">
          <div className="bg-gradient-to-br from-amber-50 to-yellow-100 p-6 rounded-lg border border-amber-200 hover:shadow-lg transition cursor-pointer">
            <div className="text-2xl mb-2">💳</div>
            <h3 className="font-semibold text-amber-900">Cobranza</h3>
            <p className="text-sm text-amber-700">Seguimiento de pagos y vencidos</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
