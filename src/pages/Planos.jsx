import { useState, useEffect, useCallback } from 'react'
import {
  ClipboardList, Plus, ChevronDown, ChevronUp,
  CheckCircle, Clock, AlertTriangle, XCircle,
  Pencil, Trash2, PauseCircle, PlayCircle, BadgeCheck
} from 'lucide-react'

// ─── Utilitários ────────────────────────────────────────────────────────────

const SERVICOS = ['Banho', 'Tosa', 'Banho e Tosa', 'Consulta', 'Vacina', 'Hidratação', 'Tosa Higiênica', 'Outros']

function fmtData(d) {
  if (!d) return '—'
  const [a, m, dia] = d.split('-')
  return `${dia}/${m}/${a}`
}
function fmtMoeda(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function fmtCompetencia(c) {
  if (!c) return '—'
  const [a, m] = c.split('-')
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${meses[parseInt(m) - 1]}/${a}`
}

// ─── Badges ──────────────────────────────────────────────────────────────────

function BadgeStatus({ status }) {
  const map = {
    ativo:     { cor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Ativo' },
    pausado:   { cor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',   label: 'Pausado' },
    cancelado: { cor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',               label: 'Cancelado' },
    pago:      { cor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Pago' },
    pendente:  { cor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',   label: 'Pendente' },
    atrasado:  { cor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',               label: 'Atrasado' },
  }
  const { cor, label } = map[status] || { cor: 'bg-slate-100 text-slate-600', label: status }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cor}`}>{label}</span>
}

// ─── Barra de progresso de uso ───────────────────────────────────────────────

function BarraUso({ usada, total, servico }) {
  const pct = total > 0 ? Math.min((usada / total) * 100, 100) : 0
  const cor = pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-yellow-500' : 'bg-emerald-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-600 dark:text-slate-400">{servico}</span>
        <span className="font-medium text-slate-700 dark:text-slate-300">{usada}/{total}</span>
      </div>
      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${cor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-slate-500">{total - usada} restante{total - usada !== 1 ? 's' : ''}</p>
    </div>
  )
}

// ─── Modal Tipo de Plano ─────────────────────────────────────────────────────

