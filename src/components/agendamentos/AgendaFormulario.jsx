import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, Save, Search, X, Loader2 } from 'lucide-react'

// ── Serviços disponíveis ──────────────────────────────────
const SERVICOS = [
  { label: 'Banho',          emoji: '🛁' },
  { label: 'Tosa',           emoji: '✂️' },
  { label: 'Banho + Tosa',   emoji: '🛁✂️' },
  { label: 'Consulta',       emoji: '🩺' },
  { label: 'Vacinação',      emoji: '💉' },
  { label: 'Limpeza Dental', emoji: '🦷' },
  { label: 'Outro',          emoji: '🐾' },
]

const ESPECIE_EMOJI = {
  'Cachorro': '🐕', 'Gato': '🐱', 'Pássaro': '🐦',
  'Coelho': '🐰', 'Peixe': '🐠',
}

// ── Componentes de campo ──────────────────────────────────
function Campo({ label, required, erro, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {erro && <p className="text-xs text-red-500 mt-1">{erro}</p>}
    </div>
  )
}

function Input({ erro, className = '', ...props }) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2.5 bg-white border rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow
        ${erro ? 'border-red-300 focus:ring-red-400' : 'border-slate-200 focus:ring-emerald-500'} ${className}`}
    />
  )
}

// ── Busca de pet — por nome do pet ou por nome do tutor ───
function BuscaPet({ petSelecionado, onSelecionar, erro }) {
  const [modo, setModo]           = useState('pet')   // 'pet' | 'tutor'
  const [busca, setBusca]         = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando]   = useState(false)
  const [aberto, setAberto]       = useState(false)
  // Quando modo=tutor: tutor selecionado aguardando escolha do pet
  const [tutorSelecionado, setTutorSelecionado] = useState(null)
  const [petsTutor, setPetsTutor] = useState([])
  const debounceRef               = useRef()
  const wrapperRef                = useRef()

  useEffect(() => {
    function handler(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const pesquisar = useCallback((termo, modoBusca) => {
    clearTimeout(debounceRef.current)
    if (!termo.trim()) { setResultados([]); setAberto(false); return }
    debounceRef.current = setTimeout(async () => {
      setBuscando(true)
      try {
        if (modoBusca === 'pet') {
          const res = await window.api.pets.buscarPorNome(termo)
          setResultados(res.slice(0, 8))
        } else {
          const res = await window.api.donos.buscarPorNome(termo)
          setResultados(res.slice(0, 8))
        }
        setAberto(true)
      } catch { setResultados([]) }
      finally { setBuscando(false) }
    }, 300)
  }, [])

  function handleChange(e) {
    setBusca(e.target.value)
    setTutorSelecionado(null)
    setPetsTutor([])
    pesquisar(e.target.value, modo)
  }

  function trocarModo(novoModo) {
    setModo(novoModo)
    setBusca('')
    setResultados([])
    setAberto(false)
    setTutorSelecionado(null)
    setPetsTutor([])
  }

  async function selecionarTutor(tutor) {
    setTutorSelecionado(tutor)
    setBusca(tutor.nome)
    setAberto(false)
    // Busca os pets deste tutor
    const dados = await window.api.donos.buscarComPets(tutor.id)
    setPetsTutor(dados?.pets ?? [])
  }

  function selecionarPet(pet) {
    onSelecionar(pet)
    setBusca('')
    setAberto(false)
    setResultados([])
    setTutorSelecionado(null)
    setPetsTutor([])
  }

  function remover() {
    onSelecionar(null)
    setBusca('')
    setTutorSelecionado(null)
    setPetsTutor([])
  }

  // Pet já selecionado — mostra chip
  if (petSelecionado) {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-xl border ${erro ? 'border-red-300 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}>
        <span className="text-xl">{ESPECIE_EMOJI[petSelecionado.especie] || '🐾'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{petSelecionado.nome}</p>
          <p className="text-xs text-slate-500 truncate">
            {petSelecionado.raca || petSelecionado.especie} · Tutor: {petSelecionado.nome_dono}
          </p>
        </div>
        <button onClick={remover} className="w-6 h-6 bg-slate-200 hover:bg-slate-300 rounded-full flex items-center justify-center text-slate-500 transition-colors flex-shrink-0">
          <X size={11} />
        </button>
      </div>
    )
  }

  return (
    <div ref={wrapperRef} className="space-y-2">

      {/* Toggle Pet / Tutor */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => trocarModo('pet')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            modo === 'pet' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          🐾 Por Pet
        </button>
        <button
          onClick={() => trocarModo('tutor')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            modo === 'tutor' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          👤 Por Tutor
        </button>
      </div>

      {/* Campo de busca */}
      <div className="relative">
        <div className="relative">
          {buscando
            ? <Loader2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
            : <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          }
          <input
            value={busca}
            onChange={handleChange}
            onFocus={() => busca && !tutorSelecionado && setAberto(true)}
            placeholder={modo === 'pet' ? 'Digite o nome do pet...' : 'Digite o nome do tutor...'}
            className={`w-full pl-9 pr-4 py-2.5 bg-white border rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent
              ${erro ? 'border-red-300 focus:ring-red-400' : 'border-slate-200 focus:ring-emerald-500'}`}
          />
        </div>

        {/* Dropdown resultados de pet */}
        {modo === 'pet' && aberto && resultados.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden max-h-56 overflow-y-auto">
            {resultados.map(pet => (
              <button key={pet.id} onClick={() => selecionarPet(pet)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0">
                <span className="text-xl">{ESPECIE_EMOJI[pet.especie] || '🐾'}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{pet.nome}</p>
                  <p className="text-xs text-slate-400">
                    {[pet.raca, pet.especie].filter(Boolean).join(' · ')}
                    {pet.nome_dono && ` · ${pet.nome_dono}`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Dropdown resultados de tutor */}
        {modo === 'tutor' && aberto && !tutorSelecionado && resultados.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden max-h-56 overflow-y-auto">
            {resultados.map(tutor => (
              <button key={tutor.id} onClick={() => selecionarTutor(tutor)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-base flex-shrink-0">👤</div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{tutor.nome}</p>
                  {tutor.telefone && <p className="text-xs text-slate-400">{tutor.telefone}</p>}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Sem resultados */}
        {aberto && resultados.length === 0 && busca.length > 1 && !buscando && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 p-4 text-center">
            <p className="text-sm text-slate-400">
              Nenhum {modo === 'pet' ? 'pet' : 'tutor'} encontrado para "{busca}"
            </p>
          </div>
        )}
      </div>

      {/* Pets do tutor selecionado */}
      {modo === 'tutor' && tutorSelecionado && (
        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-600">
              Pets de <span className="text-slate-800">{tutorSelecionado.nome}</span>
            </p>
            <button onClick={() => { setTutorSelecionado(null); setBusca(''); setPetsTutor([]) }}
              className="text-slate-300 hover:text-slate-500 transition-colors">
              <X size={13} />
            </button>
          </div>
          {petsTutor.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Este tutor não tem pets cadastrados.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {petsTutor.map(pet => (
                <button key={pet.id} onClick={() => selecionarPet({ ...pet, nome_dono: tutorSelecionado.nome })}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-left">
                  <span className="text-xl">{ESPECIE_EMOJI[pet.especie] || '🐾'}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{pet.nome}</p>
                    <p className="text-xs text-slate-400">{[pet.raca, pet.especie].filter(Boolean).join(' · ') || '—'}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Formulário principal ──────────────────────────────────
function AgendaFormulario({ agendamento, dataInicial, onSalvar, onCancelar }) {
  const editando = !!agendamento?.id
  const [salvando, setSalvando] = useState(false)
  const [erros, setErros]       = useState({})

  // ── Estados de vínculo com plano ─────────────────────────
  const [assinaturasPlano, setAssinaturasPlano]   = useState([])
  const [vinculandoPlano, setVinculandoPlano]     = useState(false)
  const [assinIdSel, setAssinIdSel]               = useState(null)
  const [servicoPlano, setServicoPlanoo]           = useState('')

  const [petSelecionado, setPetSelecionado] = useState(
    agendamento ? {
      id:        agendamento.id_pet,
      nome:      agendamento.nome_pet,
      especie:   agendamento.especie,
      raca:      agendamento.raca,
      nome_dono: agendamento.nome_dono,
    } : null
  )

  const [dados, setDados] = useState({
    servico:     agendamento?.servico     || '',
    data:        agendamento?.data        || dataInicial,
    hora:        agendamento?.hora        || '08:00',
    valor:       agendamento?.valor       != null ? String(agendamento.valor) : '',
    status:      agendamento?.status      || 'agendado',
    observacoes: agendamento?.observacoes || '',
  })

  function setD(campo, val) {
    setDados(d => ({ ...d, [campo]: val }))
    if (erros[campo]) setErros(e => ({ ...e, [campo]: null }))
  }

  // Carrega assinaturas ativas quando pet é selecionado (só em criação)
  useEffect(() => {
    setAssinaturasPlano([])
    setVinculandoPlano(false)
    setAssinIdSel(null)
    setServicoPlanoo('')
    if (petSelecionado?.id && !editando) {
      window.api.planos.assinaturasAtivasPorPet(petSelecionado.id)
        .then(lista => setAssinaturasPlano(lista || []))
        .catch(() => {})
    }
  }, [petSelecionado?.id])

  // Ao ativar vínculo com plano, pré-seleciona a primeira assinatura e primeiro serviço
  useEffect(() => {
    if (vinculandoPlano && assinaturasPlano.length > 0) {
      const assin = assinaturasPlano[0]
      setAssinIdSel(assin.id)
      const primeiro = (assin.resumo_ciclo?.resumo || []).find(r => r.quantidade_restante > 0)
      if (primeiro) { setServicoPlanoo(primeiro.servico); setD('servico', primeiro.servico) }
    } else if (!vinculandoPlano) {
      setAssinIdSel(null)
      setServicoPlanoo('')
    }
  }, [vinculandoPlano])

  // Ao trocar de assinatura, atualiza o serviço disponível
  useEffect(() => {
    if (!assinIdSel) return
    const assin = assinaturasPlano.find(a => a.id === assinIdSel)
    const primeiro = (assin?.resumo_ciclo?.resumo || []).find(r => r.quantidade_restante > 0)
    if (primeiro) { setServicoPlanoo(primeiro.servico); setD('servico', primeiro.servico) }
    else { setServicoPlanoo('') }
  }, [assinIdSel])

  // Dados derivados do plano selecionado
  const assinaturaAtual = assinaturasPlano.find(a => a.id === assinIdSel)
  const servicosDoPlano = (assinaturaAtual?.resumo_ciclo?.resumo || []).filter(r => r.quantidade_restante > 0)

  function validar() {
    const e = {}
    if (!petSelecionado) e.pet = 'Selecione um pet'
    if (!dados.servico)  e.servico = vinculandoPlano ? 'Selecione o serviço do plano' : 'Selecione o serviço'
    if (!dados.data)     e.data = 'Informe a data'
    if (!dados.hora)     e.hora = 'Informe o horário'
    if (vinculandoPlano && !assinaturaAtual) e.plano = 'Selecione a assinatura'
    setErros(e)
    return Object.keys(e).length === 0
  }

  async function handleSalvar() {
    if (!validar()) return
    setSalvando(true)
    try {
      if (vinculandoPlano && assinaturaAtual && servicoPlano) {
        // Agendamento vinculado ao plano: cria agendamento + uso juntos
        await window.api.planos.agendarSessoes(assinaturaAtual.id, [{
          id_ciclo:    assinaturaAtual.resumo_ciclo.ciclo.id,
          id_pet:      petSelecionado.id,
          servico:     servicoPlano,
          data:        dados.data,
          hora:        dados.hora,
          nome_plano:  assinaturaAtual.nome_plano,
          nome_dono:   assinaturaAtual.nome_dono,
          observacoes: dados.observacoes || null,
        }])
      } else {
        const payload = {
          id_pet:      petSelecionado.id,
          servico:     dados.servico,
          data:        dados.data,
          hora:        dados.hora,
          status:      dados.status,
          valor:       dados.valor ? parseFloat(dados.valor) : null,
          observacoes: dados.observacoes || null,
        }
        if (editando) {
          await window.api.agendamentos.editar(agendamento.id, payload)
        } else {
          await window.api.agendamentos.criar(payload)
        }
      }
      onSalvar()
    } catch (err) {
      console.error('[AgendaFormulario]', err)
      alert('Erro ao salvar. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-6">

      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCancelar}
          className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {editando ? 'Editar Agendamento' : 'Novo Agendamento'}
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {editando ? 'Atualize os dados do agendamento' : 'Preencha os dados do atendimento'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5 space-y-4">

        {/* Busca de pet */}
        <Campo label="Pet" required erro={erros.pet}>
          <BuscaPet
            petSelecionado={petSelecionado}
            onSelecionar={setPetSelecionado}
            erro={erros.pet}
          />
          {erros.pet && <p className="text-xs text-red-500 mt-1">{erros.pet}</p>}
        </Campo>

        {/* Vínculo com plano — aparece só em criação se o cliente tiver plano ativo */}
        {assinaturasPlano.length > 0 && !editando && (
          <div className={`p-3 rounded-xl border transition-colors ${vinculandoPlano ? 'border-purple-300 bg-purple-50' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-purple-700">📋 Cliente tem plano ativo</span>
              <div className="flex gap-1">
                <button type="button"
                  onClick={() => setVinculandoPlano(false)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium border transition-colors ${!vinculandoPlano ? 'bg-slate-600 text-white border-slate-600' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'}`}
                >Avulso</button>
                <button type="button"
                  onClick={() => setVinculandoPlano(true)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium border transition-colors ${vinculandoPlano ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-600 border-purple-300 hover:border-purple-400'}`}
                >Usar plano</button>
              </div>
            </div>

            {vinculandoPlano && (
              <div className="space-y-2 mt-2">
                {assinaturasPlano.length > 1 && (
                  <select value={assinIdSel || ''} onChange={e => setAssinIdSel(parseInt(e.target.value))}
                    className="w-full border border-purple-300 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-purple-500">
                    {assinaturasPlano.map(a => (
                      <option key={a.id} value={a.id}>{a.nome_plano}{a.nome_pet ? ` — ${a.nome_pet}` : ''}</option>
                    ))}
                  </select>
                )}
                {servicosDoPlano.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {servicosDoPlano.map(r => (
                      <button key={r.servico} type="button"
                        onClick={() => { setServicoPlanoo(r.servico); setD('servico', r.servico) }}
                        className={`px-2.5 py-1 text-xs rounded-lg font-medium border transition-colors ${servicoPlano === r.servico ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-600 border-purple-300 hover:bg-purple-50'}`}
                      >
                        {r.servico} <span className="opacity-70">({r.quantidade_restante} rest.)</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-red-500">Nenhum serviço disponível neste ciclo.</p>
                )}
                {erros.plano && <p className="text-xs text-red-500">{erros.plano}</p>}
              </div>
            )}
          </div>
        )}

        {/* Seletor de serviço — oculto quando usando plano */}
        {!vinculandoPlano && (
          <Campo label="Serviço" required erro={erros.servico}>
            <div className="flex flex-wrap gap-2">
              {SERVICOS.map(s => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setD('servico', s.label)}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border
                    transition-all duration-150
                    ${dados.servico === s.label
                      ? 'bg-emerald-600 text-white border-emerald-600 scale-105 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'}
                  `}
                >
                  <span>{s.emoji}</span>
                  {s.label}
                </button>
              ))}
            </div>
            {erros.servico && <p className="text-xs text-red-500 mt-1">{erros.servico}</p>}
          </Campo>
        )}

        {/* Data e hora */}
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Data" required erro={erros.data}>
            <Input
              type="date"
              value={dados.data}
              onChange={e => setD('data', e.target.value)}
              erro={erros.data}
            />
          </Campo>
          <Campo label="Horário" required erro={erros.hora}>
            <Input
              type="time"
              value={dados.hora}
              onChange={e => setD('hora', e.target.value)}
              erro={erros.hora}
            />
          </Campo>
        </div>

        {/* Valor e status — valor oculto quando usando plano */}
        <div className={`grid gap-3 ${vinculandoPlano ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {!vinculandoPlano && (
            <Campo label="Valor estimado (R$)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={dados.valor}
                  onChange={e => setD('valor', e.target.value)}
                  placeholder="0,00"
                  className="pl-9"
                />
              </div>
            </Campo>
          )}
          <Campo label="Status">
            <select
              value={dados.status}
              onChange={e => setD('status', e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="agendado">Agendado</option>
              <option value="confirmado">Confirmado</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </Campo>
        </div>

        {/* Observações */}
        <Campo label="Observações">
          <textarea
            value={dados.observacoes}
            onChange={e => setD('observacoes', e.target.value)}
            rows={3}
            placeholder="Informações adicionais sobre o atendimento..."
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
          />
        </Campo>
      </div>

      {/* Ações */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={onCancelar}
          disabled={salvando}
          className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleSalvar}
          disabled={salvando}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-60 shadow-sm"
        >
          {salvando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar agendamento'}
        </button>
      </div>
    </div>
  )
}

export default AgendaFormulario
