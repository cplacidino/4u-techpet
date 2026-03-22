// ============================================================
// UPDATER — Sistema de atualização automática
// ============================================================
// Usa o electron-updater para checar atualizações no GitHub.
// Só funciona no app instalado (produção), nunca em dev.
//
// Fluxo:
//   1. App inicia → checkForUpdates() é chamado após 3 segundos
//   2. Se encontrar nova versão → envia evento 'update:disponivel' para o React
//   3. React mostra notificação de atualização disponível
//   4. Usuário clica "Baixar" → downloadUpdate()
//   5. React mostra barra de progresso via evento 'update:progresso'
//   6. Download concluído → evento 'update:baixado'
//   7. Usuário clica "Instalar e reiniciar" → installAndRestart()
// ============================================================

const { autoUpdater } = require('electron-updater')
const { ipcMain }     = require('electron')
const path            = require('path')

let _mainWindow = null

function init(mainWindow) {
  _mainWindow = mainWindow

  // Em desenvolvimento, não faz nada (evita erros)
  if (process.env.NODE_ENV === 'development') {
    console.log('[Updater] Modo dev — atualizações desativadas.')
    return
  }

  // Não baixa automaticamente — só notifica
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false

  // ── Eventos do updater ────────────────────────────────────

  // Checando atualizações...
  autoUpdater.on('checking-for-update', () => {
    console.log('[Updater] Verificando atualizações...')
  })

  // Nova versão disponível
  autoUpdater.on('update-available', (info) => {
    console.log(`[Updater] Nova versão disponível: ${info.version}`)
    enviarParaReact('update:disponivel', {
      versao: info.version,
      notas: info.releaseNotes ?? '',
    })
  })

  // Sem atualizações
  autoUpdater.on('update-not-available', () => {
    console.log('[Updater] App já está na versão mais recente.')
    enviarParaReact('update:naodisponivel', {})
  })

  // Progresso do download
  autoUpdater.on('download-progress', (progresso) => {
    enviarParaReact('update:progresso', {
      porcentagem: Math.round(progresso.percent),
      velocidade:  Math.round(progresso.bytesPerSecond / 1024), // KB/s
      transferido: Math.round(progresso.transferred / 1024 / 1024 * 10) / 10, // MB
      total:       Math.round(progresso.total / 1024 / 1024 * 10) / 10, // MB
    })
  })

  // Download concluído
  autoUpdater.on('update-downloaded', (info) => {
    console.log(`[Updater] Download concluído: ${info.version}`)
    enviarParaReact('update:baixado', { versao: info.version })
  })

  // Erro
  autoUpdater.on('error', (err) => {
    console.error('[Updater] Erro:', err.message)
    enviarParaReact('update:erro', { mensagem: err.message })
  })

  // Verifica após 3 segundos do app abrir
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('[Updater] Falha ao checar:', err.message)
    })
  }, 3000)
}

// ── Handlers IPC (chamados pelo React via preload) ─────────

function registrarHandlers() {
  // Checar manualmente por atualização
  ipcMain.handle('update:checar', async () => {
    if (process.env.NODE_ENV === 'development') {
      return { dev: true }
    }
    try {
      const result = await autoUpdater.checkForUpdates()
      return { ok: true, versao: result?.updateInfo?.version }
    } catch (err) {
      return { ok: false, erro: err.message }
    }
  })

  // Iniciar download
  ipcMain.handle('update:baixar', () => {
    if (process.env.NODE_ENV === 'development') return
    autoUpdater.downloadUpdate()
  })

  // Instalar e reiniciar agora
  ipcMain.handle('update:instalar', () => {
    if (process.env.NODE_ENV === 'development') return
    autoUpdater.quitAndInstall(false, true)
  })
}

// ── Helpers ───────────────────────────────────────────────

function enviarParaReact(canal, dados) {
  if (_mainWindow && !_mainWindow.isDestroyed()) {
    _mainWindow.webContents.send(canal, dados)
  }
}

module.exports = { init, registrarHandlers }
