"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Truck,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  RefreshCw,
  ChevronRight,
  Activity,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Viaje {
  viaje_id: string;
  unidad: string;
  placa: string;
  operador: string;
  telefono: string | null;
  origen: string;
  destino: string;
  cliente: string;
  tipo_carga: string;
  estatus: string;
  fecha_inicio: string;
  total_eventos: number;
  ultimo_evento: { tipo: string; descripcion: string; timestamp: string } | null;
}

const ESTATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; dot: string }> = {
  en_ruta: {
    label: "En ruta",
    color: "badge-en_ruta",
    icon: <Activity className="w-3.5 h-3.5" />,
    dot: "bg-emerald-500 animate-pulse",
  },
  con_incidencia: {
    label: "Incidencia",
    color: "badge-con_incidencia",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    dot: "bg-red-500 animate-pulse",
  },
  detenido: {
    label: "Detenido",
    color: "badge-detenido",
    icon: <Clock className="w-3.5 h-3.5" />,
    dot: "bg-amber-500 animate-pulse",
  },
  en_destino: {
    label: "En destino",
    color: "badge-en_destino",
    icon: <MapPin className="w-3.5 h-3.5" />,
    dot: "bg-blue-500",
  },
  completado: {
    label: "Completado",
    color: "badge-completado",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    dot: "bg-slate-400",
  },
};

function StatusBadge({ estatus }: { estatus: string }) {
  const cfg = ESTATUS_CONFIG[estatus] ?? ESTATUS_CONFIG.en_ruta;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

export default function FlotaPage() {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchViajes = useCallback(async () => {
    try {
      const res = await fetch("/api/viajes");
      const data = await res.json();
      setViajes(data);
      setLastUpdate(new Date());
    } catch {
      // silencioso en demo
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchViajes();
    const interval = setInterval(fetchViajes, 8000);

    // SSE con reconexión automática
    let es: EventSource;
    const connectSSE = () => {
      es = new EventSource("/api/stream");
      es.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === "nuevo_evento") fetchViajes();
      };
      es.onerror = () => { es.close(); setTimeout(connectSSE, 3000); };
    };
    connectSSE();

    return () => {
      clearInterval(interval);
      es?.close();
    };
  }, [fetchViajes]);

  const activos = viajes.filter((v) => v.estatus === "en_ruta").length;
  const alertas = viajes.filter((v) =>
    ["con_incidencia", "detenido"].includes(v.estatus)
  ).length;
  const completados = viajes.filter((v) => v.estatus === "completado").length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Flota en vivo</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Actualizado{" "}
            {formatDistanceToNow(lastUpdate, { addSuffix: true, locale: es })}
          </p>
        </div>
        <button
          onClick={fetchViajes}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Actualizar</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Activos</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{activos}</p>
          <p className="text-xs text-slate-400 mt-1">En ruta</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Alertas</span>
            {alertas > 0 && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
          </div>
          <p className={`text-3xl font-bold ${alertas > 0 ? "text-red-600" : "text-slate-900"}`}>
            {alertas}
          </p>
          <p className="text-xs text-slate-400 mt-1">Incidencias</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Hoy</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{completados}</p>
          <p className="text-xs text-slate-400 mt-1">Completados</p>
        </div>
      </div>

      {/* Viajes List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {viajes.map((viaje) => {
            const cfg = ESTATUS_CONFIG[viaje.estatus] ?? ESTATUS_CONFIG.en_ruta;
            return (
              <Link
                key={viaje.viaje_id}
                href={`/bitacora/${viaje.viaje_id}`}
                className="block bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    {/* Izquierda */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="relative mt-0.5 shrink-0">
                        <div className="w-10 h-10 bg-orion-800 rounded-xl flex items-center justify-center">
                          <Truck className="w-5 h-5 text-white" />
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${cfg.dot}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900">{viaje.unidad}</span>
                          <span className="text-xs text-slate-400">{viaje.placa}</span>
                          <StatusBadge estatus={viaje.estatus} />
                        </div>
                        <p className="text-sm text-slate-600 truncate mt-0.5">{viaje.operador}</p>
                        {viaje.telefono && (
                          <p className="text-xs text-slate-400 mt-0.5">{viaje.telefono}</p>
                        )}
                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{viaje.origen}</span>
                          <span>→</span>
                          <span className="truncate">{viaje.destino}</span>
                        </div>
                      </div>
                    </div>

                    {/* Derecha */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-400">{viaje.total_eventos} eventos</p>
                        {viaje.ultimo_evento && (
                          <p className="text-xs text-slate-500">
                            {formatDistanceToNow(
                              new Date(viaje.ultimo_evento.timestamp),
                              { addSuffix: true, locale: es }
                            )}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>

                  {/* Último evento */}
                  {viaje.ultimo_evento && (
                    <div className="mt-3 pt-3 border-t border-slate-50">
                      <p className="text-xs text-slate-500 truncate">
                        <span className="font-medium text-slate-700">Último:</span>{" "}
                        {viaje.ultimo_evento.descripcion}
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
