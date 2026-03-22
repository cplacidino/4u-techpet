import { useEffect, useState } from 'react'

export default function SplashScreen({ onFim }) {
  const [saindo, setSaindo] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setSaindo(true), 1800)
    const t2 = setTimeout(() => onFim(), 2200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onFim])

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900 transition-opacity duration-400 ${saindo ? 'opacity-0' : 'opacity-100'}`}>
      {/* Logo / ícone */}
      <div className="flex flex-col items-center gap-5 animate-[fadeInUp_0.6s_ease_forwards]">
        <div className="w-24 h-24 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/30">
          <span className="text-5xl">🐾</span>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">4u TechPet</h1>
          <p className="text-emerald-400 text-sm mt-1 font-medium">by 4u Technology</p>
        </div>
      </div>

      {/* Barra de progresso animada */}
      <div className="absolute bottom-16 w-48">
        <div className="h-0.5 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full animate-[progress_1.6s_ease_forwards]" />
        </div>
        <p className="text-center text-slate-500 text-xs mt-3">Carregando...</p>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  )
}
