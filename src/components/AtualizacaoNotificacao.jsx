// ============================================================
// AtualizacaoNotificacao — Notificação de atualização disponível
// ============================================================
// Aparece no canto inferior direito quando há uma nova versão.
// Fluxo: disponivel → baixando (barra de progresso) → pronto → instalar
// ============================================================

import { useEffect, useState } from 'react'
import { Download, RefreshCw, X, CheckCircle, AlertCircle } from 'lucide-react'

const ESTADO = {
  IDLE:      'idle',
  DISPONIVEL:'disponivel',
  BAIXANDO:  'baixando',
  BAIXADO:   'baixado',
  ERRO:      'erro',
}

export default function AtualizacaoNotificacao() {
  const [estado,      setEstado]      = useState(ESTADO.IDLE)
  const [versao,      setVersao]      = useState('')
  const [porcentagem, setPorcentagem] = useState(0)
  const [velocidade,  setVelocidade]  = useState(0)
  const [fechado,     setFechado]     = useState(false)
  const [erroMsg,     setErroMsg]     = useState('')

  useEffect(() => {
    // Só existe em produção (window.api.update existe sempre, mas
    // o processo principal não dispara eventos em dev)
    if (!window.api?.update) return

    window.api.update.onDisponivel((dados) => {
      setVersao(dados.versao)
      setEstado(ESTADO.DISPONIVEL)
      setFechado(false)
    })

    window.api.update.onProgresso((dados) => {
      setEstado(ESTADO.BAIXANDO)
      setPorcentagem(dados.porcentagem)
      setVelocidade(dados.velocidade)
    })

    window.api.update.onBaixado((dados) => {
      setVersao(dados.versao)
      setEstado(ESTADO.BAIXADO)
    })

    window.api.update.onErro((dados) => {
      setErroMsg(dados.mensagem)
      setEstado(ESTADO.ERRO)
    })

    return () => {
      window.api.update.removerListeners()
    }
  }, [])

  // Não mostra nada se não há atualização ou usuário fechou
  if (estado === ESTADO.IDLE || fechado) return null

  function baixar() {
    setEstado(ESTADO.BAIXANDO)
    setPorcentagem(0)
    window.api.update.baixar()
  }

  function instalar() {
    window.api.update.instalar()
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-xl shadow-2xl border border-slate-200 bg-white overflow-hidden">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <RefreshCw size={15} />
          Atualização disponível
        </div>
        {estado !== ESTADO.BAIXANDO && (
          <button
            onClick={() => setFechado(true)}
            className="text-indigo-200 hover:text-white transition-colors"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Corpo */}
      <div className="px-4 py-3 space-y-3">

        {/* Versão disponível */}
        {estado === ESTADO.DISPONIVEL && (
          <>
            <p className="text-sm text-slate-600">
              A versão <span className="font-bold text-slate-800">{versao}</span> está
              disponível. Deseja baixar agora?
            </p>
            <div className="flex gap-2">
              <button
                onClick={baixar}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
              >
                <Download size={14} />
                Baixar agora
              </button>
              <button
                onClick={() => setFechado(true)}
                className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Depois
              </button>
            </div>
          </>
        )}

        {/* Baixando — barra de progresso */}
        {estado === ESTADO.BAIXANDO && (
          <>
            <p className="text-sm text-slate-600">
              Baixando versão <span className="font-bold text-slate-800">{versao}</span>…
            </p>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${porcentagem}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>{porcentagem}%</span>
              <span>{velocidade} KB/s</span>
            </div>
          </>
        )}

        {/* Download concluído */}
        {estado === ESTADO.BAIXADO && (
          <>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle size={16} />
              <p className="text-sm font-medium">
                Versão {versao} pronta para instalar!
              </p>
            </div>
            <p className="text-xs text-slate-500">
              O app vai reiniciar automaticamente para aplicar a atualização.
            </p>
            <div className="flex gap-2">
              <button
                onClick={instalar}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
              >
                <RefreshCw size={14} />
                Instalar e reiniciar
              </button>
              <button
                onClick={() => setFechado(true)}
                className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Depois
              </button>
            </div>
          </>
        )}

        {/* Erro */}
        {estado === ESTADO.ERRO && (
          <div className="flex items-start gap-2 text-red-600">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Falha na atualização</p>
              <p className="text-xs text-slate-500 mt-0.5 break-all">{erroMsg}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
