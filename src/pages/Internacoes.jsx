import { useState, useEffect, useCallback, useRef } from 'react'
import CampoClinico from '../components/CampoClinico'
import {
  BedDouble, Plus, Search, Pencil, Trash2, X,
  ArrowLeft, Printer, PawPrint, Calendar, Clock,
  Thermometer, CheckCircle2, ClipboardList, AlertCircle
} from 'lucide-react'

// ── Utilitários ───────────────────────────────────────────

function formatarData(data) {
  if (!data) return ''
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

function hoje() { return new Date().toISOString().split('T')[0] }
function horaAtual() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function diasInternado(dataEntrada) {
  if (!dataEntrada) return 0
  const entrada = new Date(dataEntrada)
  const agora   = new Date()
  return Math.floor((agora - entrada) / (1000 * 60 * 60 * 24))
}

// ── BuscaPet ─────────────────────────────────────────────

function BuscaPet({ petSelecionado, onSelect, erro }) {
  const [busca, setBusca] = useState(petSelecionado?.nome || '')
  const [resultados, setResultados] = useState([])
  const [aberto, setAberto] = useState(false)
  const timer = useRef(null)
  const ref   = useRef(null)

  useEffect(() => {
    if (petSelecionado) setBusca(petSelecionado.nome)
    else setBusca('')
  }, [petSelecionado])

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setAberto(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleChange(v) {
    setBusca(v)
    if (petSelecionado) onSelect(null)
    clearTimeout(timer.current)
    if (!v.trim()) { setResultados([]); setAberto(false); return }
    timer.current = setTimeout(async () => {
      const lista = await window.api.pets.buscarPorNome(v)
      setResultados(lista)
      setAberto(lista.length > 0)
    }, 300)
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text" value={busca}
          onChange={e => handleChange(e.target.value)}
          placeholder="Digite o nome do pet para buscar..."
          className={`w-full pl-9 pr-9 py-2.5 border rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:border-transparent bg-white transition-shadow ${
            erro ? 'border-red-300 focus:ring-red-400' : 'border-slate-200 focus:ring-emerald-500'
          }`}
        />
        {petSelecionado && (
          <button onClick={() => { onSelect(null); setBusca('') }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        )}
      </div>
      {aberto && resultados.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-20 mt-1 max-h-48 overflow-y-auto">
          {resultados.map(pet => (
            <button key={pet.id}
              onClick={() => { onSelect(pet); setBusca(pet.nome); setAberto(false) }}
              className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 flex items-center gap-3 transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
              <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <PawPrint size={12} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">{pet.nome}</p>
                <p className="text-xs text-slate-400">{[pet.especie, pet.raca, pet.nome_dono].filter(Boolean).join(' · ')}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {erro && <p className="text-xs text-red-500 mt-1">{erro}</p>}
    </div>
  )
}

// ── Modal Alta ────────────────────────────────────────────

function ModalAlta({ internacao, onConfirmar, onFechar }) {
  const [dados, setDados] = useState({ data_alta: hoje(), hora_alta: horaAtual(), condicao_saida: '' })
  const [salvando, setSalvando] = useState(false)

  async function confirmar() {
    setSalvando(true)
    await window.api.internacoes.darAlta(internacao.id, dados)
    onConfirmar()
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">Dar alta ao paciente</h2>
              <p className="text-xs text-slate-400">{internacao.nome_pet}</p>
            </div>
          </div>
          <button onClick={onFechar} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Data da alta</label>
              <input type="date" value={dados.data_alta}
                onChange={e => setDados(d => ({ ...d, data_alta: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Hora da alta</label>
              <input type="time" value={dados.hora_alta}
                onChange={e => setDados(d => ({ ...d, hora_alta: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Condição de saída</label>
            <select value={dados.condicao_saida}
              onChange={e => setDados(d => ({ ...d, condicao_saida: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
              <option value="">Selecionar...</option>
              {['Recuperado', 'Estável', 'Em tratamento domiciliar', 'Transferido', 'Óbito'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onFechar}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button onClick={confirmar} disabled={salvando}
            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {salvando ? 'Registrando...' : 'Confirmar alta'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal Evolução ────────────────────────────────────────

function ModalEvolucao({ idInternacao, onSalvar, onFechar }) {
  const [dados, setDados] = useState({
    id_internacao: idInternacao,
    data: hoje(), hora: horaAtual(),
    temperatura: '', peso: '', alimentacao: '', medicacao: '', observacoes: ''
  })
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setSalvando(true)
    const payload = {
      ...dados,
      temperatura: dados.temperatura ? parseFloat(dados.temperatura) : null,
      peso: dados.peso ? parseFloat(dados.peso) : null,
    }
    await window.api.internacoes.registrarEvolucao(payload)
    onSalvar()
  }

  const cls = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent'

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <ClipboardList size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">Registrar evolução</h2>
              <p className="text-xs text-slate-400">Acompanhamento diário do paciente</p>
            </div>
          </div>
          <button onClick={onFechar} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Data</label>
              <input type="date" value={dados.data} onChange={e => setDados(d => ({ ...d, data: e.target.value }))} className={cls} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Hora</label>
              <input type="time" value={dados.hora} onChange={e => setDados(d => ({ ...d, hora: e.target.value }))} className={cls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Temperatura (°C)</label>
              <input type="number" step="0.1" value={dados.temperatura}
                onChange={e => setDados(d => ({ ...d, temperatura: e.target.value }))}
                placeholder="38,5" className={cls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Peso (kg)</label>
              <input type="number" step="0.01" value={dados.peso}
                onChange={e => setDados(d => ({ ...d, peso: e.target.value }))}
                placeholder="0,00" className={cls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Alimentação</label>
            <input type="text" value={dados.alimentacao}
              onChange={e => setDados(d => ({ ...d, alimentacao: e.target.value }))}
              placeholder="Ex: Comeu bem, recusou ração, soro IV..." className={cls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Medicação administrada</label>
            <input type="text" value={dados.medicacao}
              onChange={e => setDados(d => ({ ...d, medicacao: e.target.value }))}
              placeholder="Ex: Dipirona 500mg IV, Metronidazol..." className={cls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Observações clínicas</label>
            <CampoClinico value={dados.observacoes}
              onChange={e => setDados(d => ({ ...d, observacoes: e.target.value }))}
              placeholder="Estado geral, comportamento, intercorrências..."
              rows={3} className={cls + ' resize-none'} />
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onFechar}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button onClick={salvar} disabled={salvando}
            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {salvando ? 'Salvando...' : 'Registrar evolução'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal Delete ──────────────────────────────────────────

function ModalDelete({ internacao, onConfirmar, onFechar }) {
  const [deletando, setDeletando] = useState(false)
  async function confirmar() {
    setDeletando(true)
    await window.api.internacoes.deletar(internacao.id)
    onConfirmar()
  }
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} className="text-red-500" />
        </div>
        <h3 className="font-semibold text-slate-800 mb-1">Excluir internação?</h3>
        <p className="text-sm text-slate-400 mb-5">
          Internação de <strong>{internacao.nome_pet}</strong> e todas as evoluções serão removidas.
        </p>
        <div className="flex gap-3">
          <button onClick={onFechar} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition-colors">Cancelar</button>
          <button onClick={confirmar} disabled={deletando} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors">
            {deletando ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Formulário de internação ──────────────────────────────

const INPUT_CLS = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-shadow'

function InternacaoFormulario({ internacao, onSalvar, onCancelar }) {
  const [dados, setDados] = useState({
    id_veterinario: internacao?.id_veterinario || '',
    data_entrada:   internacao?.data_entrada   || hoje(),
    hora_entrada:   internacao?.hora_entrada   || horaAtual(),
    motivo:         internacao?.motivo         || '',
    status:         internacao?.status         || 'internado',
    observacoes:    internacao?.observacoes    || '',
  })
  const [petSelecionado, setPetSelecionado] = useState(null)
  const [vets, setVets] = useState([])
  const [erros, setErros] = useState({})
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    window.api.veterinarios.listarAtivos().then(setVets)
    if (internacao?.id_pet) {
      window.api.pets.buscarPorId(internacao.id_pet).then(pet => { if (pet) setPetSelecionado(pet) })
    }
  }, [internacao])

  function setD(campo, valor) {
    setDados(d => ({ ...d, [campo]: valor }))
    if (erros[campo]) setErros(e => ({ ...e, [campo]: null }))
  }

  function validar() {
    const e = {}
    if (!petSelecionado)       e.pet    = 'Selecione um pet'
    if (!dados.data_entrada)   e.data   = 'Data de entrada é obrigatória'
    if (!dados.motivo.trim())  e.motivo = 'Motivo da internação é obrigatório'
    return e
  }

  async function salvar() {
    const e = validar()
    if (Object.keys(e).length > 0) { setErros(e); return }
    setSalvando(true)
    try {
      const payload = { ...dados, id_pet: petSelecionado.id, id_veterinario: dados.id_veterinario || null }
      if (internacao?.id) {
        await window.api.internacoes.editar(internacao.id, payload)
      } else {
        await window.api.internacoes.criar(payload)
      }
      onSalvar()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onCancelar} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft size={18} className="text-slate-500" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{internacao ? 'Editar internação' : 'Nova internação'}</h2>
          <p className="text-sm text-slate-400">Preencha os dados da internação</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paciente</h3>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Pet <span className="text-red-400">*</span></label>
            <BuscaPet
              petSelecionado={petSelecionado}
              onSelect={pet => { setPetSelecionado(pet); if (erros.pet) setErros(e => ({ ...e, pet: null })) }}
              erro={erros.pet}
            />
          </div>
          {petSelecionado && (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl flex-wrap">
              <PawPrint size={13} className="text-emerald-600 flex-shrink-0" />
              <span className="text-xs text-emerald-700 font-medium">{petSelecionado.nome}</span>
              {(petSelecionado.especie || petSelecionado.raca) && (
                <span className="text-xs text-emerald-600">{[petSelecionado.especie, petSelecionado.raca].filter(Boolean).join(', ')}</span>
              )}
              {petSelecionado.nome_dono && (
                <span className="text-xs text-emerald-600">· Tutor: {petSelecionado.nome_dono}</span>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Veterinário responsável</label>
              <select value={dados.id_veterinario} onChange={e => setD('id_veterinario', e.target.value)} className={INPUT_CLS}>
                <option value="">Sem veterinário</option>
                {vets.map(v => <option key={v.id} value={v.id}>{v.nome}{v.crmv ? ` (${v.crmv})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Data de entrada <span className="text-red-400">*</span></label>
              <input type="date" value={dados.data_entrada} onChange={e => setD('data_entrada', e.target.value)} className={INPUT_CLS} />
              {erros.data && <p className="text-xs text-red-500 mt-1">{erros.data}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Hora de entrada</label>
              <input type="time" value={dados.hora_entrada} onChange={e => setD('hora_entrada', e.target.value)} className={INPUT_CLS} />
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Informações Clínicas</h3>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Motivo da internação <span className="text-red-400">*</span></label>
            <CampoClinico
              value={dados.motivo} onChange={e => setD('motivo', e.target.value)}
              placeholder="Descreva o motivo e diagnóstico inicial..."
              rows={3} className={INPUT_CLS + ' resize-none'}
            />
            {erros.motivo && <p className="text-xs text-red-500 mt-1">{erros.motivo}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Observações adicionais</label>
            <CampoClinico
              value={dados.observacoes} onChange={e => setD('observacoes', e.target.value)}
              placeholder="Cuidados especiais, alergias, informações relevantes..."
              rows={2} className={INPUT_CLS + ' resize-none'}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2 pb-6">
          <button onClick={onCancelar} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors font-medium">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm">
            {salvando ? 'Salvando...' : internacao ? 'Salvar alterações' : 'Abrir internação'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Detalhe da internação ─────────────────────────────────

function InternacaoDetalhe({ internacao, onVoltar, onEditar, onAlta, onRecarregar }) {
  const [evolucoes, setEvolucoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [modalEvolucao, setModalEvolucao] = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    const lista = await window.api.internacoes.buscarEvolucoes(internacao.id)
    setEvolucoes(lista)
    setCarregando(false)
  }, [internacao.id])

  useEffect(() => { carregar() }, [carregar])

  async function deletarEvolucao(id) {
    await window.api.internacoes.deletarEvolucao(id)
    carregar()
  }

  const dias = diasInternado(internacao.data_entrada)

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          #ficha-internacao-print { display: block !important; position: fixed; inset: 0; padding: 24px; background: white; z-index: 9999; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 no-print">
          <div className="flex items-center gap-3">
            <button onClick={onVoltar} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <ArrowLeft size={18} className="text-slate-500" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Ficha de Internação</h2>
              <p className="text-sm text-slate-400">{internacao.nome_pet} · Entrada: {formatarData(internacao.data_entrada)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {internacao.status === 'internado' && (
              <>
                <button onClick={() => setModalEvolucao(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors">
                  <ClipboardList size={14} />
                  Evolução
                </button>
                <button onClick={onAlta}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors">
                  <CheckCircle2 size={14} />
                  Dar alta
                </button>
              </>
            )}
            <button onClick={onEditar}
              className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              <Pencil size={14} />
              Editar
            </button>
            <button onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors">
              <Printer size={14} />
              Imprimir
            </button>
          </div>
        </div>

        <div id="ficha-internacao-print" className="space-y-4">
          {/* Cabeçalho do documento */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">4u</span>
                  </div>
                  <span className="text-sm font-bold text-slate-700">4u TechPet</span>
                </div>
                <p className="text-xs text-slate-400">Ficha de Internação · 4u Technology</p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  internacao.status === 'internado'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {internacao.status === 'internado' ? `Internado · ${dias} dia${dias !== 1 ? 's' : ''}` : 'Alta concedida'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1.5">
                <p><span className="text-xs text-slate-400 font-medium">Paciente:</span> <span className="text-slate-700 font-medium">{internacao.nome_pet}</span></p>
                {internacao.especie && <p><span className="text-xs text-slate-400 font-medium">Espécie/Raça:</span> <span className="text-slate-600">{[internacao.especie, internacao.raca].filter(Boolean).join(' — ')}</span></p>}
                <p><span className="text-xs text-slate-400 font-medium">Tutor:</span> <span className="text-slate-600">{internacao.nome_dono}</span></p>
                {internacao.telefone_dono && <p><span className="text-xs text-slate-400 font-medium">Telefone:</span> <span className="text-slate-600">{internacao.telefone_dono}</span></p>}
              </div>
              <div className="space-y-1.5">
                <p><span className="text-xs text-slate-400 font-medium">Entrada:</span> <span className="text-slate-600">{formatarData(internacao.data_entrada)}{internacao.hora_entrada ? ' às ' + internacao.hora_entrada : ''}</span></p>
                {internacao.data_alta && <p><span className="text-xs text-slate-400 font-medium">Alta:</span> <span className="text-slate-600">{formatarData(internacao.data_alta)}{internacao.hora_alta ? ' às ' + internacao.hora_alta : ''}</span></p>}
                {internacao.condicao_saida && <p><span className="text-xs text-slate-400 font-medium">Condição:</span> <span className="text-slate-600">{internacao.condicao_saida}</span></p>}
                {internacao.nome_vet && <p><span className="text-xs text-slate-400 font-medium">Veterinário:</span> <span className="text-slate-600">{internacao.nome_vet}</span></p>}
              </div>
            </div>
            {internacao.motivo && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400 font-medium mb-1">Motivo da internação:</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{internacao.motivo}</p>
              </div>
            )}
            {internacao.observacoes && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400 font-medium mb-1">Observações:</p>
                <p className="text-sm text-slate-600">{internacao.observacoes}</p>
              </div>
            )}
          </div>

          {/* Evolução diária */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700">Evolução diária</h3>
              <span className="text-xs text-slate-400">{evolucoes.length} registro{evolucoes.length !== 1 ? 's' : ''}</span>
            </div>

            {carregando ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2].map(i => <div key={i} className="h-20 bg-slate-50 rounded-xl" />)}
              </div>
            ) : evolucoes.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList size={28} className="text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Nenhuma evolução registrada ainda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {evolucoes.map(ev => (
                  <div key={ev.id} className="bg-slate-50 rounded-xl p-4 group relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <Calendar size={11} className="text-slate-400" />
                          {formatarData(ev.data)}{ev.hora ? ` às ${ev.hora}` : ''}
                        </span>
                        {ev.temperatura && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Thermometer size={11} className="text-orange-400" />
                            {ev.temperatura}°C
                          </span>
                        )}
                        {ev.peso && (
                          <span className="text-xs text-slate-500">{ev.peso} kg</span>
                        )}
                      </div>
                      <button
                        onClick={() => deletarEvolucao(ev.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all no-print"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className="space-y-1 text-xs text-slate-600">
                      {ev.alimentacao  && <p><span className="font-medium text-slate-500">Alimentação:</span> {ev.alimentacao}</p>}
                      {ev.medicacao    && <p><span className="font-medium text-slate-500">Medicação:</span> {ev.medicacao}</p>}
                      {ev.observacoes  && <p><span className="font-medium text-slate-500">Obs:</span> {ev.observacoes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {modalEvolucao && (
        <ModalEvolucao
          idInternacao={internacao.id}
          onSalvar={() => { setModalEvolucao(false); carregar() }}
          onFechar={() => setModalEvolucao(false)}
        />
      )}
    </>
  )
}

// ── Card de internação ────────────────────────────────────

function InternacaoCard({ internacao, onVer, onEditar, onDeletar }) {
  const dias = diasInternado(internacao.data_entrada)
  const ativa = internacao.status === 'internado'

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-4 hover:shadow-md transition-all group ${
      ativa ? 'border-amber-100' : 'border-slate-100'
    }`}>
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-slate-50">
          {internacao.foto_pet
            ? <img src={internacao.foto_pet} alt={internacao.nome_pet} className="w-full h-full object-cover" />
            : <PawPrint size={18} className="text-slate-400" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-slate-800">{internacao.nome_pet}</h3>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              ativa ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {ativa ? `Internado · ${dias}d` : 'Alta'}
            </span>
          </div>
          {internacao.nome_dono && (
            <p className="text-xs text-slate-400 mt-0.5">Tutor: {internacao.nome_dono}</p>
          )}
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar size={10} />
              Entrada: {formatarData(internacao.data_entrada)}
            </span>
            {internacao.nome_vet && (
              <span className="text-xs text-slate-400">Dr(a). {internacao.nome_vet}</span>
            )}
          </div>
          {internacao.motivo && (
            <p className="text-xs text-slate-500 mt-2 line-clamp-2 bg-slate-50 rounded-xl px-3 py-2">
              {internacao.motivo}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEditar(internacao)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Editar">
              <Pencil size={13} />
            </button>
            <button onClick={() => onDeletar(internacao)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Excluir">
              <Trash2 size={13} />
            </button>
          </div>
          <button onClick={() => onVer(internacao)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors">
            <ClipboardList size={12} />
            Ver ficha
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 flex gap-3">
          <div className="w-11 h-11 bg-slate-100 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-100 rounded w-32" />
            <div className="h-3 bg-slate-50 rounded w-48" />
            <div className="h-8 bg-slate-50 rounded-xl w-full mt-2" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────

export default function Internacoes() {
  const [view, setView]                   = useState('lista')
  const [lista, setLista]                 = useState([])
  const [internacaoAtual, setInternacaoAtual] = useState(null)
  const [filtro, setFiltro]               = useState('todos') // 'todos' | 'internados' | 'alta'
  const [busca, setBusca]                 = useState('')
  const [carregando, setCarregando]       = useState(true)
  const [modalDelete, setModalDelete]     = useState(null)
  const [modalAlta, setModalAlta]         = useState(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const dados = await window.api.internacoes.listar()
      setLista(dados)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  function verFicha(i)     { setInternacaoAtual(i); setView('detalhe') }
  function editar(i)       { setInternacaoAtual(i); setView('formulario') }
  function nova()          { setInternacaoAtual(null); setView('formulario') }

  function handleSalvar()  { setView('lista'); setInternacaoAtual(null); carregar() }
  function handleCancelar(){ setView('lista'); setInternacaoAtual(null) }

  if (view === 'formulario') {
    return <InternacaoFormulario internacao={internacaoAtual} onSalvar={handleSalvar} onCancelar={handleCancelar} />
  }

  if (view === 'detalhe') {
    return (
      <InternacaoDetalhe
        internacao={internacaoAtual}
        onVoltar={handleCancelar}
        onEditar={() => setView('formulario')}
        onAlta={() => setModalAlta(internacaoAtual)}
        onRecarregar={carregar}
      />
    )
  }

  // ── Lista ────────────────────────────────────────────
  const internados = lista.filter(i => i.status === 'internado').length
  const comAlta    = lista.filter(i => i.status === 'alta').length

  const listaFiltrada = lista.filter(i => {
    const matchFiltro =
      filtro === 'todos' ||
      (filtro === 'internados' && i.status === 'internado') ||
      (filtro === 'alta'       && i.status === 'alta')
    const t = busca.toLowerCase()
    const matchBusca = !busca ||
      (i.nome_pet  || '').toLowerCase().includes(t) ||
      (i.nome_dono || '').toLowerCase().includes(t) ||
      (i.motivo    || '').toLowerCase().includes(t)
    return matchFiltro && matchBusca
  })

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Internações</h2>
          <p className="text-sm text-slate-400 mt-0.5">{internados} paciente{internados !== 1 ? 's' : ''} internado{internados !== 1 ? 's' : ''} agora</p>
        </div>
        <button onClick={nova}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-emerald-700 transition-colors">
          <Plus size={16} />
          Nova internação
        </button>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Internados agora',  valor: internados,    cor: 'amber',   icon: AlertCircle },
          { label: 'Total de altas',    valor: comAlta,       cor: 'emerald', icon: CheckCircle2 },
          { label: 'Total registrados', valor: lista.length,  cor: 'slate',   icon: BedDouble },
        ].map(({ label, valor, cor, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className={`w-9 h-9 bg-${cor}-50 rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={16} className={`text-${cor}-${cor === 'slate' ? '400' : '600'}`} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{valor}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filtros + Busca */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por pet, tutor ou motivo..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {[
            { key: 'todos',      label: 'Todos' },
            { key: 'internados', label: 'Internados' },
            { key: 'alta',       label: 'Alta' },
          ].map(f => (
            <button key={f.key} onClick={() => setFiltro(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filtro === f.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {carregando ? <Skeleton /> : listaFiltrada.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
            <BedDouble size={28} className="text-slate-300" />
          </div>
          <h3 className="text-sm font-semibold text-slate-600 mb-1">
            {busca ? 'Nenhuma internação encontrada' : 'Nenhuma internação registrada'}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mb-4">
            {busca ? 'Tente outro termo de busca.' : 'Registre a primeira internação para começar.'}
          </p>
          {!busca && (
            <button onClick={nova}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 transition-colors">
              <Plus size={13} />
              Nova internação
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {listaFiltrada.map(i => (
            <InternacaoCard key={i.id} internacao={i} onVer={verFicha} onEditar={editar} onDeletar={setModalDelete} />
          ))}
        </div>
      )}

      {/* Modais */}
      {modalDelete && (
        <ModalDelete
          internacao={modalDelete}
          onConfirmar={() => { setModalDelete(null); carregar() }}
          onFechar={() => setModalDelete(null)}
        />
      )}
      {modalAlta && (
        <ModalAlta
          internacao={modalAlta}
          onConfirmar={async () => {
            setModalAlta(null)
            // Recarrega e retorna pra lista
            await carregar()
            setView('lista')
            setInternacaoAtual(null)
          }}
          onFechar={() => setModalAlta(null)}
        />
      )}
    </div>
  )
}
