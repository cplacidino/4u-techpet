import { useState, useEffect, useRef } from 'react'
import {
  Lock, Building2, Layers, Database, Code2,
  Eye, EyeOff, Save, RefreshCw, AlertTriangle,
  CheckCircle2, Info, HardDrive, Users, PawPrint,
  CalendarDays, Syringe, Wallet, Package, Stethoscope,
  BedDouble, Scissors, ClipboardList, UserRound, X,
  Archive, FolderOpen, Upload, Clock, Loader2, ShoppingCart,
  ImagePlus, Trash2
} from 'lucide-react'
import { useConfig } from '../contexts/ConfigContext'

const SENHA_ADMIN = '4uJesusCristo'

// ── Tela de senha ─────────────────────────────────────────

function TelaLogin({ onEntrar }) {
  const [senha, setSenha] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [erro, setErro] = useState('')
  const [tremendo, setTremendo] = useState(false)

  function tentar() {
    if (senha === SENHA_ADMIN) {
      onEntrar()
    } else {
      setErro('Senha incorreta')
      setTremendo(true)
      setSenha('')
      setTimeout(() => setTremendo(false), 500)
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-20">
      <div className={`bg-white rounded-2xl border border-slate-100 shadow-soft p-8 text-center ${tremendo ? 'animate-shake' : ''}`}>
        <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Lock size={24} className="text-white" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-1">Área Restrita</h2>
        <p className="text-sm text-slate-400 mb-6">Digite a senha de administrador para continuar</p>

        <div className="relative mb-3">
          <input
            type={mostrar ? 'text' : 'password'}
            placeholder="Senha do admin"
            value={senha}
            onChange={e => { setSenha(e.target.value); setErro('') }}
            onKeyDown={e => e.key === 'Enter' && tentar()}
            autoFocus
            className={`w-full border rounded-xl px-4 py-3 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors ${
              erro ? 'border-red-300 bg-red-50' : 'border-slate-200'
            }`}
          />
          <button
            onClick={() => setMostrar(m => !m)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {mostrar ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {erro && <p className="text-xs text-red-500 mb-3">{erro}</p>}

        <button
          onClick={tentar}
          className="w-full py-3 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors"
        >
          Entrar
        </button>

        <p className="text-[11px] text-slate-300 mt-5">4u Technology · Sistema restrito</p>
      </div>
    </div>
  )
}

// ── Componentes auxiliares ────────────────────────────────

function Tab({ label, icon: Icon, ativo, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        ativo ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      <Icon size={15} />
      {label}
    </button>
  )
}

function Secao({ titulo, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5">
      <h3 className="text-sm font-bold text-slate-700 mb-4 pb-3 border-b border-slate-50">{titulo}</h3>
      {children}
    </div>
  )
}

function Campo({ label, name, valor, onChange, placeholder, tipo = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      <input
        type={tipo}
        name={name}
        value={valor || ''}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
      />
    </div>
  )
}

function Toggle({ ativo, onChange }) {
  return (
    <button
      onClick={() => onChange(!ativo)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${ativo ? 'bg-emerald-500' : 'bg-slate-200'}`}
    >
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${ativo ? 'left-6' : 'left-1'}`} />
    </button>
  )
}

// ── Tab: Clínica ──────────────────────────────────────────

function TabClinica({ onSalvo }) {
  const [form, setForm] = useState({
    clinica_nome: '', clinica_telefone: '', clinica_whatsapp: '',
    clinica_endereco: '', clinica_email: '', clinica_cnpj: '',
    clinica_crmv: '', clinica_site: '', clinica_logo: '',
  })
  const [salvando, setSalvando] = useState(false)
  const [ok, setOk] = useState(false)
  const inputLogoRef = useRef(null)

  useEffect(() => {
    window.api.configuracoes.getAll().then(all => {
      setForm(f => ({ ...f, ...Object.fromEntries(Object.entries(all).filter(([k]) => k.startsWith('clinica_'))) }))
    })
  }, [])

  function selecionarLogo(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setForm(f => ({ ...f, clinica_logo: ev.target.result }))
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function onChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function salvar() {
    setSalvando(true)
    try {
      for (const [chave, valor] of Object.entries(form)) {
        await window.api.configuracoes.set(chave, valor)
      }
      setOk(true)
      setTimeout(() => setOk(false), 3000)
      onSalvo()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-4">
      <Secao titulo="Identificação do estabelecimento">
        <div className="space-y-3">
          <Campo label="Nome do estabelecimento *" name="clinica_nome" valor={form.clinica_nome} onChange={onChange} placeholder="Ex: Clínica Veterinária São Francisco" />
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Telefone" name="clinica_telefone" valor={form.clinica_telefone} onChange={onChange} placeholder="(00) 0000-0000" />
            <Campo label="WhatsApp" name="clinica_whatsapp" valor={form.clinica_whatsapp} onChange={onChange} placeholder="(00) 00000-0000" />
          </div>
          <Campo label="Endereço completo" name="clinica_endereco" valor={form.clinica_endereco} onChange={onChange} placeholder="Rua, número, bairro, cidade — UF" />
          <div className="grid grid-cols-2 gap-3">
            <Campo label="E-mail" name="clinica_email" valor={form.clinica_email} onChange={onChange} placeholder="contato@clinica.com.br" tipo="email" />
            <Campo label="Site" name="clinica_site" valor={form.clinica_site} onChange={onChange} placeholder="www.clinica.com.br" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="CNPJ" name="clinica_cnpj" valor={form.clinica_cnpj} onChange={onChange} placeholder="00.000.000/0000-00" />
            <Campo label="CRMV" name="clinica_crmv" valor={form.clinica_crmv} onChange={onChange} placeholder="CRMV-XX 000000" />
          </div>

          {/* Logo */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Logo da clínica (aparece nas impressões)</label>
            <div className="flex items-center gap-4">
              {form.clinica_logo ? (
                <div className="relative">
                  <img src={form.clinica_logo} alt="Logo" className="w-20 h-20 rounded-xl object-contain border border-slate-200 bg-slate-50 p-1" />
                  <button
                    onClick={() => setForm(f => ({ ...f, clinica_logo: '' }))}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50">
                  <ImagePlus size={22} className="text-slate-300" />
                </div>
              )}
              <div>
                <input
                  ref={inputLogoRef}
                  type="file"
                  accept="image/*"
                  onChange={selecionarLogo}
                  className="hidden"
                />
                <button
                  onClick={() => inputLogoRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Upload size={14} />
                  {form.clinica_logo ? 'Trocar logo' : 'Escolher imagem'}
                </button>
                <p className="text-xs text-slate-400 mt-1.5">PNG, JPG ou SVG. Recomendado: fundo transparente.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={salvar}
            disabled={salvando}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            <Save size={14} />
            {salvando ? 'Salvando...' : 'Salvar dados'}
          </button>
          {ok && (
            <div className="flex items-center gap-1.5 text-emerald-600 text-sm">
              <CheckCircle2 size={15} />
              Salvo com sucesso!
            </div>
          )}
        </div>
      </Secao>
    </div>
  )
}

// ── Tab: Módulos ──────────────────────────────────────────

const MODULOS = [
  { key: 'mod_pets',          label: 'Pets',          icon: PawPrint,     grupo: 'Principal' },
  { key: 'mod_agendamentos',  label: 'Agendamentos',  icon: CalendarDays, grupo: 'Principal' },
  { key: 'mod_vacinas',       label: 'Vacinas',       icon: Syringe,      grupo: 'Principal' },
  { key: 'mod_financeiro',    label: 'Financeiro',    icon: Wallet,       grupo: 'Principal' },
  { key: 'mod_estoque',       label: 'Estoque',       icon: Package,      grupo: 'Principal' },
  { key: 'mod_vendas',        label: 'Vendas',        icon: ShoppingCart, grupo: 'Principal' },
  { key: 'mod_consultas',     label: 'Consultas',     icon: Stethoscope,  grupo: 'Clínica' },
  { key: 'mod_internacoes',   label: 'Internações',   icon: BedDouble,    grupo: 'Clínica' },
  { key: 'mod_cirurgias',     label: 'Cirurgias',     icon: Scissors,     grupo: 'Clínica' },
  { key: 'mod_prescricoes',   label: 'Prescrições',   icon: ClipboardList,grupo: 'Clínica' },
  { key: 'mod_veterinarios',  label: 'Veterinários',  icon: UserRound,    grupo: 'Clínica' },
]

function TabModulos({ onSalvo }) {
  const [estado, setEstado] = useState({})
  const [salvando, setSalvando] = useState(false)
  const [ok, setOk] = useState(false)

  useEffect(() => {
    window.api.configuracoes.getAll().then(all => {
      const init = {}
      for (const m of MODULOS) init[m.key] = all[m.key] !== '0'
      setEstado(init)
    })
  }, [])

  async function salvar() {
    setSalvando(true)
    try {
      for (const [chave, visivel] of Object.entries(estado)) {
        await window.api.configuracoes.set(chave, visivel ? '1' : '0')
      }
      setOk(true)
      setTimeout(() => setOk(false), 3000)
      onSalvo()
    } finally {
      setSalvando(false)
    }
  }

  const CLINICA_KEYS = MODULOS.filter(m => m.grupo === 'Clínica').map(m => m.key)
  const todasClinicaAtivas = CLINICA_KEYS.every(k => estado[k] !== false)

  function toggleClinica(ativar) {
    setEstado(e => {
      const novo = { ...e }
      for (const k of CLINICA_KEYS) novo[k] = ativar
      return novo
    })
  }

  return (
    <div className="space-y-4">
      {/* Principal */}
      <Secao titulo="Módulos — Principal">
        <div className="space-y-1">
          {MODULOS.filter(m => m.grupo === 'Principal').map(m => {
            const Icon = m.icon
            return (
              <div key={m.key} className="flex items-center justify-between py-2.5 px-1">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                    <Icon size={15} className="text-slate-500" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{m.label}</span>
                </div>
                <Toggle
                  ativo={estado[m.key] !== false}
                  onChange={v => setEstado(e => ({ ...e, [m.key]: v }))}
                />
              </div>
            )
          })}
        </div>
      </Secao>

      {/* Clínica — com toggle mestre */}
      <Secao titulo="Módulos — Clínica">
        {/* Toggle mestre */}
        <div className="flex items-center justify-between py-2.5 px-1 mb-2 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
              <span className="text-white text-[10px] font-black">Cl</span>
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800">Seção Clínica completa</span>
              <p className="text-[11px] text-slate-400">Ativa ou desativa todos os módulos de clínica</p>
            </div>
          </div>
          <Toggle ativo={todasClinicaAtivas} onChange={toggleClinica} />
        </div>

        <div className="space-y-1">
          {MODULOS.filter(m => m.grupo === 'Clínica').map(m => {
            const Icon = m.icon
            return (
              <div key={m.key} className="flex items-center justify-between py-2.5 px-1 pl-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                    <Icon size={15} className="text-slate-500" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{m.label}</span>
                </div>
                <Toggle
                  ativo={estado[m.key] !== false}
                  onChange={v => setEstado(e => ({ ...e, [m.key]: v }))}
                />
              </div>
            )
          })}
        </div>
      </Secao>

      <div className="flex items-center gap-3">
        <button
          onClick={salvar}
          disabled={salvando}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          <Save size={14} />
          {salvando ? 'Aplicando...' : 'Aplicar mudanças'}
        </button>
        {ok && (
          <div className="flex items-center gap-1.5 text-emerald-600 text-sm">
            <CheckCircle2 size={15} />
            Sidebar atualizada!
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tab: Sistema ──────────────────────────────────────────

function fmtBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function StatLinha({ icon: Icon, label, value, cor = 'bg-slate-50 text-slate-400' }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cor}`}>
        <Icon size={13} />
      </div>
      <span className="flex-1 text-sm text-slate-600">{label}</span>
      <span className="text-sm font-bold text-slate-800 tabular-nums">{value}</span>
    </div>
  )
}

function fmtDataHora(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function TabSistema() {
  const [stats, setStats]           = useState(null)
  const [ultimo, setUltimo]         = useState(null)
  const [dirAtual, setDirAtual]     = useState('')
  const [backups, setBackups]       = useState([])
  const [fazendo, setFazendo]       = useState(false)
  const [restaurando, setRestaurando] = useState(false)
  const [msg, setMsg]               = useState(null) // { tipo: 'ok'|'erro', texto }

  function mostrarMsg(tipo, texto) {
    setMsg({ tipo, texto })
    setTimeout(() => setMsg(null), 4000)
  }

  async function carregar() {
    const [s, u, dir, lista] = await Promise.all([
      window.api.configuracoes.stats(),
      window.api.backup.ultimoInfo(),
      window.api.backup.getDirAtual(),
      window.api.backup.listar(),
    ])
    setStats(s)
    setUltimo(u)
    setDirAtual(dir)
    setBackups(lista.slice(0, 8)) // mostra últimos 8
  }

  useEffect(() => { carregar() }, [])

  async function fazerAgora() {
    setFazendo(true)
    try {
      const res = await window.api.backup.fazerAgora()
      if (res.ok) { mostrarMsg('ok', `Backup salvo com sucesso! (${fmtBytes(res.tamanho)})`); await carregar() }
      else mostrarMsg('erro', res.erro || 'Erro ao fazer backup')
    } finally { setFazendo(false) }
  }

  async function escolherPasta() {
    const res = await window.api.backup.escolherPasta()
    if (!res.canceled) { setDirAtual(res.pasta); mostrarMsg('ok', 'Pasta de backup atualizada!') }
  }

  async function restaurar() {
    const confirmar = window.confirm(
      'O sistema vai restaurar o backup selecionado e REINICIAR automaticamente.\n\nTodos os dados atuais serão substituídos pelos do backup.\n\nDeseja continuar?'
    )
    if (!confirmar) return
    setRestaurando(true)
    try {
      const res = await window.api.backup.restaurar()
      if (res?.canceled) { setRestaurando(false); return }
      if (!res?.ok) { mostrarMsg('erro', res?.erro || 'Erro ao restaurar'); setRestaurando(false) }
      // Se ok, o app reinicia automaticamente — não precisa fazer nada
    } catch { setRestaurando(false) }
  }

  if (!stats) return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}
    </div>
  )

  return (
    <div className="space-y-4">

      {/* Mensagem de feedback */}
      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
          msg.tipo === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {msg.tipo === 'ok' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          {msg.texto}
        </div>
      )}

      {/* Backup */}
      <Secao titulo="Backup do banco de dados">

        {/* Último backup */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-4">
          <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Archive size={16} className="text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-700">Último backup</p>
            {ultimo ? (
              <p className="text-xs text-slate-500 mt-0.5">
                {fmtDataHora(ultimo.data)} · {fmtBytes(ultimo.tamanho)}
              </p>
            ) : (
              <p className="text-xs text-slate-400 mt-0.5">Nenhum backup encontrado</p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] text-slate-400">Pasta atual</p>
            <p className="text-[10px] text-slate-500 font-mono max-w-[160px] truncate" title={dirAtual}>
              {dirAtual || '—'}
            </p>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={fazerAgora}
            disabled={fazendo}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {fazendo ? <Loader2 size={14} className="animate-spin" /> : <Archive size={14} />}
            {fazendo ? 'Fazendo backup...' : 'Fazer backup agora'}
          </button>
          <button
            onClick={escolherPasta}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <FolderOpen size={14} />
            Escolher pasta
          </button>
          <button
            onClick={restaurar}
            disabled={restaurando}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-sm font-medium hover:bg-amber-100 disabled:opacity-50 transition-colors"
          >
            {restaurando ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {restaurando ? 'Restaurando...' : 'Restaurar backup'}
          </button>
        </div>

        {/* Lista de backups recentes */}
        {backups.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Últimos backups ({backups.length})
            </p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {backups.map((b, i) => (
                <div key={b.caminho} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i === 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <Clock size={11} className="text-slate-300 flex-shrink-0" />
                  <span className="text-xs text-slate-500 flex-1 truncate font-mono">{b.nome}</span>
                  <span className="text-xs text-slate-400 flex-shrink-0">{fmtBytes(b.tamanho)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-[11px] text-slate-400 mt-3">
          Backup automático feito uma vez por dia ao abrir o sistema · Mantém os 30 mais recentes
        </p>
      </Secao>

      {/* Stats do banco */}
      <Secao titulo="Registros no banco de dados">
        <StatLinha icon={Users}        label="Tutores (donos)"    value={stats.donos}        cor="bg-blue-50 text-blue-500" />
        <StatLinha icon={PawPrint}     label="Pets"               value={stats.pets}         cor="bg-amber-50 text-amber-500" />
        <StatLinha icon={CalendarDays} label="Agendamentos"       value={stats.agendamentos} cor="bg-emerald-50 text-emerald-500" />
        <StatLinha icon={Syringe}      label="Vacinas"            value={stats.vacinas}      cor="bg-red-50 text-red-500" />
        <StatLinha icon={Stethoscope}  label="Consultas"          value={stats.consultas}    cor="bg-sky-50 text-sky-500" />
        <StatLinha icon={BedDouble}    label="Internações"        value={stats.internacoes}  cor="bg-yellow-50 text-yellow-600" />
        <StatLinha icon={Scissors}     label="Cirurgias"          value={stats.cirurgias}    cor="bg-violet-50 text-violet-500" />
        <StatLinha icon={ClipboardList}label="Prescrições"        value={stats.prescricoes}  cor="bg-teal-50 text-teal-500" />
        <StatLinha icon={Package}      label="Produtos (estoque)" value={stats.estoque}      cor="bg-orange-50 text-orange-500" />
        <StatLinha icon={Wallet}       label="Lançamentos financ."value={stats.financeiro}   cor="bg-green-50 text-green-500" />
        <div className="mt-3 pt-3 border-t border-slate-50">
          <StatLinha icon={HardDrive} label="Tamanho do banco" value={fmtBytes(stats.dbSize)} cor="bg-slate-100 text-slate-500" />
          <div className="mt-2 p-3 bg-slate-50 rounded-xl">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Arquivo do banco</p>
            <p className="text-xs text-slate-600 break-all font-mono">{stats.dbPath || '—'}</p>
          </div>
        </div>
      </Secao>

      {/* Versão */}
      <Secao titulo="Versão do sistema">
        <div className="space-y-1.5 text-sm text-slate-600">
          <div className="flex justify-between"><span>Sistema</span><span className="font-bold text-slate-800">4u TechPet</span></div>
          <div className="flex justify-between"><span>Versão</span><span className="font-bold text-slate-800">{window.api?.versoes?.app || '—'}</span></div>
          <div className="flex justify-between"><span>Plataforma</span><span className="font-bold text-slate-800">Electron + React + SQLite</span></div>
          <div className="flex justify-between"><span>Node</span><span className="font-bold text-slate-800">{window.api?.versoes?.node || '—'}</span></div>
          <div className="flex justify-between"><span>Electron</span><span className="font-bold text-slate-800">{window.api?.versoes?.electron || '—'}</span></div>
        </div>
      </Secao>

    </div>
  )
}

// ── Tab: Desenvolvedor ────────────────────────────────────

function ModalConfirmReset({ onConfirmar, onCancelar }) {
  const [digitado, setDigitado] = useState('')
  const CONFIRMACAO = 'RESETAR'

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
          <AlertTriangle size={22} className="text-red-600" />
        </div>
        <h3 className="text-base font-bold text-slate-800 text-center mb-2">Resetar banco de dados?</h3>
        <p className="text-sm text-slate-500 text-center leading-relaxed mb-4">
          Todos os dados serão apagados permanentemente: pets, tutores, agendamentos, consultas, financeiro e tudo mais.<br />
          <strong className="text-red-600">Essa ação não pode ser desfeita.</strong>
        </p>
        <p className="text-xs text-slate-500 mb-2 text-center">
          Digite <strong className="text-slate-800">{CONFIRMACAO}</strong> para confirmar:
        </p>
        <input
          type="text"
          value={digitado}
          onChange={e => setDigitado(e.target.value.toUpperCase())}
          placeholder={CONFIRMACAO}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-center font-mono mb-4 focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400"
        />
        <div className="flex gap-3">
          <button onClick={onCancelar} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={digitado !== CONFIRMACAO}
            className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Apagar tudo
          </button>
        </div>
      </div>
    </div>
  )
}

function TabDesenvolvedor({ onSair }) {
  const [modal, setModal] = useState(false)
  const [resetado, setResetado] = useState(false)

  async function confirmarReset() {
    await window.api.configuracoes.resetar()
    setModal(false)
    setResetado(true)
  }

  return (
    <div className="space-y-4">
      {/* 4u Technology */}
      <Secao titulo="Desenvolvido por">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg font-black tracking-tight">4u</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">4u Technology</p>
            <p className="text-xs text-slate-400 mt-0.5">Soluções em software para negócios</p>
            <p className="text-xs text-slate-400">Sistemas modernos, rápidos e confiáveis</p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-slate-50 rounded-xl text-xs text-slate-500 leading-relaxed">
          Este sistema foi desenvolvido exclusivamente com tecnologias modernas:<br />
          <strong className="text-slate-700">Electron</strong> · interface nativa Windows<br />
          <strong className="text-slate-700">React</strong> · interface dinâmica e responsiva<br />
          <strong className="text-slate-700">SQLite</strong> · banco de dados local, sem internet<br />
          <strong className="text-slate-700">Tailwind CSS</strong> · design consistente e profissional
        </div>
      </Secao>

      {/* Zona de perigo */}
      <div className="bg-red-50 rounded-2xl border border-red-100 p-5">
        <h3 className="text-sm font-bold text-red-700 mb-1 flex items-center gap-2">
          <AlertTriangle size={15} />
          Zona de perigo
        </h3>
        <p className="text-xs text-red-500 mb-4">Ações irreversíveis — use com extremo cuidado.</p>

        {resetado ? (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
            <CheckCircle2 size={16} />
            Banco resetado com sucesso. Todos os dados foram apagados.
          </div>
        ) : (
          <button
            onClick={() => setModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
          >
            <RefreshCw size={14} />
            Resetar banco de dados (fábrica)
          </button>
        )}
      </div>

      {/* Sair do admin */}
      <button
        onClick={onSair}
        className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
      >
        <X size={14} />
        Sair da área admin
      </button>

      {modal && (
        <ModalConfirmReset onConfirmar={confirmarReset} onCancelar={() => setModal(false)} />
      )}
    </div>
  )
}

// ── CONFIGURAÇÕES (página principal) ─────────────────────

const TABS = [
  { key: 'clinica',       label: 'Clínica',       icon: Building2  },
  { key: 'modulos',       label: 'Módulos',        icon: Layers     },
  { key: 'sistema',       label: 'Sistema',        icon: Database   },
  { key: 'desenvolvedor', label: 'Desenvolvedor',  icon: Code2      },
]

function Configuracoes() {
  const { recarregar } = useConfig()
  const [autenticado, setAutenticado] = useState(false)
  const [tab, setTab] = useState('clinica')

  if (!autenticado) {
    return <TelaLogin onEntrar={() => setAutenticado(true)} />
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Configurações</h2>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <Info size={11} />
            Área administrativa — acesso restrito
          </p>
        </div>
        <div className="w-8 h-8 bg-slate-800 rounded-xl flex items-center justify-center">
          <span className="text-white text-xs font-black">4u</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map(t => (
          <Tab key={t.key} label={t.label} icon={t.icon} ativo={tab === t.key} onClick={() => setTab(t.key)} />
        ))}
      </div>

      {/* Conteúdo */}
      {tab === 'clinica'       && <TabClinica       onSalvo={recarregar} />}
      {tab === 'modulos'       && <TabModulos        onSalvo={recarregar} />}
      {tab === 'sistema'       && <TabSistema />}
      {tab === 'desenvolvedor' && <TabDesenvolvedor  onSair={() => setAutenticado(false)} />}
    </div>
  )
}

export default Configuracoes
