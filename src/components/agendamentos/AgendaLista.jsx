import { useState, useMemo, useEffect } from 'react'
import {
  Plus, ChevronLeft, ChevronRight,
  CalendarDays, LayoutGrid
} from 'lucide-react'
import AgendaItem from './AgendaItem'

// ── Utilitários de data ───────────────────────────────────

function mudarDia(dataStr, delta) {
  const d = new Date(dataStr + 'T00:00:00')
  d.setDate(d.getDate() + delta)
  return d.toISOString().split('T')[0]
}

function formatarDataLonga(dataStr) {
  return new Date(dataStr + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

function getSegundaDaSemana(dataStr) {
  const d = new Date(dataStr + 'T00:00:00')
  const dow = d.getDay() // 0=dom, 1=seg...
  const diff = dow === 0 ? -6 : 1 - dow
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

function getDiasDaSemana(segunda) {
  return Array.from({ length: 7 }, (_, i) => mudarDia(segunda, i))
}

// ── Mini card de estatística ──────────────────────────────

function StatMini({ label, value, cor = 'slate' }) {
  const cores = {
    slate:   'bg-white text-slate-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    blue:    'bg-blue-50 text-blue-700',
    amber:   'bg-amber-50 text-amber-700',
  }
  return (
    <div className={`rounded-xl px-4 py-3 border border-slate-100 ${cores[cor]}`}>
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  )
}

const STATUS_TABS = [
  { key: 'todos',      label: 'Todos' },
  { key: 'agendado',   label: 'Agendado' },
  { key: 'confirmado', label: 'Confirmado' },
  { key: 'concluido',  label: 'Concluído' },
  { key: 'cancelado',  label: 'Cancelado' },
]

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

// ── Visão semanal ─────────────────────────────────────────

function AgendaSemanal({ dataSelecionada, onDataChange }) {
  const hoje = new Date().toISOString().split('T')[0]
  const [segunda, setSegunda] = useState(getSegundaDaSemana(dataSelecionada))
  const [agendaSemana, setAgendaSemana] = useState([])
  const [carregando, setCarregando] = useState(true)

  const dias = getDiasDaSemana(segunda)
  const ultimoDia = dias[6]

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      try {
        // Busca todos e filtra pela semana no client
        const todos = await window.api.agendamentos.listar()
        const daSemana = todos.filter(a => a.data >= segunda && a.data <= ultimoDia)
        setAgendaSemana(daSemana)
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [segunda, ultimoDia])

  function navSemana(delta) {
    setSegunda(s => mudarDia(s, delta * 7))
  }

  function labelSemana() {
    const ini = new Date(segunda + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
    const fim = new Date(ultimoDia + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
    return `${ini} — ${fim}`
  }

  const agsPorDia = useMemo(() => {
    const map = {}
    dias.forEach(d => { map[d] = agendaSemana.filter(a => a.data === d) })
    return map
  }, [agendaSemana, dias])

  const STATUS_COR = {
    agendado:   'bg-blue-400',
    confirmado: 'bg-emerald-400',
    concluido:  'bg-slate-300',
    cancelado:  'bg-red-300',
  }

  return (
    <div className="space-y-5">
      {/* Cabeçalho semana */}
      <div className="flex items-center gap-3">
        <button onClick={() => navSemana(-1)} className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:border-slate-300 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="flex-1 text-center text-sm font-medium text-slate-700">{labelSemana()}</span>
        <button onClick={() => navSemana(1)} className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:border-slate-300 transition-colors">
          <ChevronRight size={16} />
        </button>
        <button
          onClick={() => setSegunda(getSegundaDaSemana(hoje))}
          className="px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors"
        >
          Esta semana
        </button>
      </div>

      {/* Grade semanal */}
      {carregando ? (
        <div className="grid grid-cols-7 gap-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-48 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {dias.map((dia, idx) => {
            const ags = agsPorDia[dia] || []
            const isHoje = dia === hoje
            const isSelecionado = dia === dataSelecionada
            const pendentes = ags.filter(a => ['agendado', 'confirmado'].includes(a.status))
            const d = new Date(dia + 'T00:00:00')

            return (
              <button
                key={dia}
                onClick={() => { onDataChange(dia) }}
                className={`flex flex-col rounded-2xl border p-3 text-left transition-all hover:shadow-md hover:-translate-y-0.5 ${
                  isHoje
                    ? 'bg-emerald-50 border-emerald-200'
                    : isSelecionado
                    ? 'bg-slate-50 border-slate-300'
                    : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                {/* Nome do dia */}
                <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${isHoje ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {DIAS_SEMANA[idx]}
                </p>
                {/* Número do dia */}
                <p className={`text-xl font-bold mb-3 ${isHoje ? 'text-emerald-700' : 'text-slate-700'}`}>
                  {d.getDate()}
                </p>

                {/* Agendamentos */}
                {ags.length === 0 ? (
                  <p className="text-[10px] text-slate-300 mt-auto">livre</p>
                ) : (
                  <div className="space-y-1 w-full">
                    {ags.slice(0, 4).map(a => (
                      <div key={a.id} className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_COR[a.status] || 'bg-slate-300'}`} />
                        <p className="text-[10px] text-slate-600 truncate leading-tight">{a.hora} {a.nome_pet}</p>
                      </div>
                    ))}
                    {ags.length > 4 && (
                      <p className="text-[10px] text-slate-400">+{ags.length - 4} mais</p>
                    )}
                  </div>
                )}

                {/* Badge total */}
                {ags.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100 w-full flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">{ags.length} agend.</span>
                    {pendentes.length > 0 && (
                      <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
                        {pendentes.length} pend.
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Resumo da semana */}
      {!carregando && (
        <div className="grid grid-cols-4 gap-3">
          <StatMini label="Total na semana" value={agendaSemana.length} />
          <StatMini label="Pendentes" value={agendaSemana.filter(a => ['agendado','confirmado'].includes(a.status)).length} cor="blue" />
          <StatMini label="Concluídos" value={agendaSemana.filter(a => a.status === 'concluido').length} cor="emerald" />
          <StatMini
            label="Receita da semana"
            value={`R$ ${agendaSemana.filter(a => a.status === 'concluido' && a.valor).reduce((s,a) => s + Number(a.valor), 0).toFixed(2).replace('.', ',')}`}
            cor="emerald"
          />
        </div>
      )}
    </div>
  )
}

// ── AgendaLista (visão diária) ────────────────────────────

function AgendaLista({
  agendamentos, loading, dataSelecionada,
  onDataChange, onNovo, onEditar, onAtualizar
}) {
  const [statusFiltro, setStatusFiltro] = useState('todos')
  const [viewMode, setViewMode] = useState('dia') // 'dia' | 'semana'
  const hoje = new Date().toISOString().split('T')[0]
  const ehHoje = dataSelecionada === hoje

  const stats = useMemo(() => {
    const pendentes  = agendamentos.filter(a => ['agendado', 'confirmado'].includes(a.status)).length
    const concluidos = agendamentos.filter(a => a.status === 'concluido').length
    const receita    = agendamentos.filter(a => a.status === 'concluido' && a.valor).reduce((s, a) => s + Number(a.valor), 0)
    return { pendentes, concluidos, receita }
  }, [agendamentos])

  const filtrados = useMemo(() => {
    const base = statusFiltro === 'todos' ? agendamentos : agendamentos.filter(a => a.status === statusFiltro)
    return [...base].sort((a, b) => a.hora.localeCompare(b.hora))
  }, [agendamentos, statusFiltro])

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Agendamentos</h2>
          <p className="text-sm text-slate-400 mt-0.5 capitalize">
            {viewMode === 'semana' ? 'Visão semanal' : formatarDataLonga(dataSelecionada)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle Dia / Semana */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('dia')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${viewMode === 'dia' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
            >
              <CalendarDays size={13} />
              Dia
            </button>
            <button
              onClick={() => setViewMode('semana')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${viewMode === 'semana' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
            >
              <LayoutGrid size={13} />
              Semana
            </button>
          </div>
          <button
            onClick={onNovo}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <Plus size={16} />
            Novo
          </button>
        </div>
      </div>

      {/* ── Visão Semanal ── */}
      {viewMode === 'semana' && (
        <AgendaSemanal
          dataSelecionada={dataSelecionada}
          onDataChange={(dia) => { onDataChange(dia); setViewMode('dia') }}
          onNovo={onNovo}
        />
      )}

      {/* ── Visão Diária ── */}
      {viewMode === 'dia' && (
        <>
          {/* Navegação de data */}
          <div className="flex items-center gap-2">
            <button onClick={() => onDataChange(mudarDia(dataSelecionada, -1))} className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors flex-shrink-0">
              <ChevronLeft size={16} />
            </button>
            <div className="relative flex-1">
              <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={dataSelecionada}
                onChange={e => e.target.value && onDataChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center"
              />
            </div>
            <button onClick={() => onDataChange(mudarDia(dataSelecionada, 1))} className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors flex-shrink-0">
              <ChevronRight size={16} />
            </button>
            {!ehHoje && (
              <button onClick={() => onDataChange(hoje)} className="px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors flex-shrink-0">
                Hoje
              </button>
            )}
          </div>

          {/* Stats do dia */}
          {agendamentos.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              <StatMini label="Total do dia"  value={agendamentos.length} />
              <StatMini label="Pendentes"     value={stats.pendentes}     cor="blue" />
              <StatMini label="Concluídos"    value={stats.concluidos}    cor="emerald" />
              <StatMini label="Receita do dia" value={`R$ ${stats.receita.toFixed(2).replace('.', ',')}`} cor={stats.receita > 0 ? 'emerald' : 'slate'} />
            </div>
          )}

          {/* Filtro por status */}
          {agendamentos.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {STATUS_TABS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setStatusFiltro(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    statusFiltro === f.key
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* Lista */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse" />
              ))}
            </div>
          ) : filtrados.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-soft">
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <CalendarDays size={24} className="text-blue-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-700 mb-1">
                  {agendamentos.length === 0 ? 'Nenhum agendamento neste dia' : 'Nenhum agendamento com esse status'}
                </h3>
                <p className="text-sm text-slate-400 max-w-xs">
                  {agendamentos.length === 0 && ehHoje
                    ? 'Que tal criar o primeiro atendimento do dia?'
                    : agendamentos.length === 0
                    ? 'Navegue para outro dia ou crie um novo agendamento.'
                    : 'Tente selecionar outro filtro.'}
                </p>
                {agendamentos.length === 0 && (
                  <button onClick={onNovo} className="mt-4 flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
                    <Plus size={15} />Criar agendamento
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filtrados.map(ag => (
                <AgendaItem
                  key={ag.id}
                  agendamento={ag}
                  onEditar={() => onEditar(ag)}
                  onAtualizar={onAtualizar}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AgendaLista
