// M6 — Reportes: Selector de dashboard
import Link from "next/link";

export default function ReportesPage() {
  return (
    <div className="grid gap-6">
      <p className="text-slate-600">Selecciona el dashboard según tu rol de usuario</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/reportes/operativo">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-100 p-8 rounded-lg border border-blue-200 hover:shadow-lg transition cursor-pointer">
            <div className="text-3xl mb-3">🚚</div>
            <h3 className="font-semibold text-blue-900 text-lg">Tablero Operativo</h3>
            <p className="text-sm text-blue-700 mt-2">Para Tráfico & Monitoreo</p>
            <div className="mt-4 text-xs text-blue-600 font-mono">
              KPI en vivo: OTD, Servicios, Incidencias
            </div>
          </div>
        </Link>

        <Link href="/reportes/gerencial">
          <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-8 rounded-lg border border-purple-200 hover:shadow-lg transition cursor-pointer">
            <div className="text-3xl mb-3">📈</div>
            <h3 className="font-semibold text-purple-900 text-lg">Tablero Gerencial</h3>
            <p className="text-sm text-purple-700 mt-2">Para Managers & Supervisores</p>
            <div className="mt-4 text-xs text-purple-600 font-mono">
              Tendencias, desempeño, análisis
            </div>
          </div>
        </Link>

        <Link href="/reportes/directivo">
          <div className="bg-gradient-to-br from-amber-50 to-orange-100 p-8 rounded-lg border border-amber-200 hover:shadow-lg transition cursor-pointer">
            <div className="text-3xl mb-3">👔</div>
            <h3 className="font-semibold text-amber-900 text-lg">Tablero Directivo</h3>
            <p className="text-sm text-amber-700 mt-2">Para Dirección General</p>
            <div className="mt-4 text-xs text-amber-600 font-mono">
              Rentabilidad, metas, decisiones
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
