import { useState, useEffect, useRef } from 'react'
import {
  ArrowLeft, Save, Upload, X, User, PawPrint, Camera, Loader2
} from 'lucide-react'

const ESPECIES = [
  { label: 'Cachorro', emoji: '🐕' },
  { label: 'Gato',     emoji: '🐱' },
  { label: 'Pássaro',  emoji: '🐦' },
  { label: 'Coelho',   emoji: '🐰' },
  { label: 'Peixe',    emoji: '🐠' },
  { label: 'Outro',    emoji: '🐾' },
]

// ── Componentes reutilizáveis do formulário ───────────────

function Campo({ label, required, erro, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {erro && <p className="text-xs text-red-500 mt-1">{erro}</p>}
    </div>
  )
}

function Input({ erro, ...props }) {
  return (
    <input
      {...props}
      className={`
        w-full px-3 py-2.5 bg-white border rounded-xl text-sm text-slate-700
        placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow
        ${erro ? 'border-red-300 focus:ring-red-400' : 'border-slate-200 focus:ring-emerald-500'}
      `}
    />
  )
}

function Textarea({ ...props }) {
  return (
    <textarea
      {...props}
      rows={3}
      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow resize-none"
    />
  )
}

// ── Formulário principal ──────────────────────────────────

function PetFormulario({ pet, onSalvar, onCancelar }) {
  const editando = !!pet?.id
  const inputFotoRef = useRef()
  const [salvando, setSalvando] = useState(false)
  const [erros, setErros] = useState({})
  const [fotoPreview, setFotoPreview] = useState(pet?.foto || null)

  // Dados do tutor
  const [tutor, setTutor] = useState({
    nome: '', telefone: '', email: '', endereco: ''
  })

  // Dados do pet
  const [dados, setDados] = useState({
    nome:            pet?.nome            || '',
    especie:         pet?.especie         || '',
    raca:            pet?.raca            || '',
    data_nascimento: pet?.data_nascimento || '',
    peso:            pet?.peso            || '',
    observacoes:     pet?.observacoes     || '',
    foto:            pet?.foto            || null,
  })

  // Ao editar: busca os dados completos do dono (incl. endereço)
  useEffect(() => {
    if (editando && pet?.id_dono) {
      window.api.donos.buscarPorId(pet.id_dono).then(dono => {
        if (dono) setTutor({
          nome:     dono.nome     || '',
          telefone: dono.telefone || '',
          email:    dono.email    || '',
          endereco: dono.endereco || '',
        })
      })
    }
  }, [editando, pet?.id_dono])

  function setT(campo, val) {
    setTutor(t => ({ ...t, [campo]: val }))
    if (erros[campo]) setErros(e => ({ ...e, [campo]: null }))
  }
  function setD(campo, val) {
    setDados(d => ({ ...d, [campo]: val }))
    if (erros[campo]) setErros(e => ({ ...e, [campo]: null }))
  }

  // Foto: converte para base64 para salvar no banco
  function handleFoto(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('A foto deve ter no máximo 5MB.')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setFotoPreview(reader.result)
      setD('foto', reader.result)
    }
    reader.readAsDataURL(file)
  }

  function removerFoto() {
    setFotoPreview(null)
    setD('foto', null)
    if (inputFotoRef.current) inputFotoRef.current.value = ''
  }

  function validar() {
    const e = {}
    if (!tutor.nome.trim())  e.nome_tutor = 'Nome do tutor é obrigatório'
    if (!dados.nome.trim())  e.nome_pet   = 'Nome do pet é obrigatório'
    if (!dados.especie)      e.especie    = 'Selecione a espécie do pet'
    setErros(e)
    return Object.keys(e).length === 0
  }

  async function handleSalvar() {
    if (!validar()) return
    setSalvando(true)
    try {
      let id_dono = pet?.id_dono

      if (!editando) {
        // Cria novo tutor
        const novoDono = await window.api.donos.criar({
          nome:     tutor.nome.trim(),
          telefone: tutor.telefone || null,
          email:    tutor.email    || null,
          endereco: tutor.endereco || null,
        })
        id_dono = novoDono.id
      } else {
        // Atualiza tutor existente
        await window.api.donos.editar(id_dono, {
          nome:     tutor.nome.trim(),
          telefone: tutor.telefone || null,
          email:    tutor.email    || null,
          endereco: tutor.endereco || null,
        })
      }

      const dadosPet = {
        id_dono,
        nome:            dados.nome.trim(),
        especie:         dados.especie         || null,
        raca:            dados.raca?.trim()    || null,
        data_nascimento: dados.data_nascimento || null,
        peso:            dados.peso ? parseFloat(dados.peso) : null,
        observacoes:     dados.observacoes     || null,
        foto:            dados.foto            || null,
      }

      if (editando) {
        await window.api.pets.editar(pet.id, dadosPet)
      } else {
        await window.api.pets.criar(dadosPet)
      }

      onSalvar()
    } catch (err) {
      console.error('[PetFormulario] Erro ao salvar:', err)
      alert('Erro ao salvar. Verifique os dados e tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-6">

      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCancelar}
          className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {editando ? `Editar — ${pet.nome}` : 'Novo Pet'}
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {editando ? 'Atualize os dados do pet e do tutor' : 'Preencha os dados do tutor e do pet'}
          </p>
        </div>
      </div>

      {/* ── Seção 1: Tutor ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5">
        <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-slate-50">
          <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <User size={15} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Dados do Tutor</p>
            <p className="text-xs text-slate-400">Responsável pelo pet</p>
          </div>
        </div>

        <div className="space-y-3">
          <Campo label="Nome completo" required erro={erros.nome_tutor}>
            <Input
              value={tutor.nome}
              onChange={e => setT('nome', e.target.value)}
              placeholder="Ex: João da Silva"
              erro={erros.nome_tutor}
            />
          </Campo>

          <div className="grid grid-cols-2 gap-3">
            <Campo label="Telefone / WhatsApp">
              <Input
                value={tutor.telefone}
                onChange={e => setT('telefone', e.target.value)}
                placeholder="(00) 00000-0000"
                type="tel"
              />
            </Campo>
            <Campo label="E-mail">
              <Input
                value={tutor.email}
                onChange={e => setT('email', e.target.value)}
                placeholder="email@exemplo.com"
                type="email"
              />
            </Campo>
          </div>

          <Campo label="Endereço">
            <Input
              value={tutor.endereco}
              onChange={e => setT('endereco', e.target.value)}
              placeholder="Rua, número, bairro, cidade"
            />
          </Campo>
        </div>
      </div>

      {/* ── Seção 2: Pet ───────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5">
        <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-slate-50">
          <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <PawPrint size={15} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Dados do Pet</p>
            <p className="text-xs text-slate-400">Informações do animal</p>
          </div>
        </div>

        <div className="space-y-4">

          {/* Upload de foto */}
          <Campo label="Foto do pet">
            <div className="flex items-center gap-4">
              {fotoPreview ? (
                <div className="relative flex-shrink-0">
                  <img
                    src={fotoPreview}
                    alt="Preview"
                    className="w-20 h-20 rounded-xl object-cover border border-slate-200"
                  />
                  <button
                    onClick={removerFoto}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                  >
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => inputFotoRef.current?.click()}
                  className="w-20 h-20 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors flex-shrink-0"
                >
                  <Camera size={18} className="text-slate-300" />
                </div>
              )}
              <div>
                <button
                  onClick={() => inputFotoRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <Upload size={12} />
                  {fotoPreview ? 'Trocar foto' : 'Escolher foto'}
                </button>
                <p className="text-[11px] text-slate-400 mt-1.5">PNG ou JPG, máx. 5MB</p>
                <input
                  ref={inputFotoRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={handleFoto}
                />
              </div>
            </div>
          </Campo>

          {/* Nome e raça */}
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Nome do pet" required erro={erros.nome_pet}>
              <Input
                value={dados.nome}
                onChange={e => setD('nome', e.target.value)}
                placeholder="Ex: Rex"
                erro={erros.nome_pet}
              />
            </Campo>
            <Campo label="Raça">
              <Input
                value={dados.raca}
                onChange={e => setD('raca', e.target.value)}
                placeholder="Ex: Labrador"
              />
            </Campo>
          </div>

          {/* Espécie */}
          <Campo label="Espécie" required erro={erros.especie}>
            <div className="flex flex-wrap gap-2 mt-0.5">
              {ESPECIES.map(e => (
                <button
                  key={e.label}
                  type="button"
                  onClick={() => setD('especie', e.label)}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border
                    transition-all duration-150
                    ${dados.especie === e.label
                      ? 'bg-emerald-600 text-white border-emerald-600 scale-105 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'}
                  `}
                >
                  <span className="text-base leading-none">{e.emoji}</span>
                  {e.label}
                </button>
              ))}
            </div>
            {erros.especie && (
              <p className="text-xs text-red-500 mt-1">{erros.especie}</p>
            )}
          </Campo>

          {/* Data de nascimento e peso */}
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Data de nascimento">
              <Input
                type="date"
                value={dados.data_nascimento}
                onChange={e => setD('data_nascimento', e.target.value)}
              />
            </Campo>
            <Campo label="Peso atual (kg)">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="999"
                value={dados.peso}
                onChange={e => setD('peso', e.target.value)}
                placeholder="Ex: 8,5"
              />
            </Campo>
          </div>

          {/* Observações */}
          <Campo label="Observações">
            <Textarea
              value={dados.observacoes}
              onChange={e => setD('observacoes', e.target.value)}
              placeholder="Alergias, condições especiais, temperamento, medicamentos contínuos..."
            />
          </Campo>
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={onCancelar}
          disabled={salvando}
          className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleSalvar}
          disabled={salvando}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {salvando
            ? <Loader2 size={15} className="animate-spin" />
            : <Save size={15} />}
          {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar pet'}
        </button>
      </div>
    </div>
  )
}

export default PetFormulario
