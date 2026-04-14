"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle, Clock, Truck, Activity, FileText, RefreshCw } from "lucide-react";

interface KPIs {
  total_viajes: number;
  viajes_activos: number;
  viajes_alerta: number;
  viajes_completados_hoy: number;
  total_incidencias: number;
  total_detenciones: number;
  eventos_hoy: number;
  cumplimiento_reportes: number;
}

interface Viaje {
  viaje_id: string;
  unidad: string;
  placa: string;
  operador: string;
  origen: string;
  destino: string;
  estatus: string;
  cliente: string;
  ultimo_evento: { tipo: string; descripcion: string; timestamp: string } | null;
}

interface IncidenciaReciente {
  viajeid: string;
  unidad: string;
  descripcion: string;
  timestamp: string;
}

const SEMAFORO: Record<string, string> = {
  en_ruta: "bg-emerald-100 text-emerald-800 border-emerald-200",
  con_incidencia: "bg-red-100 text-red-800 border-red-200",
  detenido: "bg-amber-100 text-amber-800 border-amber-200",
  en_destino: "bg-blue-100 text-blue-800 border-blue-200",
  completado: "bg-slate-100 text-slate-600 border-slate-200",
};

const DOT: Record<string, string> = {
  en_ruta: "bg-emerald-500 animate-pulse",
  con_incidencia: "bg-red-500 animate-pulse",
  detenido: "bg-amber-500 animate-pulse",
  en_destino: "bg-blue-500",
  completado: "bg-slate-400",
};

function kpiColor(valor: number, meta: number) {
  if (valor >= meta) return "text-emerald-600";
  if (valor >= meta * 0.85) return "text-amber-600";
  return "text-red-600";
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [incidencias, setIncidencias] = useState<IncidenciaReciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const load = useCallback(async () => {
    try {
      const [dashRes, viajesRes] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/viajes"),
      ]);
      const dash = await dashRes.json();
      const viajesData = await viajesRes.json();
      setKpis(dash.kpis);
      setIncidencias(dash.incidencias_recientes || []);
      setViajes(viajesData);
      setLastUpdate(new Date());
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, [load]);

  const activos = viajes.filter(v => v.estatus === "en_ruta");
  const alertas = viajes.filter(v => ["con_incidencia", "detenido"].includes(v.estatus));
  const sinActualizar = viajes.filter(v => v.estatus === "en_ruta" && !v.ultimo_evento);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Tablero Operativo</h2>
          <p className="text-sm text-slate-500">
            Actualizado: {lastUpdate.toLocaleTimeString("es-MX")} ·{" "}
            <button onClick={load} className="text-blue-600 hover:underline">Actualizar</button>
          </p>
        </div>
        <Link href="/servicios" className="text-sm text-blue-600 hover:underline">
          Ver todos los servicios →
        </Link>
      </div>

      {/* KPI Cards — semáforo verde/amarillo/rojo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-semibold uppercase">En ruta</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-3xl font-bold text-emerald-600">{kpis?.viajes_activos ?? 0}</p>
          <p className="text-xs text-slate-400 mt-1">de {kpis?.total_viajes ?? 0} totales</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-semibold uppercase">Alertas</span>
            {(kpis?.viajes_alerta ?? 0) > 0 && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
          </div>
          <p className={`text-3xl font-bold ${(kpis?.viajes_alerta ?? 0) > 0 ? "text-red-600" : "text-slate-900"}`}>
            {kpis?.viajes_alerta ?? 0}
          </p>
          <p className="text-xs text-slate-400 mt-1">Incidencias abiertas</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-semibold uppercase">Completados hoy</span>
            <CheckCircle className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-blue-600">{kpis?.viajes_completados_hoy ?? 0}</p>
          <p className="text-xs text-slate-400 mt-1">Finalizados</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-semibold uppercase">Cumplimiento</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <p className={`text-3xl font-bold ${kpiColor(kpis?.cumplimiento_reportes ?? 0, 90)}`}>
            {kpis?.cumplimiento_reportes ?? 0}%
          </p>
          <p className="text-xs text-slate-400 mt-1">Meta: 90%</p>
        </div>
      </div>

      {/* Alertas activas */}
      {alertas.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-red-900">Alertas activas — requieren atención</h3>
          </div>
          <div className="space-y-2">
            {alertas.map(v => (
              <Link key={v.viaje_id} href={`/bitacora/${v.viaje_id}`}>
                <div className="flex items-center justify-between bg-white border border-red-200 rounded-lg px-4 py-3 hover:shadow-sm transition">
                  <div>
                    <span className="font-mono font-bold text-red-700">{v.viaje_id}</span>
                    <span className="text-slate-600 text-sm ml-2">{v.unidad} · {v.operador}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">{v.origen} → {v.destino}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${SEMAFORO[v.estatus]}`}>
                      {v.estatus.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Sin actualización */}
      {sinActualizar.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <h3 className="font-semibold text-amber-900">{sinActualizar.length} unidad(es) sin reportar</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {sinActualizar.map(v => (
              <Link key={v.viaje_id} href={`/bitacora/${v.viaje_id}`}>
                <span className="text-xs bg-amber-100 border border-amber-300 text-amber-800 px-3 py-1 rounded-full hover:bg-amber-200 transition">
                  {v.viaje_id} · {v.unidad}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Flota activa */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-3">
          Unidades en operación ({activos.length})
        </h3>
        {activos.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No hay unidades en ruta</p>
        ) : (
          <div className="grid gap-3">
            {activos.map(v => (
              <Link key={v.viaje_id} href={`/bitacora/${v.viaje_id}`}>
                <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-blue-200 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
                        <Truck className="w-5 h-5 text-white" />
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${DOT[v.estatus] ?? "bg-slate-400"}`} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{v.unidad} <span className="text-xs text-slate-400">{v.placa}</span></p>
                      <p className="text-sm text-slate-600">{v.operador}</p>
                      <p className="text-xs text-slate-400">{v.origen} → {v.destino}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {v.cliente && <p className="text-xs text-slate-500">{v.cliente}</p>}
                    {v.ultimo_evento ? (
                      <p className="text-xs text-slate-400 max-w-32 truncate">{v.ultimo_evento.descripcion}</p>
                    ) : (
                      <p className="text-xs text-amber-500">Sin reporte</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Pendientes documentales */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-slate-500" />
          <h3 className="font-bold text-slate-900">Documentación pendiente de cierre</h3>
          <Link href="/evidencias" className="ml-auto text-xs text-blue-600 hover:underline">Ver evidencias →</Link>
        </div>
        <p className="text-sm text-slate-500">
          Viajes completados sin checklist 100% requieren cierre en máx. 48h.{" "}
          <Link href="/checklist" className="text-blue-600 hover:underline">Ir a checklist</Link>
        </p>
      </div>
    </div>
  );
}
