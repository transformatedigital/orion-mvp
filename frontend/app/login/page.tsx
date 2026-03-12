"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    setTimeout(() => {
      if (usuario.toLowerCase() === "orion" && contrasena === "orion") {
        document.cookie = "orion_auth=true; path=/; max-age=86400; SameSite=Lax";
        router.push("/dashboard");
      } else {
        setError("Usuario o contraseña incorrectos");
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen relative flex items-center overflow-hidden">

      {/* Fondo: camión Orion Cryo */}
      <Image
        src="/logobienvenida2.png"
        alt=""
        fill
        priority
        className="object-cover object-center"
      />

      {/* Overlays */}
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

      {/* ── Formulario ── */}
      <div className="relative z-10 w-full max-w-xs mx-6 sm:mx-12 md:mx-20">

        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/logobienvenida.png"
            alt="Orion Cryo"
            width={240}
            height={90}
            priority
            className="object-contain drop-shadow-lg"
          />
        </div>

        <h2 className="text-white font-black text-xl tracking-widest mb-6">
          INICIO DE SESIÓN
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-cyan-400 text-[11px] font-bold tracking-widest block mb-1.5">
              USUARIO
            </label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Tu usuario o email"
              autoComplete="username"
              className="w-full text-white placeholder-white/30 px-4 py-3 rounded-lg border border-white/15 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 outline-none text-sm transition backdrop-blur-sm"
              style={{ background: "rgba(255,255,255,0.06)" }}
            />
          </div>

          <div>
            <label className="text-cyan-400 text-[11px] font-bold tracking-widest block mb-1.5">
              CONTRASEÑA
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="Tu contraseña"
                autoComplete="current-password"
                className="w-full text-white placeholder-white/30 px-4 py-3 pr-11 rounded-lg border border-white/15 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 outline-none text-sm transition backdrop-blur-sm"
                style={{ background: "rgba(255,255,255,0.06)" }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-xs font-medium bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !usuario || !contrasena}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg tracking-[0.2em] text-sm transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                VERIFICANDO...
              </>
            ) : (
              "ACCEDER"
            )}
          </button>
        </form>

        <p className="text-white/30 text-[10px] tracking-widest mt-10">
          PLATAFORMA OPERATIVA v1.0
        </p>
      </div>

      {/* Destello inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
    </div>
  );
}
