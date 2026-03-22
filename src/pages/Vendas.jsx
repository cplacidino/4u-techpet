import { useState, useEffect, useCallback } from 'react'
import {
  ShoppingCart, Plus, Minus, Trash2, Search, CheckCircle2,
  XCircle, Receipt, Package, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react'

// ── Formata moeda ─────────────────────────────────────────
function fmt(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ── Item do carrinho ──────────────────────────────────────
function ItemCarrinho({ item, onQtd, onRemover }) {
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

// ── Modal de confirmação de cancelamento ──────────────────
function ModalCancelar({ venda, onConfirmar, onCancelar }) {
  const [motivo, setMotivo] = useState('cancelada')
  const [salvando, setSalvando] = useState(false)

  async function confirmar() {
    setSalvando(true)
    await onConfirmar(venda.id, motivo)
    setSalvando(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4 mx-auto">
          <XCircle size={22} className="text-red-500" />
        </div>
        <h3 className="text-base font-bold text-slate-800 text-center mb-1">Cancelar venda?</h3>
        <p className="text-sm text-slate-400 text-center mb-5">
          Venda #{venda.id} · {fmt(venda.total_final)}
        </p>
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-600 mb-2">Motivo</label>
          <div className="flex gap-2">
            <button
              onClick={() => setMotivo('cancelada')}
              className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${motivo === 'cancelada' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
            >
              Cancelamento
            </button>
            <button
              onClick={() => setMotivo('devolvida')}
              className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${motivo === 'devolvida' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
            >
              Devolução
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            O estoque será restaurado e o lançamento removido do financeiro.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancelar} disabled={salvando} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-50">
            Voltar
          </button>
          <button onClick={confirmar} disabled={salvando} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60">
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
            {venda.nome_dono ? ` · ${venda.nome_dono}` : ''}
            {!venda.nome_pet && !venda.nome_dono ? 'Venda avulsa' : ''}
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
  const [modalCancelar, setModalCancelar] = useState(null) // venda a cancelar

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

  useEffect(() => { carregarProdutos() }, [carregarProdutos])
  useEffect(() => {
    if (aba === 'historico') carregarHistorico()
  }, [aba, carregarHistorico])

  // Produtos filtrados pela busca
  const produtosFiltrados = produtos.filter(p =>
    !busca || p.nome.toLowerCase().includes(busca.toLowerCase())
  )

  // Adicionar ao carrinho
  function adicionarProduto(produto) {
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
  const totalFinal  = subtotal - descontoVal

  // Finalizar venda
  async function finalizarVenda() {
    if (carrinho.length === 0) return
    setFinalizando(true)
    try {
      await window.api.vendas.criar({
        itens:       carrinho,
        total:       subtotal,
        desconto:    descontoVal,
        total_final: totalFinal,
      })
      setCarrinho([])
      setDesconto('')
      await carregarProdutos() // atualiza estoque
      setAba('historico')
      carregarHistorico()
    } finally {
      setFinalizando(false)
    }
  }

  // Cancelar venda
  async function executarCancelamento(id, motivo) {
    await window.api.vendas.cancelar(id, motivo)
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
                const semEstoque = produto.quantidade <= 0
                return (
                  <button
                    key={produto.id}
                    onClick={() => adicionarProduto(produto)}
                    disabled={semEstoque}
                    className={`flex flex-col items-start gap-1 p-3.5 rounded-xl border text-left transition-all ${
                      semEstoque
                        ? 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed'
                        : 'bg-white border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 hover:shadow-sm'
                    }`}
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mb-1">
                      <Package size={15} className="text-slate-500" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800 leading-tight line-clamp-2">{produto.nome}</p>
                    <p className="text-xs text-slate-400">{produto.categoria}</p>
                    <div className="flex items-center justify-between w-full mt-1">
                      <span className="text-sm font-bold text-emerald-700">{fmt(produto.preco_venda)}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        semEstoque ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {semEstoque ? 'Sem estoque' : `${produto.quantidade} ${produto.unidade}`}
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
                  />
                ))
              )}
            </div>

            {carrinho.length > 0 && (
              <div className="border-t border-slate-100 px-4 py-4 space-y-3">
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
                  <div className="flex justify-between text-base font-bold text-slate-800 pt-1 border-t border-slate-100">
                    <span>Total</span>
                    <span className="text-emerald-700">{fmt(totalFinal)}</span>
                  </div>
                </div>

                {/* Botão finalizar */}
                <button
                  onClick={finalizarVenda}
                  disabled={finalizando || carrinho.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-60"
                >
                  {finalizando
                    ? <Loader2 size={16} className="animate-spin" />
                    : <CheckCircle2 size={16} />}
                  {finalizando ? 'Finalizando...' : 'Finalizar Venda'}
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
                  onCancelar={setModalCancelar}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal cancelar */}
      {modalCancelar && (
        <ModalCancelar
          venda={modalCancelar}
          onConfirmar={executarCancelamento}
          onCancelar={() => setModalCancelar(null)}
        />
      )}
    </div>
  )
}
