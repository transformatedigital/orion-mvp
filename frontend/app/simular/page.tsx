"use client";

import { useEffect, useState, useRef } from "react";
import { Send, Truck, Bot, MessageSquare, Zap, RotateCcw } from "lucide-react";

interface Viaje {
  viaje_id: string;
  unidad: string;
  operador: string;
  estatus: string;
}

interface ChatMsg {
  from: "operador" | "bot";
  text: string;
  tipo?: string;
  ts: Date;
}

const MENSAJES_RAPIDOS = [
  { label: "✅ Salida", msg: "Ya saliendo de origen, todo en orden" },
  { label: "📍 Check", msg: "Circulando en autopista sin novedad" },
  { label: "🚨 Incidencia", msg: "Incidencia: llanta ponchada, detenido en acotamiento" },
  { label: "⏸️ Detenido", msg: "Detenido en caseta por revisión de documentos" },
  { label: "🏁 Llegué", msg: "Ya llegué a destino, esperando para descargar" },
  { label: "📦 Descargado", msg: "Ya descargué, listo para salir" },
  { label: "📸 Evidencia", msg: "Te mando foto de la entrega con sello" },
  { label: "🏠 En base", msg: "De regreso, ya en base" },
];

const ESTATUS_COLOR: Record<string, string> = {
  en_ruta: "text-emerald-600",
  con_incidencia: "text-red-600",
  detenido: "text-amber-600",
  en_destino: "text-blue-600",
  completado: "text-slate-500",
};

export default function SimularPage() {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [viajeId, setViajeId] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState<ChatMsg[]>([
    {
      from: "bot",
      text: "👋 Hola, soy el agente operativo de Orión. Aquí se registran automáticamente todos los eventos del viaje.",
      ts: new Date(),
    },
    {
      from: "bot",
      text: "📋 Cómo funciona:\n1. Selecciona el viaje/unidad arriba\n2. Escribe el mensaje del operador (o usa los botones rápidos)\n3. El sistema detecta el tipo de evento y lo registra en bitácora\n4. El dashboard se actualiza en tiempo real",
      ts: new Date(),
    },
    {
      from: "bot",
      text: "💡 Tip: Los operadores pueden escribir mensajes normales como siempre lo hacen en WhatsApp. El sistema los entiende automáticamente.",
      ts: new Date(),
    },
  ]);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/viajes")
      .then((r) => r.json())
      .then((data) => {
        setViajes(data);
        if (data.length > 0) setViajeId(data[0].viaje_id);
      });
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [chat]);

  const viaje = viajes.find((v) => v.viaje_id === viajeId);

  async function resetDemo() {
    if (!confirm("¿Borrar todos los eventos y reiniciar el demo?")) return;
    await fetch("/api/reset-demo", { method: "POST" });
    setChat([
      { from: "bot", text: "🔄 Demo reiniciado. Todos los eventos borrados. ¡Listo para empezar!", ts: new Date() },
    ]);
    fetch("/api/viajes").then((r) => r.json()).then(setViajes);
  }

  async function enviar(msg: string) {
    if (!msg.trim() || !viajeId) return;
    setLoading(true);

    const msgOperador: ChatMsg = { from: "operador", text: msg, ts: new Date() };
    setChat((prev) => [...prev, msgOperador]);
    setMensaje("");

    try {
      const res = await fetch("/api/simular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje: msg, viaje_id: viajeId }),
      });
      const data = await res.json();

      const botMsg: ChatMsg = {
        from: "bot",
        text: data.respuesta_bot,
        tipo: data.evento_detectado,
        ts: new Date(),
      };
      setChat((prev) => [...prev, botMsg]);

      // Refresh viajes para actualizar estatus
      fetch("/api/viajes")
        .then((r) => r.json())
        .then(setViajes);
    } catch {
      setChat((prev) => [
        ...prev,
        { from: "bot", text: "❌ Error de conexión", ts: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Simulador WhatsApp</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Envía mensajes como operador → el sistema los parsea y actualiza el dashboard en tiempo real
          </p>
        </div>
        <button
          onClick={resetDemo}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-sm font-medium transition-colors shrink-0"
        >
          <RotateCcw className="w-4 h-4" />
          Resetear demo
        </button>
      </div>

      {/* Selector viaje */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Unidad / Viaje
        </label>
        <select
          value={viajeId}
          onChange={(e) => setViajeId(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {viajes.map((v) => (
            <option key={v.viaje_id} value={v.viaje_id}>
              {v.viaje_id} — {v.unidad} ({v.operador})
            </option>
          ))}
        </select>
        {viaje && (
          <p className={`text-xs mt-2 font-medium ${ESTATUS_COLOR[viaje.estatus] ?? "text-slate-500"}`}>
            Estatus actual: {viaje.estatus.replace("_", " ")}
          </p>
        )}
      </div>

      {/* Chat window */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 mb-4 flex flex-col">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50 rounded-t-xl">
          <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Orión — Agente Operativo
            </p>
            <p className="text-xs text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />
              En línea
            </p>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto p-4 space-y-3 min-h-48 max-h-80"
        >
          {chat.length === 0 && (
            <div className="text-center py-8">
              <Bot className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">
                Envía un mensaje para iniciar la simulación
              </p>
            </div>
          )}
          {chat.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.from === "operador" ? "justify-end" : "justify-start"}`}
            >
              {msg.from === "bot" && (
                <div className="w-7 h-7 bg-orion-800 rounded-full flex items-center justify-center mr-2 shrink-0 mt-auto">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm ${
                  msg.from === "operador"
                    ? "bg-green-500 text-white rounded-br-sm"
                    : "bg-slate-100 text-slate-800 rounded-bl-sm"
                }`}
              >
                <p className="leading-snug whitespace-pre-line">{msg.text}</p>
                {msg.tipo && (
                  <p className={`text-xs mt-1.5 font-semibold px-2 py-0.5 rounded-full inline-block ${
                    msg.tipo === "incidencia" ? "bg-red-200 text-red-800" :
                    msg.tipo === "salida_origen" ? "bg-blue-200 text-blue-800" :
                    msg.tipo === "llegada_destino" ? "bg-emerald-200 text-emerald-800" :
                    "bg-white/30 text-white"
                  }`}>
                    ✓ {msg.tipo.replace(/_/g, " ")}
                  </p>
                )}
                <p className={`text-xs mt-1 ${msg.from === "operador" ? "text-green-100" : "text-slate-400"}`}>
                  {msg.ts.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                </p>
              </div>
              {msg.from === "operador" && (
                <div className="w-7 h-7 bg-slate-600 rounded-full flex items-center justify-center ml-2 shrink-0 mt-auto">
                  <Truck className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 bg-orion-800 rounded-full flex items-center justify-center mr-2 shrink-0">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-slate-100 p-3">
          <form
            onSubmit={(e) => { e.preventDefault(); enviar(mensaje); }}
            className="flex items-center gap-2"
          >
            <input
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Escribe mensaje del operador..."
              className="flex-1 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <button
              type="submit"
              disabled={!mensaje.trim() || loading}
              className="w-10 h-10 bg-green-500 hover:bg-green-600 disabled:bg-slate-200 rounded-full flex items-center justify-center transition-colors"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </form>
        </div>
      </div>

      {/* Mensajes rápidos */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" />
          Mensajes rápidos
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MENSAJES_RAPIDOS.map(({ label, msg }) => (
            <button
              key={label}
              onClick={() => enviar(msg)}
              disabled={loading}
              className="text-xs text-left px-3 py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-lg transition-colors disabled:opacity-50"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
