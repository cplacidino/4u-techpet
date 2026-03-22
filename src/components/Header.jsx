import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Search, Syringe, CalendarClock, X, Sun, Moon, PawPrint, Users, Loader2 } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

// ── Títulos de cada rota ───────────────────────────────────
const titulos = {
  '/':              { titulo: 'Dashboard',      sub: 'Visão geral do dia' },
  '/pets':          { titulo: 'Pets',           sub: 'Gerenciar animais e tutores' },
  '/agendamentos':  { titulo: 'Agendamentos',   sub: 'Agenda e atendimentos' },
  '/vacinas':       { titulo: 'Vacinas',        sub: 'Carteira de vacinação' },
  '/financeiro':    { titulo: 'Financeiro',     sub: 'Caixa e lançamentos' },
  '/estoque':       { titulo: 'Estoque',        sub: 'Produtos e insumos' },
  '/vendas':        { titulo: 'Vendas',         sub: 'PDV e histórico de vendas' },
  '/consultas':     { titulo: 'Consultas',      sub: 'Prontuários e atendimentos' },
  '/internacoes':   { titulo: 'Internações',    sub: 'Pacientes internados' },
  '/cirurgias':     { titulo: 'Cirurgias',      sub: 'Procedimentos cirúrgicos' },
  '/prescricoes':   { titulo: 'Prescrições',    sub: 'Receituário veterinário' },
  '/veterinarios':  { titulo: 'Veterinários',   sub: 'Equipe clínica' },
  '/configuracoes': { titulo: 'Configurações',  sub: 'Preferências do sistema' },
}

// ── Busca Global ───────────────────────────────────────────

