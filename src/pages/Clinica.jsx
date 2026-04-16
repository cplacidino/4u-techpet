import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Stethoscope, BedDouble, Scissors, ClipboardList, FlaskConical,
  Search, PawPrint, Phone, User, Plus, ChevronRight,
  Calendar, Clock, AlertCircle, Loader2,
  Receipt, Trash2, CheckSquare, Square, CreditCard, HandCoins,
} from 'lucide-react'

// ── Utilitários ───────────────────────────────────────────

function fmtData(d) {
  if (!d) return '—'
  const [a, m, dia] = d.split('-')
  return `${dia}/${m}/${a}`
}

// ── Config de tipos clínicos ──────────────────────────────

const TIPO = {
  consulta:   { label: 'Consulta',   Icon: Stethoscope,   dot: 'bg-sky-400',     badge: 'bg-sky-50 text-sky-700 border-sky-100',           rota: '/consultas'   },
  internacao: { label: 'Internação', Icon: BedDouble,     dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-100',       rota: '/internacoes' },
  cirurgia:   { label: 'Cirurgia',   Icon: Scissors,      dot: 'bg-violet-400',  badge: 'bg-violet-50 text-violet-700 border-violet-100',    rota: '/cirurgias'   },
  prescricao: { label: 'Prescrição', Icon: ClipboardList, dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100', rota: '/prescricoes' },
  exame:      { label: 'Exame',      Icon: FlaskConical,  dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-600 border-slate-200',      rota: '/consultas'   },
}

const ACOES = [
  { label: 'Nova Consulta',   Icon: Stethoscope,   rota: '/consultas',   cor: 'bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-100'           },
  { label: 'Nova Internação', Icon: BedDouble,     rota: '/internacoes', cor: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-100'   },
  { label: 'Nova Cirurgia',   Icon: Scissors,      rota: '/cirurgias',   cor: 'bg-violet-50 text-violet-700 hover:bg-violet-100 border-violet-100'},
  { label: 'Nova Prescrição', Icon: ClipboardList, rota: '/prescricoes', cor: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100'},
]

// ── Card de evento da timeline ────────────────────────────

function EventoCard({ ev, onNavegar }) {
  const cfg = TIPO[ev.tipo] || TIPO.consulta
  const { Icon } = cfg

  return (
    <div className="flex gap-4">
      {/* Linha + dot */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${cfg.dot}`} />
        <div className="w-px flex-1 bg-slate-100 mt-1" />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 pb-5">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${cfg.badge}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${cfg.badge}`}>{cfg.label}</span>
                  {ev.status_reg === 'internado' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 font-semibold flex items-center gap-0.5">
                      <AlertCircle size={9} /> Em curso
                    </span>
                  )}
                </div>
                {ev.titulo && (
                  <p className="text-sm font-medium text-slate-800 mt-1 truncate">{ev.titulo}</p>
                )}
                {ev.detalhe && (
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{ev.detalhe}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Calendar size={11} />{fmtData(ev.data)}
                    {ev.hora && <><Clock size={11} className="ml-1" />{ev.hora}</>}
                  </span>
                  {ev.veterinario && (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <User size={11} />{ev.veterinario}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => onNavegar(cfg.rota)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 text-slate-500 border border-slate-200 rounded-lg text-xs hover:bg-slate-100 transition-colors flex-shrink-0"
            >
              Ver <ChevronRight size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Aba de Faturamento ────────────────────────────────────

const LABEL_TIPO = { consulta: 'Consulta', internacao: 'Internação', cirurgia: 'Cirurgia', prescricao: 'Prescrição', exame: 'Exame' }

function fmtMoeda(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function FaturamentoTab({ historico, pet }) {
  const [itens, setItens] = useState(() =>
    historico
      .filter(ev => ['consulta', 'internacao', 'cirurgia'].includes(ev.tipo))
      .map((ev, i) => ({
        _key:      i,
        descricao: `${LABEL_TIPO[ev.tipo] || ev.tipo}${ev.titulo ? ` — ${ev.titulo}` : ''}`,
        valor:     '',
        selecionado: true,
      }))
  )
  const [livres, setLivres] = useState([])
  const [tipoPgto, setTipoPgto] = useState('vista')
  const [vencimento, setVencimento] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  function toggleItem(i) {
    setItens(prev => prev.map((it, idx) => idx === i ? { ...it, selecionado: !it.selecionado } : it))
  }
  function setValorItem(i, v) {
    setItens(prev => prev.map((it, idx) => idx === i ? { ...it, valor: v } : it))
  }
  function addLivre() {
    setLivres(prev => [...prev, { descricao: '', valor: '' }])
  }
  function setLivre(i, campo, v) {
    setLivres(prev => prev.map((it, idx) => idx === i ? { ...it, [campo]: v } : it))
  }
  function removeLivre(i) {
    setLivres(prev => prev.filter((_, idx) => idx !== i))
  }

  const itensSelecionados = itens.filter(it => it.selecionado && it.valor !== '')
  const livresValidos     = livres.filter(it => it.descricao.trim() && it.valor !== '')
  const total = [
    ...itensSelecionados.map(it => parseFloat(it.valor) || 0),
    ...livresValidos.map(it => parseFloat(it.valor) || 0),
  ].reduce((s, v) => s + v, 0)

  const todosSelecionados = [...itensSelecionados, ...livresValidos]

  async function confirmar() {
    if (todosSelecionados.length === 0) return
    setSalvando(true)
    try {
      const descGeral = `Atendimento clínico — ${pet.nome} (${todosSelecionados.length} item${todosSelecionados.length !== 1 ? 's' : ''})`
      await window.api.clinica.faturar({
        id_dono:         pet.id_dono || null,
        descricao:       descGeral,
        itens:           todosSelecionados,
        total,
        tipo_pagamento:  tipoPgto,
        data_vencimento: tipoPgto === 'prazo' ? vencimento || null : null,
      })
      setSucesso(true)
    } finally {
      setSalvando(false)
    }
  }

  if (sucesso) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-100 p-10 flex flex-col items-center text-center shadow-sm">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
          <Receipt size={28} className="text-emerald-600" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">Faturamento registrado!</h3>
        <p className="text-sm text-slate-500 mb-1">
          {tipoPgto === 'vista' ? 'Lançado como receita no Financeiro.' : 'Lançado como conta a receber no Fiado.'}
        </p>
        <p className="text-lg font-bold text-emerald-700 mb-5">{fmtMoeda(total)}</p>
        <button
          onClick={() => setSucesso(false)}
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
        >
          Novo faturamento
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Itens do histórico */}
      {itens.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-50">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Serviços clínicos</p>
          </div>
          <div className="divide-y divide-slate-50">
            {itens.map((it, i) => (
              <div key={it._key} className="flex items-center gap-3 px-5 py-3">
                <button onClick={() => toggleItem(i)} className="flex-shrink-0 text-slate-400 hover:text-emerald-600 transition-colors">
                  {it.selecionado ? <CheckSquare size={16} className="text-emerald-500" /> : <Square size={16} />}
                </button>
                <p className={`flex-1 text-sm truncate ${it.selecionado ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                  {it.descricao}
                </p>
                <div className="relative flex-shrink-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={it.valor}
                    onChange={e => setValorItem(i, e.target.value)}
                    disabled={!it.selecionado}
                    className="pl-8 pr-2 py-1.5 w-28 border border-slate-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Itens livres */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-50">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Itens adicionais</p>
          <button onClick={addLivre} className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium">
            <Plus size={12} /> Adicionar
          </button>
        </div>
        {livres.length === 0 ? (
          <p className="text-xs text-slate-400 px-5 py-4 text-center">Medicamentos, materiais, taxas, etc.</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {livres.map((it, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <input
                  type="text"
                  placeholder="Descrição"
                  value={it.descricao}
                  onChange={e => setLivre(i, 'descricao', e.target.value)}
                  className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
                <div className="relative flex-shrink-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={it.valor}
                    onChange={e => setLivre(i, 'valor', e.target.value)}
                    className="pl-8 pr-2 py-1.5 w-28 border border-slate-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <button onClick={() => removeLivre(i)} className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagamento + total */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="flex gap-3">
          <button
            onClick={() => setTipoPgto('vista')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${tipoPgto === 'vista' ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
          >
            <CreditCard size={14} /> À vista
          </button>
          <button
            onClick={() => setTipoPgto('prazo')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${tipoPgto === 'prazo' ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
          >
            <HandCoins size={14} /> A prazo (fiado)
          </button>
        </div>

        {tipoPgto === 'prazo' && (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Data de vencimento</label>
            <input
              type="date"
              value={vencimento}
              onChange={e => setVencimento(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
            />
            {!pet.id_dono && (
              <p className="text-xs text-amber-600 mt-1.5">⚠ Este animal não tem tutor cadastrado. O lançamento será criado sem vínculo de cliente.</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-400">{todosSelecionados.length} item{todosSelecionados.length !== 1 ? 's' : ''}</p>
            <p className="text-2xl font-bold text-slate-800">{fmtMoeda(total)}</p>
          </div>
          <button
            onClick={confirmar}
            disabled={salvando || todosSelecionados.length === 0 || total <= 0}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {salvando ? <Loader2 size={14} className="animate-spin" /> : <Receipt size={14} />}
            {salvando ? 'Registrando...' : 'Confirmar faturamento'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────

export default function Clinica() {
  const navigate = useNavigate()
  const inputRef = useRef(null)

  const [busca, setBusca] = useState('')
  const [sugestoes, setSugestoes] = useState([])
  const [showSugestoes, setShowSugestoes] = useState(false)
  const [petSelecionado, setPetSelecionado] = useState(null)
  const [historico, setHistorico] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [aba, setAba] = useState('historico') // 'historico' | 'faturamento'

  // Busca de pets conforme o usuário digita
  useEffect(() => {
    if (!busca || busca.length < 2) { setSugestoes([]); return }
    setBuscando(true)
    const timer = setTimeout(async () => {
      try {
        const lista = await window.api.pets.buscarPorNome(busca)
        setSugestoes(lista || [])
      } finally {
        setBuscando(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [busca])

  async function selecionarPet(pet) {
    setPetSelecionado(pet)
    setBusca(pet.nome)
    setShowSugestoes(false)
    setSugestoes([])
    setCarregando(true)
    try {
      const h = await window.api.clinica.historicoPet(pet.id)
      setHistorico(h || [])
    } finally {
      setCarregando(false)
    }
  }

  function irPara(rota) {
    if (petSelecionado) {
      sessionStorage.setItem('clinica_pet_preselect', JSON.stringify({
        id:   petSelecionado.id,
        nome: petSelecionado.nome,
      }))
    }
    navigate(rota)
  }

  function limpar() {
    setPetSelecionado(null)
    setHistorico([])
    setBusca('')
    setSugestoes([])
    inputRef.current?.focus()
  }

  const contadores = historico.reduce((acc, ev) => {
    acc[ev.tipo] = (acc[ev.tipo] || 0) + 1
    return acc
  }, {})

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">

      {/* Cabeçalho */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Panorama Clínico</h2>
        <p className="text-sm text-slate-400 mt-0.5">Histórico clínico completo por animal</p>
      </div>

      {/* Busca de pet */}
      <div className="relative">
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-400 transition-all">
          <Search size={18} className="text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar animal por nome..."
            value={busca}
            onChange={e => { setBusca(e.target.value); setShowSugestoes(true); if (!e.target.value) limpar() }}
            onFocus={() => setShowSugestoes(true)}
            className="flex-1 text-sm text-slate-700 bg-transparent focus:outline-none placeholder:text-slate-400"
          />
          {buscando && <Loader2 size={15} className="text-slate-400 animate-spin flex-shrink-0" />}
          {petSelecionado && (
            <button onClick={limpar} className="text-xs text-slate-400 hover:text-slate-600 flex-shrink-0">
              Limpar
            </button>
          )}
        </div>

        {/* Sugestões */}
        {showSugestoes && sugestoes.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 overflow-hidden">
            {sugestoes.map(p => (
              <button
                key={p.id}
                onClick={() => selecionarPet(p)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0"
              >
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <PawPrint size={16} className="text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{p.nome}</p>
                  <p className="text-xs text-slate-400">{p.especie}{p.raca ? ` · ${p.raca}` : ''}{p.nome_dono ? ` · ${p.nome_dono}` : ''}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Estado vazio */}
      {!petSelecionado && (
        <div className="bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
            <PawPrint size={28} className="text-slate-300" />
          </div>
          <p className="text-base font-semibold text-slate-500">Nenhum animal selecionado</p>
          <p className="text-sm text-slate-400 mt-1">Pesquise pelo nome do animal para ver o histórico clínico</p>
        </div>
      )}

      {/* Panorama do pet */}
      {petSelecionado && (
        <>
          {/* Card do pet */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <PawPrint size={24} className="text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-slate-800">{petSelecionado.nome}</p>
              <p className="text-sm text-slate-500">
                {petSelecionado.especie}{petSelecionado.raca ? ` · ${petSelecionado.raca}` : ''}
                {petSelecionado.sexo ? ` · ${petSelecionado.sexo}` : ''}
              </p>
              {(petSelecionado.nome_dono || petSelecionado.telefone_dono) && (
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {petSelecionado.nome_dono && (
                    <span className="flex items-center gap-1 text-xs text-slate-400"><User size={11} />{petSelecionado.nome_dono}</span>
                  )}
                  {petSelecionado.telefone_dono && (
                    <span className="flex items-center gap-1 text-xs text-slate-400"><Phone size={11} />{petSelecionado.telefone_dono}</span>
                  )}
                </div>
              )}
            </div>
            {/* Contadores resumo */}
            <div className="flex gap-3 flex-wrap justify-end">
              {Object.entries(TIPO).map(([tipo, cfg]) => {
                const n = contadores[tipo] || 0
                if (!n) return null
                const { Icon } = cfg
                return (
                  <div key={tipo} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${cfg.badge}`}>
                    <Icon size={12} />{n}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Ações rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ACOES.map(({ label, Icon, rota, cor }) => (
              <button
                key={rota}
                onClick={() => irPara(rota)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${cor}`}
              >
                <Icon size={15} />
                <span className="truncate">{label}</span>
                <Plus size={12} className="ml-auto flex-shrink-0" />
              </button>
            ))}
          </div>

          {/* Seletor de abas */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
            {[
              { key: 'historico',   label: 'Histórico',    Icon: Stethoscope },
              { key: 'faturamento', label: 'Faturamento',  Icon: Receipt },
            ].map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setAba(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${aba === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Icon size={14} />{label}
              </button>
            ))}
          </div>

          {/* Aba Histórico */}
          {aba === 'historico' && (carregando ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-slate-200 mt-1" />
                    <div className="w-px flex-1 bg-slate-100 mt-1" />
                  </div>
                  <div className="flex-1 pb-5">
                    <div className="bg-white rounded-2xl border border-slate-100 h-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : historico.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center py-16 text-center">
              <Stethoscope size={32} className="text-slate-200 mb-3" />
              <p className="text-sm font-medium text-slate-500">Nenhum registro clínico</p>
              <p className="text-xs text-slate-400 mt-1">Use os botões acima para criar o primeiro atendimento</p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-slate-400 mb-4">{historico.length} registro{historico.length !== 1 ? 's' : ''} encontrado{historico.length !== 1 ? 's' : ''}</p>
              <div>
                {historico.map((ev, i) => (
                  <EventoCard key={`${ev.tipo}-${ev.id}-${i}`} ev={ev} onNavegar={irPara} />
                ))}
              </div>
            </div>
          ))}

          {/* Aba Faturamento */}
          {aba === 'faturamento' && (
            carregando
              ? <div className="bg-white rounded-2xl border border-slate-100 h-40 animate-pulse" />
              : <FaturamentoTab historico={historico} pet={petSelecionado} />
          )}
        </>
      )}

    </div>
  )
}
