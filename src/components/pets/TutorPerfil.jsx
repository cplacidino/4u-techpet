import { useState, useEffect } from 'react'
import {
  ArrowLeft, Plus, Phone, Mail, MapPin, User,
  Pencil, Trash2, Save, X, Loader2, PawPrint
} from 'lucide-react'

const ESPECIE_CONFIG = {
  'Cachorro': { cor: 'bg-amber-50 text-amber-500',   emoji: '🐕' },
  'Gato':     { cor: 'bg-purple-50 text-purple-500', emoji: '🐱' },
  'Pássaro':  { cor: 'bg-sky-50 text-sky-500',       emoji: '🐦' },
  'Coelho':   { cor: 'bg-pink-50 text-pink-500',     emoji: '🐰' },
  'Peixe':    { cor: 'bg-blue-50 text-blue-500',     emoji: '🐠' },
  'default':  { cor: 'bg-slate-100 text-slate-400',  emoji: '🐾' },
}

function calcularIdade(dataNascimento) {
  if (!dataNascimento) return null
  const nasc = new Date(dataNascimento + 'T00:00:00')
  const hoje = new Date()
  const meses = (hoje.getFullYear() - nasc.getFullYear()) * 12 + (hoje.getMonth() - nasc.getMonth())
  if (meses < 1)  return 'Recém-nascido'
  if (meses < 12) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`
  const anos = Math.floor(meses / 12)
  return `${anos} ${anos === 1 ? 'ano' : 'anos'}`
}

function ModalConfirmarDelete({ nome, onConfirmar, onCancelar }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4 mx-auto">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <h3 className="text-base font-bold text-slate-800 text-center mb-2">Excluir {nome}?</h3>
        <p className="text-sm text-slate-400 text-center mb-5 leading-relaxed">
          Todos os pets, agendamentos e vacinas deste tutor serão excluídos permanentemente.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancelar} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirmar} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors">
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}

function TutorPerfil({ tutor: tutorInicial, onVoltar, onVerPet, onAdicionarPet, onTutorDeletado }) {
  const [tutor, setTutor]       = useState(null)
  const [editando, setEditando]  = useState(false)
  const [salvando, setSalvando]  = useState(false)
  const [loading, setLoading]    = useState(true)
  const [confirmarDelete, setConfirmarDelete] = useState(false)
  const [erroDelete, setErroDelete] = useState('')
  const [form, setForm]          = useState({ nome: '', telefone: '', email: '', endereco: '' })

  async function carregar() {
    setLoading(true)
    try {
      const dados = await window.api.donos.buscarComPets(tutorInicial.id)
      setTutor(dados)
      setForm({
        nome:     dados.nome     || '',
        telefone: dados.telefone || '',
        email:    dados.email    || '',
        endereco: dados.endereco || '',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [tutorInicial.id]) // eslint-disable-line

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function salvarEdicao() {
    if (!form.nome.trim()) return alert('Informe o nome do tutor.')
    setSalvando(true)
    try {
      await window.api.donos.editar(tutor.id, {
        nome:     form.nome.trim(),
        telefone: form.telefone || null,
        email:    form.email    || null,
        endereco: form.endereco || null,
      })
      setEditando(false)
      await carregar()
    } finally {
      setSalvando(false)
    }
  }

  async function excluirTutor() {
    setErroDelete('')
    try {
      for (const pet of (tutor.pets || [])) {
        await window.api.pets.deletar(pet.id)
      }
      await window.api.donos.deletar(tutor.id)
      onTutorDeletado()
    } catch (e) {
      setConfirmarDelete(false)
      setErroDelete(e.message || 'Não foi possível excluir o tutor.')
    }
  }

  const iniciais = (tutor?.nome || tutorInicial.nome)
    .split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('')

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 pb-6">
        <div className="h-8 bg-slate-100 rounded-xl animate-pulse w-32" />
        <div className="h-40 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="h-60 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-6">

      {/* Navegação */}
      <div className="flex items-center justify-between">
        <button onClick={onVoltar} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft size={15} />
          Todos os clientes
        </button>
        <div className="flex items-center gap-2">
          {!editando ? (
            <>
              <button
                onClick={() => setEditando(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                <Pencil size={13} />
                Editar
              </button>
              <button
                onClick={() => setConfirmarDelete(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
              >
                <Trash2 size={13} />
                Excluir
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditando(false)}
                disabled={salvando}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <X size={13} />
                Cancelar
              </button>
              <button
                onClick={salvarEdicao}
                disabled={salvando}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-60"
              >
                {salvando ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Salvar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Card do tutor */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-slate-50">
          <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700 font-bold text-xl flex-shrink-0">
            {iniciais || <User size={22} />}
          </div>
          <div className="flex-1 min-w-0">
            {editando ? (
              <input
                value={form.nome}
                onChange={e => setF('nome', e.target.value)}
                className="w-full text-xl font-bold text-slate-800 border-b-2 border-emerald-400 bg-transparent focus:outline-none pb-0.5"
                placeholder="Nome completo"
              />
            ) : (
              <h2 className="text-xl font-bold text-slate-800">{tutor?.nome}</h2>
            )}
            <p className="text-xs text-slate-400 mt-0.5">Tutor responsável · {tutor?.total_pets || tutor?.pets?.length || 0} pet{(tutor?.pets?.length || 0) !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Telefone */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Phone size={13} className="text-slate-400" />
            </div>
            {editando ? (
              <input
                value={form.telefone}
                onChange={e => setF('telefone', e.target.value)}
                placeholder="(00) 00000-0000"
                className="flex-1 text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            ) : (
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Telefone</p>
                  <p className="text-sm text-slate-700 font-medium">{tutor?.telefone || <span className="text-slate-300 italic">não informado</span>}</p>
                </div>
                {tutor?.telefone && (
                  <a href={`https://wa.me/55${tutor.telefone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                    className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg font-semibold hover:bg-emerald-100 transition-colors flex-shrink-0">
                    WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>

          {/* E-mail */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail size={13} className="text-slate-400" />
            </div>
            {editando ? (
              <input
                value={form.email}
                onChange={e => setF('email', e.target.value)}
                placeholder="email@exemplo.com"
                type="email"
                className="flex-1 text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            ) : (
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">E-mail</p>
                <p className="text-sm text-slate-700 font-medium">{tutor?.email || <span className="text-slate-300 italic">não informado</span>}</p>
              </div>
            )}
          </div>

          {/* Endereço */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin size={13} className="text-slate-400" />
            </div>
            {editando ? (
              <input
                value={form.endereco}
                onChange={e => setF('endereco', e.target.value)}
                placeholder="Rua, número, bairro, cidade"
                className="flex-1 text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            ) : (
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Endereço</p>
                <p className="text-sm text-slate-700 font-medium">{tutor?.endereco || <span className="text-slate-300 italic">não informado</span>}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pets do tutor */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PawPrint size={16} className="text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Pets ({tutor?.pets?.length || 0})
            </h3>
          </div>
          <button
            onClick={() => onAdicionarPet(tutor)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 transition-colors"
          >
            <Plus size={13} />
            Adicionar pet
          </button>
        </div>

        {!tutor?.pets || tutor.pets.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <p className="text-sm text-slate-400">Nenhum pet cadastrado para este tutor.</p>
            <button
              onClick={() => onAdicionarPet(tutor)}
              className="mt-3 flex items-center gap-1.5 px-3 py-1.5 border-2 border-dashed border-emerald-200 text-emerald-600 rounded-xl text-sm font-medium hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
            >
              <Plus size={14} />
              Cadastrar primeiro pet
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {tutor.pets.map(pet => {
              const cfg = ESPECIE_CONFIG[pet.especie] || ESPECIE_CONFIG.default
              const idade = calcularIdade(pet.data_nascimento)
              return (
                <button
                  key={pet.id}
                  onClick={() => onVerPet({ ...pet, nome_dono: tutor.nome, telefone_dono: tutor.telefone, email_dono: tutor.email })}
                  className="group w-full flex items-center gap-3 px-3 py-3 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-100 border border-transparent rounded-xl transition-colors text-left"
                >
                  {pet.foto ? (
                    <img src={pet.foto} alt={pet.nome} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${cfg.cor}`}>
                      {cfg.emoji}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{pet.nome}</p>
                    <p className="text-xs text-slate-400">
                      {[pet.especie, pet.raca].filter(Boolean).join(' · ') || '—'}
                      {idade && ` · ${idade}`}
                    </p>
                  </div>
                  <span className="text-xs text-slate-300 group-hover:text-emerald-500 transition-colors flex-shrink-0 font-medium">
                    Ver perfil →
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {erroDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">Não foi possível excluir</h3>
            <p className="text-sm text-slate-500 mb-5">{erroDelete}</p>
            <button
              onClick={() => setErroDelete('')}
              className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
      {confirmarDelete && (
        <ModalConfirmarDelete
          nome={tutor?.nome}
          onConfirmar={excluirTutor}
          onCancelar={() => setConfirmarDelete(false)}
        />
      )}
    </div>
  )
}

export default TutorPerfil
