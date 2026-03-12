"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Truck,
  AlertTriangle,
  CheckCircle,
  Activity,
  TrendingUp,
  Clock,
} from "lucide-react";

const DonutChart = dynamic(() => import("@/components/DonutChart"), { ssr: false });
const BarChart = dynamic(() => import("@/components/BarChart"), { ssr: false });

interface DashboardData {
  kpis: {
    total_viajes: number;
    viajes_activos: number;
    viajes_alerta: number;
    viajes_completados_hoy: number;
    total_incidencias: number;
    total_detenciones: number;
    eventos_hoy: number;
    cumplimiento_reportes: number;
  };
  eventos_por_tipo: Record<string, number>;
  incidencias_recientes: Array<{
    viaje_id: string;
    unidad: string;
    descripcion: string;
    timestamp: string;
  }>;
}

const TIPO_LABELS: Record<string, string> = {
  salida_origen: "Salida origen",
  llegada_destino: "Llegada destino",
  salida_destino: "Salida destino",
  fin_viaje: "Fin viaje",
  incidencia: "Incidencia",
  detencion_prolongada: "Detención",
  desvio_ruta: "Desvío ruta",
  evidencia: "Evidencia",
  cumplimiento_check: "Check estatus",
  falta_reporte: "Falta reporte",
};

function KpiCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">
            {label}
          </p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${color.replace("text-", "bg-").replace("-600", "-100").replace("-700", "-100")}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/dashboard")
        .then((r) => r.json())
        .then(setData);
    load();
    const iv = setInterval(load, 10000);

    const sse = new EventSource("/api/stream");
    sse.onmessage = (e) => {
      const d = JSON.parse(e.data);
      if (d.type === "nuevo_evento") load();
    };

    return () => {
      clearInterval(iv);
      sse.close();
    };
  }, []);

  if (!data) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { kpis, eventos_por_tipo, incidencias_recientes } = data;

  const chartLabels = Object.keys(eventos_por_tipo).map(
    (k) => TIPO_LABELS[k] ?? k
  );
  const chartValues = Object.values(eventos_por_tipo);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard KPIs</h1>
        <p className="text-sm text-slate-500 mt-0.5">Operación en tiempo real</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <KpiCard
          label="Activos"
          value={kpis.viajes_activos}
          sub="Unidades en ruta"
          icon={<Truck className="w-5 h-5 text-emerald-600" />}
          color="text-emerald-600"
        />
        <KpiCard
          label="Alertas"
          value={kpis.viajes_alerta}
          sub="Requieren atención"
          icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
          color={kpis.viajes_alerta > 0 ? "text-red-600" : "text-slate-600"}
        />
        <KpiCard
          label="Completados hoy"
          value={kpis.viajes_completados_hoy}
          sub="Viajes finalizados"
          icon={<CheckCircle className="w-5 h-5 text-blue-600" />}
          color="text-blue-600"
        />
        <KpiCard
          label="Cumplimiento"
          value={`${kpis.cumplimiento_reportes}%`}
          sub="Reportes a tiempo"
          icon={<TrendingUp className="w-5 h-5 text-violet-600" />}
          color="text-violet-600"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <KpiCard
          label="Eventos hoy"
          value={kpis.eventos_hoy}
          icon={<Activity className="w-5 h-5 text-slate-600" />}
          color="text-slate-700"
        />
        <KpiCard
          label="Incidencias"
          value={kpis.total_incidencias}
          sub="Total acumulado"
          icon={<AlertTriangle className="w-5 h-5 text-orange-600" />}
          color="text-orange-600"
        />
        <KpiCard
          label="Detenciones"
          value={kpis.total_detenciones}
          sub="Total acumulado"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          color="text-amber-600"
        />
        <KpiCard
          label="Total viajes"
          value={kpis.total_viajes}
          sub="En base de datos"
          icon={<Truck className="w-5 h-5 text-slate-600" />}
          color="text-slate-700"
        />
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-900 mb-4">Eventos por tipo</h2>
          <DonutChart labels={chartLabels} values={chartValues} />
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-900 mb-4">Distribución operativa</h2>
          <BarChart labels={chartLabels} values={chartValues} />
        </div>
      </div>

      {/* Incidencias recientes */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Incidencias recientes</h2>
        </div>
        {incidencias_recientes.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-400 text-sm">
            Sin incidencias registradas
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {incidencias_recientes.map((inc, i) => (
              <div key={i} className="px-5 py-3 flex items-start gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">
                      {inc.viaje_id}
                    </span>
                    <span className="text-xs text-slate-500">{inc.unidad}</span>
                  </div>
                  <p className="text-sm text-slate-700 mt-0.5 leading-snug">
                    {inc.descripcion}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(inc.timestamp).toLocaleString(undefined, {
                      day: "2-digit", month: "short",
                      hour: "2-digit", minute: "2-digit", hour12: false,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
