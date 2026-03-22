import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, PawPrint, CalendarDays,
  Syringe, Wallet, Settings, Package,
  ChevronLeft, ChevronRight, Circle,
  Stethoscope, BedDouble, Scissors, ClipboardList, UserRound, ShoppingCart
} from 'lucide-react'
import { useConfig } from '../contexts/ConfigContext'

const TODOS_NAV = [
  { label: 'Dashboard',    icon: LayoutDashboard, path: '/',             modKey: null },
  { label: 'Vendas',       icon: ShoppingCart,    path: '/vendas',       modKey: 'mod_vendas' },
  { label: 'Pets',         icon: PawPrint,        path: '/pets',         modKey: 'mod_pets' },
  { label: 'Agendamentos', icon: CalendarDays,    path: '/agendamentos', modKey: 'mod_agendamentos' },
  { label: 'Vacinas',      icon: Syringe,         path: '/vacinas',      modKey: 'mod_vacinas' },
  { label: 'Financeiro',   icon: Wallet,          path: '/financeiro',   modKey: 'mod_financeiro' },
  { label: 'Estoque',      icon: Package,         path: '/estoque',      modKey: 'mod_estoque' },
]

const TODOS_CLINICA = [
  { label: 'Consultas',    icon: Stethoscope,   path: '/consultas',    modKey: 'mod_consultas' },
  { label: 'Internações',  icon: BedDouble,     path: '/internacoes',  modKey: 'mod_internacoes' },
  { label: 'Cirurgias',    icon: Scissors,      path: '/cirurgias',    modKey: 'mod_cirurgias' },
  { label: 'Prescrições',  icon: ClipboardList, path: '/prescricoes',  modKey: 'mod_prescricoes' },
  { label: 'Veterinários', icon: UserRound,     path: '/veterinarios', modKey: 'mod_veterinarios' },
]

function isVisivel(item, config) {
  if (!item.modKey) return true  // Dashboard é sempre visível
  return config[item.modKey] !== '0'
}

function NavItem({ label, icon: Icon, path, collapsed }) {
  return (
    <NavLink
      to={path}
      end={path === '/'}
      title={collapsed ? label : undefined}
      className={({ isActive }) => [
        'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl',
        'transition-all duration-150 select-none',
        collapsed ? 'justify-center' : '',
        isActive
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-200',
      ].join(' ')}
    >
      {({ isActive }) => (
        <>
          <Icon
            size={18}
            strokeWidth={isActive ? 2.5 : 1.75}
            className="flex-shrink-0 transition-transform group-hover:scale-110"
          />
          {!collapsed && (
            <span className="text-sm font-medium truncate">{label}</span>
          )}
          {isActive && !collapsed && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
          )}
          {collapsed && (
            <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-lg opacity-0 pointer-events-none whitespace-nowrap z-50 group-hover:opacity-100 transition-opacity shadow-lg">
              {label}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

function Sidebar({ collapsed, onToggle }) {
  const { config } = useConfig()
  const navItems     = TODOS_NAV.filter(i => isVisivel(i, config))
  const clinicaItems = TODOS_CLINICA.filter(i => isVisivel(i, config))

  return (
    <aside className={[
      'relative flex flex-col bg-white border-r border-slate-100',
      'dark:bg-slate-900 dark:border-slate-700/50',
      'transition-all duration-300 ease-in-out flex-shrink-0',
      collapsed ? 'w-[68px]' : 'w-56',
    ].join(' ')}>

      {/* Logo */}
      <div className={[
        'flex items-center h-16 px-4 border-b border-slate-100 dark:border-slate-700/50 flex-shrink-0',
        collapsed ? 'justify-center' : 'gap-3',
      ].join(' ')}>
        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-white text-xs font-bold tracking-tight">4u</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">4u TechPet</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">4u Technology</p>
          </div>
        )}
      </div>

      <nav className={['flex-1 py-2 overflow-y-auto', collapsed ? 'px-2' : 'px-3'].join(' ')}>
        {/* Menu principal */}
        {!collapsed && (
          <p className="px-3 pt-1 pb-1 text-[10px] font-semibold text-slate-300 dark:text-slate-600 uppercase tracking-widest">
            Menu
          </p>
        )}
        <div className="space-y-0.5 mb-2">
          {navItems.map(({ modKey: _, ...item }) => (
            <NavItem key={item.path} {...item} collapsed={collapsed} />
          ))}
        </div>

        {/* Divisor Clínica */}
        {!collapsed ? (
          <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-slate-300 dark:text-slate-600 uppercase tracking-widest border-t border-slate-100 dark:border-slate-700/50 mt-1">
            Clínica
          </p>
        ) : (
          <div className="border-t border-slate-100 dark:border-slate-700/50 my-2" />
        )}
        <div className="space-y-0.5">
          {clinicaItems.map(({ modKey: _, ...item }) => (
            <NavItem key={item.path} {...item} collapsed={collapsed} />
          ))}
        </div>
      </nav>

      {/* Rodapé */}
      <div className={['pb-3 pt-2 border-t border-slate-100 dark:border-slate-700/50', collapsed ? 'px-2' : 'px-3'].join(' ')}>
        <NavLink
          to="/configuracoes"
          title={collapsed ? 'Configurações' : undefined}
          className={({ isActive }) => [
            'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl',
            'transition-all duration-150 select-none',
            collapsed ? 'justify-center' : '',
            isActive
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-200',
          ].join(' ')}
        >
          {({ isActive }) => (
            <>
              <Settings size={18} strokeWidth={isActive ? 2.5 : 1.75} className="flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">Configurações</span>}
              {collapsed && (
                <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-lg opacity-0 pointer-events-none whitespace-nowrap z-50 group-hover:opacity-100 transition-opacity shadow-lg">
                  Configurações
                </span>
              )}
            </>
          )}
        </NavLink>

        {!collapsed && (
          <div className="flex items-center gap-2 px-3 py-2 mt-1">
            <Circle size={7} className="fill-emerald-500 text-emerald-500 flex-shrink-0" />
            <span className="text-[11px] text-slate-400 dark:text-slate-500">Banco conectado</span>
          </div>
        )}
      </div>

      {/* Botão recolher */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-[72px] w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-full flex items-center justify-center shadow-sm hover:shadow-md hover:border-slate-300 transition-all text-slate-400 hover:text-slate-600 z-10"
        title={collapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>
    </aside>
  )
}

export default Sidebar
