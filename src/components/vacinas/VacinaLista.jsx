import { useState } from 'react'
import {
  Syringe, Plus, Search, AlertCircle, CheckCircle2, Clock,
  MessageCircle, RefreshCw, Pencil, Trash2, X, Shield
} from 'lucide-react'

// ── Utilitários ───────────────────────────────────────────

function calcularStatus(dataReforco) {
  if (!dataReforco) return 'sem_reforco'
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const reforco = new Date(dataReforco + 'T00:00:00')
  const diffDias = Math.floor((reforco - hoje) / (1000 * 60 * 60 * 24))
  if (diffDias < 0) return 'vencida'
  if (diffDias <= 30) return 'vencendo'
  return 'em_dia'
}

function diasParaReforco(dataReforco) {
  if (!dataReforco) return null
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const reforco = new Date(dataReforco + 'T00:00:00')
  return Math.floor((reforco - hoje) / (1000 * 60 * 60 * 24))
}

function fmtData(data) {
  if (!data) return '—'
  const [y, m, d] = data.split('-')
  return `${d}/${m}/${y}`
}

function especieEmoji(especie) {
  const map = { Cachorro: '🐕', Gato: '🐱', 'Pássaro': '🐦', Coelho: '🐰', Peixe: '🐠', Réptil: '🦎' }
  return map[especie] || '🐾'
}

function whatsappLink(telefone, nomePet, nomeVacina, dataReforco) {
  if (!telefone || !dataReforco) return null
  const numero = telefone.replace(/\D/g, '')
  if (!numero || numero.length < 8) return null
  const tel = numero.startsWith('55') ? numero : `55${numero}`
  const data = fmtData(dataReforco)
  const msg = `Olá! Passamos para informar que a vacina *${nomeVacina}* do(a) *${nomePet}* está vencendo em *${data}*. Entre em contato para agendar o reforço. 🐾`
  return `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`
}

// ── Config de status ──────────────────────────────────────

const STATUS = {
  em_dia:      { label: 'Em dia',    barColor: 'bg-emerald-400', badgeBg: 'bg-emerald-50',  badgeText: 'text-emerald-700', cardBorder: 'border-emerald-100', infoBg: 'bg-emerald-50',  Icon: CheckCircle2 },
  vencendo:    { label: 'Vencendo',  barColor: 'bg-amber-400',   badgeBg: 'bg-amber-50',    badgeText: 'text-amber-700',   cardBorder: 'border-amber-100',   infoBg: 'bg-amber-50',    Icon: AlertCircle  },
  vencida:     { label: 'Vencida',   barColor: 'bg-red-400',     badgeBg: 'bg-red-50',      badgeText: 'text-red-700',     cardBorder: 'border-red-100',     infoBg: 'bg-red-50',      Icon: AlertCircle  },
  sem_reforco: { label: 'Aplicada',  barColor: 'bg-slate-300',   badgeBg: 'bg-slate-50',    badgeText: 'text-slate-600',   cardBorder: 'border-slate-100',   infoBg: 'bg-slate-50',    Icon: Shield       },
}

// ── Modal: Registrar Reforço ──────────────────────────────

