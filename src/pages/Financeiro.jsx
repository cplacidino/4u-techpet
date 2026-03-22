import { useState, useEffect, useCallback } from 'react'
import {
  Wallet, Plus, TrendingUp, TrendingDown, DollarSign,
  Users, Download, Pencil, Trash2, BarChart2, Printer, X,
  ChevronDown, ChevronUp, ShoppingCart, Stethoscope, SlidersHorizontal
} from 'lucide-react'
import ModalLancamento from '../components/financeiro/ModalLancamento'

// ── Utilitários ───────────────────────────────────────────

function fmtMoeda(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtData(data) {
  if (!data) return '—'
  const [y, m, d] = data.split('-')
  return `${d}/${m}/${y}`
}

function ultimos6Meses() {
  const result = []
  const hoje = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
    result.push({ key, label })
  }
  return result
}

function getPeriodoDatas(periodo, customInicio, customFim) {
  const hoje = new Date()
  const f = d => d.toISOString().split('T')[0]
  if (periodo === 'hoje') {
    const d = f(hoje)
    return { inicio: d, fim: d }
  }
  if (periodo === 'semana') {
    const dow = hoje.getDay()
    const seg = new Date(hoje)
    seg.setDate(hoje.getDate() - (dow === 0 ? 6 : dow - 1))
    const dom = new Date(seg)
    dom.setDate(seg.getDate() + 6)
    return { inicio: f(seg), fim: f(dom) }
  }
  if (periodo === 'mes') {
    const inicio = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
    return { inicio, fim: f(hoje) }
  }
  return { inicio: customInicio, fim: customFim }
}