function ModalTipo({ tipo, onSalvar, onFechar }) {
  const [form, setForm] = useState({
    nome: tipo?.nome || '',
    descricao: tipo?.descricao || '',
    valor: tipo?.valor || '',
    ativo: tipo?.ativo ?? 1,
    itens: tipo?.itens || [{ servico: 'Banho', quantidade: 1 }],
  })

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function addItem() { setForm(f => ({ ...f, itens: [...f.itens, { servico: 'Banho', quantidade: 1 }] })) }
  function removeItem(i) { setForm(f => ({ ...f, itens: f.itens.filter((_, idx) => idx !== i) })) }
  function setItem(i, k, v) {
    setForm(f => ({ ...f, itens: f.itens.map((it, idx) => idx === i ? { ...it, [k]: v } : it) }))
  }

  async function salvar() {
    if (!form.nome || !form.valor) return alert('Preencha nome e valor.')
    if (form.itens.length === 0) return alert('Adicione pelo menos um serviço.')
    await onSalvar({ ...form, valor: parseFloat(form.valor), itens: form.itens.map(it => ({ ...it, quantidade: parseInt(it.quantidade) })) })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-slate-800 dark:text-slate-100">{tipo ? 'Editar Tipo de Plano' : 'Novo Tipo de Plano'}</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Nome do plano</label>
            <input className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:border-emerald-500"
              value={form.nome} onChange={e => setField('nome', e.target.value)} placeholder="Ex: Plano Banho e Tosa Mensal" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Descrição (opcional)</label>
            <input className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:border-emerald-500"
              value={form.descricao} onChange={e => setField('descricao', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Valor mensal (R$)</label>
            <input type="number" min="0" step="0.01" className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:border-emerald-500"
              value={form.valor} onChange={e => setField('valor', e.target.value)} placeholder="150.00" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-500">Serviços incluídos</label>
              <button onClick={addItem} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                <Plus size={12} /> Adicionar
              </button>
            </div>
            <div className="space-y-2">
              {form.itens.map((it, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select value={it.servico} onChange={e => setItem(i, 'servico', e.target.value)}
                    className="flex-1 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none">
                    {SERVICOS.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <input type="number" min="1" max="99" value={it.quantidade} onChange={e => setItem(i, 'quantidade', e.target.value)}
                    className="w-16 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-sm text-center bg-white dark:bg-slate-700 dark:text-white focus:outline-none" />
                  <span className="text-xs text-slate-400">vez(es)</span>
                  <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
          <button onClick={onFechar} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg">Cancelar</button>
          <button onClick={salvar} className="px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium">Salvar</button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Nova Assinatura ───────────────────────────────────────────────────

function ModalAssinatura({ tipos, onSalvar, onFechar }) {
  const [donos, setDonos] = useState([])
  const [pets, setPets] = useState([])
  const [form, setForm] = useState({ id_dono: '', id_pet: '', id_plano_tipo: tipos[0]?.id || '', data_inicio: new Date().toISOString().split('T')[0], dia_vencimento: 10, observacoes: '' })

  useEffect(() => { window.api.donos.listar().then(setDonos) }, [])
  useEffect(() => {
    if (!form.id_dono) return setPets([])
    window.api.pets.buscarPorDono(form.id_dono).then(setPets)
  }, [form.id_dono])

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function salvar() {
    if (!form.id_dono || !form.id_plano_tipo) return alert('Selecione o cliente e o plano.')
    await onSalvar({
      ...form,
      id_dono: parseInt(form.id_dono),
      id_pet: form.id_pet ? parseInt(form.id_pet) : null,
      id_plano_tipo: parseInt(form.id_plano_tipo),
      dia_vencimento: parseInt(form.dia_vencimento),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-slate-800 dark:text-slate-100">Nova Assinatura</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Cliente</label>
            <select value={form.id_dono} onChange={e => setField('id_dono', e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none">
              <option value="">Selecione...</option>
              {donos.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Pet (opcional)</label>
            <select value={form.id_pet} onChange={e => setField('id_pet', e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none">
              <option value="">Todos os pets do cliente</option>
              {pets.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tipo de plano</label>
            <select value={form.id_plano_tipo} onChange={e => setField('id_plano_tipo', e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none">
              {tipos.filter(t => t.ativo).map(t => <option key={t.id} value={t.id}>{t.nome} — {fmtMoeda(t.valor)}/mês</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Data de início</label>
              <input type="date" value={form.data_inicio} onChange={e => setField('data_inicio', e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Dia de vencimento</label>
              <input type="number" min="1" max="28" value={form.dia_vencimento} onChange={e => setField('dia_vencimento', e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Observações</label>
            <input value={form.observacoes} onChange={e => setField('observacoes', e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none" />
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
          <button onClick={onFechar} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg">Cancelar</button>
          <button onClick={salvar} className="px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium">Criar assinatura</button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Registrar Uso ─────────────────────────────────────────────────────

function ModalUso({ assinatura, resumo, onSalvar, onFechar }) {
  const servicosDisponiveis = (resumo?.resumo || []).filter(r => r.quantidade_restante > 0)
  const [servico, setServico] = useState(servicosDisponiveis[0]?.servico || '')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [obs, setObs] = useState('')

  async function salvar() {
    if (!servico) return alert('Selecione o serviço.')
    await onSalvar({ id_ciclo: resumo.ciclo.id, servico, data_uso: data, observacoes: obs, id_agendamento: null })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-slate-800 dark:text-slate-100">Registrar Uso de Serviço</h2>
          <p className="text-xs text-slate-500 mt-0.5">{assinatura.nome_dono} · {assinatura.nome_pet || 'Todos os pets'}</p>
        </div>
        <div className="p-5 space-y-4">
          {servicosDisponiveis.length === 0 ? (
            <p className="text-sm text-red-500 text-center py-2">Todos os serviços deste ciclo já foram utilizados.</p>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Serviço</label>
                <select value={servico} onChange={e => setServico(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none">
                  {servicosDisponiveis.map(r => (
                    <option key={r.servico} value={r.servico}>{r.servico} ({r.quantidade_restante} restante{r.quantidade_restante !== 1 ? 's' : ''})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Data</label>
                <input type="date" value={data} onChange={e => setData(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Observações</label>
                <input value={obs} onChange={e => setObs(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none" />
              </div>
            </>
          )}
        </div>
        <div className="p-5 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
          <button onClick={onFechar} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg">Fechar</button>
          {servicosDisponiveis.length > 0 && (
            <button onClick={salvar} className="px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium">Registrar</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Card de Assinatura ──────────────────────────────────────────────────────

function CardAssinatura({ assinatura, onRecarregar }) {
  const [aberto, setAberto] = useState(false)
  const [resumo, setResumo] = useState(null)
  const [modalUso, setModalUso] = useState(false)

  const carregarResumo = useCallback(async () => {
    const r = await window.api.planos.resumoCicloAtual(assinatura.id)
    setResumo(r)
  }, [assinatura.id])

  useEffect(() => { if (aberto) carregarResumo() }, [aberto, carregarResumo])

  const cicloAtual = resumo?.ciclo
  const cicloAtrasado = cicloAtual && cicloAtual.status === 'pendente' && cicloAtual.data_vencimento < new Date().toISOString().split('T')[0]

  async function confirmarPagamento() {
    if (!cicloAtual) return
    if (!confirm(`Confirmar pagamento de ${fmtMoeda(cicloAtual.valor)}? Será lançado automaticamente no financeiro como receita.`)) return
    await window.api.planos.confirmarPagamento(cicloAtual.id)
    await carregarResumo()
    onRecarregar()
  }

  async function alterarStatus(s) {
    if (!confirm(`${s === 'cancelado' ? 'Cancelar' : s === 'pausado' ? 'Pausar' : 'Reativar'} esta assinatura?`)) return
    await window.api.planos.alterarStatus(assinatura.id, s)
    onRecarregar()
  }

  async function registrarUso(dados) {
    await window.api.planos.registrarUso(dados)
    setModalUso(false)
    await carregarResumo()
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border ${cicloAtrasado ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'} shadow-sm`}>
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setAberto(!aberto)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{assinatura.nome_dono}</span>
            {assinatura.nome_pet && <span className="text-xs text-slate-400">· {assinatura.nome_pet}</span>}
            <BadgeStatus status={assinatura.status} />
            {cicloAtrasado && <span className="flex items-center gap-1 text-xs text-red-600"><AlertTriangle size={11} />Pagamento em atraso</span>}
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-xs text-slate-500">{assinatura.nome_plano}</span>
            <span className="text-xs font-medium text-emerald-600">{fmtMoeda(assinatura.valor_plano)}/mês</span>
            <span className="text-xs text-slate-400">Vence dia {assinatura.dia_vencimento}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {assinatura.status === 'ativo' && cicloAtual?.status === 'pendente' && (
            <button onClick={e => { e.stopPropagation(); confirmarPagamento() }}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs rounded-lg font-medium">
              <BadgeCheck size={13} /> Confirmar pagamento
            </button>
          )}
          {aberto ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </div>

      {/* Detalhes expandidos */}
      {aberto && (
        <div className="border-t border-slate-100 dark:border-slate-700 p-4 space-y-4">
          {/* Ciclo atual */}
          {cicloAtual ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Ciclo {fmtCompetencia(cicloAtual.competencia)}
                </h4>
                <div className="flex items-center gap-2">
                  <BadgeStatus status={cicloAtual.status === 'pendente' && cicloAtrasado ? 'atrasado' : cicloAtual.status} />
                  {cicloAtual.status !== 'pago' && assinatura.status === 'ativo' && (
                    <button onClick={() => setModalUso(true)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 text-blue-600 text-xs rounded-lg font-medium">
                      <Plus size={11} /> Registrar uso
                    </button>
                  )}
                </div>
              </div>

              {resumo?.resumo?.length > 0 && (
                <div className="space-y-3">
                  {resumo.resumo.map(r => (
                    <BarraUso key={r.servico} servico={r.servico} usada={r.quantidade_usada} total={r.quantidade_plano} />
                  ))}
                </div>
              )}

              {cicloAtual.data_pagamento && (
                <p className="text-xs text-slate-400 mt-2">Pago em {fmtData(cicloAtual.data_pagamento)}</p>
              )}
              {cicloAtual.status === 'pendente' && (
                <p className="text-xs text-slate-400 mt-2">Vencimento: {fmtData(cicloAtual.data_vencimento)}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-2">Nenhum ciclo ativo no momento.</p>
          )}

          {/* Histórico de usos */}
          {resumo?.usos?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Histórico do ciclo</h4>
              <div className="space-y-1">
                {resumo.usos.map(u => (
                  <div key={u.id} className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 py-1 border-b border-slate-50 dark:border-slate-700">
                    <span className="flex items-center gap-1.5"><CheckCircle size={11} className="text-emerald-500" />{u.servico}</span>
                    <div className="flex items-center gap-2">
                      <span>{fmtData(u.data_uso)}</span>
                      <button onClick={async () => { await window.api.planos.deletarUso(u.id); carregarResumo() }}
                        className="text-red-400 hover:text-red-600"><Trash2 size={11} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ações da assinatura */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <span className="text-xs text-slate-400 mr-auto">Desde {fmtData(assinatura.data_inicio)}</span>
            {assinatura.status === 'ativo' && (
              <button onClick={() => alterarStatus('pausado')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <PauseCircle size={11} /> Pausar
              </button>
            )}
            {assinatura.status === 'pausado' && (
              <button onClick={() => alterarStatus('ativo')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <PlayCircle size={11} /> Reativar
              </button>
            )}
            {assinatura.status !== 'cancelado' && (
              <button onClick={() => alterarStatus('cancelado')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <XCircle size={11} /> Cancelar
              </button>
            )}
          </div>
        </div>
      )}

      {modalUso && resumo && (
        <ModalUso assinatura={assinatura} resumo={resumo} onSalvar={registrarUso} onFechar={() => setModalUso(false)} />
      )}
    </div>
  )
}

// ─── Página Principal ────────────────────────────────────────────────────────

export default function Planos() {
  const [aba, setAba] = useState('assinaturas')
  const [assinaturas, setAssinaturas] = useState([])
  const [tipos, setTipos] = useState([])
  const [filtro, setFiltro] = useState('ativo')
  const [modalTipo, setModalTipo] = useState(null)     // null | 'novo' | objeto
  const [modalAssin, setModalAssin] = useState(false)

  const carregar = useCallback(async () => {
    const [a, t] = await Promise.all([
      window.api.planos.listarAssinaturas(),
      window.api.planos.listarTipos(),
    ])
    setAssinaturas(a)
    setTipos(t)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function salvarTipo(dados) {
    if (modalTipo && modalTipo !== 'novo') {
      await window.api.planos.editarTipo(modalTipo.id, dados)
    } else {
      await window.api.planos.criarTipo(dados)
    }
    setModalTipo(null)
    carregar()
  }

  async function deletarTipo(id) {
    if (!confirm('Excluir este tipo de plano? Assinaturas existentes não serão afetadas.')) return
    await window.api.planos.deletarTipo(id)
    carregar()
  }

  async function salvarAssinatura(dados) {
    await window.api.planos.criarAssinatura(dados)
    setModalAssin(false)
    carregar()
  }

  const assinaturasFiltradas = assinaturas.filter(a => filtro === 'todos' || a.status === filtro)

  const resumoTotais = {
    ativos: assinaturas.filter(a => a.status === 'ativo').length,
    receita: assinaturas.filter(a => a.status === 'ativo').reduce((s, a) => s + a.valor_plano, 0),
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
            <ClipboardList size={20} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Planos</h1>
            <p className="text-xs text-slate-500">{resumoTotais.ativos} assinaturas ativas · {fmtMoeda(resumoTotais.receita)}/mês</p>
          </div>
        </div>
        <button onClick={() => setModalAssin(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-xl font-medium shadow-sm">
          <Plus size={16} /> Nova assinatura
        </button>
      </div>

      {/* Abas */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {[['assinaturas', 'Assinaturas'], ['tipos', 'Tipos de Plano']].map(([k, l]) => (
          <button key={k} onClick={() => setAba(k)}
            className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${aba === k ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Aba: Assinaturas */}
      {aba === 'assinaturas' && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex gap-2 flex-wrap">
            {[['ativo', 'Ativos'], ['pausado', 'Pausados'], ['cancelado', 'Cancelados'], ['todos', 'Todos']].map(([k, l]) => (
              <button key={k} onClick={() => setFiltro(k)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${filtro === k ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}>
                {l}
              </button>
            ))}
          </div>

          {assinaturasFiltradas.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhuma assinatura encontrada</p>
              <p className="text-sm mt-1">Clique em "Nova assinatura" para começar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assinaturasFiltradas.map(a => (
                <CardAssinatura key={a.id} assinatura={a} onRecarregar={carregar} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Aba: Tipos de Plano */}
      {aba === 'tipos' && (
        <div className="space-y-4">
          <button onClick={() => setModalTipo('novo')}
            className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 hover:border-purple-400 hover:text-purple-600 text-sm rounded-xl w-full justify-center transition-colors">
            <Plus size={16} /> Criar novo tipo de plano
          </button>

          {tipos.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">Nenhum tipo de plano cadastrado.</p>
          ) : (
            <div className="space-y-3">
              {tipos.map(t => (
                <div key={t.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{t.nome}</span>
                        {!t.ativo && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Inativo</span>}
                      </div>
                      {t.descricao && <p className="text-xs text-slate-500 mt-0.5">{t.descricao}</p>}
                      <p className="text-sm font-bold text-emerald-600 mt-1">{fmtMoeda(t.valor)}<span className="text-xs font-normal text-slate-400">/mês</span></p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(t.itens || []).map(it => (
                          <span key={it.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                            {it.quantidade}× {it.servico}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => setModalTipo(t)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Pencil size={14} /></button>
                      <button onClick={() => deletarTipo(t.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modais */}
      {modalTipo && <ModalTipo tipo={modalTipo !== 'novo' ? modalTipo : null} onSalvar={salvarTipo} onFechar={() => setModalTipo(null)} />}
      {modalAssin && tipos.length > 0 && <ModalAssinatura tipos={tipos} onSalvar={salvarAssinatura} onFechar={() => setModalAssin(false)} />}
      {modalAssin && tipos.length === 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm text-center shadow-xl">
            <p className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Nenhum tipo de plano</p>
            <p className="text-sm text-slate-500 mb-4">Crie um tipo de plano primeiro na aba "Tipos de Plano".</p>
            <button onClick={() => { setModalAssin(false); setAba('tipos') }} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm">Ir para Tipos de Plano</button>
          </div>
        </div>
      )}
    </div>
  )
}
