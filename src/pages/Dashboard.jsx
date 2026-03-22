import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConfig } from '../contexts/ConfigContext'
import {
  Plus, CalendarDays, Clock,
  Syringe, TrendingUp, AlertCircle, ChevronRight,
  CheckCircle2, XCircle, DollarSign, Loader2,
  Stethoscope, BedDouble, Scissors
} from 'lucide-react'

// ── Utilitários ───────────────────────────────────────────

function saudacao() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function fmtMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL'
  })
}

function diasAte(dataStr) {
  const diff = new Date(dataStr + 'T00:00:00') - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const HOJE = new Date().toISOString().split('T')[0]

// ── Skeleton ──────────────────────────────────────────────
function Sk({ className }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className}`} />
}

// ── Card de métrica ───────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, cor, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft text-left w-full hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-3xl font-bold text-slate-800 tabular-nums">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1 truncate">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ml-3 ${cor}`}>
          <Icon size={20} />
        </div>
      </div>
    </button>
  )
}

// ── Ação rápida ───────────────────────────────────────────
function AcaoRapida({ label, emoji, onClick, cor }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all hover:shadow-sm hover:-translate-y-0.5 ${cor}`}
    >
      <span className="text-base">{emoji}</span>
      {label}
    </button>
  )
}

// ── Item da agenda com ação rápida de status ──────────────
const STATUS_STYLE = {
  agendado:   { badge: 'bg-blue-50 text-blue-600 border-blue-100',     label: 'Agendado'   },
  confirmado: { badge: 'bg-violet-50 text-violet-600 border-violet-100', label: 'Confirmado' },
  concluido:  { badge: 'bg-emerald-50 text-emerald-600 border-emerald-100', label: 'Concluído' },
  cancelado:  { badge: 'bg-red-50 text-red-500 border-red-100',        label: 'Cancelado'  },
}

const ESPECIE_EMOJI = {
  'Cachorro': '🐕', 'Gato': '🐱', 'Pássaro': '🐦',
  'Coelho': '🐰',  'Peixe': '🐠', 'default': '🐾',
}

function AgendaItemDash({ ag, onAtualizar }) {
  const [processando, setProcessando] = useState(false)
  const style = STATUS_STYLE[ag.status] || STATUS_STYLE.agendado
  const emoji = ESPECIE_EMOJI[ag.especie] || ESPECIE_EMOJI.default

  async function concluir() {
    setProcessando(true)
    try {
      await window.api.agendamentos.atualizarStatus(ag.id, 'concluido')
      if (ag.valor) {
        await window.api.financeiro.criar({
          id_agendamento: ag.id,
          descricao: `${ag.servico} — ${ag.nome_pet}`,
          valor: ag.valor,
          tipo: 'receita',
          data: HOJE,
        })
      }
      onAtualizar()
    } finally { setProcessando(false) }
  }

  async function cancelar() {
    setProcessando(true)
    try {
      await window.api.agendamentos.atualizarStatus(ag.id, 'cancelado')
      onAtualizar()
    } finally { setProcessando(false) }
  }

  const pendente = ['agendado', 'confirmado'].includes(ag.status)

  return (
    <div className={`group flex items-center gap-3 p-3 rounded-xl transition-colors ${pendente ? 'hover:bg-slate-50' : 'opacity-70'}`}>
      {/* Hora */}
      <span className="text-sm font-mono font-bold text-slate-500 w-12 flex-shrink-0 text-center">
        {ag.hora?.slice(0, 5)}
      </span>
      <div className="w-px h-7 bg-slate-100 flex-shrink-0" />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-700 truncate">
          {emoji} {ag.nome_pet}
          <span className="font-normal text-slate-400"> · {ag.servico}</span>
        </p>
        <p className="text-xs text-slate-400 truncate">{ag.nome_dono}</p>
      </div>

      {/* Status */}
      <span className={`text-[11px] px-2 py-0.5 rounded-lg border font-semibold flex-shrink-0 ${style.badge}`}>
        {style.label}
      </span>

      {/* Valor */}
      {ag.valor != null && (
        <span className="text-xs font-bold text-emerald-700 flex-shrink-0">
          {fmtMoeda(ag.valor)}
        </span>
      )}

      {/* Ações rápidas (aparecem no hover) */}
      {pendente && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={concluir}
            disabled={processando}
            title="Concluir"
            className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center hover:bg-emerald-100 transition-colors"
          >
            {processando ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={13} />}
          </button>
          <button
            onClick={cancelar}
            disabled={processando}
            title="Cancelar"
            className="w-7 h-7 bg-red-50 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors"
          >
            <XCircle size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Alerta de vacina com urgência ─────────────────────────
function AlertaVacina({ v }) {
  const dias = diasAte(v.data_proximo_reforco)
  const urgente = dias <= 0
  const semana  = dias > 0 && dias <= 7

  const cor = urgente ? 'bg-red-50 border-red-100'
    : semana ? 'bg-amber-50 border-amber-100'
    : 'bg-yellow-50 border-yellow-100'

  const textoCor = urgente ? 'text-red-600'
    : semana ? 'text-amber-600'
    : 'text-yellow-600'

  const label = urgente ? 'VENCIDA!'
    : dias === 0 ? 'Hoje!'
    : dias === 1 ? 'Amanhã'
    : `Em ${dias} dias`

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${cor}`}>
      <AlertCircle size={14} className={`flex-shrink-0 mt-0.5 ${textoCor}`} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-slate-700 truncate">{v.nome_pet}</p>
        <p className="text-xs text-slate-500 truncate">{v.nome_vacina}</p>
        <p className={`text-xs font-semibold mt-0.5 ${textoCor}`}>{label}</p>
      </div>
    </div>
  )
}

