// M4 — Comercial: Dashboard (Fase 3)
export default function ComercialPage() {
  return (
    <div className="grid gap-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
        <h2 className="font-semibold text-blue-900 mb-2">🚧 En Desarrollo — Fase 3</h2>
        <p className="text-blue-700 text-sm">
          El módulo de Comercial (CRM, cotizaciones, pipeline) se implementará en Fase 3.
          Por ahora, usa el módulo de Operación para cotizaciones básicas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-100 p-6 rounded-lg border border-slate-300 opacity-50">
          <div className="text-sm text-slate-600">Oportunidades (Próximas)</div>
          <div className="text-3xl font-bold text-slate-400">-</div>
        </div>
        <div className="bg-slate-100 p-6 rounded-lg border border-slate-300 opacity-50">
          <div className="text-sm text-slate-600">Cotizaciones (Próximas)</div>
          <div className="text-3xl font-bold text-slate-400">-</div>
        </div>
        <div className="bg-slate-100 p-6 rounded-lg border border-slate-300 opacity-50">
          <div className="text-sm text-slate-600">Conversión (Próximas)</div>
          <div className="text-3xl font-bold text-slate-400">-</div>
        </div>
      </div>
    </div>
  );
}
