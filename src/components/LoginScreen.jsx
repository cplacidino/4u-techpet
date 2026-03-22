import { useState } from 'react'

export default function LoginScreen({ onLogin }) {
  const [email, setEmail]       = useState('')
  const [senha, setSenha]       = useState('')
  const [erro, setErro]         = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    if (!email || !senha) return setErro('Preencha email e senha.')
    setErro('')
    setCarregando(true)
    try {
      const res = await window.api.auth.login(email, senha)
      if (res.ok) {
        onLogin(res.nome)
      } else {
        setErro(res.erro || 'Erro ao fazer login.')
      }
    } catch {
      setErro('Erro inesperado. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900">
      <div className="flex flex-col items-center gap-6 w-full max-w-sm px-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/30">
            <span className="text-4xl">🐾</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">4u TechPet</h1>
            <p className="text-emerald-400 text-xs mt-1">by 4u Technology</p>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleLogin} className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-white font-semibold text-center text-sm">Acesse sua licença</h2>

          <div className="flex flex-col gap-1">
            <label className="text-slate-400 text-xs">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-slate-400 text-xs">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="••••••••"
              className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          {erro && (
            <p className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 font-bold py-2.5 rounded-lg text-sm transition-colors"
          >
            {carregando ? 'Verificando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-slate-600 text-xs text-center">
          Problemas de acesso? Entre em contato com o suporte.
        </p>
      </div>
    </div>
  )
}
