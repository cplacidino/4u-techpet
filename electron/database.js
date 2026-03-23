// ============================================================
// BANCO DE DADOS — electron/database.js
// ============================================================
// Este arquivo SÓ roda no processo principal do Electron (main process).
// O React nunca acessa o banco diretamente — toda comunicação passa
// pelo IPC (ipc.js) e pelo preload.js.
//
// Estrutura:
//   connect()   → abre/cria o banco e as tabelas
//   donos.*     → CRUD de donos/tutores
//   pets.*      → CRUD de animais
//   agendamentos.* → CRUD de agendamentos
//   vacinas.*   → CRUD de vacinas
//   financeiro.*→ CRUD financeiro + relatórios
// ============================================================

const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

let db      // instância global do banco
let dbPath  // caminho do arquivo .db (usado em stats)

// ──────────────────────────────────────────────────────────
// CONEXÃO
// ──────────────────────────────────────────────────────────

function connect(app) {
  const isDev = process.env.NODE_ENV === 'development'

  // Em desenvolvimento: banco fica na pasta /database do projeto
  // Em produção (.exe): banco fica em C:\Users\...\AppData\Roaming\4u-techpet\
  dbPath = isDev
    ? path.join(__dirname, '../database/4utechpet.db')
    : path.join(app.getPath('userData'), '4utechpet.db')

  // Garante que a pasta existe
  const dbDir = path.dirname(dbPath)
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })

  db = new Database(dbPath)

  // Configurações de performance e segurança
  db.pragma('journal_mode = WAL')   // Write-Ahead Logging: mais rápido e seguro
  db.pragma('foreign_keys = ON')    // Ativa integridade referencial (chaves estrangeiras)
  db.pragma('synchronous = NORMAL') // Balanço entre velocidade e segurança

  criarTabelas()
  migrarTabelas()

  console.log(`[DB] Banco conectado em: ${dbPath}`)
  return db
}

// ──────────────────────────────────────────────────────────
// CRIAÇÃO DAS TABELAS
// ──────────────────────────────────────────────────────────

function criarTabelas() {
  db.exec(`
    -- Donos / Tutores dos pets
    CREATE TABLE IF NOT EXISTS donos (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      nome        TEXT    NOT NULL,
      telefone    TEXT,
      email       TEXT,
      endereco    TEXT,
      criado_em   DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Pets / Animais
    CREATE TABLE IF NOT EXISTS pets (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      id_dono          INTEGER NOT NULL,
      nome             TEXT    NOT NULL,
      especie          TEXT,
      raca             TEXT,
      data_nascimento  TEXT,
      peso             REAL,
      foto             TEXT,
      observacoes      TEXT,
      criado_em        DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_dono) REFERENCES donos(id) ON DELETE CASCADE
    );

    -- Agendamentos (consultas, banho, tosa, etc.)
    CREATE TABLE IF NOT EXISTS agendamentos (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      id_pet       INTEGER NOT NULL,
      servico      TEXT    NOT NULL,
      data         TEXT    NOT NULL,
      hora         TEXT    NOT NULL,
      status       TEXT    DEFAULT 'agendado',
      valor        REAL,
      observacoes  TEXT,
      criado_em    DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_pet) REFERENCES pets(id) ON DELETE CASCADE
    );

    -- Vacinas
    CREATE TABLE IF NOT EXISTS vacinas (
      id                   INTEGER PRIMARY KEY AUTOINCREMENT,
      id_pet               INTEGER NOT NULL,
      nome_vacina          TEXT    NOT NULL,
      data_aplicacao       TEXT    NOT NULL,
      data_proximo_reforco TEXT,
      observacoes          TEXT,
      FOREIGN KEY (id_pet) REFERENCES pets(id) ON DELETE CASCADE
    );

    -- Financeiro
    CREATE TABLE IF NOT EXISTS financeiro (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      id_agendamento   INTEGER,
      descricao        TEXT    NOT NULL,
      valor            REAL    NOT NULL,
      tipo             TEXT    NOT NULL,
      data             TEXT    NOT NULL,
      criado_em        DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_agendamento) REFERENCES agendamentos(id) ON DELETE SET NULL
    );

    -- Histórico de peso dos pets
    CREATE TABLE IF NOT EXISTS peso_historico (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      id_pet      INTEGER NOT NULL,
      peso        REAL    NOT NULL,
      data        TEXT    NOT NULL,
      observacoes TEXT,
      criado_em   DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_pet) REFERENCES pets(id) ON DELETE CASCADE
    );

    -- Estoque de produtos
    CREATE TABLE IF NOT EXISTS estoque (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      nome           TEXT    NOT NULL,
      categoria      TEXT,
      quantidade     REAL    NOT NULL DEFAULT 0,
      unidade        TEXT    DEFAULT 'un',
      quantidade_min REAL    DEFAULT 0,
      preco_custo    REAL,
      preco_venda    REAL,
      observacoes    TEXT,
      criado_em      DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Movimentações de estoque (entrada/saída)
    CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      id_produto   INTEGER NOT NULL,
      tipo         TEXT    NOT NULL,
      quantidade   REAL    NOT NULL,
      motivo       TEXT,
      criado_em    DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_produto) REFERENCES estoque(id) ON DELETE CASCADE
    );

    -- ── MÓDULO CLÍNICO ────────────────────────────────────

    -- Veterinários / Médicos
    CREATE TABLE IF NOT EXISTS veterinarios (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      nome          TEXT    NOT NULL,
      crmv          TEXT,
      especialidade TEXT,
      telefone      TEXT,
      email         TEXT,
      observacoes   TEXT,
      ativo         INTEGER DEFAULT 1,
      criado_em     DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Consultas / Prontuários médicos
    CREATE TABLE IF NOT EXISTS consultas (
      id                     INTEGER PRIMARY KEY AUTOINCREMENT,
      id_pet                 INTEGER NOT NULL,
      id_veterinario         INTEGER,
      id_agendamento         INTEGER,
      data                   TEXT    NOT NULL,
      hora                   TEXT,
      queixa_principal       TEXT,
      historico              TEXT,
      peso                   REAL,
      temperatura            REAL,
      freq_cardiaca          INTEGER,
      freq_respiratoria      INTEGER,
      mucosas                TEXT,
      hidratacao             TEXT,
      outros_exame           TEXT,
      diagnostico_suspeita   TEXT,
      diagnostico_definitivo TEXT,
      plano_terapeutico      TEXT,
      retorno                TEXT,
      observacoes            TEXT,
      criado_em              DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_pet)          REFERENCES pets(id)          ON DELETE CASCADE,
      FOREIGN KEY (id_veterinario)  REFERENCES veterinarios(id)  ON DELETE SET NULL,
      FOREIGN KEY (id_agendamento)  REFERENCES agendamentos(id)  ON DELETE SET NULL
    );

    -- Internações
    CREATE TABLE IF NOT EXISTS internacoes (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      id_pet         INTEGER NOT NULL,
      id_veterinario INTEGER,
      data_entrada   TEXT    NOT NULL,
      hora_entrada   TEXT,
      motivo         TEXT    NOT NULL,
      status         TEXT    DEFAULT 'internado',
      data_alta      TEXT,
      hora_alta      TEXT,
      condicao_saida TEXT,
      observacoes    TEXT,
      criado_em      DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_pet)         REFERENCES pets(id)         ON DELETE CASCADE,
      FOREIGN KEY (id_veterinario) REFERENCES veterinarios(id) ON DELETE SET NULL
    );

    -- Evoluções diárias de internação
    CREATE TABLE IF NOT EXISTS evolucoes_internacao (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      id_internacao INTEGER NOT NULL,
      data          TEXT    NOT NULL,
      hora          TEXT,
      temperatura   REAL,
      peso          REAL,
      alimentacao   TEXT,
      medicacao     TEXT,
      observacoes   TEXT,
      criado_em     DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_internacao) REFERENCES internacoes(id) ON DELETE CASCADE
    );

    -- Cirurgias
    CREATE TABLE IF NOT EXISTS cirurgias (
      id                   INTEGER PRIMARY KEY AUTOINCREMENT,
      id_pet               INTEGER NOT NULL,
      id_cirurgiao         INTEGER,
      id_anestesista       INTEGER,
      data                 TEXT    NOT NULL,
      hora_inicio          TEXT,
      hora_fim             TEXT,
      tipo_cirurgia        TEXT    NOT NULL,
      asa                  TEXT,
      jejum                TEXT,
      pre_medicacao        TEXT,
      exames_pre_op        TEXT,
      protocolo_anestesico TEXT,
      agente_anestesico    TEXT,
      dose_anestesico      TEXT,
      via_anestesica       TEXT,
      intercorrencias      TEXT,
      obs_trans_op         TEXT,
      recuperacao          TEXT,
      cuidados_pos         TEXT,
      restricoes           TEXT,
      retorno              TEXT,
      observacoes          TEXT,
      criado_em            DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_pet)         REFERENCES pets(id)         ON DELETE CASCADE,
      FOREIGN KEY (id_cirurgiao)   REFERENCES veterinarios(id) ON DELETE SET NULL,
      FOREIGN KEY (id_anestesista) REFERENCES veterinarios(id) ON DELETE SET NULL
    );

    -- Prescrições / Receituários
    CREATE TABLE IF NOT EXISTS prescricoes (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      id_pet         INTEGER NOT NULL,
      id_veterinario INTEGER,
      id_consulta    INTEGER,
      data           TEXT    NOT NULL,
      observacoes    TEXT,
      criado_em      DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_pet)         REFERENCES pets(id)         ON DELETE CASCADE,
      FOREIGN KEY (id_veterinario) REFERENCES veterinarios(id) ON DELETE SET NULL,
      FOREIGN KEY (id_consulta)    REFERENCES consultas(id)    ON DELETE SET NULL
    );

    -- Itens de prescrição (medicamentos)
    CREATE TABLE IF NOT EXISTS itens_prescricao (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      id_prescricao INTEGER NOT NULL,
      medicamento   TEXT    NOT NULL,
      concentracao  TEXT,
      forma         TEXT,
      dose          TEXT,
      frequencia    TEXT,
      duracao       TEXT,
      via           TEXT,
      observacoes   TEXT,
      FOREIGN KEY (id_prescricao) REFERENCES prescricoes(id) ON DELETE CASCADE
    );

    -- Configurações do sistema (admin)
    CREATE TABLE IF NOT EXISTS configuracoes (
      chave TEXT PRIMARY KEY,
      valor TEXT
    );

    -- Exames laboratoriais e de imagem
    CREATE TABLE IF NOT EXISTS exames (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      id_pet        INTEGER NOT NULL,
      tipo          TEXT    NOT NULL,
      data_coleta   TEXT,
      laboratorio   TEXT,
      veterinario   TEXT,
      resultado     TEXT    DEFAULT 'Normal',
      observacoes   TEXT,
      arquivo_path  TEXT,
      arquivo_nome  TEXT,
      criado_em     DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_pet) REFERENCES pets(id) ON DELETE CASCADE
    );

    -- Vendas (PDV / comércio)
    CREATE TABLE IF NOT EXISTS vendas (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      id_pet        INTEGER,
      id_dono       INTEGER,
      status        TEXT    NOT NULL DEFAULT 'concluida',  -- concluida | cancelada | devolvida
      total         REAL    NOT NULL DEFAULT 0,
      desconto      REAL    NOT NULL DEFAULT 0,
      total_final   REAL    NOT NULL DEFAULT 0,
      observacoes   TEXT,
      id_financeiro INTEGER,
      criado_em     DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_pet)  REFERENCES pets(id)  ON DELETE SET NULL,
      FOREIGN KEY (id_dono) REFERENCES donos(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS itens_venda (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      id_venda      INTEGER NOT NULL,
      id_produto    INTEGER NOT NULL,
      nome_produto  TEXT    NOT NULL,
      quantidade    REAL    NOT NULL,
      preco_unit    REAL    NOT NULL,
      subtotal      REAL    NOT NULL,
      FOREIGN KEY (id_venda)   REFERENCES vendas(id)   ON DELETE CASCADE,
      FOREIGN KEY (id_produto) REFERENCES estoque(id)  ON DELETE RESTRICT
    );

    -- Índices para acelerar buscas frequentes
    CREATE INDEX IF NOT EXISTS idx_pets_dono         ON pets(id_dono);
    CREATE INDEX IF NOT EXISTS idx_agenda_pet        ON agendamentos(id_pet);
    CREATE INDEX IF NOT EXISTS idx_agenda_data       ON agendamentos(data);
    CREATE INDEX IF NOT EXISTS idx_vacinas_pet       ON vacinas(id_pet);
    CREATE INDEX IF NOT EXISTS idx_financeiro_data   ON financeiro(data);
    CREATE INDEX IF NOT EXISTS idx_peso_pet          ON peso_historico(id_pet);
    CREATE INDEX IF NOT EXISTS idx_moviment_produto  ON movimentacoes_estoque(id_produto);
    CREATE INDEX IF NOT EXISTS idx_consultas_pet     ON consultas(id_pet);
    CREATE INDEX IF NOT EXISTS idx_internacoes_pet   ON internacoes(id_pet);
    CREATE INDEX IF NOT EXISTS idx_evolucoes_intern  ON evolucoes_internacao(id_internacao);
    CREATE INDEX IF NOT EXISTS idx_cirurgias_pet     ON cirurgias(id_pet);
    CREATE INDEX IF NOT EXISTS idx_prescricoes_pet   ON prescricoes(id_pet);
    CREATE INDEX IF NOT EXISTS idx_itens_prescricao  ON itens_prescricao(id_prescricao);
    CREATE INDEX IF NOT EXISTS idx_exames_pet        ON exames(id_pet);

    -- Contas a receber (fiado)
    CREATE TABLE IF NOT EXISTS contas_receber (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      id_dono         INTEGER NOT NULL,
      descricao       TEXT    NOT NULL,
      valor_total     REAL    NOT NULL,
      valor_pago      REAL    NOT NULL DEFAULT 0,
      data_emissao    TEXT    NOT NULL,
      data_vencimento TEXT,
      status          TEXT    NOT NULL DEFAULT 'pendente',
      origem          TEXT    NOT NULL DEFAULT 'manual',
      id_venda        INTEGER,
      id_agendamento  INTEGER,
      observacoes     TEXT,
      criado_em       DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_dono)        REFERENCES donos(id)        ON DELETE RESTRICT,
      FOREIGN KEY (id_venda)       REFERENCES vendas(id)       ON DELETE SET NULL,
      FOREIGN KEY (id_agendamento) REFERENCES agendamentos(id) ON DELETE SET NULL
    );

    -- Histórico de pagamentos do fiado
    CREATE TABLE IF NOT EXISTS pagamentos_fiado (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      id_conta    INTEGER NOT NULL,
      valor       REAL    NOT NULL,
      data        TEXT    NOT NULL,
      observacoes TEXT,
      criado_em   DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_conta) REFERENCES contas_receber(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_contas_dono   ON contas_receber(id_dono);
    CREATE INDEX IF NOT EXISTS idx_contas_status ON contas_receber(status);
    CREATE INDEX IF NOT EXISTS idx_pgtos_conta   ON pagamentos_fiado(id_conta);

    -- ── MÓDULO PLANOS ──────────────────────────────────────

    -- Tipos/modelos de plano (templates reutilizáveis)
    CREATE TABLE IF NOT EXISTS plano_tipos (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      nome        TEXT    NOT NULL,
      descricao   TEXT,
      valor       REAL    NOT NULL DEFAULT 0,
      ativo       INTEGER DEFAULT 1,
      criado_em   DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Serviços incluídos em cada tipo de plano
    CREATE TABLE IF NOT EXISTS plano_tipo_itens (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      id_plano_tipo  INTEGER NOT NULL,
      servico        TEXT    NOT NULL,
      quantidade     INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (id_plano_tipo) REFERENCES plano_tipos(id) ON DELETE CASCADE
    );

    -- Assinaturas: qual cliente tem qual plano
    CREATE TABLE IF NOT EXISTS plano_assinaturas (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      id_dono        INTEGER NOT NULL,
      id_pet         INTEGER,
      id_plano_tipo  INTEGER NOT NULL,
      data_inicio    TEXT    NOT NULL,
      dia_vencimento INTEGER NOT NULL DEFAULT 1,
      status         TEXT    NOT NULL DEFAULT 'ativo',
      observacoes    TEXT,
      criado_em      DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_dono)       REFERENCES donos(id)       ON DELETE RESTRICT,
      FOREIGN KEY (id_pet)        REFERENCES pets(id)        ON DELETE SET NULL,
      FOREIGN KEY (id_plano_tipo) REFERENCES plano_tipos(id) ON DELETE RESTRICT
    );

    -- Ciclos mensais de cobrança
    CREATE TABLE IF NOT EXISTS plano_ciclos (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      id_assinatura   INTEGER NOT NULL,
      competencia     TEXT    NOT NULL,
      data_vencimento TEXT    NOT NULL,
      data_pagamento  TEXT,
      valor           REAL    NOT NULL,
      status          TEXT    NOT NULL DEFAULT 'pendente',
      id_financeiro   INTEGER,
      criado_em       DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_assinatura) REFERENCES plano_assinaturas(id) ON DELETE CASCADE,
      FOREIGN KEY (id_financeiro) REFERENCES financeiro(id)        ON DELETE SET NULL
    );

    -- Usos de serviços dentro de um ciclo
    CREATE TABLE IF NOT EXISTS plano_usos (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      id_ciclo        INTEGER NOT NULL,
      servico         TEXT    NOT NULL,
      id_agendamento  INTEGER,
      data_uso        TEXT    NOT NULL,
      observacoes     TEXT,
      criado_em       DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_ciclo)       REFERENCES plano_ciclos(id)  ON DELETE CASCADE,
      FOREIGN KEY (id_agendamento) REFERENCES agendamentos(id)  ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_plano_assin_dono  ON plano_assinaturas(id_dono);
    CREATE INDEX IF NOT EXISTS idx_plano_ciclos_assin ON plano_ciclos(id_assinatura);
    CREATE INDEX IF NOT EXISTS idx_plano_usos_ciclo  ON plano_usos(id_ciclo);

    -- ── MÓDULO ENTREGAS ────────────────────────────────────
    CREATE TABLE IF NOT EXISTS entregas (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      id_venda    INTEGER NOT NULL,
      endereco    TEXT    NOT NULL,
      taxa        REAL    DEFAULT 0,
      responsavel TEXT,
      observacoes TEXT,
      status      TEXT    NOT NULL DEFAULT 'aguardando',
      saiu_em     TEXT,
      entregue_em TEXT,
      criado_em   DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_venda) REFERENCES vendas(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_entregas_venda  ON entregas(id_venda);
    CREATE INDEX IF NOT EXISTS idx_entregas_status ON entregas(status);
  `)
}

