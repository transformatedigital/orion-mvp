"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Truck,
  ArrowLeft,
  MapPin,
  User,
  Package,
  CheckCircle,
  AlertTriangle,
  Clock,
  Navigation,
  Camera,
  LogIn,
  LogOut,
  Flag,
  FileX,
  MessageSquare,
  Satellite,
} from "lucide-react";

interface Viaje {
  viaje_id: string;
  unidad: string;
  placa: string;
  operador: string;
  origen: string;
  destino: string;
  cliente: string;
  tipo_carga: string;
  estatus: string;
  fecha_inicio: string;
  fecha_fin: string | null;
}

interface Evento {
  id: number;
  tipo_evento: string;
  timestamp: string;
  descripcion: string;
  payload: string | null;
  lat: number | null;
  lng: number | null;
  fuente: string;
  operador: string | null;
  unidad: string | null;
}

const EVENTO_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  salida_origen: { icon: <LogOut className="w-4 h-4" />, color: "text-blue-700", bg: "bg-blue-100" },
  llegada_destino: { icon: <LogIn className="w-4 h-4" />, color: "text-emerald-700", bg: "bg-emerald-100" },
  salida_destino: { icon: <LogOut className="w-4 h-4" />, color: "text-teal-700", bg: "bg-teal-100" },
  fin_viaje: { icon: <Flag className="w-4 h-4" />, color: "text-slate-700", bg: "bg-slate-100" },
  incidencia: { icon: <AlertTriangle className="w-4 h-4" />, color: "text-red-700", bg: "bg-red-100" },
  detencion_prolongada: { icon: <Clock className="w-4 h-4" />, color: "text-amber-700", bg: "bg-amber-100" },
  desvio_ruta: { icon: <Navigation className="w-4 h-4" />, color: "text-orange-700", bg: "bg-orange-100" },
  evidencia: { icon: <Camera className="w-4 h-4" />, color: "text-purple-700", bg: "bg-purple-100" },
  cumplimiento_check: { icon: <CheckCircle className="w-4 h-4" />, color: "text-slate-600", bg: "bg-slate-100" },
  retoma_ruta: { icon: <Navigation className="w-4 h-4" />, color: "text-teal-700", bg: "bg-teal-100" },
  falta_reporte: { icon: <FileX className="w-4 h-4" />, color: "text-red-700", bg: "bg-red-100" },
};

const FUENTE_BADGE: Record<string, string> = {
  whatsapp: "bg-green-100 text-green-700",
  gps: "bg-blue-100 text-blue-700",
  sistema: "bg-slate-100 text-slate-600",
  manual: "bg-violet-100 text-violet-700",
};

const ESTATUS_COLOR: Record<string, string> = {
  en_ruta: "bg-emerald-100 text-emerald-800",
  con_incidencia: "bg-red-100 text-red-800",
  detenido: "bg-amber-100 text-amber-800",
  en_destino: "bg-blue-100 text-blue-800",
  completado: "bg-slate-100 text-slate-700",
};

export default function BitacoraPage() {
  const { id } = useParams();
  const [data, setData] = useState<{ viaje: Viaje; eventos: Evento[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () =>
      fetch(`/api/viajes/${id}`)
        .then((r) => r.json())
        .then(setData)
        .finally(() => setLoading(false));

    load();

    const sse = new EventSource("/api/stream");
    sse.onmessage = (e) => {
      const d = JSON.parse(e.data);
      if (d.type === "nuevo_evento" && d.viaje_id === id) load();
    };

    return () => sse.close();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Viaje no encontrado</p>
        <Link href="/" className="text-blue-600 text-sm mt-2 inline-block">
          Volver a flota
        </Link>
      </div>
    );
  }

  const { viaje, eventos } = data;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Flota
      </Link>

      {/* Viaje Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orion-800 rounded-xl flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{viaje.unidad}</h1>
                <span className="text-sm text-slate-400">{viaje.placa}</span>
              </div>
              <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mt-1 ${ESTATUS_COLOR[viaje.estatus] ?? "bg-slate-100 text-slate-700"}`}>
                {viaje.estatus.replace("_", " ").toUpperCase()}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-bold text-slate-500 uppercase">{viaje.viaje_id}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Operador</p>
              <p className="text-sm font-medium text-slate-900">{viaje.operador}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Package className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Carga</p>
              <p className="text-sm font-medium text-slate-900">{viaje.tipo_carga}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 col-span-2">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Ruta</p>
              <p className="text-sm font-medium text-slate-900">
                {viaje.origen} → {viaje.destino}
              </p>
            </div>
          </div>
          {viaje.cliente && (
            <div className="flex items-start gap-2 col-span-2">
              <Package className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Cliente</p>
                <p className="text-sm font-medium text-slate-900">{viaje.cliente}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <h2 className="font-semibold text-slate-900 mb-5 flex items-center gap-2">
          <Flag className="w-4 h-4" />
          Bitácora del viaje
          <span className="ml-auto text-xs font-normal text-slate-400">
            {eventos.length} eventos
          </span>
        </h2>

        {eventos.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Sin eventos registrados</p>
        ) : (
          <div className="relative">
            {/* Línea vertical */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-100" />

            <div className="space-y-1">
              {/* El orden es cronológico: arriba = inicio del viaje, abajo = más reciente */}
              {eventos.map((evento, i) => {
                const cfg = EVENTO_CONFIG[evento.tipo_evento] ?? EVENTO_CONFIG.cumplimiento_check;
                return (
                  <div key={evento.id} className="flex items-start gap-3 pl-1 pb-5 relative">
                    {/* Icono */}
                    <div className={`relative z-10 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.color}`}>
                      {cfg.icon}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                        <span className={`text-xs font-semibold ${cfg.color}`}>
                          {evento.tipo_evento.replace(/_/g, " ").toUpperCase()}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${FUENTE_BADGE[evento.fuente] ?? "bg-slate-100 text-slate-500"}`}>
                          {evento.fuente === "whatsapp" ? (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-2.5 h-2.5" />
                              WA
                            </span>
                          ) : evento.fuente === "gps" ? (
                            <span className="flex items-center gap-1">
                              <Satellite className="w-2.5 h-2.5" />
                              GPS
                            </span>
                          ) : (
                            evento.fuente
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 leading-snug">{evento.descripcion}</p>
                      {evento.lat && evento.lng && (
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {evento.lat.toFixed(4)}, {evento.lng.toFixed(4)}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(evento.timestamp).toLocaleString(undefined, {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false,
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Indicador: evento más reciente al final */}
            <div className="flex items-center gap-2 mt-2 pl-1">
              <div className="w-9 flex justify-center">
                <div className="w-3 h-3 rounded-full bg-blue-400 border-2 border-white ring-2 ring-blue-200" />
              </div>
              <span className="text-xs text-blue-500 font-medium">Más reciente</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
