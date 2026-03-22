import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ClipboardList, Plus, Search, Pencil, Trash2, X,
  ArrowLeft, Printer, PawPrint, Calendar, Pill
} from 'lucide-react'
import CampoClinico from '../components/CampoClinico'

// ── Utilitários ───────────────────────────────────────────

function formatarData(d) {
  if (!d) return ''
  const [ano, mes, dia] = d.split('-')
  return `${dia}/${mes}/${ano}`
}
function hoje() { return new Date().toISOString().split('T')[0] }

// ── BuscaPet ─────────────────────────────────────────────

function BuscaPet({ petSelecionado, onSelect, erro }) {
  const [busca, setBusca]           = useState(petSelecionado?.nome || '')
  const [resultados, setResultados] = useState([])
  const [aberto, setAberto]         = useState(false)
  const timer = useRef(null)
  const ref   = useRef(null)

  useEffect(() => { setBusca(petSelecionado?.nome || '') }, [petSelecionado])

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

function ModalDelete({ prescricao, onConfirmar, onFechar }) {
  const [deletando, setDeletando] = useState(false)
  async function confirmar() {
    setDeletando(true)
    await window.api.prescricoes.deletar(prescricao.id)
    onConfirmar()
  }
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} className="text-red-500" />
        </div>
        <h3 className="font-semibold text-slate-800 mb-1">Excluir receita?</h3>
        <p className="text-sm text-slate-400 mb-5">
          Receita de <strong>{prescricao.nome_pet}</strong> em{' '}
          <strong>{formatarData(prescricao.data)}</strong> será removida permanentemente.
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

// ── Item de medicamento ───────────────────────────────────

const ITEM_VAZIO = {
  medicamento: '', concentracao: '', forma: '',
  dose: '', frequencia: '', duracao: '', via: '', observacoes: ''
}

const FORMAS = ['Comprimido', 'Cápsula', 'Solução oral', 'Injetável', 'Pomada', 'Colírio', 'Sachê', 'Suspensão', 'Spray', 'Outro']
const VIAS   = ['Oral (VO)', 'Intravenosa (IV)', 'Intramuscular (IM)', 'Subcutânea (SC)', 'Tópica', 'Ocular', 'Auricular', 'Retal']

function ItemMedicamento({ item, index, onChange, onRemover, unico }) {
  const cls = 'w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white'

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Medicamento {index + 1}
        </span>
        {!unico && (
          <button onClick={onRemover}
            className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Linha 1: Nome + Concentração + Forma */}
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-1">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Medicamento *</label>
          <input type="text" value={item.medicamento}
            onChange={e => onChange('medicamento', e.target.value)}
            placeholder="Ex: Amoxicilina" className={cls} />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Concentração</label>
          <input type="text" value={item.concentracao}
            onChange={e => onChange('concentracao', e.target.value)}
            placeholder="Ex: 500mg" className={cls} />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Forma</label>
          <select value={item.forma} onChange={e => onChange('forma', e.target.value)} className={cls}>
            <option value="">Selecionar...</option>
            {FORMAS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      {/* Linha 2: Dose + Frequência + Duração + Via */}
      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Dose</label>
          <input type="text" value={item.dose}
            onChange={e => onChange('dose', e.target.value)}
            placeholder="Ex: 1 comprimido" className={cls} />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Frequência</label>
          <input type="text" value={item.frequencia}
            onChange={e => onChange('frequencia', e.target.value)}
            placeholder="Ex: A cada 8h" className={cls} />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Duração</label>
          <input type="text" value={item.duracao}
            onChange={e => onChange('duracao', e.target.value)}
            placeholder="Ex: 7 dias" className={cls} />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Via</label>
          <select value={item.via} onChange={e => onChange('via', e.target.value)} className={cls}>
            <option value="">Selecionar...</option>
            {VIAS.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Observações do item */}
      <div>
        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Obs. do medicamento</label>
        <input type="text" value={item.observacoes}
          onChange={e => onChange('observacoes', e.target.value)}
          placeholder="Ex: Dar com alimento, não partir o comprimido..." className={cls} />
      </div>
    </div>
  )
}

// ── Formulário de prescrição ──────────────────────────────

function PrescricaoFormulario({ prescricao, onSalvar, onCancelar }) {
  const [dados, setDados] = useState({
    id_veterinario: prescricao?.id_veterinario || '',
    id_consulta:    prescricao?.id_consulta    || null,
    data:           prescricao?.data           || hoje(),
    observacoes:    prescricao?.observacoes    || '',
  })
  const [itens, setItens]               = useState(
    prescricao?.itens?.length > 0
      ? prescricao.itens.map(i => ({ ...ITEM_VAZIO, ...i }))
      : [{ ...ITEM_VAZIO }]
  )
  const [petSelecionado, setPetSelecionado] = useState(null)
  const [vets, setVets]                 = useState([])
  const [erros, setErros]               = useState({})
  const [salvando, setSalvando]         = useState(false)

  useEffect(() => {
    window.api.veterinarios.listarAtivos().then(setVets)
    if (prescricao?.id_pet) {
      window.api.pets.buscarPorId(prescricao.id_pet).then(p => { if (p) setPetSelecionado(p) })
    }
  }, [prescricao])

  function addItem()      { setItens(prev => [...prev, { ...ITEM_VAZIO }]) }
  function removeItem(i)  { setItens(prev => prev.filter((_, idx) => idx !== i)) }
  function updateItem(i, campo, valor) {
    setItens(prev => prev.map((item, idx) => idx === i ? { ...item, [campo]: valor } : item))
  }

  function validar() {
    const e = {}
    if (!petSelecionado) e.pet = 'Selecione um pet'
    if (!dados.data)     e.data = 'Data é obrigatória'
    if (itens.every(item => !item.medicamento.trim())) e.itens = 'Adicione pelo menos um medicamento'
    return e
  }

  async function salvar() {
    const e = validar()
    if (Object.keys(e).length > 0) { setErros(e); return }
    setSalvando(true)
    try {
      const payload = {
        ...dados,
        id_pet:         petSelecionado.id,
        id_veterinario: dados.id_veterinario || null,
        id_consulta:    dados.id_consulta    || null,
        itens: itens.filter(i => i.medicamento.trim()),
      }
      if (prescricao?.id) {
        await window.api.prescricoes.editar(prescricao.id, payload)
      } else {
        await window.api.prescricoes.criar(payload)
      }
      onSalvar()
    } finally {
      setSalvando(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-shadow'

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onCancelar} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft size={18} className="text-slate-500" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{prescricao ? 'Editar receita' : 'Nova receita médica'}</h2>
          <p className="text-sm text-slate-400">Preencha os dados da prescrição</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Identificação */}
        <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identificação</h3>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Paciente <span className="text-red-400">*</span></label>
            <BuscaPet
              petSelecionado={petSelecionado}
              onSelect={p => { setPetSelecionado(p); if (erros.pet) setErros(e => ({ ...e, pet: null })) }}
              erro={erros.pet}
            />
          </div>
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
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Médico Veterinário</label>
              <select value={dados.id_veterinario}
                onChange={e => setDados(d => ({ ...d, id_veterinario: e.target.value }))}
                className={inputCls}>
                <option value="">Sem veterinário</option>
                {vets.map(v => <option key={v.id} value={v.id}>{v.nome}{v.crmv ? ` (${v.crmv})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Data <span className="text-red-400">*</span></label>
              <input type="date" value={dados.data}
                onChange={e => setDados(d => ({ ...d, data: e.target.value }))}
                className={inputCls} />
              {erros.data && <p className="text-xs text-red-500 mt-1">{erros.data}</p>}
            </div>
          </div>
        </div>

        {/* Medicamentos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medicamentos</h3>
            {erros.itens && <p className="text-xs text-red-500">{erros.itens}</p>}
          </div>
          {itens.map((item, i) => (
            <ItemMedicamento
              key={i} item={item} index={i}
              onChange={(campo, valor) => updateItem(i, campo, valor)}
              onRemover={() => removeItem(i)}
              unico={itens.length === 1}
            />
          ))}
          <button onClick={addItem}
            className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-sm text-slate-400 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2">
            <Plus size={16} />
            Adicionar medicamento
          </button>
        </div>

        {/* Observações gerais */}
        <div className="bg-slate-50 rounded-2xl p-5">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Observações Gerais</h3>
          <CampoClinico value={dados.observacoes}
            onChange={e => setDados(d => ({ ...d, observacoes: e.target.value }))}
            placeholder="Instruções gerais para o tutor, cuidados especiais, observações clínicas..."
            rows={3}
            className={inputCls + ' resize-none'}
          />
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-2 pb-6">
          <button onClick={onCancelar} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors font-medium">
            Cancelar
          </button>
          <button onClick={salvar} disabled={salvando} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm">
            {salvando ? 'Salvando...' : prescricao ? 'Salvar alterações' : 'Emitir receita'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Receituário (visualização + impressão) ────────────────

function Receituario({ prescricao, onVoltar, onEditar }) {
  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          #receituario-print { display: block !important; position: fixed; inset: 0; padding: 32px; background: white; z-index: 9999; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="max-w-2xl mx-auto">
        {/* Barra de ações */}
        <div className="flex items-center justify-between mb-6 no-print">
          <div className="flex items-center gap-3">
            <button onClick={onVoltar} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <ArrowLeft size={18} className="text-slate-500" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Receita Médica</h2>
              <p className="text-sm text-slate-400">{prescricao.nome_pet} · {formatarData(prescricao.data)}</p>
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

        {/* Receituário */}
        <div id="receituario-print">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

            {/* Cabeçalho da clínica */}
            <div className="bg-emerald-600 px-8 py-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                      <span className="text-white text-sm font-bold">4u</span>
                    </div>
                    <span className="text-lg font-bold">4u TechPet</span>
                  </div>
                  <p className="text-emerald-100 text-sm">Sistema de Gestão Veterinária · 4u Technology</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-200 text-xs uppercase tracking-wider">Receita nº</p>
                  <p className="text-2xl font-bold">#{String(prescricao.id).padStart(4, '0')}</p>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 space-y-6">

              {/* Dados do paciente + tutor */}
              <div className="grid grid-cols-2 gap-6 pb-5 border-b border-slate-100">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Paciente</p>
                  <p className="text-base font-semibold text-slate-800">{prescricao.nome_pet}</p>
                  {(prescricao.especie || prescricao.raca) && (
                    <p className="text-sm text-slate-500">{[prescricao.especie, prescricao.raca].filter(Boolean).join(' — ')}</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tutor</p>
                  <p className="text-base font-semibold text-slate-800">{prescricao.nome_dono || '—'}</p>
                  {prescricao.telefone_dono && (
                    <p className="text-sm text-slate-500">{prescricao.telefone_dono}</p>
                  )}
                  {prescricao.endereco_dono && (
                    <p className="text-sm text-slate-400 mt-0.5 line-clamp-1">{prescricao.endereco_dono}</p>
                  )}
                </div>
              </div>

              {/* Data */}
              <div className="flex items-center justify-between text-sm text-slate-500 -mt-2">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-400" />
                  Data de emissão: <strong className="text-slate-700">{formatarData(prescricao.data)}</strong>
                </span>
              </div>

              {/* Medicamentos */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Prescrição</p>
                <div className="space-y-4">
                  {(prescricao.itens || []).map((item, i) => (
                    <div key={i} className="flex gap-4">
                      {/* Número */}
                      <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-emerald-700">{i + 1}</span>
                      </div>
                      {/* Conteúdo */}
                      <div className="flex-1 pb-4 border-b border-slate-100 last:border-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-base font-bold text-slate-800">{item.medicamento}</span>
                          {item.concentracao && <span className="text-sm text-slate-500">{item.concentracao}</span>}
                          {item.forma && (
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{item.forma}</span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-slate-600">
                          {item.dose       && <span><span className="text-slate-400">Dose:</span> {item.dose}</span>}
                          {item.frequencia && <span><span className="text-slate-400">Frequência:</span> {item.frequencia}</span>}
                          {item.duracao    && <span><span className="text-slate-400">Duração:</span> {item.duracao}</span>}
                          {item.via        && <span><span className="text-slate-400">Via:</span> {item.via}</span>}
                        </div>
                        {item.observacoes && (
                          <p className="mt-1 text-xs text-slate-400 italic">{item.observacoes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observações gerais */}
              {prescricao.observacoes && (
                <div className="bg-amber-50 rounded-xl px-4 py-3">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Observações</p>
                  <p className="text-sm text-amber-800">{prescricao.observacoes}</p>
                </div>
              )}

              {/* Assinatura */}
              <div className="pt-6 border-t border-slate-100 flex justify-center">
                <div className="text-center min-w-[220px]">
                  <div className="h-10" />
                  <div className="w-full h-px bg-slate-300 mb-3" />
                  <p className="text-sm font-semibold text-slate-800">
                    {prescricao.nome_vet || 'Médico Veterinário'}
                  </p>
                  {prescricao.crmv && (
                    <p className="text-xs text-slate-500 mt-0.5">CRMV: {prescricao.crmv}</p>
                  )}
                  {prescricao.especialidade_vet && (
                    <p className="text-xs text-slate-400 mt-0.5">{prescricao.especialidade_vet}</p>
                  )}
                  {prescricao.telefone_vet && (
                    <p className="text-xs text-slate-400 mt-0.5">{prescricao.telefone_vet}</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Card de prescrição ────────────────────────────────────

function PrescricaoCard({ prescricao, onVer, onEditar, onDeletar }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-all group">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-blue-50">
          {prescricao.foto_pet
            ? <img src={prescricao.foto_pet} alt={prescricao.nome_pet} className="w-full h-full object-cover" />
            : <Pill size={18} className="text-blue-500" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-slate-800">{prescricao.nome_pet}</h3>
            {prescricao.especie && (
              <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{prescricao.especie}</span>
            )}
          </div>
          {prescricao.nome_dono && (
            <p className="text-xs text-slate-400 mt-0.5">Tutor: {prescricao.nome_dono}</p>
          )}
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar size={10} />{formatarData(prescricao.data)}
            </span>
            {prescricao.nome_vet && (
              <span className="text-xs text-slate-400">Dr(a). {prescricao.nome_vet}</span>
            )}
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
              {prescricao.total_itens || 0} medicamento{prescricao.total_itens !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEditar(prescricao)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Editar">
              <Pencil size={13} />
            </button>
            <button onClick={() => onDeletar(prescricao)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Excluir">
              <Trash2 size={13} />
            </button>
          </div>
          <button onClick={() => onVer(prescricao)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
            <Printer size={12} />Ver receita
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
            <div className="h-5 bg-blue-50 rounded-full w-28 mt-1" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────

export default function Prescricoes() {
  const [view, setView]                       = useState('lista')
  const [lista, setLista]                     = useState([])
  const [prescricaoAtual, setPrescricaoAtual] = useState(null)
  const [busca, setBusca]                     = useState('')
  const [carregando, setCarregando]           = useState(true)
  const [modalDelete, setModalDelete]         = useState(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try { setLista(await window.api.prescricoes.listar()) }
    finally { setCarregando(false) }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function verReceita(p) {
    // Busca com itens completos antes de mostrar
    const completa = await window.api.prescricoes.buscarPorId(p.id)
    setPrescricaoAtual(completa)
    setView('receita')
  }

  function editar(p)        { setPrescricaoAtual(p); setView('formulario') }
  function nova()           { setPrescricaoAtual(null); setView('formulario') }
  function handleSalvar()   { setView('lista'); setPrescricaoAtual(null); carregar() }
  function handleCancelar() { setView('lista'); setPrescricaoAtual(null) }

  if (view === 'formulario') {
    return <PrescricaoFormulario prescricao={prescricaoAtual} onSalvar={handleSalvar} onCancelar={handleCancelar} />
  }
  if (view === 'receita') {
    return <Receituario prescricao={prescricaoAtual} onVoltar={handleCancelar} onEditar={() => setView('formulario')} />
  }

  const mesAtual   = new Date().toISOString().slice(0, 7)
  const totalMes   = lista.filter(p => p.data?.startsWith(mesAtual)).length
  const petsUnicos = new Set(lista.map(p => p.id_pet)).size

  const listaFiltrada = lista.filter(p => {
    if (!busca.trim()) return true
    const t = busca.toLowerCase()
    return (
      (p.nome_pet  || '').toLowerCase().includes(t) ||
      (p.nome_dono || '').toLowerCase().includes(t) ||
      (p.nome_vet  || '').toLowerCase().includes(t)
    )
  })

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Prescrições</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {lista.length} receita{lista.length !== 1 ? 's' : ''} emitida{lista.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={nova}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-emerald-700 transition-colors">
          <Plus size={16} />Nova receita
        </button>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Receitas emitidas',  valor: lista.length, cor: 'blue',   icon: ClipboardList },
          { label: 'Emitidas este mês',  valor: totalMes,     cor: 'emerald',icon: Calendar      },
          { label: 'Pacientes tratados', valor: petsUnicos,   cor: 'violet', icon: PawPrint      },
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
          placeholder="Buscar por pet, tutor ou veterinário..."
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
      </div>

      {/* Lista */}
      {carregando ? <Skeleton /> : listaFiltrada.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
            <ClipboardList size={28} className="text-slate-300" />
          </div>
          <h3 className="text-sm font-semibold text-slate-600 mb-1">
            {busca ? 'Nenhuma receita encontrada' : 'Nenhuma receita emitida'}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mb-4">
            {busca ? 'Tente outro termo de busca.' : 'Emita a primeira receita médica para começar.'}
          </p>
          {!busca && (
            <button onClick={nova}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 transition-colors">
              <Plus size={13} />Nova receita
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {listaFiltrada.map(p => (
            <PrescricaoCard key={p.id} prescricao={p} onVer={verReceita} onEditar={editar} onDeletar={setModalDelete} />
          ))}
        </div>
      )}

      {modalDelete && (
        <ModalDelete
          prescricao={modalDelete}
          onConfirmar={() => { setModalDelete(null); carregar() }}
          onFechar={() => setModalDelete(null)}
        />
      )}
    </div>
  )
}
