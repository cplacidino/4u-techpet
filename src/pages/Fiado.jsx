import { useState, useEffect, useCallback } from 'react'
import {
  HandCoins, Search, ChevronDown, ChevronUp, CheckCircle2,
  Clock, AlertTriangle, Plus, MessageCircle, Trash2, Loader2,
  CalendarDays, User, DollarSign, X, Printer,
} from 'lucide-react'
import { imprimirFiado } from '../utils/imprimir'

function fmt(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function fmtData(d) {
  if (!d) return '—'
  const [a, m, dia] = d.split('-')
  return `${dia}/${m}/${a}`
}
function diasAtraso(vencimento) {
  if (!vencimento) return 0
  const diff = Math.floor((new Date() - new Date(vencimento + 'T00:00:00')) / 86400000)
  return diff > 0 ? diff : 0
}

// ── Modal: registrar pagamento ────────────────────────────
function ModalPagamento({ conta, onConfirmar, onCancelar }) {
  const [valor, setValor]   = useState('')
  const [obs, setObs]       = useState('')
  const [salvando, setSalvando] = useState(false)
  const restante = Number(conta.valor_total) - Number(conta.valor_pago)

  async function confirmar() {
    const v = parseFloat(valor)
    if (!v || v <= 0) return
    setSalvando(true)
    await onConfirmar(conta.id, Math.min(v, restante), obs)
    setSalvando(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 mx-auto">
          <HandCoins size={22} className="text-emerald-600" />
        </div>
        <h3 className="text-base font-bold text-slate-800 text-center mb-1">Registrar Pagamento</h3>
        <p className="text-sm text-slate-400 text-center mb-1">{conta.descricao}</p>
        <p className="text-xs text-slate-400 text-center mb-5">
          Cliente: <span className="font-medium text-slate-600">{conta.nome_cliente}</span>
        </p>

        <div className="bg-slate-50 rounded-xl p-3 mb-4 flex justify-between text-sm">
          <span className="text-slate-500">Total</span>
          <span className="font-semibold">{fmt(conta.valor_total)}</span>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 mb-4 flex justify-between text-sm">
          <span className="text-slate-500">Já pago</span>
          <span className="font-semibold text-emerald-600">{fmt(conta.valor_pago)}</span>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 mb-5 flex justify-between text-sm">
          <span className="text-amber-700 font-medium">Restante</span>
          <span className="font-bold text-amber-700">{fmt(restante)}</span>
        </div>

        <div className="mb-3">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Valor recebido (R$)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
            <input
              type="number" step="0.01" min="0" max={restante}
              value={valor} onChange={e => setValor(e.target.value)}
              placeholder="0,00"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />
          </div>
          <button
            onClick={() => setValor(String(restante))}
            className="text-xs text-emerald-600 mt-1 hover:underline"
          >
            Preencher valor restante completo
          </button>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Observação (opcional)</label>
          <input
            type="text" value={obs} onChange={e => setObs(e.target.value)}
            placeholder="Ex: Pix, dinheiro..."
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onCancelar} disabled={salvando}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={confirmar} disabled={salvando || !valor}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
            {salvando ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {salvando ? 'Salvando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal: novo fiado manual ──────────────────────────────
function ModalNovoFiado({ onSalvar, onCancelar }) {
  const [form, setForm]     = useState({ id_dono: '', descricao: '', valor_total: '', data_vencimento: '' })
  const [clientes, setClientes] = useState([])
  const [busca, setBusca]   = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    window.api.donos.listar().then(setClientes)
  }, [])

  const clientesFiltrados = clientes.filter(c =>
    !busca || c.nome.toLowerCase().includes(busca.toLowerCase())
  )

  async function salvar() {
    if (!form.id_dono || !form.descricao || !form.valor_total) return
    setSalvando(true)
    await onSalvar({ ...form, valor_total: parseFloat(form.valor_total) })
    setSalvando(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-slate-800">Novo Fiado</h3>
          <button onClick={onCancelar} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        <div className="mb-3">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Cliente *</label>
          <input
            type="text" placeholder="Buscar cliente..."
            value={busca} onChange={e => setBusca(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 mb-1"
          />
          {busca && (
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-36 overflow-y-auto">
              {clientesFiltrados.map(c => (
                <button key={c.id} onClick={() => { setForm(f => ({ ...f, id_dono: c.id })); setBusca(c.nome) }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${form.id_dono === c.id ? 'bg-violet-50 text-violet-700 font-medium' : 'text-slate-700'}`}>
                  {c.nome}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mb-3">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Descrição *</label>
          <input type="text" placeholder="Ex: Ração Premium, Consulta..."
            value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Valor (R$) *</label>
            <input type="number" step="0.01" min="0" placeholder="0,00"
              value={form.valor_total} onChange={e => setForm(f => ({ ...f, valor_total: e.target.value }))}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Vencimento</label>
            <input type="date"
              value={form.data_vencimento} onChange={e => setForm(f => ({ ...f, data_vencimento: e.target.value }))}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onCancelar} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200">
            Cancelar
          </button>
          <button onClick={salvar} disabled={salvando || !form.id_dono || !form.descricao || !form.valor_total}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
            {salvando ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {salvando ? 'Salvando...' : 'Criar Fiado'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Card de conta ─────────────────────────────────────────
function CartaoFiado({ conta, onPagar, onWhatsApp, onDeletar, onVerPagamentos }) {
  const [expandido, setExpandido] = useState(false)
  const [pagamentos, setPagamentos] = useState([])
  const [loadingPgtos, setLoadingPgtos] = useState(false)
  const restante = Number(conta.valor_total) - Number(conta.valor_pago)
  const atraso   = diasAtraso(conta.data_vencimento)

  const statusCor = {
    pendente: 'bg-amber-50 text-amber-700 border-amber-200',
    atrasado: 'bg-red-50 text-red-700 border-red-200',
    pago:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  }[conta.status] || 'bg-slate-50 text-slate-600 border-slate-200'

  const statusLabel = { pendente: 'Pendente', atrasado: 'Atrasado', pago: 'Pago' }[conta.status]

  async function toggleExpandido() {
    const novoEstado = !expandido
    setExpandido(novoEstado)
    if (novoEstado && pagamentos.length === 0) {
      setLoadingPgtos(true)
      const p = await window.api.fiado.buscarPagamentos(conta.id)
      setPagamentos(p || [])
      setLoadingPgtos(false)
    }
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-soft transition-all ${conta.status === 'atrasado' ? 'border-red-200' : 'border-slate-100'}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs px-2.5 py-0.5 rounded-lg border font-semibold ${statusCor}`}>
                {statusLabel}
                {conta.status === 'atrasado' && atraso > 0 && ` · ${atraso}d`}
              </span>
              <span className="text-xs text-slate-400 capitalize">{conta.origem}</span>
            </div>
            <p className="text-sm font-bold text-slate-800 truncate">{conta.descricao}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <User size={11} className="text-slate-400" />
              <p className="text-xs text-slate-500">{conta.nome_cliente}</p>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-base font-bold text-slate-800">{fmt(restante)}</p>
            <p className="text-xs text-slate-400">de {fmt(conta.valor_total)}</p>
            {conta.data_vencimento && (
              <p className={`text-xs mt-0.5 flex items-center justify-end gap-1 ${conta.status === 'atrasado' ? 'text-red-500' : 'text-slate-400'}`}>
                <CalendarDays size={10} />
                {fmtData(conta.data_vencimento)}
              </p>
            )}
          </div>
        </div>

        {/* Barra de progresso */}
        {conta.valor_pago > 0 && (
          <div className="mt-3">
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, (conta.valor_pago / conta.valor_total) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">{fmt(conta.valor_pago)} pago</p>
          </div>
        )}

        {/* Botões */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50 flex-wrap">
          {conta.status !== 'pago' && (
            <button onClick={() => onPagar(conta)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors">
              <DollarSign size={12} /> Receber
            </button>
          )}
          {conta.telefone_cliente && (
            <button onClick={() => onWhatsApp(conta)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors">
              <MessageCircle size={12} /> WhatsApp
            </button>
          )}
          <button onClick={() => imprimirFiado(conta, pagamentos)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors">
            <Printer size={12} /> Imprimir
          </button>
          <button onClick={toggleExpandido}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors ml-auto">
            {expandido ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expandido ? 'Fechar' : 'Histórico'}
          </button>
          {conta.status === 'pago' && (
            <button onClick={() => onDeletar(conta.id)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-slate-400 hover:text-red-500 border border-slate-200 rounded-lg text-xs transition-colors">
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Histórico de pagamentos */}
      {expandido && (
        <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 rounded-b-2xl">
          <p className="text-xs font-semibold text-slate-600 mb-2">Histórico de pagamentos</p>
          {loadingPgtos ? (
            <div className="flex justify-center py-2"><Loader2 size={16} className="animate-spin text-slate-400" /></div>
          ) : pagamentos.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-2">Nenhum pagamento registrado ainda</p>
          ) : (
            <div className="space-y-1.5">
              {pagamentos.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-white rounded-lg px-3 py-2 border border-slate-100">
                  <div>
                    <p className="text-xs font-medium text-slate-700">{fmt(p.valor)}</p>
                    {p.observacoes && <p className="text-xs text-slate-400">{p.observacoes}</p>}
                  </div>
                  <p className="text-xs text-slate-400">{fmtData(p.data)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────
const ABAS = [
  { key: 'aberto',   label: 'Em Aberto',  icon: Clock },
  { key: 'hoje',     label: 'Hoje',       icon: CalendarDays },
  { key: 'atrasado', label: 'Atrasados',  icon: AlertTriangle },
  { key: 'pago',     label: 'Pagos',      icon: CheckCircle2 },
  { key: 'todos',    label: 'Todos',      icon: HandCoins },
]

export default function Fiado() {
  const [aba, setAba]           = useState('aberto')
  const [contas, setContas]     = useState([])
  const [resumo, setResumo]     = useState(null)
  const [busca, setBusca]       = useState('')
  const [carregando, setCarregando] = useState(false)
  const [modalPagar, setModalPagar] = useState(null)
  const [modalNovo, setModalNovo]   = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const [lista, tot] = await Promise.all([
        window.api.fiado.listar(aba),
        window.api.fiado.totalEmAberto(),
      ])
      setContas(lista || [])
      setResumo(tot)
    } finally {
      setCarregando(false)
    }
  }, [aba])

  useEffect(() => { carregar() }, [carregar])

  const contasFiltradas = contas.filter(c =>
    !busca ||
    c.nome_cliente?.toLowerCase().includes(busca.toLowerCase()) ||
    c.descricao?.toLowerCase().includes(busca.toLowerCase())
  )

  async function registrarPagamento(id, valor, obs) {
    await window.api.fiado.registrarPagamento(id, valor, obs)
    setModalPagar(null)
    carregar()
  }

  async function criarFiado(dados) {
    await window.api.fiado.criar(dados)
    setModalNovo(false)
    carregar()
  }

  async function deletar(id) {
    if (!window.confirm('Remover este registro de fiado pago?')) return
    await window.api.fiado.deletar(id)
    carregar()
  }

  function abrirWhatsApp(conta) {
    const tel   = conta.telefone_cliente?.replace(/\D/g, '')
    const msg   = encodeURIComponent(
      `Olá ${conta.nome_cliente}, passando para lembrar que há um saldo de ${fmt(Number(conta.valor_total) - Number(conta.valor_pago))} em aberto referente a "${conta.descricao}". Qualquer dúvida estamos à disposição! 😊`
    )
    window.open(`https://wa.me/55${tel}?text=${msg}`, '_blank')
  }

  return (
    <div className="flex flex-col h-full gap-6 p-6">

      {/* Cards de resumo */}
      {resumo && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-4">
            <p className="text-xs text-slate-400 mb-1">Total em aberto</p>
            <p className="text-xl font-bold text-slate-800">{fmt(resumo.total_aberto)}</p>
            <p className="text-xs text-slate-400 mt-1">{resumo.total_contas} conta(s)</p>
          </div>
          <div className="bg-white rounded-2xl border border-red-100 shadow-soft p-4">
            <p className="text-xs text-red-400 mb-1">Atrasados</p>
            <p className="text-xl font-bold text-red-600">{fmt(resumo.valor_atrasado)}</p>
            <p className="text-xs text-red-400 mt-1">{resumo.total_atrasados} cliente(s)</p>
          </div>
          <div className="col-span-2 bg-amber-50 rounded-2xl border border-amber-100 shadow-soft p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-600 mb-1 font-medium">Atenção</p>
              <p className="text-sm text-amber-800">
                {resumo.total_atrasados > 0
                  ? `${resumo.total_atrasados} cliente(s) com pagamento atrasado. Use o WhatsApp para cobrar!`
                  : 'Nenhum cliente em atraso. Tudo em dia! ✅'}
              </p>
            </div>
            <AlertTriangle size={28} className="text-amber-400 flex-shrink-0" />
          </div>
        </div>
      )}

      {/* Barra superior */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Abas filtro */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 overflow-x-auto">
          {ABAS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setAba(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                aba === key ? 'bg-white text-slate-800 shadow-soft' : 'text-slate-500 hover:text-slate-700'
              }`}>
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {/* Busca */}
          <div className="relative flex-1 sm:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text" placeholder="Buscar cliente..."
              value={busca} onChange={e => setBusca(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Novo fiado */}
          <button onClick={() => setModalNovo(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors shadow-soft whitespace-nowrap">
            <Plus size={15} />
            Novo Fiado
          </button>
        </div>
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="flex items-center justify-center flex-1 gap-3 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Carregando...</span>
        </div>
      ) : contasFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-slate-400 py-16">
          <HandCoins size={40} className="opacity-30" />
          <p className="text-sm">Nenhum fiado encontrado</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 overflow-y-auto pb-4">
          {contasFiltradas.map(c => (
            <CartaoFiado
              key={c.id}
              conta={c}
              onPagar={setModalPagar}
              onWhatsApp={abrirWhatsApp}
              onDeletar={deletar}
            />
          ))}
        </div>
      )}

      {modalPagar && (
        <ModalPagamento
          conta={modalPagar}
          onConfirmar={registrarPagamento}
          onCancelar={() => setModalPagar(null)}
        />
      )}

      {modalNovo && (
        <ModalNovoFiado
          onSalvar={criarFiado}
          onCancelar={() => setModalNovo(false)}
        />
      )}
    </div>
  )
}
