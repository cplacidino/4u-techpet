import { useState } from 'react'
import { Edit2, CheckCircle2, XCircle, RotateCcw, Clock, Loader2, DollarSign } from 'lucide-react'

// ── Configuração visual por serviço ──────────────────────
const SERVICO_CONFIG = {
  'Banho':             { emoji: '🛁', cor: 'bg-blue-50   text-blue-600'   },
  'Tosa':              { emoji: '✂️', cor: 'bg-purple-50 text-purple-600' },
  'Banho + Tosa':      { emoji: '🛁', cor: 'bg-indigo-50 text-indigo-600' },
  'Consulta':          { emoji: '🩺', cor: 'bg-emerald-50 text-emerald-600' },
  'Vacinação':         { emoji: '💉', cor: 'bg-amber-50  text-amber-600'  },
  'Limpeza Dental':    { emoji: '🦷', cor: 'bg-cyan-50   text-cyan-600'   },
  'default':           { emoji: '🐾', cor: 'bg-slate-50  text-slate-500'  },
}

// ── Configuração visual por status ───────────────────────
const STATUS_CONFIG = {
  agendado:   { label: 'Agendado',   bg: 'bg-blue-50   text-blue-600  border-blue-100'   },
  confirmado: { label: 'Confirmado', bg: 'bg-violet-50 text-violet-600 border-violet-100' },
  concluido:  { label: 'Concluído',  bg: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  cancelado:  { label: 'Cancelado',  bg: 'bg-red-50    text-red-500   border-red-100'    },
}

const ESPECIE_EMOJI = {
  'Cachorro': '🐕', 'Gato': '🐱', 'Pássaro': '🐦',
  'Coelho': '🐰', 'Peixe': '🐠', 'default': '🐾',
}

// ── Modal de conclusão ────────────────────────────────────
function ModalConcluir({ agendamento, onConfirmar, onCancelar }) {
  const [valor, setValor] = useState(
    agendamento.valor != null ? String(agendamento.valor) : ''
  )
  const [salvando, setSalvando] = useState(false)

  async function confirmar() {
    setSalvando(true)
    await onConfirmar(valor ? parseFloat(valor) : null)
    setSalvando(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 mx-auto">
          <CheckCircle2 size={22} className="text-emerald-600" />
        </div>
        <h3 className="text-base font-bold text-slate-800 text-center mb-1">
          Concluir atendimento?
        </h3>
        <p className="text-sm text-slate-400 text-center mb-5">
          <strong className="text-slate-600">{agendamento.nome_pet}</strong>
          {' '}— {agendamento.servico}
        </p>

        {/* Valor cobrado */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Valor cobrado (R$)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
              R$
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={valor}
              onChange={e => setValor(e.target.value)}
              placeholder="0,00"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
            <DollarSign size={11} />
            Será lançado automaticamente no financeiro como receita.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancelar}
            disabled={salvando}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={salvando}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-60"
          >
            {salvando
              ? <Loader2 size={14} className="animate-spin" />
              : <CheckCircle2 size={14} />}
            {salvando ? 'Salvando...' : 'Concluir'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── AgendaItem ────────────────────────────────────────────
function AgendaItem({ agendamento: ag, onEditar, onAtualizar }) {
  const [processando, setProcessando]       = useState(false)
  const [modalConcluir, setModalConcluir]   = useState(false)

  const servicoConfig = SERVICO_CONFIG[ag.servico] || SERVICO_CONFIG.default
  const statusConfig  = STATUS_CONFIG[ag.status]   || STATUS_CONFIG.agendado
  const especieEmoji  = ESPECIE_EMOJI[ag.especie]  || ESPECIE_EMOJI.default

  // ── Ações de status ────────────────────────────────────

  async function confirmar() {
    setProcessando(true)
    try {
      await window.api.agendamentos.atualizarStatus(ag.id, 'confirmado')
      onAtualizar()
    } finally { setProcessando(false) }
  }

  async function cancelar() {
    if (!window.confirm(`Cancelar o agendamento de ${ag.nome_pet}?`)) return
    setProcessando(true)
    try {
      await window.api.agendamentos.atualizarStatus(ag.id, 'cancelado')
      onAtualizar()
    } finally { setProcessando(false) }
  }

  async function reagendar() {
    setProcessando(true)
    try {
      await window.api.agendamentos.atualizarStatus(ag.id, 'agendado')
      onAtualizar()
    } finally { setProcessando(false) }
  }

  async function concluir(valorFinal) {
    setProcessando(true)
    try {
      // 1. Atualiza o valor no agendamento (se mudou)
      if (valorFinal !== ag.valor) {
        await window.api.agendamentos.editar(ag.id, {
          id_pet:      ag.id_pet,
          servico:     ag.servico,
          data:        ag.data,
          hora:        ag.hora,
          status:      'concluido',
          valor:       valorFinal,
          observacoes: ag.observacoes,
        })
      } else {
        await window.api.agendamentos.atualizarStatus(ag.id, 'concluido')
      }

      // 2. Lança no financeiro automaticamente
      if (valorFinal && valorFinal > 0) {
        const hoje = new Date().toISOString().split('T')[0]
        await window.api.financeiro.criar({
          id_agendamento: ag.id,
          descricao: `${ag.servico} — ${ag.nome_pet} (${ag.nome_dono})`,
          valor: valorFinal,
          tipo: 'receita',
          data: hoje,
        })
      }

      setModalConcluir(false)
      onAtualizar()
    } finally { setProcessando(false) }
  }

  const isConcluido  = ag.status === 'concluido'
  const isCancelado  = ag.status === 'cancelado'
  const isAgendado   = ag.status === 'agendado'
  const isConfirmado = ag.status === 'confirmado'
  const isPendente   = isAgendado || isConfirmado

  // Verifica se o horário do agendamento já passou
  const isPast = ag.data && ag.hora
    ? new Date(`${ag.data}T${ag.hora}`) < new Date()
    : false

  return (
    <>
      <div className={`
        group bg-white rounded-2xl border shadow-soft
        transition-all duration-200 hover:shadow-md
        ${isConcluido ? 'border-emerald-100 opacity-80' : ''}
        ${isCancelado ? 'border-slate-100 opacity-60'  : ''}
        ${!isConcluido && !isCancelado ? 'border-slate-100' : ''}
      `}>
        <div className="flex items-stretch">

          {/* Marcador de hora — timeline visual */}
          <div className={`
            flex-shrink-0 w-16 flex flex-col items-center justify-center
            rounded-l-2xl border-r py-4
            ${isConcluido ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}
          `}>
            <span className={`text-base font-bold tabular-nums ${isConcluido ? 'text-emerald-700' : 'text-slate-700'}`}>
              {ag.hora?.slice(0, 5)}
            </span>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 px-4 py-3.5 min-w-0">
            <div className="flex items-start justify-between gap-3">

              {/* Info principal */}
              <div className="min-w-0 flex-1">
                {/* Serviço + pet */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${servicoConfig.cor}`}>
                    <span>{servicoConfig.emoji}</span>
                    {ag.servico}
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {especieEmoji} {ag.nome_pet}
                  </span>
                </div>

                {/* Tutor */}
                <p className="text-xs text-slate-400 mt-1.5 truncate">
                  Tutor: <span className="text-slate-600 font-medium">{ag.nome_dono}</span>
                  {ag.telefone_dono && (
                    <span className="text-slate-400"> · {ag.telefone_dono}</span>
                  )}
                </p>

                {/* Observações */}
                {ag.observacoes && (
                  <p className="text-xs text-slate-400 mt-1 italic truncate">
                    "{ag.observacoes}"
                  </p>
                )}
              </div>

              {/* Coluna direita: status + valor + ações */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                {/* Status badge */}
                <span className={`text-xs px-2.5 py-1 rounded-lg border font-semibold ${statusConfig.bg}`}>
                  {statusConfig.label}
                </span>

                {/* Valor */}
                {ag.valor != null && (
                  <span className="text-sm font-bold text-emerald-700">
                    R$ {Number(ag.valor).toFixed(2).replace('.', ',')}
                  </span>
                )}
              </div>
            </div>

            {/* Ações rápidas */}
            {isPendente && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50 flex-wrap">
                {isPast ? (
                  // Horário já passou — confirmar o que aconteceu
                  <>
                    <span className="flex items-center gap-1 text-amber-500 text-xs font-medium">
                      <Clock size={11} />
                      Horário passou
                    </span>
                    <button
                      onClick={() => setModalConcluir(true)}
                      disabled={processando}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 size={12} />
                      Realizado
                    </button>
                    <button
                      onClick={reagendar}
                      disabled={processando}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                      <RotateCcw size={11} />
                      Reagendar
                    </button>
                    <button
                      onClick={cancelar}
                      disabled={processando}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 border border-red-100 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50 ml-auto"
                    >
                      <XCircle size={12} />
                      Cancelar
                    </button>
                  </>
                ) : (
                  // Horário ainda não passou — ações normais
                  <>
                    {isAgendado && (
                      <button
                        onClick={confirmar}
                        disabled={processando}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-600 border border-violet-100 rounded-lg text-xs font-medium hover:bg-violet-100 transition-colors disabled:opacity-50"
                      >
                        {processando ? <Loader2 size={11} className="animate-spin" /> : null}
                        Confirmar
                      </button>
                    )}
                    <button
                      onClick={() => setModalConcluir(true)}
                      disabled={processando}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 size={12} />
                      Concluir
                    </button>
                    <button
                      onClick={onEditar}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-500 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors"
                    >
                      <Edit2 size={11} />
                      Editar
                    </button>
                    <button
                      onClick={cancelar}
                      disabled={processando}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 border border-red-100 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50 ml-auto"
                    >
                      <XCircle size={12} />
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Reagendar (se cancelado) */}
            {isCancelado && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50">
                <button
                  onClick={reagendar}
                  disabled={processando}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-500 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors"
                >
                  <RotateCcw size={11} />
                  Reagendar
                </button>
                <button
                  onClick={onEditar}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-500 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors"
                >
                  <Edit2 size={11} />
                  Editar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de conclusão */}
      {modalConcluir && (
        <ModalConcluir
          agendamento={ag}
          onConfirmar={concluir}
          onCancelar={() => setModalConcluir(false)}
        />
      )}
    </>
  )
}

export default AgendaItem