// ── Mini card: próximos dias ──────────────────────────────
function ProximosDias({ proximos }) {
  if (!proximos || proximos.length === 0) return null

  // Agrupa por data
  const porData = {}
  proximos.forEach(a => {
    if (!porData[a.data]) porData[a.data] = []
    porData[a.data].push(a)
  })

  const dias = Object.keys(porData).sort().slice(0, 4)

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5">
      <h3 className="font-semibold text-slate-800 mb-3 text-sm">Próximos dias</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {dias.map(data => {
          const d = new Date(data + 'T00:00:00')
          const label = d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
          return (
            <div key={data} className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-[11px] text-slate-400 capitalize">{label}</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{porData[data].length}</p>
              <p className="text-[11px] text-slate-400">agendamento{porData[data].length !== 1 ? 's' : ''}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── DASHBOARD ─────────────────────────────────────────────
function Dashboard() {
  const navigate = useNavigate()
  const { config } = useConfig()
  const mod = (key) => config[key] !== '0'
  const [loading, setLoading]               = useState(true)
  const [agendamentos, setAgendamentos]     = useState([])
  const [reforcos, setReforcos]             = useState([])
  const [proximos, setProximos]             = useState([])
  const [receitaHoje, setReceitaHoje]       = useState(0)
  const [internacoesAtivas, setInternacoesAtivas] = useState(0)
  const [consultasMes, setConsultasMes]     = useState(0)
  const [cirurgiasMes, setCirurgiasMes]     = useState(0)

  const carregar = useCallback(async () => {
    try {
      const [agenda, reforcosPend, proximosAg, finHoje, internAtivas, consMes, cirMes] = await Promise.all([
        window.api.agendamentos.buscarPorData(HOJE),
        window.api.vacinas.reforcosPendentes(),
        window.api.agendamentos.proximos(),
        window.api.financeiro.buscarPorPeriodo(HOJE, HOJE),
        window.api.internacoes.ativas(),
        window.api.consultas.totalMes(),
        window.api.cirurgias.totalMes(),
      ])
      setAgendamentos(agenda)
      setReforcos(reforcosPend)
      setProximos(proximosAg.filter(a => a.data > HOJE))
      const receita = finHoje
        .filter(f => f.tipo === 'receita')
        .reduce((s, f) => s + Number(f.valor), 0)
      setReceitaHoje(receita)
      setInternacoesAtivas(internAtivas?.length ?? 0)
      setConsultasMes(consMes?.total ?? 0)
      setCirurgiasMes(cirMes?.total ?? 0)
    } catch (err) {
      console.error('[Dashboard]', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  // Stats derivadas
  const aguardando  = agendamentos.filter(a => ['agendado', 'confirmado'].includes(a.status)).length
  const concluidos  = agendamentos.filter(a => a.status === 'concluido').length
  const dataHoje    = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* ── Saudação + ações rápidas ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{saudacao()}! 👋</h2>
          <p className="text-slate-400 capitalize text-sm mt-0.5">{dataHoje}</p>
        </div>

        {/* Ações rápidas — só exibe módulos ativos */}
        <div className="flex flex-wrap gap-2">
          {mod('mod_agendamentos') && (
            <AcaoRapida label="Agendamento" emoji="📅" onClick={() => navigate('/agendamentos')} cor="bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700" />
          )}
          {mod('mod_consultas') && (
            <AcaoRapida label="Consulta" emoji="🩺" onClick={() => navigate('/consultas')} cor="bg-white text-slate-700 border-slate-200 hover:border-slate-300" />
          )}
          {mod('mod_internacoes') && (
            <AcaoRapida label="Internação" emoji="🏥" onClick={() => navigate('/internacoes')} cor="bg-white text-slate-700 border-slate-200 hover:border-slate-300" />
          )}
          {mod('mod_prescricoes') && (
            <AcaoRapida label="Receituário" emoji="📋" onClick={() => navigate('/prescricoes')} cor="bg-white text-slate-700 border-slate-200 hover:border-slate-300" />
          )}
          {mod('mod_financeiro') && (
            <AcaoRapida label="Financeiro" emoji="💰" onClick={() => navigate('/financeiro')} cor="bg-white text-slate-700 border-slate-200 hover:border-slate-300" />
          )}
        </div>
      </div>

      {/* ── Cards de métricas ─── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Sk key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Na agenda hoje"
            value={agendamentos.length}
            sub={agendamentos.length === 0 ? 'Dia tranquilo!' : `${concluidos} concluído${concluidos !== 1 ? 's' : ''}`}
            icon={CalendarDays}
            cor="bg-blue-50 text-blue-600"
            onClick={() => navigate('/agendamentos')}
          />
          <StatCard
            label="Aguardando"
            value={aguardando}
            sub="pendentes de atendimento"
            icon={Clock}
            cor={aguardando > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}
            onClick={() => navigate('/agendamentos')}
          />
          <StatCard
            label="Receita hoje"
            value={fmtMoeda(receitaHoje)}
            sub={concluidos > 0 ? `${concluidos} atendimento${concluidos !== 1 ? 's' : ''} concluído${concluidos !== 1 ? 's' : ''}` : 'Nenhum concluído ainda'}
            icon={DollarSign}
            cor={receitaHoje > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}
            onClick={() => navigate('/financeiro')}
          />
          <StatCard
            label="Alertas vacinas"
            value={reforcos.length}
            sub={reforcos.length > 0 ? 'reforços nos próx. 30 dias' : 'Tudo em dia!'}
            icon={Syringe}
            cor={reforcos.length > 0 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}
            onClick={() => navigate('/vacinas')}
          />
        </div>
      )}

      {/* ── Cards clínicos (só se pelo menos um estiver ativo) ─── */}
      {(mod('mod_internacoes') || mod('mod_consultas') || mod('mod_cirurgias')) && (
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Sk key={i} className="h-24" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {mod('mod_internacoes') && (
              <StatCard
                label="Internações ativas"
                value={internacoesAtivas}
                sub={internacoesAtivas === 0 ? 'Nenhum internado' : `paciente${internacoesAtivas !== 1 ? 's' : ''} internado${internacoesAtivas !== 1 ? 's' : ''}`}
                icon={BedDouble}
                cor={internacoesAtivas > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}
                onClick={() => navigate('/internacoes')}
              />
            )}
            {mod('mod_consultas') && (
              <StatCard
                label="Consultas no mês"
                value={consultasMes}
                sub="prontuários registrados"
                icon={Stethoscope}
                cor={consultasMes > 0 ? 'bg-sky-50 text-sky-600' : 'bg-slate-50 text-slate-400'}
                onClick={() => navigate('/consultas')}
              />
            )}
            {mod('mod_cirurgias') && (
              <StatCard
                label="Cirurgias no mês"
                value={cirurgiasMes}
                sub="procedimentos realizados"
                icon={Scissors}
                cor={cirurgiasMes > 0 ? 'bg-violet-50 text-violet-600' : 'bg-slate-50 text-slate-400'}
                onClick={() => navigate('/cirurgias')}
              />
            )}
          </div>
        )
      )}

      {/* ── Agenda do dia + Alertas ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Agenda do dia */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <div>
              <h3 className="font-semibold text-slate-800">Agenda de hoje</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Passe o mouse sobre um item para ações rápidas
              </p>
            </div>
            <button
              onClick={() => navigate('/agendamentos')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
            >
              Ver tudo <ChevronRight size={12} />
            </button>
          </div>

          <div className="p-2">
            {loading ? (
              <div className="space-y-2 p-3">
                {[...Array(3)].map((_, i) => <Sk key={i} className="h-14" />)}
              </div>
            ) : agendamentos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-3">
                  <CalendarDays size={22} className="text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-500">Nenhum agendamento hoje</p>
                <p className="text-xs text-slate-300 mt-1">Aproveite para organizar a semana!</p>
                <button
                  onClick={() => navigate('/agendamentos')}
                  className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 transition-colors"
                >
                  <Plus size={13} />
                  Criar agendamento
                </button>
              </div>
            ) : (
              <div>
                {[...agendamentos]
                  .sort((a, b) => a.hora.localeCompare(b.hora))
                  .map(ag => (
                    <AgendaItemDash
                      key={ag.id}
                      ag={ag}
                      onAtualizar={carregar}
                      onVerTudo={() => navigate('/agendamentos')}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Alertas de vacinas */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <h3 className="font-semibold text-slate-800">Alertas</h3>
            <button
              onClick={() => navigate('/vacinas')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
            >
              Ver <ChevronRight size={12} />
            </button>
          </div>

          <div className="p-3 space-y-2">
            {loading ? (
              [...Array(3)].map((_, i) => <Sk key={i} className="h-16" />)
            ) : reforcos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-3">
                  <TrendingUp size={20} className="text-emerald-500" />
                </div>
                <p className="text-sm font-semibold text-slate-600">Tudo em dia!</p>
                <p className="text-xs text-slate-400 mt-1">Sem reforços pendentes</p>
              </div>
            ) : (
              <>
                {reforcos.slice(0, 6).map(v => (
                  <AlertaVacina key={v.id} v={v} />
                ))}
                {reforcos.length > 6 && (
                  <button
                    onClick={() => navigate('/vacinas')}
                    className="w-full text-xs text-center text-emerald-600 hover:text-emerald-700 font-semibold pt-1"
                  >
                    +{reforcos.length - 6} mais alertas →
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Próximos dias ─── */}
      {!loading && proximos.length > 0 && (
        <ProximosDias proximos={proximos} />
      )}

    </div>
  )
}

export default Dashboard
