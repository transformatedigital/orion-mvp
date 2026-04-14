"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, ChevronLeft, ChevronRight, RefreshCw, Clock } from "lucide-react";

interface Evento {
  id: number;
  viaje_id: string;
  tipo_evento: string;
  descripcion: string;
  timestamp: string;
  operador?: string;
  unidad?: string;
  lat?: number;
  lng?: number;
}

interface BitacoraDia {
  fecha: string;
  total_eventos: number;
  resumen_tipos: Record<string, number>;
  por_viaje: Record<string, Evento[]>;
  sin_viaje: Evento[];
  eventos: Evento[];
}

const TIPO_LABEL: Record<string, { label: string; color: string }> = {
  salida_origen:       { label: "Salida",          color: "bg-blue-100 text-blue-800" },
  llegada_destino:     { label: "Llegada",          color: "bg-emerald-100 text-emerald-800" },
  salida_destino:      { label: "Sale destino",     color: "bg-teal-100 text-teal-800" },
  fin_viaje:           { label: "Fin viaje",        color: "bg-slate-100 text-slate-700" },
  incidencia:          { label: "Incidencia",       color: "bg-red-100 text-red-800" },
  detencion_prolongada:{ label: "Detención",        color: "bg-amber-100 text-amber-800" },
  desvio_ruta:         { label: "Desvío",           color: "bg-orange-100 text-orange-800" },
  evidencia:           { label: "Evidencia",        color: "bg-purple-100 text-purple-800" },
  cumplimiento_check:  { label: "Check",            color: "bg-green-100 text-green-800" },
  monitoreo_temp:      { label: "Temp. cadena frío",color: "bg-cyan-100 text-cyan-800" },
};

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short"
  });
}

function toInputDate(date: Date) {
  return date.toISOString().split("T")[0];
}

export default function BitacoraDiariaPage() {
  const [fecha, setFecha] = useState(toInputDate(new Date()));
  const [data, setData] = useState<BitacoraDia | null>(null);
  const [loading, setLoading] = useState(true);
  const [viajeFiltro, setViajeFiltro] = useState("todos");

  const load = async (f: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cryo/bitacora/dia/${f}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setData({ eventos: [], por_viaje: {} });
      }
    } catch {
      setData({ eventos: [], por_viaje: {} });
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(fecha); }, [fecha]);

  const cambiarDia = (delta: number) => {
    const d = new Date(fecha);
    d.setDate(d.getDate() + delta);
    setFecha(toInputDate(d));
  };

  const viajesIds = data ? Object.keys(data.por_viaje) : [];

  const eventosFiltrados = data
    ? viajeFiltro === "todos"
      ? data.eventos
      : data.por_viaje[viajeFiltro] || []
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-slate-900">Bitácora Diaria</h2>

        {/* Selector de fecha */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
          <button onClick={() => cambiarDia(-1)} className="text-slate-500 hover:text-slate-900">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="text-sm font-medium text-slate-700 outline-none bg-transparent"
          />
          <button onClick={() => cambiarDia(1)} className="text-slate-500 hover:text-slate-900">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => load(fecha)} className="ml-1 text-slate-400 hover:text-slate-700">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Resumen del día */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 font-semibold uppercase">Total eventos</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{data.total_eventos}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 font-semibold uppercase">Viajes activos</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{viajesIds.length}</p>
          </div>
          {Object.entries(data.resumen_tipos)
            .sort(([,a],[,b]) => b - a)
            .slice(0, 2)
            .map(([tipo, cnt]) => (
              <div key={tipo} className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-xs text-slate-500 font-semibold uppercase">{TIPO_LABEL[tipo]?.label ?? tipo}</p>
                <p className="text-3xl font-bold text-slate-700 mt-1">{cnt}</p>
              </div>
            ))}
        </div>
      )}

      {/* Filtro por viaje */}
      {viajesIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setViajeFiltro("todos")}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition ${
              viajeFiltro === "todos"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
            }`}
          >
            Todos
          </button>
          {viajesIds.map(id => (
            <button
              key={id}
              onClick={() => setViajeFiltro(id)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition ${
                viajeFiltro === id
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
              }`}
            >
              {id}
            </button>
          ))}
        </div>
      )}

      {/* Timeline de eventos */}
      {loading ? (
        <div className="flex justify-center py-16">
          <RefreshCw className="w-7 h-7 text-slate-400 animate-spin" />
        </div>
      ) : eventosFiltrados.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Sin eventos registrados para esta fecha</p>
          <p className="text-sm mt-1">Los operadores aún no han enviado reportes</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="divide-y divide-slate-100">
            {eventosFiltrados.map((ev, idx) => {
              const tipo = TIPO_LABEL[ev.tipo_evento] ?? { label: ev.tipo_evento, color: "bg-slate-100 text-slate-700" };
              return (
                <div key={ev.id ?? idx} className="flex items-start gap-4 p-4 hover:bg-slate-50 transition">
                  <div className="shrink-0 text-right w-16 pt-0.5">
                    <p className="text-xs font-mono text-slate-400">
                      {new Date(ev.timestamp).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="shrink-0 pt-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tipo.color}`}>
                        {tipo.label}
                      </span>
                      {ev.viaje_id && (
                        <Link href={`/bitacora/${ev.viaje_id}`}>
                          <span className="text-xs font-mono text-blue-600 hover:underline">{ev.viaje_id}</span>
                        </Link>
                      )}
                      {ev.unidad && <span className="text-xs text-slate-500">{ev.unidad}</span>}
                    </div>
                    <p className="text-sm text-slate-700">{ev.descripcion}</p>
                    {ev.operador && <p className="text-xs text-slate-400 mt-0.5">— {ev.operador}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Traspaso de turno */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📋 Handoff de turno</h3>
        <p className="text-sm text-blue-700 mb-3">
          {data?.total_eventos ?? 0} eventos registrados · {viajesIds.length} viajes activos · {" "}
          {data?.resumen_tipos?.incidencia ?? 0} incidencias
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {Object.entries(data?.resumen_tipos ?? {}).map(([tipo, cnt]) => (
            <div key={tipo} className="flex justify-between">
              <span className="text-blue-700">{TIPO_LABEL[tipo]?.label ?? tipo}</span>
              <span className="font-bold text-blue-900">{cnt}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
