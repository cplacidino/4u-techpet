import { useState, useEffect } from 'react'
import { X, TrendingUp, TrendingDown, Save, Loader2 } from 'lucide-react'

export default function ModalLancamento({ lancamento, onSalvar, onFechar }) {
  const editando = !!lancamento
  const hoje = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    tipo:      'receita',
    descricao: '',
    valor:     '',
    data:      hoje,
  })
  const [erros, setErros] = useState({})
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!editando) return
    setForm({
      tipo:      lancamento.tipo      || 'receita',
      descricao: lancamento.descricao || '',
      valor:     lancamento.valor     || '',
      data:      lancamento.data      || hoje,
    })
  }, [editando]) // eslint-disable-line

  function set(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
    if (erros[campo]) setErros(e => ({ ...e, [campo]: null }))
  }

  function validar() {
    const e = {}
    if (!form.descricao.trim())              e.descricao = 'Informe uma descrição'
    if (!form.valor || Number(form.valor) <= 0) e.valor  = 'Informe um valor válido'
    if (!form.data)                          e.data      = 'Informe a data'
    return e
  }

  async function salvar() {
    const e = validar()
    if (Object.keys(e).length) { setErros(e); return }

    setSalvando(true)
    try {
      const dados = {
        descricao: form.descricao.trim(),
        valor:     Number(form.valor),
        tipo:      form.tipo,
        data:      form.data,
      }
      if (editando) {
        await window.api.financeiro.editar(lancamento.id, dados)
      } else {
        await window.api.financeiro.criar({ id_agendamento: null, ...dados })
      }
      onSalvar()
    } finally {
      setSalvando(false)
    }
  }

  const inputClass = (campo) =>
    `w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors ${
      erros[campo]
        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400'
        : 'border-slate-200 focus:ring-emerald-500/30 focus:border-emerald-400'
    }`

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-800">
              {editando ? 'Editar lançamento' : 'Novo lançamento'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Registro manual de receita ou despesa</p>
          </div>
          <button onClick={onFechar} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">

          {/* Tipo */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Tipo *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => set('tipo', 'receita')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                  form.tipo === 'receita'
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <TrendingUp size={15} />
                Receita
              </button>
              <button
                onClick={() => set('tipo', 'despesa')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                  form.tipo === 'despesa'
                    ? 'border-red-400 bg-red-50 text-red-600'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <TrendingDown size={15} />
                Despesa
              </button>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Descrição *</label>
            <input
              type="text"
              placeholder="Ex: Consulta, Ração, Aluguel..."
              value={form.descricao}
              onChange={e => set('descricao', e.target.value)}
              className={inputClass('descricao')}
            />
            {erros.descricao && <p className="text-xs text-red-500 mt-1">{erros.descricao}</p>}
          </div>

          {/* Valor + Data */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Valor (R$) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={form.valor}
                  onChange={e => set('valor', e.target.value)}
                  className={`${inputClass('valor')} pl-9`}
                />
              </div>
              {erros.valor && <p className="text-xs text-red-500 mt-1">{erros.valor}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Data *</label>
              <input
                type="date"
                value={form.data}
                onChange={e => set('data', e.target.value)}
                className={inputClass('data')}
              />
              {erros.data && <p className="text-xs text-red-500 mt-1">{erros.data}</p>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={onFechar}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={salvando}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {salvando
              ? <><Loader2 size={14} className="animate-spin" /> Salvando...</>
              : <><Save size={14} /> {editando ? 'Salvar' : 'Registrar'}</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
