// Dicionário veterinário — siglas + termos de semiologia
// Cada entrada: { sigla, termo }
// sigla pode ser null para termos sem abreviação comum

export const DICIONARIO = [
  // ── Sinais Vitais ─────────────────────────────────────────
  { sigla: 'FC',    termo: 'Frequência Cardíaca' },
  { sigla: 'FR',    termo: 'Frequência Respiratória' },
  { sigla: 'Tax',   termo: 'Temperatura Axilar' },
  { sigla: 'TR',    termo: 'Temperatura Retal' },
  { sigla: 'TPC',   termo: 'Tempo de Preenchimento Capilar' },
  { sigla: 'MM',    termo: 'Mucosas' },
  { sigla: 'PA',    termo: 'Pressão Arterial' },
  { sigla: 'PAS',   termo: 'Pressão Arterial Sistólica' },
  { sigla: 'PAD',   termo: 'Pressão Arterial Diastólica' },
  { sigla: 'PAM',   termo: 'Pressão Arterial Média' },
  { sigla: 'SpO2',  termo: 'Saturação de Oxigênio' },
  { sigla: 'BPM',   termo: 'Batimentos Por Minuto' },
  { sigla: 'IRPM',  termo: 'Incursões Respiratórias Por Minuto' },

  // ── Vias de Administração ─────────────────────────────────
  { sigla: 'VO',  termo: 'Via Oral' },
  { sigla: 'SC',  termo: 'Subcutâneo' },
  { sigla: 'IM',  termo: 'Intramuscular' },
  { sigla: 'IV',  termo: 'Intravenoso' },
  { sigla: 'EV',  termo: 'Endovenoso' },
  { sigla: 'ID',  termo: 'Intradérmico' },
  { sigla: 'IO',  termo: 'Intraósseo' },
  { sigla: 'IT',  termo: 'Intratecal' },
  { sigla: 'TM',  termo: 'Tópico / Transdérmico' },
  { sigla: 'OD',  termo: 'Olho Direito' },
  { sigla: 'OE',  termo: 'Olho Esquerdo' },
  { sigla: 'OU',  termo: 'Ambos os Olhos' },
  { sigla: 'AD',  termo: 'Ouvido Direito' },
  { sigla: 'AE',  termo: 'Ouvido Esquerdo' },
  { sigla: 'AU',  termo: 'Ambos os Ouvidos' },

  // ── Posologia / Frequência ────────────────────────────────
  { sigla: 'SID',  termo: 'Uma vez ao dia' },
  { sigla: 'BID',  termo: 'Duas vezes ao dia' },
  { sigla: 'TID',  termo: 'Três vezes ao dia' },
  { sigla: 'QID',  termo: 'Quatro vezes ao dia' },
  { sigla: 'EOD',  termo: 'A cada dois dias' },
  { sigla: 'SOS',  termo: 'Se necessário' },
  { sigla: 'PRN',  termo: 'Se necessário (pro re nata)' },
  { sigla: 'Q4H',  termo: 'A cada 4 horas' },
  { sigla: 'Q6H',  termo: 'A cada 6 horas' },
  { sigla: 'Q8H',  termo: 'A cada 8 horas' },
  { sigla: 'Q12H', termo: 'A cada 12 horas' },
  { sigla: 'Q24H', termo: 'A cada 24 horas' },

  // ── Hematologia ───────────────────────────────────────────
  { sigla: 'Hb',   termo: 'Hemoglobina' },
  { sigla: 'Hgb',  termo: 'Hemoglobina' },
  { sigla: 'Ht',   termo: 'Hematócrito' },
  { sigla: 'HCT',  termo: 'Hematócrito' },
  { sigla: 'HCM',  termo: 'Hemoglobina Corpuscular Média' },
  { sigla: 'VCM',  termo: 'Volume Corpuscular Médio' },
  { sigla: 'CHCM', termo: 'Concentração de Hemoglobina Corpuscular Média' },
  { sigla: 'RDW',  termo: 'Índice de Anisocitose' },
  { sigla: 'WBC',  termo: 'Contagem de Leucócitos' },
  { sigla: 'RBC',  termo: 'Contagem de Eritrócitos' },
  { sigla: 'PLT',  termo: 'Plaquetas' },
  { sigla: 'NEU',  termo: 'Neutrófilos' },
  { sigla: 'LIN',  termo: 'Linfócitos' },
  { sigla: 'MON',  termo: 'Monócitos' },
  { sigla: 'EOS',  termo: 'Eosinófilos' },
  { sigla: 'BAS',  termo: 'Basófilos' },

  // ── Bioquímica Sérica ─────────────────────────────────────
  { sigla: 'ALT',  termo: 'Alanina Aminotransferase' },
  { sigla: 'TGP',  termo: 'Alanina Aminotransferase (TGP)' },
  { sigla: 'AST',  termo: 'Aspartato Aminotransferase' },
  { sigla: 'TGO',  termo: 'Aspartato Aminotransferase (TGO)' },
  { sigla: 'FA',   termo: 'Fosfatase Alcalina' },
  { sigla: 'GGT',  termo: 'Gama-Glutamiltransferase' },
  { sigla: 'BT',   termo: 'Bilirrubina Total' },
  { sigla: 'BD',   termo: 'Bilirrubina Direta' },
  { sigla: 'BI',   termo: 'Bilirrubina Indireta' },
  { sigla: 'BUN',  termo: 'Ureia Sérica' },
  { sigla: 'CREA', termo: 'Creatinina' },
  { sigla: 'GLI',  termo: 'Glicemia' },
  { sigla: 'ALB',  termo: 'Albumina' },
  { sigla: 'GLOB', termo: 'Globulinas' },
  { sigla: 'COL',  termo: 'Colesterol Total' },
  { sigla: 'TG',   termo: 'Triglicerídeos' },
  { sigla: 'AMI',  termo: 'Amilase' },
  { sigla: 'LIP',  termo: 'Lipase' },

  // ── Diagnóstico e Clínica Geral ───────────────────────────
  { sigla: 'Dx',   termo: 'Diagnóstico' },
  { sigla: 'Ddx',  termo: 'Diagnóstico Diferencial' },
  { sigla: 'Px',   termo: 'Prognóstico' },
  { sigla: 'Tx',   termo: 'Tratamento' },
  { sigla: 'HA',   termo: 'Histórico e Anamnese' },
  { sigla: 'EF',   termo: 'Exame Físico' },
  { sigla: 'EG',   termo: 'Estado Geral' },
  { sigla: 'BEG',  termo: 'Bom Estado Geral' },
  { sigla: 'MEG',  termo: 'Mau Estado Geral' },
  { sigla: 'REG',  termo: 'Regular Estado Geral' },
  { sigla: 'CC',   termo: 'Condição Corporal' },
  { sigla: 'PV',   termo: 'Peso Vivo' },
  { sigla: 'QP',   termo: 'Queixa Principal' },
  { sigla: 'HDA',  termo: 'História da Doença Atual' },
  { sigla: 'SOAP', termo: 'Subjetivo, Objetivo, Avaliação, Plano' },

  // ── Procedimentos e Exames ────────────────────────────────
  { sigla: 'USG',  termo: 'Ultrassonografia' },
  { sigla: 'US',   termo: 'Ultrassonografia' },
  { sigla: 'RX',   termo: 'Radiografia' },
  { sigla: 'TC',   termo: 'Tomografia Computadorizada' },
  { sigla: 'RM',   termo: 'Ressonância Magnética' },
  { sigla: 'ECG',  termo: 'Eletrocardiograma' },
  { sigla: 'ECC',  termo: 'Eletrocardiograma' },
  { sigla: 'PAAF', termo: 'Punção Aspirativa por Agulha Fina' },
  { sigla: 'BAL',  termo: 'Lavado Broncoalveolar' },
  { sigla: 'PCR',  termo: 'Reação em Cadeia da Polimerase' },
  { sigla: 'UA',   termo: 'Urinálise / Exame de Urina' },
  { sigla: 'EPC',  termo: 'Exame Parasitológico de Fezes' },
  { sigla: 'HE',   termo: 'Hemograma Completo' },
  { sigla: 'CS',   termo: 'Cultura e Sensibilidade (Antibiograma)' },
  { sigla: 'BX',   termo: 'Biópsia' },

  // ── Cirurgia e Anestesia ──────────────────────────────────
  { sigla: 'MPA',  termo: 'Medicação Pré-Anestésica' },
  { sigla: 'TIVA', termo: 'Anestesia Total Intravenosa' },
  { sigla: 'AINE', termo: 'Anti-Inflamatório Não Esteroidal' },
  { sigla: 'CRI',  termo: 'Infusão de Taxa Constante' },
  { sigla: 'OSH',  termo: 'Ovariossalpingo-Histerectomia' },
  { sigla: 'OVH',  termo: 'Ovariohisterectomia' },
  { sigla: 'ORQ',  termo: 'Orquiectomia' },

  // ── Sistemas ──────────────────────────────────────────────
  { sigla: 'SNC',  termo: 'Sistema Nervoso Central' },
  { sigla: 'SNP',  termo: 'Sistema Nervoso Periférico' },
  { sigla: 'SCV',  termo: 'Sistema Cardiovascular' },
  { sigla: 'SR',   termo: 'Sistema Respiratório' },
  { sigla: 'TGI',  termo: 'Trato Gastrintestinal' },
  { sigla: 'TU',   termo: 'Trato Urinário' },
  { sigla: 'VD',   termo: 'Ventrículo Direito' },
  { sigla: 'VE',   termo: 'Ventrículo Esquerdo' },

  // ── Semiologia — Mucosas e Pele ───────────────────────────
  { sigla: null,   termo: 'Normocorada' },
  { sigla: null,   termo: 'Hipocorada' },
  { sigla: null,   termo: 'Hipercorada' },
  { sigla: null,   termo: 'Ictérica' },
  { sigla: null,   termo: 'Cianótica' },
  { sigla: null,   termo: 'Congestas' },
  { sigla: null,   termo: 'Alopecia' },
  { sigla: null,   termo: 'Eritema' },
  { sigla: 'PR',   termo: 'Prurido' },
  { sigla: null,   termo: 'Pápula' },
  { sigla: null,   termo: 'Pústula' },
  { sigla: null,   termo: 'Vesícula' },
  { sigla: null,   termo: 'Crosta' },
  { sigla: null,   termo: 'Úlcera' },
  { sigla: null,   termo: 'Escama' },
  { sigla: null,   termo: 'Hiperpigmentação' },
  { sigla: null,   termo: 'Hipopigmentação' },
  { sigla: null,   termo: 'Nódulo' },
  { sigla: null,   termo: 'Turgor Cutâneo' },

  // ── Semiologia — Estado Geral ─────────────────────────────
  { sigla: 'PROST', termo: 'Prostrado' },
  { sigla: null,    termo: 'Alerta' },
  { sigla: null,    termo: 'Estupor' },
  { sigla: null,    termo: 'Coma' },
  { sigla: null,    termo: 'Caquético' },
  { sigla: 'DES',   termo: 'Desidratado' },
  { sigla: null,    termo: 'Eupneico' },
  { sigla: null,    termo: 'Afebril' },
  { sigla: null,    termo: 'Febril' },
  { sigla: null,    termo: 'Hipotérmico' },
  { sigla: null,    termo: 'Hipertérmico' },

  // ── Semiologia — Cardiovascular ───────────────────────────
  { sigla: null,   termo: 'Sopro cardíaco' },
  { sigla: null,   termo: 'Arritmia' },
  { sigla: 'TAQ',  termo: 'Taquicardia' },
  { sigla: 'BRAD', termo: 'Bradicardia' },
  { sigla: null,   termo: 'Pulso forte' },
  { sigla: null,   termo: 'Pulso fraco' },
  { sigla: null,   termo: 'Pulso filiforme' },
  { sigla: null,   termo: 'Pulso paradoxal' },
  { sigla: null,   termo: 'Edema' },
  { sigla: null,   termo: 'Ascite' },
  { sigla: null,   termo: 'Hidrotórax' },
  { sigla: null,   termo: 'Pericardite' },
  { sigla: null,   termo: 'Cardiomegalia' },

  // ── Semiologia — Respiratório ─────────────────────────────
  { sigla: 'DISP',  termo: 'Dispneia' },
  { sigla: 'TAQP',  termo: 'Taquipneia' },
  { sigla: 'BRADP', termo: 'Bradipneia' },
  { sigla: null,    termo: 'Apneia' },
  { sigla: null,    termo: 'Ortopneia' },
  { sigla: null,    termo: 'Estertor' },
  { sigla: null,    termo: 'Sibilo' },
  { sigla: null,    termo: 'Crepitação' },
  { sigla: null,    termo: 'Ronco' },
  { sigla: null,    termo: 'Cornagem' },
  { sigla: null,    termo: 'Pneumotórax' },
  { sigla: null,    termo: 'Efusão Pleural' },
  { sigla: null,    termo: 'Hemoptise' },
  { sigla: null,    termo: 'Epistaxe' },
  { sigla: null,    termo: 'Espirro Reverso' },

  // ── Semiologia — Digestório ───────────────────────────────
  { sigla: 'AN',   termo: 'Anorexia' },
  { sigla: 'HIP',  termo: 'Hiporexia' },
  { sigla: 'POL',  termo: 'Polifagia' },
  { sigla: 'EM',   termo: 'Êmese / Vômito' },
  { sigla: 'REG',  termo: 'Regurgitação' },
  { sigla: null,   termo: 'Disfagia' },
  { sigla: null,   termo: 'Ptialismo' },
  { sigla: null,   termo: 'Melena' },
  { sigla: null,   termo: 'Hematoquesia' },
  { sigla: 'DIA',  termo: 'Diarreia' },
  { sigla: 'CONS', termo: 'Constipação' },
  { sigla: null,   termo: 'Meteorismo' },
  { sigla: null,   termo: 'Timpanismo' },
  { sigla: null,   termo: 'Tenesmo' },
  { sigla: null,   termo: 'Hepatomegalia' },
  { sigla: null,   termo: 'Esplenomegalia' },
  { sigla: null,   termo: 'Icterícia' },
  { sigla: null,   termo: 'Peristaltismo' },

  // ── Semiologia — Urinário ─────────────────────────────────
  { sigla: 'PU',   termo: 'Poliúria' },
  { sigla: 'OL',   termo: 'Oligúria' },
  { sigla: null,   termo: 'Anúria' },
  { sigla: 'PD',   termo: 'Polidipsia' },
  { sigla: null,   termo: 'Disúria' },
  { sigla: null,   termo: 'Hematúria' },
  { sigla: null,   termo: 'Proteinúria' },
  { sigla: null,   termo: 'Glicosúria' },
  { sigla: null,   termo: 'Estrangúria' },
  { sigla: null,   termo: 'Polaciúria' },
  { sigla: null,   termo: 'Incontinência Urinária' },
  { sigla: null,   termo: 'Nefromegalia' },

  // ── Semiologia — Neurológico ──────────────────────────────
  { sigla: 'AT',   termo: 'Ataxia' },
  { sigla: 'PAR',  termo: 'Paresia' },
  { sigla: null,   termo: 'Plegia' },
  { sigla: null,   termo: 'Paraplegia' },
  { sigla: null,   termo: 'Tetraplegia' },
  { sigla: null,   termo: 'Hemiplegia' },
  { sigla: 'CONV', termo: 'Convulsão' },
  { sigla: null,   termo: 'Tremor' },
  { sigla: null,   termo: 'Fasciculação' },
  { sigla: null,   termo: 'Nistagmo' },
  { sigla: null,   termo: 'Estrabismo' },
  { sigla: null,   termo: 'Midríase' },
  { sigla: null,   termo: 'Miose' },
  { sigla: null,   termo: 'Anisocoria' },
  { sigla: null,   termo: 'Propriocepção' },
  { sigla: null,   termo: 'Síncope' },
  { sigla: null,   termo: 'Head Tilt' },

  // ── Semiologia — Musculoesquelético ──────────────────────
  { sigla: 'CLAUD', termo: 'Claudicação' },
  { sigla: null,    termo: 'Crepitação Articular' },
  { sigla: null,    termo: 'Efusão Articular' },
  { sigla: null,    termo: 'Anquilose' },
  { sigla: null,    termo: 'Atrofia Muscular' },
  { sigla: null,    termo: 'Mialgia' },
  { sigla: null,    termo: 'Artralgia' },
  { sigla: null,    termo: 'Fratura' },
  { sigla: null,    termo: 'Luxação' },
  { sigla: null,    termo: 'Subluxação' },

  // ── Semiologia — Reprodutivo ──────────────────────────────
  { sigla: null,   termo: 'Lóquios' },
  { sigla: null,   termo: 'Metrorragia' },
  { sigla: null,   termo: 'Vulvovaginite' },
  { sigla: null,   termo: 'Mastite' },
  { sigla: null,   termo: 'Piometra' },
  { sigla: null,   termo: 'Criptorquidismo' },
  { sigla: null,   termo: 'Orquite' },
  { sigla: null,   termo: 'Distocia' },
  { sigla: null,   termo: 'Pseudociese' },
  { sigla: null,   termo: 'Galactorreia' },

  // ── Semiologia — Linfonodos ───────────────────────────────
  { sigla: null,   termo: 'Linfadenomegalia' },
  { sigla: null,   termo: 'Linfadenite' },
  { sigla: null,   termo: 'Linfonodo Reativo' },
  { sigla: null,   termo: 'Linfonodo Poplíteo' },
  { sigla: null,   termo: 'Linfonodo Submandibular' },
  { sigla: null,   termo: 'Linfonodo Pré-escapular' },
  { sigla: null,   termo: 'Linfonodo Inguinal' },
]

