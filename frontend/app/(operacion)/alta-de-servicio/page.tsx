"use client";
import { useEffect, useState } from "react";

export default function Page() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/solicitudes/revision")
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8"><p>Cargando...</p></div>;
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">📝 Solicitudes</h1>
      <p className="text-gray-600 mb-4">Total: {data?.length || 0} solicitudes</p>
      
      {data && data.length > 0 ? (
        <div className="space-y-4">
          {data.map((s: any) => (
            <div key={s.id} className="bg-white p-4 border rounded-lg">
              <h2 className="font-bold text-lg">{s.folio}</h2>
              <p className="text-gray-600">{s.cliente_empresa}</p>
              <p className="text-sm mt-2">📍 {s.origen} → {s.destino}</p>
              <p className="text-sm">💼 {s.tipo_mercancia}</p>
              <p className="text-sm">💰 ${s.tarifa_acordada}</p>
              <p className="text-xs text-yellow-600 mt-2 font-semibold">⏳ {s.estatus}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-100 p-4 rounded-lg text-gray-600">
          No hay solicitudes
        </div>
      )}
    </div>
  );
}