// Migração segura: adiciona colunas novas em tabelas existentes
function migrarTabelas() {
  const novasColunas = [
    ['vendas',        'tipo_pagamento TEXT DEFAULT "vista"'],
    ['vendas',        'id_conta_receber INTEGER'],
    ['vendas',        'nome_cliente TEXT'],
    ['agendamentos',  'tipo_pagamento TEXT DEFAULT "vista"'],
    ['agendamentos',  'id_conta_receber INTEGER'],
  ]
  for (const [tabela, coluna] of novasColunas) {
    try { db.exec(`ALTER TABLE ${tabela} ADD COLUMN ${coluna}`) } catch (_) {}
  }
}

// ──────────────────────────────────────────────────────────
// DONOS
// ──────────────────────────────────────────────────────────

const donos = {
  criar(dados) {
    const stmt = db.prepare(`
      INSERT INTO donos (nome, telefone, email, endereco)
      VALUES (@nome, @telefone, @email, @endereco)
    `)
    const result = stmt.run(dados)
    return { id: result.lastInsertRowid, ...dados }
  },

  listar() {
    return db.prepare(`
      SELECT d.*, COUNT(p.id) as total_pets
      FROM donos d
      LEFT JOIN pets p ON p.id_dono = d.id
      GROUP BY d.id
      ORDER BY d.nome COLLATE NOCASE
    `).all()
  },

  buscarPorId(id) {
    return db.prepare('SELECT * FROM donos WHERE id = ?').get(id)
  },

  buscarPorNome(nome) {
    return db.prepare(`
      SELECT d.*, COUNT(p.id) as total_pets
      FROM donos d
      LEFT JOIN pets p ON p.id_dono = d.id
      WHERE d.nome LIKE ?
      GROUP BY d.id
      ORDER BY d.nome
    `).all(`%${nome}%`)
  },

  buscarComPets(id) {
    const dono = db.prepare('SELECT * FROM donos WHERE id = ?').get(id)
    if (dono) {
      dono.pets = db.prepare('SELECT * FROM pets WHERE id_dono = ? ORDER BY nome').all(id)
    }
    return dono
  },

  editar(id, dados) {
    const stmt = db.prepare(`
      UPDATE donos
      SET nome = @nome, telefone = @telefone, email = @email, endereco = @endereco
      WHERE id = @id
    `)
    stmt.run({ ...dados, id })
    return donos.buscarPorId(id)
  },

  deletar(id) {
    return db.prepare('DELETE FROM donos WHERE id = ?').run(id)
  },

  total() {
    return db.prepare('SELECT COUNT(*) as total FROM donos').get()
  }
}

