'use client';

import { useState, useEffect, useRef } from 'react';

export default function SolicitudPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [tempUnit, setTempUnit] = useState('C');
  const [tempValue, setTempValue] = useState('-18');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successFolio, setSuccessFolio] = useState('');

  const formRef = useRef<HTMLFormElement>(null);

  // URL del backend (ajusta según ambiente)
  const BACKEND_URL =
    typeof window !== 'undefined'
      ? window.location.hostname === 'localhost'
        ? 'http://localhost:8000'
        : 'https://orion-mvp-api.example.com' // Ajustar a URL de producción
      : 'http://localhost:8000';

  const STATES = [
    'Aguascalientes',
    'Baja California',
    'Baja California Sur',
    'Campeche',
    'Chiapas',
    'Chihuahua',
    'Coahuila',
    'Colima',
    'CDMX',
    'Durango',
    'Guanajuato',
    'Guerrero',
    'Hidalgo',
    'Jalisco',
    'Estado de México',
    'Michoacán',
    'Morelos',
    'Nayarit',
    'Nuevo León',
    'Oaxaca',
    'Puebla',
    'Querétaro',
    'Quintana Roo',
    'San Luis Potosí',
    'Sinaloa',
    'Sonora',
    'Tabasco',
    'Tamaulipas',
    'Tlaxcala',
    'Veracruz',
    'Yucatán',
    'Zacatecas',
  ];

  const goStep = (step: number) => {
    setCurrentStep(step);
    setError('');
  };

  const changeTempUnit = (unit: 'C' | 'F') => {
    setTempUnit(unit);
    if (unit === 'C') {
      setTempValue('-18');
    } else {
      setTempValue('0');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const form = e.target as HTMLFormElement;
      const folio = `SOL-${Date.now()}`;
      const hoy = new Date().toISOString().split('T')[0];
      const tempUnitStr = tempUnit === 'C' ? '°C' : '°F';

      const payload = {
        folio: folio,
        fecha_solicitud: hoy,
        cliente_empresa: (form.querySelector('#cliente') as HTMLInputElement)?.value || '',
        solicitante: (form.querySelector('#solicitante') as HTMLInputElement)?.value || '',
        telefono_contacto: (form.querySelector('#telefono') as HTMLInputElement)?.value || '',
        origen: (form.querySelector('#origen') as HTMLInputElement)?.value || '',
        destino: (form.querySelector('#destino') as HTMLInputElement)?.value || '',
        cd_origen: (form.querySelector('#cd_origen') as HTMLInputElement)?.value || '',
        cd_destino: (form.querySelector('#cd_destino') as HTMLInputElement)?.value || '',
        tipo_mercancia: (form.querySelector('#mercancia') as HTMLInputElement)?.value || '',
        claves_sat: (form.querySelector('#claves_sat') as HTMLInputElement)?.value || null,
        folios_carga: (form.querySelector('#folios_carga') as HTMLInputElement)?.value || null,
        peso_aproximado: (form.querySelector('#peso') as HTMLInputElement)?.value || '',
        temperatura_requerida: tempValue + tempUnitStr,
        requiere_refrigeracion: tempValue !== '20' ? 'SI' : 'NO',
        fecha_carga: (form.querySelector('#fecha') as HTMLInputElement)?.value || '',
        hora_carga: (form.querySelector('#hora') as HTMLInputElement)?.value || '',
        fecha_descarga: (form.querySelector('#fecha_descarga') as HTMLInputElement)?.value || null,
        hora_descarga: (form.querySelector('#hora_descarga') as HTMLInputElement)?.value || null,
        cita_descarga: (form.querySelector('#cita_descarga') as HTMLInputElement)?.value || null,
        tipo_unidad: (form.querySelector('#unidad') as HTMLSelectElement)?.value || '',
        direccion_entrega: (form.querySelector('#direccion_entrega') as HTMLTextAreaElement)?.value || '',
        contacto_destino: (form.querySelector('#contacto_destino') as HTMLInputElement)?.value || null,
        telefono_destino: (form.querySelector('#telefono_destino') as HTMLInputElement)?.value || null,
        observaciones: (form.querySelector('#observaciones') as HTMLTextAreaElement)?.value || null,
        dias_operacion: 1,
        km_cargados: 0,
        monto_casetas: 0,
        condiciones_pago: 'A convenir',
        tarifa_acordada: 0,
      };

      console.log('📤 Enviando al backend...');
      const apiRes = await fetch(`${BACKEND_URL}/api/solicitudes/recepcion-n8n`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!apiRes.ok) {
        const errorData = await apiRes.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error: ${apiRes.status}`);
      }

      const result = await apiRes.json();
      console.log('✅ Solicitud guardada en BD:', result);
      setSuccessFolio(folio);
      setSuccessMessage('¡Solicitud Enviada!');
    } catch (err) {
      console.error('❌ Error:', err);
      setError(`❌ ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = currentStep === 1 ? 10 : currentStep === 2 ? 40 : currentStep === 3 ? 75 : 100;

  if (successMessage) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-5">
        <div className="bg-slate-900/50 backdrop-blur-lg rounded-4xl max-w-md w-full border border-white/10 overflow-hidden">
          <div className="text-center p-10">
            <div className="text-5xl mb-5">✅</div>
            <h2 className="text-2xl font-black mb-2">¡Solicitud Enviada!</h2>
            <p className="text-sm mb-5">
              Folio: <strong className="text-emerald-500">{successFolio}</strong>
            </p>
            <p className="text-sm opacity-80 mb-6">Orion Cryo ha recibido tu solicitud. Será revisada en breve.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-white/10 text-white px-8 py-2 rounded-lg hover:bg-white/20 transition"
            >
              Nueva Carga
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-5">
      <div className="bg-slate-900/50 backdrop-blur-lg rounded-4xl max-w-md w-full border border-white/10 overflow-hidden">
        <header className="p-8 text-center border-b border-white/5">
          <h1 className="text-2xl font-black uppercase text-white">
            Orion <span className="text-blue-500">Cryo</span>
          </h1>
          <p className="text-xs tracking-wider uppercase mt-1 opacity-90 text-gray-300">Solicitud de Servicio</p>
        </header>

        <div className="relative h-1 bg-white/10">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
          <div
            className="absolute -top-3 text-2xl transition-all duration-500"
            style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
          >
            🚚
          </div>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-4 rounded-lg mb-5">
              {error}
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit}>
            {/* STEP 1: Cliente */}
            {currentStep === 1 && (
              <div className="animate-slideIn">
                <div className="mb-4">
                  <label className="text-xs uppercase font-bold text-blue-500 block mb-2">Empresa Cliente</label>
                  <input
                    type="text"
                    id="cliente"
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-blue-500 focus:bg-blue-500/10 outline-none transition"
                  />
                </div>
                <div className="mb-4">
                  <label className="text-xs uppercase font-bold text-blue-500 block mb-2">Nombre Solicitante</label>
                  <input
                    type="text"
                    id="solicitante"
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-blue-500 focus:bg-blue-500/10 outline-none transition"
                  />
                </div>
                <div className="mb-6">
                  <label className="text-xs uppercase font-bold text-blue-500 block mb-2">WhatsApp de Contacto</label>
                  <input
                    type="tel"
                    id="telefono"
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-blue-500 focus:bg-blue-500/10 outline-none transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => goStep(2)}
                  className="w-full bg-blue-500 text-white py-3 rounded-2xl font-bold hover:bg-blue-600 transition"
                >
                  Siguiente: Ruta →
                </button>
              </div>
            )}

            {/* STEP 2: Ruta */}
            {currentStep === 2 && (
              <div className="animate-slideIn">
                <p className="text-xs font-bold text-blue-500 mb-4 uppercase">📍 Ruta Nacional</p>

                <div className="border-2 border-blue-500/50 rounded-2xl p-4 bg-blue-500/5 mb-4">
                  <p className="text-xs font-bold text-blue-500 mb-3 uppercase">🔵 Origen</p>
                  <div className="mb-3">
                    <label className="text-xs uppercase font-bold text-blue-500 block mb-2">Estado Origen</label>
                    <input
                      type="text"
                      id="origen"
                      list="states-list"
                      className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-blue-500 focus:bg-blue-500/10 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase font-bold text-blue-500 block mb-2">Ciudad Origen</label>
                    <input
                      type="text"
                      id="cd_origen"
                      className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-blue-500 focus:bg-blue-500/10 outline-none transition"
                    />
                  </div>
                </div>

                <div className="border-2 border-blue-500/50 rounded-2xl p-4 bg-blue-500/5 mb-6">
                  <p className="text-xs font-bold text-blue-500 mb-3 uppercase">🔵 Destino</p>
                  <div className="mb-3">
                    <label className="text-xs uppercase font-bold text-blue-500 block mb-2">Estado Destino</label>
                    <input
                      type="text"
                      id="destino"
                      list="states-list"
                      className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-blue-500 focus:bg-blue-500/10 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase font-bold text-blue-500 block mb-2">Ciudad Destino</label>
                    <input
                      type="text"
                      id="cd_destino"
                      className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-blue-500 focus:bg-blue-500/10 outline-none transition"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => goStep(1)}
                    className="flex-0 px-4 bg-white/10 text-white py-3 rounded-2xl font-bold hover:bg-white/20 transition"
                  >
                    ← Atrás
                  </button>
                  <button
                    type="button"
                    onClick={() => goStep(3)}
                    className="flex-1 bg-blue-500 text-white py-3 rounded-2xl font-bold hover:bg-blue-600 transition"
                  >
                    Siguiente: Carga →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Mercancía */}
            {currentStep === 3 && (
              <div className="animate-slideIn">
                <div className="mb-4">
                  <label className="text-xs uppercase font-bold text-blue-500 block mb-2">Mercancía</label>
                  <input
                    type="text"
                    id="mercancia"
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-blue-500 focus:bg-blue-500/10 outline-none transition"
                  />
                </div>
                <div className="mb-4">
                  <label className="text-xs uppercase font-bold text-blue-500 block mb-2">Claves SAT (opcional)</label>
                  <input
                    type="text"
                    id="claves_sat"
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-blue-500 focus:bg-blue-500/10 outline-none transition"
                  />
                </div>
                <div className="mb-4">
                  <label className="text-xs uppercase font-bold text-blue-500 block mb-2">Folios de Carga (opcional)</label>
                  <input
                    type="text"
                    id="folios_carga"
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-blue-500 focus:bg-blue-500/10 outline-none transition"
                  />
                </div>
                <div className="mb-4">
                  <label className="text-xs uppercase font-bold text-blue-500 block mb-2">Peso (Toneladas)</label>
                  <input
                    type="number"
                    id="peso"
                    step="0.1"
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-blue-500 focus:bg-blue-500/10 outline-none transition"
                  />
                </div>
                <div className="mb-6">
                  <label className="text-xs uppercase font-bold text-blue-500 block mb-2">Temperatura Requerida</label>
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => changeTempUnit('C')}
                      className={`flex-1 py-2 rounded-xl font-bold transition ${
                        tempUnit === 'C' ? 'bg-blue-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      °C
                    </button>
                    <button
                      type="button"
                      onClick={() => changeTempUnit('F')}
                      className={`flex-1 py-2 rounded-xl font-bold transition ${
                        tempUnit === 'F' ? 'bg-blue-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      °F
                    </button>
                  </div>
                  <input
                    type="range"
                    id="temp"
                    min={tempUnit === 'C' ? '-20' : '-5'}
                    max={tempUnit === 'C' ? '20' : '60'}
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-center mt-3 text-sm text-blue-500 font-bold">
                    {tempValue}
                    {tempUnit === 'C' ? '°C' : '°F'}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => goStep(2)}
                    className="flex-0 px-4 bg-white/10 text-white py-3 rounded-2xl font-bold hover:bg-white/20 transition"
                  >
                    ← Atrás
                  </button>
                  <button
                    type="button"
                    onClick={() => goStep(4)}
                    className="flex-1 bg-blue-500 text-white py-3 rounded-2xl font-bold hover:bg-blue-600 transition"
                  >
                    Siguiente: Detalles →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Detalles Finales */}
            {currentStep === 4 && (
              <div className="animate-slideIn">
                <div className="mb-4">
                  <label className="text-xs uppercase font-bold text-blue-500 block mb-2">Fecha Carga</label>
                  <input
                    type="date"
                    id="fecha"
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-blue-500 focus:bg-blue-500/10 outline-none transition"
                  />
                </div>
                <div className="mb-4">
                  <label className="text-xs uppercase font-bold text-blue-500 block mb-2">Hora Carga</label>
                  <input
                    type="time"
                    id="hora"
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-blue-500 focus:bg-blue-500/10 outline-none transition"
                  />
                </div>
                <div className="mb-4">
                  <label className="text-xs uppercase font-bold text-blue-500 block mb-2">
                    Fecha Descarga Esperada (opcional)
                  </label>
                  <input
                    type="date"
                    id="fecha_descarga"
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-blue-500 focus:bg-blue-500/10 outline-none transition"
                  />
                </div>
                <div className="mb-4">
                  <label className="text-xs uppercase font-bold text-blue-500 block mb-2">
                    Hora Descarga Esperada (opcional)
                  </label>
                  <input
                    type="time"
                    id="hora_descarga"
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-blue-500 focus:bg-blue-500/10 outline-none transition"
                  />
                </div>
                <div className="mb-4">
                  <label className="text-xs uppercase font-bold text-blue-500 block mb-2">
                    ¿Tiene cita de descarga? (opcional)
                  </label>
                  <input
                    type="text"
                    id="cita_descarga"
                    placeholder="Ej: Sí, cita 14:00h"
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-blue-500 focus:bg-blue-500/10 outline-none transition placeholder:text-gray-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="text-xs uppercase font-bold text-blue-500 block mb-2">Tipo de Unidad</label>
                  <select
                    id="unidad"
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-blue-500 focus:bg-blue-500/10 outline-none transition"
                  >
                    <option>Refrigerado</option>
                    <option>Seco</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="text-xs uppercase font-bold text-blue-500 block mb-2">Dirección de Entrega</label>
                  <textarea
                    id="direccion_entrega"
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-blue-500 focus:bg-blue-500/10 outline-none transition min-h-20 resize-none"
                  ></textarea>
                </div>
                <div className="mb-4">
                  <label className="text-xs uppercase font-bold text-blue-500 block mb-2">
                    Contacto en Destino (opcional)
                  </label>
                  <input
                    type="text"
                    id="contacto_destino"
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-blue-500 focus:bg-blue-500/10 outline-none transition"
                  />
                </div>
                <div className="mb-4">
                  <label className="text-xs uppercase font-bold text-blue-500 block mb-2">
                    Teléfono Destino (opcional)
                  </label>
                  <input
                    type="tel"
                    id="telefono_destino"
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-blue-500 focus:bg-blue-500/10 outline-none transition"
                  />
                </div>
                <div className="mb-6">
                  <label className="text-xs uppercase font-bold text-blue-500 block mb-2">
                    Solicitudes Adicionales / Notas
                  </label>
                  <textarea
                    id="observaciones"
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-blue-500 focus:bg-blue-500/10 outline-none transition min-h-20 resize-none"
                  ></textarea>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => goStep(3)}
                    className="flex-0 px-4 bg-white/10 text-white py-3 rounded-2xl font-bold hover:bg-white/20 transition"
                  >
                    ← Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-emerald-500 text-white py-3 rounded-2xl font-bold hover:bg-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'ENVIANDO...' : '✓ Confirmar Solicitud'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      <datalist id="states-list">
        {STATES.map((state) => (
          <option key={state} value={state} />
        ))}
      </datalist>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
