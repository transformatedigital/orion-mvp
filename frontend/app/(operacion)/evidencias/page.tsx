"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, CheckCircle, XCircle, Clock, RefreshCw, ImageIcon } from "lucide-react";

interface Evidencia {
  id: number;
  viajeid: string;
  tipo_documento: string;
  categoria_gasto?: string;
  monto?: number;
  descripcion?: string;
  fecha?: string;
  imagen_url?: string;
  ocr_confianza?: number;
  ocr_texto_bruto?: string;
  cliente_documento?: string;
  folio_documento?: string;
  aprobado?: boolean;
  rechazado?: boolean;
}

const TIPO_LABEL: Record<string, string> = {
  carta_porte:        "Carta Porte",
  gasto_combustible:  "Combustible",
  evidencia_carga:    "Evidencia Carga",
  evidencia_descarga: "Evidencia Descarga",
  gasto_caseta:       "Caseta",
  gasto_otro:         "Gasto Otro",
  firma_recepcion:    "Firma Recepción",
  sello:              "Sello",
};

const TIPO_COLOR: Record<string, string> = {
  carta_porte:        "bg-purple-100 text-purple-800",
  gasto_combustible:  "bg-orange-100 text-orange-800",
  evidencia_carga:    "bg-blue-100 text-blue-800",
  evidencia_descarga: "bg-emerald-100 text-emerald-800",
  gasto_caseta:       "bg-yellow-100 text-yellow-800",
  firma_recepcion:    "bg-green-100 text-green-800",
};

// Checklist documental según arquitectura (M1 — sección 4.1.5)
const CHECKLIST_DOCS = [
  { key: "carta_porte",        label: "Carta Porte",           desc: "Cumplimiento fiscal / SAT" },
  { key: "evidencia_carga",    label: "Evidencia de Carga",    desc: "Comprobación salida con carga" },
  { key: "evidencia_descarga", label: "Evidencia de Descarga", desc: "Comprobación entrega en destino" },
  { key: "firma_recepcion",    label: "Documentos del viaje",  desc: "Remisión, sellos, firmas" },
];

export default function EvidenciasPage() {
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todas" | "pendientes" | "aprobadas">("pendientes");
  const [viajeFiltro, setViajeFiltro] = useState("todos");

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
    await fetch(`/api/cryo/evidencias/${id}/aprobar`, { method: "POST" });
    load();
  };

  const rechazar = async (id: number) => {
    await fetch(`/api/cryo/evidencias/${id}/rechazar`, { method: "POST" });
    load();
  };

  const filtradas = evidencias.filter(e => {
    if (filtro === "pendientes") return e.aprobado !== true && e.rechazado !== true;
    if (filtro === "aprobadas") return e.aprobado === true;
    return true;
  }).filter(e => viajeFiltro === "todos" || e.viajeid === viajeFiltro);

  const viajesUnicos = Array.from(new Set(evidencias.map(e => e.viajeid)));
  const pendientes = evidencias.filter(e => e.aprobado !== true && e.rechazado !== true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-slate-900">Evidencias y Documentación</h2>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
          <RefreshCw className="w-4 h-4" /> Actualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 font-semibold uppercase">Pendientes</p>
          <p className={`text-3xl font-bold mt-1 ${pendientes.length > 0 ? "text-amber-600" : "text-emerald-600"}`}>
            {pendientes.length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 font-semibold uppercase">Total</p>
          <p className="text-3xl font-bold mt-1 text-slate-900">{evidencias.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 font-semibold uppercase">Viajes</p>
          <p className="text-3xl font-bold mt-1 text-blue-600">{viajesUnicos.length}</p>
        </div>
      </div>

      {/* Checklist documental — M1 sección 4.1.5 */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="font-bold text-slate-900 mb-3">Checklist de cierre documental</h3>
        <p className="text-xs text-slate-500 mb-4">
          Un servicio NO puede marcarse como Cerrado sin checklist 100% completo.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CHECKLIST_DOCS.map(doc => {
            const tieneEvidencia = evidencias.some(e => e.tipo_documento === doc.key);
            return (
              <div key={doc.key} className={`flex items-start gap-3 p-3 rounded-lg border ${
                tieneEvidencia ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"
              }`}>
                {tieneEvidencia
                  ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  : <Clock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />}
                <div>
                  <p className="font-semibold text-sm text-slate-900">{doc.label}</p>
                  <p className="text-xs text-slate-500">{doc.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        {(["pendientes", "todas", "aprobadas"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition ${
              filtro === f
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        {viajesUnicos.length > 0 && (
          <select
            value={viajeFiltro}
            onChange={e => setViajeFiltro(e.target.value)}
            className="text-xs border border-slate-200 rounded-full px-3 py-1.5 bg-white text-slate-600 outline-none"
          >
            <option value="todos">Todos los viajes</option>
            {viajesUnicos.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        )}
      </div>

      {/* Lista de evidencias */}
      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw className="w-7 h-7 text-slate-400 animate-spin" /></div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Sin evidencias {filtro === "pendientes" ? "pendientes" : ""}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtradas.map(ev => (
            <div key={ev.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-4">
              {/* Thumbnail / icono */}
              <div className="shrink-0 w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                {ev.imagen_url
                  ? <img src={ev.imagen_url} alt="evidencia" className="w-full h-full object-cover" />
                  : <ImageIcon className="w-7 h-7 text-slate-400" />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    TIPO_COLOR[ev.tipo_documento] ?? "bg-slate-100 text-slate-700"
                  }`}>
                    {TIPO_LABEL[ev.tipo_documento] ?? ev.tipo_documento}
                  </span>
                  <Link href={`/bitacora/${ev.viajeid}`}>
                    <span className="text-xs font-mono text-blue-600 hover:underline">{ev.viajeid}</span>
                  </Link>
                  {ev.ocr_confianza && (
                    <span className="text-xs text-slate-400">OCR {Math.round(ev.ocr_confianza * 100)}%</span>
                  )}
                </div>
                <p className="text-sm text-slate-700 truncate">{ev.descripcion ?? "Sin descripción"}</p>
                {ev.monto && (
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    ${ev.monto.toLocaleString("es-MX")} MXN
                  </p>
                )}
                {ev.folio_documento && (
                  <p className="text-xs text-slate-400 mt-0.5">Folio: {ev.folio_documento}</p>
                )}
              </div>

              {/* Acciones */}
              <div className="shrink-0 flex flex-col gap-2">
                {ev.aprobado ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                    <CheckCircle className="w-4 h-4" /> Aprobada
                  </span>
                ) : ev.rechazado ? (
                  <span className="flex items-center gap-1 text-xs text-red-600 font-semibold">
                    <XCircle className="w-4 h-4" /> Rechazada
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => aprobar(ev.id)}
                      className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Aprobar
                    </button>
                    <button
                      onClick={() => rechazar(ev.id)}
                      className="flex items-center gap-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg transition"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Rechazar
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