// ──────────────────────────────────────────────────────────
// PETS
// ──────────────────────────────────────────────────────────

const pets = {
  criar(dados) {
    const stmt = db.prepare(`
      INSERT INTO pets (id_dono, nome, especie, raca, data_nascimento, peso, foto, observacoes)
      VALUES (@id_dono, @nome, @especie, @raca, @data_nascimento, @peso, @foto, @observacoes)
    `)
    const result = stmt.run(dados)
    return { id: result.lastInsertRowid, ...dados }
  },

  listar() {
    return db.prepare(`
      SELECT p.*, d.nome as nome_dono, d.telefone as telefone_dono
      FROM pets p
      LEFT JOIN donos d ON p.id_dono = d.id
      ORDER BY p.nome COLLATE NOCASE
    `).all()
  },

  buscarPorId(id) {
    return db.prepare(`
      SELECT p.*, d.nome as nome_dono, d.telefone as telefone_dono, d.email as email_dono
      FROM pets p
      LEFT JOIN donos d ON p.id_dono = d.id
      WHERE p.id = ?
    `).get(id)
  },

  buscarPorDono(id_dono) {
    return db.prepare('SELECT * FROM pets WHERE id_dono = ? ORDER BY nome').all(id_dono)
  },

  buscarPorNome(nome) {
    return db.prepare(`
      SELECT p.*, d.nome as nome_dono
      FROM pets p
      LEFT JOIN donos d ON p.id_dono = d.id
      WHERE p.nome LIKE ?
      ORDER BY p.nome
    `).all(`%${nome}%`)
  },

  editar(id, dados) {
    const stmt = db.prepare(`
      UPDATE pets
      SET id_dono = @id_dono, nome = @nome, especie = @especie, raca = @raca,
          data_nascimento = @data_nascimento, peso = @peso, foto = @foto, observacoes = @observacoes
      WHERE id = @id
    `)
    stmt.run({ ...dados, id })
    return pets.buscarPorId(id)
  },

  deletar(id) {
    return db.prepare('DELETE FROM pets WHERE id = ?').run(id)
  },

  total() {
    return db.prepare('SELECT COUNT(*) as total FROM pets').get()
  }
}

// ──────────────────────────────────────────────────────────
// AGENDAMENTOS
// ──────────────────────────────────────────────────────────

const agendamentos = {
  criar(dados) {
    const stmt = db.prepare(`
      INSERT INTO agendamentos (id_pet, servico, data, hora, status, valor, observacoes)
      VALUES (@id_pet, @servico, @data, @hora, @status, @valor, @observacoes)
    `)
    const result = stmt.run({
      status: 'agendado', // status padrão
      valor: null,
      observacoes: null,
      ...dados
    })
    return { id: result.lastInsertRowid, ...dados }
  },

  listar() {
    return db.prepare(`
      SELECT a.*, p.nome as nome_pet, p.especie, p.raca,
             d.nome as nome_dono, d.telefone as telefone_dono
      FROM agendamentos a
      LEFT JOIN pets p ON a.id_pet = p.id
      LEFT JOIN donos d ON p.id_dono = d.id
      ORDER BY a.data DESC, a.hora ASC
    `).all()
  },

  buscarPorId(id) {
    return db.prepare(`
      SELECT a.*, p.nome as nome_pet, p.especie,
             d.nome as nome_dono, d.telefone as telefone_dono
      FROM agendamentos a
      LEFT JOIN pets p ON a.id_pet = p.id
      LEFT JOIN donos d ON p.id_dono = d.id
      WHERE a.id = ?
    `).get(id)
  },

  buscarPorData(data) {
    return db.prepare(`
      SELECT a.*, p.nome as nome_pet, p.especie,
             d.nome as nome_dono, d.telefone as telefone_dono
      FROM agendamentos a
      LEFT JOIN pets p ON a.id_pet = p.id
      LEFT JOIN donos d ON p.id_dono = d.id
      WHERE a.data = ?
      ORDER BY a.hora ASC
    `).all(data)
  },

  buscarPorStatus(status) {
    return db.prepare(`
      SELECT a.*, p.nome as nome_pet, d.nome as nome_dono
      FROM agendamentos a
      LEFT JOIN pets p ON a.id_pet = p.id
      LEFT JOIN donos d ON p.id_dono = d.id
      WHERE a.status = ?
      ORDER BY a.data ASC, a.hora ASC
    `).all(status)
  },

  // Agendamentos dos próximos 7 dias
  proximos() {
    return db.prepare(`
      SELECT a.*, p.nome as nome_pet, d.nome as nome_dono, d.telefone as telefone_dono
      FROM agendamentos a
      LEFT JOIN pets p ON a.id_pet = p.id
      LEFT JOIN donos d ON p.id_dono = d.id
      WHERE a.data BETWEEN date('now') AND date('now', '+7 days')
        AND a.status = 'agendado'
      ORDER BY a.data ASC, a.hora ASC
    `).all()
  },

  atualizarStatus(id, status) {
    db.prepare('UPDATE agendamentos SET status = ? WHERE id = ?').run(status, id)
    return agendamentos.buscarPorId(id)
  },

  editar(id, dados) {
    const stmt = db.prepare(`
      UPDATE agendamentos
      SET id_pet = @id_pet, servico = @servico, data = @data, hora = @hora,
          status = @status, valor = @valor, observacoes = @observacoes
      WHERE id = @id
    `)
    stmt.run({ ...dados, id })
    return agendamentos.buscarPorId(id)
  },

  deletar(id) {
    return db.prepare('DELETE FROM agendamentos WHERE id = ?').run(id)
  },

  total() {
    return db.prepare("SELECT COUNT(*) as total FROM agendamentos WHERE status = 'agendado'").get()
  }
}

// ──────────────────────────────────────────────────────────
// VACINAS
// ──────────────────────────────────────────────────────────

const vacinas = {
  criar(dados) {
    const stmt = db.prepare(`
      INSERT INTO vacinas (id_pet, nome_vacina, data_aplicacao, data_proximo_reforco, observacoes)
      VALUES (@id_pet, @nome_vacina, @data_aplicacao, @data_proximo_reforco, @observacoes)
    `)
    const result = stmt.run(dados)
    return { id: result.lastInsertRowid, ...dados }
  },

  listar() {
    return db.prepare(`
      SELECT v.*, p.nome as nome_pet, p.especie, d.nome as nome_dono
      FROM vacinas v
      LEFT JOIN pets p ON v.id_pet = p.id
      LEFT JOIN donos d ON p.id_dono = d.id
      ORDER BY v.data_aplicacao DESC
    `).all()
  },

  buscarPorPet(id_pet) {
    return db.prepare(`
      SELECT * FROM vacinas WHERE id_pet = ? ORDER BY data_aplicacao DESC
    `).all(id_pet)
  },

  // Vacinas com reforço nos próximos 30 dias (alerta!)
  reforcosPendentes() {
    return db.prepare(`
      SELECT v.*, p.nome as nome_pet, d.nome as nome_dono, d.telefone as telefone_dono
      FROM vacinas v
      LEFT JOIN pets p ON v.id_pet = p.id
      LEFT JOIN donos d ON p.id_dono = d.id
      WHERE v.data_proximo_reforco BETWEEN date('now') AND date('now', '+30 days')
      ORDER BY v.data_proximo_reforco ASC
    `).all()
  },

  editar(id, dados) {
    const stmt = db.prepare(`
      UPDATE vacinas
      SET nome_vacina = @nome_vacina, data_aplicacao = @data_aplicacao,
          data_proximo_reforco = @data_proximo_reforco, observacoes = @observacoes
      WHERE id = @id
    `)
    stmt.run({ ...dados, id })
    return db.prepare('SELECT * FROM vacinas WHERE id = ?').get(id)
  },

  deletar(id) {
    return db.prepare('DELETE FROM vacinas WHERE id = ?').run(id)
  }
}

// ──────────────────────────────────────────────────────────
// FINANCEIRO
// ──────────────────────────────────────────────────────────

const financeiro = {
  criar(dados) {
    const stmt = db.prepare(`
      INSERT INTO financeiro (id_agendamento, descricao, valor, tipo, data)
      VALUES (@id_agendamento, @descricao, @valor, @tipo, @data)
    `)
    const result = stmt.run({ id_agendamento: null, ...dados })
    return { id: result.lastInsertRowid, ...dados }
  },

  listar() {
    return db.prepare(`
      SELECT f.*, a.servico as servico_agendamento, p.nome as nome_pet
      FROM financeiro f
      LEFT JOIN agendamentos a ON f.id_agendamento = a.id
      LEFT JOIN pets p ON a.id_pet = p.id
      ORDER BY f.data DESC, f.criado_em DESC
    `).all()
  },

  buscarPorPeriodo(dataInicio, dataFim) {
    return db.prepare(`
      SELECT f.*, a.servico as servico_agendamento
      FROM financeiro f
      LEFT JOIN agendamentos a ON f.id_agendamento = a.id
      WHERE f.data BETWEEN ? AND ?
      ORDER BY f.data DESC
    `).all(dataInicio, dataFim)
  },

  // Resumo de um mês: total de receitas, despesas e saldo
  resumoMensal(ano, mes) {
    const periodo = `${ano}-${String(mes).padStart(2, '0')}`
    const rows = db.prepare(`
      SELECT tipo, SUM(valor) as total
      FROM financeiro
      WHERE strftime('%Y-%m', data) = ?
      GROUP BY tipo
    `).all(periodo)

    const receitas = rows.find(r => r.tipo === 'receita')?.total || 0
    const despesas = rows.find(r => r.tipo === 'despesa')?.total || 0
    return { receitas, despesas, saldo: receitas - despesas, periodo }
  },

  // Resumo dos últimos 6 meses para gráficos
  historicoMensal() {
    return db.prepare(`
      SELECT strftime('%Y-%m', data) as mes, tipo, SUM(valor) as total
      FROM financeiro
      WHERE data >= date('now', '-6 months')
      GROUP BY mes, tipo
      ORDER BY mes ASC
    `).all()
  },

  editar(id, dados) {
    const stmt = db.prepare(`
      UPDATE financeiro
      SET descricao = @descricao, valor = @valor, tipo = @tipo, data = @data
      WHERE id = @id
    `)
    stmt.run({ ...dados, id })
    return db.prepare('SELECT * FROM financeiro WHERE id = ?').get(id)
  },

  deletar(id) {
    return db.prepare('DELETE FROM financeiro WHERE id = ?').run(id)
  },

  // Total do mês atual (para o dashboard)
  totalMesAtual() {
    return db.prepare(`
      SELECT tipo, SUM(valor) as total
      FROM financeiro
      WHERE strftime('%Y-%m', data) = strftime('%Y-%m', 'now')
      GROUP BY tipo
    `).all()
  }
}

