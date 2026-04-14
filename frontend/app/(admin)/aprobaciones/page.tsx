"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, RefreshCw, AlertTriangle, Clock, DollarSign } from "lucide-react";

// Aprobaciones = evidencias pendientes + escalamientos de mantenimiento
// Basado en M3 (flujo autorización gasto correctivo) + M1 (incidencias escaladas)

interface Evidencia {
  id: number;
  viajeid: string;
  tipo_documento: string;
  descripcion?: string;
  monto?: number;
  imagen_url?: string;
  ocr_confianza?: number;
  aprobado?: boolean;
  rechazado?: boolean;
}

const TIPO_LABEL: Record<string, string> = {
  carta_porte:        "Carta Porte",
  gasto_combustible:  "Combustible",
  evidencia_carga:    "Evidencia Carga",
  evidencia_descarga: "Evidencia Descarga",
  gasto_caseta:       "Caseta",
  gasto_otro:         "Gasto",
  firma_recepcion:    "Firma",
};

// Flujo de autorización según M3 del documento de arquitectura
const NIVELES_AUTORIZACION = [
  {
    nivel: 1,
    label: "Gerente Mantenimiento",
    rango: "Hasta $X",
    color: "border-blue-200 bg-blue-50",
    badge: "bg-blue-100 text-blue-800",
  },
  {
    nivel: 2,
    label: "Dirección Administrativa",
    rango: "$X a $Y",
    color: "border-amber-200 bg-amber-50",
    badge: "bg-amber-100 text-amber-800",
  },
  {
    nivel: 3,
    label: "Dirección General",
    rango: "Más de $Y",
    color: "border-red-200 bg-red-50",
    badge: "bg-red-100 text-red-800",
  },
];

export default function AprobacionesPage() {
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [aprobando, setAprobando] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cryo/evidencias/pendientes");
      const data = await res.json();
      setEvidencias(Array.isArray(data) ? data : []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const aprobar = async (id: number) => {
    setAprobando(id);
    await fetch(`/api/cryo/evidencias/${id}/aprobar`, { method: "POST" });
    await load();
    setAprobando(null);
  };

  const rechazar = async (id: number) => {
    setAprobando(id);
    await fetch(`/api/cryo/evidencias/${id}/rechazar`, { method: "POST" });
    await load();
    setAprobando(null);
  };

  const pendientes = evidencias.filter(e => e.aprobado !== true && e.rechazado !== true);
  const gastos = pendientes.filter(e => e.monto && e.monto > 0);
  const documentos = pendientes.filter(e => !e.monto || e.monto === 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Aprobaciones Pendientes</h2>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
          <RefreshCw className="w-4 h-4" /> Actualizar
        </button>
      </div>

      {/* Semáforo de pendientes */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`border rounded-xl p-4 ${pendientes.length > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}>
          <div className="flex items-center gap-2 mb-1">
            <Clock className={`w-4 h-4 ${pendientes.length > 0 ? "text-amber-600" : "text-slate-400"}`} />
            <p className="text-xs font-semibold uppercase text-slate-500">Pendientes</p>
          </div>
          <p className={`text-3xl font-bold ${pendientes.length > 0 ? "text-amber-700" : "text-emerald-600"}`}>
            {pendientes.length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-slate-400" />
            <p className="text-xs font-semibold uppercase text-slate-500">Gastos</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">{gastos.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-slate-400" />
            <p className="text-xs font-semibold uppercase text-slate-500">Documentos</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">{documentos.length}</p>
        </div>
      </div>

      {/* Flujo de autorización — referencia M3 */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="font-bold text-slate-900 mb-3">Niveles de autorización (mantenimiento correctivo)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {NIVELES_AUTORIZACION.map(n => (
            <div key={n.nivel} className={`border rounded-lg p-3 ${n.color}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${n.badge}`}>Nivel {n.nivel}</span>
              </div>
              <p className="font-semibold text-sm text-slate-900">{n.label}</p>
              <p className="text-xs text-slate-600 mt-0.5">{n.rango}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          * Los umbrales $X y $Y deben definirse en sesión de trabajo con Dirección General antes de activar este flujo.
        </p>
      </div>

      {/* Lista de aprobaciones */}
      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-slate-400 animate-spin" /></div>
      ) : pendientes.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white border border-slate-200 rounded-xl">
          <CheckCircle className="w-14 h-14 mx-auto mb-4 text-emerald-300" />
          <p className="text-lg font-semibold text-emerald-700">Sin aprobaciones pendientes</p>
          <p className="text-sm mt-1">Todo está al día</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendientes.map(ev => (
            <div key={ev.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                      {TIPO_LABEL[ev.tipo_documento] ?? ev.tipo_documento}
                    </span>
                    <Link href={`/bitacora/${ev.viajeid}`}>
                      <span className="text-xs font-mono text-blue-600 hover:underline">{ev.viajeid}</span>
                    </Link>
                  </div>
                  <p className="text-sm text-slate-700">{ev.descripcion ?? "Sin descripción"}</p>
                  {ev.monto && ev.monto > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <DollarSign className="w-4 h-4 text-slate-500" />
                      <span className="font-bold text-slate-900 text-lg">
                        ${ev.monto.toLocaleString("es-MX")} MXN
                      </span>
                      {ev.monto > 5000 && (
                        <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Requiere nivel 2+
                        </span>
                      )}
                    </div>
                  )}
                  {ev.ocr_confianza && (
                    <p className="text-xs text-slate-400 mt-1">
                      OCR confianza: {Math.round(ev.ocr_confianza * 100)}%
                    </p>
                  )}
                </div>

                {/* Acciones */}
                <div className="shrink-0 flex flex-col gap-2">
                  <button
                    onClick={() => aprobar(ev.id)}
                    disabled={aprobando === ev.id}
                    className="flex items-center gap-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {aprobando === ev.id ? "..." : "Aprobar"}
                  </button>
                  <button
                    onClick={() => rechazar(ev.id)}
                    disabled={aprobando === ev.id}
                    className="flex items-center gap-1.5 text-sm bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-700 px-4 py-2 rounded-lg font-medium transition"
                  >
                    <XCircle className="w-4 h-4" />
                    Rechazar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
