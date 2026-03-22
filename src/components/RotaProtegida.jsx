import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useConfig } from '../contexts/ConfigContext'

function RotaProtegida({ modKey, children }) {
  const { config } = useConfig()
  const navigate   = useNavigate()

  if (modKey && config[modKey] === '0') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <Lock size={26} className="text-slate-400" />
        </div>
        <h2 className="text-base font-bold text-slate-700 mb-1">Módulo desativado</h2>
        <p className="text-sm text-slate-400 mb-5">
          Este módulo está desativado nas configurações do sistema.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
        >
          Voltar ao início
        </button>
      </div>
    )
  }

  return children
}

export default RotaProtegida
