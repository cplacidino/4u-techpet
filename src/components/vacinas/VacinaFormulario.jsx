import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, Search, X, Save, Loader2 } from 'lucide-react'

// ── Vacinas comuns para sugestão rápida ──────────────────

const VACINAS_COMUNS = [
  'V8 / V10 (polivalente)',
  'Antirrábica',
  'Gripe (Bordetella)',
  'Leishmaniose',
  'Giárdia',
  'Tríplice felina (V3)',
  'Quádrupla felina (V4)',
  'FeLV (Leucemia Felina)',
]

// ── Busca de Pet (autocomplete) ───────────────────────────

function BuscaPet({ petSelecionado, onSelecionar }) {
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState([])
  const [aberto, setAberto] = useState(false)
  const timerRef = useRef(null)

  const buscar = useCallback(async (termo) => {
    if (!termo || termo.length < 2) { setResultados([]); return }
    const lista = await window.api.pets.buscarPorNome(termo)
    setResultados(lista)
    setAberto(true)
  }, [])

  function onChange(e) {
    const v = e.target.value
    setQuery(v)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => buscar(v), 300)
  }

  function selecionar(pet) {
    onSelecionar(pet)
    setQuery('')
    setAberto(false)
    setResultados([])
  }

  function limpar() {
    onSelecionar(null)
    setQuery('')
  }

  const especieEmoji = (e) => ({ Cachorro: '🐕', Gato: '🐱', 'Pássaro': '🐦', Coelho: '🐰' }[e] || '🐾')

  if (petSelecionado) {
    return (
      <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
        <span className="text-2xl">{especieEmoji(petSelecionado.especie)}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-800 text-sm">{petSelecionado.nome}</p>
          <p className="text-xs text-slate-500">{petSelecionado.nome_dono} · {petSelecionado.especie}</p>
        </div>
        <button
          onClick={limpar}
          className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600 transition-colors"
        >
          <X size={15} />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar pet pelo nome..."
          value={query}
          onChange={onChange}
          onFocus={() => query.length >= 2 && setAberto(true)}
          onBlur={() => setTimeout(() => setAberto(false), 150)}
          className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
        />
      </div>
      {aberto && resultados.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {resultados.map(pet => (
            <button
              key={pet.id}
              onMouseDown={() => selecionar(pet)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left transition-colors"
            >
              <span className="text-xl">{especieEmoji(pet.especie)}</span>
              <div>
                <p className="text-sm font-medium text-slate-800">{pet.nome}</p>
                <p className="text-xs text-slate-400">{pet.nome_dono} · {pet.especie}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {aberto && query.length >= 2 && resultados.length === 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg p-4 text-center text-sm text-slate-400">
          Nenhum pet encontrado
        </div>
      )}
    </div>
  )
}

// ── Formulário principal ──────────────────────────────────

export default function VacinaFormulario({ vacina, onSalvar, onCancelar }) {
  const editando = !!vacina
  const hoje = new Date().toISOString().split('T')[0]

  const [pet, setPet] = useState(null)
  const [form, setForm] = useState({
    nome_vacina: '',
    data_aplicacao: hoje,
    data_proximo_reforco: '',
    observacoes: '',
  })
  const [erros, setErros] = useState({})
  const [salvando, setSalvando] = useState(false)

  // Se editando, carrega dados existentes
  useEffect(() => {
    if (!editando) return
    window.api.pets.buscarPorId(vacina.id_pet).then(p => {
      if (p) setPet(p)
    })
    setForm({
      nome_vacina:         vacina.nome_vacina || '',
      data_aplicacao:      vacina.data_aplicacao || hoje,
      data_proximo_reforco: vacina.data_proximo_reforco || '',
      observacoes:         vacina.observacoes || '',
    })
  }, [editando]) // eslint-disable-line

  function set(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
    if (erros[campo]) setErros(e => ({ ...e, [campo]: null }))
  }

  function validar() {
    const e = {}
    if (!editando && !pet)          e.pet          = 'Selecione um pet'
    if (!form.nome_vacina.trim())   e.nome_vacina  = 'Informe o nome da vacina'
    if (!form.data_aplicacao)       e.data_aplicacao = 'Informe a data de aplicação'
    return e
  }

  async function salvar() {
    const e = validar()
    if (Object.keys(e).length) { setErros(e); return }

    setSalvando(true)
    try {
      const dados = {
        id_pet:               editando ? vacina.id_pet : pet.id,
        nome_vacina:          form.nome_vacina.trim(),
        data_aplicacao:       form.data_aplicacao,
        data_proximo_reforco: form.data_proximo_reforco || null,
        observacoes:          form.observacoes.trim() || null,
      }
      if (editando) {
        await window.api.vacinas.editar(vacina.id, dados)
      } else {
        await window.api.vacinas.criar(dados)
      }
      onSalvar()
    } finally {
      setSalvando(false)
    }
  }

  const inputClass = (campo) =>
    `w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors ${
      erros[campo]
        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400'
        : 'border-slate-200 focus:ring-emerald-500/30 focus:border-emerald-400'
    }`

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCancelar}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {editando ? 'Editar vacina' : 'Registrar vacina'}
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {editando ? 'Atualize os dados do registro' : 'Adicione um novo registro de vacinação'}
          </p>
        </div>
      </div>

      {/* Card: Selecionar Pet (somente ao criar) */}
      {!editando && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 bg-emerald-100 rounded-md flex items-center justify-center text-xs text-emerald-700 font-bold">1</span>
            Selecionar pet
          </h3>
          <BuscaPet petSelecionado={pet} onSelecionar={setPet} />
          {erros.pet && <p className="text-xs text-red-500 mt-1.5">{erros.pet}</p>}
        </div>
      )}

      {/* Card: Dados da Vacina */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <span className="w-5 h-5 bg-emerald-100 rounded-md flex items-center justify-center text-xs text-emerald-700 font-bold">
            {editando ? '1' : '2'}
          </span>
          Dados da vacina
        </h3>

        {/* Se editando, mostra o pet como readonly */}
        {editando && pet && (
          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-2xl">
              {{ Cachorro: '🐕', Gato: '🐱' }[pet.especie] || '🐾'}
            </span>
            <div>
              <p className="font-medium text-slate-700 text-sm">{pet.nome}</p>
              <p className="text-xs text-slate-400">{pet.especie}</p>
            </div>
          </div>
        )}

        {/* Nome da vacina */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Nome da vacina *</label>
          <input
            type="text"
            placeholder="Ex: V8, Antirrábica, Tríplice felina..."
            value={form.nome_vacina}
            onChange={e => set('nome_vacina', e.target.value)}
            className={inputClass('nome_vacina')}
          />
          {erros.nome_vacina && <p className="text-xs text-red-500 mt-1">{erros.nome_vacina}</p>}

          {/* Sugestões rápidas */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {VACINAS_COMUNS.map(v => (
              <button
                key={v}
                onClick={() => set('nome_vacina', v)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-lg text-xs transition-colors"
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Datas */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Data de aplicação *</label>
            <input
              type="date"
              value={form.data_aplicacao}
              onChange={e => set('data_aplicacao', e.target.value)}
              className={inputClass('data_aplicacao')}
            />
            {erros.data_aplicacao && <p className="text-xs text-red-500 mt-1">{erros.data_aplicacao}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Próximo reforço
              <span className="text-slate-400 font-normal ml-1">(opcional)</span>
            </label>
            <input
              type="date"
              value={form.data_proximo_reforco}
              onChange={e => set('data_proximo_reforco', e.target.value)}
              className={inputClass('data_proximo_reforco')}
            />
          </div>
        </div>

        {/* Observações */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Observações
            <span className="text-slate-400 font-normal ml-1">(opcional)</span>
          </label>
          <textarea
            value={form.observacoes}
            onChange={e => set('observacoes', e.target.value)}
            rows={3}
            placeholder="Lote, fabricante, veterinário responsável, reações observadas..."
            className={`${inputClass('observacoes')} resize-none`}
          />
        </div>
      </div>

      {/* Botões */}
      <div className="flex gap-3 justify-end pb-4">
        <button
          onClick={onCancelar}
          className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={salvar}
          disabled={salvando}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {salvando
            ? <><Loader2 size={15} className="animate-spin" /> Salvando...</>
            : <><Save size={15} /> {editando ? 'Salvar alterações' : 'Registrar vacina'}</>
          }
        </button>
      </div>
    </div>
  )
}