// ──────────────────────────────────────────────────────────
// HISTÓRICO DE PESO
// ──────────────────────────────────────────────────────────

const pesoHistorico = {
  registrar(dados) {
    const stmt = db.prepare(`
      INSERT INTO peso_historico (id_pet, peso, data, observacoes)
      VALUES (@id_pet, @peso, @data, @observacoes)
    `)
    const result = stmt.run(dados)
    return { id: result.lastInsertRowid, ...dados }
  },

  buscarPorPet(id_pet) {
    return db.prepare(`
      SELECT * FROM peso_historico WHERE id_pet = ? ORDER BY data ASC
    `).all(id_pet)
  },

  deletar(id) {
    return db.prepare('DELETE FROM peso_historico WHERE id = ?').run(id)
  }
}

// ──────────────────────────────────────────────────────────
// ESTOQUE
// ──────────────────────────────────────────────────────────

const estoque = {
  criar(dados) {
    const stmt = db.prepare(`
      INSERT INTO estoque (nome, categoria, quantidade, unidade, quantidade_min, preco_custo, preco_venda, observacoes)
      VALUES (@nome, @categoria, @quantidade, @unidade, @quantidade_min, @preco_custo, @preco_venda, @observacoes)
    `)
    const result = stmt.run(dados)
    return { id: result.lastInsertRowid, ...dados }
  },

  listar() {
    return db.prepare(`
      SELECT * FROM estoque ORDER BY nome COLLATE NOCASE
    `).all()
  },

  buscarPorId(id) {
    return db.prepare('SELECT * FROM estoque WHERE id = ?').get(id)
  },

  // Produtos com estoque abaixo do mínimo
  alertasBaixoEstoque() {
    return db.prepare(`
      SELECT * FROM estoque
      WHERE quantidade <= quantidade_min AND quantidade_min > 0
      ORDER BY (quantidade_min - quantidade) DESC
    `).all()
  },

  movimentar(id_produto, tipo, quantidade, motivo) {
    const op = tipo === 'entrada' ? '+' : '-'
    db.prepare(`
      UPDATE estoque
      SET quantidade = quantidade ${op} ?,
          atualizado_em = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(quantidade, id_produto)

    db.prepare(`
      INSERT INTO movimentacoes_estoque (id_produto, tipo, quantidade, motivo)
      VALUES (?, ?, ?, ?)
    `).run(id_produto, tipo, quantidade, motivo || null)

    return estoque.buscarPorId(id_produto)
  },

  historicoMovimentacoes(id_produto) {
    return db.prepare(`
      SELECT * FROM movimentacoes_estoque
      WHERE id_produto = ?
      ORDER BY criado_em DESC
      LIMIT 50
    `).all(id_produto)
  },

  editar(id, dados) {
    const stmt = db.prepare(`
      UPDATE estoque
      SET nome = @nome, categoria = @categoria, unidade = @unidade,
          quantidade_min = @quantidade_min, preco_custo = @preco_custo,
          preco_venda = @preco_venda, observacoes = @observacoes,
          atualizado_em = CURRENT_TIMESTAMP
      WHERE id = @id
    `)
    stmt.run({ ...dados, id })
    return estoque.buscarPorId(id)
  },

  deletar(id) {
    return db.prepare('DELETE FROM estoque WHERE id = ?').run(id)
  }
}

// ──────────────────────────────────────────────────────────
// VETERINÁRIOS
// ──────────────────────────────────────────────────────────

const veterinarios = {
  criar(dados) {
    const stmt = db.prepare(`
      INSERT INTO veterinarios (nome, crmv, especialidade, telefone, email, observacoes)
      VALUES (@nome, @crmv, @especialidade, @telefone, @email, @observacoes)
    `)
    const result = stmt.run(dados)
    return { id: result.lastInsertRowid, ...dados }
  },

  listar() {
    return db.prepare(`
      SELECT * FROM veterinarios ORDER BY nome COLLATE NOCASE
    `).all()
  },

  listarAtivos() {
    return db.prepare(`
      SELECT * FROM veterinarios WHERE ativo = 1 ORDER BY nome COLLATE NOCASE
    `).all()
  },

  buscarPorId(id) {
    return db.prepare('SELECT * FROM veterinarios WHERE id = ?').get(id)
  },

  editar(id, dados) {
    const stmt = db.prepare(`
      UPDATE veterinarios
      SET nome = @nome, crmv = @crmv, especialidade = @especialidade,
          telefone = @telefone, email = @email, observacoes = @observacoes,
          ativo = @ativo
      WHERE id = @id
    `)
    stmt.run({ ...dados, id })
    return veterinarios.buscarPorId(id)
  },

  alternarAtivo(id) {
    db.prepare('UPDATE veterinarios SET ativo = CASE WHEN ativo = 1 THEN 0 ELSE 1 END WHERE id = ?').run(id)
    return veterinarios.buscarPorId(id)
  },

  deletar(id) {
    return db.prepare('DELETE FROM veterinarios WHERE id = ?').run(id)
  },

  total() {
    return db.prepare('SELECT COUNT(*) as total FROM veterinarios WHERE ativo = 1').get()
  }
}

// ──────────────────────────────────────────────────────────
// CONSULTAS / PRONTUÁRIOS
// ──────────────────────────────────────────────────────────

const consultas = {
  criar(dados) {
    const stmt = db.prepare(`
      INSERT INTO consultas (
        id_pet, id_veterinario, id_agendamento, data, hora,
        queixa_principal, historico, peso, temperatura,
        freq_cardiaca, freq_respiratoria, mucosas, hidratacao, outros_exame,
        diagnostico_suspeita, diagnostico_definitivo, plano_terapeutico, retorno, observacoes
      ) VALUES (
        @id_pet, @id_veterinario, @id_agendamento, @data, @hora,
        @queixa_principal, @historico, @peso, @temperatura,
        @freq_cardiaca, @freq_respiratoria, @mucosas, @hidratacao, @outros_exame,
        @diagnostico_suspeita, @diagnostico_definitivo, @plano_terapeutico, @retorno, @observacoes
      )
    `)
    const result = stmt.run(dados)
    return consultas.buscarPorId(result.lastInsertRowid)
  },

  listar() {
    return db.prepare(`
      SELECT c.*,
        p.nome as nome_pet, p.especie, p.raca, p.foto as foto_pet,
        d.nome as nome_dono, d.telefone as telefone_dono,
        v.nome as nome_vet, v.crmv
      FROM consultas c
      LEFT JOIN pets p ON c.id_pet = p.id
      LEFT JOIN donos d ON p.id_dono = d.id
      LEFT JOIN veterinarios v ON c.id_veterinario = v.id
      ORDER BY c.data DESC, c.hora DESC
    `).all()
  },

  buscarPorId(id) {
    return db.prepare(`
      SELECT c.*,
        p.nome as nome_pet, p.especie, p.raca, p.foto as foto_pet,
        d.nome as nome_dono, d.telefone as telefone_dono,
        v.nome as nome_vet, v.crmv
      FROM consultas c
      LEFT JOIN pets p ON c.id_pet = p.id
      LEFT JOIN donos d ON p.id_dono = d.id
      LEFT JOIN veterinarios v ON c.id_veterinario = v.id
      WHERE c.id = ?
    `).get(id)
  },

  buscarPorPet(id_pet) {
    return db.prepare(`
      SELECT c.*,
        v.nome as nome_vet, v.crmv
      FROM consultas c
      LEFT JOIN veterinarios v ON c.id_veterinario = v.id
      WHERE c.id_pet = ?
      ORDER BY c.data DESC
    `).all(id_pet)
  },

  editar(id, dados) {
    const stmt = db.prepare(`
      UPDATE consultas SET
        id_veterinario = @id_veterinario,
        data = @data, hora = @hora,
        queixa_principal = @queixa_principal, historico = @historico,
        peso = @peso, temperatura = @temperatura,
        freq_cardiaca = @freq_cardiaca, freq_respiratoria = @freq_respiratoria,
        mucosas = @mucosas, hidratacao = @hidratacao, outros_exame = @outros_exame,
        diagnostico_suspeita = @diagnostico_suspeita,
        diagnostico_definitivo = @diagnostico_definitivo,
        plano_terapeutico = @plano_terapeutico, retorno = @retorno,
        observacoes = @observacoes
      WHERE id = @id
    `)
    stmt.run({ ...dados, id })
    return consultas.buscarPorId(id)
  },

  deletar(id) {
    return db.prepare('DELETE FROM consultas WHERE id = ?').run(id)
  },

  totalMes() {
    return db.prepare(`
      SELECT COUNT(*) as total FROM consultas
      WHERE strftime('%Y-%m', data) = strftime('%Y-%m', 'now')
    `).get()
  }
}

// ──────────────────────────────────────────────────────────
// INTERNAÇÕES
// ──────────────────────────────────────────────────────────

const internacoes = {
  criar(dados) {
    const stmt = db.prepare(`
      INSERT INTO internacoes (id_pet, id_veterinario, data_entrada, hora_entrada, motivo, status, observacoes)
      VALUES (@id_pet, @id_veterinario, @data_entrada, @hora_entrada, @motivo, @status, @observacoes)
    `)
    const result = stmt.run(dados)
    return internacoes.buscarPorId(result.lastInsertRowid)
  },

  listar() {
    return db.prepare(`
      SELECT i.*,
        p.nome as nome_pet, p.especie, p.raca, p.foto as foto_pet,
        d.nome as nome_dono, d.telefone as telefone_dono,
        v.nome as nome_vet, v.crmv,
        (SELECT COUNT(*) FROM evolucoes_internacao e WHERE e.id_internacao = i.id) as total_evolucoes
      FROM internacoes i
      LEFT JOIN pets p ON i.id_pet = p.id
      LEFT JOIN donos d ON p.id_dono = d.id
      LEFT JOIN veterinarios v ON i.id_veterinario = v.id
      ORDER BY CASE WHEN i.status = 'internado' THEN 0 ELSE 1 END, i.data_entrada DESC
    `).all()
  },

  buscarPorId(id) {
    return db.prepare(`
      SELECT i.*,
        p.nome as nome_pet, p.especie, p.raca, p.foto as foto_pet,
        d.nome as nome_dono, d.telefone as telefone_dono,
        v.nome as nome_vet, v.crmv
      FROM internacoes i
      LEFT JOIN pets p ON i.id_pet = p.id
      LEFT JOIN donos d ON p.id_dono = d.id
      LEFT JOIN veterinarios v ON i.id_veterinario = v.id
      WHERE i.id = ?
    `).get(id)
  },

  buscarPorPet(id_pet) {
    return db.prepare(`
      SELECT i.*, v.nome as nome_vet
      FROM internacoes i
      LEFT JOIN veterinarios v ON i.id_veterinario = v.id
      WHERE i.id_pet = ?
      ORDER BY i.data_entrada DESC
    `).all(id_pet)
  },

  ativas() {
    return db.prepare(`
      SELECT i.*,
        p.nome as nome_pet, p.especie, p.foto as foto_pet,
        d.nome as nome_dono,
        v.nome as nome_vet
      FROM internacoes i
      LEFT JOIN pets p ON i.id_pet = p.id
      LEFT JOIN donos d ON p.id_dono = d.id
      LEFT JOIN veterinarios v ON i.id_veterinario = v.id
      WHERE i.status = 'internado'
      ORDER BY i.data_entrada ASC
    `).all()
  },

  editar(id, dados) {
    const stmt = db.prepare(`
      UPDATE internacoes SET
        id_veterinario = @id_veterinario,
        data_entrada   = @data_entrada,
        hora_entrada   = @hora_entrada,
        motivo         = @motivo,
        observacoes    = @observacoes
      WHERE id = @id
    `)
    stmt.run({ ...dados, id })
    return internacoes.buscarPorId(id)
  },

  darAlta(id, dados) {
    db.prepare(`
      UPDATE internacoes SET
        status         = 'alta',
        data_alta      = @data_alta,
        hora_alta      = @hora_alta,
        condicao_saida = @condicao_saida
      WHERE id = @id
    `).run({ ...dados, id })
    return internacoes.buscarPorId(id)
  },

  deletar(id) {
    return db.prepare('DELETE FROM internacoes WHERE id = ?').run(id)
  },

  // ── Evoluções ─────────────────────────────────────────
  registrarEvolucao(dados) {
    const stmt = db.prepare(`
      INSERT INTO evolucoes_internacao (id_internacao, data, hora, temperatura, peso, alimentacao, medicacao, observacoes)
      VALUES (@id_internacao, @data, @hora, @temperatura, @peso, @alimentacao, @medicacao, @observacoes)
    `)
    const result = stmt.run(dados)
    return { id: result.lastInsertRowid, ...dados }
  },

  buscarEvolucoes(id_internacao) {
    return db.prepare(`
      SELECT * FROM evolucoes_internacao WHERE id_internacao = ? ORDER BY data DESC, hora DESC
    `).all(id_internacao)
  },

  deletarEvolucao(id) {
    return db.prepare('DELETE FROM evolucoes_internacao WHERE id = ?').run(id)
  }
}

// ──────────────────────────────────────────────────────────
// CIRURGIAS
// ──────────────────────────────────────────────────────────

const cirurgias = {
  criar(dados) {
    const stmt = db.prepare(`
      INSERT INTO cirurgias (
        id_pet, id_cirurgiao, id_anestesista, data, hora_inicio, hora_fim,
        tipo_cirurgia, asa, jejum, pre_medicacao, exames_pre_op,
        protocolo_anestesico, agente_anestesico, dose_anestesico, via_anestesica,
        intercorrencias, obs_trans_op, recuperacao, cuidados_pos, restricoes, retorno, observacoes
      ) VALUES (
        @id_pet, @id_cirurgiao, @id_anestesista, @data, @hora_inicio, @hora_fim,
        @tipo_cirurgia, @asa, @jejum, @pre_medicacao, @exames_pre_op,
        @protocolo_anestesico, @agente_anestesico, @dose_anestesico, @via_anestesica,
        @intercorrencias, @obs_trans_op, @recuperacao, @cuidados_pos, @restricoes, @retorno, @observacoes
      )
    `)
    const result = stmt.run(dados)
    return cirurgias.buscarPorId(result.lastInsertRowid)
  },

  listar() {
    return db.prepare(`
      SELECT c.*,
        p.nome as nome_pet, p.especie, p.raca, p.foto as foto_pet,
        d.nome as nome_dono, d.telefone as telefone_dono,
        v1.nome as nome_cirurgiao, v1.crmv as crmv_cirurgiao,
        v2.nome as nome_anestesista, v2.crmv as crmv_anestesista
      FROM cirurgias c
      LEFT JOIN pets p       ON c.id_pet         = p.id
      LEFT JOIN donos d      ON p.id_dono         = d.id
      LEFT JOIN veterinarios v1 ON c.id_cirurgiao  = v1.id
      LEFT JOIN veterinarios v2 ON c.id_anestesista = v2.id
      ORDER BY c.data DESC, c.hora_inicio DESC
    `).all()
  },

  buscarPorId(id) {
    return db.prepare(`
      SELECT c.*,
        p.nome as nome_pet, p.especie, p.raca, p.foto as foto_pet,
        d.nome as nome_dono, d.telefone as telefone_dono,
        v1.nome as nome_cirurgiao, v1.crmv as crmv_cirurgiao,
        v2.nome as nome_anestesista, v2.crmv as crmv_anestesista
      FROM cirurgias c
      LEFT JOIN pets p          ON c.id_pet          = p.id
      LEFT JOIN donos d         ON p.id_dono          = d.id
      LEFT JOIN veterinarios v1 ON c.id_cirurgiao     = v1.id
      LEFT JOIN veterinarios v2 ON c.id_anestesista   = v2.id
      WHERE c.id = ?
    `).get(id)
  },

  buscarPorPet(id_pet) {
    return db.prepare(`
      SELECT c.*,
        v1.nome as nome_cirurgiao,
        v2.nome as nome_anestesista
      FROM cirurgias c
      LEFT JOIN veterinarios v1 ON c.id_cirurgiao   = v1.id
      LEFT JOIN veterinarios v2 ON c.id_anestesista = v2.id
      WHERE c.id_pet = ?
      ORDER BY c.data DESC
    `).all(id_pet)
  },

  editar(id, dados) {
    const stmt = db.prepare(`
      UPDATE cirurgias SET
        id_cirurgiao         = @id_cirurgiao,
        id_anestesista       = @id_anestesista,
        data                 = @data,
        hora_inicio          = @hora_inicio,
        hora_fim             = @hora_fim,
        tipo_cirurgia        = @tipo_cirurgia,
        asa                  = @asa,
        jejum                = @jejum,
        pre_medicacao        = @pre_medicacao,
        exames_pre_op        = @exames_pre_op,
        protocolo_anestesico = @protocolo_anestesico,
        agente_anestesico    = @agente_anestesico,
        dose_anestesico      = @dose_anestesico,
        via_anestesica       = @via_anestesica,
        intercorrencias      = @intercorrencias,
        obs_trans_op         = @obs_trans_op,
        recuperacao          = @recuperacao,
        cuidados_pos         = @cuidados_pos,
        restricoes           = @restricoes,
        retorno              = @retorno,
        observacoes          = @observacoes
      WHERE id = @id
    `)
    stmt.run({ ...dados, id })
    return cirurgias.buscarPorId(id)
  },

  deletar(id) {
    return db.prepare('DELETE FROM cirurgias WHERE id = ?').run(id)
  },

  totalMes() {
    return db.prepare(`
      SELECT COUNT(*) as total FROM cirurgias
      WHERE strftime('%Y-%m', data) = strftime('%Y-%m', 'now')
    `).get()
  }
}

// ──────────────────────────────────────────────────────────
// PRESCRIÇÕES / RECEITUÁRIO
// ──────────────────────────────────────────────────────────

const prescricoes = {
  criar(dados) {
    const { itens, ...prescricao } = dados
    const stmt = db.prepare(`
      INSERT INTO prescricoes (id_pet, id_veterinario, id_consulta, data, observacoes)
      VALUES (@id_pet, @id_veterinario, @id_consulta, @data, @observacoes)
    `)
    const result = stmt.run(prescricao)
    const id = result.lastInsertRowid

    if (itens && itens.length > 0) {
      const stmtItem = db.prepare(`
        INSERT INTO itens_prescricao (id_prescricao, medicamento, concentracao, forma, dose, frequencia, duracao, via, observacoes)
        VALUES (@id_prescricao, @medicamento, @concentracao, @forma, @dose, @frequencia, @duracao, @via, @observacoes)
      `)
      for (const item of itens) {
        stmtItem.run({ ...item, id_prescricao: id })
      }
    }

    return prescricoes.buscarPorId(id)
  },

  listar() {
    const lista = db.prepare(`
      SELECT pr.*,
        p.nome as nome_pet, p.especie, p.raca, p.foto as foto_pet,
        d.nome as nome_dono, d.telefone as telefone_dono, d.endereco as endereco_dono,
        v.nome as nome_vet, v.crmv, v.especialidade as especialidade_vet,
        (SELECT COUNT(*) FROM itens_prescricao i WHERE i.id_prescricao = pr.id) as total_itens
      FROM prescricoes pr
      LEFT JOIN pets p       ON pr.id_pet         = p.id
      LEFT JOIN donos d      ON p.id_dono          = d.id
      LEFT JOIN veterinarios v ON pr.id_veterinario = v.id
      ORDER BY pr.data DESC, pr.criado_em DESC
    `).all()
    return lista
  },

  buscarPorId(id) {
    const prescricao = db.prepare(`
      SELECT pr.*,
        p.nome as nome_pet, p.especie, p.raca, p.foto as foto_pet,
        d.nome as nome_dono, d.telefone as telefone_dono, d.endereco as endereco_dono,
        v.nome as nome_vet, v.crmv, v.especialidade as especialidade_vet, v.telefone as telefone_vet
      FROM prescricoes pr
      LEFT JOIN pets p         ON pr.id_pet          = p.id
      LEFT JOIN donos d        ON p.id_dono           = d.id
      LEFT JOIN veterinarios v ON pr.id_veterinario   = v.id
      WHERE pr.id = ?
    `).get(id)

    if (prescricao) {
      prescricao.itens = db.prepare(
        'SELECT * FROM itens_prescricao WHERE id_prescricao = ? ORDER BY id'
      ).all(id)
    }

    return prescricao
  },

  buscarPorPet(id_pet) {
    return db.prepare(`
      SELECT pr.*,
        v.nome as nome_vet, v.crmv,
        (SELECT COUNT(*) FROM itens_prescricao i WHERE i.id_prescricao = pr.id) as total_itens
      FROM prescricoes pr
      LEFT JOIN veterinarios v ON pr.id_veterinario = v.id
      WHERE pr.id_pet = ?
      ORDER BY pr.data DESC
    `).all(id_pet)
  },

  editar(id, dados) {
    const { itens, ...prescricao } = dados

    db.prepare(`
      UPDATE prescricoes SET
        id_veterinario = @id_veterinario,
        id_consulta    = @id_consulta,
        data           = @data,
        observacoes    = @observacoes
      WHERE id = @id
    `).run({ ...prescricao, id })

    // Remove itens antigos e reinsere
    db.prepare('DELETE FROM itens_prescricao WHERE id_prescricao = ?').run(id)
    if (itens && itens.length > 0) {
      const stmtItem = db.prepare(`
        INSERT INTO itens_prescricao (id_prescricao, medicamento, concentracao, forma, dose, frequencia, duracao, via, observacoes)
        VALUES (@id_prescricao, @medicamento, @concentracao, @forma, @dose, @frequencia, @duracao, @via, @observacoes)
      `)
      for (const item of itens) {
        stmtItem.run({ ...item, id_prescricao: id })
      }
    }

    return prescricoes.buscarPorId(id)
  },

  deletar(id) {
    return db.prepare('DELETE FROM prescricoes WHERE id = ?').run(id)
  },

  totalMes() {
    return db.prepare(`
      SELECT COUNT(*) as total FROM prescricoes
      WHERE strftime('%Y-%m', data) = strftime('%Y-%m', 'now')
    `).get()
  }
}

// ──────────────────────────────────────────────────────────
// CONFIGURAÇÕES DO SISTEMA (Admin)
// ──────────────────────────────────────────────────────────

const configuracoes = {
  get(chave) {
    return db.prepare('SELECT valor FROM configuracoes WHERE chave = ?').get(chave)?.valor ?? null
  },

  set(chave, valor) {
    return db.prepare('INSERT OR REPLACE INTO configuracoes (chave, valor) VALUES (?, ?)').run(chave, String(valor ?? ''))
  },

  getAll() {
    const rows = db.prepare('SELECT chave, valor FROM configuracoes').all()
    const obj = {}
    for (const r of rows) obj[r.chave] = r.valor
    return obj
  },

  stats() {
    let dbSize = 0
    try { dbSize = fs.statSync(dbPath).size } catch {}
    return {
      donos:        db.prepare('SELECT COUNT(*) as n FROM donos').get().n,
      pets:         db.prepare('SELECT COUNT(*) as n FROM pets').get().n,
      agendamentos: db.prepare('SELECT COUNT(*) as n FROM agendamentos').get().n,
      vacinas:      db.prepare('SELECT COUNT(*) as n FROM vacinas').get().n,
      consultas:    db.prepare('SELECT COUNT(*) as n FROM consultas').get().n,
      internacoes:  db.prepare('SELECT COUNT(*) as n FROM internacoes').get().n,
      cirurgias:    db.prepare('SELECT COUNT(*) as n FROM cirurgias').get().n,
      prescricoes:  db.prepare('SELECT COUNT(*) as n FROM prescricoes').get().n,
      estoque:      db.prepare('SELECT COUNT(*) as n FROM estoque').get().n,
      financeiro:   db.prepare('SELECT COUNT(*) as n FROM financeiro').get().n,
      veterinarios: db.prepare('SELECT COUNT(*) as n FROM veterinarios').get().n,
      dbSize,
      dbPath: dbPath || '',
    }
  },

  resetar() {
    const tabelas = [
      'itens_prescricao', 'prescricoes', 'evolucoes_internacao', 'internacoes',
      'cirurgias', 'consultas', 'movimentacoes_estoque', 'estoque',
      'financeiro', 'peso_historico', 'vacinas', 'agendamentos',
      'pets', 'donos', 'veterinarios',
    ]
    for (const t of tabelas) db.prepare(`DELETE FROM ${t}`).run()
    return { ok: true }
  },
}

// ──────────────────────────────────────────────────────────
// EXAMES
// ──────────────────────────────────────────────────────────

const exames = {
  criar(dados) {
    const stmt = db.prepare(`
      INSERT INTO exames (id_pet, tipo, data_coleta, laboratorio, veterinario, resultado, observacoes, arquivo_path, arquivo_nome)
      VALUES (@id_pet, @tipo, @data_coleta, @laboratorio, @veterinario, @resultado, @observacoes, @arquivo_path, @arquivo_nome)
    `)
    const result = stmt.run(dados)
    return exames.buscarPorId(result.lastInsertRowid)
  },

  buscarPorId(id) {
    return db.prepare('SELECT * FROM exames WHERE id = ?').get(id)
  },

  buscarPorPet(id_pet) {
    return db.prepare(`
      SELECT * FROM exames WHERE id_pet = ? ORDER BY data_coleta DESC, criado_em DESC
    `).all(id_pet)
  },

  listar() {
    return db.prepare(`
      SELECT e.*, p.nome as nome_pet, d.nome as nome_dono
      FROM exames e
      LEFT JOIN pets p ON e.id_pet = p.id
      LEFT JOIN donos d ON p.id_dono = d.id
      ORDER BY e.data_coleta DESC, e.criado_em DESC
    `).all()
  },

  editar(id, dados) {
    db.prepare(`
      UPDATE exames SET
        tipo         = @tipo,
        data_coleta  = @data_coleta,
        laboratorio  = @laboratorio,
        veterinario  = @veterinario,
        resultado    = @resultado,
        observacoes  = @observacoes,
        arquivo_path = @arquivo_path,
        arquivo_nome = @arquivo_nome
      WHERE id = @id
    `).run({ ...dados, id })
    return exames.buscarPorId(id)
  },

  deletar(id) {
    return db.prepare('DELETE FROM exames WHERE id = ?').run(id)
  },
}

// ──────────────────────────────────────────────────────────
// VENDAS (PDV)
// ──────────────────────────────────────────────────────────

const vendas = {
  // Cria venda, reduz estoque e lança no financeiro — tudo em transação atômica
  // ATENÇÃO: db.transaction() é criado dentro do método para evitar chamada com db=null no carregamento do módulo
  criar(dados) {
    return db.transaction(function(d) {
      // d: { id_pet, id_dono, itens, total, desconto, total_final, observacoes }
      const resVenda = db.prepare(`
        INSERT INTO vendas (id_pet, id_dono, status, total, desconto, total_final, observacoes, nome_cliente)
        VALUES (@id_pet, @id_dono, 'concluida', @total, @desconto, @total_final, @observacoes, @nome_cliente)
      `).run({
        id_pet:       d.id_pet       || null,
        id_dono:      d.id_dono      || null,
        total:        d.total,
        desconto:     d.desconto     || 0,
        total_final:  d.total_final,
        observacoes:  d.observacoes  || null,
        nome_cliente: d.nome_cliente || null,
      })
      const id_venda = resVenda.lastInsertRowid

      // Inserir itens e dar baixa no estoque
      for (const item of d.itens) {
        db.prepare(`
          INSERT INTO itens_venda (id_venda, id_produto, nome_produto, quantidade, preco_unit, subtotal)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(id_venda, item.id_produto, item.nome_produto, item.quantidade, item.preco_unit, item.subtotal)

        db.prepare(`UPDATE estoque SET quantidade = quantidade - ? WHERE id = ?`).run(item.quantidade, item.id_produto)

        db.prepare(`
          INSERT INTO movimentacoes_estoque (id_produto, tipo, quantidade, motivo)
          VALUES (?, 'saida', ?, ?)
        `).run(item.id_produto, item.quantidade, `Venda #${id_venda}`)
      }

      const hoje = new Date().toISOString().split('T')[0]
      const tipoPgto = d.tipo_pagamento || 'vista'

      // Atualizar tipo_pagamento na venda
      db.prepare(`UPDATE vendas SET tipo_pagamento = ? WHERE id = ?`).run(tipoPgto, id_venda)

      if (tipoPgto === 'vista') {
        // À vista: lança no financeiro imediatamente
        const resF = db.prepare(`
          INSERT INTO financeiro (descricao, valor, tipo, data)
          VALUES (?, ?, 'receita', ?)
        `).run(`Venda #${id_venda}`, d.total_final, hoje)
        db.prepare(`UPDATE vendas SET id_financeiro = ? WHERE id = ?`).run(resF.lastInsertRowid, id_venda)
      } else {
        // A prazo: cria conta a receber (fiado)
        const resCR = db.prepare(`
          INSERT INTO contas_receber (id_dono, descricao, valor_total, valor_pago, data_emissao, data_vencimento, status, origem, id_venda)
          VALUES (?, ?, ?, 0, ?, ?, 'pendente', 'venda', ?)
        `).run(d.id_dono || null, `Venda #${id_venda}`, d.total_final, hoje, d.data_vencimento || null, id_venda)
        db.prepare(`UPDATE vendas SET id_conta_receber = ? WHERE id = ?`).run(resCR.lastInsertRowid, id_venda)
      }

      // Retornar a venda com itens (não usa vendas.buscarPorId para evitar aninhamento de transação)
      const venda = db.prepare(`
        SELECT v.*, p.nome AS nome_pet, dono.nome AS nome_dono
        FROM vendas v
        LEFT JOIN pets  p    ON v.id_pet  = p.id
        LEFT JOIN donos dono ON v.id_dono = dono.id
        WHERE v.id = ?
      `).get(id_venda)
      venda.itens = db.prepare(`SELECT * FROM itens_venda WHERE id_venda = ?`).all(id_venda)
      return venda
    })(dados)
  },

  listar() {
    return db.prepare(`
      SELECT v.*,
             p.nome  AS nome_pet,
             d.nome  AS nome_dono,
             d.telefone AS telefone_dono
      FROM vendas v
      LEFT JOIN pets  p ON v.id_pet  = p.id
      LEFT JOIN donos d ON v.id_dono = d.id
      ORDER BY v.criado_em DESC
    `).all()
  },

  buscarPorId(id) {
    const venda = db.prepare(`
      SELECT v.*,
             p.nome  AS nome_pet,
             d.nome  AS nome_dono
      FROM vendas v
      LEFT JOIN pets  p ON v.id_pet  = p.id
      LEFT JOIN donos d ON v.id_dono = d.id
      WHERE v.id = ?
    `).get(id)
    if (!venda) return null
    venda.itens = db.prepare(`SELECT * FROM itens_venda WHERE id_venda = ?`).all(id)
    return venda
  },

  // Cancela ou reverte: restaura estoque e remove do financeiro
  cancelar(id, motivo = 'cancelada') {
    return db.transaction(function(id, motivo) {
      // Busca venda e itens diretamente (evita aninhamento de transação)
      const venda = db.prepare(`SELECT * FROM vendas WHERE id = ?`).get(id)
      if (!venda) throw new Error('Venda não encontrada')
      if (venda.status !== 'concluida') throw new Error('Venda já foi cancelada ou devolvida')
      const itens = db.prepare(`SELECT * FROM itens_venda WHERE id_venda = ?`).all(id)

      // Restaurar estoque
      for (const item of itens) {
        db.prepare(`UPDATE estoque SET quantidade = quantidade + ? WHERE id = ?`).run(item.quantidade, item.id_produto)
        db.prepare(`
          INSERT INTO movimentacoes_estoque (id_produto, tipo, quantidade, motivo)
          VALUES (?, 'entrada', ?, ?)
        `).run(item.id_produto, item.quantidade, `${motivo === 'devolvida' ? 'Devolução' : 'Cancelamento'} Venda #${id}`)
      }

      // Remover do financeiro
      if (venda.id_financeiro) {
        db.prepare(`DELETE FROM financeiro WHERE id = ?`).run(venda.id_financeiro)
      }

      // Atualizar status da venda
      db.prepare(`UPDATE vendas SET status = ?, id_financeiro = NULL WHERE id = ?`).run(motivo, id)
      return { ok: true }
    })(id, motivo)
  },

  totalMes() {
    const row = db.prepare(`
      SELECT COUNT(*) as total, COALESCE(SUM(total_final), 0) as receita
      FROM vendas
      WHERE status = 'concluida'
        AND strftime('%Y-%m', criado_em) = strftime('%Y-%m', 'now')
    `).get()
    return row
  },
}

