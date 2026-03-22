// ============================================================
// IPC HANDLERS — electron/ipc.js
// ============================================================
// IPC = Inter-Process Communication
// É o sistema de "mensagens" entre o React e o Electron.
//
// Funciona assim:
//   React chama:  window.api.donos.listar()
//   preload.js envia: ipcRenderer.invoke('donos:listar')
//   ipc.js recebe: ipcMain.handle('donos:listar') → chama o banco
//   Resultado volta para o React automaticamente
// ============================================================

const { ipcMain, dialog, shell } = require('electron')
const path   = require('path')
const fs     = require('fs')
const db     = require('./database')
const backup = require('./backup')

function registrarHandlers() {

  // ────────────────────────────────────────
  // DONOS
  // ────────────────────────────────────────
  ipcMain.handle('donos:criar',         (_, dados)       => db.donos.criar(dados))
  ipcMain.handle('donos:listar',        ()               => db.donos.listar())
  ipcMain.handle('donos:buscarPorId',   (_, id)          => db.donos.buscarPorId(id))
  ipcMain.handle('donos:buscarPorNome', (_, nome)        => db.donos.buscarPorNome(nome))
  ipcMain.handle('donos:buscarComPets', (_, id)          => db.donos.buscarComPets(id))
  ipcMain.handle('donos:editar',        (_, { id, dados }) => db.donos.editar(id, dados))
  ipcMain.handle('donos:deletar',       (_, id)          => db.donos.deletar(id))
  ipcMain.handle('donos:total',         ()               => db.donos.total())

  // ────────────────────────────────────────
  // PETS
  // ────────────────────────────────────────
  ipcMain.handle('pets:criar',         (_, dados)         => db.pets.criar(dados))
  ipcMain.handle('pets:listar',        ()                 => db.pets.listar())
  ipcMain.handle('pets:buscarPorId',   (_, id)            => db.pets.buscarPorId(id))
  ipcMain.handle('pets:buscarPorDono', (_, id_dono)       => db.pets.buscarPorDono(id_dono))
  ipcMain.handle('pets:buscarPorNome', (_, nome)          => db.pets.buscarPorNome(nome))
  ipcMain.handle('pets:editar',        (_, { id, dados }) => db.pets.editar(id, dados))
  ipcMain.handle('pets:deletar',       (_, id)            => db.pets.deletar(id))
  ipcMain.handle('pets:total',         ()                 => db.pets.total())

  // ────────────────────────────────────────
  // AGENDAMENTOS
  // ────────────────────────────────────────
  ipcMain.handle('agendamentos:criar',          (_, dados)          => db.agendamentos.criar(dados))
  ipcMain.handle('agendamentos:listar',         ()                  => db.agendamentos.listar())
  ipcMain.handle('agendamentos:buscarPorId',    (_, id)             => db.agendamentos.buscarPorId(id))
  ipcMain.handle('agendamentos:buscarPorData',  (_, data)           => db.agendamentos.buscarPorData(data))
  ipcMain.handle('agendamentos:buscarPorStatus',(_, status)         => db.agendamentos.buscarPorStatus(status))
  ipcMain.handle('agendamentos:proximos',       ()                  => db.agendamentos.proximos())
  ipcMain.handle('agendamentos:atualizarStatus',(_, { id, status }) => db.agendamentos.atualizarStatus(id, status))
  ipcMain.handle('agendamentos:editar',         (_, { id, dados })  => db.agendamentos.editar(id, dados))
  ipcMain.handle('agendamentos:deletar',        (_, id)             => db.agendamentos.deletar(id))
  ipcMain.handle('agendamentos:total',          ()                  => db.agendamentos.total())

  // ────────────────────────────────────────
  // VACINAS
  // ────────────────────────────────────────
  ipcMain.handle('vacinas:criar',            (_, dados)         => db.vacinas.criar(dados))
  ipcMain.handle('vacinas:listar',           ()                 => db.vacinas.listar())
  ipcMain.handle('vacinas:buscarPorPet',     (_, id_pet)        => db.vacinas.buscarPorPet(id_pet))
  ipcMain.handle('vacinas:reforcosPendentes',()                 => db.vacinas.reforcosPendentes())
  ipcMain.handle('vacinas:editar',           (_, { id, dados }) => db.vacinas.editar(id, dados))
  ipcMain.handle('vacinas:deletar',          (_, id)            => db.vacinas.deletar(id))

  // ────────────────────────────────────────
  // HISTÓRICO DE PESO
  // ────────────────────────────────────────
  ipcMain.handle('peso:registrar',    (_, dados)     => db.pesoHistorico.registrar(dados))
  ipcMain.handle('peso:buscarPorPet', (_, id_pet)    => db.pesoHistorico.buscarPorPet(id_pet))
  ipcMain.handle('peso:deletar',      (_, id)        => db.pesoHistorico.deletar(id))

  // ────────────────────────────────────────
  // ESTOQUE
  // ────────────────────────────────────────
  ipcMain.handle('estoque:criar',                (_, dados)                        => db.estoque.criar(dados))
  ipcMain.handle('estoque:listar',               ()                                => db.estoque.listar())
  ipcMain.handle('estoque:buscarPorId',          (_, id)                           => db.estoque.buscarPorId(id))
  ipcMain.handle('estoque:alertasBaixoEstoque',  ()                                => db.estoque.alertasBaixoEstoque())
  ipcMain.handle('estoque:movimentar',           (_, { id, tipo, qtd, motivo })    => db.estoque.movimentar(id, tipo, qtd, motivo))
  ipcMain.handle('estoque:historicoMovimentacoes',(_, id)                          => db.estoque.historicoMovimentacoes(id))
  ipcMain.handle('estoque:editar',               (_, { id, dados })                => db.estoque.editar(id, dados))
  ipcMain.handle('estoque:deletar',              (_, id)                           => db.estoque.deletar(id))

  // ────────────────────────────────────────
  // VETERINÁRIOS
  // ────────────────────────────────────────
  ipcMain.handle('veterinarios:criar',         (_, dados)         => db.veterinarios.criar(dados))
  ipcMain.handle('veterinarios:listar',        ()                 => db.veterinarios.listar())
  ipcMain.handle('veterinarios:listarAtivos',  ()                 => db.veterinarios.listarAtivos())
  ipcMain.handle('veterinarios:buscarPorId',   (_, id)            => db.veterinarios.buscarPorId(id))
  ipcMain.handle('veterinarios:editar',        (_, { id, dados }) => db.veterinarios.editar(id, dados))
  ipcMain.handle('veterinarios:alternarAtivo', (_, id)            => db.veterinarios.alternarAtivo(id))
  ipcMain.handle('veterinarios:deletar',       (_, id)            => db.veterinarios.deletar(id))
  ipcMain.handle('veterinarios:total',         ()                 => db.veterinarios.total())

  // ────────────────────────────────────────
  // PRESCRIÇÕES / RECEITUÁRIO
  // ────────────────────────────────────────
  ipcMain.handle('prescricoes:criar',       (_, dados)         => db.prescricoes.criar(dados))
  ipcMain.handle('prescricoes:listar',      ()                 => db.prescricoes.listar())
  ipcMain.handle('prescricoes:buscarPorId', (_, id)            => db.prescricoes.buscarPorId(id))
  ipcMain.handle('prescricoes:buscarPorPet',(_, id_pet)        => db.prescricoes.buscarPorPet(id_pet))
  ipcMain.handle('prescricoes:editar',      (_, { id, dados }) => db.prescricoes.editar(id, dados))
  ipcMain.handle('prescricoes:deletar',     (_, id)            => db.prescricoes.deletar(id))
  ipcMain.handle('prescricoes:totalMes',    ()                 => db.prescricoes.totalMes())

  // ────────────────────────────────────────
  // CIRURGIAS
  // ────────────────────────────────────────
  ipcMain.handle('cirurgias:criar',       (_, dados)         => db.cirurgias.criar(dados))
  ipcMain.handle('cirurgias:listar',      ()                 => db.cirurgias.listar())
  ipcMain.handle('cirurgias:buscarPorId', (_, id)            => db.cirurgias.buscarPorId(id))
  ipcMain.handle('cirurgias:buscarPorPet',(_, id_pet)        => db.cirurgias.buscarPorPet(id_pet))
  ipcMain.handle('cirurgias:editar',      (_, { id, dados }) => db.cirurgias.editar(id, dados))
  ipcMain.handle('cirurgias:deletar',     (_, id)            => db.cirurgias.deletar(id))
  ipcMain.handle('cirurgias:totalMes',    ()                 => db.cirurgias.totalMes())

  // ────────────────────────────────────────
  // INTERNAÇÕES
  // ────────────────────────────────────────
  ipcMain.handle('internacoes:criar',            (_, dados)         => db.internacoes.criar(dados))
  ipcMain.handle('internacoes:listar',           ()                 => db.internacoes.listar())
  ipcMain.handle('internacoes:buscarPorId',      (_, id)            => db.internacoes.buscarPorId(id))
  ipcMain.handle('internacoes:buscarPorPet',     (_, id_pet)        => db.internacoes.buscarPorPet(id_pet))
  ipcMain.handle('internacoes:ativas',           ()                 => db.internacoes.ativas())
  ipcMain.handle('internacoes:editar',           (_, { id, dados }) => db.internacoes.editar(id, dados))
  ipcMain.handle('internacoes:darAlta',          (_, { id, dados }) => db.internacoes.darAlta(id, dados))
  ipcMain.handle('internacoes:deletar',          (_, id)            => db.internacoes.deletar(id))
  ipcMain.handle('internacoes:registrarEvolucao',(_, dados)         => db.internacoes.registrarEvolucao(dados))
  ipcMain.handle('internacoes:buscarEvolucoes',  (_, id)            => db.internacoes.buscarEvolucoes(id))
  ipcMain.handle('internacoes:deletarEvolucao',  (_, id)            => db.internacoes.deletarEvolucao(id))

  // ────────────────────────────────────────
  // CONSULTAS / PRONTUÁRIOS
  // ────────────────────────────────────────
  ipcMain.handle('consultas:criar',        (_, dados)         => db.consultas.criar(dados))
  ipcMain.handle('consultas:listar',       ()                 => db.consultas.listar())
  ipcMain.handle('consultas:buscarPorId',  (_, id)            => db.consultas.buscarPorId(id))
  ipcMain.handle('consultas:buscarPorPet', (_, id_pet)        => db.consultas.buscarPorPet(id_pet))
  ipcMain.handle('consultas:editar',       (_, { id, dados }) => db.consultas.editar(id, dados))
  ipcMain.handle('consultas:deletar',      (_, id)            => db.consultas.deletar(id))
  ipcMain.handle('consultas:totalMes',     ()                 => db.consultas.totalMes())

  // ────────────────────────────────────────
  // FINANCEIRO
  // ────────────────────────────────────────
  ipcMain.handle('financeiro:criar',          (_, dados)                   => db.financeiro.criar(dados))
  ipcMain.handle('financeiro:listar',         ()                           => db.financeiro.listar())
  ipcMain.handle('financeiro:buscarPorPeriodo',(_, { dataInicio, dataFim }) => db.financeiro.buscarPorPeriodo(dataInicio, dataFim))
  ipcMain.handle('financeiro:resumoMensal',   (_, { ano, mes })            => db.financeiro.resumoMensal(ano, mes))
  ipcMain.handle('financeiro:historicoMensal',()                           => db.financeiro.historicoMensal())
  ipcMain.handle('financeiro:totalMesAtual',  ()                           => db.financeiro.totalMesAtual())
  ipcMain.handle('financeiro:editar',         (_, { id, dados })           => db.financeiro.editar(id, dados))
  ipcMain.handle('financeiro:deletar',        (_, id)                      => db.financeiro.deletar(id))

  // ────────────────────────────────────────
  // EXAMES
  // ────────────────────────────────────────
  ipcMain.handle('exames:criar',        (_, dados)         => db.exames.criar(dados))
  ipcMain.handle('exames:listar',       ()                 => db.exames.listar())
  ipcMain.handle('exames:buscarPorPet', (_, id_pet)        => db.exames.buscarPorPet(id_pet))
  ipcMain.handle('exames:editar',       (_, { id, dados }) => db.exames.editar(id, dados))
  ipcMain.handle('exames:deletar',      (_, id)            => db.exames.deletar(id))

  // ────────────────────────────────────────
  // VENDAS (PDV)
  // ────────────────────────────────────────
  ipcMain.handle('vendas:criar',    (_, dados)           => db.vendas.criar(dados))
  ipcMain.handle('vendas:listar',   ()                   => db.vendas.listar())
  ipcMain.handle('vendas:buscarPorId', (_, id)           => db.vendas.buscarPorId(id))
  ipcMain.handle('vendas:cancelar', (_, { id, motivo })  => db.vendas.cancelar(id, motivo))
  ipcMain.handle('vendas:totalMes', ()                   => db.vendas.totalMes())

  ipcMain.handle('exames:abrirArquivo', (_, arquivoPath) => {
    if (arquivoPath && fs.existsSync(arquivoPath)) {
      shell.openPath(arquivoPath)
      return { ok: true }
    }
    return { ok: false, erro: 'Arquivo não encontrado' }
  })

  ipcMain.handle('exames:selecionarArquivo', async (_, id_pet) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Selecionar arquivo do exame',
      filters: [
        { name: 'Documentos e Imagens', extensions: ['pdf', 'jpg', 'jpeg', 'png', 'docx', 'doc'] },
        { name: 'PDF', extensions: ['pdf'] },
        { name: 'Imagens', extensions: ['jpg', 'jpeg', 'png'] },
        { name: 'Todos', extensions: ['*'] },
      ],
      properties: ['openFile'],
    })
    if (canceled || !filePaths.length) return { canceled: true }

    const origem = filePaths[0]
    const ext    = path.extname(origem).toLowerCase()
    const tipo   = ['.jpg', '.jpeg', '.png'].includes(ext) ? 'imagem' : 'pdf'
    const nome   = path.basename(origem)
    const stamp  = Date.now()

    // Copia para userData/exames/{id_pet}/
    const { app } = require('electron')
    const pastaDestino = path.join(app.getPath('userData'), 'exames', String(id_pet))
    fs.mkdirSync(pastaDestino, { recursive: true })
    const destino = path.join(pastaDestino, `${stamp}_${nome}`)
    fs.copyFileSync(origem, destino)

    return { canceled: false, path: destino, nome, tipo, ext }
  })

  ipcMain.handle('exames:extrairPdf', async (_, arquivoPath) => {
    try {
      const pdfParse = require('pdf-parse')
      const buffer   = fs.readFileSync(arquivoPath)
      const data     = await pdfParse(buffer)
      const texto    = data.text || ''

      // ── Detectar sugestões no texto extraído ──
      const sugestoes = {}

      // Data: primeiro padrão DD/MM/YYYY encontrado
      const matchData = texto.match(/\d{2}\/\d{2}\/\d{4}/)
      if (matchData) {
        const [d, m, a] = matchData[0].split('/')
        sugestoes.data_coleta = `${a}-${m}-${d}` // formato YYYY-MM-DD para o input date
      }

      // Tipo do exame: palavras-chave
      const tipos = [
        { termo: /hemograma/i,        tipo: 'Hemograma' },
        { termo: /ultrassom|ultrassonografia/i, tipo: 'Ultrassom' },
        { termo: /raio.?x|radiografi/i, tipo: 'Raio-X' },
        { termo: /bioqu[íi]mica/i,    tipo: 'Bioquímica' },
        { termo: /urin[áa]lise|urina\b/i, tipo: 'Urinálise' },
        { termo: /parasitol[óo]gico/i, tipo: 'Parasitológico' },
        { termo: /citologia/i,        tipo: 'Citologia' },
        { termo: /histopatologia/i,   tipo: 'Histopatologia' },
        { termo: /eletrocardiograma|ecg/i, tipo: 'Eletrocardiograma' },
        { termo: /ecocardiograma/i,   tipo: 'Ecocardiograma' },
        { termo: /tomografia/i,       tipo: 'Tomografia' },
        { termo: /microbiologia|cultura\b/i, tipo: 'Microbiologia' },
        { termo: /coagulograma/i,     tipo: 'Coagulograma' },
        { termo: /perfil renal/i,     tipo: 'Perfil Renal' },
        { termo: /perfil hep[áa]tico/i, tipo: 'Perfil Hepático' },
      ]
      for (const { termo, tipo } of tipos) {
        if (termo.test(texto)) { sugestoes.tipo = tipo; break }
      }

      // Veterinário: linhas com "Dr." ou "Med. Vet."
      const matchVet = texto.match(/(?:Dr\.?a?\.?|Med\.?\s*Vet\.?)\s+([A-ZÀ-Ú][a-zA-ZÀ-ÿ\s]+)/m)
      if (matchVet) sugestoes.veterinario = matchVet[0].trim().substring(0, 80)

      // Laboratório: tenta pegar nas primeiras 3 linhas
      const primLinhas = texto.split('\n').slice(0, 5).filter(l => l.trim().length > 3)
      if (primLinhas.length > 0) sugestoes.laboratorio = primLinhas[0].trim().substring(0, 80)

      return { ok: true, texto: texto.substring(0, 4000), sugestoes }
    } catch (err) {
      return { ok: false, erro: err.message, texto: '', sugestoes: {} }
    }
  })

  // ────────────────────────────────────────
  // CONFIGURAÇÕES (Admin)
  // ────────────────────────────────────────
  ipcMain.handle('configuracoes:get',    (_, chave)           => db.configuracoes.get(chave))
  ipcMain.handle('configuracoes:set',    (_, { chave, valor }) => db.configuracoes.set(chave, valor))
  ipcMain.handle('configuracoes:getAll', ()                   => db.configuracoes.getAll())
  ipcMain.handle('configuracoes:stats',  ()                   => db.configuracoes.stats())
  ipcMain.handle('configuracoes:resetar',()                   => db.configuracoes.resetar())

  // ────────────────────────────────────────
  // BACKUP
  // ────────────────────────────────────────
  ipcMain.handle('backup:fazerAgora', () => {
    const pasta = db.configuracoes.get('backup_pasta_custom')
    return backup.fazerBackup(pasta)
  })

  ipcMain.handle('backup:listar', () => {
    const pasta = db.configuracoes.get('backup_pasta_custom')
    return backup.listar(pasta)
  })

  ipcMain.handle('backup:ultimoInfo', () => {
    const pasta = db.configuracoes.get('backup_pasta_custom')
    return backup.ultimoInfo(pasta)
  })

  ipcMain.handle('backup:getDirAtual', () => {
    const custom = db.configuracoes.get('backup_pasta_custom')
    return custom || backup.getDirPadrao()
  })

  ipcMain.handle('backup:escolherPasta', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Escolher pasta para backups',
      properties: ['openDirectory', 'createDirectory'],
    })
    if (canceled || !filePaths.length) return { canceled: true }
    const pasta = filePaths[0]
    db.configuracoes.set('backup_pasta_custom', pasta)
    return { canceled: false, pasta }
  })

  ipcMain.handle('backup:restaurar', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Selecionar backup para restaurar',
      filters: [{ name: 'Banco de dados', extensions: ['db'] }],
      properties: ['openFile'],
    })
    if (canceled || !filePaths.length) return { canceled: true }
    return backup.restaurarArquivo(filePaths[0], db.fechar)
  })
}

module.exports = { registrarHandlers }