function ModalReforco({ vacina, onConfirmar, onFechar }) {
  const hoje = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ data_aplicacao: hoje, data_proximo_reforco: '', observacoes: '' })
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    if (!form.data_aplicacao) return
    setSalvando(true)
    try {
      await window.api.vacinas.criar({
        id_pet: vacina.id_pet,
        nome_vacina: vacina.nome_vacina,
        data_aplicacao: form.data_aplicacao,
        data_proximo_reforco: form.data_proximo_reforco || null,
        observacoes: form.observacoes || null,
      })
      onConfirmar()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-800">Registrar Reforço</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {vacina.nome_vacina} · {vacina.nome_pet}
            </p>
          </div>
          <button onClick={onFechar} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Data de aplicação *</label>
            <input
              type="date"
              value={form.data_aplicacao}
              onChange={e => setForm(f => ({ ...f, data_aplicacao: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Próximo reforço</label>
            <input
              type="date"
              value={form.data_proximo_reforco}
              onChange={e => setForm(f => ({ ...f, data_proximo_reforco: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Observações</label>
            <textarea
              value={form.observacoes}
              onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
              rows={2}
              placeholder="Lote, fabricante, etc."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
            />
          </div>
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={onFechar}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={salvando || !form.data_aplicacao}
            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {salvando
              ? <><Clock size={14} className="animate-spin" /> Salvando...</>
              : <><RefreshCw size={14} /> Confirmar Reforço</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal: Confirmar Exclusão ─────────────────────────────

function ModalDelete({ vacina, onConfirmar, onFechar }) {
  const [deletando, setDeletando] = useState(false)

  async function confirmar() {
    setDeletando(true)
    await window.api.vacinas.deletar(vacina.id)
    onConfirmar()
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} className="text-red-500" />
        </div>
        <h3 className="font-semibold text-slate-800 mb-1">Excluir registro?</h3>
        <p className="text-sm text-slate-400 mb-5">
          Registro de <strong>{vacina.nome_vacina}</strong> de <strong>{vacina.nome_pet}</strong> será removido permanentemente.
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

// ── Card de Vacina ────────────────────────────────────────

function VacinaCard({ vacina, onEditar, onReforco, onDeletar }) {
  const status = calcularStatus(vacina.data_proximo_reforco)
  const dias = diasParaReforco(vacina.data_proximo_reforco)
  const cfg = STATUS[status]
  const { Icon } = cfg
  const waLink = (status === 'vencida' || status === 'vencendo')
    ? whatsappLink(vacina.telefone_dono, vacina.nome_pet, vacina.nome_vacina, vacina.data_proximo_reforco)
    : null

  return (
    <div className={`bg-white rounded-2xl border ${cfg.cardBorder} shadow-sm overflow-hidden hover:shadow-md transition-shadow`}>
      {/* Barra de status */}
      <div className={`h-1 ${cfg.barColor}`} />

      <div className="p-4">
        {/* Pet info */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl flex-shrink-0">{especieEmoji(vacina.especie)}</span>
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 truncate text-sm">{vacina.nome_pet}</p>
              <p className="text-xs text-slate-400 truncate">{vacina.nome_dono}</p>
            </div>
          </div>
          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${cfg.badgeBg} ${cfg.badgeText}`}>
            <Icon size={11} />
            {cfg.label}
          </span>
        </div>

        {/* Info da vacina */}
        <div className={`rounded-xl p-3 mb-3 ${cfg.infoBg}`}>
          <p className="font-medium text-slate-800 text-sm mb-2.5">💉 {vacina.nome_vacina}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-slate-400">Aplicada em</p>
              <p className="font-medium text-slate-700 mt-0.5">{fmtData(vacina.data_aplicacao)}</p>
            </div>
            <div>
              <p className="text-slate-400">Próximo reforço</p>
              <p className={`font-medium mt-0.5 ${
                status === 'vencida' ? 'text-red-600'
                : status === 'vencendo' ? 'text-amber-600'
                : 'text-slate-700'
              }`}>
                {fmtData(vacina.data_proximo_reforco)}
              </p>
            </div>
          </div>

          {/* Contador de dias */}
          {dias !== null && (
            <div className="mt-2 pt-2 border-t border-black/5">
              {dias < 0
                ? <p className="text-xs text-red-600 font-medium">⚠️ Vencida há {Math.abs(dias)} dia{Math.abs(dias) !== 1 ? 's' : ''}</p>
                : dias === 0
                ? <p className="text-xs text-red-600 font-medium">⚠️ Vence hoje!</p>
                : <p className={`text-xs font-medium ${status === 'vencendo' ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {dias <= 30 ? `⏰ Vence em ${dias} dia${dias !== 1 ? 's' : ''}` : `✅ ${dias} dias restantes`}
                  </p>
              }
            </div>
          )}
        </div>

        {/* Observações */}
        {vacina.observacoes && (
          <p className="text-xs text-slate-400 italic mb-3 truncate">"{vacina.observacoes}"</p>
        )}

        {/* Ações */}
        <div className="flex items-center gap-1.5">
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-xl text-xs font-medium hover:bg-green-600 transition-colors"
            >
              <MessageCircle size={12} />
              WhatsApp
            </a>
          )}
          {(status === 'vencida' || status === 'vencendo') && (
            <button
              onClick={() => onReforco(vacina)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 transition-colors"
            >
              <RefreshCw size={12} />
              Registrar reforço
            </button>
          )}
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => onEditar(vacina)}
              title="Editar"
              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDeletar(vacina)}
              title="Excluir"
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
      <div className="h-1 bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-200 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 bg-slate-200 rounded w-28" />
            <div className="h-3 bg-slate-100 rounded w-20" />
          </div>
        </div>
        <div className="h-24 bg-slate-100 rounded-xl" />
        <div className="flex gap-2">
          <div className="h-7 bg-slate-100 rounded-xl w-24" />
          <div className="h-7 bg-slate-100 rounded-xl w-32" />
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────

const FILTROS = [
  { key: 'todas',      label: 'Todas' },
  { key: 'vencida',    label: 'Vencidas' },
  { key: 'vencendo',   label: 'Vencendo' },
  { key: 'em_dia',     label: 'Em dia' },
  { key: 'sem_reforco',label: 'Sem reforço' },
]

const ORDEM_STATUS = { vencida: 0, vencendo: 1, em_dia: 2, sem_reforco: 3 }

export default function VacinaLista({ vacinas, carregando, onNova, onEditar, onAtualizar }) {
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todas')
  const [modalReforco, setModalReforco] = useState(null)
  const [modalDelete, setModalDelete] = useState(null)

  // Status calculado para cada vacina
  const vacinasComStatus = vacinas.map(v => ({ ...v, _status: calcularStatus(v.data_proximo_reforco) }))

  const contadores = {
    total:       vacinasComStatus.length,
    em_dia:      vacinasComStatus.filter(v => v._status === 'em_dia').length,
    vencendo:    vacinasComStatus.filter(v => v._status === 'vencendo').length,
    vencida:     vacinasComStatus.filter(v => v._status === 'vencida').length,
    sem_reforco: vacinasComStatus.filter(v => v._status === 'sem_reforco').length,
  }

  const filtradas = vacinasComStatus.filter(v => {
    const t = busca.toLowerCase()
    const buscaOk = !busca
      || v.nome_pet?.toLowerCase().includes(t)
      || v.nome_vacina?.toLowerCase().includes(t)
      || v.nome_dono?.toLowerCase().includes(t)
    const filtroOk = filtro === 'todas' || v._status === filtro
    return buscaOk && filtroOk
  })

  const ordenadas = [...filtradas].sort((a, b) => {
    const diff = (ORDEM_STATUS[a._status] ?? 4) - (ORDEM_STATUS[b._status] ?? 4)
    if (diff !== 0) return diff
    if (a.data_proximo_reforco && b.data_proximo_reforco)
      return a.data_proximo_reforco.localeCompare(b.data_proximo_reforco)
    return 0
  })

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Vacinas</h2>
          <p className="text-sm text-slate-400 mt-0.5">Carteira de vacinação dos pets</p>
        </div>
        <button
          onClick={onNova}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <Plus size={16} />
          Registrar vacina
        </button>
      </div>

      {/* ── Cards de resumo ── */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Syringe size={19} className="text-slate-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{contadores.total}</p>
            <p className="text-xs text-slate-400 leading-tight">Total de registros</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={19} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{contadores.em_dia}</p>
            <p className="text-xs text-slate-400 leading-tight">Em dia</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock size={19} className="text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{contadores.vencendo}</p>
            <p className="text-xs text-slate-400 leading-tight">Vencendo em 30 dias</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle size={19} className="text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{contadores.vencida}</p>
            <p className="text-xs text-slate-400 leading-tight">Vencidas</p>
          </div>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar pet, vacina, tutor..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {FILTROS.map(f => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filtro === f.key
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f.label}
              {f.key !== 'todas' && (
                <span className="ml-1 opacity-50">
                  ({contadores[f.key] ?? 0})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Lista ── */}
      {carregando ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} />)}
        </div>
      ) : ordenadas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
              <Syringe size={28} className="text-emerald-500" />
            </div>
            <h3 className="text-base font-semibold text-slate-700 mb-1">
              {busca || filtro !== 'todas' ? 'Nenhuma vacina encontrada' : 'Nenhuma vacina registrada'}
            </h3>
            <p className="text-sm text-slate-400 max-w-xs">
              {busca || filtro !== 'todas'
                ? 'Tente outros termos ou remova os filtros.'
                : 'Registre as vacinas aplicadas e o sistema alertará automaticamente sobre os reforços.'}
            </p>
            {!busca && filtro === 'todas' && (
              <button
                onClick={onNova}
                className="mt-5 flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
              >
                <Plus size={15} />
                Registrar vacina
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-400">
            {ordenadas.length} registro{ordenadas.length !== 1 ? 's' : ''} encontrado{ordenadas.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {ordenadas.map(v => (
              <VacinaCard
                key={v.id}
                vacina={v}
                onEditar={onEditar}
                onReforco={setModalReforco}
                onDeletar={setModalDelete}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Modais ── */}
      {modalReforco && (
        <ModalReforco
          vacina={modalReforco}
          onConfirmar={() => { setModalReforco(null); onAtualizar() }}
          onFechar={() => setModalReforco(null)}
        />
      )}
      {modalDelete && (
        <ModalDelete
          vacina={modalDelete}
          onConfirmar={() => { setModalDelete(null); onAtualizar() }}
          onFechar={() => setModalDelete(null)}
        />
      )}
    </div>
  )
}