// ──────────────────────────────────────────────────────────
// CONTAS A RECEBER (FIADO)
// ──────────────────────────────────────────────────────────

const contasReceber = {

  criar(dados) {
    const hoje = new Date().toISOString().slice(0, 10)
    const res = db.prepare(`
      INSERT INTO contas_receber
        (id_dono, descricao, valor_total, valor_pago, data_emissao, data_vencimento, status, origem, id_venda, id_agendamento, observacoes)
      VALUES
        (@id_dono, @descricao, @valor_total, 0, @data_emissao, @data_vencimento, 'pendente', @origem, @id_venda, @id_agendamento, @observacoes)
    `).run({
      data_emissao:    hoje,
      origem:          'manual',
      id_venda:        null,
      id_agendamento:  null,
      observacoes:     null,
      data_vencimento: null,
      ...dados,
    })
    return contasReceber.buscarPorId(res.lastInsertRowid)
  },

  buscarPorId(id) {
    return db.prepare(`
      SELECT cr.*, d.nome AS nome_cliente, d.telefone AS telefone_cliente
      FROM contas_receber cr
      LEFT JOIN donos d ON cr.id_dono = d.id
      WHERE cr.id = ?
    `).get(id)
  },

  _atualizarAtrasados() {
    const hoje = new Date().toISOString().slice(0, 10)
    db.prepare(`
      UPDATE contas_receber SET status = 'atrasado'
      WHERE status = 'pendente' AND data_vencimento IS NOT NULL AND data_vencimento < ?
    `).run(hoje)
  },

  listar(filtro = 'todos') {
    contasReceber._atualizarAtrasados()
    const hoje = new Date().toISOString().slice(0, 10)
    const wheres = {
      pendente: "WHERE cr.status = 'pendente'",
      atrasado: "WHERE cr.status = 'atrasado'",
      pago:     "WHERE cr.status = 'pago'",
      aberto:   "WHERE cr.status IN ('pendente','atrasado')",
      hoje:     `WHERE cr.data_emissao = '${hoje}'`,
    }
    const where = wheres[filtro] || ''
    return db.prepare(`
      SELECT cr.*, d.nome AS nome_cliente, d.telefone AS telefone_cliente
      FROM contas_receber cr
      LEFT JOIN donos d ON cr.id_dono = d.id
      ${where}
      ORDER BY
        CASE cr.status WHEN 'atrasado' THEN 0 WHEN 'pendente' THEN 1 ELSE 2 END,
        cr.data_vencimento ASC
    `).all()
  },

  buscarPorCliente(id_dono) {
    contasReceber._atualizarAtrasados()
    return db.prepare(`
      SELECT * FROM contas_receber WHERE id_dono = ? ORDER BY criado_em DESC
    `).all(id_dono)
  },

  registrarPagamento(id_conta, valor, observacoes) {
    return db.transaction(() => {
      const conta = contasReceber.buscarPorId(id_conta)
      if (!conta) throw new Error('Conta não encontrada')
      const hoje     = new Date().toISOString().slice(0, 10)
      const novoPago = Number(conta.valor_pago) + Number(valor)
      const quitou   = novoPago >= conta.valor_total

      db.prepare(`
        INSERT INTO pagamentos_fiado (id_conta, valor, data, observacoes)
        VALUES (?, ?, ?, ?)
      `).run(id_conta, valor, hoje, observacoes || null)

      const novoStatus = quitou ? 'pago' : (conta.status === 'atrasado' ? 'atrasado' : 'pendente')
      db.prepare(`UPDATE contas_receber SET valor_pago = ?, status = ? WHERE id = ?`)
        .run(novoPago, novoStatus, id_conta)

      // Só entra no financeiro quando quitado completamente
      if (quitou) {
        db.prepare(`
          INSERT INTO financeiro (descricao, valor, tipo, data)
          VALUES (?, ?, 'receita', ?)
        `).run(conta.descricao, conta.valor_total, hoje)
      }

      return contasReceber.buscarPorId(id_conta)
    })()
  },

  buscarPagamentos(id_conta) {
    return db.prepare(`
      SELECT * FROM pagamentos_fiado WHERE id_conta = ? ORDER BY data DESC, criado_em DESC
    `).all(id_conta)
  },

  totalEmAberto() {
    contasReceber._atualizarAtrasados()
    return db.prepare(`
      SELECT
        COUNT(*)                                                              AS total_contas,
        COALESCE(SUM(valor_total - valor_pago), 0)                           AS total_aberto,
        COUNT(CASE WHEN status = 'atrasado' THEN 1 END)                      AS total_atrasados,
        COALESCE(SUM(CASE WHEN status = 'atrasado' THEN valor_total - valor_pago ELSE 0 END), 0) AS valor_atrasado
      FROM contas_receber WHERE status != 'pago'
    `).get()
  },

  deletar(id) {
    return db.prepare('DELETE FROM contas_receber WHERE id = ?').run(id)
  },
}

