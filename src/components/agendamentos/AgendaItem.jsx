import { useState } from 'react'
import { Edit2, CheckCircle2, XCircle, RotateCcw, Clock, Loader2, DollarSign, MessageCircle, Trash2, Eye, EyeOff, Lock } from 'lucide-react'

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
  excluido:   { label: 'Excluído',   bg: 'bg-slate-100 text-slate-400 border-slate-200'  },
}

const ESPECIE_EMOJI = {
  'Cachorro': '🐕', 'Gato': '🐱', 'Pássaro': '🐦',
  'Coelho': '🐰', 'Peixe': '🐠', 'default': '🐾',
}

// ── Modal de conclusão ────────────────────────────────────
function ModalConcluir({ agendamento, onConfirmar, onCancelar }) {
  // Detecta se este agendamento veio de um plano de assinatura
  const ehDePlano = agendamento.observacoes && agendamento.observacoes.startsWith('[Plano:')

  const [valor, setValor]           = useState(agendamento.valor != null ? String(agendamento.valor) : '')
  const [tipoPgto, setTipoPgto]     = useState('vista')
  const [vencimento, setVencimento] = useState('')
  const [observacoes, setObservacoes] = useState(agendamento.observacoes || '')
  const [salvando, setSalvando]     = useState(false)

  async function confirmar() {
    setSalvando(true)
    // Se for de plano, não cobra valor extra (já está no plano)
    await onConfirmar(ehDePlano ? null : (valor ? parseFloat(valor) : null), tipoPgto, vencimento, observacoes)
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

        {/* Aviso quando é de plano */}
        {ehDePlano ? (
          <div className="mb-5 px-4 py-3 bg-purple-50 border border-purple-200 rounded-xl flex items-start gap-2">
            <DollarSign size={14} className="text-purple-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-purple-700">Serviço do plano de assinatura</p>
              <p className="text-xs text-purple-600 mt-0.5">
                {agendamento.observacoes.replace('[Plano:', '').replace(']', '').trim()}
              </p>
              <p className="text-xs text-purple-500 mt-1">Pagamento já incluso no plano — não será cobrado separadamente.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Valor cobrado */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Valor cobrado (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">R$</span>
                <input
                  type="number" step="0.01" min="0"
                  value={valor} onChange={e => setValor(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Tipo de pagamento */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Forma de pagamento</label>
              <div className="flex gap-2">
                <button onClick={() => setTipoPgto('vista')}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${tipoPgto === 'vista' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                  À Vista
                </button>
                <button onClick={() => setTipoPgto('prazo')}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${tipoPgto === 'prazo' ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                  Fiado / A Prazo
                </button>
              </div>
            </div>

            {/* Vencimento (só quando fiado) */}
            {tipoPgto === 'prazo' && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Data de vencimento</label>
                <input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}

            <p className="text-xs text-slate-400 mb-4 flex items-center gap-1">
              <DollarSign size={11} />
              {tipoPgto === 'vista'
                ? 'Lançado no financeiro como receita imediatamente.'
                : 'Registrado como fiado. Entra no financeiro ao receber.'}
            </p>
          </>
        )}

        {/* Observações do atendimento */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Observações do atendimento</label>
          <textarea
            value={observacoes}
            onChange={e => setObservacoes(e.target.value)}
            placeholder="Ex: animal bem disposto, retorno em 15 dias, vacina aplicada..."
            rows={3}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onCancelar} disabled={salvando}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={confirmar} disabled={salvando}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-60">
            {salvando ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {salvando ? 'Salvando...' : 'Concluir'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal de exclusão com senha ───────────────────────────
function ModalExcluir({ agendamento, onConfirmar, onCancelar }) {
  const [senha, setSenha]           = useState('')
  const [mostrar, setMostrar]       = useState(false)
  const [erro, setErro]             = useState('')
  const [verificando, setVerificando] = useState(false)

  async function confirmar(e) {
    e.preventDefault()
    if (!senha) return
    setVerificando(true)
    setErro('')
    try {
      const res = await window.api.auth.verificarSenha(senha)
      if (res.ok) {
        onConfirmar()
      } else {
        setErro('Senha incorreta.')
        setSenha('')
      }
    } finally {
      setVerificando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4 mx-auto">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <h3 className="text-base font-bold text-slate-800 text-center mb-1">Excluir agendamento?</h3>
        <p className="text-sm text-slate-400 text-center mb-1">
          <strong>{agendamento.servico}</strong> — {agendamento.nome_pet}
        </p>
        <p className="text-xs text-red-500 text-center mb-5 bg-red-50 rounded-xl px-3 py-2">
          O valor de <strong>R$ {Number(agendamento.valor || 0).toFixed(2).replace('.', ',')}</strong> será removido da receita.
        </p>
        <form onSubmit={confirmar} className="space-y-3">
          <div className="relative">
            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={mostrar ? 'text' : 'password'}
              placeholder="Digite a senha para confirmar"
              value={senha}
              onChange={e => { setSenha(e.target.value); setErro('') }}
              autoFocus
              className={`w-full pl-9 pr-10 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 ${erro ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
            />
            <button type="button" onClick={() => setMostrar(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {mostrar ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {erro && <p className="text-xs text-red-500">{erro}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onCancelar} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={verificando || !senha} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors">
              {verificando ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              {verificando ? 'Verificando...' : 'Excluir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── AgendaItem ────────────────────────────────────────────
function AgendaItem({ agendamento: ag, onEditar, onAtualizar }) {
  const [processando, setProcessando]       = useState(false)
  const [modalConcluir, setModalConcluir]   = useState(false)
  const [modalExcluir, setModalExcluir]     = useState(false)

  const servicoConfig = SERVICO_CONFIG[ag.servico] || SERVICO_CONFIG.default
  const statusConfig  = STATUS_CONFIG[ag.status]   || STATUS_CONFIG.agendado
  const especieEmoji  = ESPECIE_EMOJI[ag.especie]  || ESPECIE_EMOJI.default

  // Detecta se veio de plano de assinatura (observacoes começa com [Plano:...])
  const ehDePlano = ag.observacoes && ag.observacoes.startsWith('[Plano:')
  const nomePlano = ehDePlano
    ? ag.observacoes.match(/\[Plano:(?:\d+:)?\s*([^·\]]+)/)?.[1]?.trim() || 'Plano'
    : null

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

  async function excluir() {
    setProcessando(true)
    try {
      await window.api.agendamentos.excluir(ag.id)
      setModalExcluir(false)
      onAtualizar()
    } finally { setProcessando(false) }
  }

  async function concluir(valorFinal, tipoPgto, vencimento, observacoes) {
    setProcessando(true)
    try {
      // 1. Atualiza status e valor no agendamento
      await window.api.agendamentos.editar(ag.id, {
        id_pet:      ag.id_pet,
        servico:     ag.servico,
        data:        ag.data,
        hora:        ag.hora,
        status:      'concluido',
        valor:       valorFinal,
        observacoes: observacoes || ag.observacoes || null,
      })

      if (valorFinal && valorFinal > 0) {
        const hoje = new Date().toISOString().split('T')[0]
        const descricao = `${ag.servico} — ${ag.nome_pet} (${ag.nome_dono})`

        if (tipoPgto === 'vista') {
          // À vista: lança no financeiro imediatamente
          await window.api.financeiro.criar({
            id_agendamento: ag.id,
            descricao,
            valor: valorFinal,
            tipo: 'receita',
            data: hoje,
          })
        } else {
          // Fiado: cria conta a receber
          await window.api.fiado.criar({
            id_dono:        ag.id_dono,
            descricao,
            valor_total:    valorFinal,
            data_vencimento: vencimento || null,
            origem:         'servico',
            id_agendamento: ag.id,
          })
        }
      }

      setModalConcluir(false)
      onAtualizar()
    } finally { setProcessando(false) }
  }

  const isConcluido  = ag.status === 'concluido'
  const isCancelado  = ag.status === 'cancelado'
  const isExcluido   = ag.status === 'excluido'
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
        ${isExcluido  ? 'border-slate-100 opacity-40'  : ''}
        ${!isConcluido && !isCancelado && !isExcluido ? 'border-slate-100' : ''}
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
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <p className="text-xs text-slate-400">
                    Tutor: <span className="text-slate-600 font-medium">{ag.nome_dono}</span>
                    {ag.telefone_dono && (
                      <span className="text-slate-400"> · {ag.telefone_dono}</span>
                    )}
                  </p>
                  {ag.telefone_dono && (
                    <a
                      href={`https://wa.me/55${ag.telefone_dono.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Abrir WhatsApp"
                      className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 text-green-600 border border-green-200 rounded-md text-[10px] font-medium hover:bg-green-100 transition-colors"
                    >
                      <MessageCircle size={10} />
                      WhatsApp
                    </a>
                  )}
                </div>

                {/* Badge de plano de assinatura */}
                {ehDePlano && (
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-semibold rounded-full">
                    📋 Plano: {nomePlano}
                  </span>
                )}

                {/* Observações (não duplica o texto do plano) */}
                {ag.observacoes && !ehDePlano && (
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

            {/* Excluir (se concluído) */}
            {isConcluido && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50">
                <button
                  onClick={() => setModalExcluir(true)}
                  disabled={processando}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 border border-red-100 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50 ml-auto"
                >
                  <Trash2 size={11} />
                  Excluir
                </button>
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

      {/* Modal de exclusão */}
      {modalExcluir && (
        <ModalExcluir
          agendamento={ag}
          onConfirmar={excluir}
          onCancelar={() => setModalExcluir(false)}
        />
      )}
    </>
  )
}

export default AgendaItem
