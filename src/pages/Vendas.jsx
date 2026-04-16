import { useState, useEffect, useCallback } from 'react'
import {
  ShoppingCart, Plus, Minus, Trash2, Search, CheckCircle2,
  XCircle, Receipt, Package, Loader2, ChevronDown, ChevronUp,
  HandCoins, User, Printer, Truck, MapPin, Phone,
  Clock, CheckCheck, AlertCircle, Edit2, Wheat, X,
} from 'lucide-react'
import { imprimirVenda, imprimirEntrega } from '../utils/imprimir'

// ── Formata moeda ─────────────────────────────────────────
function fmt(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ── Item do carrinho ──────────────────────────────────────
function ItemCarrinho({ item, onQtd, onRemover, onEditarKg }) {
  if (item.isGranel) {
    return (
      <div className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Wheat size={12} className="text-amber-500 flex-shrink-0" />
            <p className="text-sm font-medium text-slate-800 truncate">{item.nome_produto}</p>
          </div>
          <p className="text-xs text-slate-400">{fmt(item.preco_unit)}/kg</p>
        </div>
        <button
          onClick={() => onEditarKg(item)}
          className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors"
        >
          {Number(item.quantidade).toFixed(3)} kg
        </button>
        <span className="text-sm font-bold text-emerald-700 w-20 text-right tabular-nums">
          {fmt(item.subtotal)}
        </span>
        <button onClick={() => onRemover(item.id_produto)} className="text-slate-300 hover:text-red-400 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{item.nome_produto}</p>
        <p className="text-xs text-slate-400">{fmt(item.preco_unit)} / {item.unidade}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onQtd(item.id_produto, item.quantidade - 1)}
          className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <Minus size={11} />
        </button>
        <span className="w-8 text-center text-sm font-semibold text-slate-800 tabular-nums">
          {item.quantidade}
        </span>
        <button
          onClick={() => onQtd(item.id_produto, item.quantidade + 1)}
          disabled={item.quantidade >= item.estoque_max}
          className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-40"
        >
          <Plus size={11} />
        </button>
      </div>
      <span className="text-sm font-bold text-emerald-700 w-20 text-right tabular-nums">
        {fmt(item.subtotal)}
      </span>
      <button onClick={() => onRemover(item.id_produto)} className="text-slate-300 hover:text-red-400 transition-colors">
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// ── Modal de venda granel (kg ↔ R$) ──────────────────────
function ModalGranel({ produto, itemExistente, onConfirmar, onFechar }) {
  const precoKg = produto.preco_por_kg || 0
  const [kg, setKg]     = useState(itemExistente ? String(itemExistente.quantidade) : '')
  const [reais, setReais] = useState(itemExistente ? String((itemExistente.quantidade * precoKg).toFixed(2)) : '')

  function handleKg(val) {
    setKg(val)
    const n = parseFloat(val)
    if (!isNaN(n)) setReais((n * precoKg).toFixed(2))
    else setReais('')
  }

  function handleReais(val) {
    setReais(val)
    const n = parseFloat(val)
    if (!isNaN(n) && precoKg > 0) setKg((n / precoKg).toFixed(3))
    else setKg('')
  }

  function confirmar() {
    const kgNum = parseFloat(kg)
    if (!kgNum || kgNum <= 0) return
    onConfirmar(produto, kgNum)
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Wheat size={18} className="text-amber-500" />
            <div>
              <h3 className="font-semibold text-slate-800">{produto.nome}</h3>
              <p className="text-xs text-slate-400">{fmt(produto.preco_por_kg)}/kg · {Number(produto.quantidade).toFixed(2)} kg em estoque</p>
            </div>
          </div>
          <button onClick={onFechar} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Quantidade (kg)</label>
            <input
              type="number" step="0.001" min="0.001" autoFocus
              placeholder="0,000"
              value={kg}
              onChange={e => handleKg(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Valor (R$)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
              <input
                type="number" step="0.01" min="0.01"
                placeholder="0,00"
                value={reais}
                onChange={e => handleReais(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
          {kg && parseFloat(kg) > 0 && (
            <div className="bg-amber-50 rounded-xl px-3 py-2 text-xs text-amber-700 text-center">
              <strong>{parseFloat(kg).toFixed(3)} kg</strong> × {fmt(precoKg)}/kg = <strong>{fmt(parseFloat(kg) * precoKg)}</strong>
            </div>
          )}
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onFechar} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
          <button
            onClick={confirmar}
            disabled={!kg || parseFloat(kg) <= 0}
            className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {itemExistente ? 'Atualizar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Motivos de cancelamento: label, status salvo no banco, voltaEstoque
const MOTIVOS_CANCELAMENTO = [
  { key: 'troca',          label: 'Troca de mercadoria', voltaEstoque: true  },
  { key: 'avaria',         label: 'Avaria',              voltaEstoque: false },
  { key: 'desistiu',       label: 'Desistiu',            voltaEstoque: true  },
  { key: 'erro_lancamento',label: 'Erro de lançamento',  voltaEstoque: true  },
  { key: 'devolvida',      label: 'Devolução',           voltaEstoque: true  },
]

// ── Modal de senha para ação protegida ────────────────────
function ModalSenha({ onConfirmado, onCancelar }) {
  const [senha, setSenha] = useState('')
  const [erro, setErro]   = useState('')
  const [verificando, setVerificando] = useState(false)

  async function verificar() {
    if (!senha) return
    setVerificando(true)
    setErro('')
    try {
      const ok = await window.api.auth.verificarSenha(senha)
      if (ok) { onConfirmado() }
      else { setErro('Senha incorreta. Tente novamente.') }
    } finally {
      setVerificando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 mx-auto">
          <AlertCircle size={22} className="text-amber-500" />
        </div>
        <h3 className="text-base font-bold text-slate-800 text-center mb-1">Ação protegida</h3>
        <p className="text-sm text-slate-400 text-center mb-5">Digite a senha de administrador para continuar.</p>
        <input
          type="password"
          autoFocus
          value={senha}
          onChange={e => { setSenha(e.target.value); setErro('') }}
          onKeyDown={e => e.key === 'Enter' && verificar()}
          placeholder="Senha"
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 mb-2"
        />
        {erro && <p className="text-xs text-red-500 mb-3">{erro}</p>}
        <div className="flex gap-3 mt-2">
          <button onClick={onCancelar} disabled={verificando} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={verificar} disabled={verificando || !senha} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-60">
            {verificando ? <Loader2 size={14} className="animate-spin" /> : null}
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal de confirmação de cancelamento ──────────────────
function ModalCancelar({ venda, onConfirmar, onCancelar }) {
  const [motivo, setMotivo] = useState(null)
  const [salvando, setSalvando] = useState(false)

  const motivoSelecionado = MOTIVOS_CANCELAMENTO.find(m => m.key === motivo)

  async function confirmar() {
    if (!motivo) return
    setSalvando(true)
    await onConfirmar(venda.id, motivo, motivoSelecionado.voltaEstoque)
    setSalvando(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4 mx-auto">
          <XCircle size={22} className="text-red-500" />
        </div>
        <h3 className="text-base font-bold text-slate-800 text-center mb-1">Cancelar / Devolver venda?</h3>
        <p className="text-sm text-slate-400 text-center mb-5">
          Venda #{venda.id} · {fmt(venda.total_final)}
        </p>
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-600 mb-2">Selecione o motivo</label>
          <div className="space-y-2">
            {MOTIVOS_CANCELAMENTO.map(m => (
              <button
                key={m.key}
                onClick={() => setMotivo(m.key)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${motivo === m.key ? 'bg-red-50 border-red-300 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
              >
                <span>{m.label}</span>
                {!m.voltaEstoque && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">Sem retorno ao estoque</span>
                )}
              </button>
            ))}
          </div>
          {motivo && (
            <p className="text-xs mt-2 px-1">
              {motivoSelecionado.voltaEstoque
                ? <span className="text-emerald-700">✓ Os itens voltarão ao estoque.</span>
                : <span className="text-amber-700">⚠ Avaria: os itens <strong>não</strong> voltarão ao estoque.</span>
              }
              {' '}O lançamento será removido do financeiro.
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={onCancelar} disabled={salvando} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-50">
            Voltar
          </button>
          <button onClick={confirmar} disabled={salvando || !motivo} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60">
            {salvando ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
            {salvando ? 'Processando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Card de venda no histórico ────────────────────────────
function CardVenda({ venda, onCancelar }) {
  const [aberto, setAberto] = useState(false)

  const statusCor = {
    concluida: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    cancelada:  'bg-red-50    text-red-500    border-red-100',
    devolvida:  'bg-amber-50  text-amber-700  border-amber-100',
  }[venda.status] || 'bg-slate-50 text-slate-600 border-slate-100'

  const statusLabel = { concluida: 'Concluída', cancelada: 'Cancelada', devolvida: 'Devolvida' }[venda.status]

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
      <div className="flex items-center gap-4 px-4 py-3.5">
        <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <Receipt size={16} className="text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">Venda #{venda.id}</p>
          <p className="text-xs text-slate-400 truncate">
            {venda.nome_pet ? `${venda.nome_pet}` : ''}
            {(venda.nome_dono || venda.nome_cliente) ? ` · ${venda.nome_dono || venda.nome_cliente}` : ''}
            {!venda.nome_pet && !venda.nome_dono && !venda.nome_cliente ? 'Venda avulsa' : ''}
            {' · '}{new Date(venda.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-lg border font-semibold flex-shrink-0 ${statusCor}`}>
          {statusLabel}
        </span>
        <span className="text-sm font-bold text-slate-800 tabular-nums flex-shrink-0">
          {fmt(venda.total_final)}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => imprimirVenda({ ...venda, total: venda.total_final })}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors"
          >
            <Printer size={11} />
            Imprimir
          </button>
          {venda.status === 'concluida' && (
            <button
              onClick={() => onCancelar(venda)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-500 border border-red-100 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
            >
              <XCircle size={11} />
              Cancelar
            </button>
          )}
          <button
            onClick={() => setAberto(v => !v)}
            className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
          >
            {aberto ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {aberto && venda.itens && (
        <div className="border-t border-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Itens</p>
          <div className="space-y-1">
            {venda.itens.map(item => (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <span className="text-slate-600">{item.nome_produto}</span>
                <span className="text-slate-400">{item.quantidade} × {fmt(item.preco_unit)}</span>
                <span className="font-semibold text-slate-700">{fmt(item.subtotal)}</span>
              </div>
            ))}
          </div>
          {venda.desconto > 0 && (
            <div className="flex justify-between text-xs mt-2 pt-2 border-t border-slate-50">
              <span className="text-slate-400">Desconto</span>
              <span className="text-red-500 font-medium">-{fmt(venda.desconto)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold mt-1 pt-1 border-t border-slate-100">
            <span className="text-slate-700">Total</span>
            <span className="text-emerald-700">{fmt(venda.total_final)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────
export default function Vendas() {
  const [aba, setAba]             = useState('pdv')       // 'pdv' | 'historico'
  const [produtos, setProdutos]   = useState([])
  const [carrinho, setCarrinho]   = useState([])
  const [busca, setBusca]         = useState('')
  const [desconto, setDesconto]   = useState('')
  const [finalizando, setFinalizando] = useState(false)
  const [historico, setHistorico] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [erroVenda, setErroVenda] = useState('')
  const [modalCancelar, setModalCancelar] = useState(null)   // venda a cancelar
  const [vendaParaSenha, setVendaParaSenha] = useState(null) // venda aguardando senha
  const [tipoPgto, setTipoPgto]       = useState('vista') // 'vista' | 'prazo'
  const [vencimento, setVencimento]   = useState('')
  const [buscaCliente, setBuscaCliente] = useState('')
  const [clientes, setClientes]       = useState([])
  const [clienteSelecionado, setClienteSelecionado] = useState(null)
  const [nomeCliente, setNomeCliente] = useState('')
  const [showSugestoes, setShowSugestoes] = useState(false)
  // Entrega
  const [isEntrega, setIsEntrega]           = useState(false)
  const [entregaEndereco, setEntregaEndereco] = useState('')
  const [entregaTaxa, setEntregaTaxa]       = useState('')
  const [entregaResp, setEntregaResp]       = useState('')
  const [entregaObs, setEntregaObs]         = useState('')
  // Aba entregas
  const [listaEntregas, setListaEntregas]   = useState([])
  const [filtroEntrega, setFiltroEntrega]   = useState('todos')
  const [entregaEditando, setEntregaEditando] = useState(null)
  const [modalGranel, setModalGranel] = useState(null) // { produto, itemExistente? }

  // Carregar produtos do estoque
  const carregarProdutos = useCallback(async () => {
    const lista = await window.api.estoque.listar()
    setProdutos(lista || [])
  }, [])

  // Carregar histórico de vendas
  const carregarHistorico = useCallback(async () => {
    setCarregando(true)
    try {
      const lista = await window.api.vendas.listar()
      // Buscar itens de cada venda
      const comItens = await Promise.all(
        (lista || []).map(async v => {
          const detalhe = await window.api.vendas.buscarPorId(v.id)
          return detalhe || v
        })
      )
      setHistorico(comItens)
    } finally {
      setCarregando(false)
    }
  }, [])

  const carregarEntregas = useCallback(async () => {
    const lista = await window.api.entregas.listar()
    setListaEntregas(lista || [])
  }, [])

  useEffect(() => { carregarProdutos() }, [carregarProdutos])
  useEffect(() => {
    if (aba === 'historico') carregarHistorico()
    if (aba === 'entregas')  carregarEntregas()
  }, [aba, carregarHistorico, carregarEntregas])
  useEffect(() => { window.api.donos.listar().then(setClientes) }, [])

  // Produtos filtrados pela busca
  const produtosFiltrados = produtos.filter(p =>
    !busca || p.nome.toLowerCase().includes(busca.toLowerCase())
  )

  // Adicionar ao carrinho
  function adicionarProduto(produto) {
    if (produto.tipo === 'granel') {
      const existente = carrinho.find(i => i.id_produto === produto.id)
      setModalGranel({ produto, itemExistente: existente || null })
      return
    }
    setCarrinho(prev => {
      const existente = prev.find(i => i.id_produto === produto.id)
      if (existente) {
        if (existente.quantidade >= produto.quantidade) return prev // sem estoque
        return prev.map(i =>
          i.id_produto === produto.id
            ? { ...i, quantidade: i.quantidade + 1, subtotal: (i.quantidade + 1) * i.preco_unit }
            : i
        )
      }
      if (produto.quantidade <= 0) return prev // sem estoque
      return [...prev, {
        id_produto:   produto.id,
        nome_produto: produto.nome,
        preco_unit:   produto.preco_venda,
        unidade:      produto.unidade,
        quantidade:   1,
        subtotal:     produto.preco_venda,
        estoque_max:  produto.quantidade,
      }]
    })
  }

  // Confirmar kg de granel
  function confirmarGranel(produto, kg) {
    const precoKg = produto.preco_por_kg || 0
    setCarrinho(prev => {
      const existente = prev.find(i => i.id_produto === produto.id)
      const item = {
        id_produto:   produto.id,
        nome_produto: produto.nome,
        preco_unit:   precoKg,
        unidade:      'kg',
        quantidade:   kg,
        subtotal:     parseFloat((kg * precoKg).toFixed(2)),
        estoque_max:  999999,
        isGranel:     true,
      }
      if (existente) return prev.map(i => i.id_produto === produto.id ? item : i)
      return [...prev, item]
    })
    setModalGranel(null)
  }

  // Alterar quantidade no carrinho
  function alterarQtd(id_produto, novaQtd) {
    if (novaQtd <= 0) {
      setCarrinho(prev => prev.filter(i => i.id_produto !== id_produto))
    } else {
      setCarrinho(prev => prev.map(i =>
        i.id_produto === id_produto
          ? { ...i, quantidade: novaQtd, subtotal: novaQtd * i.preco_unit }
          : i
      ))
    }
  }

  function removerItem(id_produto) {
    setCarrinho(prev => prev.filter(i => i.id_produto !== id_produto))
  }

  // Totais
  const subtotal    = carrinho.reduce((s, i) => s + i.subtotal, 0)
  const descontoVal = Math.min(parseFloat(desconto || 0), subtotal)
  const taxaEntrega = isEntrega ? parseFloat(entregaTaxa || 0) : 0
  const totalFinal  = subtotal - descontoVal + taxaEntrega

  // Finalizar venda
  async function finalizarVenda() {
    if (carrinho.length === 0) return
    if (tipoPgto === 'prazo' && !clienteSelecionado) {
      alert('Selecione o cliente para venda a prazo (fiado).')
      return
    }
    setFinalizando(true)
    setErroVenda('')
    const foiEntrega = isEntrega && entregaEndereco.trim() !== ''
    try {
      const resVenda = await window.api.vendas.criar({
        itens:           carrinho,
        total:           subtotal,
        desconto:        descontoVal,
        total_final:     totalFinal,
        tipo_pagamento:  tipoPgto,
        id_dono:         clienteSelecionado?.id || null,
        nome_cliente:    nomeCliente.trim() || null,
        data_vencimento: vencimento || null,
      })
      if (foiEntrega) {
        await window.api.entregas.criar({
          id_venda:    resVenda?.id,
          endereco:    entregaEndereco.trim(),
          taxa:        parseFloat(entregaTaxa || 0),
          responsavel: entregaResp.trim() || null,
          observacoes: entregaObs.trim() || null,
        })
      }
      setCarrinho([])
      setDesconto('')
      setTipoPgto('vista')
      setClienteSelecionado(null)
      setBuscaCliente('')
      setVencimento('')
      setNomeCliente('')
      setShowSugestoes(false)
      setIsEntrega(false)
      setEntregaEndereco('')
      setEntregaTaxa('')
      setEntregaResp('')
      setEntregaObs('')
      await carregarProdutos()
      if (foiEntrega) {
        await carregarEntregas()
        setAba('entregas')
      } else {
        await carregarHistorico()
        setAba('historico')
      }
    } catch (e) {
      setErroVenda(e.message || 'Erro ao finalizar venda. Tente novamente.')
    } finally {
      setFinalizando(false)
    }
  }

  // Cancelar venda
  async function executarCancelamento(id, motivo, voltaEstoque) {
    await window.api.vendas.cancelar(id, motivo, voltaEstoque)
    setModalCancelar(null)
    carregarHistorico()
  }

  return (
    <div className="flex flex-col h-full gap-6 p-6">

      {/* Abas */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {[
          { key: 'pdv',       label: 'PDV',       icon: ShoppingCart },
          { key: 'historico', label: 'Histórico',  icon: Receipt },
          { key: 'entregas',  label: 'Entregas',   icon: Truck },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setAba(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              aba === key
                ? 'bg-white text-slate-800 shadow-soft'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── PDV ─────────────────────────────────────────────── */}
      {aba === 'pdv' && (
        <div className="flex gap-6 flex-1 min-h-0">

          {/* Coluna esquerda — produtos */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="relative mb-4">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar produto..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 gap-3 content-start">
              {produtosFiltrados.map(produto => {
                const isGranel = produto.tipo === 'granel'
                const semEstoque = !isGranel && produto.quantidade <= 0
                const noCarrinho = carrinho.find(i => i.id_produto === produto.id)
                return (
                  <button
                    key={produto.id}
                    onClick={() => adicionarProduto(produto)}
                    disabled={semEstoque}
                    className={`flex flex-col items-start gap-1 p-3.5 rounded-xl border text-left transition-all ${
                      semEstoque
                        ? 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed'
                        : noCarrinho
                          ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                          : 'bg-white border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 hover:shadow-sm'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1 ${isGranel ? 'bg-amber-100' : 'bg-slate-100'}`}>
                      {isGranel
                        ? <Wheat size={15} className="text-amber-600" />
                        : <Package size={15} className="text-slate-500" />
                      }
                    </div>
                    <p className="text-sm font-semibold text-slate-800 leading-tight line-clamp-2">{produto.nome}</p>
                    <p className="text-xs text-slate-400">{produto.categoria}</p>
                    <div className="flex items-center justify-between w-full mt-1">
                      <span className="text-sm font-bold text-emerald-700">
                        {isGranel ? `${fmt(produto.preco_por_kg)}/kg` : fmt(produto.preco_venda)}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        semEstoque ? 'bg-red-50 text-red-500' : isGranel ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {semEstoque ? 'Sem estoque' : isGranel ? `${Number(produto.quantidade).toFixed(1)} kg` : `${produto.quantidade} ${produto.unidade}`}
                      </span>
                    </div>
                  </button>
                )
              })}
              {produtosFiltrados.length === 0 && (
                <div className="col-span-3 py-16 text-center text-slate-400">
                  <Package size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{busca ? 'Nenhum produto encontrado' : 'Nenhum produto no estoque'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Coluna direita — carrinho */}
          <div className="w-80 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-soft">
            <div className="flex items-center gap-2 px-4 py-3.5 border-b border-slate-100">
              <ShoppingCart size={16} className="text-emerald-600" />
              <span className="text-sm font-bold text-slate-800">Carrinho</span>
              {carrinho.length > 0 && (
                <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                  {carrinho.length}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4">
              {carrinho.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 py-12">
                  <ShoppingCart size={32} className="mb-2" />
                  <p className="text-sm">Carrinho vazio</p>
                  <p className="text-xs mt-1">Clique nos produtos para adicionar</p>
                </div>
              ) : (
                carrinho.map(item => (
                  <ItemCarrinho
                    key={item.id_produto}
                    item={item}
                    onQtd={alterarQtd}
                    onRemover={removerItem}
                    onEditarKg={it => {
                      const prod = produtos.find(p => p.id === it.id_produto)
                      if (prod) setModalGranel({ produto: prod, itemExistente: it })
                    }}
                  />
                ))
              )}
            </div>

            {carrinho.length > 0 && (
              <div className="border-t border-slate-100 px-4 py-4 space-y-3">
                {/* Cliente */}
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <User size={13} className="text-slate-400 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Nome do cliente (opcional)"
                      value={nomeCliente}
                      onChange={e => { setNomeCliente(e.target.value); setClienteSelecionado(null); setShowSugestoes(true) }}
                      onFocus={() => setShowSugestoes(true)}
                      onBlur={() => setTimeout(() => setShowSugestoes(false), 150)}
                      className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  {showSugestoes && nomeCliente.length > 0 && (
                    <div className="absolute left-5 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-32 overflow-y-auto">
                      {clientes.filter(c => c.nome.toLowerCase().includes(nomeCliente.toLowerCase())).slice(0, 5).map(c => (
                        <button key={c.id} onMouseDown={() => { setNomeCliente(c.nome); setClienteSelecionado(c); setShowSugestoes(false); if (isEntrega && c.endereco) setEntregaEndereco(c.endereco) }}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-50 text-slate-700 transition-colors">
                          {c.nome}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Toggle Entrega */}
                <div>
                  <button
                    onClick={() => setIsEntrega(v => { const novo = !v; if (novo && clienteSelecionado?.endereco && !entregaEndereco) setEntregaEndereco(clienteSelecionado.endereco); return novo })}
                    className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${isEntrega ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                  >
                    <Truck size={13} />
                    {isEntrega ? 'Entrega ativada' : 'Marcar como entrega'}
                  </button>
                  {isEntrega && (
                    <div className="mt-2 space-y-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex items-start gap-2">
                        <MapPin size={12} className="text-blue-400 mt-1 flex-shrink-0" />
                        <textarea
                          placeholder="Endereço de entrega *"
                          value={entregaEndereco}
                          onChange={e => setEntregaEndereco(e.target.value)}
                          rows={2}
                          className="flex-1 px-2 py-1 bg-white border border-blue-200 rounded-lg text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="number" min="0" step="0.01"
                          placeholder="Taxa R$"
                          value={entregaTaxa}
                          onChange={e => setEntregaTaxa(e.target.value)}
                          className="w-20 px-2 py-1 bg-white border border-blue-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <input
                          type="text"
                          placeholder="Responsável"
                          value={entregaResp}
                          onChange={e => setEntregaResp(e.target.value)}
                          className="flex-1 px-2 py-1 bg-white border border-blue-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Observações (opcional)"
                        value={entregaObs}
                        onChange={e => setEntregaObs(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-blue-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  )}
                </div>

                {/* Desconto */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500 flex-shrink-0">Desconto R$</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={desconto}
                    onChange={e => setDesconto(e.target.value)}
                    placeholder="0,00"
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right"
                  />
                </div>

                {/* Totais */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Subtotal</span>
                    <span>{fmt(subtotal)}</span>
                  </div>
                  {descontoVal > 0 && (
                    <div className="flex justify-between text-xs text-red-500">
                      <span>Desconto</span>
                      <span>-{fmt(descontoVal)}</span>
                    </div>
                  )}
                  {taxaEntrega > 0 && (
                    <div className="flex justify-between text-xs text-blue-600">
                      <span>Taxa de entrega</span>
                      <span>+{fmt(taxaEntrega)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-slate-800 pt-1 border-t border-slate-100">
                    <span>Total</span>
                    <span className="text-emerald-700">{fmt(totalFinal)}</span>
                  </div>
                </div>

                {/* Tipo de pagamento */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1.5">Pagamento</p>
                  <div className="flex gap-2">
                    <button onClick={() => setTipoPgto('vista')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${tipoPgto === 'vista' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                      À Vista
                    </button>
                    <button onClick={() => setTipoPgto('prazo')}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${tipoPgto === 'prazo' ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                      <HandCoins size={11} /> Fiado
                    </button>
                  </div>
                </div>

                {/* Seletor de cliente (fiado) */}
                {tipoPgto === 'prazo' && (
                  <div className="space-y-2">
                    <div className="relative">
                      <User size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" placeholder="Buscar cliente..."
                        value={buscaCliente}
                        onChange={e => { setBuscaCliente(e.target.value); setClienteSelecionado(null) }}
                        className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                    {buscaCliente && !clienteSelecionado && (
                      <div className="border border-slate-200 rounded-lg overflow-hidden max-h-28 overflow-y-auto">
                        {clientes.filter(c => c.nome.toLowerCase().includes(buscaCliente.toLowerCase())).map(c => (
                          <button key={c.id}
                            onClick={() => { setClienteSelecionado(c); setBuscaCliente(c.nome) }}
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-amber-50 text-slate-700 transition-colors">
                            {c.nome}
                          </button>
                        ))}
                      </div>
                    )}
                    {clienteSelecionado && (
                      <p className="text-xs text-amber-700 font-medium bg-amber-50 px-2.5 py-1.5 rounded-lg">
                        ✓ {clienteSelecionado.nome}
                      </p>
                    )}
                    <input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                      title="Vencimento (opcional)"
                    />
                  </div>
                )}

                {/* Erro na venda */}
                {erroVenda && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    {erroVenda}
                  </div>
                )}

                {/* Botão finalizar */}
                <button
                  onClick={finalizarVenda}
                  disabled={finalizando || carrinho.length === 0}
                  className={`w-full flex items-center justify-center gap-2 py-3 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-60 ${tipoPgto === 'prazo' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                  {finalizando ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  {finalizando ? 'Finalizando...' : tipoPgto === 'prazo' ? 'Registrar Fiado' : 'Finalizar Venda'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── HISTÓRICO ─────────────────────────────────────────── */}
      {aba === 'historico' && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          {carregando ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 size={24} className="animate-spin text-slate-300" />
            </div>
          ) : historico.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <Receipt size={32} className="mb-2 opacity-30" />
              <p className="text-sm">Nenhuma venda registrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historico.map(venda => (
                <CardVenda
                  key={venda.id}
                  venda={venda}
                  onCancelar={setVendaParaSenha}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ENTREGAS ─────────────────────────────────────────── */}
      {aba === 'entregas' && (
        <div className="flex-1 min-h-0 flex flex-col gap-4">
          {/* Filtros */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'todos',        label: 'Todos',           cor: 'slate' },
              { key: 'aguardando',   label: 'Aguardando',      cor: 'blue' },
              { key: 'saiu',         label: 'Saiu p/ entrega', cor: 'amber' },
              { key: 'entregue',     label: 'Entregue',        cor: 'emerald' },
              { key: 'nao_entregue', label: 'Não entregue',    cor: 'red' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setFiltroEntrega(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filtroEntrega === key ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                {label}
              </button>
            ))}
            <button onClick={carregarEntregas} className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
              Atualizar
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {listaEntregas.filter(e => filtroEntrega === 'todos' || e.status === filtroEntrega).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <Truck size={32} className="mb-2 opacity-30" />
                <p className="text-sm">Nenhuma entrega encontrada</p>
              </div>
            ) : listaEntregas
              .filter(e => filtroEntrega === 'todos' || e.status === filtroEntrega)
              .map(entrega => {
                const statusCfg = {
                  aguardando:   { label: 'Aguardando',      cls: 'bg-blue-50 text-blue-700 border-blue-100',    icon: Clock },
                  saiu:         { label: 'Saiu p/ entrega', cls: 'bg-amber-50 text-amber-700 border-amber-100', icon: Truck },
                  entregue:     { label: 'Entregue',        cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCheck },
                  nao_entregue: { label: 'Não entregue',    cls: 'bg-red-50 text-red-500 border-red-100',       icon: AlertCircle },
                }[entrega.status] || { label: entrega.status, cls: 'bg-slate-50 text-slate-600', icon: Clock }
                const StatusIcon = statusCfg.icon
                const cliente = entrega.nome_dono || entrega.nome_cliente || 'Cliente não informado'
                const telefone = entrega.whatsapp_dono || entrega.telefone_dono
                const whatsappNum = telefone?.replace(/\D/g, '')

                return (
                  <div key={entrega.id} className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
                    <div className="flex items-start gap-3 px-4 py-3.5">
                      <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Truck size={16} className="text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-800">Entrega #{entrega.id}</p>
                          <span className="text-xs text-slate-400">· Venda #{entrega.id_venda}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-lg border font-semibold flex items-center gap-1 ${statusCfg.cls}`}>
                            <StatusIcon size={10} /> {statusCfg.label}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-700 mt-0.5">{cliente}</p>
                        <div className="flex items-start gap-1 mt-0.5">
                          <MapPin size={11} className="text-slate-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-slate-500">{entrega.endereco}</p>
                        </div>
                        {entrega.responsavel && (
                          <p className="text-xs text-slate-400 mt-0.5">Responsável: {entrega.responsavel}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-bold text-slate-700">{fmt(entrega.total_final)}</span>
                          {entrega.taxa > 0 && <span className="text-xs text-blue-600">+{fmt(entrega.taxa)} taxa</span>}
                          <span className="text-xs text-slate-400">{new Date(entrega.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="border-t border-slate-50 px-4 py-2.5 flex items-center gap-2 flex-wrap">
                      {/* Avançar status */}
                      {entrega.status === 'aguardando' && (
                        <button onClick={async () => { await window.api.entregas.atualizarStatus(entrega.id, 'saiu'); carregarEntregas() }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors">
                          <Truck size={11} /> Saiu p/ entrega
                        </button>
                      )}
                      {entrega.status === 'saiu' && (
                        <>
                          <button onClick={async () => { await window.api.entregas.atualizarStatus(entrega.id, 'entregue'); carregarEntregas() }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors">
                            <CheckCheck size={11} /> Confirmar entrega
                          </button>
                          <button onClick={async () => { await window.api.entregas.atualizarStatus(entrega.id, 'nao_entregue'); carregarEntregas() }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-500 border border-red-100 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors">
                            <AlertCircle size={11} /> Não entregue
                          </button>
                        </>
                      )}
                      {entrega.status === 'nao_entregue' && (
                        <button onClick={async () => { await window.api.entregas.atualizarStatus(entrega.id, 'aguardando'); carregarEntregas() }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                          <Clock size={11} /> Recolocar na fila
                        </button>
                      )}

                      {/* WhatsApp */}
                      {whatsappNum && (
                        <button onClick={() => window.api.shell.abrirExterno(`https://wa.me/55${whatsappNum}?text=${encodeURIComponent(`Olá ${cliente}! Seu pedido está a caminho. 🚚`)}`)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors">
                          <Phone size={11} /> WhatsApp
                        </button>
                      )}

                      {/* Imprimir romaneio */}
                      <button onClick={() => imprimirEntrega(entrega)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors">
                        <Printer size={11} /> Romaneio
                      </button>

                      {/* Editar */}
                      <button onClick={() => setEntregaEditando(entrega)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors">
                        <Edit2 size={11} /> Editar
                      </button>
                    </div>

                    {/* Itens colapsados */}
                    {entrega.itens?.length > 0 && (
                      <div className="border-t border-slate-50 px-4 py-2 bg-slate-50/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Itens</p>
                        {entrega.itens.map(item => (
                          <div key={item.id} className="flex justify-between text-xs text-slate-500">
                            <span>{item.nome_produto}</span>
                            <span>{item.quantidade}x {fmt(item.preco_unit)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Modal editar entrega */}
      {entregaEditando && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-3">
            <h3 className="text-base font-bold text-slate-800">Editar entrega #{entregaEditando.id}</h3>
            <div>
              <label className="text-xs font-semibold text-slate-600">Endereço</label>
              <textarea rows={2} value={entregaEditando.endereco}
                onChange={e => setEntregaEditando(v => ({ ...v, endereco: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-600">Taxa R$</label>
                <input type="number" min="0" step="0.01" value={entregaEditando.taxa}
                  onChange={e => setEntregaEditando(v => ({ ...v, taxa: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-600">Responsável</label>
                <input type="text" value={entregaEditando.responsavel || ''}
                  onChange={e => setEntregaEditando(v => ({ ...v, responsavel: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Observações</label>
              <input type="text" value={entregaEditando.observacoes || ''}
                onChange={e => setEntregaEditando(v => ({ ...v, observacoes: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEntregaEditando(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors">
                Cancelar
              </button>
              <button onClick={async () => {
                await window.api.entregas.editar(entregaEditando.id, {
                  endereco:    entregaEditando.endereco,
                  taxa:        parseFloat(entregaEditando.taxa || 0),
                  responsavel: entregaEditando.responsavel,
                  observacoes: entregaEditando.observacoes,
                })
                setEntregaEditando(null)
                carregarEntregas()
              }} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal senha antes de cancelar */}
      {vendaParaSenha && !modalCancelar && (
        <ModalSenha
          onConfirmado={() => { setModalCancelar(vendaParaSenha); setVendaParaSenha(null) }}
          onCancelar={() => setVendaParaSenha(null)}
        />
      )}

      {/* Modal cancelar */}
      {modalCancelar && (
        <ModalCancelar
          venda={modalCancelar}
          onConfirmar={executarCancelamento}
          onCancelar={() => setModalCancelar(null)}
        />
      )}
      {modalGranel && (
        <ModalGranel
          produto={modalGranel.produto}
          itemExistente={modalGranel.itemExistente}
          onConfirmar={confirmarGranel}
          onFechar={() => setModalGranel(null)}
        />
      )}
    </div>
  )
}