// ──────────────────────────────────────────────────────────
// PLANOS
// ──────────────────────────────────────────────────────────

const planos = {

  // ── Tipos de plano ──────────────────────────────────────

  criarTipo(dados) {
    return db.transaction(function(d) {
      const res = db.prepare(`
        INSERT INTO plano_tipos (nome, descricao, valor) VALUES (@nome, @descricao, @valor)
      `).run(d)
      const id = res.lastInsertRowid
      for (const item of (d.itens || [])) {
        db.prepare(`INSERT INTO plano_tipo_itens (id_plano_tipo, servico, quantidade) VALUES (?, ?, ?)`)
          .run(id, item.servico, item.quantidade)
      }
      return planos.buscarTipoPorId(id)
    })(dados)
  },

  listarTipos() {
    const tipos = db.prepare('SELECT * FROM plano_tipos ORDER BY nome').all()
    for (const t of tipos) {
      t.itens = db.prepare('SELECT * FROM plano_tipo_itens WHERE id_plano_tipo = ?').all(t.id)
    }
    return tipos
  },

  buscarTipoPorId(id) {
    const t = db.prepare('SELECT * FROM plano_tipos WHERE id = ?').get(id)
    if (t) t.itens = db.prepare('SELECT * FROM plano_tipo_itens WHERE id_plano_tipo = ?').all(t.id)
    return t
  },

  editarTipo(id, dados) {
    return db.transaction(function(d) {
      db.prepare(`UPDATE plano_tipos SET nome = @nome, descricao = @descricao, valor = @valor, ativo = @ativo WHERE id = @id`)
        .run({ ...d, id })
      db.prepare('DELETE FROM plano_tipo_itens WHERE id_plano_tipo = ?').run(id)
      for (const item of (d.itens || [])) {
        db.prepare('INSERT INTO plano_tipo_itens (id_plano_tipo, servico, quantidade) VALUES (?, ?, ?)')
          .run(id, item.servico, item.quantidade)
      }
      return planos.buscarTipoPorId(id)
    })(dados)
  },

  deletarTipo(id) {
    return db.prepare('DELETE FROM plano_tipos WHERE id = ?').run(id)
  },

  // ── Assinaturas ─────────────────────────────────────────

  criarAssinatura(dados) {
    return db.transaction(function(d) {
      const res = db.prepare(`
        INSERT INTO plano_assinaturas (id_dono, id_pet, id_plano_tipo, data_inicio, dia_vencimento, observacoes)
        VALUES (@id_dono, @id_pet, @id_plano_tipo, @data_inicio, @dia_vencimento, @observacoes)
      `).run(d)
      const id = res.lastInsertRowid
      const tipo = planos.buscarTipoPorId(d.id_plano_tipo)
      const hoje = new Date()
      const ano = hoje.getFullYear()
      const mes = hoje.getMonth() + 1
      const competencia = `${ano}-${String(mes).padStart(2, '0')}`
      const diaVenc = Math.min(d.dia_vencimento, new Date(ano, mes, 0).getDate())
      const dataVenc = `${ano}-${String(mes).padStart(2, '0')}-${String(diaVenc).padStart(2, '0')}`
      db.prepare(`INSERT INTO plano_ciclos (id_assinatura, competencia, data_vencimento, valor, status) VALUES (?, ?, ?, ?, 'pendente')`)
        .run(id, competencia, dataVenc, tipo.valor)
      return planos.buscarAssinaturaPorId(id)
    })(dados)
  },

  listarAssinaturas() {
    return db.prepare(`
      SELECT a.*, d.nome as nome_dono, d.telefone as telefone_dono,
             p.nome as nome_pet, p.especie, t.nome as nome_plano, t.valor as valor_plano
      FROM plano_assinaturas a
      JOIN donos d ON a.id_dono = d.id
      LEFT JOIN pets p ON a.id_pet = p.id
      JOIN plano_tipos t ON a.id_plano_tipo = t.id
      ORDER BY a.criado_em DESC
    `).all()
  },

  buscarAssinaturaPorId(id) {
    const a = db.prepare(`
      SELECT a.*, d.nome as nome_dono, d.telefone as telefone_dono,
             p.nome as nome_pet, p.especie, t.nome as nome_plano, t.valor as valor_plano
      FROM plano_assinaturas a
      JOIN donos d ON a.id_dono = d.id
      LEFT JOIN pets p ON a.id_pet = p.id
      JOIN plano_tipos t ON a.id_plano_tipo = t.id
      WHERE a.id = ?
    `).get(id)
    if (a) {
      a.ciclos = planos.listarCiclosPorAssinatura(id)
      a.tipo = planos.buscarTipoPorId(a.id_plano_tipo)
    }
    return a
  },

  alterarStatus(id, status) {
    db.prepare('UPDATE plano_assinaturas SET status = ? WHERE id = ?').run(status, id)
    return planos.buscarAssinaturaPorId(id)
  },

  deletarAssinatura(id) {
    return db.prepare('DELETE FROM plano_assinaturas WHERE id = ?').run(id)
  },

  // ── Ciclos ──────────────────────────────────────────────

  listarCiclosPorAssinatura(id_assinatura) {
    return db.prepare(`
      SELECT c.*, (SELECT COUNT(*) FROM plano_usos u WHERE u.id_ciclo = c.id) as total_usos
      FROM plano_ciclos c WHERE c.id_assinatura = ? ORDER BY c.competencia DESC
    `).all(id_assinatura)
  },

  cicloAtual(id_assinatura) {
    const hoje = new Date()
    const competencia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
    return db.prepare('SELECT * FROM plano_ciclos WHERE id_assinatura = ? AND competencia = ?')
      .get(id_assinatura, competencia)
  },

  confirmarPagamento(id_ciclo) {
    return db.transaction(function() {
      const ciclo = db.prepare('SELECT * FROM plano_ciclos WHERE id = ?').get(id_ciclo)
      const assin = db.prepare('SELECT * FROM plano_assinaturas WHERE id = ?').get(ciclo.id_assinatura)
      const tipo = planos.buscarTipoPorId(assin.id_plano_tipo)
      const hoje = new Date().toISOString().split('T')[0]

      const resF = db.prepare(`INSERT INTO financeiro (descricao, valor, tipo, data) VALUES (?, ?, 'receita', ?)`)
        .run(`Plano: ${tipo.nome}`, ciclo.valor, hoje)

      db.prepare(`UPDATE plano_ciclos SET status = 'pago', data_pagamento = ?, id_financeiro = ? WHERE id = ?`)
        .run(hoje, resF.lastInsertRowid, id_ciclo)

      // Gera próximo ciclo
      const [ano, mes] = ciclo.competencia.split('-').map(Number)
      let pAno = ano, pMes = mes + 1
      if (pMes > 12) { pMes = 1; pAno++ }
      const proxComp = `${pAno}-${String(pMes).padStart(2, '0')}`
      const jaExiste = db.prepare('SELECT id FROM plano_ciclos WHERE id_assinatura = ? AND competencia = ?')
        .get(ciclo.id_assinatura, proxComp)
      if (!jaExiste && assin.status === 'ativo') {
        const diaVenc = Math.min(assin.dia_vencimento, new Date(pAno, pMes, 0).getDate())
        const dataVenc = `${pAno}-${String(pMes).padStart(2, '0')}-${String(diaVenc).padStart(2, '0')}`
        db.prepare(`INSERT INTO plano_ciclos (id_assinatura, competencia, data_vencimento, valor, status) VALUES (?, ?, ?, ?, 'pendente')`)
          .run(ciclo.id_assinatura, proxComp, dataVenc, tipo.valor)
      }
      return { ok: true }
    })()
  },

  // ── Usos ────────────────────────────────────────────────

  registrarUso(dados) {
    const res = db.prepare(`
      INSERT INTO plano_usos (id_ciclo, servico, id_agendamento, data_uso, observacoes)
      VALUES (@id_ciclo, @servico, @id_agendamento, @data_uso, @observacoes)
    `).run(dados)
    return { id: res.lastInsertRowid }
  },

  listarUsosPorCiclo(id_ciclo) {
    return db.prepare(`
      SELECT u.* FROM plano_usos u WHERE u.id_ciclo = ? ORDER BY u.data_uso DESC
    `).all(id_ciclo)
  },

  deletarUso(id) {
    return db.prepare('DELETE FROM plano_usos WHERE id = ?').run(id)
  },

  // ── Resumo ciclo atual ────────────────────────────────

  resumoCicloAtual(id_assinatura) {
    const ciclo = planos.cicloAtual(id_assinatura)
    if (!ciclo) return null
    const assin = db.prepare('SELECT * FROM plano_assinaturas WHERE id = ?').get(id_assinatura)
    const tipo = planos.buscarTipoPorId(assin.id_plano_tipo)
    const usos = planos.listarUsosPorCiclo(ciclo.id)
    const usoPorServico = {}
    for (const u of usos) usoPorServico[u.servico] = (usoPorServico[u.servico] || 0) + 1
    const resumo = tipo.itens.map(item => ({
      servico: item.servico,
      quantidade_plano: item.quantidade,
      quantidade_usada: usoPorServico[item.servico] || 0,
      quantidade_restante: item.quantidade - (usoPorServico[item.servico] || 0),
    }))
    return { ciclo, resumo, usos }
  },

  // Para uso nos agendamentos: assinaturas ativas de um dono
  assinaturasAtivasDono(id_dono) {
    const rows = db.prepare(`
      SELECT a.*, t.nome as nome_plano FROM plano_assinaturas a
      JOIN plano_tipos t ON a.id_plano_tipo = t.id
      WHERE a.id_dono = ? AND a.status = 'ativo'
    `).all(id_dono)
    for (const r of rows) {
      r.tipo = planos.buscarTipoPorId(r.id_plano_tipo)
      r.resumo_ciclo = planos.resumoCicloAtual(r.id)
    }
    return rows
  },

  // Para dashboard: alertas de vencimento
  alertas() {
    const em5dias = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0]
    return db.prepare(`
      SELECT c.*, a.id_dono, a.id_pet, d.nome as nome_dono, p.nome as nome_pet, t.nome as nome_plano
      FROM plano_ciclos c
      JOIN plano_assinaturas a ON c.id_assinatura = a.id
      JOIN donos d ON a.id_dono = d.id
      LEFT JOIN pets p ON a.id_pet = p.id
      JOIN plano_tipos t ON a.id_plano_tipo = t.id
      WHERE c.status = 'pendente' AND a.status = 'ativo' AND c.data_vencimento <= ?
      ORDER BY c.data_vencimento ASC
    `).all(em5dias)
  },
}

