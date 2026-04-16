import { useState, useMemo } from 'react'
import { Plus, Search, User, PawPrint, Phone, ChevronRight } from 'lucide-react'

const ESPECIE_EMOJI = {
  'Cachorro': '🐕', 'Gato': '🐱', 'Pássaro': '🐦',
  'Coelho': '🐰', 'Peixe': '🐠', 'Outro': '🐾',
}

function TutorCard({ tutor, onClick }) {
  const iniciais = tutor.nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('')

  return (
    <button
      onClick={onClick}
      className="group bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-left w-full hover:shadow-md hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 text-emerald-700 font-bold text-base">
          {iniciais || <User size={18} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-slate-800 truncate">{tutor.nome}</p>
            <ChevronRight size={14} className="text-slate-200 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
          </div>

          {tutor.telefone && (
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Phone size={10} />
              {tutor.telefone}
            </p>
          )}

          <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-50">
            <div className="flex items-center gap-1 flex-wrap">
              {tutor.pets && tutor.pets.length > 0 ? (
                tutor.pets.slice(0, 4).map(p => (
                  <span key={p.id} title={p.nome} className="text-base leading-none">
                    {ESPECIE_EMOJI[p.especie] || '🐾'}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-300 italic">sem pets</span>
              )}
              {tutor.pets && tutor.pets.length > 4 && (
                <span className="text-xs text-slate-400">+{tutor.pets.length - 4}</span>
              )}
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tutor.total_pets > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}>
              {tutor.total_pets || 0} pet{tutor.total_pets !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

function TutorLista({ tutores, loading, onNovoCliente, onVerTutor }) {
  const [busca, setBusca] = useState('')

  const filtrados = useMemo(() => {
    if (!busca.trim()) return tutores
    const termo = busca.toLowerCase()
    return tutores.filter(t =>
      t.nome?.toLowerCase().includes(termo) ||
      t.telefone?.toLowerCase().includes(termo) ||
      t.email?.toLowerCase().includes(termo)
    )
  }, [tutores, busca])

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tutores e Pets</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {tutores.length === 0
              ? 'Nenhum cliente cadastrado'
              : `${tutores.length} cliente${tutores.length !== 1 ? 's' : ''} cadastrado${tutores.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={onNovoCliente}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <Plus size={16} />
          Novo cliente
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome, telefone ou e-mail..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
        />
        {busca && (
          <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">✕</button>
        )}
      </div>

      {busca && (
        <p className="text-xs text-slate-400">{filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''}</p>
      )}

      {/* Lista */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 h-28 animate-pulse" />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
              <PawPrint size={28} className="text-emerald-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-700 mb-1">
              {busca ? 'Nenhum resultado' : 'Nenhum cliente cadastrado'}
            </h3>
            <p className="text-sm text-slate-400 max-w-xs">
              {busca
                ? `Nenhum cliente encontrado para "${busca}"`
                : 'Comece cadastrando o primeiro cliente e seu pet.'}
            </p>
            {!busca && (
              <button
                onClick={onNovoCliente}
                className="mt-5 flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
              >
                <Plus size={15} />
                Cadastrar primeiro cliente
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map(tutor => (
            <TutorCard key={tutor.id} tutor={tutor} onClick={() => onVerTutor(tutor)} />
          ))}
        </div>
      )}
    </div>
  )
}

export default TutorLista
