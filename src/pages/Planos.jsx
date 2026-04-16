import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardList, Plus, ChevronDown, ChevronUp,
  CheckCircle, AlertTriangle, XCircle,
  Pencil, Trash2, PauseCircle, PlayCircle, BadgeCheck, CalendarPlus,
  RefreshCw, Printer, FileText,
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

// ─── Input de Data ────────────────────────────────────────────────────────────
// Usa type="date" nativo do Chromium/Electron:
//   • Clique abre calendário
//   • Digitação manual: clica no segmento (dia/mês/ano) e digita
//   • Valida datas do calendário automaticamente

function InputData({ value, onChange, className = '' }) {
  return (
    <input
      type="date"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className={`w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:border-purple-400 ${className}`}
    />
  )
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
  const hoje = new Date().toISOString().split('T')[0]
  const [donos, setDonos] = useState([])
  const [pets, setPets] = useState([])
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({
    id_dono: '',
    id_pet: '',
    id_plano_tipo: tipos[0]?.id || '',
    data_vencimento: '',   // vazio: usuário preenche
    pago: false,
    data_pagamento: hoje,  // pré-preenche com hoje (faz sentido para pagamento)
    observacoes: '',
  })

  useEffect(() => { window.api.donos.listar().then(setDonos) }, [])
  useEffect(() => {
    if (!form.id_dono) return setPets([])
    window.api.pets.buscarPorDono(form.id_dono).then(setPets)
  }, [form.id_dono])

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function salvar() {
    if (!form.id_dono || !form.id_plano_tipo) return alert('Selecione o cliente e o plano.')
    if (form.pago && !form.data_pagamento) return alert('Informe a data do pagamento.')
    if (!form.pago && !form.data_vencimento) return alert('Informe a data de vencimento do pagamento.')
    setSalvando(true)
    try {
      // Quando pago sem data_vencimento: usa data_pagamento como vencimento do ciclo
      const dataVenc = form.pago ? (form.data_vencimento || form.data_pagamento) : form.data_vencimento
      await onSalvar({
        id_dono: parseInt(form.id_dono),
        id_pet: form.id_pet ? parseInt(form.id_pet) : null,
        id_plano_tipo: parseInt(form.id_plano_tipo),
        data_vencimento: dataVenc,
        pago: form.pago,
        data_pagamento: form.pago ? form.data_pagamento : null,
        observacoes: form.observacoes || null,
      })
    } finally {
      setSalvando(false)
    }
  }

  const tipoSelecionado = tipos.find(t => String(t.id) === String(form.id_plano_tipo))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-slate-800 dark:text-slate-100">Nova Assinatura</h2>
          <p className="text-xs text-slate-500 mt-0.5">Associe um plano a um cliente</p>
        </div>
        <div className="p-6 space-y-4">

          {/* Cliente */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Cliente *</label>
            <select value={form.id_dono} onChange={e => setField('id_dono', e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:border-purple-400">
              <option value="">Selecione o cliente...</option>
              {donos.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
          </div>

          {/* Pet */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Pet (opcional)</label>
            <select value={form.id_pet} onChange={e => setField('id_pet', e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:border-purple-400">
              <option value="">Todos os pets do cliente</option>
              {pets.map(p => <option key={p.id} value={p.id}>{p.nome} ({p.especie})</option>)}
            </select>
          </div>

          {/* Tipo de plano */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Plano *</label>
            <select value={form.id_plano_tipo} onChange={e => setField('id_plano_tipo', e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:border-purple-400">
              {tipos.filter(t => t.ativo).map(t => <option key={t.id} value={t.id}>{t.nome} — {fmtMoeda(t.valor)}/mês</option>)}
            </select>
            {tipoSelecionado && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {(tipoSelecionado.itens || []).map(it => (
                  <span key={it.id} className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                    {it.quantidade}× {it.servico}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Já foi pago? — aparece antes dos campos de data */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">O plano já foi pago?</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setField('pago', true)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${form.pago ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-emerald-300'}`}
              >
                ✓ Sim, já foi pago
              </button>
              <button
                type="button"
                onClick={() => setField('pago', false)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${!form.pago ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-amber-300'}`}
              >
                ⏳ Não, está pendente
              </button>
            </div>
          </div>

          {/* Quando pago: só pede a data do pagamento */}
          {form.pago && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Data do pagamento *</label>
              <InputData value={form.data_pagamento} onChange={v => setField('data_pagamento', v)} />
              <p className="text-[10px] text-emerald-600 mt-0.5">
                Será lançado automaticamente nas receitas financeiras.
              </p>
            </div>
          )}

          {/* Quando não pago: pede a data de vencimento do pagamento */}
          {!form.pago && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Data de vencimento do pagamento *</label>
              <InputData value={form.data_vencimento} onChange={v => setField('data_vencimento', v)} />
              <p className="text-[10px] text-amber-600 mt-0.5">
                Prazo para o cliente efetuar o pagamento deste ciclo.
              </p>
            </div>
          )}

          {/* Observações */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Observações</label>
            <input
              value={form.observacoes}
              onChange={e => setField('observacoes', e.target.value)}
              placeholder="Opcional..."
              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:border-purple-400"
            />
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
          <button onClick={onFechar} disabled={salvando} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-60">
            {salvando ? 'Criando...' : 'Criar assinatura'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Registrar Uso ─────────────────────────────────────────────────────

function ModalUso({ assinatura, resumo, onSalvar, onFechar }) {
  const navigate = useNavigate()
  const servicosDisponiveis = (resumo?.resumo || []).filter(r => r.quantidade_restante > 0)
  const [servico, setServico] = useState(servicosDisponiveis[0]?.servico || '')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [hora, setHora] = useState('08:00')
  const [obs, setObs] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [petSelecionado, setPetSelecionado] = useState('')
  const [petsDoCliente, setPetsDoCliente] = useState([])

  useEffect(() => {
    if (!assinatura.id_pet && assinatura.id_dono) {
      window.api.pets.buscarPorDono(assinatura.id_dono).then(lista => {
        setPetsDoCliente(lista || [])
        if (lista?.length === 1) setPetSelecionado(String(lista[0].id))
      })
    }
  }, [assinatura.id_pet, assinatura.id_dono])

  const idPetEfetivo = assinatura.id_pet || (petSelecionado ? parseInt(petSelecionado) : null)

  async function salvar() {
    if (!servico) return alert('Selecione o serviço.')
    if (!hora) return alert('Informe o horário.')
    setSalvando(true)
    try {
      let id_agendamento = null
      if (idPetEfetivo) {
        const obsAgendamento = `[Plano:${assinatura.id}: ${assinatura.nome_plano} · ${assinatura.nome_dono}]${obs ? ' ' + obs : ''}`
        const ag = await window.api.agendamentos.criar({
          id_pet:      idPetEfetivo,
          servico,
          data,
          hora,
          status:      'agendado',
          observacoes: obsAgendamento,
          valor:       null,
        })
        id_agendamento = ag?.id || null
      }
      await onSalvar({ id_ciclo: resumo.ciclo.id, servico, data_uso: data, observacoes: obs, id_agendamento, id_pet: idPetEfetivo || null })
      if (idPetEfetivo) navigate('/agendamentos')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-slate-800 dark:text-slate-100">Agendar Serviço do Plano</h2>
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
              {!assinatura.id_pet && petsDoCliente.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Animal que vai receber o serviço</label>
                  <select value={petSelecionado} onChange={e => setPetSelecionado(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none">
                    <option value="">Não especificar</option>
                    {petsDoCliente.map(p => <option key={p.id} value={p.id}>{p.nome} ({p.especie})</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Data</label>
                  <input type="date" value={data} onChange={e => setData(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Horário *</label>
                  <input type="time" value={hora} onChange={e => setHora(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Observações</label>
                <input value={obs} onChange={e => setObs(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none" />
              </div>
              {idPetEfetivo && (
                <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
                  <CalendarPlus size={11} className="inline mr-1" />
                  Um agendamento será criado automaticamente na agenda.
                </p>
              )}
            </>
          )}
        </div>
        <div className="p-5 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
          <button onClick={onFechar} disabled={salvando} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg">Fechar</button>
          {servicosDisponiveis.length > 0 && (
            <button onClick={salvar} disabled={salvando} className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium disabled:opacity-60">
              <CalendarPlus size={14} />
              {salvando ? 'Agendando...' : 'Agendar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Modal Confirmar Pagamento ───────────────────────────────────────────────

function ModalConfirmarPagamento({ ciclo, nomePlano, onConfirmar, onFechar }) {
  const hoje = new Date().toISOString().split('T')[0]
  const [data, setData] = useState(hoje)
  const [salvando, setSalvando] = useState(false)

  async function confirmar() {
    setSalvando(true)
    try { await onConfirmar(data) }
    finally { setSalvando(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-4 mx-auto">
          <BadgeCheck size={22} className="text-emerald-600" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 text-center mb-1">Confirmar pagamento</h3>
        <p className="text-sm text-slate-500 text-center mb-5">
          {nomePlano} — <strong>{fmtMoeda(ciclo.valor)}</strong>
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Data do pagamento</label>
            <input
              type="date"
              value={data}
              onChange={e => setData(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">Hoje se já pagou · Data futura se ainda vai pagar</p>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onFechar} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors">
            Cancelar
          </button>
          <button onClick={confirmar} disabled={salvando || !data} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 transition-colors">
            {salvando ? 'Salvando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Relatório de Uso ──────────────────────────────────────────────────

function ModalRelatorio({ assinatura, onFechar }) {
  const [usos, setUsos] = useState([])
  const [ciclos, setCiclos] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function carregar() {
      const [u, c] = await Promise.all([
        window.api.planos.listarUsosPorAssinatura(assinatura.id),
        window.api.planos.listarCiclosPorAssinatura(assinatura.id),
      ])
      setUsos(u || [])
      setCiclos(c || [])
      setCarregando(false)
    }
    carregar()
  }, [assinatura.id])

  function imprimir() {
    const conteudo = document.getElementById('relatorio-plano-print')
    const janela = window.open('', '_blank', 'width=800,height=600')
    janela.document.write(`
      <html><head><title>Relatório de Plano</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 13px; color: #1e293b; padding: 24px; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        h2 { font-size: 14px; color: #64748b; font-weight: normal; margin-top: 0; }
        h3 { font-size: 13px; margin: 16px 0 8px; color: #475569; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { text-align: left; font-size: 11px; text-transform: uppercase; color: #94a3b8; padding: 4px 8px; }
        td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
        .badge-pago { background: #d1fae5; color: #065f46; }
        .badge-pendente { background: #fef3c7; color: #92400e; }
        .resumo { display: flex; gap: 24px; margin: 12px 0 20px; }
        .resumo-item { background: #f8fafc; border-radius: 8px; padding: 10px 16px; }
        .resumo-item strong { display: block; font-size: 18px; }
        .resumo-item span { font-size: 11px; color: #64748b; }
        @media print { button { display: none; } }
      </style></head><body>
      ${conteudo.innerHTML}
      </body></html>
    `)
    janela.document.close()
    janela.focus()
    setTimeout(() => { janela.print(); janela.close() }, 300)
  }

  // Agrupar usos por ciclo
  const usosPorCiclo = {}
  for (const u of usos) {
    const key = u.competencia || 'sem-ciclo'
    if (!usosPorCiclo[key]) usosPorCiclo[key] = []
    usosPorCiclo[key].push(u)
  }

  const totalUsos = usos.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-purple-600" />
            <div>
              <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Relatório de Uso do Plano</h2>
              <p className="text-xs text-slate-500">{assinatura.nome_dono} · {assinatura.nome_plano}</p>
            </div>
          </div>
          <button onClick={imprimir}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg font-medium">
            <Printer size={13} /> Imprimir
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {carregando ? (
            <p className="text-center text-slate-400 py-8">Carregando...</p>
          ) : (
            <div id="relatorio-plano-print">
              <h1>{assinatura.nome_plano}</h1>
              <h2>Cliente: {assinatura.nome_dono}{assinatura.nome_pet ? ` · Pet: ${assinatura.nome_pet}` : ''}</h2>

              {/* Resumo geral */}
              <div className="flex gap-4 mb-5 flex-wrap">
                <div className="bg-slate-50 dark:bg-slate-700 rounded-xl px-4 py-3">
                  <strong className="block text-lg font-bold text-slate-800 dark:text-slate-100">{totalUsos}</strong>
                  <span className="text-xs text-slate-500">Total de serviços usados</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-xl px-4 py-3">
                  <strong className="block text-lg font-bold text-slate-800 dark:text-slate-100">{ciclos.length}</strong>
                  <span className="text-xs text-slate-500">Ciclos desde o início</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-xl px-4 py-3">
                  <strong className="block text-lg font-bold text-emerald-600">{fmtMoeda(assinatura.valor_plano)}</strong>
                  <span className="text-xs text-slate-500">Valor mensal</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-xl px-4 py-3">
                  <strong className="block text-sm font-bold text-slate-800 dark:text-slate-100">{fmtData(assinatura.data_inicio)}</strong>
                  <span className="text-xs text-slate-500">Início da assinatura</span>
                </div>
              </div>

              {/* Histórico por ciclo */}
              {ciclos.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Nenhum ciclo registrado.</p>
              ) : ciclos.map(ciclo => {
                const usosNoCiclo = usosPorCiclo[ciclo.competencia] || []
                return (
                  <div key={ciclo.id} className="mb-5">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                      Ciclo {fmtCompetencia(ciclo.competencia)}
                      <BadgeStatus status={ciclo.status === 'pendente' && ciclo.data_vencimento < new Date().toISOString().split('T')[0] ? 'atrasado' : ciclo.status} />
                      <span className="text-xs font-normal text-slate-400 normal-case ml-auto">
                        Vence: {fmtData(ciclo.data_vencimento)}
                        {ciclo.data_pagamento && ` · Pago: ${fmtData(ciclo.data_pagamento)}`}
                        {' · '}{fmtMoeda(ciclo.valor)}
                      </span>
                    </h3>
                    {usosNoCiclo.length === 0 ? (
                      <p className="text-xs text-slate-400 italic pl-2">Nenhum serviço utilizado neste ciclo.</p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-slate-700">
                            <th className="py-1.5 pr-4">Data</th>
                            <th className="py-1.5 pr-4">Serviço</th>
                            <th className="py-1.5">Pet</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usosNoCiclo.map(u => (
                            <tr key={u.id} className="border-b border-slate-50 dark:border-slate-700">
                              <td className="py-1.5 pr-4 text-slate-600 dark:text-slate-400">{fmtData(u.data_uso)}</td>
                              <td className="py-1.5 pr-4">
                                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                                  <CheckCircle size={11} className="text-emerald-500 flex-shrink-0" />
                                  {u.servico}
                                </span>
                              </td>
                              <td className="py-1.5 text-slate-500 dark:text-slate-400">{u.nome_pet || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
          <button onClick={onFechar} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg">Fechar</button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Agendamento em Lote ───────────────────────────────────────────────

function ModalAgendamentoLote({ assinatura, resumo, onSalvar, onFechar }) {
  // Monta lista de sessões disponíveis (uma entrada por sessão restante)
  const sessoesPossiveis = []
  for (const r of (resumo?.resumo || [])) {
    for (let i = 0; i < r.quantidade_restante; i++) {
      sessoesPossiveis.push({ servico: r.servico, num: i + 1, data: '', hora: '08:00' })
    }
  }

  const [sessoes, setSessoes]           = useState(sessoesPossiveis)
  const [petSelecionado, setPetSelecionado] = useState(assinatura.id_pet ? String(assinatura.id_pet) : '')
  const [petsDoCliente, setPetsDoCliente]   = useState([])
  const [salvando, setSalvando]         = useState(false)

  useEffect(() => {
    if (!assinatura.id_pet && assinatura.id_dono) {
      window.api.pets.buscarPorDono(assinatura.id_dono).then(lista => {
        setPetsDoCliente(lista || [])
        if (lista?.length === 1) setPetSelecionado(String(lista[0].id))
      })
    }
  }, [])

  const idPet = assinatura.id_pet || (petSelecionado ? parseInt(petSelecionado) : null)

  function setSessao(i, campo, valor) {
    setSessoes(s => s.map((item, idx) => idx === i ? { ...item, [campo]: valor } : item))
  }

  async function salvar() {
    const selecionadas = sessoes.filter(s => s.data && s.hora)
    if (selecionadas.length === 0) return alert('Preencha pelo menos uma data e horário.')
    if (!idPet) return alert('Selecione o pet para o agendamento.')
    setSalvando(true)
    try {
      await onSalvar(selecionadas.map(s => ({
        id_ciclo:    resumo.ciclo.id,
        id_pet:      idPet,
        servico:     s.servico,
        data:        s.data,
        hora:        s.hora,
        nome_plano:  assinatura.nome_plano,
        nome_dono:   assinatura.nome_dono,
        observacoes: null,
      })))
    } finally {
      setSalvando(false)
    }
  }

  const qtdPreenchidas = sessoes.filter(s => s.data).length

  if (sessoesPossiveis.length === 0) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center space-y-4">
        <p className="text-slate-500 text-sm">Todos os serviços deste ciclo já foram agendados ou utilizados.</p>
        <button onClick={onFechar} className="px-4 py-2 text-sm bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">Fechar</button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-slate-800 dark:text-slate-100">Agendar sessões do plano</h2>
          <p className="text-xs text-slate-500 mt-0.5">{assinatura.nome_dono} · {assinatura.nome_plano}</p>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Seletor de pet (quando assinatura não tem pet fixo) */}
          {!assinatura.id_pet && petsDoCliente.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Animal que vai receber os serviços</label>
              <select value={petSelecionado} onChange={e => setPetSelecionado(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none">
                <option value="">Selecione o pet</option>
                {petsDoCliente.map(p => <option key={p.id} value={p.id}>{p.nome} ({p.especie})</option>)}
              </select>
            </div>
          )}

          <p className="text-xs text-slate-400">
            Escolha data e horário para cada sessão que deseja agendar. Sessões sem data serão ignoradas.
          </p>

          {/* Sessões */}
          <div className="space-y-2">
            {sessoes.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 w-28 flex-shrink-0">
                  {s.servico} #{s.num}
                </span>
                <input type="date" value={s.data} onChange={e => setSessao(i, 'data', e.target.value)}
                  className="flex-1 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:border-purple-400" />
                <input type="time" value={s.hora} onChange={e => setSessao(i, 'hora', e.target.value)}
                  className="w-24 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:border-purple-400" />
              </div>
            ))}
          </div>

          {qtdPreenchidas > 0 && (
            <p className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2 flex items-center gap-1.5">
              <CalendarPlus size={11} />
              {qtdPreenchidas} sessão(ões) serão criadas na agenda automaticamente.
            </p>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
          <button onClick={onFechar} disabled={salvando}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg">
            Cancelar
          </button>
          <button onClick={salvar} disabled={salvando || qtdPreenchidas === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-60">
            <CalendarPlus size={14} />
            {salvando ? 'Agendando...' : `Agendar ${qtdPreenchidas > 0 ? qtdPreenchidas + ' sessão(ões)' : 'sessões'}`}
          </button>
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
  const [modalLote, setModalLote] = useState(false)
  const [modalPagamento, setModalPagamento] = useState(false)
  const [modalRelatorio, setModalRelatorio] = useState(false)

  const carregarResumo = useCallback(async () => {
    const r = await window.api.planos.resumoCicloAtual(assinatura.id)
    setResumo(r)
  }, [assinatura.id])

  // Carrega sempre no mount para mostrar info no cabeçalho sem precisar expandir
  useEffect(() => { carregarResumo() }, [carregarResumo])
  useEffect(() => { if (aberto) carregarResumo() }, [aberto, carregarResumo])

  const cicloAtual = resumo?.ciclo
  const cicloAtrasado = cicloAtual && cicloAtual.status === 'pendente' && cicloAtual.data_vencimento < new Date().toISOString().split('T')[0]

  async function confirmarPagamento(data_pagamento) {
    if (!cicloAtual) return
    await window.api.planos.confirmarPagamento(cicloAtual.id, data_pagamento)
    setModalPagamento(false)
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

  async function agendarLote(sessoes) {
    await window.api.planos.agendarSessoes(assinatura.id, sessoes)
    setModalLote(false)
    await carregarResumo()
  }

  async function renovarCiclo() {
    await window.api.planos.renovarCiclo(assinatura.id)
    await carregarResumo()
    onRecarregar()
  }

  const todosUsados = resumo && resumo.resumo.every(r => r.quantidade_restante <= 0)

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
            {resumo?.ciclo?.status === 'pendente' && (
              <span className={`text-xs font-medium ${cicloAtrasado ? 'text-red-600' : 'text-amber-600'}`}>
                {cicloAtrasado ? '⚠ Pgto atrasado' : '⏳ Pgto pendente'}
                {resumo.ciclo.data_vencimento ? ` · vence ${fmtData(resumo.ciclo.data_vencimento)}` : ''}
              </span>
            )}
            {resumo?.ciclo?.status === 'pago' && resumo.ciclo.data_pagamento && (
              <span className="text-xs text-emerald-500 font-medium">
                ✓ Pago em: {fmtData(resumo.ciclo.data_pagamento)}
              </span>
            )}
          </div>
          {/* Barras de uso resumidas no cabeçalho */}
          {resumo?.resumo?.length > 0 && (
            <div className="flex gap-3 mt-1.5 flex-wrap">
              {resumo.resumo.map(r => (
                <span key={r.servico} className={`text-[10px] px-2 py-0.5 rounded-full font-medium
                  ${r.quantidade_restante <= 0
                    ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                    : r.quantidade_restante < r.quantidade_plano
                      ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                  }`}>
                  {r.servico}: {r.quantidade_usada}/{r.quantidade_plano}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {assinatura.status === 'ativo' && cicloAtual && cicloAtual.status !== 'pago' && (
            <button onClick={e => { e.stopPropagation(); setModalPagamento(true) }}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs rounded-lg font-medium">
              <BadgeCheck size={13} /> Confirmar pagamento
            </button>
          )}
          <button onClick={e => { e.stopPropagation(); setModalRelatorio(true) }}
            title="Relatório de uso"
            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg">
            <Printer size={14} />
          </button>
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
                  {assinatura.status === 'ativo' && !todosUsados && (
                    <>
                      <button onClick={() => setModalUso(true)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 text-blue-600 text-xs rounded-lg font-medium">
                        <Plus size={11} /> Registrar uso
                      </button>
                      <button onClick={() => setModalLote(true)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 text-purple-600 text-xs rounded-lg font-medium">
                        <CalendarPlus size={11} /> Agendar sessões
                      </button>
                    </>
                  )}
                  {assinatura.status === 'ativo' && todosUsados && (
                    <button onClick={renovarCiclo}
                      className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs rounded-lg font-medium">
                      <RefreshCw size={11} /> Renovar ciclo
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
                    <span className="flex items-center gap-1.5">
                      <CheckCircle size={11} className="text-emerald-500" />
                      {u.servico}
                      {u.nome_pet && <span className="text-slate-400">· {u.nome_pet}</span>}
                    </span>
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
      {modalLote && resumo && (
        <ModalAgendamentoLote assinatura={assinatura} resumo={resumo} onSalvar={agendarLote} onFechar={() => setModalLote(false)} />
      )}
      {modalPagamento && cicloAtual && (
        <ModalConfirmarPagamento
          ciclo={cicloAtual}
          nomePlano={assinatura.nome_plano}
          onConfirmar={confirmarPagamento}
          onFechar={() => setModalPagamento(false)}
        />
      )}
      {modalRelatorio && (
        <ModalRelatorio assinatura={assinatura} onFechar={() => setModalRelatorio(false)} />
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
    if (!confirm('Excluir este tipo de plano?')) return
    const res = await window.api.planos.deletarTipo(id)
    if (res?.ok === false) {
      alert(res.erro || 'Não foi possível excluir este tipo de plano.')
      return
    }
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
          {/* Filtros + botão nova assinatura */}
          <div className="flex items-center gap-2 flex-wrap">
            {[['ativo', 'Ativos'], ['pausado', 'Pausados'], ['cancelado', 'Cancelados'], ['todos', 'Todos']].map(([k, l]) => (
              <button key={k} onClick={() => setFiltro(k)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${filtro === k ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}>
                {l}
              </button>
            ))}
            <button onClick={() => setModalAssin(true)}
              className="ml-auto flex items-center gap-2 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg font-medium shadow-sm">
              <Plus size={14} /> Nova assinatura
            </button>
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
