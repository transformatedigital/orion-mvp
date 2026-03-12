"use client";

import { useRef, useState } from "react";
import { Bot, Send, Loader2, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
  tools?: string[];
}

const QUICK_ACTIONS = [
  "¿Cuál es el estatus de toda la flota?",
  "¿Hay alguna incidencia activa?",
  "¿Cómo va el viaje de Sergio Pérez?",
  "¿Qué detenciones hubo hoy?",
  "Dame el detalle del viaje ORI-002",
  "¿Qué operadores están en ruta?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () =>
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

  const sendMessage = async (texto: string) => {
    if (!texto.trim() || loading) return;

    const userMsg: Message = { role: "user", content: texto };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    scrollToBottom();

    // Build historial for API (only text messages, no tool metadata)
    const historial = newMessages.slice(0, -1).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Add assistant placeholder
    const assistantIdx = newMessages.length;
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", tools: [] },
    ]);

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pregunta: texto, historial }),
      });

      if (!resp.ok) throw new Error("Error en el servidor");

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          try {
            const event = JSON.parse(raw);

            if (event.type === "text") {
              setMessages((prev) => {
                const updated = [...prev];
                updated[assistantIdx] = {
                  ...updated[assistantIdx],
                  content: updated[assistantIdx].content + event.content,
                };
                return updated;
              });
              scrollToBottom();
            } else if (event.type === "tool") {
              setMessages((prev) => {
                const updated = [...prev];
                updated[assistantIdx] = {
                  ...updated[assistantIdx],
                  tools: [...(updated[assistantIdx].tools ?? []), event.label],
                };
                return updated;
              });
            } else if (event.type === "error") {
              setMessages((prev) => {
                const updated = [...prev];
                updated[assistantIdx] = {
                  ...updated[assistantIdx],
                  content: `⚠️ Error: ${event.message}`,
                };
                return updated;
              });
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[assistantIdx] = {
          ...updated[assistantIdx],
          content: "⚠️ No se pudo conectar con el agente. Verifica que el backend esté corriendo.",
        };
        return updated;
      });
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 py-4 border-b border-slate-100">
        <div className="w-10 h-10 bg-orion-800 rounded-xl flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-slate-900">Agente Operativo Orión</h1>
          <p className="text-xs text-slate-400">Pregunta sobre la flota en tiempo real</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          En línea
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400 mb-1">¿En qué te puedo ayudar?</p>
            <p className="text-xs text-slate-300">Pregunta sobre el estatus de la flota, incidencias, operadores o viajes específicos.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 bg-orion-800 rounded-lg flex items-center justify-center shrink-0 mr-2 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
            )}

            <div className={`max-w-[85%] ${msg.role === "user" ? "order-1" : ""}`}>
              {/* Tool labels */}
              {msg.role === "assistant" && msg.tools && msg.tools.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {msg.tools.map((label, j) => (
                    <span
                      key={j}
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium"
                    >
                      <Zap className="w-2.5 h-2.5" />
                      {label}
                    </span>
                  ))}
                </div>
              )}

              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-orion-800 text-white rounded-tr-sm"
                    : "bg-white border border-slate-100 shadow-sm text-slate-800 rounded-tl-sm"
                }`}
              >
                {msg.role === "assistant" && !msg.content && loading && i === messages.length - 1 ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                ) : msg.role === "user" ? (
                  msg.content
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h2: ({ children }) => <h2 className="text-sm font-bold text-slate-900 mt-3 mb-2 first:mt-0 flex items-center gap-1">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-semibold text-slate-700 mt-2.5 mb-1.5 first:mt-0">{children}</h3>,
                      p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
                      em: ({ children }) => <em className="italic text-slate-500">{children}</em>,
                      ul: ({ children }) => <ul className="space-y-1.5 mb-2 ml-0">{children}</ul>,
                      ol: ({ children }) => <ol className="space-y-1.5 mb-2 ml-0 list-none counter-reset-[item]">{children}</ol>,
                      li: ({ children }) => (
                        <li className="flex items-start gap-2 text-slate-700">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                          <span>{children}</span>
                        </li>
                      ),
                      table: ({ children }) => (
                        <div className="my-2 space-y-1.5">{children}</div>
                      ),
                      thead: () => null,
                      tbody: ({ children }) => <div className="space-y-1.5">{children}</div>,
                      tr: ({ children }) => (
                        <div className="bg-slate-50 rounded-lg px-3 py-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                          {children}
                        </div>
                      ),
                      th: () => null,
                      td: ({ children }) => <span className="text-slate-700">{children}</span>,
                      code: ({ children }) => <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                      blockquote: ({ children }) => (
                        <div className="border-l-2 border-orion-800 pl-3 bg-slate-50 rounded-r-lg py-1 my-2 text-slate-600 italic text-xs">
                          {children}
                        </div>
                      ),
                      hr: () => <hr className="border-slate-100 my-3" />,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick Actions */}
      {messages.length === 0 && (
        <div className="pb-3">
          <p className="text-xs text-slate-400 mb-2 font-medium">PREGUNTAS RÁPIDAS</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                onClick={() => sendMessage(action)}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-40"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="pb-4 pt-2 border-t border-slate-100">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Pregunta sobre la operación..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-orion-800 focus:ring-2 focus:ring-orion-800/10 transition disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-10 h-10 bg-orion-800 text-white rounded-xl flex items-center justify-center hover:bg-orion-900 transition disabled:opacity-40 shrink-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
