import { useState, useEffect, useCallback, useRef } from 'react'
import CampoClinico from '../components/CampoClinico'
import {
  Scissors, Plus, Search, Pencil, Trash2, X,
  ArrowLeft, Printer, PawPrint, Calendar, Clock, FileText
} from 'lucide-react'

// ── Utilitários ───────────────────────────────────────────

function formatarData(d) {
  if (!d) return ''
  const [ano, mes, dia] = d.split('-')
  return `${dia}/${mes}/${ano}`
}

function hoje()     { return new Date().toISOString().split('T')[0] }
function horaAtual() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

// ── BuscaPet ─────────────────────────────────────────────

function BuscaPet({ petSelecionado, onSelect, erro }) {
  const [busca, setBusca]       = useState(petSelecionado?.nome || '')
  const [resultados, setResultados] = useState([])
  const [aberto, setAberto]     = useState(false)
  const timer = useRef(null)
  const ref   = useRef(null)

  useEffect(() => {
    setBusca(petSelecionado?.nome || '')
  }, [petSelecionado])

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setAberto(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function handleChange(v) {
    setBusca(v)
    if (petSelecionado) onSelect(null)
    clearTimeout(timer.current)
    if (!v.trim()) { setResultados([]); setAberto(false); return }
    timer.current = setTimeout(async () => {
      const lista = await window.api.pets.buscarPorNome(v)
      setResultados(lista)
      setAberto(lista.length > 0)
    }, 300)
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" value={busca} onChange={e => handleChange(e.target.value)}
          placeholder="Digite o nome do pet para buscar..."
          className={`w-full pl-9 pr-9 py-2.5 border rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:border-transparent bg-white transition-shadow ${
            erro ? 'border-red-300 focus:ring-red-400' : 'border-slate-200 focus:ring-emerald-500'
          }`}
        />
        {petSelecionado && (
          <button onClick={() => { onSelect(null); setBusca('') }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        )}
      </div>
      {aberto && resultados.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-20 mt-1 max-h-48 overflow-y-auto">
          {resultados.map(pet => (
            <button key={pet.id} onClick={() => { onSelect(pet); setBusca(pet.nome); setAberto(false) }}
              className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 flex items-center gap-3 transition-colors first:rounded-t-xl last:rounded-b-xl">
              <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <PawPrint size={12} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">{pet.nome}</p>
                <p className="text-xs text-slate-400">{[pet.especie, pet.raca, pet.nome_dono].filter(Boolean).join(' · ')}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {erro && <p className="text-xs text-red-500 mt-1">{erro}</p>}
    </div>
  )
}

// ── Modal Delete ──────────────────────────────────────────

function ModalDelete({ cirurgia, onConfirmar, onFechar }) {
  const [deletando, setDeletando] = useState(false)
  async function confirmar() {
    setDeletando(true)
    await window.api.cirurgias.deletar(cirurgia.id)
    onConfirmar()
  }
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} className="text-red-500" />
        </div>
        <h3 className="font-semibold text-slate-800 mb-1">Excluir cirurgia?</h3>
        <p className="text-sm text-slate-400 mb-5">
          Cirurgia de <strong>{cirurgia.nome_pet}</strong> em <strong>{formatarData(cirurgia.data)}</strong> será removida permanentemente.
        </p>
        <div className="flex gap-3">
          <button onClick={onFechar} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition-colors">Cancelar</button>
          <button onClick={confirmar} disabled={deletando} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors">
            {deletando ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Formulário ────────────────────────────────────────────

const INPUT = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-shadow'
const TEXTAREA = INPUT + ' resize-none'

function Sec({ titulo, children }) {
  return (
    <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{titulo}</h3>
      {children}
    </div>
  )
}

function F({ label, obrigatorio, erro, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">
        {label} {obrigatorio && <span className="text-red-400">*</span>}
      </label>
      {children}
      {erro && <p className="text-xs text-red-500 mt-1">{erro}</p>}
    </div>
  )
}

const VAZIO = {
  id_cirurgiao: '', id_anestesista: '',
  data: '', hora_inicio: '', hora_fim: '',
  tipo_cirurgia: '', asa: '', jejum: '', pre_medicacao: '', exames_pre_op: '',
  protocolo_anestesico: '', agente_anestesico: '', dose_anestesico: '', via_anestesica: '',
  intercorrencias: '', obs_trans_op: '',
  recuperacao: '', cuidados_pos: '', restricoes: '', retorno: '', observacoes: '',
}

function CirurgiaFormulario({ cirurgia, onSalvar, onCancelar }) {
  const [dados, setDados] = useState(() => ({
    ...VAZIO,
    data: hoje(), hora_inicio: horaAtual(),
    ...(cirurgia ? {
      id_cirurgiao:         cirurgia.id_cirurgiao         || '',
      id_anestesista:       cirurgia.id_anestesista       || '',
      data:                 cirurgia.data                 || '',
      hora_inicio:          cirurgia.hora_inicio          || '',
      hora_fim:             cirurgia.hora_fim             || '',
      tipo_cirurgia:        cirurgia.tipo_cirurgia        || '',
      asa:                  cirurgia.asa                  || '',
      jejum:                cirurgia.jejum                || '',
      pre_medicacao:        cirurgia.pre_medicacao        || '',
      exames_pre_op:        cirurgia.exames_pre_op        || '',
      protocolo_anestesico: cirurgia.protocolo_anestesico || '',
      agente_anestesico:    cirurgia.agente_anestesico    || '',
      dose_anestesico:      cirurgia.dose_anestesico      || '',
      via_anestesica:       cirurgia.via_anestesica       || '',
      intercorrencias:      cirurgia.intercorrencias      || '',
      obs_trans_op:         cirurgia.obs_trans_op         || '',
      recuperacao:          cirurgia.recuperacao          || '',
      cuidados_pos:         cirurgia.cuidados_pos         || '',
      restricoes:           cirurgia.restricoes           || '',
      retorno:              cirurgia.retorno              || '',
      observacoes:          cirurgia.observacoes          || '',
    } : {})
  }))
  const [petSelecionado, setPetSelecionado] = useState(null)
  const [vets, setVets]   = useState([])
  const [erros, setErros] = useState({})
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    window.api.veterinarios.listarAtivos().then(setVets)
    if (cirurgia?.id_pet) {
      window.api.pets.buscarPorId(cirurgia.id_pet).then(p => { if (p) setPetSelecionado(p) })
    } else {
      const raw = sessionStorage.getItem('clinica_pet_preselect')
      if (raw) {
        try {
          const { id } = JSON.parse(raw)
          window.api.pets.buscarPorId(id).then(p => { if (p) setPetSelecionado(p) })
          sessionStorage.removeItem('clinica_pet_preselect')
        } catch {}
      }
    }
  }, [cirurgia])

  function setD(campo, valor) {
    setDados(d => ({ ...d, [campo]: valor }))
    if (erros[campo]) setErros(e => ({ ...e, [campo]: null }))
  }

  function validar() {
    const e = {}
    if (!petSelecionado)          e.pet          = 'Selecione um pet'
    if (!dados.data)              e.data         = 'Data é obrigatória'
    if (!dados.tipo_cirurgia.trim()) e.tipo      = 'Tipo de cirurgia é obrigatório'
    return e
  }

  async function salvar() {
    const e = validar()
    if (Object.keys(e).length > 0) { setErros(e); return }
    setSalvando(true)
    try {
      const payload = {
        ...dados,
        id_pet:        petSelecionado.id,
        id_cirurgiao:  dados.id_cirurgiao  || null,
        id_anestesista:dados.id_anestesista|| null,
      }
      if (cirurgia?.id) {
        await window.api.cirurgias.editar(cirurgia.id, payload)
      } else {
        await window.api.cirurgias.criar(payload)
      }
      onSalvar()
    } finally {
      setSalvando(false)
    }
  }

  const selectVet = (campo, label) => (
    <F label={label}>
      <select value={dados[campo]} onChange={e => setD(campo, e.target.value)} className={INPUT}>
        <option value="">Não informado</option>
        {vets.map(v => <option key={v.id} value={v.id}>{v.nome}{v.crmv ? ` (${v.crmv})` : ''}</option>)}
      </select>
    </F>
  )

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onCancelar} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft size={18} className="text-slate-500" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{cirurgia ? 'Editar cirurgia' : 'Nova cirurgia'}</h2>
          <p className="text-sm text-slate-400">Preencha a ficha cirúrgica completa</p>
        </div>
      </div>

      <div className="space-y-4">

        {/* Identificação */}
        <Sec titulo="Identificação">
          <F label="Paciente" obrigatorio erro={erros.pet}>
            <BuscaPet
              petSelecionado={petSelecionado}
              onSelect={p => { setPetSelecionado(p); if (erros.pet) setErros(e => ({ ...e, pet: null })) }}
              erro={null}
            />
          </F>
          {petSelecionado && (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl flex-wrap">
              <PawPrint size={13} className="text-emerald-600 flex-shrink-0" />
              <span className="text-xs text-emerald-700 font-medium">{petSelecionado.nome}</span>
              {(petSelecionado.especie || petSelecionado.raca) && (
                <span className="text-xs text-emerald-600">{[petSelecionado.especie, petSelecionado.raca].filter(Boolean).join(', ')}</span>
              )}
              {petSelecionado.nome_dono && (
                <span className="text-xs text-emerald-600">· Tutor: {petSelecionado.nome_dono}</span>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {selectVet('id_cirurgiao',  'Cirurgião responsável')}
            {selectVet('id_anestesista','Anestesista')}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <F label="Data" obrigatorio erro={erros.data}>
              <input type="date" value={dados.data} onChange={e => setD('data', e.target.value)} className={INPUT} />
            </F>
            <F label="Hora início">
              <input type="time" value={dados.hora_inicio} onChange={e => setD('hora_inicio', e.target.value)} className={INPUT} />
            </F>
            <F label="Hora fim">
              <input type="time" value={dados.hora_fim} onChange={e => setD('hora_fim', e.target.value)} className={INPUT} />
            </F>
          </div>
        </Sec>

        {/* Pré-operatório */}
        <Sec titulo="Pré-operatório">
          <F label="Tipo / Procedimento cirúrgico" obrigatorio erro={erros.tipo}>
            <input type="text" value={dados.tipo_cirurgia}
              onChange={e => setD('tipo_cirurgia', e.target.value)}
              placeholder="Ex: Ovariohisterectomia, Orquiectomia, Laparotomia exploratória..."
              className={INPUT}
            />
          </F>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <F label="Risco anestésico (ASA)">
              <select value={dados.asa} onChange={e => setD('asa', e.target.value)} className={INPUT}>
                <option value="">Selecionar...</option>
                {['ASA I — Saudável', 'ASA II — Doença leve', 'ASA III — Doença grave', 'ASA IV — Risco de vida', 'ASA V — Moribundo'].map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </F>
            <F label="Jejum">
              <input type="text" value={dados.jejum} onChange={e => setD('jejum', e.target.value)}
                placeholder="Ex: 8h sólido, 4h líquido" className={INPUT} />
            </F>
            <F label="Exames pré-op realizados">
              <input type="text" value={dados.exames_pre_op} onChange={e => setD('exames_pre_op', e.target.value)}
                placeholder="Ex: Hemograma, bioquímica, ECG" className={INPUT} />
            </F>
          </div>
          <F label="Medicação pré-anestésica (MPA)">
            <CampoClinico value={dados.pre_medicacao} onChange={e => setD('pre_medicacao', e.target.value)}
              placeholder="Ex: Acepromazina 0,05mg/kg IM + Metadona 0,3mg/kg IM..."
              rows={2} className={TEXTAREA} />
          </F>
        </Sec>

        {/* Protocolo Anestésico */}
        <Sec titulo="Protocolo Anestésico">
          <F label="Tipo de protocolo">
            <input type="text" value={dados.protocolo_anestesico}
              onChange={e => setD('protocolo_anestesico', e.target.value)}
              placeholder="Ex: TIVA, Inalatória, Epidural, Local..."
              className={INPUT}
            />
          </F>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <F label="Agente anestésico">
              <input type="text" value={dados.agente_anestesico}
                onChange={e => setD('agente_anestesico', e.target.value)}
                placeholder="Ex: Isoflurano, Propofol..." className={INPUT} />
            </F>
            <F label="Dose">
              <input type="text" value={dados.dose_anestesico}
                onChange={e => setD('dose_anestesico', e.target.value)}
                placeholder="Ex: 2% CAM, 4mg/kg" className={INPUT} />
            </F>
            <F label="Via">
              <select value={dados.via_anestesica} onChange={e => setD('via_anestesica', e.target.value)} className={INPUT}>
                <option value="">Selecionar...</option>
                {['Inalatória', 'Intravenosa (IV)', 'Intramuscular (IM)', 'Epidural', 'Local', 'Combinada'].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </F>
          </div>
        </Sec>

        {/* Trans-operatório */}
        <Sec titulo="Trans-operatório">
          <F label="Intercorrências">
            <CampoClinico value={dados.intercorrencias} onChange={e => setD('intercorrencias', e.target.value)}
              placeholder="Descreva qualquer intercorrência durante o ato cirúrgico. Se não houve, informe 'Sem intercorrências'."
              rows={2} className={TEXTAREA} />
          </F>
          <F label="Observações trans-operatórias">
            <CampoClinico value={dados.obs_trans_op} onChange={e => setD('obs_trans_op', e.target.value)}
              placeholder="Achados intraoperatórios, alterações, procedimentos adicionais..."
              rows={2} className={TEXTAREA} />
          </F>
        </Sec>

        {/* Pós-operatório */}
        <Sec titulo="Pós-operatório">
          <F label="Recuperação anestésica">
            <CampoClinico value={dados.recuperacao} onChange={e => setD('recuperacao', e.target.value)}
              placeholder="Descreva como foi a recuperação do paciente..."
              rows={2} className={TEXTAREA} />
          </F>
          <F label="Cuidados pós-operatórios">
            <CampoClinico value={dados.cuidados_pos} onChange={e => setD('cuidados_pos', e.target.value)}
              placeholder="Medicações, curativos, restrição de atividade, alimentação..."
              rows={3} className={TEXTAREA} />
          </F>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <F label="Restrições">
              <input type="text" value={dados.restricoes} onChange={e => setD('restricoes', e.target.value)}
                placeholder="Ex: Colar elizabetano 10 dias, sem banho..." className={INPUT} />
            </F>
            <F label="Retorno">
              <input type="text" value={dados.retorno} onChange={e => setD('retorno', e.target.value)}
                placeholder="Ex: 7 dias para remoção de pontos..." className={INPUT} />
            </F>
          </div>
          <F label="Observações gerais">
            <CampoClinico value={dados.observacoes} onChange={e => setD('observacoes', e.target.value)}
              placeholder="Informações adicionais relevantes..." rows={2} className={TEXTAREA} />
          </F>
        </Sec>

        {/* Botões */}
        <div className="flex gap-3 pt-2 pb-6">
          <button onClick={onCancelar} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors font-medium">
            Cancelar
          </button>
          <button onClick={salvar} disabled={salvando} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm">
            {salvando ? 'Salvando...' : cirurgia ? 'Salvar alterações' : 'Registrar cirurgia'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Ficha cirúrgica (visualização + print) ────────────────

function Linha({ label, valor }) {
  if (!valor && valor !== 0) return null
  return (
    <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-400 col-span-1 pt-0.5">{label}</span>
      <span className="text-sm text-slate-800 col-span-2 whitespace-pre-wrap">{valor}</span>
    </div>
  )
}

function SecFicha({ titulo, children }) {
  return (
    <div className="mb-5">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pb-1 border-b-2 border-slate-100">{titulo}</h3>
      <div>{children}</div>
    </div>
  )
}

function FichaCirurgica({ cirurgia, onVoltar, onEditar }) {
  const temPre  = cirurgia.asa || cirurgia.jejum || cirurgia.exames_pre_op || cirurgia.pre_medicacao
  const temAnes = cirurgia.protocolo_anestesico || cirurgia.agente_anestesico || cirurgia.dose_anestesico || cirurgia.via_anestesica
  const temTrans = cirurgia.intercorrencias || cirurgia.obs_trans_op
  const temPos  = cirurgia.recuperacao || cirurgia.cuidados_pos || cirurgia.restricoes || cirurgia.retorno

  const duracao = (() => {
    if (!cirurgia.hora_inicio || !cirurgia.hora_fim) return null
    const [h1, m1] = cirurgia.hora_inicio.split(':').map(Number)
    const [h2, m2] = cirurgia.hora_fim.split(':').map(Number)
    const mins = (h2 * 60 + m2) - (h1 * 60 + m1)
    if (mins <= 0) return null
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h > 0 ? `${h}h${m > 0 ? m + 'min' : ''}` : `${m} min`
  })()

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          #ficha-cirurgica-print { display: block !important; position: fixed; inset: 0; padding: 24px; background: white; z-index: 9999; overflow: auto; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="max-w-3xl mx-auto">
        {/* Barra de ações */}
        <div className="flex items-center justify-between mb-6 no-print">
          <div className="flex items-center gap-3">
            <button onClick={onVoltar} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <ArrowLeft size={18} className="text-slate-500" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Ficha Cirúrgica</h2>
              <p className="text-sm text-slate-400">{cirurgia.nome_pet} · {formatarData(cirurgia.data)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onEditar}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              <Pencil size={14} />Editar
            </button>
            <button onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">
              <Printer size={14} />Imprimir / PDF
            </button>
          </div>
        </div>

        <div id="ficha-cirurgica-print">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">

            {/* Cabeçalho */}
            <div className="flex items-start justify-between mb-6 pb-5 border-b-2 border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">4u</span>
                  </div>
                  <span className="text-sm font-bold text-slate-700">4u TechPet</span>
                </div>
                <p className="text-xs text-slate-400">Ficha Cirúrgica · 4u Technology</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Cirurgia</p>
                <p className="text-2xl font-bold text-slate-800">#{String(cirurgia.id).padStart(4,'0')}</p>
              </div>
            </div>

            {/* Paciente */}
            <SecFicha titulo="Paciente">
              <Linha label="Nome"         valor={cirurgia.nome_pet} />
              <Linha label="Espécie/Raça" valor={[cirurgia.especie, cirurgia.raca].filter(Boolean).join(' — ') || null} />
              <Linha label="Tutor"        valor={cirurgia.nome_dono} />
              {cirurgia.telefone_dono && <Linha label="Telefone" valor={cirurgia.telefone_dono} />}
              <Linha label="Data"         valor={`${formatarData(cirurgia.data)}${cirurgia.hora_inicio ? ' · Início: ' + cirurgia.hora_inicio : ''}${cirurgia.hora_fim ? ' · Fim: ' + cirurgia.hora_fim : ''}${duracao ? ' · Duração: ' + duracao : ''}`} />
              <Linha label="Cirurgião"    valor={cirurgia.nome_cirurgiao ? `${cirurgia.nome_cirurgiao}${cirurgia.crmv_cirurgiao ? '  |  CRMV: ' + cirurgia.crmv_cirurgiao : ''}` : null} />
              <Linha label="Anestesista"  valor={cirurgia.nome_anestesista ? `${cirurgia.nome_anestesista}${cirurgia.crmv_anestesista ? '  |  CRMV: ' + cirurgia.crmv_anestesista : ''}` : null} />
              <Linha label="Procedimento" valor={cirurgia.tipo_cirurgia} />
            </SecFicha>

            {/* Pré-op */}
            {temPre && (
              <SecFicha titulo="Pré-operatório">
                <Linha label="Risco (ASA)"       valor={cirurgia.asa} />
                <Linha label="Jejum"              valor={cirurgia.jejum} />
                <Linha label="Exames pré-op"      valor={cirurgia.exames_pre_op} />
                <Linha label="MPA"                valor={cirurgia.pre_medicacao} />
              </SecFicha>
            )}

            {/* Anestesia */}
            {temAnes && (
              <SecFicha titulo="Protocolo Anestésico">
                <Linha label="Tipo"              valor={cirurgia.protocolo_anestesico} />
                <Linha label="Agente"            valor={cirurgia.agente_anestesico} />
                <Linha label="Dose"              valor={cirurgia.dose_anestesico} />
                <Linha label="Via"               valor={cirurgia.via_anestesica} />
              </SecFicha>
            )}

            {/* Trans-op */}
            {temTrans && (
              <SecFicha titulo="Trans-operatório">
                <Linha label="Intercorrências"   valor={cirurgia.intercorrencias} />
                <Linha label="Observações"       valor={cirurgia.obs_trans_op} />
              </SecFicha>
            )}

            {/* Pós-op */}
            {temPos && (
              <SecFicha titulo="Pós-operatório">
                <Linha label="Recuperação"       valor={cirurgia.recuperacao} />
                <Linha label="Cuidados"          valor={cirurgia.cuidados_pos} />
                <Linha label="Restrições"        valor={cirurgia.restricoes} />
                <Linha label="Retorno"           valor={cirurgia.retorno} />
              </SecFicha>
            )}

            {cirurgia.observacoes && (
              <SecFicha titulo="Observações Gerais">
                <p className="text-sm text-slate-700 pt-1">{cirurgia.observacoes}</p>
              </SecFicha>
            )}

            {/* Assinaturas */}
            <div className="mt-10 pt-4 border-t border-slate-100 grid grid-cols-2 gap-8">
              {[
                { nome: cirurgia.nome_cirurgiao,   crmv: cirurgia.crmv_cirurgiao,   label: 'Cirurgião' },
                { nome: cirurgia.nome_anestesista, crmv: cirurgia.crmv_anestesista, label: 'Anestesista' },
              ].map(({ nome, crmv, label }) => (
                <div key={label} className="text-center">
                  <div className="h-8" />
                  <div className="w-full h-px bg-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-700">{nome || label}</p>
                  {crmv && <p className="text-xs text-slate-400 mt-0.5">CRMV: {crmv}</p>}
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

// ── Card ──────────────────────────────────────────────────

function CirurgiaCard({ cirurgia, onVer, onEditar, onDeletar }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-all group">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-violet-50">
          {cirurgia.foto_pet
            ? <img src={cirurgia.foto_pet} alt={cirurgia.nome_pet} className="w-full h-full object-cover" />
            : <Scissors size={17} className="text-violet-500" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-slate-800">{cirurgia.nome_pet}</h3>
            {cirurgia.especie && <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{cirurgia.especie}</span>}
          </div>
          {cirurgia.nome_dono && <p className="text-xs text-slate-400 mt-0.5">Tutor: {cirurgia.nome_dono}</p>}
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar size={10} />{formatarData(cirurgia.data)}
            </span>
            {cirurgia.hora_inicio && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock size={10} />{cirurgia.hora_inicio}
              </span>
            )}
            {cirurgia.nome_cirurgiao && (
              <span className="text-xs text-slate-400">Dr(a). {cirurgia.nome_cirurgiao}</span>
            )}
          </div>
          {cirurgia.tipo_cirurgia && (
            <p className="text-xs text-slate-600 font-medium mt-2 bg-violet-50 text-violet-700 rounded-xl px-3 py-1.5 inline-block">
              {cirurgia.tipo_cirurgia}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEditar(cirurgia)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Editar">
              <Pencil size={13} />
            </button>
            <button onClick={() => onDeletar(cirurgia)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Excluir">
              <Trash2 size={13} />
            </button>
          </div>
          <button onClick={() => onVer(cirurgia)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg text-xs font-medium hover:bg-violet-100 transition-colors">
            <FileText size={12} />Ver ficha
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1,2,3].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 flex gap-3">
          <div className="w-11 h-11 bg-slate-100 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-100 rounded w-32" />
            <div className="h-3 bg-slate-50 rounded w-48" />
            <div className="h-6 bg-violet-50 rounded-xl w-48 mt-2" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────

export default function Cirurgias() {
  const [view, setView]               = useState('lista')
  const [lista, setLista]             = useState([])
  const [cirurgiaAtual, setCirurgiaAtual] = useState(null)
  const [busca, setBusca]             = useState('')
  const [carregando, setCarregando]   = useState(true)
  const [modalDelete, setModalDelete] = useState(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try { setLista(await window.api.cirurgias.listar()) }
    finally { setCarregando(false) }
  }, [])

  useEffect(() => { carregar() }, [carregar])
  useEffect(() => {
    if (sessionStorage.getItem('clinica_pet_preselect')) nova()
  }, []) // eslint-disable-line

  function verFicha(c)  { setCirurgiaAtual(c); setView('ficha') }
  function editar(c)    { setCirurgiaAtual(c); setView('formulario') }
  function nova()       { setCirurgiaAtual(null); setView('formulario') }
  function handleSalvar()  { setView('lista'); setCirurgiaAtual(null); carregar() }
  function handleCancelar(){ setView('lista'); setCirurgiaAtual(null) }

  if (view === 'formulario') {
    return <CirurgiaFormulario cirurgia={cirurgiaAtual} onSalvar={handleSalvar} onCancelar={handleCancelar} />
  }
  if (view === 'ficha') {
    return <FichaCirurgica cirurgia={cirurgiaAtual} onVoltar={handleCancelar} onEditar={() => setView('formulario')} />
  }

  const mesAtual   = new Date().toISOString().slice(0, 7)
  const totalMes   = lista.filter(c => c.data?.startsWith(mesAtual)).length
  const petsUnicos = new Set(lista.map(c => c.id_pet)).size

  const listaFiltrada = lista.filter(c => {
    if (!busca.trim()) return true
    const t = busca.toLowerCase()
    return (
      (c.nome_pet      || '').toLowerCase().includes(t) ||
      (c.nome_dono     || '').toLowerCase().includes(t) ||
      (c.tipo_cirurgia || '').toLowerCase().includes(t) ||
      (c.nome_cirurgiao|| '').toLowerCase().includes(t)
    )
  })

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Cirurgias</h2>
          <p className="text-sm text-slate-400 mt-0.5">{lista.length} procedimento{lista.length !== 1 ? 's' : ''} registrado{lista.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={nova}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-emerald-700 transition-colors">
          <Plus size={16} />Nova cirurgia
        </button>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total de cirurgias',  valor: lista.length, cor: 'violet', icon: Scissors  },
          { label: 'Cirurgias este mês',  valor: totalMes,     cor: 'blue',   icon: Calendar  },
          { label: 'Pacientes operados',  valor: petsUnicos,   cor: 'emerald',icon: PawPrint  },
        ].map(({ label, valor, cor, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className={`w-9 h-9 bg-${cor}-50 rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={16} className={`text-${cor}-600`} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{valor}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Busca */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por pet, tutor, procedimento ou cirurgião..."
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
      </div>

      {/* Lista */}
      {carregando ? <Skeleton /> : listaFiltrada.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
            <Scissors size={28} className="text-slate-300" />
          </div>
          <h3 className="text-sm font-semibold text-slate-600 mb-1">
            {busca ? 'Nenhuma cirurgia encontrada' : 'Nenhuma cirurgia registrada'}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mb-4">
            {busca ? 'Tente outro termo de busca.' : 'Registre a primeira cirurgia para começar.'}
          </p>
          {!busca && (
            <button onClick={nova}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 transition-colors">
              <Plus size={13} />Nova cirurgia
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {listaFiltrada.map(c => (
            <CirurgiaCard key={c.id} cirurgia={c} onVer={verFicha} onEditar={editar} onDeletar={setModalDelete} />
          ))}
        </div>
      )}

      {modalDelete && (
        <ModalDelete
          cirurgia={modalDelete}
          onConfirmar={() => { setModalDelete(null); carregar() }}
          onFechar={() => setModalDelete(null)}
        />
      )}
    </div>
  )
}
