import { useState, useEffect } from 'react'
import {
  Plus, X, FileText, AlertTriangle, CheckCircle, AlertCircle,
  Upload, ExternalLink, Trash2, Edit2, ChevronDown, ChevronUp,
  FlaskConical, Sparkles, LayoutList, Tag,
} from 'lucide-react'
import CampoClinico from '../CampoClinico'

// ── Tipos de exame disponíveis ─────────────────────────────
const TIPOS_EXAME = [
  'Hemograma',
  'Bioquímica',
  'Urinálise',
  'Parasitológico',
  'Raio-X',
  'Ultrassom',
  'Ecocardiograma',
  'Eletrocardiograma',
  'Tomografia',
  'Citologia',
  'Histopatologia',
  'Microbiologia',
  'Coagulograma',
  'Perfil Renal',
  'Perfil Hepático',
  'Outro',
]

// ── Cores por resultado ────────────────────────────────────
const RESULTADO_CONFIG = {
  'Normal':   { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  'Alterado': { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   badge: 'bg-amber-100 text-amber-700',   icon: AlertCircle },
  'Crítico':  { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     badge: 'bg-red-100 text-red-700',       icon: AlertTriangle },
}

function fmtData(data) {
  if (!data) return '—'
  return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')
}

// ── Form vazio inicial ─────────────────────────────────────
function formVazio() {
  return {
    tipo: '',
    data_coleta: new Date().toISOString().split('T')[0],
    laboratorio: '',
    veterinario: '',
    resultado: 'Normal',
    observacoes: '',
    arquivo_path: '',
    arquivo_nome: '',
  }
}

// ── Card de exame na timeline ──────────────────────────────
function CardExame({ exame, onEditar, onDeletar, onAbrirArquivo }) {
  const [expandido, setExpandido] = useState(false)
  const cfg = RESULTADO_CONFIG[exame.resultado] || RESULTADO_CONFIG['Normal']
  const Icon = cfg.icon

  return (
    <div className={`rounded-xl border p-4 transition-all ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-start gap-3">
        {/* Ícone resultado */}
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.badge}`}>
          <Icon size={16} />
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-800">{exame.tipo}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                  {exame.resultado}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {exame.data_coleta && (
                  <span className="text-xs text-slate-500">{fmtData(exame.data_coleta)}</span>
                )}
                {exame.laboratorio && (
                  <span className="text-xs text-slate-400">· {exame.laboratorio}</span>
                )}
                {exame.veterinario && (
                  <span className="text-xs text-slate-400">· {exame.veterinario}</span>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {exame.arquivo_path && (
                <button
                  onClick={() => onAbrirArquivo(exame.arquivo_path)}
                  title="Abrir arquivo"
                  className="p-1.5 rounded-lg hover:bg-white/60 text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <ExternalLink size={13} />
                </button>
              )}
              <button
                onClick={() => setExpandido(v => !v)}
                className="p-1.5 rounded-lg hover:bg-white/60 text-slate-400 transition-colors"
              >
                {expandido ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
              <button
                onClick={() => onEditar(exame)}
                className="p-1.5 rounded-lg hover:bg-white/60 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <Edit2 size={13} />
              </button>
              <button
                onClick={() => onDeletar(exame.id)}
                className="p-1.5 rounded-lg hover:bg-red-100 text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Expandido: observações + arquivo */}
          {expandido && (
            <div className="mt-3 pt-3 border-t border-current/10 space-y-2">
              {exame.observacoes && (
                <p className="text-xs text-slate-600 leading-relaxed">{exame.observacoes}</p>
              )}
              {exame.arquivo_nome && (
                <button
                  onClick={() => onAbrirArquivo(exame.arquivo_path)}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <FileText size={12} />
                  {exame.arquivo_nome}
                  <ExternalLink size={10} />
                </button>
              )}
              {!exame.observacoes && !exame.arquivo_nome && (
                <p className="text-xs text-slate-400 italic">Sem observações ou arquivo.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Modal de novo/editar exame ─────────────────────────────
function ModalExame({ idPet, exameEditando, onSalvar, onFechar }) {
  const [form, setForm]           = useState(exameEditando ? { ...exameEditando } : formVazio())
  const [salvando, setSalvando]   = useState(false)
  const [erro, setErro]           = useState('')
  const [adicionados, setAdicionados] = useState([]) // exames salvos nesta sessão

  // Estados do PDF
  const [carregandoArq, setCarregandoArq] = useState(false)
  const [textoPdf, setTextoPdf]           = useState('')
  const [sugestoes, setSugestoes]         = useState(null)
  const [mostrarPdf, setMostrarPdf]       = useState(false)
  const [extraindo, setExtraindo]         = useState(false)

  function set(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
    setErro('')
  }

  function resetarForm() {
    setForm(formVazio())
    setTextoPdf('')
    setSugestoes(null)
    setMostrarPdf(false)
    setErro('')
  }

  async function selecionarArquivo() {
    setCarregandoArq(true)
    try {
      const res = await window.api.exames.selecionarArquivo(idPet)
      if (res.canceled) return
      setForm(f => ({ ...f, arquivo_path: res.path, arquivo_nome: res.nome }))

      if (res.tipo === 'pdf') {
        setExtraindo(true)
        const ext = await window.api.exames.extrairPdf(res.path)
        setExtraindo(false)
        if (ext.ok && ext.texto) {
          setTextoPdf(ext.texto)
          setSugestoes(ext.sugestoes)
          setMostrarPdf(true)
          // Auto-preenche campos detectados imediatamente
          if (ext.sugestoes) {
            setForm(f => ({
              ...f,
              tipo:        ext.sugestoes.tipo        || f.tipo,
              data_coleta: ext.sugestoes.data_coleta || f.data_coleta,
              laboratorio: ext.sugestoes.laboratorio || f.laboratorio,
              veterinario: ext.sugestoes.veterinario || f.veterinario,
            }))
          }
        }
      }
    } finally {
      setCarregandoArq(false)
    }
  }

  function aceitarSugestoes() {
    if (!sugestoes) return
    setForm(f => ({
      ...f,
      tipo:        sugestoes.tipo        || f.tipo,
      data_coleta: sugestoes.data_coleta || f.data_coleta,
      laboratorio: sugestoes.laboratorio || f.laboratorio,
      veterinario: sugestoes.veterinario || f.veterinario,
    }))
    setSugestoes(null)
  }

  async function _salvarDados(fecharAoFim) {
    if (!form.tipo) { setErro('Selecione o tipo de exame'); return false }
    setSalvando(true)
    try {
      const dados = {
        id_pet:       idPet,
        tipo:         form.tipo,
        data_coleta:  form.data_coleta  || null,
        laboratorio:  form.laboratorio  || null,
        veterinario:  form.veterinario  || null,
        resultado:    form.resultado    || 'Normal',
        observacoes:  form.observacoes  || null,
        arquivo_path: form.arquivo_path || null,
        arquivo_nome: form.arquivo_nome || null,
      }
      if (exameEditando) {
        await window.api.exames.editar(exameEditando.id, dados)
      } else {
        await window.api.exames.criar(dados)
      }
      if (fecharAoFim) {
        onSalvar()
      } else {
        setAdicionados(prev => [...prev, { tipo: form.tipo, arquivo_nome: form.arquivo_nome }])
        resetarForm()
      }
      return true
    } catch (e) {
      setErro('Erro ao salvar: ' + e.message)
      return false
    } finally {
      setSalvando(false)
    }
  }

  async function salvar()           { await _salvarDados(true) }
  async function salvarEAdicionar() { await _salvarDados(false) }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className={`bg-white rounded-2xl shadow-xl w-full my-4 ${mostrarPdf ? 'max-w-4xl' : 'max-w-lg'}`}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">
            {exameEditando ? 'Editar exame' : 'Novo exame'}
          </h3>
          <button onClick={onFechar} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={16} />
          </button>
        </div>

        <div className={`${mostrarPdf ? 'flex gap-0 divide-x divide-slate-100' : ''}`}>

          {/* ── Painel esquerdo: texto do PDF ── */}
          {mostrarPdf && (
            <div className="w-1/2 p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Conteúdo do PDF</p>
                {sugestoes && Object.keys(sugestoes).length > 0 && (
                  <button
                    onClick={aceitarSugestoes}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors"
                  >
                    <Sparkles size={12} />
                    Aceitar sugestões
                  </button>
                )}
              </div>

              {/* Sugestões detectadas */}
              {sugestoes && Object.keys(sugestoes).length > 0 && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 space-y-1">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-2">
                    Detectado automaticamente:
                  </p>
                  {sugestoes.tipo && (
                    <p className="text-xs text-slate-700">
                      <span className="font-semibold">Tipo:</span> {sugestoes.tipo}
                    </p>
                  )}
                  {sugestoes.data_coleta && (
                    <p className="text-xs text-slate-700">
                      <span className="font-semibold">Data:</span> {fmtData(sugestoes.data_coleta)}
                    </p>
                  )}
                  {sugestoes.laboratorio && (
                    <p className="text-xs text-slate-700 truncate">
                      <span className="font-semibold">Lab:</span> {sugestoes.laboratorio}
                    </p>
                  )}
                  {sugestoes.veterinario && (
                    <p className="text-xs text-slate-700 truncate">
                      <span className="font-semibold">Vet:</span> {sugestoes.veterinario}
                    </p>
                  )}
                </div>
              )}

              {/* Texto bruto */}
              <div className="flex-1 bg-slate-50 rounded-xl p-3 overflow-y-auto max-h-96">
                <pre className="text-[11px] text-slate-500 whitespace-pre-wrap leading-relaxed font-mono">
                  {textoPdf || '(sem texto extraído)'}
                </pre>
              </div>
            </div>
          )}

          {/* ── Formulário ── */}
          <div className={`${mostrarPdf ? 'w-1/2' : 'w-full'} p-5 space-y-3`}>

            {/* Arquivo */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Arquivo do exame</label>
              {form.arquivo_nome ? (
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <FileText size={14} className="text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-700 flex-1 truncate">{form.arquivo_nome}</span>
                  <button
                    onClick={() => setForm(f => ({ ...f, arquivo_path: '', arquivo_nome: '' }))}
                    className="p-1 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-400 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={selecionarArquivo}
                  disabled={carregandoArq}
                  className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all disabled:opacity-50"
                >
                  {carregandoArq || extraindo ? (
                    <>
                      <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      {extraindo ? 'Lendo PDF...' : 'Selecionando...'}
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      Selecionar PDF ou imagem
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Tipo de exame *</label>
              <select
                value={form.tipo}
                onChange={e => set('tipo', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 bg-white"
              >
                <option value="">Selecione...</option>
                {TIPOS_EXAME.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {erro && <p className="text-xs text-red-500 mt-1">{erro}</p>}
            </div>

            {/* Data de coleta */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Data de coleta</label>
              <input
                type="date"
                value={form.data_coleta}
                onChange={e => set('data_coleta', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
              />
            </div>

            {/* Laboratório */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Laboratório / Clínica</label>
              <input
                type="text"
                placeholder="Ex: BioVet Lab"
                value={form.laboratorio}
                onChange={e => set('laboratorio', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
              />
            </div>

            {/* Veterinário */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Veterinário responsável</label>
              <input
                type="text"
                placeholder="Ex: Dr. João Silva"
                value={form.veterinario}
                onChange={e => set('veterinario', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
              />
            </div>

            {/* Resultado */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Resultado</label>
              <div className="flex gap-2">
                {['Normal', 'Alterado', 'Crítico'].map(r => {
                  const cfg = RESULTADO_CONFIG[r]
                  return (
                    <button
                      key={r}
                      onClick={() => set('resultado', r)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        form.resultado === r
                          ? `${cfg.bg} ${cfg.border} ${cfg.text}`
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {r}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Observações / Laudo resumido</label>
              <CampoClinico
                rows={3}
                placeholder="Ex: Leucocitose discreta, demais parâmetros normais..."
                value={form.observacoes}
                onChange={e => set('observacoes', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 resize-none"
              />
            </div>

            {/* Exames já adicionados nesta sessão */}
            {adicionados.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-emerald-700 mb-1.5">
                  ✓ {adicionados.length} exame{adicionados.length > 1 ? 's' : ''} salvos nesta sessão:
                </p>
                <div className="space-y-1">
                  {adicionados.map((a, i) => (
                    <p key={i} className="text-xs text-emerald-600 flex items-center gap-1.5">
                      <CheckCircle size={11} />
                      {a.tipo}{a.arquivo_nome ? ` — ${a.arquivo_nome}` : ''}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-2 pt-1 flex-wrap">
              <button
                onClick={onFechar}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {adicionados.length > 0 ? 'Fechar' : 'Cancelar'}
              </button>
              {!exameEditando && (
                <button
                  onClick={salvarEAdicionar}
                  disabled={salvando}
                  className="flex-1 py-2.5 bg-slate-700 text-white rounded-xl text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus size={13} />
                  {salvando ? 'Salvando...' : 'Salvar e adicionar outro'}
                </button>
              )}
              <button
                onClick={salvar}
                disabled={salvando}
                className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {salvando ? 'Salvando...' : exameEditando ? 'Salvar alterações' : 'Salvar e fechar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Aba Exames (componente principal) ─────────────────────
export default function AbaExames({ idPet, nomePet }) {
  const [exames, setExames]               = useState([])
  const [loading, setLoading]             = useState(true)
  const [modalAberto, setModalAberto]     = useState(false)
  const [exameEditando, setExameEditando] = useState(null)
  const [agrupamento, setAgrupamento]     = useState('data') // 'data' | 'tipo'
  const [confirmDel, setConfirmDel]       = useState(null)

  async function carregar() {
    try {
      const lista = await window.api.exames.buscarPorPet(idPet)
      setExames(lista ?? [])
    } catch (e) {
      console.error('[AbaExames]', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [idPet]) // eslint-disable-line

  function abrirNovoExame() {
    setExameEditando(null)
    setModalAberto(true)
  }

  function abrirEdicao(exame) {
    setExameEditando(exame)
    setModalAberto(true)
  }

  async function deletar(id) {
    await window.api.exames.deletar(id)
    setConfirmDel(null)
    carregar()
  }

  function abrirArquivo(arquivoPath) {
    window.api.exames.abrirArquivo(arquivoPath)
  }

  // ── Críticos em destaque ──
  const criticos = exames.filter(e => e.resultado === 'Crítico')

  // ── Agrupamento por tipo ──
  function agruparPorTipo(lista) {
    const grupos = {}
    for (const e of lista) {
      if (!grupos[e.tipo]) grupos[e.tipo] = []
      grupos[e.tipo].push(e)
    }
    return Object.entries(grupos).sort(([a], [b]) => a.localeCompare(b))
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-700">
            {exames.length} {exames.length === 1 ? 'exame' : 'exames'}
          </p>
          {criticos.length > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px] font-bold">
              <AlertTriangle size={10} />
              {criticos.length} crítico{criticos.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle agrupamento */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setAgrupamento('data')}
              title="Por data"
              className={`p-1.5 rounded-md transition-all ${agrupamento === 'data' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutList size={13} />
            </button>
            <button
              onClick={() => setAgrupamento('tipo')}
              title="Por tipo"
              className={`p-1.5 rounded-md transition-all ${agrupamento === 'tipo' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Tag size={13} />
            </button>
          </div>
          <button
            onClick={abrirNovoExame}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 transition-colors"
          >
            <Plus size={13} />
            Novo exame
          </button>
        </div>
      </div>

      {/* Banner de críticos */}
      {criticos.length > 0 && (
        <div className="p-3 bg-red-50 rounded-xl border border-red-200 flex items-start gap-2">
          <AlertTriangle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-red-700">Atenção — resultados críticos</p>
            <p className="text-xs text-red-500 mt-0.5">
              {criticos.map(e => e.tipo).join(', ')} — verifique com o veterinário responsável.
            </p>
          </div>
        </div>
      )}

      {/* Lista vazia */}
      {exames.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3">
            <FlaskConical size={24} className="text-slate-200" />
          </div>
          <p className="text-sm text-slate-400">Nenhum exame registrado para {nomePet}</p>
          <p className="text-xs text-slate-300 mt-1">PDFs, imagens, laudos — tudo fica aqui</p>
          <button
            onClick={abrirNovoExame}
            className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <Plus size={14} />
            Adicionar primeiro exame
          </button>
        </div>
      ) : agrupamento === 'data' ? (
        /* Por data — timeline simples */
        <div className="space-y-2">
          {exames.map(exame => (
            <CardExame
              key={exame.id}
              exame={exame}
              onEditar={abrirEdicao}
              onDeletar={(id) => setConfirmDel(id)}
              onAbrirArquivo={abrirArquivo}
            />
          ))}
        </div>
      ) : (
        /* Por tipo — agrupado */
        <div className="space-y-4">
          {agruparPorTipo(exames).map(([tipo, lista]) => (
            <div key={tipo}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <FlaskConical size={10} />
                {tipo} ({lista.length})
              </p>
              <div className="space-y-2">
                {lista.map(exame => (
                  <CardExame
                    key={exame.id}
                    exame={exame}
                    onEditar={abrirEdicao}
                    onDeletar={(id) => setConfirmDel(id)}
                    onAbrirArquivo={abrirArquivo}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal novo/editar */}
      {modalAberto && (
        <ModalExame
          idPet={idPet}
          exameEditando={exameEditando}
          onSalvar={() => { setModalAberto(false); carregar() }}
          onFechar={() => setModalAberto(false)}
        />
      )}

      {/* Confirmar deleção */}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="w-11 h-11 bg-red-50 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800 text-center mb-2">Excluir exame?</h3>
            <p className="text-sm text-slate-400 text-center mb-5">
              O arquivo vinculado não será apagado do seu computador.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors">
                Cancelar
              </button>
              <button onClick={() => deletar(confirmDel)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
