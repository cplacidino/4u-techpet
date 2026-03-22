// ============================================================
// PROCESSO PRINCIPAL DO ELECTRON (Main Process)
// ============================================================

const { app, BrowserWindow } = require('electron')
const path = require('path')
const db      = require('./database')
const backup  = require('./backup')
const updater = require('./updater')
const { registrarHandlers } = require('./ipc')

const isDev = process.env.NODE_ENV === 'development'

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: '4u TechPet — 4u Technology',
    show: false,
    backgroundColor: '#f8fafc',
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  win.once('ready-to-show', () => {
    win.show()
  })

  return win
}

app.whenReady().then(() => {
  // 1. Conecta ao banco de dados
  db.connect(app)

  // 2. Inicializa e executa backup diário (1x por dia, silencioso)
  backup.init(app, db.getDbPath())
  try {
    const pastaCustom = db.configuracoes.get('backup_pasta_custom')
    backup.backupDiario(pastaCustom)
  } catch (_) { /* não bloqueia o app se falhar */ }

  // 3. Registra todos os handlers IPC (rotas React ↔ banco)
  registrarHandlers()
  updater.registrarHandlers()

  // 4. Cria a janela e inicializa o updater com ela
  const win = createWindow()
  updater.init(win)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
