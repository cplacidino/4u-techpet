// ============================================================
// PRELOAD — Ponte segura entre Electron e React
// ============================================================
// Tudo que o React precisar do banco de dados, passa por aqui.
// O React chama window.api.donos.listar() →
//   preload envia a mensagem via ipcRenderer →
//     ipc.js recebe e consulta o banco →
//       resultado volta para o React.
// ============================================================

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {

  // ── Informações do sistema ──────────────────────────────
  platform: process.platform,
  versoes: {
    node:     process.versions.node,
    electron: process.versions.electron,
    chrome:   process.versions.chrome,
  },

  // ── DONOS ───────────────────────────────────────────────
  donos: {
    criar:         (dados) => ipcRenderer.invoke('donos:criar', dados),
    listar:        ()      => ipcRenderer.invoke('donos:listar'),
    buscarPorId:   (id)    => ipcRenderer.invoke('donos:buscarPorId', id),
    buscarPorNome: (nome)  => ipcRenderer.invoke('donos:buscarPorNome', nome),
    buscarComPets: (id)    => ipcRenderer.invoke('donos:buscarComPets', id),
    editar:        (id, dados) => ipcRenderer.invoke('donos:editar', { id, dados }),
    deletar:       (id)    => ipcRenderer.invoke('donos:deletar', id),
    total:         ()      => ipcRenderer.invoke('donos:total'),
  },

  // ── PETS ────────────────────────────────────────────────
  pets: {
    criar:         (dados)   => ipcRenderer.invoke('pets:criar', dados),
    listar:        ()        => ipcRenderer.invoke('pets:listar'),
    buscarPorId:   (id)      => ipcRenderer.invoke('pets:buscarPorId', id),
    buscarPorDono: (id_dono) => ipcRenderer.invoke('pets:buscarPorDono', id_dono),
    buscarPorNome: (nome)    => ipcRenderer.invoke('pets:buscarPorNome', nome),
    editar:        (id, dados) => ipcRenderer.invoke('pets:editar', { id, dados }),
    deletar:       (id)      => ipcRenderer.invoke('pets:deletar', id),
    total:         ()        => ipcRenderer.invoke('pets:total'),
  },

  // ── AGENDAMENTOS ────────────────────────────────────────
  agendamentos: {
    criar:           (dados)         => ipcRenderer.invoke('agendamentos:criar', dados),
    listar:          ()              => ipcRenderer.invoke('agendamentos:listar'),
    buscarPorId:     (id)            => ipcRenderer.invoke('agendamentos:buscarPorId', id),
    buscarPorData:   (data)          => ipcRenderer.invoke('agendamentos:buscarPorData', data),
    buscarPorStatus: (status)        => ipcRenderer.invoke('agendamentos:buscarPorStatus', status),
    proximos:        ()              => ipcRenderer.invoke('agendamentos:proximos'),
    atualizarStatus: (id, status)    => ipcRenderer.invoke('agendamentos:atualizarStatus', { id, status }),
    editar:          (id, dados)     => ipcRenderer.invoke('agendamentos:editar', { id, dados }),
    deletar:         (id)            => ipcRenderer.invoke('agendamentos:deletar', id),
    total:           ()              => ipcRenderer.invoke('agendamentos:total'),
  },

  // ── VACINAS ─────────────────────────────────────────────
  vacinas: {
    criar:             (dados)   => ipcRenderer.invoke('vacinas:criar', dados),
    listar:            ()        => ipcRenderer.invoke('vacinas:listar'),
    buscarPorPet:      (id_pet)  => ipcRenderer.invoke('vacinas:buscarPorPet', id_pet),
    reforcosPendentes: ()        => ipcRenderer.invoke('vacinas:reforcosPendentes'),
    editar:            (id, dados) => ipcRenderer.invoke('vacinas:editar', { id, dados }),
    deletar:           (id)      => ipcRenderer.invoke('vacinas:deletar', id),
  },

  // ── HISTÓRICO DE PESO ───────────────────────────────────
  peso: {
    registrar:    (dados)  => ipcRenderer.invoke('peso:registrar', dados),
    buscarPorPet: (id_pet) => ipcRenderer.invoke('peso:buscarPorPet', id_pet),
    deletar:      (id)     => ipcRenderer.invoke('peso:deletar', id),
  },

  // ── ESTOQUE ─────────────────────────────────────────────
  estoque: {
    criar:                 (dados)              => ipcRenderer.invoke('estoque:criar', dados),
    listar:                ()                   => ipcRenderer.invoke('estoque:listar'),
    buscarPorId:           (id)                 => ipcRenderer.invoke('estoque:buscarPorId', id),
    alertasBaixoEstoque:   ()                   => ipcRenderer.invoke('estoque:alertasBaixoEstoque'),
    movimentar:            (id, tipo, qtd, motivo) => ipcRenderer.invoke('estoque:movimentar', { id, tipo, qtd, motivo }),
    historicoMovimentacoes:(id)                 => ipcRenderer.invoke('estoque:historicoMovimentacoes', id),
    editar:                (id, dados)          => ipcRenderer.invoke('estoque:editar', { id, dados }),
    deletar:               (id)                 => ipcRenderer.invoke('estoque:deletar', id),
  },

  // ── VETERINÁRIOS ────────────────────────────────────────
  veterinarios: {
    criar:         (dados)     => ipcRenderer.invoke('veterinarios:criar', dados),
    listar:        ()          => ipcRenderer.invoke('veterinarios:listar'),
    listarAtivos:  ()          => ipcRenderer.invoke('veterinarios:listarAtivos'),
    buscarPorId:   (id)        => ipcRenderer.invoke('veterinarios:buscarPorId', id),
    editar:        (id, dados) => ipcRenderer.invoke('veterinarios:editar', { id, dados }),
    alternarAtivo: (id)        => ipcRenderer.invoke('veterinarios:alternarAtivo', id),
    deletar:       (id)        => ipcRenderer.invoke('veterinarios:deletar', id),
    total:         ()          => ipcRenderer.invoke('veterinarios:total'),
  },

  // ── PRESCRIÇÕES / RECEITUÁRIO ───────────────────────────
  prescricoes: {
    criar:        (dados)     => ipcRenderer.invoke('prescricoes:criar', dados),
    listar:       ()          => ipcRenderer.invoke('prescricoes:listar'),
    buscarPorId:  (id)        => ipcRenderer.invoke('prescricoes:buscarPorId', id),
    buscarPorPet: (id_pet)    => ipcRenderer.invoke('prescricoes:buscarPorPet', id_pet),
    editar:       (id, dados) => ipcRenderer.invoke('prescricoes:editar', { id, dados }),
    deletar:      (id)        => ipcRenderer.invoke('prescricoes:deletar', id),
    totalMes:     ()          => ipcRenderer.invoke('prescricoes:totalMes'),
  },

  // ── CIRURGIAS ───────────────────────────────────────────
  cirurgias: {
    criar:        (dados)     => ipcRenderer.invoke('cirurgias:criar', dados),
    listar:       ()          => ipcRenderer.invoke('cirurgias:listar'),
    buscarPorId:  (id)        => ipcRenderer.invoke('cirurgias:buscarPorId', id),
    buscarPorPet: (id_pet)    => ipcRenderer.invoke('cirurgias:buscarPorPet', id_pet),
    editar:       (id, dados) => ipcRenderer.invoke('cirurgias:editar', { id, dados }),
    deletar:      (id)        => ipcRenderer.invoke('cirurgias:deletar', id),
    totalMes:     ()          => ipcRenderer.invoke('cirurgias:totalMes'),
  },

  // ── INTERNAÇÕES ─────────────────────────────────────────
  internacoes: {
    criar:            (dados)     => ipcRenderer.invoke('internacoes:criar', dados),
    listar:           ()          => ipcRenderer.invoke('internacoes:listar'),
    buscarPorId:      (id)        => ipcRenderer.invoke('internacoes:buscarPorId', id),
    buscarPorPet:     (id_pet)    => ipcRenderer.invoke('internacoes:buscarPorPet', id_pet),
    ativas:           ()          => ipcRenderer.invoke('internacoes:ativas'),
    editar:           (id, dados) => ipcRenderer.invoke('internacoes:editar', { id, dados }),
    darAlta:          (id, dados) => ipcRenderer.invoke('internacoes:darAlta', { id, dados }),
    deletar:          (id)        => ipcRenderer.invoke('internacoes:deletar', id),
    registrarEvolucao:(dados)     => ipcRenderer.invoke('internacoes:registrarEvolucao', dados),
    buscarEvolucoes:  (id)        => ipcRenderer.invoke('internacoes:buscarEvolucoes', id),
    deletarEvolucao:  (id)        => ipcRenderer.invoke('internacoes:deletarEvolucao', id),
  },

  // ── CONSULTAS / PRONTUÁRIOS ─────────────────────────────
  consultas: {
    criar:        (dados)     => ipcRenderer.invoke('consultas:criar', dados),
    listar:       ()          => ipcRenderer.invoke('consultas:listar'),
    buscarPorId:  (id)        => ipcRenderer.invoke('consultas:buscarPorId', id),
    buscarPorPet: (id_pet)    => ipcRenderer.invoke('consultas:buscarPorPet', id_pet),
    editar:       (id, dados) => ipcRenderer.invoke('consultas:editar', { id, dados }),
    deletar:      (id)        => ipcRenderer.invoke('consultas:deletar', id),
    totalMes:     ()          => ipcRenderer.invoke('consultas:totalMes'),
  },

  // ── FINANCEIRO ──────────────────────────────────────────
  financeiro: {
    criar:            (dados)              => ipcRenderer.invoke('financeiro:criar', dados),
    listar:           ()                   => ipcRenderer.invoke('financeiro:listar'),
    buscarPorPeriodo: (dataInicio, dataFim) => ipcRenderer.invoke('financeiro:buscarPorPeriodo', { dataInicio, dataFim }),
    resumoMensal:     (ano, mes)           => ipcRenderer.invoke('financeiro:resumoMensal', { ano, mes }),
    historicoMensal:  ()                   => ipcRenderer.invoke('financeiro:historicoMensal'),
    totalMesAtual:    ()                   => ipcRenderer.invoke('financeiro:totalMesAtual'),
    editar:           (id, dados)          => ipcRenderer.invoke('financeiro:editar', { id, dados }),
    deletar:          (id)                 => ipcRenderer.invoke('financeiro:deletar', id),
  },

  // ── EXAMES ───────────────────────────────────────────────
  exames: {
    criar:             (dados)     => ipcRenderer.invoke('exames:criar', dados),
    listar:            ()          => ipcRenderer.invoke('exames:listar'),
    buscarPorPet:      (id_pet)    => ipcRenderer.invoke('exames:buscarPorPet', id_pet),
    editar:            (id, dados) => ipcRenderer.invoke('exames:editar', { id, dados }),
    deletar:           (id)        => ipcRenderer.invoke('exames:deletar', id),
    selecionarArquivo: (id_pet)    => ipcRenderer.invoke('exames:selecionarArquivo', id_pet),
    extrairPdf:        (path)      => ipcRenderer.invoke('exames:extrairPdf', path),
    abrirArquivo:      (path)      => ipcRenderer.invoke('exames:abrirArquivo', path),
  },

  // ── VENDAS (PDV) ─────────────────────────────────────────
  vendas: {
    criar:       (dados)        => ipcRenderer.invoke('vendas:criar', dados),
    listar:      ()             => ipcRenderer.invoke('vendas:listar'),
    buscarPorId: (id)           => ipcRenderer.invoke('vendas:buscarPorId', id),
    cancelar:    (id, motivo)   => ipcRenderer.invoke('vendas:cancelar', { id, motivo }),
    totalMes:    ()             => ipcRenderer.invoke('vendas:totalMes'),
  },

  // ── CONFIGURAÇÕES (Admin) ────────────────────────────────
  configuracoes: {
    get:     (chave)         => ipcRenderer.invoke('configuracoes:get', chave),
    set:     (chave, valor)  => ipcRenderer.invoke('configuracoes:set', { chave, valor }),
    getAll:  ()              => ipcRenderer.invoke('configuracoes:getAll'),
    stats:   ()              => ipcRenderer.invoke('configuracoes:stats'),
    resetar: ()              => ipcRenderer.invoke('configuracoes:resetar'),
  },

  // ── BACKUP ───────────────────────────────────────────────
  backup: {
    fazerAgora:    ()  => ipcRenderer.invoke('backup:fazerAgora'),
    listar:        ()  => ipcRenderer.invoke('backup:listar'),
    ultimoInfo:    ()  => ipcRenderer.invoke('backup:ultimoInfo'),
    getDirAtual:   ()  => ipcRenderer.invoke('backup:getDirAtual'),
    escolherPasta: ()  => ipcRenderer.invoke('backup:escolherPasta'),
    restaurar:     ()  => ipcRenderer.invoke('backup:restaurar'),
  },

  // ── ATUALIZAÇÃO AUTOMÁTICA ───────────────────────────────
  update: {
    checar:   ()  => ipcRenderer.invoke('update:checar'),
    baixar:   ()  => ipcRenderer.invoke('update:baixar'),
    instalar: ()  => ipcRenderer.invoke('update:instalar'),

    // Escuta eventos enviados pelo processo principal
    onDisponivel:    (fn) => ipcRenderer.on('update:disponivel',    (_, d) => fn(d)),
    onNaoDisponivel: (fn) => ipcRenderer.on('update:naodisponivel', (_, d) => fn(d)),
    onProgresso:     (fn) => ipcRenderer.on('update:progresso',     (_, d) => fn(d)),
    onBaixado:       (fn) => ipcRenderer.on('update:baixado',       (_, d) => fn(d)),
    onErro:          (fn) => ipcRenderer.on('update:erro',          (_, d) => fn(d)),

    // Remove os listeners (limpeza ao desmontar o componente)
    removerListeners: () => {
      ipcRenderer.removeAllListeners('update:disponivel')
      ipcRenderer.removeAllListeners('update:naodisponivel')
      ipcRenderer.removeAllListeners('update:progresso')
      ipcRenderer.removeAllListeners('update:baixado')
      ipcRenderer.removeAllListeners('update:erro')
    },
  },
})