function exportarCSV(lancamentos) {
  const cabecalho = ['Data', 'Descrição', 'Pet', 'Tipo', 'Valor (R$)'].join(';')
  const linhas = lancamentos.map(l => [
    l.data,
    `"${(l.descricao || '').replace(/"/g, '""')}"`,
    l.nome_pet || '',
    l.tipo,
    String(l.valor).replace('.', ','),
  ].join(';'))
  const csv = '\uFEFF' + [cabecalho, ...linhas].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `financeiro_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── Gráfico de barras CSS ─────────────────────────────────

function GraficoBarras({ historico }) {
  const meses6 = ultimos6Meses()
  const dados = meses6.map(({ key, label }) => ({
    label,
    receita: historico.find(h => h.mes === key && h.tipo === 'receita')?.total || 0,
    despesa: historico.find(h => h.mes === key && h.tipo === 'despesa')?.total || 0,
  }))
  const maxValor = Math.max(...dados.flatMap(d => [d.receita, d.despesa]), 1)
  const CHART_H = 120

  function barH(valor) {
    return Math.max(2, Math.round((valor / maxValor) * CHART_H))
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <BarChart2 size={16} className="text-emerald-500" />
            Faturamento — últimos 6 meses
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Passe o mouse sobre as barras para ver os valores</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" />Receitas
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-300 inline-block" />Despesas
          </span>
        </div>
      </div>

      {/* Barras */}
      <div
        className="flex items-end gap-3 border-b border-slate-100 pb-0"
        style={{ height: `${CHART_H}px` }}
      >
        {dados.map(({ label, receita, despesa }) => (
          <div key={label} className="flex-1 h-full flex items-end gap-0.5">
            {/* Receita */}
            <div
              className="group relative flex-1"
              style={{ height: `${barH(receita)}px` }}
            >
              <div className="w-full h-full bg-emerald-400 hover:bg-emerald-500 rounded-t-md transition-colors cursor-default" />
              <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-slate-800 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap z-20 pointer-events-none">
                Receita: {fmtMoeda(receita)}
              </div>
            </div>
            {/* Despesa */}
            <div
              className="group relative flex-1"
              style={{ height: `${barH(despesa)}px` }}
            >
              <div className="w-full h-full bg-red-300 hover:bg-red-400 rounded-t-md transition-colors cursor-default" />
              <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-slate-800 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap z-20 pointer-events-none">
                Despesa: {fmtMoeda(despesa)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Labels eixo X */}
      <div className="flex gap-3 mt-2">
        {dados.map(({ label }) => (
          <span key={label} className="flex-1 text-center text-[10px] text-slate-400 capitalize">{label}</span>
        ))}
      </div>
    </div>
  )
}

// ── Detecta origem do lançamento ─────────────────────────

function getOrigem(l) {
  if (l.id_agendamento) return { label: 'Serviço', icon: Stethoscope, cor: 'bg-violet-50 text-violet-700 border-violet-100' }
  if (l.descricao?.startsWith('Venda #')) return { label: 'Venda', icon: ShoppingCart, cor: 'bg-blue-50 text-blue-700 border-blue-100' }
  return { label: 'Manual', icon: SlidersHorizontal, cor: 'bg-slate-100 text-slate-600 border-slate-200' }
}

// ── Item de lançamento ────────────────────────────────────

function LancamentoItem({ lancamento, onEditar, onDeletar }) {
  const [aberto, setAberto] = useState(false)
  const isReceita = lancamento.tipo === 'receita'
  const origem    = getOrigem(lancamento)
  const OrigemIcon = origem.icon

  return (
    <div className={`rounded-xl transition-colors ${aberto ? 'bg-slate-50' : 'hover:bg-slate-50/60'}`}>
      {/* Linha principal */}
      <div className="flex items-center gap-3 py-3 px-4 group">
        {/* Ícone tipo */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isReceita ? 'bg-emerald-50' : 'bg-red-50'
        }`}>
          {isReceita
            ? <TrendingUp size={16} className="text-emerald-600" />
            : <TrendingDown size={16} className="text-red-500" />}
        </div>

        {/* Descrição */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{lancamento.descricao}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-xs text-slate-400">{fmtData(lancamento.data)}</span>
            {lancamento.nome_pet && (
              <span className="text-xs text-slate-500">· {lancamento.nome_pet}</span>
            )}
            {lancamento.servico_agendamento && (
              <span className="px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded text-[10px] font-medium">
                {lancamento.servico_agendamento}
              </span>
            )}
          </div>
        </div>

        {/* Badge origem */}
        <span className={`hidden sm:flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${origem.cor}`}>
          <OrigemIcon size={9} />
          {origem.label}
        </span>

        {/* Badge tipo */}
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
          isReceita ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
        }`}>
          {isReceita ? 'receita' : 'despesa'}
        </span>

        {/* Valor */}
        <p className={`text-sm font-bold flex-shrink-0 w-28 text-right ${
          isReceita ? 'text-emerald-600' : 'text-red-500'
        }`}>
          {isReceita ? '+' : '-'}{fmtMoeda(lancamento.valor)}
        </p>

        {/* Ações */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEditar(lancamento)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDeletar(lancamento)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
          <button
            onClick={() => setAberto(v => !v)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
          >
            {aberto ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Painel de detalhes expandido */}
      {aberto && (
        <div className="px-4 pb-4">
          <div className="bg-white rounded-xl border border-slate-100 p-3.5 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Tipo</p>
              <p className={`text-xs font-medium ${isReceita ? 'text-emerald-700' : 'text-red-600'}`}>
                {isReceita ? '↑ Receita' : '↓ Despesa'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Origem</p>
              <p className="text-xs font-medium text-slate-700 flex items-center gap-1">
                <OrigemIcon size={11} className="text-slate-400" />
                {origem.label}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Data</p>
              <p className="text-xs text-slate-700">{fmtData(lancamento.data)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Valor</p>
              <p className={`text-sm font-bold ${isReceita ? 'text-emerald-700' : 'text-red-600'}`}>
                {fmtMoeda(lancamento.valor)}
              </p>
            </div>
            {lancamento.nome_pet && (
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Pet</p>
                <p className="text-xs text-slate-700">{lancamento.nome_pet}</p>
              </div>
            )}
            {lancamento.servico_agendamento && (
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Serviço</p>
                <p className="text-xs text-slate-700">{lancamento.servico_agendamento}</p>
              </div>
            )}
            {lancamento.id_agendamento && (
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Agendamento</p>
                <p className="text-xs text-slate-500">#{lancamento.id_agendamento}</p>
              </div>
            )}
            <div className="col-span-2 sm:col-span-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Descrição completa</p>
              <p className="text-xs text-slate-700 break-words">{lancamento.descricao}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Modal confirmar exclusão ──────────────────────────────

function ModalDelete({ lancamento, onConfirmar, onFechar }) {
  const [deletando, setDeletando] = useState(false)
  async function confirmar() {
    setDeletando(true)
    await window.api.financeiro.deletar(lancamento.id)
    onConfirmar()
  }
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} className="text-red-500" />
        </div>
        <h3 className="font-semibold text-slate-800 mb-1">Excluir lançamento?</h3>
        <p className="text-sm text-slate-400 mb-5">
          <strong>"{lancamento.descricao}"</strong> será removido permanentemente.
        </p>
        <div className="flex gap-3">
          <button onClick={onFechar} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={deletando}
            className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {deletando ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────

function SkeletonLista() {
  return (
    <div className="space-y-1 animate-pulse p-2">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center gap-4 py-3 px-4">
          <div className="w-9 h-9 bg-slate-100 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 bg-slate-100 rounded w-48" />
            <div className="h-3 bg-slate-50 rounded w-24" />
          </div>
          <div className="h-4 bg-slate-100 rounded w-20" />
        </div>
      ))}
    </div>
  )
}

// ── Relatório Mensal Imprimível ───────────────────────────

function ModalRelatorio({ onFechar }) {
  const hoje = new Date()
  const anoAtual = hoje.getFullYear()
  const mesAtual = hoje.getMonth() + 1

  const [ano, setAno] = useState(anoAtual)
  const [mes, setMes] = useState(mesAtual)
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(false)

  const MESES = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
  ]

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      try {
        const mesStr = String(mes).padStart(2, '0')
        const dataInicio = `${ano}-${mesStr}-01`
        // Último dia do mês
        const ultimoDia = new Date(ano, mes, 0).getDate()
        const dataFim = `${ano}-${mesStr}-${ultimoDia}`
        const [lista, resumo] = await Promise.all([
          window.api.financeiro.buscarPorPeriodo(dataInicio, dataFim),
          window.api.financeiro.resumoMensal(ano, mes),
        ])
        const receitas = lista.filter(l => l.tipo === 'receita')
        const despesas = lista.filter(l => l.tipo === 'despesa')
        const totalR = receitas.reduce((s, l) => s + l.valor, 0)
        const totalD = despesas.reduce((s, l) => s + l.valor, 0)
        setDados({ lista, receitas, despesas, totalR, totalD, resumo })
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [ano, mes])

  function imprimir() {
    window.print()
  }

  const tituloMes = `${MESES[mes - 1]} de ${ano}`

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
      {/* Painel de controle (não aparece na impressão) */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col print:hidden">

        {/* Header do modal */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Printer size={18} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">Relatório Mensal</h2>
              <p className="text-xs text-slate-400">Selecione o período e clique em imprimir</p>
            </div>
          </div>
          <button onClick={onFechar} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Seletor de mês/ano */}
        <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100">
          <select
            value={mes}
            onChange={e => setMes(Number(e.target.value))}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            {MESES.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={ano}
            onChange={e => setAno(Number(e.target.value))}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            {[anoAtual - 2, anoAtual - 1, anoAtual].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <div className="flex-1" />
          <button
            onClick={imprimir}
            disabled={carregando || !dados}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-40 transition-colors"
          >
            <Printer size={15} />
            Imprimir / Salvar PDF
          </button>
        </div>

        {/* Preview do relatório */}
        <div className="overflow-y-auto flex-1 p-6">
          {carregando ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm animate-pulse">
              Carregando dados...
            </div>
          ) : dados ? (
            <RelatorioConteudo dados={dados} tituloMes={tituloMes} />
          ) : null}
        </div>
      </div>

      {/* Conteúdo real que vai para a impressão */}
      {dados && (
        <div id="relatorio-print">
          <RelatorioConteudo dados={dados} tituloMes={tituloMes} />
        </div>
      )}
    </div>
  )
}

function RelatorioConteudo({ dados, tituloMes }) {
  const { receitas, despesas, totalR, totalD } = dados
  const saldo = totalR - totalD
  const ticketMedio = receitas.length > 0 ? totalR / receitas.length : 0

  return (
    <div className="space-y-5 text-slate-800 print:text-black">

      {/* Cabeçalho */}
      <div className="flex items-start justify-between pb-4 border-b-2 border-emerald-500 print-no-break">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🐾</span>
            <span className="text-xl font-bold text-slate-800">4u TechPet</span>
          </div>
          <p className="text-xs text-slate-400">by 4u Technology</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-slate-800">Relatório Financeiro</p>
          <p className="text-sm text-slate-500">{tituloMes}</p>
          <p className="text-xs text-slate-400 mt-1">
            Gerado em {new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' })}
          </p>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="print-no-break">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Resumo do período</p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Receitas',     value: fmtMoeda(totalR),     color: 'bg-emerald-50 border-emerald-200', textColor: 'text-emerald-700' },
            { label: 'Despesas',     value: fmtMoeda(totalD),     color: 'bg-red-50 border-red-200',         textColor: 'text-red-600'     },
            { label: 'Saldo líquido',value: fmtMoeda(saldo),      color: saldo >= 0 ? 'bg-slate-50 border-slate-200' : 'bg-red-50 border-red-200', textColor: saldo >= 0 ? 'text-slate-800' : 'text-red-600' },
            { label: 'Ticket médio', value: fmtMoeda(ticketMedio),color: 'bg-blue-50 border-blue-200',       textColor: 'text-blue-700'    },
          ].map(({ label, value, color, textColor }) => (
            <div key={label} className={`rounded-xl border p-3 ${color}`}>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mb-1">{label}</p>
              <p className={`text-base font-bold ${textColor}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela de receitas */}
      {receitas.length > 0 && (
        <div className="print-no-break">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Receitas ({receitas.length})
          </p>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-emerald-50">
                <th className="text-left py-2 px-3 text-slate-600 font-semibold border border-emerald-100 rounded-tl">Data</th>
                <th className="text-left py-2 px-3 text-slate-600 font-semibold border border-emerald-100">Descrição</th>
                <th className="text-left py-2 px-3 text-slate-600 font-semibold border border-emerald-100">Pet</th>
                <th className="text-right py-2 px-3 text-slate-600 font-semibold border border-emerald-100 rounded-tr">Valor</th>
              </tr>
            </thead>
            <tbody>
              {receitas.map((l, i) => (
                <tr key={l.id} className={i % 2 === 0 ? '' : 'bg-slate-50'}>
                  <td className="py-1.5 px-3 border border-slate-100 text-slate-500">{fmtData(l.data)}</td>
                  <td className="py-1.5 px-3 border border-slate-100 text-slate-700">{l.descricao}</td>
                  <td className="py-1.5 px-3 border border-slate-100 text-slate-400">{l.nome_pet || '—'}</td>
                  <td className="py-1.5 px-3 border border-slate-100 text-emerald-700 font-semibold text-right">{fmtMoeda(l.valor)}</td>
                </tr>
              ))}
              <tr className="bg-emerald-50 font-bold">
                <td colSpan={3} className="py-2 px-3 border border-emerald-100 text-emerald-700 text-right">Total receitas</td>
                <td className="py-2 px-3 border border-emerald-100 text-emerald-700 text-right">{fmtMoeda(totalR)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Tabela de despesas */}
      {despesas.length > 0 && (
        <div className="print-no-break">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
            Despesas ({despesas.length})
          </p>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-red-50">
                <th className="text-left py-2 px-3 text-slate-600 font-semibold border border-red-100">Data</th>
                <th className="text-left py-2 px-3 text-slate-600 font-semibold border border-red-100">Descrição</th>
                <th className="text-left py-2 px-3 text-slate-600 font-semibold border border-red-100">Pet</th>
                <th className="text-right py-2 px-3 text-slate-600 font-semibold border border-red-100">Valor</th>
              </tr>
            </thead>
            <tbody>
              {despesas.map((l, i) => (
                <tr key={l.id} className={i % 2 === 0 ? '' : 'bg-slate-50'}>
                  <td className="py-1.5 px-3 border border-slate-100 text-slate-500">{fmtData(l.data)}</td>
                  <td className="py-1.5 px-3 border border-slate-100 text-slate-700">{l.descricao}</td>
                  <td className="py-1.5 px-3 border border-slate-100 text-slate-400">{l.nome_pet || '—'}</td>
                  <td className="py-1.5 px-3 border border-slate-100 text-red-600 font-semibold text-right">{fmtMoeda(l.valor)}</td>
                </tr>
              ))}
              <tr className="bg-red-50 font-bold">
                <td colSpan={3} className="py-2 px-3 border border-red-100 text-red-600 text-right">Total despesas</td>
                <td className="py-2 px-3 border border-red-100 text-red-600 text-right">{fmtMoeda(totalD)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Linha de saldo final */}
      <div className={`print-no-break rounded-xl p-4 flex items-center justify-between ${
        saldo >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'
      }`}>
        <p className="text-sm font-semibold text-slate-700">Resultado líquido do período</p>
        <p className={`text-xl font-bold ${saldo >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
          {saldo >= 0 ? '+' : ''}{fmtMoeda(saldo)}
        </p>
      </div>

      {/* Rodapé */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 print-no-break">
        <span>4u TechPet — 4u Technology</span>
        <span>Documento gerado automaticamente pelo sistema</span>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────

const PERIODOS = [
  { key: 'hoje',        label: 'Hoje' },
  { key: 'semana',      label: 'Semana' },
  { key: 'mes',         label: 'Mês atual' },
  { key: 'personalizado', label: 'Personalizado' },
]

export default function Financeiro() {
  const hoje = new Date().toISOString().split('T')[0]
  const [periodo, setPeriodo] = useState('mes')
  const [customInicio, setCustomInicio] = useState(hoje)
  const [customFim, setCustomFim] = useState(hoje)

  const [resumoMes, setResumoMes] = useState({ receitas: 0, despesas: 0, saldo: 0, atendimentos: 0, ticketMedio: 0 })
  const [historico, setHistorico] = useState([])
  const [lancamentos, setLancamentos] = useState([])
  const [carregandoResumo, setCarregandoResumo] = useState(true)
  const [carregandoLista, setCarregandoLista] = useState(true)

  const [filtroTipo, setFiltroTipo] = useState('todos') // 'todos' | 'receita' | 'despesa'

  const [modal, setModal] = useState(null)       // null | 'novo' | lancamento (para editar)
  const [modalDelete, setModalDelete] = useState(null)
  const [modalRelatorio, setModalRelatorio] = useState(false)

  // Carrega resumo do mês atual e gráfico (não muda com o filtro de período)
  const carregarResumo = useCallback(async () => {
    setCarregandoResumo(true)
    try {
      const [totais, hist] = await Promise.all([
        window.api.financeiro.totalMesAtual(),
        window.api.financeiro.historicoMensal(),
      ])
      const r = totais.find(t => t.tipo === 'receita')?.total || 0
      const d = totais.find(t => t.tipo === 'despesa')?.total || 0
      // Para ticket médio, busca receitas do mês atual
      const now = new Date()
      const anoMes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const lMes = await window.api.financeiro.buscarPorPeriodo(`${anoMes}-01`, hoje)
      const recMes = lMes.filter(l => l.tipo === 'receita')
      setResumoMes({
        receitas: r,
        despesas: d,
        saldo: r - d,
        atendimentos: recMes.length,
        ticketMedio: recMes.length > 0 ? r / recMes.length : 0,
      })
      setHistorico(hist)
    } finally {
      setCarregandoResumo(false)
    }
  }, []) // eslint-disable-line

  // Carrega lista filtrada pelo período selecionado
  const carregarLista = useCallback(async () => {
    const { inicio, fim } = getPeriodoDatas(periodo, customInicio, customFim)
    if (!inicio || !fim || inicio > fim) return
    setCarregandoLista(true)
    try {
      const lista = await window.api.financeiro.buscarPorPeriodo(inicio, fim)
      setLancamentos(lista)
    } finally {
      setCarregandoLista(false)
    }
  }, [periodo, customInicio, customFim])

  useEffect(() => { carregarResumo() }, [carregarResumo])
  useEffect(() => { carregarLista() }, [carregarLista])

  function aposAcao() {
    carregarResumo()
    carregarLista()
  }

  // Lista filtrada pelo tipo selecionado
  const lancamentosVisiveis = filtroTipo === 'todos'
    ? lancamentos
    : lancamentos.filter(l => l.tipo === filtroTipo)

  // Totais da lista atual (período filtrado, todos os tipos)
  const totalListaReceitas = lancamentos.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0)
  const totalListaDespesas = lancamentos.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0)

  // Sub-breakdown de receitas por origem
  const receitasServicos = lancamentos.filter(l => l.tipo === 'receita' && l.id_agendamento).reduce((s, l) => s + l.valor, 0)
  const receitasVendas   = lancamentos.filter(l => l.tipo === 'receita' && !l.id_agendamento && l.descricao?.startsWith('Venda #')).reduce((s, l) => s + l.valor, 0)
  const receitasManual   = lancamentos.filter(l => l.tipo === 'receita' && !l.id_agendamento && !l.descricao?.startsWith('Venda #')).reduce((s, l) => s + l.valor, 0)

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Financeiro</h2>
          <p className="text-sm text-slate-400 mt-0.5 capitalize">
            {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalRelatorio(true)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <Printer size={15} />
            Relatório
          </button>
          <button
            onClick={() => setModal('novo')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <Plus size={16} />
            Novo lançamento
          </button>
        </div>
      </div>

      {/* ── Cards resumo (mês atual) ── */}
      <div>
        <p className="text-xs font-medium text-slate-400 mb-2.5 uppercase tracking-wide">Resumo do mês atual</p>
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Receitas',       value: fmtMoeda(resumoMes.receitas),    icon: TrendingUp,   textColor: 'text-emerald-600', iconBg: 'bg-emerald-50',  iconColor: 'text-emerald-600' },
            { label: 'Despesas',       value: fmtMoeda(resumoMes.despesas),    icon: TrendingDown, textColor: 'text-red-500',     iconBg: 'bg-red-50',      iconColor: 'text-red-500'     },
            { label: 'Saldo',          value: fmtMoeda(resumoMes.saldo),       icon: DollarSign,   textColor: resumoMes.saldo >= 0 ? 'text-slate-800' : 'text-red-500', iconBg: 'bg-slate-50', iconColor: 'text-slate-500' },
            { label: 'Atendimentos',   value: resumoMes.atendimentos,          icon: Users,        textColor: 'text-slate-800',   iconBg: 'bg-violet-50',   iconColor: 'text-violet-500'  },
            { label: 'Ticket médio',   value: fmtMoeda(resumoMes.ticketMedio), icon: Wallet,       textColor: 'text-slate-800',   iconBg: 'bg-blue-50',     iconColor: 'text-blue-500'    },
          ].map(({ label, value, icon: Icon, textColor, iconBg, iconColor }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <div className={`w-7 h-7 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon size={14} className={iconColor} />
                </div>
                <span className="text-xs text-slate-400 leading-tight">{label}</span>
              </div>
              <p className={`text-lg font-bold ${textColor} leading-none`}>
                {carregandoResumo ? <span className="inline-block w-16 h-5 bg-slate-100 rounded animate-pulse" /> : value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Gráfico ── */}
      <GraficoBarras historico={historico} />

      {/* ── Lançamentos ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">

        {/* Linha 1: Filtro por tipo */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100 flex-wrap gap-3">
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {[
              { key: 'todos',   label: 'Todos' },
              { key: 'receita', label: '↑ Receitas' },
              { key: 'despesa', label: '↓ Despesas' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFiltroTipo(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filtroTipo === f.key
                    ? f.key === 'receita'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : f.key === 'despesa'
                        ? 'bg-red-500 text-white shadow-sm'
                        : 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Exportar CSV */}
          <button
            onClick={() => exportarCSV(lancamentosVisiveis)}
            disabled={lancamentosVisiveis.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Download size={13} />
            Exportar CSV
          </button>
        </div>

        {/* Linha 2: Filtro de período */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {PERIODOS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriodo(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  periodo === p.key
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {periodo === 'personalizado' && (
            <div className="flex items-center gap-2">
              <input type="date" value={customInicio} onChange={e => setCustomInicio(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400" />
              <span className="text-xs text-slate-400">até</span>
              <input type="date" value={customFim} onChange={e => setCustomFim(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400" />
            </div>
          )}
        </div>

        {/* Breakdown de receitas (só quando filtrando por receita) */}
        {!carregandoLista && filtroTipo === 'receita' && lancamentos.length > 0 && (
          <div className="flex items-center gap-4 px-4 py-2.5 bg-emerald-50 border-b border-emerald-100 flex-wrap">
            <span className="text-xs font-semibold text-emerald-700">Origem das receitas:</span>
            <span className="flex items-center gap-1 text-xs text-violet-700">
              <Stethoscope size={11} /> Serviços: <strong>{fmtMoeda(receitasServicos)}</strong>
            </span>
            <span className="flex items-center gap-1 text-xs text-blue-700">
              <ShoppingCart size={11} /> Vendas: <strong>{fmtMoeda(receitasVendas)}</strong>
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-600">
              <SlidersHorizontal size={11} /> Manual: <strong>{fmtMoeda(receitasManual)}</strong>
            </span>
            <span className="ml-auto text-xs font-bold text-emerald-700">
              Total: {fmtMoeda(totalListaReceitas)}
            </span>
          </div>
        )}

        {/* Subtotais do período (quando não está filtrando por tipo) */}
        {!carregandoLista && filtroTipo !== 'receita' && lancamentos.length > 0 && (
          <div className="flex items-center gap-6 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs flex-wrap">
            <span className="text-slate-400">{lancamentosVisiveis.length} lançamento{lancamentosVisiveis.length !== 1 ? 's' : ''}</span>
            {filtroTipo === 'todos' && <>
              <span className="text-emerald-600 font-medium">+ {fmtMoeda(totalListaReceitas)}</span>
              <span className="text-red-500 font-medium">- {fmtMoeda(totalListaDespesas)}</span>
              <span className={`font-semibold ${totalListaReceitas - totalListaDespesas >= 0 ? 'text-slate-700' : 'text-red-500'}`}>
                Saldo: {fmtMoeda(totalListaReceitas - totalListaDespesas)}
              </span>
            </>}
            {filtroTipo === 'despesa' && (
              <span className="text-red-500 font-semibold">Total despesas: {fmtMoeda(totalListaDespesas)}</span>
            )}
          </div>
        )}

        {/* Lista */}
        {carregandoLista ? (
          <SkeletonLista />
        ) : lancamentosVisiveis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3">
              <Wallet size={24} className="text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-600 mb-1">
              {lancamentos.length > 0 ? `Nenhuma ${filtroTipo} no período` : 'Nenhum lançamento no período'}
            </h3>
            <p className="text-xs text-slate-400 max-w-xs">
              {lancamentos.length > 0
                ? `Mude o filtro ou selecione outro período.`
                : 'Selecione outro período ou adicione um novo lançamento.'}
            </p>
            {lancamentos.length === 0 && (
              <button
                onClick={() => setModal('novo')}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 transition-colors"
              >
                <Plus size={13} />
                Novo lançamento
              </button>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {lancamentosVisiveis.map(l => (
              <LancamentoItem
                key={l.id}
                lancamento={l}
                onEditar={setModal}
                onDeletar={setModalDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modais ── */}
      {modalRelatorio && (
        <ModalRelatorio onFechar={() => setModalRelatorio(false)} />
      )}
      {modal && (
        <ModalLancamento
          lancamento={modal === 'novo' ? null : modal}
          onSalvar={() => { setModal(null); aposAcao() }}
          onFechar={() => setModal(null)}
        />
      )}
      {modalDelete && (
        <ModalDelete
          lancamento={modalDelete}
          onConfirmar={() => { setModalDelete(null); aposAcao() }}
          onFechar={() => setModalDelete(null)}
        />
      )}
    </div>
  )
}