function fechar() {
  if (db && db.open) db.close()
}

function getDbPath() {
  return dbPath || ''
}

// ──────────────────────────────────────────────────────────
// ENTREGAS
// ──────────────────────────────────────────────────────────

const entregas = {
  criar(dados) {
    const res = db.prepare(`
      INSERT INTO entregas (id_venda, endereco, taxa, responsavel, observacoes)
      VALUES (@id_venda, @endereco, @taxa, @responsavel, @observacoes)
    `).run({
      id_venda:    dados.id_venda,
      endereco:    dados.endereco,
      taxa:        dados.taxa        || 0,
      responsavel: dados.responsavel || null,
      observacoes: dados.observacoes || null,
    })
    return entregas.buscarPorId(res.lastInsertRowid)
  },

  buscarPorId(id) {
    const e = db.prepare(`
      SELECT e.*,
             v.total_final, v.nome_cliente, v.tipo_pagamento, v.criado_em AS venda_em,
             d.nome     AS nome_dono,
             d.telefone AS telefone_dono,
             d.whatsapp AS whatsapp_dono
      FROM entregas e
      JOIN  vendas v ON e.id_venda = v.id
      LEFT JOIN donos d ON v.id_dono = d.id
      WHERE e.id = ?
    `).get(id)
    if (!e) return null
    e.itens = db.prepare(`SELECT * FROM itens_venda WHERE id_venda = ?`).all(e.id_venda)
    return e
  },

  listar() {
    const lista = db.prepare(`
      SELECT e.*,
             v.total_final, v.nome_cliente, v.tipo_pagamento, v.criado_em AS venda_em,
             d.nome     AS nome_dono,
             d.telefone AS telefone_dono,
             d.whatsapp AS whatsapp_dono
      FROM entregas e
      JOIN  vendas v ON e.id_venda = v.id
      LEFT JOIN donos d ON v.id_dono = d.id
      ORDER BY e.criado_em DESC
    `).all()
    for (const e of lista) {
      e.itens = db.prepare(`SELECT * FROM itens_venda WHERE id_venda = ?`).all(e.id_venda)
    }
    return lista
  },

  atualizarStatus(id, status) {
    const agora = new Date().toISOString()
    if (status === 'saiu')     db.prepare(`UPDATE entregas SET status=?, saiu_em=?     WHERE id=?`).run(status, agora, id)
    else if (status === 'entregue') db.prepare(`UPDATE entregas SET status=?, entregue_em=? WHERE id=?`).run(status, agora, id)
    else                       db.prepare(`UPDATE entregas SET status=?                WHERE id=?`).run(status, id)
    return entregas.buscarPorId(id)
  },

  editar(id, dados) {
    db.prepare(`
      UPDATE entregas SET endereco=@endereco, taxa=@taxa, responsavel=@responsavel, observacoes=@observacoes
      WHERE id=@id
    `).run({ ...dados, id })
    return entregas.buscarPorId(id)
  },

  deletar(id) {
    return db.prepare('DELETE FROM entregas WHERE id = ?').run(id)
  },

  pendentes() {
    return db.prepare(`SELECT COUNT(*) AS total FROM entregas WHERE status IN ('aguardando','saiu')`).get()
  },
}

module.exports = { connect, fechar, getDbPath, donos, pets, agendamentos, vacinas, financeiro, pesoHistorico, estoque, veterinarios, consultas, internacoes, cirurgias, prescricoes, configuracoes, exames, vendas, contasReceber, planos, entregas }
