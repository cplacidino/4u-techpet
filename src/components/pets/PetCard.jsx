import { ChevronRight } from 'lucide-react'

// Identidade visual por espécie
const ESPECIE_CONFIG = {
  'Cachorro': { cor: 'bg-amber-50 text-amber-500',   emoji: '🐕' },
  'Gato':     { cor: 'bg-purple-50 text-purple-500', emoji: '🐱' },
  'Pássaro':  { cor: 'bg-sky-50 text-sky-500',       emoji: '🐦' },
  'Coelho':   { cor: 'bg-pink-50 text-pink-500',     emoji: '🐰' },
  'Peixe':    { cor: 'bg-blue-50 text-blue-500',     emoji: '🐠' },
  'default':  { cor: 'bg-slate-50 text-slate-400',   emoji: '🐾' },
}

function calcularIdade(dataNascimento) {
  if (!dataNascimento) return null
  const nasc = new Date(dataNascimento + 'T00:00:00')
  const hoje = new Date()
  const totalMeses = (hoje.getFullYear() - nasc.getFullYear()) * 12 + (hoje.getMonth() - nasc.getMonth())
  if (totalMeses < 1)  return 'Recém-nascido'
  if (totalMeses < 12) return `${totalMeses} ${totalMeses === 1 ? 'mês' : 'meses'}`
  const anos = Math.floor(totalMeses / 12)
  return `${anos} ${anos === 1 ? 'ano' : 'anos'}`
}

function PetCard({ pet, onClick }) {
  const config = ESPECIE_CONFIG[pet.especie] || ESPECIE_CONFIG.default
  const idade  = calcularIdade(pet.data_nascimento)

  return (
    <button
      onClick={onClick}
      className="
        group bg-white rounded-2xl border border-slate-100 shadow-soft p-4
        text-left w-full
        hover:shadow-md hover:border-slate-200 hover:-translate-y-0.5
        transition-all duration-200
      "
    >
      {/* Avatar + seta */}
      <div className="flex items-start justify-between mb-3">
        {pet.foto ? (
          <img
            src={pet.foto}
            alt={pet.nome}
            className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
          />
        ) : (
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${config.cor}`}>
            {config.emoji}
          </div>
        )}
        <ChevronRight
          size={14}
          className="text-slate-200 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all mt-0.5 flex-shrink-0"
        />
      </div>

      {/* Nome e raça */}
      <p className="font-semibold text-slate-800 truncate leading-tight">{pet.nome}</p>
      <p className="text-xs text-slate-400 truncate mt-0.5">
        {[pet.raca, pet.especie].filter(Boolean).join(' · ') || '—'}
      </p>

      <div className="my-2.5 border-t border-slate-50" />

      {/* Tutor e idade */}
      <p className="text-xs text-slate-500 truncate">
        <span className="text-slate-300">Tutor </span>
        {pet.nome_dono || '—'}
      </p>
      {idade && (
        <p className="text-[11px] text-slate-400 mt-0.5">{idade}</p>
      )}
    </button>
  )
}

export default PetCard
