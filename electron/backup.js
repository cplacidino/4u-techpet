// ============================================================
// BACKUP — electron/backup.js
// ============================================================
// Gerencia backups automáticos e manuais do banco SQLite.
//
// Fluxo:
//   main.js chama backup.init(app, dbPath) após conectar o banco
//   backup.backupDiario() roda 1x por dia ao abrir o sistema
//   ipc.js expõe os handlers para o React
// ============================================================

const fs   = require('fs')
const path = require('path')

let _app    = null
let _dbPath = ''

// ── Inicialização ──────────────────────────────────────────

function init(app, dbPath) {
  _app    = app
  _dbPath = dbPath
}

// ── Diretório de backup ────────────────────────────────────

function getDirPadrao() {
  const isDev = process.env.NODE_ENV === 'development'
  // Dev: pasta /backups na raiz do projeto
  // Prod: AppData\Roaming\4u-techpet\backups
  return isDev
    ? path.join(__dirname, '../backups')
    : path.join(_app.getPath('userData'), 'backups')
}

function getDirAtivo(pastaCustom) {
  if (pastaCustom && fs.existsSync(pastaCustom)) return pastaCustom
  return getDirPadrao()
}

function garantirDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

// ── Nome do arquivo de backup ──────────────────────────────

function gerarNome() {
  const now = new Date()
  const pad  = n => String(n).padStart(2, '0')
  const ts   = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
            + `_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
  return `backup_${ts}.db`
}

// ── Listar backups ─────────────────────────────────────────

function listar(pastaCustom) {
  const dir = getDirAtivo(pastaCustom)
  garantirDir(dir)
  try {
    return fs.readdirSync(dir)
      .filter(f => /^backup_.*\.db$/.test(f))
      .map(f => {
        const full = path.join(dir, f)
        const stat = fs.statSync(full)
        return {
          nome:     f,
          caminho:  full,
          tamanho:  stat.size,
          data:     stat.mtime.toISOString(),
        }
      })
      .sort((a, b) => b.data.localeCompare(a.data))
  } catch { return [] }
}

// ── Limpar backups antigos (mantém últimos 30) ─────────────

function manterUltimos30(pastaCustom) {
  const todos = listar(pastaCustom)
  todos.slice(30).forEach(b => {
    try { fs.unlinkSync(b.caminho) } catch {}
  })
}

// ── Fazer backup ───────────────────────────────────────────

function fazerBackup(pastaCustom) {
  if (!_dbPath || !fs.existsSync(_dbPath)) {
    return { ok: false, erro: 'Banco de dados não encontrado' }
  }
  try {
    const dir     = getDirAtivo(pastaCustom)
    garantirDir(dir)
    const destino = path.join(dir, gerarNome())
    fs.copyFileSync(_dbPath, destino)
    manterUltimos30(pastaCustom)
    const stat = fs.statSync(destino)
    return { ok: true, caminho: destino, tamanho: stat.size, data: new Date().toISOString() }
  } catch (err) {
    return { ok: false, erro: err.message }
  }
}

// ── Backup diário (1x por dia) ─────────────────────────────

function backupDiario(pastaCustom) {
  const hoje   = new Date().toISOString().slice(0, 10) // '2026-03-19'
  const todos  = listar(pastaCustom)
  const jaFeito = todos.some(b => b.nome.startsWith(`backup_${hoje}`))
  if (jaFeito) return { ok: true, jaFeitoHoje: true }
  return fazerBackup(pastaCustom)
}

// ── Informações do último backup ───────────────────────────

function ultimoInfo(pastaCustom) {
  const todos = listar(pastaCustom)
  return todos.length > 0 ? todos[0] : null
}

// ── Restaurar backup ───────────────────────────────────────
// IMPORTANTE: fecha o banco, copia o arquivo, reinicia o app.

function restaurarArquivo(caminhoBackup, fecharDb) {
  if (!caminhoBackup || !fs.existsSync(caminhoBackup)) {
    return { ok: false, erro: 'Arquivo de backup não encontrado' }
  }
  if (!_dbPath) {
    return { ok: false, erro: 'Caminho do banco não definido' }
  }
  try {
    fecharDb()                                  // fecha a conexão SQLite
    fs.copyFileSync(caminhoBackup, _dbPath)     // substitui o banco atual
    setImmediate(() => { _app.relaunch(); _app.exit(0) })  // reinicia o app
    return { ok: true }
  } catch (err) {
    return { ok: false, erro: err.message }
  }
}

module.exports = {
  init,
  fazerBackup,
  backupDiario,
  listar,
  ultimoInfo,
  restaurarArquivo,
  getDirPadrao,
}
