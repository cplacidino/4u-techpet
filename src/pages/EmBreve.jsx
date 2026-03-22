import { Construction } from 'lucide-react'

export default function EmBreve({ titulo }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
      <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
        <Construction size={28} className="text-amber-500" />
      </div>
      <h2 className="text-lg font-bold text-slate-800 mb-1">{titulo}</h2>
      <p className="text-sm text-slate-400 max-w-xs">
        Este módulo está em desenvolvimento e será disponibilizado em breve.
      </p>
    </div>
  )
}
