import { useState, useMemo } from 'react'
import { Plus, Search, PawPrint } from 'lucide-react'
import PetCard from './PetCard'

const ESPECIES = ['Todos', 'Cachorro', 'Gato', 'Pássaro', 'Coelho', 'Peixe', 'Outro']

function PetLista({ pets, loading, onNovoPet, onVerPet }) {
  const [busca, setBusca] = useState('')
  const [especieFiltro, setEspecieFiltro] = useState('Todos')

  const petsFiltrados = useMemo(() => {
    const termo = busca.toLowerCase()
    return pets.filter(p => {
      const matchBusca = !busca
        || p.nome?.toLowerCase().includes(termo)
        || p.nome_dono?.toLowerCase().includes(termo)
        || p.raca?.toLowerCase().includes(termo)
      const matchEspecie = especieFiltro === 'Todos' || p.especie === especieFiltro
      return matchBusca && matchEspecie
    })
  }, [pets, busca, especieFiltro])

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Pets & Tutores</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {pets.length === 0
              ? 'Nenhum pet cadastrado'
              : `${pets.length} pet${pets.length !== 1 ? 's' : ''} cadastrado${pets.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={onNovoPet}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <Plus size={16} />
          Novo pet
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          type="text"
          placeholder="Buscar por nome do pet, tutor ou raça..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
        />
        {busca && (
          <button
            onClick={() => setBusca('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filtro por espécie */}
      <div className="flex items-center gap-2 flex-wrap">
        {ESPECIES.map(e => (
          <button
            key={e}
            onClick={() => setEspecieFiltro(e)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              especieFiltro === e
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            {e}
          </button>
        ))}
        {(busca || especieFiltro !== 'Todos') && (
          <span className="text-xs text-slate-400 ml-1">
            {petsFiltrados.length} resultado{petsFiltrados.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Grade de pets */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 h-44 animate-pulse" />
          ))}
        </div>
      ) : petsFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-soft">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
              <PawPrint size={28} className="text-emerald-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-700 mb-1">
              {busca ? 'Nenhum resultado' : 'Nenhum pet cadastrado'}
            </h3>
            <p className="text-sm text-slate-400 max-w-xs">
              {busca
                ? `Nenhum pet ou tutor encontrado para "${busca}"`
                : 'Comece cadastrando o primeiro pet clicando no botão acima.'}
            </p>
            {!busca && (
              <button
                onClick={onNovoPet}
                className="mt-5 flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
              >
                <Plus size={15} />
                Cadastrar primeiro pet
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {petsFiltrados.map(pet => (
            <PetCard key={pet.id} pet={pet} onClick={() => onVerPet(pet)} />
          ))}
        </div>
      )}
    </div>
  )
}

export default PetLista