function BuscaGlobal({ onFechar }) {
  const [query, setQuery]         = useState('')
  const [resultados, setResultados] = useState({ pets: [], donos: [] })
  const [buscando, setBuscando]   = useState(false)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => { inputRef.current?.focus() }, [])

  // Fechar com Escape
  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onFechar() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onFechar])

  // Busca com debounce
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResultados({ pets: [], donos: [] })
      return
    }
    setBuscando(true)
    const timer = setTimeout(async () => {
      try {
        const [pets, donos] = await Promise.all([
          window.api.pets.buscarPorNome(query.trim()),
          window.api.donos.buscarPorNome(query.trim()),
        ])
        setResultados({ pets: pets ?? [], donos: donos ?? [] })
      } catch {
        setResultados({ pets: [], donos: [] })
      } finally {
        setBuscando(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const total = resultados.pets.length + resultados.donos.length
  const temResultado = total > 0
  const buscouSemResultado = query.trim().length >= 2 && !buscando && !temResultado

  function irParaPet(pet) {
    navigate('/pets', { state: { petId: pet.id } })
    onFechar()
  }

  function irParaDono(dono) {
    navigate('/pets', { state: { donoId: dono.id } })
    onFechar()
  }

  const ESPECIE_EMOJI = {
    'Cachorro': '🐕', 'Gato': '🐱', 'Pássaro': '🐦',
    'Coelho': '🐰', 'Peixe': '🐠',
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-24 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          {buscando
            ? <Loader2 size={16} className="text-slate-400 animate-spin flex-shrink-0" />
            : <Search size={16} className="text-slate-400 flex-shrink-0" />}
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar pet, tutor..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 text-sm text-slate-800 placeholder-slate-400 outline-none bg-transparent"
          />
          <button onClick={onFechar} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={14} />
          </button>
        </div>

        {/* Resultados */}
        <div className="max-h-80 overflow-y-auto">
          {!query.trim() && (
            <div className="py-10 text-center text-slate-400">
              <Search size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Digite o nome de um pet ou tutor</p>
              <p className="text-xs mt-1 opacity-70">Mínimo 2 caracteres</p>
            </div>
          )}

          {buscouSemResultado && (
            <div className="py-10 text-center text-slate-400">
              <p className="text-sm">Nenhum resultado para <strong className="text-slate-600">"{query}"</strong></p>
            </div>
          )}

          {resultados.pets.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Pets ({resultados.pets.length})
              </p>
              {resultados.pets.map(pet => (
                <button
                  key={pet.id}
                  onClick={() => irParaPet(pet)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 text-base">
                    {pet.foto
                      ? <img src={pet.foto} className="w-8 h-8 rounded-xl object-cover" alt={pet.nome} />
                      : (ESPECIE_EMOJI[pet.especie] || '🐾')
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{pet.nome}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {[pet.especie, pet.raca].filter(Boolean).join(' · ')}
                      {pet.nome_dono && ` — ${pet.nome_dono}`}
                    </p>
                  </div>
                  <PawPrint size={12} className="text-slate-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {resultados.donos.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Tutores ({resultados.donos.length})
              </p>
              {resultados.donos.map(dono => (
                <button
                  key={dono.id}
                  onClick={() => irParaDono(dono)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Users size={14} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{dono.nome}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {[dono.telefone, dono.email].filter(Boolean).join(' · ') || 'Tutor'}
                    </p>
                  </div>
                  <Users size={12} className="text-slate-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {temResultado && (
            <div className="px-4 py-2.5 border-t border-slate-50 bg-slate-50">
              <p className="text-[11px] text-slate-400 text-center">
                {total} resultado{total !== 1 ? 's' : ''} · Clique para abrir
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Painel de Notificações ────────────────────────────────

function PainelNotificacoes({ notifs, onFechar, onNavegar }) {
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onFechar()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onFechar])

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <span className="text-sm font-semibold text-slate-800">Notificações</span>
        <button onClick={onFechar} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
          <X size={14} />
        </button>
      </div>

      {notifs.length === 0 ? (
        <div className="py-10 flex flex-col items-center text-center text-slate-400">
          <Bell size={28} className="mb-2 opacity-30" />
          <p className="text-sm">Tudo em dia!</p>
          <p className="text-xs mt-0.5">Nenhum alerta no momento</p>
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
          {notifs.map((n, i) => (
            <button
              key={i}
              onClick={() => { onNavegar(n.rota); onFechar() }}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 text-left transition-colors"
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${n.iconBg}`}>
                <n.Icon size={15} className={n.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800">{n.titulo}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{n.descricao}</p>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 mt-1 ${n.badgeBg} ${n.badgeText}`}>
                {n.badge}
              </span>
            </button>
          ))}
        </div>
      )}

      {notifs.length > 0 && (
        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
          <p className="text-[10px] text-slate-400 text-center">Clique em uma notificação para navegar</p>
        </div>
      )}
    </div>
  )
}

// ── Header principal ──────────────────────────────────────

function Header() {
  const [agora, setAgora]           = useState(new Date())
  const [notifs, setNotifs]         = useState([])
  const [painelAberto, setPainelAberto] = useState(false)
  const [buscaAberta, setBuscaAberta]   = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { dark, toggle: toggleTema } = useTheme()

  // Relógio
  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Atalho Ctrl+K para abrir busca
  useEffect(() => {
    function handler(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setBuscaAberta(v => !v)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Notificações
  const carregarNotifs = useCallback(async () => {
    const lista = []
    try {
      const vacinas = await window.api.vacinas.reforcosPendentes()
      const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
      const urgentes = vacinas.filter(v => {
        const d = new Date(v.data_proximo_reforco + 'T00:00:00')
        return Math.floor((d - hoje) / 86400000) <= 7
      })
      if (urgentes.length > 0) {
        lista.push({
          titulo: 'Reforços de vacina urgentes',
          descricao: `${urgentes.length} vacina${urgentes.length > 1 ? 's' : ''} vencem nos próximos 7 dias`,
          Icon: Syringe,
          iconBg: 'bg-red-50', iconColor: 'text-red-500',
          badgeBg: 'bg-red-50', badgeText: 'text-red-600',
          badge: `${urgentes.length} urgente${urgentes.length > 1 ? 's' : ''}`,
          rota: '/vacinas',
        })
      }

      const dataHoje = hoje.toISOString().split('T')[0]
      const agendamentos = await window.api.agendamentos.buscarPorData(dataHoje)
      const pendentes = agendamentos.filter(a => a.status === 'agendado')
      if (pendentes.length > 0) {
        lista.push({
          titulo: 'Agendamentos pendentes hoje',
          descricao: `${pendentes.length} atendimento${pendentes.length > 1 ? 's' : ''} aguardando confirmação`,
          Icon: CalendarClock,
          iconBg: 'bg-amber-50', iconColor: 'text-amber-500',
          badgeBg: 'bg-amber-50', badgeText: 'text-amber-700',
          badge: `${pendentes.length} hoje`,
          rota: '/agendamentos',
        })
      }
    } catch (_) { /* silencioso */ }
    setNotifs(lista)
  }, [])

  useEffect(() => {
    carregarNotifs()
    const interval = setInterval(carregarNotifs, 60_000)
    return () => clearInterval(interval)
  }, [carregarNotifs])

  const pagina = titulos[location.pathname] || { titulo: '4u TechPet', sub: '' }
  const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const data = agora.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between flex-shrink-0">

        {/* Título da página */}
        <div>
          <h1 className="text-base font-semibold text-slate-800 leading-tight">{pagina.titulo}</h1>
          {pagina.sub && <p className="text-xs text-slate-400 capitalize leading-tight mt-0.5">{pagina.sub}</p>}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">

          {/* Busca */}
          <button
            onClick={() => setBuscaAberta(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-400 hover:text-slate-600 transition-colors text-sm"
          >
            <Search size={14} />
            <span className="text-slate-400 text-xs hidden sm:inline">Buscar...</span>
            <kbd className="hidden sm:inline ml-1 text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-mono">
              Ctrl K
            </kbd>
          </button>

          {/* Relógio */}
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-sm font-mono font-medium text-slate-600 dark:text-slate-300 select-none tabular-nums">
            {hora}
          </div>

          {/* Toggle tema */}
          <button
            onClick={toggleTema}
            title={dark ? 'Modo claro' : 'Modo escuro'}
            className="w-9 h-9 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Notificações */}
          <div className="relative">
            <button
              onClick={() => setPainelAberto(v => !v)}
              className="relative w-9 h-9 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Bell size={16} />
              {notifs.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {notifs.length}
                </span>
              )}
            </button>

            {painelAberto && (
              <PainelNotificacoes
                notifs={notifs}
                onFechar={() => setPainelAberto(false)}
                onNavegar={(rota) => navigate(rota)}
              />
            )}
          </div>

          {/* Data */}
          <div className="hidden lg:block pl-2 border-l border-slate-100">
            <p className="text-xs text-slate-400 capitalize whitespace-nowrap">{data}</p>
          </div>
        </div>
      </header>

      {/* Modal de busca global */}
      {buscaAberta && <BuscaGlobal onFechar={() => setBuscaAberta(false)} />}
    </>
  )
}

export default Header
