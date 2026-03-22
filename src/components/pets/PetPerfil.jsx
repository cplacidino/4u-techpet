import { useState, useEffect } from 'react'
import {
  ArrowLeft, Edit2, Trash2, Phone, Mail,
  Scale, CalendarDays, ClipboardList, Syringe,
  AlertCircle, CheckCircle2, Plus, X,
  Stethoscope, BedDouble, Scissors, FileText, Clock,
  User, MapPin, PawPrint, MessageCircle
} from 'lucide-react'
import AbaExames from './AbaExames'

const ESPECIE_CONFIG = {
  'Cachorro': { cor: 'bg-amber-50 text-amber-500',   emoji: '🐕' },
  'Gato':     { cor: 'bg-purple-50 text-purple-500', emoji: '🐱' },
  'Pássaro':  { cor: 'bg-sky-50 text-sky-500',       emoji: '🐦' },
  'Coelho':   { cor: 'bg-pink-50 text-pink-500',     emoji: '🐰' },
  'Peixe':    { cor: 'bg-blue-50 text-blue-500',     emoji: '🐠' },
  'default':  { cor: 'bg-slate-100 text-slate-400',  emoji: '🐾' },
}

const STATUS_STYLE = {
  agendado:   'bg-blue-50 text-blue-600 border-blue-100',
  confirmado: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  concluido:  'bg-slate-50 text-slate-500 border-slate-100',
  cancelado:  'bg-red-50 text-red-500 border-red-100',
}

