// ── Utilitário de impressão / geração de PDF ──────────────
// Cria uma janela popup com HTML estilizado e chama window.print().
// O diálogo de impressão do Windows permite salvar como PDF nativamente.

function fmt(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtData(d) {
  if (!d) return '—'
  if (d.includes('T')) d = d.split('T')[0]
  const [ano, mes, dia] = d.split('-')
  return `${dia}/${mes}/${ano}`
}

function hoje() {
  return fmtData(new Date().toISOString().split('T')[0])
}

// ── Estilo base compartilhado ──────────────────────────────
const BASE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Inter, system-ui, sans-serif;
    font-size: 13px;
    color: #1e293b;
    background: #fff;
    padding: 32px;
    max-width: 800px;
    margin: 0 auto;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid #059669;
  }
  .brand { display: flex; align-items: center; gap: 10px; }
  .brand-logo {
    width: 40px; height: 40px;
    background: #059669; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    color: white; font-weight: 800; font-size: 13px; letter-spacing: -0.5px;
  }
  .brand-name { font-size: 16px; font-weight: 700; color: #1e293b; line-height: 1.2; }
  .brand-sub  { font-size: 11px; color: #64748b; }
  .doc-info   { text-align: right; }
  .doc-info h2 { font-size: 18px; font-weight: 700; color: #059669; }
  .doc-info p  { font-size: 11px; color: #64748b; margin-top: 3px; }
  .secao {
    margin-bottom: 16px;
    background: #f8fafc;
    border-radius: 10px;
    padding: 14px 16px;
  }
  .secao-titulo {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #94a3b8;
    margin-bottom: 10px;
  }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
  .campo label { font-size: 11px; font-weight: 600; color: #64748b; display: block; margin-bottom: 3px; }
  .campo p     { font-size: 13px; color: #1e293b; }
  .campo p.vazio { color: #94a3b8; font-style: italic; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th { background: #059669; color: white; font-weight: 600; font-size: 11px; text-align: left; padding: 8px 10px; }
  th:last-child { text-align: right; }
  td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
  td:last-child { text-align: right; font-weight: 600; }
  tr:last-child td { border-bottom: none; }
  .total-row td { font-weight: 700; font-size: 14px; background: #f0fdf4; color: #065f46; }
  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
  }
  .badge-green  { background: #d1fae5; color: #065f46; }
  .badge-amber  { background: #fef3c7; color: #92400e; }
  .badge-red    { background: #fee2e2; color: #991b1b; }
  .badge-blue   { background: #dbeafe; color: #1e40af; }
  .rodape {
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
    text-align: center;
    font-size: 11px;
    color: #94a3b8;
  }
  @media print {
    body { padding: 16px; }
    @page { margin: 1.5cm; }
  }
`

async function getClinica() {
  try {
    const all = await window.api.configuracoes.getAll()
    return {
      nome:      all.clinica_nome      || '4u TechPet',
      telefone:  all.clinica_telefone  || '',
      whatsapp:  all.clinica_whatsapp  || '',
      endereco:  all.clinica_endereco  || '',
      email:     all.clinica_email     || '',
      cnpj:      all.clinica_cnpj      || '',
      crmv:      all.clinica_crmv      || '',
      site:      all.clinica_site      || '',
      logo:      all.clinica_logo      || '',
    }
  } catch {
    return { nome: '4u TechPet', telefone: '', endereco: '', cnpj: '', crmv: '', logo: '' }
  }
}

async function abrirJanela(titulo, corpo) {
  const clinica = await getClinica()
  const win = window.open('', '_blank', 'width=820,height=700,scrollbars=yes')
  if (!win) { alert('Permita pop-ups para este app para imprimir.'); return }

  const infoClinica = [clinica.telefone, clinica.whatsapp, clinica.email, clinica.site]
    .filter(Boolean).join(' · ')

  const logoHtml = clinica.logo
    ? `<img src="${clinica.logo}" alt="Logo" style="width:56px;height:56px;object-fit:contain;border-radius:8px;flex-shrink:0" />`
    : `<div class="brand-logo">4u</div>`

  win.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${titulo}</title>
  <style>${BASE_CSS}</style>
</head>
<body>
${corpo.replace('__CLINICA_LOGO__', logoHtml)
        .replace('__CLINICA_NOME__', clinica.nome)
        .replace('__CLINICA_SUB__', [clinica.cnpj, clinica.crmv].filter(Boolean).join(' · ') || '4u Technology')
        .replace('__CLINICA_ENDERECO__', clinica.endereco ? `<p style="font-size:11px;color:#64748b;margin-top:2px">${clinica.endereco}</p>` : '')
        .replace('__CLINICA_INFO__',    infoClinica ? `<p style="font-size:11px;color:#64748b;margin-top:1px">${infoClinica}</p>` : '')
}
<div class="rodape">
  ${clinica.nome} &bull; ${hoje()}
</div>
</body>
</html>`)
  win.document.close()
  setTimeout(() => { win.focus(); win.print() }, 600)
}

function cabecalho(titulo, subtitulo) {
  return `
<div class="header">
  <div class="brand">
    __CLINICA_LOGO__
    <div>
      <div class="brand-name">__CLINICA_NOME__</div>
      <div class="brand-sub">__CLINICA_SUB__</div>
      __CLINICA_ENDERECO__
      __CLINICA_INFO__
    </div>
  </div>
  <div class="doc-info">
    <h2>${titulo}</h2>
    <p>${subtitulo || ''}</p>
    <p>Emitido em ${hoje()}</p>
  </div>
</div>`
}

function campo(label, valor) {
  const vazio = !valor || valor === '—'
  return `<div class="campo"><label>${label}</label><p class="${vazio ? 'vazio' : ''}">${vazio ? 'Não informado' : valor}</p></div>`
}

// ══════════════════════════════════════════════════════════
// VENDA
// ══════════════════════════════════════════════════════════
export function imprimirVenda(venda) {
  const itens = (venda.itens || []).map(i => `
    <tr>
      <td>${i.nome_produto || i.produto || '—'}</td>
      <td>${i.quantidade || 1}</td>
      <td>${fmt(i.preco_unit)}</td>
      <td>${fmt(i.subtotal || (i.preco_unit * i.quantidade))}</td>
    </tr>`).join('')

  const tipoBadge = venda.tipo_pagamento === 'prazo'
    ? '<span class="badge badge-amber">Fiado / A prazo</span>'
    : '<span class="badge badge-green">À vista</span>'

  const corpo = `
${cabecalho('Comprovante de Venda', `Venda #${venda.id || ''}`)}

<div class="secao">
  <div class="secao-titulo">Dados da venda</div>
  <div class="grid3">
    ${campo('Data', fmtData(venda.data || venda.created_at))}
    ${campo('Forma de pagamento', '')}
    ${campo('Cliente', venda.nome_cliente || venda.nome_dono || '—')}
  </div>
  <div style="margin-top:8px">${tipoBadge}</div>
  ${venda.tipo_pagamento === 'prazo' && venda.data_vencimento
    ? `<div style="margin-top:8px">${campo('Vencimento', fmtData(venda.data_vencimento))}</div>`
    : ''}
</div>

<div class="secao">
  <div class="secao-titulo">Itens</div>
  <table>
    <thead><tr><th>Produto</th><th>Qtd</th><th>Preço unit.</th><th>Subtotal</th></tr></thead>
    <tbody>${itens || '<tr><td colspan="4">Nenhum item</td></tr>'}</tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="3">Total</td>
        <td>${fmt(venda.total || venda.valor_total)}</td>
      </tr>
    </tfoot>
  </table>
</div>

${venda.observacoes ? `<div class="secao"><div class="secao-titulo">Observações</div><p>${venda.observacoes}</p></div>` : ''}`

  abrirJanela(`Venda #${venda.id}`, corpo)
}

// ══════════════════════════════════════════════════════════
// ENTREGA
// ══════════════════════════════════════════════════════════
export function imprimirEntrega(entrega) {
  const statusLabel = {
    aguardando:   'Aguardando',
    saiu:         'Saiu para entrega',
    entregue:     'Entregue',
    nao_entregue: 'Não entregue',
  }[entrega.status] || entrega.status

  const statusBadge = {
    aguardando:   '<span class="badge badge-blue">Aguardando</span>',
    saiu:         '<span class="badge badge-amber">Saiu para entrega</span>',
    entregue:     '<span class="badge badge-green">Entregue</span>',
    nao_entregue: '<span class="badge badge-red">Não entregue</span>',
  }[entrega.status] || ''

  const cliente = entrega.nome_dono || entrega.nome_cliente || '—'
  const telefone = entrega.whatsapp_dono || entrega.telefone_dono || '—'

  const itens = (entrega.itens || []).map(i => `
    <tr>
      <td>${i.nome_produto || '—'}</td>
      <td>${i.quantidade || 1}</td>
      <td>${fmt(i.preco_unit)}</td>
      <td>${fmt(i.subtotal)}</td>
    </tr>`).join('')

  const corpo = `
${cabecalho('Romaneio de Entrega', `Entrega #${entrega.id} · Venda #${entrega.id_venda}`)}

<div class="secao">
  <div class="secao-titulo">Dados da entrega</div>
  <div class="grid2">
    ${campo('Cliente', cliente)}
    ${campo('Telefone', telefone)}
  </div>
  <div style="margin-top:10px">${campo('Endereço de entrega', entrega.endereco)}</div>
  <div class="grid3" style="margin-top:10px">
    ${campo('Responsável', entrega.responsavel || '—')}
    ${campo('Status', statusLabel)}
    ${campo('Taxa de entrega', entrega.taxa > 0 ? fmt(entrega.taxa) : 'Grátis')}
  </div>
  <div style="margin-top:8px">${statusBadge}</div>
  ${entrega.saiu_em     ? `<div style="margin-top:8px">${campo('Saiu em', new Date(entrega.saiu_em).toLocaleString('pt-BR'))}</div>` : ''}
  ${entrega.entregue_em ? `<div style="margin-top:8px">${campo('Entregue em', new Date(entrega.entregue_em).toLocaleString('pt-BR'))}</div>` : ''}
</div>

<div class="secao">
  <div class="secao-titulo">Itens do pedido</div>
  <table>
    <thead><tr><th>Produto</th><th>Qtd</th><th>Preço unit.</th><th>Subtotal</th></tr></thead>
    <tbody>${itens || '<tr><td colspan="4">Nenhum item</td></tr>'}</tbody>
    <tfoot>
      ${entrega.taxa > 0 ? `<tr><td colspan="3" style="text-align:right;font-size:12px;color:#64748b">Taxa de entrega</td><td>${fmt(entrega.taxa)}</td></tr>` : ''}
      <tr class="total-row">
        <td colspan="3">Total</td>
        <td>${fmt((entrega.total_final || 0) + (entrega.taxa || 0))}</td>
      </tr>
    </tfoot>
  </table>
</div>

${entrega.observacoes ? `<div class="secao"><div class="secao-titulo">Observações</div><p>${entrega.observacoes}</p></div>` : ''}

<div class="secao" style="border:2px dashed #059669;background:#f0fdf4">
  <div class="secao-titulo">Confirmação de recebimento</div>
  <p style="margin-bottom:24px">Recebi os itens acima em perfeito estado.</p>
  <div style="border-top:1px solid #059669;padding-top:8px;font-size:11px;color:#64748b">
    Assinatura do cliente &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Data: ___/___/______
  </div>
</div>`

  abrirJanela(`Entrega #${entrega.id}`, corpo)
}

// ══════════════════════════════════════════════════════════
// FIADO / CONTA A RECEBER
// ══════════════════════════════════════════════════════════
export function imprimirFiado(conta, pagamentos = []) {
  const statusMap = {
    pendente: '<span class="badge badge-blue">Pendente</span>',
    atrasado: '<span class="badge badge-red">Atrasado</span>',
    pago:     '<span class="badge badge-green">Pago</span>',
  }

  const linhasPgto = pagamentos.map(p => `
    <tr>
      <td>${fmtData(p.data)}</td>
      <td>${p.observacao || '—'}</td>
      <td>${fmt(p.valor)}</td>
    </tr>`).join('')

  const valorRestante = (conta.valor_total || 0) - (conta.valor_pago || 0)

  const corpo = `
${cabecalho('Crediário / Fiado', `Conta #${conta.id || ''}`)}

<div class="secao">
  <div class="secao-titulo">Dados do crédito</div>
  <div class="grid2">
    ${campo('Cliente', conta.nome_cliente || conta.nome_dono || '—')}
    ${campo('Descrição', conta.descricao || '—')}
  </div>
  <div class="grid3" style="margin-top:10px">
    ${campo('Valor total', fmt(conta.valor_total))}
    ${campo('Valor pago', fmt(conta.valor_pago))}
    ${campo('Saldo devedor', fmt(valorRestante))}
  </div>
  <div class="grid2" style="margin-top:10px">
    ${campo('Data de criação', fmtData(conta.data_criacao || conta.created_at))}
    ${campo('Vencimento', fmtData(conta.data_vencimento))}
  </div>
  <div style="margin-top:8px">Status: ${statusMap[conta.status] || conta.status}</div>
</div>

${pagamentos.length > 0 ? `
<div class="secao">
  <div class="secao-titulo">Histórico de pagamentos</div>
  <table>
    <thead><tr><th>Data</th><th>Observação</th><th>Valor</th></tr></thead>
    <tbody>${linhasPgto}</tbody>
  </table>
</div>` : ''}

<div class="secao" style="background:#f0fdf4">
  <div class="grid3">
    ${campo('Total cobrado', fmt(conta.valor_total))}
    ${campo('Total pago', fmt(conta.valor_pago))}
    ${campo('Restante', fmt(valorRestante))}
  </div>
</div>`

  abrirJanela(`Fiado #${conta.id}`, corpo)
}

// ══════════════════════════════════════════════════════════
// CONSULTA
// ══════════════════════════════════════════════════════════
export function imprimirConsulta(consulta) {
  const corpo = `
${cabecalho('Prontuário de Consulta', `Consulta #${consulta.id || ''}`)}

<div class="secao">
  <div class="secao-titulo">Identificação</div>
  <div class="grid3">
    ${campo('Paciente', consulta.nome_pet)}
    ${campo('Espécie / Raça', [consulta.especie, consulta.raca].filter(Boolean).join(' / ') || '—')}
    ${campo('Tutor', consulta.nome_dono || '—')}
  </div>
  <div class="grid2" style="margin-top:10px">
    ${campo('Médico Veterinário', consulta.nome_vet || '—')}
    ${campo('Data / Hora', `${fmtData(consulta.data)} ${consulta.hora ? '• ' + consulta.hora : ''}`)}
  </div>
</div>

<div class="secao">
  <div class="secao-titulo">Anamnese</div>
  ${campo('Queixa principal', consulta.queixa_principal)}
  <div style="margin-top:10px">${campo('Histórico', consulta.historico)}</div>
</div>

<div class="secao">
  <div class="secao-titulo">Exame físico</div>
  <div class="grid3">
    ${campo('Peso (kg)', consulta.peso)}
    ${campo('Temperatura (°C)', consulta.temperatura)}
    ${campo('Freq. cardíaca (bpm)', consulta.freq_cardiaca)}
  </div>
  <div class="grid3" style="margin-top:10px">
    ${campo('Freq. respiratória (mpm)', consulta.freq_respiratoria)}
    ${campo('Mucosas', consulta.mucosas)}
    ${campo('Hidratação', consulta.hidratacao)}
  </div>
  ${consulta.outros_exame ? `<div style="margin-top:10px">${campo('Outros exames', consulta.outros_exame)}</div>` : ''}
</div>

<div class="secao">
  <div class="secao-titulo">Diagnóstico</div>
  <div class="grid2">
    ${campo('Diagnóstico suspeito', consulta.diagnostico_suspeita)}
    ${campo('Diagnóstico definitivo', consulta.diagnostico_definitivo)}
  </div>
</div>

<div class="secao">
  <div class="secao-titulo">Plano terapêutico</div>
  ${campo('Tratamento / Conduta', consulta.plano_terapeutico)}
  <div class="grid2" style="margin-top:10px">
    ${campo('Retorno', fmtData(consulta.retorno))}
    ${campo('Observações', consulta.observacoes)}
  </div>
</div>

<div style="margin-top:40px; display:grid; grid-template-columns:1fr 1fr; gap:40px;">
  <div style="text-align:center; border-top:1px solid #e2e8f0; padding-top:10px; font-size:12px; color:#64748b;">
    Assinatura do Veterinário<br/>
    ${consulta.nome_vet ? `<strong>${consulta.nome_vet}</strong>` : ''}
    ${consulta.crmv_vet ? `<br/>CRMV: ${consulta.crmv_vet}` : ''}
  </div>
  <div style="text-align:center; border-top:1px solid #e2e8f0; padding-top:10px; font-size:12px; color:#64748b;">
    Assinatura do Tutor<br/>
    ${consulta.nome_dono ? `<strong>${consulta.nome_dono}</strong>` : ''}
  </div>
</div>`

  abrirJanela(`Consulta ${consulta.nome_pet || ''}`, corpo)
}

// ══════════════════════════════════════════════════════════
// PRESCRIÇÃO
// ══════════════════════════════════════════════════════════
export function imprimirPrescricao(prescricao) {
  const itens = (prescricao.itens || []).filter(i => i.medicamento).map((i, idx) => `
    <tr>
      <td>${idx + 1}. ${i.medicamento}</td>
      <td>${i.dosagem || '—'}</td>
      <td>${i.frequencia || '—'}</td>
      <td>${i.duracao || '—'}</td>
      <td>${i.via || '—'}</td>
    </tr>`).join('')

  const corpo = `
${cabecalho('Receita Médica Veterinária', `Prescrição #${prescricao.id || ''}`)}

<div class="secao">
  <div class="secao-titulo">Paciente</div>
  <div class="grid3">
    ${campo('Nome do pet', prescricao.nome_pet)}
    ${campo('Espécie / Raça', [prescricao.especie, prescricao.raca].filter(Boolean).join(' / ') || '—')}
    ${campo('Tutor', prescricao.nome_dono || '—')}
  </div>
  <div class="grid2" style="margin-top:10px">
    ${campo('Médico Veterinário', prescricao.nome_vet || '—')}
    ${campo('Data', fmtData(prescricao.data))}
  </div>
</div>

<div class="secao">
  <div class="secao-titulo">Medicamentos prescritos</div>
  <table>
    <thead>
      <tr>
        <th>Medicamento</th>
        <th>Dosagem</th>
        <th>Frequência</th>
        <th>Duração</th>
        <th>Via</th>
      </tr>
    </thead>
    <tbody>${itens || '<tr><td colspan="5">Nenhum medicamento</td></tr>'}</tbody>
  </table>
</div>

${prescricao.observacoes ? `
<div class="secao">
  <div class="secao-titulo">Observações</div>
  <p>${prescricao.observacoes}</p>
</div>` : ''}

<div style="margin-top:40px; text-align:center; border-top:1px solid #e2e8f0; padding-top:10px; font-size:12px; color:#64748b; max-width:280px; margin-left:auto; margin-right:auto;">
  Assinatura e Carimbo do Veterinário<br/>
  ${prescricao.nome_vet ? `<strong>${prescricao.nome_vet}</strong>` : ''}
  ${prescricao.crmv_vet ? `<br/>CRMV: ${prescricao.crmv_vet}` : ''}
</div>`

  abrirJanela(`Receita ${prescricao.nome_pet || ''}`, corpo)
}

// ══════════════════════════════════════════════════════════
// INTERNAÇÃO
// ══════════════════════════════════════════════════════════
export function imprimirInternacao(internacao) {
  const statusMap = {
    internado: '<span class="badge badge-blue">Internado</span>',
    alta:      '<span class="badge badge-green">Alta</span>',
    obito:     '<span class="badge badge-red">Óbito</span>',
  }

  const corpo = `
${cabecalho('Ficha de Internação', `Internação #${internacao.id || ''}`)}

<div class="secao">
  <div class="secao-titulo">Identificação</div>
  <div class="grid3">
    ${campo('Paciente', internacao.nome_pet)}
    ${campo('Espécie / Raça', [internacao.especie, internacao.raca].filter(Boolean).join(' / ') || '—')}
    ${campo('Tutor', internacao.nome_dono || '—')}
  </div>
  <div class="grid3" style="margin-top:10px">
    ${campo('Veterinário responsável', internacao.nome_vet || '—')}
    ${campo('Data de entrada', `${fmtData(internacao.data_entrada)} ${internacao.hora_entrada ? '• ' + internacao.hora_entrada : ''}`)}
    ${internacao.data_saida
      ? campo('Data de saída', `${fmtData(internacao.data_saida)} ${internacao.hora_saida ? '• ' + internacao.hora_saida : ''}`)
      : campo('Status', '')}
  </div>
  ${!internacao.data_saida ? `<div style="margin-top:8px">${statusMap[internacao.status] || internacao.status || ''}</div>` : ''}
</div>

<div class="secao">
  <div class="secao-titulo">Motivo da internação</div>
  ${campo('Diagnóstico / Motivo', internacao.diagnostico || internacao.motivo)}
  ${internacao.observacoes_entrada ? `<div style="margin-top:10px">${campo('Observações de entrada', internacao.observacoes_entrada)}</div>` : ''}
</div>

${internacao.evolucao ? `
<div class="secao">
  <div class="secao-titulo">Evolução clínica</div>
  <p>${internacao.evolucao}</p>
</div>` : ''}

${internacao.data_saida ? `
<div class="secao">
  <div class="secao-titulo">Alta / Desfecho</div>
  ${campo('Condição de saída', internacao.condicao_saida || internacao.status)}
  ${internacao.observacoes_saida ? `<div style="margin-top:10px">${campo('Observações de saída', internacao.observacoes_saida)}</div>` : ''}
</div>` : ''}

${internacao.valor ? `
<div class="secao" style="background:#f0fdf4">
  ${campo('Valor da internação', fmt(internacao.valor))}
</div>` : ''}`

  abrirJanela(`Internação ${internacao.nome_pet || ''}`, corpo)
}

// ══════════════════════════════════════════════════════════
// CIRURGIA
// ══════════════════════════════════════════════════════════
export function imprimirCirurgia(cirurgia) {
  const corpo = `
${cabecalho('Relatório Cirúrgico', `Cirurgia #${cirurgia.id || ''}`)}

<div class="secao">
  <div class="secao-titulo">Identificação</div>
  <div class="grid3">
    ${campo('Paciente', cirurgia.nome_pet)}
    ${campo('Espécie / Raça', [cirurgia.especie, cirurgia.raca].filter(Boolean).join(' / ') || '—')}
    ${campo('Tutor', cirurgia.nome_dono || '—')}
  </div>
  <div class="grid2" style="margin-top:10px">
    ${campo('Cirurgião', cirurgia.nome_vet || '—')}
    ${campo('Data / Hora', `${fmtData(cirurgia.data)} ${cirurgia.hora ? '• ' + cirurgia.hora : ''}`)}
  </div>
</div>

<div class="secao">
  <div class="secao-titulo">Procedimento</div>
  ${campo('Procedimento cirúrgico', cirurgia.procedimento || cirurgia.tipo)}
  ${cirurgia.anestesia ? `<div style="margin-top:10px">${campo('Anestesia utilizada', cirurgia.anestesia)}</div>` : ''}
  ${cirurgia.diagnostico ? `<div style="margin-top:10px">${campo('Diagnóstico / Indicação', cirurgia.diagnostico)}</div>` : ''}
</div>

${cirurgia.descricao || cirurgia.relato ? `
<div class="secao">
  <div class="secao-titulo">Relato cirúrgico</div>
  <p>${cirurgia.descricao || cirurgia.relato}</p>
</div>` : ''}

${cirurgia.pos_operatorio || cirurgia.cuidados ? `
<div class="secao">
  <div class="secao-titulo">Pós-operatório / Cuidados</div>
  <p>${cirurgia.pos_operatorio || cirurgia.cuidados}</p>
</div>` : ''}

${cirurgia.observacoes ? `
<div class="secao">
  <div class="secao-titulo">Observações</div>
  <p>${cirurgia.observacoes}</p>
</div>` : ''}

${cirurgia.valor ? `
<div class="secao" style="background:#f0fdf4">
  ${campo('Valor do procedimento', fmt(cirurgia.valor))}
</div>` : ''}

<div style="margin-top:40px; text-align:center; border-top:1px solid #e2e8f0; padding-top:10px; font-size:12px; color:#64748b; max-width:280px; margin-left:auto; margin-right:auto;">
  Assinatura do Cirurgião<br/>
  ${cirurgia.nome_vet ? `<strong>${cirurgia.nome_vet}</strong>` : ''}
  ${cirurgia.crmv_vet ? `<br/>CRMV: ${cirurgia.crmv_vet}` : ''}
</div>`

  abrirJanela(`Cirurgia ${cirurgia.nome_pet || ''}`, corpo)
}

// ══════════════════════════════════════════════════════════
// AGENDAMENTO
// ══════════════════════════════════════════════════════════
export function imprimirAgendamento(ag) {
  const statusMap = {
    agendado:   '<span class="badge badge-blue">Agendado</span>',
    confirmado: '<span class="badge badge-green">Confirmado</span>',
    concluido:  '<span class="badge badge-green">Concluído</span>',
    cancelado:  '<span class="badge badge-red">Cancelado</span>',
  }

  const corpo = `
${cabecalho('Comprovante de Agendamento', `Agendamento #${ag.id || ''}`)}

<div class="secao">
  <div class="secao-titulo">Dados do agendamento</div>
  <div class="grid3">
    ${campo('Pet', ag.nome_pet)}
    ${campo('Espécie / Raça', [ag.especie, ag.raca].filter(Boolean).join(' / ') || '—')}
    ${campo('Tutor', ag.nome_dono || '—')}
  </div>
  <div class="grid2" style="margin-top:10px">
    ${campo('Telefone', ag.telefone_dono || '—')}
    ${campo('Veterinário', ag.nome_vet || ag.veterinario || '—')}
  </div>
  <div class="grid3" style="margin-top:10px">
    ${campo('Data', fmtData(ag.data))}
    ${campo('Hora', ag.hora || '—')}
    ${campo('Serviço', ag.servico || ag.tipo_servico || '—')}
  </div>
  <div style="margin-top:8px">${statusMap[ag.status] || ag.status || ''}</div>
</div>

${ag.observacoes ? `
<div class="secao">
  <div class="secao-titulo">Observações</div>
  <p>${ag.observacoes}</p>
</div>` : ''}

${ag.valor ? `
<div class="secao" style="background:#f0fdf4">
  ${campo('Valor do serviço', fmt(ag.valor))}
  ${ag.tipo_pagamento ? campo('Forma de pagamento', ag.tipo_pagamento === 'prazo' ? 'Fiado / A prazo' : 'À vista') : ''}
</div>` : ''}`

  abrirJanela(`Agendamento ${ag.nome_pet || ''}`, corpo)
}

// ══════════════════════════════════════════════════════════
// FINANCEIRO (relatório de período)
// ══════════════════════════════════════════════════════════
export function imprimirRelatorioFinanceiro({ lancamentos, periodo, totais }) {
  const linhas = lancamentos.map(l => `
    <tr>
      <td>${fmtData(l.data)}</td>
      <td>${l.descricao || '—'}</td>
      <td>${l.nome_pet || '—'}</td>
      <td>
        ${l.tipo === 'receita'
          ? '<span class="badge badge-green">Receita</span>'
          : '<span class="badge badge-red">Despesa</span>'}
      </td>
      <td style="color:${l.tipo === 'receita' ? '#059669' : '#dc2626'}">
        ${l.tipo === 'receita' ? '+' : '-'}${fmt(l.valor)}
      </td>
    </tr>`).join('')

  const saldo = (totais?.receitas || 0) - (totais?.despesas || 0)

  const corpo = `
${cabecalho('Relatório Financeiro', periodo || '')}

<div class="secao" style="background:#f0fdf4">
  <div class="secao-titulo">Resumo do período</div>
  <div class="grid3">
    <div class="campo">
      <label>Total de receitas</label>
      <p style="color:#059669; font-size:18px; font-weight:700">${fmt(totais?.receitas)}</p>
    </div>
    <div class="campo">
      <label>Total de despesas</label>
      <p style="color:#dc2626; font-size:18px; font-weight:700">${fmt(totais?.despesas)}</p>
    </div>
    <div class="campo">
      <label>Saldo</label>
      <p style="color:${saldo >= 0 ? '#059669' : '#dc2626'}; font-size:18px; font-weight:700">
        ${saldo >= 0 ? '+' : ''}${fmt(saldo)}
      </p>
    </div>
  </div>
</div>

<div class="secao">
  <div class="secao-titulo">Lançamentos (${lancamentos.length})</div>
  <table>
    <thead>
      <tr>
        <th>Data</th>
        <th>Descrição</th>
        <th>Pet</th>
        <th>Tipo</th>
        <th>Valor</th>
      </tr>
    </thead>
    <tbody>${linhas || '<tr><td colspan="5">Nenhum lançamento</td></tr>'}</tbody>
  </table>
</div>`

  abrirJanela('Relatório Financeiro', corpo)
}

// ══════════════════════════════════════════════════════════
// EXAME (AbaExames)
// ══════════════════════════════════════════════════════════
export function imprimirExame(exame, pet) {
  const corpo = `
${cabecalho('Resultado de Exame', `Exame #${exame.id || ''}`)}

<div class="secao">
  <div class="secao-titulo">Paciente</div>
  <div class="grid3">
    ${campo('Nome do pet', pet?.nome || exame.nome_pet || '—')}
    ${campo('Espécie / Raça', [pet?.especie, pet?.raca].filter(Boolean).join(' / ') || '—')}
    ${campo('Tutor', pet?.nome_dono || '—')}
  </div>
</div>

<div class="secao">
  <div class="secao-titulo">Exame</div>
  <div class="grid2">
    ${campo('Tipo de exame', exame.tipo || exame.nome || '—')}
    ${campo('Data', fmtData(exame.data))}
  </div>
  ${exame.laboratorio ? `<div style="margin-top:10px">${campo('Laboratório / Local', exame.laboratorio)}</div>` : ''}
  ${exame.resultado ? `<div style="margin-top:10px">${campo('Resultado / Laudo', exame.resultado)}</div>` : ''}
  ${exame.observacoes ? `<div style="margin-top:10px">${campo('Observações', exame.observacoes)}</div>` : ''}
</div>

${exame.arquivo_path ? `
<div class="secao">
  <div class="secao-titulo">Arquivo anexo</div>
  <p>📎 Arquivo PDF anexado ao prontuário — visualizar no sistema.</p>
</div>` : ''}`

  abrirJanela(`Exame ${pet?.nome || ''}`, corpo)
}