// Busca sugestões pelo que o usuário está digitando
// Aceita sigla (início da palavra) ou termo parcial (contém)
export function buscarSugestoes(texto, max = 6) {
  if (!texto || texto.length < 2) return []
  const q = texto.toLowerCase()
  const resultados = []
  const vistos = new Set()

  for (const entrada of DICIONARIO) {
    const chave = entrada.termo.toLowerCase()
    if (vistos.has(chave)) continue

    const siglaMatch = entrada.sigla &&
      entrada.sigla.toLowerCase().startsWith(q)
    const termoMatch = chave.includes(q)

    if (siglaMatch || termoMatch) {
      resultados.push(entrada)
      vistos.add(chave)
      if (resultados.length >= max) break
    }
  }

  // Prioriza: sigla exata primeiro, depois inicio do termo, depois contém
  return resultados.sort((a, b) => {
    const aSigla = a.sigla?.toLowerCase().startsWith(q) ? 0 : 1
    const bSigla = b.sigla?.toLowerCase().startsWith(q) ? 0 : 1
    if (aSigla !== bSigla) return aSigla - bSigla
    const aInicio = a.termo.toLowerCase().startsWith(q) ? 0 : 1
    const bInicio = b.termo.toLowerCase().startsWith(q) ? 0 : 1
    return aInicio - bInicio
  })
}