function calcularIdade(dataNascimento) {
  if (!dataNascimento) return null
  const nasc = new Date(dataNascimento + 'T00:00:00')
  const hoje = new Date()
  const meses = (hoje.getFullYear() - nasc.getFullYear()) * 12 + (hoje.getMonth() - nasc.getMonth())
  if (meses < 1)  return 'Recém-nascido'
  if (meses < 12) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`
  const anos = Math.floor(meses / 12)
  return `${anos} ${anos === 1 ? 'ano' : 'anos'}`
}

function fmtData(data) {
  if (!data) return '—'
  return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')
}

function InfoLinha({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={13} className="text-slate-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-slate-700 font-medium">{value}</p>
      </div>
    </div>
  )
}

function ConfirmDialog({ nome, onConfirmar, onCancelar }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4 mx-auto">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <h3 className="text-base font-bold text-slate-800 text-center mb-2">Excluir {nome}?</h3>
        <p className="text-sm text-slate-400 text-center mb-5 leading-relaxed">
          Todos os agendamentos e vacinas registrados para este pet também serão excluídos permanentemente.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancelar} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirmar} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors">
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Gráfico de peso CSS ───────────────────────────────────

function GraficoPeso({ historico }) {
  if (historico.length < 2) return null

  const pesos = historico.map(h => h.peso)
  const minPeso = Math.min(...pesos)
  const maxPeso = Math.max(...pesos)
  const range = maxPeso - minPeso || 1
  const CHART_H = 80

  function barH(peso) {
    return Math.max(4, Math.round(((peso - minPeso) / range) * CHART_H))
  }

  return (
    <div className="mt-4 p-4 bg-slate-50 rounded-xl">
      <p className="text-xs font-semibold text-slate-500 mb-3">Evolução do peso</p>
      <div className="flex items-end gap-1.5 border-b border-slate-200" style={{ height: `${CHART_H + 4}px` }}>
        {historico.map((h, i) => (
          <div key={h.id} className="group relative flex-1 flex items-end h-full">
            <div
              className={`w-full rounded-t-md transition-colors cursor-default ${
                i === historico.length - 1 ? 'bg-emerald-500' : 'bg-emerald-200 hover:bg-emerald-300'
              }`}
              style={{ height: `${barH(h.peso)}px` }}
            />
            <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-slate-800 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap z-10 pointer-events-none">
              {h.peso} kg · {fmtData(h.data)}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-slate-400">{fmtData(historico[0].data)}</span>
        <span className="text-[10px] text-slate-400">{fmtData(historico[historico.length - 1].data)}</span>
      </div>
    </div>
  )
}

// ── Modal: registrar peso ─────────────────────────────────

function ModalPeso({ idPet, onSalvar, onFechar }) {
  const hoje = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ peso: '', data: hoje, observacoes: '' })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  async function salvar() {
    if (!form.peso || Number(form.peso) <= 0) { setErro('Informe um peso válido'); return }
    setSalvando(true)
    try {
      await window.api.peso.registrar({
        id_pet: idPet,
        peso: Number(form.peso),
        data: form.data,
        observacoes: form.observacoes || null,
      })
      onSalvar()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Registrar pesagem</h3>
          <button onClick={onFechar} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Peso (kg) *</label>
            <div className="relative">
              <input
                type="number" step="0.1" min="0"
                placeholder="Ex: 4.5"
                value={form.peso}
                onChange={e => { setForm(f => ({ ...f, peso: e.target.value })); setErro('') }}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">kg</span>
            </div>
            {erro && <p className="text-xs text-red-500 mt-1">{erro}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Data</label>
            <input
              type="date" value={form.data}
              onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Observações</label>
            <input
              type="text" placeholder="Ex: pós-consulta, jejum..."
              value={form.observacoes}
              onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
            />
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onFechar} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={salvar} disabled={salvando}
            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {salvando ? 'Salvando...' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Histórico clínico (linha do tempo) ────────────────────

const TIPO_CONFIG = {
  consulta:   { cor: 'bg-sky-100 text-sky-700 border-sky-200',      corDot: 'bg-sky-500',    icon: Stethoscope, label: 'Consulta'   },
  cirurgia:   { cor: 'bg-violet-100 text-violet-700 border-violet-200', corDot: 'bg-violet-500', icon: Scissors,    label: 'Cirurgia'   },
  internacao: { cor: 'bg-amber-100 text-amber-700 border-amber-200', corDot: 'bg-amber-500',  icon: BedDouble,   label: 'Internação' },
  prescricao: { cor: 'bg-emerald-100 text-emerald-700 border-emerald-200', corDot: 'bg-emerald-500', icon: FileText, label: 'Receituário' },
}

function HistoricoClinico({ consultas, cirurgias, internacoes, loading, nomePet }) {
  // Monta lista unificada e ordena pela data (mais recente primeiro)
  const eventos = [
    ...consultas.map(c => ({
      id: `c-${c.id}`, tipo: 'consulta', data: c.data_consulta,
      titulo: c.queixa_principal || 'Consulta clínica',
      detalhe: c.nome_vet ? `Dr(a). ${c.nome_vet}` : null,
      extra: c.diagnostico || null,
    })),
    ...cirurgias.map(c => ({
      id: `cir-${c.id}`, tipo: 'cirurgia', data: c.data_cirurgia,
      titulo: c.tipo_cirurgia || 'Procedimento cirúrgico',
      detalhe: c.nome_cirurgiao ? `Dr(a). ${c.nome_cirurgiao}` : null,
      extra: c.hora_inicio ? `Início: ${c.hora_inicio}` : null,
    })),
    ...internacoes.map(i => ({
      id: `i-${i.id}`, tipo: 'internacao', data: i.data_entrada,
      titulo: i.motivo || 'Internação',
      detalhe: i.data_saida ? `Alta: ${fmtData(i.data_saida)}` : 'Em andamento',
      extra: i.status === 'internado' ? 'INTERNADO' : null,
    })),
  ].sort((a, b) => (b.data || '').localeCompare(a.data || ''))

  if (loading) {
    return (
      <div className="space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
      </div>
    )
  }

  if (eventos.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <Clock size={28} className="text-slate-200 mb-3" />
        <p className="text-sm text-slate-400">Nenhum histórico clínico para {nomePet}</p>
        <p className="text-xs text-slate-300 mt-1">Consultas, cirurgias e internações aparecerão aqui</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Linha vertical da timeline */}
      <div className="absolute left-[19px] top-2 bottom-2 w-px bg-slate-100" />

      <div className="space-y-3">
        {eventos.map(ev => {
          const cfg = TIPO_CONFIG[ev.tipo]
          const Icon = cfg.icon
          return (
            <div key={ev.id} className="flex gap-3 items-start">
              {/* Dot */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 z-10 border-2 border-white shadow-sm ${cfg.cor}`}>
                <Icon size={15} />
              </div>
              {/* Conteúdo */}
              <div className="flex-1 min-w-0 bg-slate-50 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${cfg.cor}`}>
                        {cfg.label}
                      </span>
                      {ev.extra && ev.tipo === 'internacao' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500 text-white">
                          {ev.extra}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-700 mt-1 truncate">{ev.titulo}</p>
                    {ev.detalhe && <p className="text-xs text-slate-400 mt-0.5">{ev.detalhe}</p>}
                    {ev.extra && ev.tipo !== 'internacao' && (
                      <p className="text-xs text-slate-500 mt-0.5 italic truncate">{ev.extra}</p>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0 mt-1">{fmtData(ev.data)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Perfil do pet ─────────────────────────────────────────

function PetPerfil({ pet: petInicial, onEditar, onVoltar, onDeletado }) {
  const [pet, setPet] = useState(petInicial)
  const [tab, setTab] = useState('dados')
  const [agendamentos, setAgendamentos] = useState([])
  const [vacinas, setVacinas] = useState([])
  const [pesoHistorico, setPesoHistorico] = useState([])
  const [consultas, setConsultas] = useState([])
  const [cirurgias, setCirurgias] = useState([])
  const [internacoes, setInternacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [modalPeso, setModalPeso] = useState(false)
  const [tutor, setTutor] = useState(null)

  async function carregar() {
    try {
      const [petAtual, todosAgenda, vacs, pesos, cons, cirs, ints, tutorComPets] = await Promise.all([
        window.api.pets.buscarPorId(petInicial.id),
        window.api.agendamentos.listar(),
        window.api.vacinas.buscarPorPet(petInicial.id),
        window.api.peso.buscarPorPet(petInicial.id),
        window.api.consultas.buscarPorPet(petInicial.id),
        window.api.cirurgias.buscarPorPet(petInicial.id),
        window.api.internacoes.buscarPorPet(petInicial.id),
        petInicial.id_dono ? window.api.donos.buscarComPets(petInicial.id_dono) : Promise.resolve(null),
      ])
      if (petAtual) setPet(petAtual)
      setAgendamentos(todosAgenda.filter(a => a.id_pet === petInicial.id))
      setVacinas(vacs)
      setPesoHistorico(pesos)
      setConsultas(cons ?? [])
      setCirurgias(cirs ?? [])
      setInternacoes(ints ?? [])
      setTutor(tutorComPets)
    } catch (err) {
      console.error('[PetPerfil]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [petInicial.id]) // eslint-disable-line

  async function handleDeletar() {
    await window.api.pets.deletar(pet.id)
    onDeletado()
  }

  async function handleDeletePeso(id) {
    await window.api.peso.deletar(id)
    const pesos = await window.api.peso.buscarPorPet(petInicial.id)
    setPesoHistorico(pesos)
  }

  const config = ESPECIE_CONFIG[pet.especie] || ESPECIE_CONFIG.default
  const idade  = calcularIdade(pet.data_nascimento)
  const pesoAtual = pesoHistorico.length > 0 ? pesoHistorico[pesoHistorico.length - 1].peso : pet.peso

  const totalHistorico = consultas.length + cirurgias.length + internacoes.length

  const TABS = [
    { key: 'dados',        label: 'Dados' },
    { key: 'cliente',      label: 'Cliente' },
    { key: 'historico',    label: `Histórico (${totalHistorico})` },
    { key: 'exames',       label: 'Exames' },
    { key: 'peso',         label: `Peso (${pesoHistorico.length})` },
    { key: 'agendamentos', label: `Agenda (${agendamentos.length})` },
    { key: 'vacinas',      label: `Vacinas (${vacinas.length})` },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-6">

      {/* Navegação */}
      <div className="flex items-center justify-between">
        <button onClick={onVoltar} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft size={15} />
          Todos os pets
        </button>
        <div className="flex items-center gap-2">
          <button onClick={onEditar} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
            <Edit2 size={13} />
            Editar
          </button>
          <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
            <Trash2 size={13} />
            Excluir
          </button>
        </div>
      </div>

      {/* Card de identidade */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6">
        <div className="flex items-start gap-5">
          {pet.foto ? (
            <img src={pet.foto} alt={pet.nome} className="w-24 h-24 rounded-2xl object-cover flex-shrink-0 shadow-sm" />
          ) : (
            <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 ${config.cor}`}>
              {config.emoji}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-2xl font-bold text-slate-800 truncate">{pet.nome}</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {[pet.raca, pet.especie].filter(Boolean).join(' · ') || '—'}
                </p>
              </div>
              {pesoAtual && (
                <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 rounded-lg flex-shrink-0">
                  <Scale size={11} className="text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">{pesoAtual} kg</span>
                </div>
              )}
            </div>
            {(idade || pet.data_nascimento) && (
              <div className="flex items-center gap-1.5 mt-2.5 text-sm text-slate-400">
                <CalendarDays size={13} />
                {idade && <span>{idade}</span>}
                {pet.data_nascimento && <span>· {fmtData(pet.data_nascimento)}</span>}
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-slate-50">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Tutor</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">{pet.nome_dono || '—'}</p>
              {pet.telefone_dono && <p className="text-xs text-slate-400 mt-0.5">{pet.telefone_dono}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === t.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Conteúdo das tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5">

        {/* Tab: Dados */}
        {tab === 'dados' && (
          <div>
            <InfoLinha icon={Phone} label="Telefone do tutor" value={pet.telefone_dono} />
            <InfoLinha icon={Mail}  label="E-mail do tutor"   value={pet.email_dono} />
            {pet.observacoes && (
              <div className="mt-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-[10px] text-amber-500 uppercase tracking-wide font-semibold mb-1.5">Observações</p>
                <p className="text-sm text-slate-700 leading-relaxed">{pet.observacoes}</p>
              </div>
            )}
            {!pet.telefone_dono && !pet.email_dono && !pet.observacoes && (
              <div className="flex flex-col items-center py-8 text-center">
                <p className="text-sm text-slate-400">Nenhuma informação adicional.</p>
                <button onClick={onEditar} className="mt-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                  Editar pet →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab: Cliente */}
        {tab === 'cliente' && (
          <div>
            {!tutor ? (
              <div className="flex flex-col items-center py-8 text-center">
                <User size={28} className="text-slate-200 mb-3" />
                <p className="text-sm text-slate-400">Dados do tutor não encontrados</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Identidade */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-bold text-slate-800 truncate">{tutor.nome}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Tutor responsável</p>
                  </div>
                </div>

                {/* Contatos */}
                <div className="space-y-0">
                  {tutor.telefone && (
                    <div className="flex items-center gap-3 py-3 border-b border-slate-50">
                      <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone size={13} className="text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Telefone</p>
                        <p className="text-sm text-slate-700 font-medium">{tutor.telefone}</p>
                      </div>
                      <a
                        href={`https://wa.me/55${tutor.telefone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors flex-shrink-0"
                      >
                        <MessageCircle size={12} />
                        WhatsApp
                      </a>
                    </div>
                  )}
                  {tutor.email && (
                    <div className="flex items-center gap-3 py-3 border-b border-slate-50">
                      <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mail size={13} className="text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">E-mail</p>
                        <p className="text-sm text-slate-700 font-medium truncate">{tutor.email}</p>
                      </div>
                    </div>
                  )}
                  {tutor.endereco && (
                    <div className="flex items-center gap-3 py-3">
                      <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin size={13} className="text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Endereço</p>
                        <p className="text-sm text-slate-700 font-medium">{tutor.endereco}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Outros pets do tutor */}
                {tutor.pets && tutor.pets.length > 1 && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Outros pets deste tutor
                    </p>
                    <div className="space-y-1.5">
                      {tutor.pets.filter(p => p.id !== pet.id).map(p => {
                        const cfg = ESPECIE_CONFIG[p.especie] || ESPECIE_CONFIG.default
                        return (
                          <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-xl">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 ${cfg.cor}`}>
                              {cfg.emoji}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-700">{p.nome}</p>
                              <p className="text-xs text-slate-400">{[p.especie, p.raca].filter(Boolean).join(' · ') || '—'}</p>
                            </div>
                            <PawPrint size={13} className="text-slate-300 flex-shrink-0" />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Sem contato cadastrado */}
                {!tutor.telefone && !tutor.email && !tutor.endereco && (
                  <p className="text-sm text-slate-400 text-center py-4">Nenhum contato cadastrado para este tutor.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab: Histórico Clínico */}
        {tab === 'historico' && (
          <HistoricoClinico
            consultas={consultas}
            cirurgias={cirurgias}
            internacoes={internacoes}
            loading={loading}
            nomePet={pet.nome}
          />
        )}

        {/* Tab: Exames */}
        {tab === 'exames' && (
          <AbaExames idPet={pet.id} nomePet={pet.nome} />
        )}

        {/* Tab: Peso */}
        {tab === 'peso' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-700">Histórico de peso</p>
              <button
                onClick={() => setModalPeso(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 transition-colors"
              >
                <Plus size={13} />
                Registrar pesagem
              </button>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
              </div>
            ) : pesoHistorico.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <Scale size={28} className="text-slate-200 mb-3" />
                <p className="text-sm text-slate-400">Nenhuma pesagem registrada</p>
                <p className="text-xs text-slate-300 mt-1">Registre o peso para acompanhar a evolução</p>
              </div>
            ) : (
              <>
                <GraficoPeso historico={pesoHistorico} />
                <div className="mt-4 space-y-1.5">
                  {[...pesoHistorico].reverse().map((h, i) => (
                    <div key={h.id} className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-xl group">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-bold text-slate-800">{h.peso} kg</span>
                        {h.observacoes && <span className="text-xs text-slate-400 ml-2 italic">{h.observacoes}</span>}
                      </div>
                      <span className="text-xs text-slate-400">{fmtData(h.data)}</span>
                      <button
                        onClick={() => handleDeletePeso(h.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab: Agendamentos */}
        {tab === 'agendamentos' && (
          <div>
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}</div>
            ) : agendamentos.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <ClipboardList size={28} className="text-slate-200 mb-3" />
                <p className="text-sm text-slate-400">Nenhum agendamento para {pet.nome}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {agendamentos.map(a => (
                  <div key={a.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{a.servico}</p>
                      <p className="text-xs text-slate-400">{fmtData(a.data)} às {a.hora}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex-shrink-0 ${STATUS_STYLE[a.status] || STATUS_STYLE.agendado}`}>
                      {a.status}
                    </span>
                    {a.valor != null && (
                      <span className="text-sm font-bold text-emerald-700 flex-shrink-0">
                        R$ {Number(a.valor).toFixed(2).replace('.', ',')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Vacinas */}
        {tab === 'vacinas' && (
          <div>
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
            ) : vacinas.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <Syringe size={28} className="text-slate-200 mb-3" />
                <p className="text-sm text-slate-400">Nenhuma vacina registrada para {pet.nome}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {vacinas.map(v => {
                  const proximaData = v.data_proximo_reforco ? new Date(v.data_proximo_reforco + 'T00:00:00') : null
                  const vencida = proximaData && proximaData < new Date()
                  const emBreve = proximaData && !vencida && (proximaData - new Date()) < 30 * 86400000
                  return (
                    <div key={v.id} className={`p-4 rounded-xl border ${vencida ? 'bg-red-50 border-red-100' : emBreve ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            {vencida
                              ? <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
                              : <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />}
                            <p className="text-sm font-semibold text-slate-700">{v.nome_vacina}</p>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">Aplicada em {fmtData(v.data_aplicacao)}</p>
                          {proximaData && (
                            <p className={`text-xs font-medium mt-0.5 ${vencida ? 'text-red-600' : emBreve ? 'text-amber-600' : 'text-slate-400'}`}>
                              Reforço: {fmtData(v.data_proximo_reforco)}
                              {vencida && ' ⚠ Atrasada!'}
                              {emBreve && ' — Em breve'}
                            </p>
                          )}
                          {v.observacoes && <p className="text-xs text-slate-500 mt-1 italic">{v.observacoes}</p>}
                        </div>
                        {vencida && (
                          <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded-lg font-bold flex-shrink-0">ATRASADA</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {confirmDelete && (
        <ConfirmDialog nome={pet.nome} onConfirmar={handleDeletar} onCancelar={() => setConfirmDelete(false)} />
      )}
      {modalPeso && (
        <ModalPeso
          idPet={pet.id}
          onSalvar={() => { setModalPeso(false); carregar() }}
          onFechar={() => setModalPeso(false)}
        />
      )}
    </div>
  )
}

export default PetPerfil
