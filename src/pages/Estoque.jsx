import { useState, useEffect, useCallback } from 'react'
import {
  Package, Plus, Search, AlertTriangle, Pencil, Trash2,
  X, Save, Loader2, TrendingUp, TrendingDown, History,
  ArrowLeft, Lock, Unlock, Eye, EyeOff, XCircle, ChevronDown, ChevronUp,
  CheckSquare, Square, CheckCheck, Wheat, Box, Link, PackageOpen,
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
    tipo: 'pacote', peso_por_pacote: '', preco_por_kg: '', id_pacote_vinculado: '',
  })
  const [erros, setErros] = useState({})
  const [salvando, setSalvando] = useState(false)
  const [pacotes, setPacotes] = useState([])

  useEffect(() => {
    window.api.estoque.listarPacotes().then(p => setPacotes(p || []))
  }, [])

  useEffect(() => {
    if (editando) {
      setForm({
        nome:                produto.nome || '',
        categoria:           produto.categoria || 'Alimentação',
        quantidade:          produto.quantidade ?? '',
        unidade:             produto.unidade || 'un',
        quantidade_min:      produto.quantidade_min ?? '0',
        preco_custo:         produto.preco_custo ?? '',
        preco_venda:         produto.preco_venda ?? '',
        observacoes:         produto.observacoes || '',
        tipo:                produto.tipo || 'pacote',
        peso_por_pacote:     produto.peso_por_pacote ?? '',
        preco_por_kg:        produto.preco_por_kg ?? '',
        id_pacote_vinculado: produto.id_pacote_vinculado ?? '',
      })
    }
  }, [editando]) // eslint-disable-line

  function set(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
    if (erros[campo]) setErros(e => ({ ...e, [campo]: null }))
  }

  const isGranel = form.tipo === 'granel'

  async function salvar() {
    const e = {}
    if (!form.nome.trim()) e.nome = 'Informe o nome'
    if (!isGranel && (form.quantidade === '' || Number(form.quantidade) < 0)) e.quantidade = 'Informe a quantidade'
    if (isGranel && (!form.peso_por_pacote || Number(form.peso_por_pacote) <= 0)) e.peso_por_pacote = 'Informe o peso do pacote (kg)'
    if (isGranel && (!form.preco_por_kg || Number(form.preco_por_kg) <= 0)) e.preco_por_kg = 'Informe o preço por kg'
    if (Object.keys(e).length) { setErros(e); return }

    setSalvando(true)
    try {
      const dados = {
        nome:                form.nome.trim(),
        categoria:           form.categoria,
        quantidade:          isGranel ? (Number(form.quantidade) || 0) : Number(form.quantidade),
        unidade:             isGranel ? 'kg' : (form.unidade || 'un'),
        quantidade_min:      Number(form.quantidade_min) || 0,
        preco_custo:         form.preco_custo ? Number(form.preco_custo) : null,
        preco_venda:         form.preco_venda ? Number(form.preco_venda) : null,
        observacoes:         form.observacoes.trim() || null,
        tipo:                form.tipo,
        peso_por_pacote:     isGranel && form.peso_por_pacote ? Number(form.peso_por_pacote) : null,
        preco_por_kg:        isGranel && form.preco_por_kg ? Number(form.preco_por_kg) : null,
        id_pacote_vinculado: isGranel && form.id_pacote_vinculado ? Number(form.id_pacote_vinculado) : null,
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

          {/* Tipo de produto */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Tipo de produto</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => set('tipo', 'pacote')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${!isGranel ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                <Box size={15} /> Pacote / Unidade
              </button>
              <button
                type="button"
                onClick={() => set('tipo', 'granel')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${isGranel ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                <Wheat size={15} /> Granel (kg)
              </button>
            </div>
            {isGranel && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5 mt-2">
                Produto vendido a granel. O estoque é em kg e se reabastece automaticamente ao abrir pacotes.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Nome do produto *</label>
            <input type="text" placeholder={isGranel ? 'Ex: Ração Premium (Granel)' : 'Ex: Ração Premium 15kg'} value={form.nome} onChange={e => set('nome', e.target.value)} className={inputCls('nome')} />
            {erros.nome && <p className="text-xs text-red-500 mt-1">{erros.nome}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Categoria</label>
              <select value={form.categoria} onChange={e => set('categoria', e.target.value)} className={inputCls('categoria')}>
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            {!isGranel && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Unidade</label>
                <select value={form.unidade} onChange={e => set('unidade', e.target.value)} className={inputCls('unidade')}>
                  {['un', 'kg', 'g', 'L', 'mL', 'cx', 'pct'].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                {isGranel ? 'Estoque atual (kg)' : 'Quantidade atual *'}
              </label>
              <input type="number" step="0.01" min="0" value={form.quantidade} onChange={e => set('quantidade', e.target.value)} className={inputCls('quantidade')} />
              {erros.quantidade && <p className="text-xs text-red-500 mt-1">{erros.quantidade}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                {isGranel ? 'Mínimo (kg)' : 'Estoque mínimo'}
              </label>
              <input type="number" step="0.01" min="0" value={form.quantidade_min} onChange={e => set('quantidade_min', e.target.value)} className={inputCls('quantidade_min')} />
            </div>
          </div>

          {/* Campos exclusivos do granel */}
          {isGranel && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5"><Wheat size={13} /> Configuração Granel</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Peso por pacote (kg) *</label>
                  <input type="number" step="0.1" min="0.1" placeholder="Ex: 15" value={form.peso_por_pacote} onChange={e => set('peso_por_pacote', e.target.value)} className={inputCls('peso_por_pacote')} />
                  {erros.peso_por_pacote && <p className="text-xs text-red-500 mt-1">{erros.peso_por_pacote}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Preço por kg (R$) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                    <input type="number" step="0.01" min="0.01" placeholder="0,00" value={form.preco_por_kg} onChange={e => set('preco_por_kg', e.target.value)} className={`${inputCls('preco_por_kg')} pl-9`} />
                  </div>
                  {erros.preco_por_kg && <p className="text-xs text-red-500 mt-1">{erros.preco_por_kg}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  <span className="flex items-center gap-1"><Link size={11} /> Pacote vinculado (origem do granel)</span>
                </label>
                <select
                  value={form.id_pacote_vinculado}
                  onChange={e => set('id_pacote_vinculado', e.target.value)}
                  className={inputCls('id_pacote_vinculado')}
                >
                  <option value="">— Nenhum —</option>
                  {pacotes.filter(p => !editando || p.id !== produto?.id).map(p => (
                    <option key={p.id} value={p.id}>{p.nome} ({p.quantidade} {p.unidade})</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Quando o granel acabar, o sistema abre pacotes automaticamente.</p>
              </div>
            </div>
          )}

          {/* Preços */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Preço de custo</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                <input type="number" step="0.01" min="0" placeholder="0,00" value={form.preco_custo} onChange={e => set('preco_custo', e.target.value)} className={`${inputCls('preco_custo')} pl-9`} />
              </div>
            </div>
            {!isGranel && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Preço de venda</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                  <input type="number" step="0.01" min="0" placeholder="0,00" value={form.preco_venda} onChange={e => set('preco_venda', e.target.value)} className={`${inputCls('preco_venda')} pl-9`} />
                </div>
              </div>
            )}
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

// ── Modal: Puxar pacotes para granel ─────────────────────

function ModalPuxarPacotes({ produto, onSalvar, onFechar }) {
  const [n, setN] = useState('1')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [resultado, setResultado] = useState(null)

  async function puxar() {
    const qtd = parseInt(n)
    if (!qtd || qtd <= 0) { setErro('Informe a quantidade de pacotes'); return }
    setSalvando(true)
    setErro('')
    try {
      const res = await window.api.estoque.puxarPacotes(produto.id, qtd)
      setResultado(res)
    } catch (e) {
      setErro(e.message || 'Erro ao puxar pacotes')
    } finally {
      setSalvando(false)
    }
  }

  if (resultado) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <PackageOpen size={24} className="text-emerald-600" />
          </div>
          <h3 className="font-semibold text-slate-800 mb-1">Pacotes abertos!</h3>
          <p className="text-sm text-slate-500 mb-4">
            +<strong>{resultado.kg_adicionado} kg</strong> adicionados ao granel.<br />
            Estoque atual: <strong>{resultado.granel?.quantidade?.toFixed(2)} kg</strong>
          </p>
          <button onClick={onSalvar} className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
            Fechar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-800">Puxar pacotes para granel</h3>
            <p className="text-xs text-slate-400 mt-0.5">{produto.nome} · {produto.quantidade?.toFixed(2)} kg disponíveis</p>
          </div>
          <button onClick={onFechar} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700">
            Cada pacote = <strong>{produto.peso_por_pacote} kg</strong>. Os pacotes são retirados do estoque de pacotes e convertidos em kg para o granel.
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Quantos pacotes abrir? *</label>
            <input
              type="number" min="1" step="1"
              value={n} onChange={e => { setN(e.target.value); setErro('') }}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {n && parseInt(n) > 0 && produto.peso_por_pacote && (
              <p className="text-xs text-slate-400 mt-1">= {(parseInt(n) * produto.peso_por_pacote).toFixed(1)} kg a adicionar</p>
            )}
            {erro && <p className="text-xs text-red-500 mt-1">{erro}</p>}
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onFechar} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
          <button onClick={puxar} disabled={salvando} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors">
            {salvando ? <Loader2 size={14} className="animate-spin" /> : <PackageOpen size={14} />}
            {salvando ? 'Abrindo...' : 'Abrir pacotes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Card de produto ───────────────────────────────────────

function ProdutoCard({ produto, onEditar, onMovimentar, onHistorico, onDeletar, onPuxar, bloqueado, modoSelecao, selecionado, onToggle }) {
  const isGranel = produto.tipo === 'granel'
  const abaixoMin = produto.quantidade_min > 0 && produto.quantidade <= produto.quantidade_min
  const zerado = produto.quantidade === 0
  const margem = !isGranel && produto.preco_custo && produto.preco_venda
    ? (((produto.preco_venda - produto.preco_custo) / produto.preco_custo) * 100).toFixed(0)
    : null

  return (
    <div
      onClick={modoSelecao ? onToggle : undefined}
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${modoSelecao ? 'cursor-pointer' : 'hover:shadow-md'} ${selecionado ? 'border-emerald-400 ring-2 ring-emerald-300' : zerado ? 'border-red-200' : abaixoMin ? 'border-amber-200' : 'border-slate-100'}`}
    >
      <div className={`h-1 ${zerado ? 'bg-red-400' : abaixoMin ? 'bg-amber-400' : 'bg-emerald-400'}`} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 truncate text-sm">{produto.nome}</p>
            <div className="flex items-center gap-1 flex-wrap mt-0.5">
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{produto.categoria}</span>
              {isGranel && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-0.5"><Wheat size={9} /> Granel</span>}
            </div>
          </div>
          {modoSelecao ? (
            selecionado
              ? <CheckSquare size={18} className="text-emerald-500 flex-shrink-0" />
              : <Square size={18} className="text-slate-300 flex-shrink-0" />
          ) : (zerado || abaixoMin) && (
            <AlertTriangle size={16} className={`flex-shrink-0 ${zerado ? 'text-red-500' : 'text-amber-500'}`} />
          )}
        </div>

        {/* Quantidade */}
        <div className={`rounded-xl p-3 mb-3 text-center ${zerado ? 'bg-red-50' : abaixoMin ? 'bg-amber-50' : 'bg-emerald-50'}`}>
          <p className={`text-3xl font-bold ${zerado ? 'text-red-600' : abaixoMin ? 'text-amber-600' : 'text-emerald-700'}`}>
            {isGranel ? Number(produto.quantidade).toFixed(2) : produto.quantidade}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{isGranel ? 'kg disponíveis' : produto.unidade}</p>
          {produto.quantidade_min > 0 && (
            <p className="text-[10px] text-slate-400 mt-1">Mín: {produto.quantidade_min} {isGranel ? 'kg' : produto.unidade}</p>
          )}
        </div>

        {/* Preços + margem */}
        {isGranel ? (
          produto.preco_por_kg && (
            <div className="bg-amber-50 rounded-lg p-2 mb-3 text-center text-xs">
              <p className="text-amber-500">Preço por kg</p>
              <p className="font-bold text-amber-700">{fmtMoeda(produto.preco_por_kg)}/kg</p>
              {produto.peso_por_pacote && <p className="text-[10px] text-slate-400 mt-0.5">Pacote: {produto.peso_por_pacote}kg</p>}
            </div>
          )
        ) : (produto.preco_custo || produto.preco_venda) && (
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
        {!modoSelecao && (
          <div className="flex items-center gap-1.5">
            {bloqueado ? (
              <div className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-100 text-slate-400 rounded-xl text-xs">
                <Lock size={12} />
                Bloqueado
              </div>
            ) : isGranel ? (
              <button onClick={() => onPuxar(produto)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-amber-500 text-white rounded-xl text-xs font-medium hover:bg-amber-600 transition-colors">
                <PackageOpen size={13} /> Puxar pacotes
              </button>
            ) : (
              <button onClick={() => onMovimentar(produto)} className="flex-1 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 transition-colors">
                Movimentar
              </button>
            )}
            <button onClick={() => onHistorico(produto)} title="Histórico" className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <History size={14} />
            </button>
            {!bloqueado && (
              <>
                <button onClick={() => onEditar(produto)} title="Editar" className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => onDeletar(produto)} title="Excluir" className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        )}
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
  const [erro, setErro] = useState('')
  async function confirmar() {
    setDeletando(true)
    setErro('')
    try {
      await window.api.estoque.deletar(produto.id)
      onConfirmar()
    } catch (e) {
      setErro(e.message || 'Não foi possível excluir o produto.')
      setDeletando(false)
    }
  }
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} className="text-red-500" />
        </div>
        <h3 className="font-semibold text-slate-800 mb-1">Excluir produto?</h3>
        <p className="text-sm text-slate-400 mb-3"><strong>{produto.nome}</strong> será removido permanentemente.</p>
        {erro && <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2 mb-3">{erro}</p>}
        <div className="flex gap-3">
          <button onClick={onFechar} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition-colors">Cancelar</button>
          <button onClick={confirmar} disabled={deletando || !!erro} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors">
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

// ── Mapa de motivos ───────────────────────────────────────

const MOTIVOS_LABEL = {
  troca:           { label: 'Troca de mercadoria', cor: 'bg-blue-50 text-blue-700 border-blue-100' },
  avaria:          { label: 'Avaria',              cor: 'bg-red-50 text-red-600 border-red-100' },
  desistiu:        { label: 'Desistiu',            cor: 'bg-slate-100 text-slate-600 border-slate-200' },
  erro_lancamento: { label: 'Erro de lançamento',  cor: 'bg-amber-50 text-amber-700 border-amber-100' },
  devolvida:       { label: 'Devolução',           cor: 'bg-violet-50 text-violet-700 border-violet-100' },
  cancelada:       { label: 'Cancelamento',        cor: 'bg-red-50 text-red-600 border-red-100' },
}

function fmtMoedaLocal(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ── Card de venda cancelada ───────────────────────────────

function CardCancelamento({ venda }) {
  const [aberto, setAberto] = useState(false)
  const motivo = MOTIVOS_LABEL[venda.status] || { label: venda.status, cor: 'bg-slate-100 text-slate-600 border-slate-200' }
  const nomeCliente = venda.nome_dono || venda.nome_cliente || null

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-4 px-4 py-3.5">
        <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <XCircle size={16} className="text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">Venda #{venda.id}</p>
          <p className="text-xs text-slate-400 truncate">
            {nomeCliente ? `${nomeCliente} · ` : ''}
            {new Date(venda.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-lg border font-semibold flex-shrink-0 ${motivo.cor}`}>
          {motivo.label}
        </span>
        <span className="text-sm font-bold text-slate-700 tabular-nums flex-shrink-0">
          {fmtMoedaLocal(venda.total_final)}
        </span>
        <button
          onClick={() => setAberto(v => !v)}
          className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors flex-shrink-0"
        >
          {aberto ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {aberto && venda.itens && (
        <div className="border-t border-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Itens da venda</p>
          <div className="space-y-1">
            {venda.itens.map(item => (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <span className="text-slate-600">{item.nome_produto}</span>
                <span className="text-slate-400">{item.quantidade} × {fmtMoedaLocal(item.preco_unit)}</span>
                <span className="font-semibold text-slate-700">{fmtMoedaLocal(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs mt-2 pt-2 border-t border-slate-100">
            <span className="text-slate-400">Total da venda</span>
            <span className="font-bold text-slate-700">{fmtMoedaLocal(venda.total_final)}</span>
          </div>
          {venda.status === 'avaria' && (
            <p className="text-xs text-red-500 mt-2 bg-red-50 px-2.5 py-1.5 rounded-lg">
              ⚠ Avaria — itens <strong>não</strong> foram devolvidos ao estoque.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Painel de cancelamentos / devoluções ──────────────────

function PainelCancelamentos() {
  const [lista, setLista] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => {
    window.api.vendas.listarCanceladas().then(r => {
      setLista(r || [])
      setCarregando(false)
    })
  }, [])

  const filtrados = filtro === 'todos' ? lista : lista.filter(v => v.status === filtro)

  return (
    <div className="space-y-4">
      {/* Filtros por motivo */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: 'todos',           label: 'Todos' },
          { key: 'troca',           label: 'Troca' },
          { key: 'avaria',          label: 'Avaria' },
          { key: 'desistiu',        label: 'Desistiu' },
          { key: 'erro_lancamento', label: 'Erro de lançamento' },
          { key: 'devolvida',       label: 'Devolução' },
          { key: 'cancelada',       label: 'Cancelamento' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFiltro(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filtro === key
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center py-20 text-center">
          <XCircle size={32} className="text-slate-200 mb-3" />
          <p className="text-sm font-medium text-slate-500">Nenhum registro encontrado</p>
          <p className="text-xs text-slate-400 mt-1">
            {filtro === 'todos' ? 'Ainda não há cancelamentos ou devoluções.' : 'Nenhum registro para este motivo.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">{filtrados.length} registro{filtrados.length !== 1 ? 's' : ''}</p>
          {filtrados.map(v => (
            <CardCancelamento key={v.id} venda={v} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Modal confirmar exclusão em lote ─────────────────────

function ModalDeleteMultiplo({ quantidade, onConfirmar, onFechar }) {
  const [deletando, setDeletando] = useState(false)
  async function confirmar() {
    setDeletando(true)
    await onConfirmar()
  }
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} className="text-red-500" />
        </div>
        <h3 className="font-semibold text-slate-800 mb-1">Excluir {quantidade} produto{quantidade !== 1 ? 's' : ''}?</h3>
        <p className="text-sm text-slate-400 mb-5">Essa ação é permanente e não pode ser desfeita.</p>
        <div className="flex gap-3">
          <button onClick={onFechar} disabled={deletando} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition-colors disabled:opacity-50">Cancelar</button>
          <button onClick={confirmar} disabled={deletando} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors">
            {deletando ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {deletando ? 'Excluindo...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal de senha ────────────────────────────────────────

function ModalSenha({ onDesbloquear, onFechar }) {
  const [senha, setSenha]             = useState('')
  const [mostrar, setMostrar]         = useState(false)
  const [verificando, setVerificando] = useState(false)
  const [erro, setErro]               = useState('')

  async function verificar(e) {
    e.preventDefault()
    if (!senha) return
    setVerificando(true)
    setErro('')
    try {
      const res = await window.api.auth.verificarSenha(senha)
      if (res.ok) {
        onDesbloquear()
      } else {
        setErro(res.erro || 'Senha incorreta. Tente novamente.')
        setSenha('')
      }
    } finally {
      setVerificando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
          <Lock size={22} className="text-slate-600" />
        </div>
        <h3 className="text-base font-bold text-slate-800 text-center mb-1">Acesso restrito</h3>
        <p className="text-sm text-slate-400 text-center mb-5">
          Digite a senha para editar o estoque.
        </p>
        <form onSubmit={verificar} className="space-y-3">
          <div className="relative">
            <input
              type={mostrar ? 'text' : 'password'}
              placeholder="Senha"
              value={senha}
              onChange={e => { setSenha(e.target.value); setErro('') }}
              autoFocus
              className={`w-full px-4 py-2.5 pr-10 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${erro ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
            />
            <button
              type="button"
              onClick={() => setMostrar(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {mostrar ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {erro && <p className="text-xs text-red-500 px-1">{erro}</p>}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onFechar}
              className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={verificando || !senha}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-60"
            >
              {verificando ? <Unlock size={14} className="animate-pulse" /> : <Unlock size={14} />}
              {verificando ? 'Verificando...' : 'Desbloquear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────

export default function Estoque() {
  const [desbloqueado, setDesbloqueado] = useState(false)
  const [modalSenha, setModalSenha]     = useState(false)
  const [aba, setAba]                   = useState('produtos') // 'produtos' | 'cancelamentos'
  const [produtos, setProdutos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas')
  const [modal, setModal] = useState(null)          // null | 'novo' | produto (editar)
  const [modalMov, setModalMov] = useState(null)    // produto para movimentar
  const [modalDelete, setModalDelete] = useState(null)
  const [painelHistorico, setPainelHistorico] = useState(null)
  const [modoSelecao, setModoSelecao] = useState(false)
  const [selecionados, setSelecionados] = useState(new Set())
  const [modalDeleteMulti, setModalDeleteMulti] = useState(false)
  const [modalPuxar, setModalPuxar] = useState(null)  // produto granel para puxar pacotes

  function toggleSelecao(id) {
    setSelecionados(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selecionarTodos() {
    setSelecionados(new Set(filtrados.map(p => p.id)))
  }

  function limparSelecao() {
    setSelecionados(new Set())
    setModoSelecao(false)
  }

  async function excluirSelecionados() {
    let bloqueados = 0
    for (const id of selecionados) {
      try { await window.api.estoque.deletar(id) }
      catch { bloqueados++ }
    }
    setModalDeleteMulti(false)
    limparSelecao()
    carregar()
    if (bloqueados > 0) {
      alert(`${bloqueados} produto(s) não puderam ser excluídos pois estão vinculados a vendas.`)
    }
  }

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
    setModal(null); setModalMov(null); setModalDelete(null); setModalPuxar(null)
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
        <div className="flex items-center gap-2">
          {desbloqueado ? (
            <>
              <button
                onClick={() => { setDesbloqueado(false); setAba('produtos'); limparSelecao() }}
                className="flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-500 rounded-xl text-sm hover:bg-slate-50 transition-colors"
                title="Bloquear estoque"
              >
                <Unlock size={15} />
              </button>
              {aba === 'produtos' && !modoSelecao && (
                <>
                  <button
                    onClick={() => setModoSelecao(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    <CheckCheck size={15} />
                    Selecionar
                  </button>
                  <button
                    onClick={() => setModal('novo')}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-emerald-700 transition-colors"
                  >
                    <Plus size={16} />
                    Novo produto
                  </button>
                </>
              )}
              {aba === 'produtos' && modoSelecao && (
                <button
                  onClick={limparSelecao}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  <X size={15} />
                  Cancelar seleção
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => setModalSenha(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              <Lock size={15} />
              Desbloquear edição
            </button>
          )}
        </div>
      </div>

      {/* Abas — Cancelamentos só aparece desbloqueado */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setAba('produtos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${aba === 'produtos' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Package size={14} />
          Produtos
        </button>
        {desbloqueado && (
          <button
            onClick={() => setAba('cancelamentos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${aba === 'cancelamentos' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <XCircle size={14} />
            Cancelamentos
          </button>
        )}
      </div>

      {/* ── ABA CANCELAMENTOS ── */}
      {aba === 'cancelamentos' && <PainelCancelamentos />}

      {/* ── ABA PRODUTOS ── */}
      {aba === 'produtos' && <>

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
            {!busca && categoriaFiltro === 'Todas' && desbloqueado && (
              <button onClick={() => setModal('novo')} className="mt-4 flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
                <Plus size={15} />Novo produto
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {modoSelecao ? (
            <div className="flex items-center gap-3">
              <p className="text-xs text-slate-400">{selecionados.size} de {filtrados.length} selecionado{selecionados.size !== 1 ? 's' : ''}</p>
              <button
                onClick={selecionarTodos}
                className="text-xs text-emerald-600 hover:underline"
              >
                Selecionar todos
              </button>
              {selecionados.size > 0 && (
                <button
                  onClick={() => setSelecionados(new Set())}
                  className="text-xs text-slate-400 hover:underline"
                >
                  Desmarcar todos
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400">{filtrados.length} produto{filtrados.length !== 1 ? 's' : ''}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtrados.map(p => (
              <ProdutoCard
                key={p.id}
                produto={p}
                onEditar={setModal}
                onMovimentar={setModalMov}
                onHistorico={setPainelHistorico}
                onDeletar={setModalDelete}
                onPuxar={setModalPuxar}
                bloqueado={!desbloqueado}
                modoSelecao={modoSelecao}
                selecionado={selecionados.has(p.id)}
                onToggle={() => toggleSelecao(p.id)}
              />
            ))}
          </div>
          {/* Barra flutuante de exclusão em lote */}
          {modoSelecao && selecionados.size > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl">
              <span className="text-sm font-medium">{selecionados.size} produto{selecionados.size !== 1 ? 's' : ''} selecionado{selecionados.size !== 1 ? 's' : ''}</span>
              <button
                onClick={() => setModalDeleteMulti(true)}
                className="flex items-center gap-2 px-4 py-1.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
              >
                <Trash2 size={14} />
                Excluir
              </button>
            </div>
          )}
        </>
      )}

      </>}

      {/* Modais */}
      {modalSenha && (
        <ModalSenha
          onDesbloquear={() => { setDesbloqueado(true); setModalSenha(false) }}
          onFechar={() => setModalSenha(false)}
        />
      )}
      {modal && (
        <ModalProduto produto={modal === 'novo' ? null : modal} onSalvar={aposAcao} onFechar={() => setModal(null)} />
      )}
      {modalMov && (
        <ModalMovimentacao produto={modalMov} onSalvar={aposAcao} onFechar={() => setModalMov(null)} />
      )}
      {modalDelete && (
        <ModalDelete produto={modalDelete} onConfirmar={aposAcao} onFechar={() => setModalDelete(null)} />
      )}
      {modalDeleteMulti && (
        <ModalDeleteMultiplo
          quantidade={selecionados.size}
          onConfirmar={excluirSelecionados}
          onFechar={() => setModalDeleteMulti(false)}
        />
      )}
      {modalPuxar && (
        <ModalPuxarPacotes produto={modalPuxar} onSalvar={aposAcao} onFechar={() => setModalPuxar(null)} />
      )}
    </div>
  )
}
