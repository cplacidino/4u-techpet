import { useState, useRef } from 'react'
import { buscarSugestoes } from '../data/dicionarioVeterinario'
import { FlaskConical } from 'lucide-react'

// Regex para detectar a palavra sendo digitada (inclui acentos e números)
const PALAVRA_RE = /[A-Za-zÀ-ÿ0-9]+$/

function getPalavraAtual(valor, pos) {
  const antes = valor.slice(0, pos)
  const match = antes.match(PALAVRA_RE)
  return match ? match[0] : ''
}

function substituirPalavraAtual(valor, pos, novoTermo) {
  const antes = valor.slice(0, pos)
  const depois = valor.slice(pos)
  const novoAntes = antes.replace(PALAVRA_RE, novoTermo)
  return { novoValor: novoAntes + depois, novoCursor: novoAntes.length }
}

// ── CampoClinico ─────────────────────────────────────────────
// Drop-in para <textarea> com autocomplete de semiologia veterinária.
// Usa as mesmas props de um textarea normal (value, onChange, rows, className, placeholder).

export default function CampoClinico({ value = '', onChange, rows = 3, className, placeholder, ...rest }) {
  const [sugestoes, setSugestoes]   = useState([])
  const [indiceSel, setIndiceSel]   = useState(0)
  const [cursorPos, setCursorPos]   = useState(0)
  const ref = useRef(null)

  function handleChange(e) {
    const val = e.target.value
    const pos = e.target.selectionStart
    setCursorPos(pos)
    const palavra = getPalavraAtual(val, pos)
    if (palavra.length >= 2) {
      setSugestoes(buscarSugestoes(palavra))
      setIndiceSel(0)
    } else {
      setSugestoes([])
    }
    onChange(e)
  }

  function aceitar(sugestao) {
    const { novoValor, novoCursor } = substituirPalavraAtual(value, cursorPos, sugestao.termo)
    onChange({ target: { value: novoValor } })
    setSugestoes([])
    setTimeout(() => {
      if (ref.current) {
        ref.current.setSelectionRange(novoCursor, novoCursor)
        ref.current.focus()
      }
    }, 0)
  }

  function handleKeyDown(e) {
    if (sugestoes.length === 0) return
    if (e.key === 'Tab' || (e.key === 'Enter' && sugestoes.length > 0)) {
      e.preventDefault()
      aceitar(sugestoes[indiceSel])
    } else if (e.key === 'Escape') {
      setSugestoes([])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndiceSel(i => Math.min(i + 1, sugestoes.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndiceSel(i => Math.max(i - 1, 0))
    }
  }

  function handleBlur() {
    // Pequeno delay para permitir clique na sugestão
    setTimeout(() => setSugestoes([]), 150)
  }

  function handleSelect(e) {
    setCursorPos(e.target.selectionStart)
  }

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onSelect={handleSelect}
        rows={rows}
        className={className}
        placeholder={placeholder}
        {...rest}
      />

      {sugestoes.length > 0 && (
        <div className="absolute z-50 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
          style={{ top: '100%', marginTop: '4px' }}
        >
          {/* Cabeçalho */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border-b border-slate-100">
            <FlaskConical size={11} className="text-emerald-500" />
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Semiologia · Tab para aceitar · ↑↓ navegar · Esc fechar
            </span>
          </div>

          {/* Sugestões */}
          {sugestoes.map((s, i) => (
            <button
              key={`${s.sigla}-${s.termo}`}
              onMouseDown={e => { e.preventDefault(); aceitar(s) }}
              className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors ${
                i === indiceSel
                  ? 'bg-emerald-50'
                  : 'hover:bg-slate-50'
              }`}
            >
              {s.sigla ? (
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-mono flex-shrink-0 min-w-[32px] text-center">
                  {s.sigla}
                </span>
              ) : (
                <span className="min-w-[32px]" />
              )}
              <span className={`text-sm ${i === indiceSel ? 'text-emerald-800 font-medium' : 'text-slate-700'}`}>
                {s.termo}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
