import { useState, useEffect, useCallback } from 'react'
import {
  UserRound, Plus, Search, Pencil, Trash2, X,
  Phone, Mail, BadgeCheck, Stethoscope, PowerOff, Power
} from 'lucide-react'

// ── Utilitários ───────────────────────────────────────────

const ESPECIALIDADES = [
  'Clínico Geral',
  'Cirurgião',
  'Anestesista',
  'Dermatologista',
  'Cardiologista',
  'Ortopedista',
  'Oftalmologista',
  'Oncologista',
  'Nutricionista',
  'Comportamentalista',
  'Odontologista',
  'Radiologista',
  'Outra',
]

function iniciais(nome) {
  if (!nome) return '?'
  const partes = nome.trim().split(' ').filter(Boolean)
  if (partes.length === 1) return partes[0][0].toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

const CORES_AVATAR = [
  'bg-emerald-500', 'bg-blue-500', 'bg-violet-500',
  'bg-rose-500', 'bg-amber-500', 'bg-teal-500',
  'bg-indigo-500', 'bg-pink-500',
]

function corAvatar(id) {
  return CORES_AVATAR[(id || 0) % CORES_AVATAR.length]
}

// ── Modal criar/editar ────────────────────────────────────

function ModalVeterinario({ vet, onSalvar, onFechar }) {
  const [dados, setDados] = useState({
    nome:          vet?.nome          || '',
    crmv:          vet?.crmv          || '',
    especialidade: vet?.especialidade || '',
    telefone:      vet?.telefone      || '',
    email:         vet?.email         || '',
    observacoes:   vet?.observacoes   || '',
    ativo:         vet?.ativo ?? 1,
  })
  const [erros, setErros] = useState({})
  const [salvando, setSalvando] = useState(false)

  function setD(campo, valor) {
    setDados(d => ({ ...d, [campo]: valor }))
    if (erros[campo]) setErros(e => ({ ...e, [campo]: null }))
  }

  function validar() {
    const e = {}
    if (!dados.nome.trim()) e.nome = 'Nome é obrigatório'
    return e
  }

  async function salvar() {
    const e = validar()
    if (Object.keys(e).length > 0) { setErros(e); return }
    setSalvando(true)
    try {
      if (vet?.id) {
        await window.api.veterinarios.editar(vet.id, dados)
      } else {
        await window.api.veterinarios.criar(dados)
      }
      onSalvar()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
              <UserRound size={18} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                {vet ? 'Editar veterinário' : 'Novo veterinário'}
              </h2>
              <p className="text-xs text-slate-400">Preencha os dados do profissional</p>
            </div>
          </div>
          <button onClick={onFechar} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Formulário */}
        <div className="p-5 space-y-4">

          {/* Nome */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Nome completo <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={dados.nome}
              onChange={e => setD('nome', e.target.value)}
              placeholder="Dr. João da Silva"
              className={`w-full px-3 py-2.5 border rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow ${
                erros.nome ? 'border-red-300 focus:ring-red-400' : 'border-slate-200 focus:ring-emerald-500'
              }`}
            />
            {erros.nome && <p className="text-xs text-red-500 mt-1">{erros.nome}</p>}
          </div>

          {/* CRMV + Especialidade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">CRMV</label>
              <input
                type="text"
                value={dados.crmv}
                onChange={e => setD('crmv', e.target.value)}
                placeholder="12345-SP"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Especialidade</label>
              <select
                value={dados.especialidade}
                onChange={e => setD('especialidade', e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
              >
                <option value="">Selecionar...</option>
                {ESPECIALIDADES.map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Telefone + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Telefone</label>
              <input
                type="text"
                value={dados.telefone}
                onChange={e => setD('telefone', e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">E-mail</label>
              <input
                type="email"
                value={dados.email}
                onChange={e => setD('email', e.target.value)}
                placeholder="vet@clinica.com"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Observações</label>
            <textarea
              value={dados.observacoes}
              onChange={e => setD('observacoes', e.target.value)}
              placeholder="Horários de atendimento, informações adicionais..."
              rows={3}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-shadow"
            />
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onFechar}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={salvando}
            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {salvando ? 'Salvando...' : vet ? 'Salvar alterações' : 'Cadastrar veterinário'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal confirmar exclusão ──────────────────────────────

function ModalDelete({ vet, onConfirmar, onFechar }) {
  const [deletando, setDeletando] = useState(false)

  async function confirmar() {
    setDeletando(true)
    await window.api.veterinarios.deletar(vet.id)
    onConfirmar()
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} className="text-red-500" />
        </div>
        <h3 className="font-semibold text-slate-800 mb-1">Excluir veterinário?</h3>
        <p className="text-sm text-slate-400 mb-5">
          <strong>"{vet.nome}"</strong> será removido permanentemente do sistema.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onFechar}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={deletando}
            className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {deletando ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Card do veterinário ───────────────────────────────────

function VetCard({ vet, onEditar, onDeletar, onAlternar }) {
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-4 transition-all hover:shadow-md group ${
      vet.ativo ? 'border-slate-100' : 'border-slate-100 opacity-60'
    }`}>

      {/* Topo: avatar + nome + ações */}
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-base ${corAvatar(vet.id)}`}>
          {iniciais(vet.nome)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-slate-800 truncate">{vet.nome}</h3>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
              vet.ativo
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-slate-100 text-slate-500'
            }`}>
              {vet.ativo ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          {vet.especialidade && (
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <Stethoscope size={11} />
              {vet.especialidade}
            </p>
          )}
        </div>

        {/* Ações (hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={() => onAlternar(vet)}
            title={vet.ativo ? 'Desativar' : 'Ativar'}
            className={`p-1.5 rounded-lg transition-colors ${
              vet.ativo
                ? 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            {vet.ativo ? <PowerOff size={13} /> : <Power size={13} />}
          </button>
          <button
            onClick={() => onEditar(vet)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDeletar(vet)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Infos */}
      <div className="space-y-1.5">
        {vet.crmv && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <BadgeCheck size={13} className="text-slate-400 flex-shrink-0" />
            <span>CRMV {vet.crmv}</span>
          </div>
        )}
        {vet.telefone && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Phone size={13} className="text-slate-400 flex-shrink-0" />
            <span>{vet.telefone}</span>
          </div>
        )}
        {vet.email && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Mail size={13} className="text-slate-400 flex-shrink-0" />
            <span className="truncate">{vet.email}</span>
          </div>
        )}
        {!vet.crmv && !vet.telefone && !vet.email && (
          <p className="text-xs text-slate-300 italic">Sem informações de contato</p>
        )}
      </div>

      {/* Observações */}
      {vet.observacoes && (
        <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2 line-clamp-2">
          {vet.observacoes}
        </p>
      )}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-100 rounded w-32" />
              <div className="h-3 bg-slate-50 rounded w-20" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-slate-100 rounded w-28" />
            <div className="h-3 bg-slate-100 rounded w-36" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────

export default function Veterinarios() {
  const [vets, setVets] = useState([])
  const [busca, setBusca] = useState('')
  const [filtroAtivo, setFiltroAtivo] = useState('todos') // 'todos' | 'ativos' | 'inativos'
  const [carregando, setCarregando] = useState(true)
  const [modal, setModal] = useState(null)       // null | 'novo' | vet (editar)
  const [modalDelete, setModalDelete] = useState(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const lista = await window.api.veterinarios.listar()
      setVets(lista)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function handleAlternar(vet) {
    await window.api.veterinarios.alternarAtivo(vet.id)
    carregar()
  }

  // Filtragem
  const vetsFiltrados = vets.filter(v => {
    const termoBusca = busca.toLowerCase()
    const matchBusca = !busca ||
      v.nome.toLowerCase().includes(termoBusca) ||
      (v.crmv || '').toLowerCase().includes(termoBusca) ||
      (v.especialidade || '').toLowerCase().includes(termoBusca)
    const matchAtivo =
      filtroAtivo === 'todos' ||
      (filtroAtivo === 'ativos'   && v.ativo === 1) ||
      (filtroAtivo === 'inativos' && v.ativo === 0)
    return matchBusca && matchAtivo
  })

  const totalAtivos = vets.filter(v => v.ativo === 1).length

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Veterinários</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {totalAtivos} profissional{totalAtivos !== 1 ? 'is' : ''} ativo{totalAtivos !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setModal('novo')}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <Plus size={16} />
          Novo veterinário
        </button>
      </div>

      {/* ── Busca + Filtro ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, CRMV ou especialidade..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {[
            { key: 'todos',    label: 'Todos' },
            { key: 'ativos',   label: 'Ativos' },
            { key: 'inativos', label: 'Inativos' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFiltroAtivo(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filtroAtivo === f.key
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Lista ── */}
      {carregando ? (
        <SkeletonGrid />
      ) : vetsFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
            <UserRound size={28} className="text-slate-300" />
          </div>
          <h3 className="text-sm font-semibold text-slate-600 mb-1">
            {busca ? 'Nenhum veterinário encontrado' : 'Nenhum veterinário cadastrado'}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mb-4">
            {busca
              ? 'Tente buscar por outro nome, CRMV ou especialidade.'
              : 'Cadastre o primeiro profissional para começar.'}
          </p>
          {!busca && (
            <button
              onClick={() => setModal('novo')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 transition-colors"
            >
              <Plus size={13} />
              Cadastrar veterinário
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vetsFiltrados.map(vet => (
            <VetCard
              key={vet.id}
              vet={vet}
              onEditar={setModal}
              onDeletar={setModalDelete}
              onAlternar={handleAlternar}
            />
          ))}
        </div>
      )}

      {/* ── Modais ── */}
      {modal && (
        <ModalVeterinario
          vet={modal === 'novo' ? null : modal}
          onSalvar={() => { setModal(null); carregar() }}
          onFechar={() => setModal(null)}
        />
      )}
      {modalDelete && (
        <ModalDelete
          vet={modalDelete}
          onConfirmar={() => { setModalDelete(null); carregar() }}
          onFechar={() => setModalDelete(null)}
        />
      )}
    </div>
  )
}
