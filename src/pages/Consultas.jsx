import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Stethoscope, Plus, Search, Pencil, Trash2, X,
  ArrowLeft, Printer, PawPrint, Calendar, FileText
} from 'lucide-react'
import CampoClinico from '../components/CampoClinico'

// ── Utilitários ───────────────────────────────────────────

function formatarData(data) {
  if (!data) return ''
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

function hoje() {
  return new Date().toISOString().split('T')[0]
}

function horaAtual() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ── BuscaPet ─────────────────────────────────────────────

function BuscaPet({ petSelecionado, onSelect, erro }) {
  const [busca, setBusca] = useState(petSelecionado?.nome || '')
  const [resultados, setResultados] = useState([])
  const [aberto, setAberto] = useState(false)
  const timer = useRef(null)
  const ref = useRef(null)

  useEffect(() => {
    if (petSelecionado) setBusca(petSelecionado.nome)
    else setBusca('')
  }, [petSelecionado])

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setAberto(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
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
        <input
          type="text"
          value={busca}
          onChange={e => handleChange(e.target.value)}
          placeholder="Digite o nome do pet para buscar..."
          className={`w-full pl-9 pr-9 py-2.5 border rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:border-transparent bg-white transition-shadow ${
            erro ? 'border-red-300 focus:ring-red-400' : 'border-slate-200 focus:ring-emerald-500'
          }`}
        />
        {petSelecionado && (
          <button
            onClick={() => { onSelect(null); setBusca('') }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {aberto && resultados.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-20 mt-1 max-h-48 overflow-y-auto">
          {resultados.map(pet => (
            <button
              key={pet.id}
              onClick={() => { onSelect(pet); setBusca(pet.nome); setAberto(false) }}
              className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 flex items-center gap-3 transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
              <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <PawPrint size={12} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">{pet.nome}</p>
                <p className="text-xs text-slate-400">
                  {[pet.especie, pet.raca, pet.nome_dono].filter(Boolean).join(' · ')}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
      {erro && <p className="text-xs text-red-500 mt-1">{erro}</p>}
    </div>
  )
}

// ── Modal confirmar exclusão ──────────────────────────────

function ModalDelete({ consulta, onConfirmar, onFechar }) {
  const [deletando, setDeletando] = useState(false)

  async function confirmar() {
    setDeletando(true)
    await window.api.consultas.deletar(consulta.id)
    onConfirmar()
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} className="text-red-500" />
        </div>
        <h3 className="font-semibold text-slate-800 mb-1">Excluir prontuário?</h3>
        <p className="text-sm text-slate-400 mb-5">
          Consulta de <strong>{consulta.nome_pet}</strong> em{' '}
          <strong>{formatarData(consulta.data)}</strong> será removida permanentemente.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onFechar}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={deletando}
            className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {deletando ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Formulário ────────────────────────────────────────────

const CAMPOS_VAZIOS = {
  id_veterinario: '', id_agendamento: null,
  data: '', hora: '',
  queixa_principal: '', historico: '',
  peso: '', temperatura: '', freq_cardiaca: '', freq_respiratoria: '',
  mucosas: '', hidratacao: '', outros_exame: '',
  diagnostico_suspeita: '', diagnostico_definitivo: '',
  plano_terapeutico: '', retorno: '', observacoes: '',
}

const INPUT_CLS = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-shadow'
const TEXTAREA_CLS = INPUT_CLS + ' resize-none'

function Secao({ titulo, children }) {
  return (
    <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{titulo}</h3>
      {children}
    </div>
  )
}

function Campo({ label, obrigatorio, erro, children }) {
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

function ConsultaFormulario({ consulta, onSalvar, onCancelar }) {
  const [dados, setDados] = useState(() => ({
    ...CAMPOS_VAZIOS,
    data: hoje(),
    hora: horaAtual(),
    ...(consulta ? {
      id_veterinario:        consulta.id_veterinario        || '',
      id_agendamento:        consulta.id_agendamento        || null,
      data:                  consulta.data                  || '',
      hora:                  consulta.hora                  || '',
      queixa_principal:      consulta.queixa_principal      || '',
      historico:             consulta.historico             || '',
      peso:                  consulta.peso                  || '',
      temperatura:           consulta.temperatura           || '',
      freq_cardiaca:         consulta.freq_cardiaca         || '',
      freq_respiratoria:     consulta.freq_respiratoria     || '',
      mucosas:               consulta.mucosas               || '',
      hidratacao:            consulta.hidratacao            || '',
      outros_exame:          consulta.outros_exame          || '',
      diagnostico_suspeita:  consulta.diagnostico_suspeita  || '',
      diagnostico_definitivo:consulta.diagnostico_definitivo|| '',
      plano_terapeutico:     consulta.plano_terapeutico     || '',
      retorno:               consulta.retorno               || '',
      observacoes:           consulta.observacoes           || '',
    } : {})
  }))

  const [petSelecionado, setPetSelecionado] = useState(null)
  const [vets, setVets] = useState([])
  const [erros, setErros] = useState({})
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    window.api.veterinarios.listarAtivos().then(setVets)
    if (consulta?.id_pet) {
      window.api.pets.buscarPorId(consulta.id_pet).then(pet => {
        if (pet) setPetSelecionado(pet)
      })
    }
  }, [consulta])

  function setD(campo, valor) {
    setDados(d => ({ ...d, [campo]: valor }))
    if (erros[campo]) setErros(e => ({ ...e, [campo]: null }))
  }

  function validar() {
    const e = {}
    if (!petSelecionado) e.pet = 'Selecione um pet'
    if (!dados.data) e.data = 'Data é obrigatória'
    if (!dados.queixa_principal.trim()) e.queixa_principal = 'Queixa principal é obrigatória'
    return e
  }

  async function salvar() {
    const e = validar()
    if (Object.keys(e).length > 0) { setErros(e); return }
    setSalvando(true)
    try {
      const payload = {
        ...dados,
        id_pet:            petSelecionado.id,
        id_veterinario:    dados.id_veterinario    || null,
        peso:              dados.peso              ? parseFloat(dados.peso)              : null,
        temperatura:       dados.temperatura       ? parseFloat(dados.temperatura)       : null,
        freq_cardiaca:     dados.freq_cardiaca     ? parseInt(dados.freq_cardiaca)       : null,
        freq_respiratoria: dados.freq_respiratoria ? parseInt(dados.freq_respiratoria)   : null,
      }
      if (consulta?.id) {
        await window.api.consultas.editar(consulta.id, payload)
      } else {
        await window.api.consultas.criar(payload)
      }
      onSalvar()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onCancelar} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft size={18} className="text-slate-500" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {consulta ? 'Editar consulta' : 'Nova consulta'}
          </h2>
          <p className="text-sm text-slate-400">Preencha os dados do atendimento clínico</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Identificação */}
        <Secao titulo="Identificação">
          <Campo label="Pet" obrigatorio erro={erros.pet}>
            <BuscaPet
              petSelecionado={petSelecionado}
              onSelect={pet => { setPetSelecionado(pet); if (erros.pet) setErros(e => ({ ...e, pet: null })) }}
              erro={null}
            />
          </Campo>

          {petSelecionado && (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl flex-wrap">
              <PawPrint size={13} className="text-emerald-600 flex-shrink-0" />
              <span className="text-xs text-emerald-700 font-medium">{petSelecionado.nome}</span>
              {(petSelecionado.especie || petSelecionado.raca) && (
                <>
                  <span className="text-emerald-300 text-xs">·</span>
                  <span className="text-xs text-emerald-600">
                    {[petSelecionado.especie, petSelecionado.raca].filter(Boolean).join(', ')}
                  </span>
                </>
              )}
              {petSelecionado.nome_dono && (
                <>
                  <span className="text-emerald-300 text-xs">·</span>
                  <span className="text-xs text-emerald-600">Tutor: {petSelecionado.nome_dono}</span>
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Campo label="Veterinário responsável">
              <select
                value={dados.id_veterinario}
                onChange={e => setD('id_veterinario', e.target.value)}
                className={INPUT_CLS}
              >
                <option value="">Sem veterinário</option>
                {vets.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.nome}{v.crmv ? ` (${v.crmv})` : ''}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Data" obrigatorio erro={erros.data}>
              <input
                type="date"
                value={dados.data}
                onChange={e => setD('data', e.target.value)}
                className={INPUT_CLS}
              />
            </Campo>
            <Campo label="Horário">
              <input
                type="time"
                value={dados.hora}
                onChange={e => setD('hora', e.target.value)}
                className={INPUT_CLS}
              />
            </Campo>
          </div>
        </Secao>

        {/* Anamnese */}
        <Secao titulo="Anamnese">
          <Campo label="Queixa principal" obrigatorio erro={erros.queixa_principal}>
            <CampoClinico
              value={dados.queixa_principal}
              onChange={e => setD('queixa_principal', e.target.value)}
              placeholder="Descreva o motivo da consulta..."
              rows={2}
              className={TEXTAREA_CLS}
            />
          </Campo>
          <Campo label="Histórico / Evolução">
            <CampoClinico
              value={dados.historico}
              onChange={e => setD('historico', e.target.value)}
              placeholder="Histórico clínico, evolução dos sintomas, tratamentos anteriores..."
              rows={3}
              className={TEXTAREA_CLS}
            />
          </Campo>
        </Secao>

        {/* Exame Físico */}
        <Secao titulo="Exame Físico">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Campo label="Peso (kg)">
              <input
                type="number" step="0.01" min="0"
                value={dados.peso}
                onChange={e => setD('peso', e.target.value)}
                placeholder="0,00"
                className={INPUT_CLS}
              />
            </Campo>
            <Campo label="Temperatura (°C)">
              <input
                type="number" step="0.1" min="0"
                value={dados.temperatura}
                onChange={e => setD('temperatura', e.target.value)}
                placeholder="38,5"
                className={INPUT_CLS}
              />
            </Campo>
            <Campo label="F.C. (bpm)">
              <input
                type="number" step="1" min="0"
                value={dados.freq_cardiaca}
                onChange={e => setD('freq_cardiaca', e.target.value)}
                placeholder="80"
                className={INPUT_CLS}
              />
            </Campo>
            <Campo label="F.R. (rpm)">
              <input
                type="number" step="1" min="0"
                value={dados.freq_respiratoria}
                onChange={e => setD('freq_respiratoria', e.target.value)}
                placeholder="20"
                className={INPUT_CLS}
              />
            </Campo>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Campo label="Mucosas">
              <select
                value={dados.mucosas}
                onChange={e => setD('mucosas', e.target.value)}
                className={INPUT_CLS}
              >
                <option value="">Selecionar...</option>
                {['Normocoradas (rosadas)', 'Pálidas', 'Ictéricas (amareladas)', 'Cianóticas (azuladas)', 'Hiperêmicas', 'Congestionadas'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Campo>
            <Campo label="Hidratação">
              <select
                value={dados.hidratacao}
                onChange={e => setD('hidratacao', e.target.value)}
                className={INPUT_CLS}
              >
                <option value="">Selecionar...</option>
                {['Hidratado', 'Desidratação leve (5-6%)', 'Desidratação moderada (7-8%)', 'Desidratação grave (>10%)'].map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </Campo>
          </div>
          <Campo label="Outros achados do exame físico">
            <CampoClinico
              value={dados.outros_exame}
              onChange={e => setD('outros_exame', e.target.value)}
              placeholder="Linfonodos, auscultação, palpação abdominal, pele, anexos..."
              rows={2}
              className={TEXTAREA_CLS}
            />
          </Campo>
        </Secao>

        {/* Diagnóstico */}
        <Secao titulo="Diagnóstico">
          <Campo label="Suspeita diagnóstica">
            <CampoClinico
              value={dados.diagnostico_suspeita}
              onChange={e => setD('diagnostico_suspeita', e.target.value)}
              placeholder="Hipóteses diagnósticas..."
              rows={2}
              className={TEXTAREA_CLS}
            />
          </Campo>
          <Campo label="Diagnóstico definitivo">
            <CampoClinico
              value={dados.diagnostico_definitivo}
              onChange={e => setD('diagnostico_definitivo', e.target.value)}
              placeholder="Diagnóstico confirmado..."
              rows={2}
              className={TEXTAREA_CLS}
            />
          </Campo>
        </Secao>

        {/* Plano Terapêutico */}
        <Secao titulo="Plano Terapêutico">
          <Campo label="Tratamento / Medicações / Orientações">
            <CampoClinico
              value={dados.plano_terapeutico}
              onChange={e => setD('plano_terapeutico', e.target.value)}
              placeholder="Medicações prescritas, procedimentos, orientações ao tutor..."
              rows={4}
              className={TEXTAREA_CLS}
            />
          </Campo>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Campo label="Retorno em">
              <input
                type="text"
                value={dados.retorno}
                onChange={e => setD('retorno', e.target.value)}
                placeholder="Ex: 7 dias, 1 mês, conforme necessário..."
                className={INPUT_CLS}
              />
            </Campo>
            <Campo label="Observações gerais">
              <input
                type="text"
                value={dados.observacoes}
                onChange={e => setD('observacoes', e.target.value)}
                placeholder="Informações adicionais..."
                className={INPUT_CLS}
              />
            </Campo>
          </div>
        </Secao>

        {/* Botões */}
        <div className="flex gap-3 pt-2 pb-6">
          <button
            onClick={onCancelar}
            className="flex-1 py-3 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={salvando}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {salvando ? 'Salvando...' : consulta ? 'Salvar alterações' : 'Registrar consulta'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Prontuário (visualização + impressão) ─────────────────

function LinhaProntuario({ label, valor }) {
  if (!valor && valor !== 0) return null
  return (
    <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-400 col-span-1 pt-0.5">{label}</span>
      <span className="text-sm text-slate-800 col-span-2 whitespace-pre-wrap">{valor}</span>
    </div>
  )
}

function SecaoProntuario({ titulo, children }) {
  return (
    <div className="mb-5">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pb-1 border-b-2 border-slate-100">
        {titulo}
      </h3>
      <div>{children}</div>
    </div>
  )
}

function Prontuario({ consulta, onVoltar, onEditar }) {
  const temExame = consulta.peso || consulta.temperatura || consulta.freq_cardiaca ||
    consulta.freq_respiratoria || consulta.mucosas || consulta.hidratacao || consulta.outros_exame
  const temDiagnostico = consulta.diagnostico_suspeita || consulta.diagnostico_definitivo
  const temPlano = consulta.plano_terapeutico || consulta.retorno

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          #prontuario-print-wrap { display: block !important; position: fixed; inset: 0; padding: 24px; background: white; z-index: 9999; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="max-w-3xl mx-auto">
        {/* Barra de ações — não imprime */}
        <div className="flex items-center justify-between mb-6 no-print">
          <div className="flex items-center gap-3">
            <button onClick={onVoltar} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <ArrowLeft size={18} className="text-slate-500" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Prontuário Médico</h2>
              <p className="text-sm text-slate-400">
                {consulta.nome_pet} · {formatarData(consulta.data)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onEditar}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Pencil size={14} />
              Editar
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Printer size={14} />
              Imprimir / PDF
            </button>
          </div>
        </div>

        {/* Conteúdo do prontuário */}
        <div id="prontuario-print-wrap">
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
                <p className="text-xs text-slate-400">Sistema de Gestão Veterinária · 4u Technology</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Prontuário</p>
                <p className="text-2xl font-bold text-slate-800">#{String(consulta.id).padStart(4, '0')}</p>
              </div>
            </div>

            {/* Dados do paciente */}
            <SecaoProntuario titulo="Dados do Paciente">
              <LinhaProntuario label="Nome" valor={consulta.nome_pet} />
              <LinhaProntuario
                label="Espécie / Raça"
                valor={[consulta.especie, consulta.raca].filter(Boolean).join(' — ') || null}
              />
              <LinhaProntuario label="Tutor" valor={consulta.nome_dono} />
              <LinhaProntuario
                label="Data da consulta"
                valor={`${formatarData(consulta.data)}${consulta.hora ? ' às ' + consulta.hora : ''}`}
              />
              <LinhaProntuario
                label="Médico Veterinário"
                valor={consulta.nome_vet
                  ? `${consulta.nome_vet}${consulta.crmv ? '  |  CRMV: ' + consulta.crmv : ''}`
                  : null}
              />
            </SecaoProntuario>

            {/* Anamnese */}
            <SecaoProntuario titulo="Anamnese">
              <LinhaProntuario label="Queixa principal" valor={consulta.queixa_principal} />
              <LinhaProntuario label="Histórico" valor={consulta.historico} />
            </SecaoProntuario>

            {/* Exame Físico */}
            {temExame && (
              <SecaoProntuario titulo="Exame Físico">
                {consulta.peso        && <LinhaProntuario label="Peso"              valor={`${consulta.peso} kg`} />}
                {consulta.temperatura && <LinhaProntuario label="Temperatura"       valor={`${consulta.temperatura} °C`} />}
                {consulta.freq_cardiaca    && <LinhaProntuario label="Freq. Cardíaca"    valor={`${consulta.freq_cardiaca} bpm`} />}
                {consulta.freq_respiratoria && <LinhaProntuario label="Freq. Respiratória" valor={`${consulta.freq_respiratoria} rpm`} />}
                <LinhaProntuario label="Mucosas"       valor={consulta.mucosas} />
                <LinhaProntuario label="Hidratação"    valor={consulta.hidratacao} />
                <LinhaProntuario label="Outros achados" valor={consulta.outros_exame} />
              </SecaoProntuario>
            )}

            {/* Diagnóstico */}
            {temDiagnostico && (
              <SecaoProntuario titulo="Diagnóstico">
                <LinhaProntuario label="Suspeita"   valor={consulta.diagnostico_suspeita} />
                <LinhaProntuario label="Definitivo" valor={consulta.diagnostico_definitivo} />
              </SecaoProntuario>
            )}

            {/* Plano Terapêutico */}
            {temPlano && (
              <SecaoProntuario titulo="Plano Terapêutico">
                <LinhaProntuario label="Tratamento" valor={consulta.plano_terapeutico} />
                <LinhaProntuario label="Retorno"    valor={consulta.retorno} />
              </SecaoProntuario>
            )}

            {consulta.observacoes && (
              <SecaoProntuario titulo="Observações">
                <p className="text-sm text-slate-700 pt-1">{consulta.observacoes}</p>
              </SecaoProntuario>
            )}

            {/* Assinatura */}
            <div className="mt-10 pt-4 border-t border-slate-100 flex justify-end">
              <div className="text-center min-w-[200px]">
                <div className="w-full h-px bg-slate-300 mb-2 mt-8" />
                <p className="text-sm font-medium text-slate-700">
                  {consulta.nome_vet || 'Médico Veterinário'}
                </p>
                {consulta.crmv && (
                  <p className="text-xs text-slate-400 mt-0.5">CRMV: {consulta.crmv}</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

// ── Card de consulta ──────────────────────────────────────

function ConsultaCard({ consulta, onVer, onEditar, onDeletar }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-all group">
      <div className="flex items-start gap-3">

        {/* Avatar do pet */}
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-emerald-50">
          {consulta.foto_pet ? (
            <img src={consulta.foto_pet} alt={consulta.nome_pet} className="w-full h-full object-cover" />
          ) : (
            <PawPrint size={18} className="text-emerald-600" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-slate-800">{consulta.nome_pet}</h3>
            {consulta.especie && (
              <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                {consulta.especie}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {consulta.nome_dono && (
              <span className="text-xs text-slate-400">Tutor: {consulta.nome_dono}</span>
            )}
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar size={10} />
              {formatarData(consulta.data)}{consulta.hora ? ` às ${consulta.hora}` : ''}
            </span>
          </div>
          {consulta.nome_vet && (
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Stethoscope size={10} />
              {consulta.nome_vet}
            </p>
          )}
          {consulta.queixa_principal && (
            <p className="text-xs text-slate-500 mt-2 line-clamp-2 bg-slate-50 rounded-xl px-3 py-2">
              {consulta.queixa_principal}
            </p>
          )}
        </div>

        {/* Ações */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEditar(consulta)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="Editar"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDeletar(consulta)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Excluir"
            >
              <Trash2 size={13} />
            </button>
          </div>
          <button
            onClick={() => onVer(consulta)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors"
          >
            <FileText size={12} />
            Ver prontuário
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
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 flex gap-3">
          <div className="w-11 h-11 bg-slate-100 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-100 rounded w-32" />
            <div className="h-3 bg-slate-50 rounded w-48" />
            <div className="h-8 bg-slate-50 rounded-xl w-full mt-2" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────

export default function Consultas() {
  const [view, setView] = useState('lista') // 'lista' | 'formulario' | 'prontuario'
  const [listaConsultas, setListaConsultas] = useState([])
  const [consultaAtual, setConsultaAtual] = useState(null)
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [modalDelete, setModalDelete] = useState(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const lista = await window.api.consultas.listar()
      setListaConsultas(lista)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  function verProntuario(c)  { setConsultaAtual(c); setView('prontuario') }
  function editarConsulta(c) { setConsultaAtual(c); setView('formulario') }
  function novaConsulta()    { setConsultaAtual(null); setView('formulario') }

  function handleSalvar() {
    setView('lista')
    setConsultaAtual(null)
    carregar()
  }

  function handleCancelar() {
    setView('lista')
    setConsultaAtual(null)
  }

  // ── Views alternativas ────────────────────────────────
  if (view === 'formulario') {
    return (
      <ConsultaFormulario
        consulta={consultaAtual}
        onSalvar={handleSalvar}
        onCancelar={handleCancelar}
      />
    )
  }

  if (view === 'prontuario') {
    return (
      <Prontuario
        consulta={consultaAtual}
        onVoltar={handleCancelar}
        onEditar={() => setView('formulario')}
      />
    )
  }

  // ── Lista ─────────────────────────────────────────────
  const mesAtual = new Date().toISOString().slice(0, 7)
  const totalMes = listaConsultas.filter(c => c.data && c.data.startsWith(mesAtual)).length
  const petsUnicos = new Set(listaConsultas.map(c => c.id_pet)).size

  const consultasFiltradas = listaConsultas.filter(c => {
    if (!busca.trim()) return true
    const t = busca.toLowerCase()
    return (
      (c.nome_pet              || '').toLowerCase().includes(t) ||
      (c.nome_dono             || '').toLowerCase().includes(t) ||
      (c.nome_vet              || '').toLowerCase().includes(t) ||
      (c.queixa_principal      || '').toLowerCase().includes(t) ||
      (c.diagnostico_definitivo|| '').toLowerCase().includes(t)
    )
  })

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Consultas</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {listaConsultas.length} prontuário{listaConsultas.length !== 1 ? 's' : ''} registrado{listaConsultas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={novaConsulta}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <Plus size={16} />
          Nova consulta
        </button>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total de consultas',    valor: listaConsultas.length, icon: FileText,    cor: 'emerald' },
          { label: 'Consultas este mês',    valor: totalMes,              icon: Calendar,    cor: 'blue'    },
          { label: 'Pacientes atendidos',   valor: petsUnicos,            icon: PawPrint,    cor: 'violet'  },
        ].map(({ label, valor, icon: Icon, cor }) => (
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
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por pet, tutor, veterinário ou diagnóstico..."
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      {/* Lista */}
      {carregando ? (
        <Skeleton />
      ) : consultasFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
            <Stethoscope size={28} className="text-slate-300" />
          </div>
          <h3 className="text-sm font-semibold text-slate-600 mb-1">
            {busca ? 'Nenhuma consulta encontrada' : 'Nenhuma consulta registrada'}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mb-4">
            {busca
              ? 'Tente outro termo de busca.'
              : 'Registre a primeira consulta para começar.'}
          </p>
          {!busca && (
            <button
              onClick={novaConsulta}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 transition-colors"
            >
              <Plus size={13} />
              Nova consulta
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {consultasFiltradas.map(c => (
            <ConsultaCard
              key={c.id}
              consulta={c}
              onVer={verProntuario}
              onEditar={editarConsulta}
              onDeletar={setModalDelete}
            />
          ))}
        </div>
      )}

      {/* Modal delete */}
      {modalDelete && (
        <ModalDelete
          consulta={modalDelete}
          onConfirmar={() => { setModalDelete(null); carregar() }}
          onFechar={() => setModalDelete(null)}
        />
      )}

    </div>
  )
}
