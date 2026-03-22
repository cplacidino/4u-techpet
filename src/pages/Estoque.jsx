import { useState, useEffect, useCallback } from 'react'
import {
  Package, Plus, Search, AlertTriangle, Pencil, Trash2,
  X, Save, Loader2, TrendingUp, TrendingDown, History,
  ArrowLeft
} from 'lucide-react'

// ── Utilitários ───────────────────────────────────────────

function fmtMoeda(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtData(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const CATEGORIAS = ['Alimentação', 'Higiene', 'Medicamentos', 'Acessórios', 'Vacinas', 'Outros']

// ── Modal: Criar / Editar produto ─────────────────────────

function ModalProduto({ produto, onSalvar, onFechar }) {
  const editando = !!produto
  const [form, setForm] = useState({
    nome: '', categoria: 'Alimentação', quantidade: '', unidade: 'un',
    quantidade_min: '0', preco_custo: '', preco_venda: '', observacoes: '',
  })
  const [erros, setErros] = useState({})
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (editando) {
      setForm({
        nome:          produto.nome || '',
        categoria:     produto.categoria || 'Alimentação',
        quantidade:    produto.quantidade ?? '',
        unidade:       produto.unidade || 'un',
        quantidade_min: produto.quantidade_min ?? '0',
        preco_custo:   produto.preco_custo ?? '',
        preco_venda:   produto.preco_venda ?? '',
        observacoes:   produto.observacoes || '',
      })
    }
  }, [editando]) // eslint-disable-line

  function set(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
    if (erros[campo]) setErros(e => ({ ...e, [campo]: null }))
  }

  async function salvar() {
    const e = {}
    if (!form.nome.trim()) e.nome = 'Informe o nome'
    if (form.quantidade === '' || Number(form.quantidade) < 0) e.quantidade = 'Informe a quantidade'
    if (Object.keys(e).length) { setErros(e); return }

    setSalvando(true)
    try {
      const dados = {
        nome:          form.nome.trim(),
        categoria:     form.categoria,
        quantidade:    Number(form.quantidade),
        unidade:       form.unidade || 'un',
        quantidade_min: Number(form.quantidade_min) || 0,
        preco_custo:   form.preco_custo ? Number(form.preco_custo) : null,
        preco_venda:   form.preco_venda ? Number(form.preco_venda) : null,
        observacoes:   form.observacoes.trim() || null,
      }
      if (editando) {
        await window.api.estoque.editar(produto.id, dados)
      } else {
        await window.api.estoque.criar(dados)
      }
      onSalvar()
    } finally {
      setSalvando(false)
    }
  }

  const inputCls = (campo) => `w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors ${
    erros[campo] ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 focus:ring-emerald-500/30 focus:border-emerald-400'
  }`

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">{editando ? 'Editar produto' : 'Novo produto'}</h3>
          <button onClick={onFechar} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Nome do produto *</label>
            <input type="text" placeholder="Ex: Ração Premium 15kg" value={form.nome} onChange={e => set('nome', e.target.value)} className={inputCls('nome')} />
            {erros.nome && <p className="text-xs text-red-500 mt-1">{erros.nome}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Categoria</label>
              <select value={form.categoria} onChange={e => set('categoria', e.target.value)} className={inputCls('categoria')}>
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Unidade</label>
              <select value={form.unidade} onChange={e => set('unidade', e.target.value)} className={inputCls('unidade')}>
                {['un', 'kg', 'g', 'L', 'mL', 'cx', 'pct'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Quantidade atual *</label>
              <input type="number" step="0.01" min="0" value={form.quantidade} onChange={e => set('quantidade', e.target.value)} className={inputCls('quantidade')} />
              {erros.quantidade && <p className="text-xs text-red-500 mt-1">{erros.quantidade}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Estoque mínimo</label>
              <input type="number" step="0.01" min="0" value={form.quantidade_min} onChange={e => set('quantidade_min', e.target.value)} className={inputCls('quantidade_min')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Preço de custo</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                <input type="number" step="0.01" min="0" placeholder="0,00" value={form.preco_custo} onChange={e => set('preco_custo', e.target.value)} className={`${inputCls('preco_custo')} pl-9`} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Preço de venda</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                <input type="number" step="0.01" min="0" placeholder="0,00" value={form.preco_venda} onChange={e => set('preco_venda', e.target.value)} className={`${inputCls('preco_venda')} pl-9`} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Observações</label>
            <textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)} rows={2} placeholder="Fornecedor, validade, etc." className={`${inputCls('observacoes')} resize-none`} />
          </div>
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onFechar} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {salvando ? <><Loader2 size={14} className="animate-spin" />Salvando...</> : <><Save size={14} />{editando ? 'Salvar' : 'Adicionar'}</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal: Movimentar estoque ─────────────────────────────

function ModalMovimentacao({ produto, onSalvar, onFechar }) {
  const [tipo, setTipo] = useState('entrada')
  const [quantidade, setQuantidade] = useState('')
  const [motivo, setMotivo] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  async function salvar() {
    if (!quantidade || Number(quantidade) <= 0) { setErro('Informe uma quantidade válida'); return }
    if (tipo === 'saida' && Number(quantidade) > produto.quantidade) { setErro('Quantidade maior que o estoque atual'); return }
    setSalvando(true)
    try {
      await window.api.estoque.movimentar(produto.id, tipo, Number(quantidade), motivo || null)
      onSalvar()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-800">Movimentar estoque</h3>
            <p className="text-xs text-slate-400 mt-0.5">{produto.nome} · Atual: {produto.quantidade} {produto.unidade}</p>
          </div>
          <button onClick={onFechar} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setTipo('entrada')} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${tipo === 'entrada' ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500'}`}>
              <TrendingUp size={15} />Entrada
            </button>
            <button onClick={() => setTipo('saida')} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${tipo === 'saida' ? 'border-red-400 bg-red-50 text-red-600' : 'border-slate-200 text-slate-500'}`}>
              <TrendingDown size={15} />Saída
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Quantidade *</label>
            <input type="number" step="0.01" min="0.01" placeholder="0" value={quantidade} onChange={e => { setQuantidade(e.target.value); setErro('') }} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400" />
            {erro && <p className="text-xs text-red-500 mt-1">{erro}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Motivo</label>
            <input type="text" placeholder="Ex: Venda, compra, ajuste..." value={motivo} onChange={e => setMotivo(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400" />
          </div>
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onFechar} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className={`flex-1 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors text-white ${tipo === 'entrada' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600'}`}>
            {salvando ? 'Salvando...' : `Confirmar ${tipo}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Card de produto ───────────────────────────────────────

function ProdutoCard({ produto, onEditar, onMovimentar, onHistorico, onDeletar }) {
  const abaixoMin = produto.quantidade_min > 0 && produto.quantidade <= produto.quantidade_min
  const zerado = produto.quantidade === 0
  const margem = produto.preco_custo && produto.preco_venda
    ? (((produto.preco_venda - produto.preco_custo) / produto.preco_custo) * 100).toFixed(0)
    : null

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow ${zerado ? 'border-red-200' : abaixoMin ? 'border-amber-200' : 'border-slate-100'}`}>
      <div className={`h-1 ${zerado ? 'bg-red-400' : abaixoMin ? 'bg-amber-400' : 'bg-emerald-400'}`} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 truncate text-sm">{produto.nome}</p>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{produto.categoria}</span>
          </div>
          {(zerado || abaixoMin) && (
            <AlertTriangle size={16} className={`flex-shrink-0 ${zerado ? 'text-red-500' : 'text-amber-500'}`} />
          )}
        </div>

        {/* Quantidade */}
        <div className={`rounded-xl p-3 mb-3 text-center ${zerado ? 'bg-red-50' : abaixoMin ? 'bg-amber-50' : 'bg-emerald-50'}`}>
          <p className={`text-3xl font-bold ${zerado ? 'text-red-600' : abaixoMin ? 'text-amber-600' : 'text-emerald-700'}`}>
            {produto.quantidade}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{produto.unidade}</p>
          {produto.quantidade_min > 0 && (
            <p className="text-[10px] text-slate-400 mt-1">Mín: {produto.quantidade_min} {produto.unidade}</p>
          )}
        </div>

        {/* Preços + margem */}
        {(produto.preco_custo || produto.preco_venda) && (
          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
            {produto.preco_custo && (
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <p className="text-slate-400">Custo</p>
                <p className="font-semibold text-slate-700">{fmtMoeda(produto.preco_custo)}</p>
              </div>
            )}
            {produto.preco_venda && (
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <p className="text-slate-400">Venda {margem && <span className="text-emerald-600">+{margem}%</span>}</p>
                <p className="font-semibold text-slate-700">{fmtMoeda(produto.preco_venda)}</p>
              </div>
            )}
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center gap-1.5">
          <button onClick={() => onMovimentar(produto)} className="flex-1 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 transition-colors">
            Movimentar
          </button>
          <button onClick={() => onHistorico(produto)} title="Histórico" className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <History size={14} />
          </button>
          <button onClick={() => onEditar(produto)} title="Editar" className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
            <Pencil size={14} />
          </button>
          <button onClick={() => onDeletar(produto)} title="Excluir" className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Painel de histórico ───────────────────────────────────

function PainelHistorico({ produto, onFechar }) {
  const [historico, setHistorico] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    window.api.estoque.historicoMovimentacoes(produto.id).then(h => {
      setHistorico(h)
      setCarregando(false)
    })
  }, [produto.id])

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onFechar} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{produto.nome}</h2>
          <p className="text-sm text-slate-400 mt-0.5">Histórico de movimentações</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        {carregando ? (
          <div className="p-4 space-y-2 animate-pulse">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl" />)}
          </div>
        ) : historico.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <History size={28} className="text-slate-200 mb-3" />
            <p className="text-sm text-slate-400">Nenhuma movimentação registrada</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {historico.map(m => (
              <div key={m.id} className="flex items-center gap-4 px-4 py-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${m.tipo === 'entrada' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  {m.tipo === 'entrada'
                    ? <TrendingUp size={14} className="text-emerald-600" />
                    : <TrendingDown size={14} className="text-red-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700">{m.motivo || (m.tipo === 'entrada' ? 'Entrada' : 'Saída')}</p>
                  <p className="text-xs text-slate-400">{fmtData(m.criado_em)}</p>
                </div>
                <span className={`text-sm font-bold flex-shrink-0 ${m.tipo === 'entrada' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {m.tipo === 'entrada' ? '+' : '-'}{m.quantidade} {produto.unidade}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Modal confirmar exclusão ──────────────────────────────

function ModalDelete({ produto, onConfirmar, onFechar }) {
  const [deletando, setDeletando] = useState(false)
  async function confirmar() {
    setDeletando(true)
    await window.api.estoque.deletar(produto.id)
    onConfirmar()
  }
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} className="text-red-500" />
        </div>
        <h3 className="font-semibold text-slate-800 mb-1">Excluir produto?</h3>
        <p className="text-sm text-slate-400 mb-5"><strong>{produto.nome}</strong> será removido permanentemente.</p>
        <div className="flex gap-3">
          <button onClick={onFechar} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition-colors">Cancelar</button>
          <button onClick={confirmar} disabled={deletando} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors">
            {deletando ? 'Excluindo...' : 'Excluir'}
          </button>
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
        <div className="h-4 bg-slate-200 rounded w-32" />
        <div className="h-20 bg-slate-100 rounded-xl" />
        <div className="flex gap-2">
          <div className="flex-1 h-8 bg-slate-100 rounded-xl" />
          <div className="w-8 h-8 bg-slate-100 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────

export default function Estoque() {
  const [produtos, setProdutos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas')
  const [modal, setModal] = useState(null)          // null | 'novo' | produto (editar)
  const [modalMov, setModalMov] = useState(null)    // produto para movimentar
  const [modalDelete, setModalDelete] = useState(null)
  const [painelHistorico, setPainelHistorico] = useState(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const lista = await window.api.estoque.listar()
      setProdutos(lista)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  function aposAcao() {
    setModal(null); setModalMov(null); setModalDelete(null)
    carregar()
  }

  if (painelHistorico) {
    return <PainelHistorico produto={painelHistorico} onFechar={() => setPainelHistorico(null)} />
  }

  // Filtragem
  const filtrados = produtos.filter(p => {
    const t = busca.toLowerCase()
    const buscaOk = !busca || p.nome?.toLowerCase().includes(t) || p.categoria?.toLowerCase().includes(t)
    const catOk = categoriaFiltro === 'Todas' || p.categoria === categoriaFiltro
    return buscaOk && catOk
  })

  const alertas = produtos.filter(p => p.quantidade_min > 0 && p.quantidade <= p.quantidade_min)
  const valorTotal = produtos.reduce((s, p) => s + ((p.preco_venda || 0) * p.quantidade), 0)

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Estoque</h2>
          <p className="text-sm text-slate-400 mt-0.5">Produtos e insumos</p>
        </div>
        <button onClick={() => setModal('novo')} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-emerald-700 transition-colors">
          <Plus size={16} />
          Novo produto
        </button>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Package size={19} className="text-slate-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{produtos.length}</p>
            <p className="text-xs text-slate-400">Produtos cadastrados</p>
          </div>
        </div>
        <div className={`bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-3 ${alertas.length > 0 ? 'border-amber-100' : 'border-slate-100'}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${alertas.length > 0 ? 'bg-amber-50' : 'bg-slate-50'}`}>
            <AlertTriangle size={19} className={alertas.length > 0 ? 'text-amber-500' : 'text-slate-400'} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{alertas.length}</p>
            <p className="text-xs text-slate-400">Abaixo do mínimo</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp size={19} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">{fmtMoeda(valorTotal)}</p>
            <p className="text-xs text-slate-400">Valor total em estoque</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" placeholder="Buscar produto..."
            value={busca} onChange={e => setBusca(e.target.value)}
            className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm w-56 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {['Todas', ...CATEGORIAS].map(c => (
            <button
              key={c}
              onClick={() => setCategoriaFiltro(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${categoriaFiltro === c ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} />)}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
              <Package size={28} className="text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-700 mb-1">
              {busca || categoriaFiltro !== 'Todas' ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
            </h3>
            <p className="text-sm text-slate-400 max-w-xs">
              {busca || categoriaFiltro !== 'Todas' ? 'Tente outros filtros.' : 'Adicione produtos para controlar seu estoque.'}
            </p>
            {!busca && categoriaFiltro === 'Todas' && (
              <button onClick={() => setModal('novo')} className="mt-4 flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
                <Plus size={15} />Novo produto
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-400">{filtrados.length} produto{filtrados.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtrados.map(p => (
              <ProdutoCard
                key={p.id}
                produto={p}
                onEditar={setModal}
                onMovimentar={setModalMov}
                onHistorico={setPainelHistorico}
                onDeletar={setModalDelete}
              />
            ))}
          </div>
        </>
      )}

      {/* Modais */}
      {modal && (
        <ModalProduto produto={modal === 'novo' ? null : modal} onSalvar={aposAcao} onFechar={() => setModal(null)} />
      )}
      {modalMov && (
        <ModalMovimentacao produto={modalMov} onSalvar={aposAcao} onFechar={() => setModalMov(null)} />
      )}
      {modalDelete && (
        <ModalDelete produto={modalDelete} onConfirmar={aposAcao} onFechar={() => setModalDelete(null)} />
      )}
    </div>
  )
}
