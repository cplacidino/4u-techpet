import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import TutorLista  from '../components/pets/TutorLista'
import TutorPerfil from '../components/pets/TutorPerfil'
import PetFormulario from '../components/pets/PetFormulario'
import PetPerfil from '../components/pets/PetPerfil'

// Pets.jsx orquestra 4 views:
//   'lista'      → grade de tutores com seus pets
//   'tutor'      → perfil do tutor com lista de pets + ações
//   'petPerfil'  → perfil completo de um pet específico
//   'formulario' → cadastro ou edição de um pet (com ou sem tutor existente)

function Pets() {
  const location = useLocation()
  const [view, setView]                 = useState('lista')
  const [tutores, setTutores]           = useState([])
  const [tutorSelecionado, setTutorSelecionado] = useState(null)
  const [petSelecionado, setPetSelecionado]     = useState(null)
  const [donoParaNovoPet, setDonoParaNovoPet]   = useState(null)
  const [loading, setLoading]           = useState(true)

  const carregarTutores = useCallback(async () => {
    setLoading(true)
    try {
      const [donosList, petsList] = await Promise.all([
        window.api.donos.listar(),
        window.api.pets.listar(),
      ])
      // Agrupar pets por id_dono para montar os cards dos tutores
      const petsByDono = {}
      petsList.forEach(p => {
        if (!petsByDono[p.id_dono]) petsByDono[p.id_dono] = []
        petsByDono[p.id_dono].push(p)
      })
      const tutoresComPets = donosList.map(d => ({
        ...d,
        pets: petsByDono[d.id] || [],
      }))
      setTutores(tutoresComPets)

      // Navegar direto para o perfil do pet se vier da busca global
      const { petId } = location.state ?? {}
      if (petId) {
        const pet = petsList.find(p => p.id === petId)
        if (pet) {
          const dono = donosList.find(d => d.id === pet.id_dono)
          setTutorSelecionado(dono || null)
          setPetSelecionado(pet)
          setView('petPerfil')
        }
        window.history.replaceState({}, '')
      }
    } catch (err) {
      console.error('[Pets] Erro ao carregar:', err)
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line

  useEffect(() => { carregarTutores() }, [carregarTutores])

  // ── Navegação ────────────────────────────────────────────

  const voltarParaLista = () => {
    setTutorSelecionado(null)
    setPetSelecionado(null)
    setDonoParaNovoPet(null)
    setView('lista')
  }

  const voltarParaTutor = () => {
    setPetSelecionado(null)
    setDonoParaNovoPet(null)
    setView('tutor')
  }

  const abrirTutor = (tutor) => {
    setTutorSelecionado(tutor)
    setView('tutor')
  }

  const abrirPetPerfil = (pet) => {
    setPetSelecionado(pet)
    setView('petPerfil')
  }

  // Novo cliente = novo tutor + pet (sem tutor preexistente)
  const abrirNovoCliente = () => {
    setPetSelecionado(null)
    setDonoParaNovoPet(null)
    setView('formulario')
  }

  // Novo pet para tutor já existente
  const abrirAdicionarPet = (tutor) => {
    setPetSelecionado(null)
    setDonoParaNovoPet(tutor)
    setView('formulario')
  }

  // Editar pet
  const abrirEditarPet = (pet) => {
    setPetSelecionado(pet)
    setDonoParaNovoPet(null)
    setView('formulario')
  }

  const salvarEVoltar = async () => {
    await carregarTutores()
    if (donoParaNovoPet || tutorSelecionado) {
      // Recarregar tutor com pets atualizados antes de voltar para o perfil
      setView('tutor')
    } else {
      voltarParaLista()
    }
  }

  const aposDeletePet = async () => {
    await carregarTutores()
    voltarParaTutor()
  }

  const aposDeleteTutor = async () => {
    await carregarTutores()
    voltarParaLista()
  }

  // ── Views ────────────────────────────────────────────────

  if (view === 'formulario') return (
    <PetFormulario
      pet={petSelecionado}
      donoExistente={donoParaNovoPet}
      onSalvar={salvarEVoltar}
      onCancelar={donoParaNovoPet || tutorSelecionado ? voltarParaTutor : voltarParaLista}
    />
  )

  if (view === 'petPerfil') return (
    <PetPerfil
      pet={petSelecionado}
      onEditar={() => abrirEditarPet(petSelecionado)}
      onVoltar={tutorSelecionado ? voltarParaTutor : voltarParaLista}
      onDeletado={aposDeletePet}
      onNovoPetParaTutor={abrirAdicionarPet}
    />
  )

  if (view === 'tutor') return (
    <TutorPerfil
      tutor={tutorSelecionado}
      onVoltar={voltarParaLista}
      onVerPet={abrirPetPerfil}
      onAdicionarPet={abrirAdicionarPet}
      onTutorDeletado={aposDeleteTutor}
    />
  )

  return (
    <TutorLista
      tutores={tutores}
      loading={loading}
      onNovoCliente={abrirNovoCliente}
      onVerTutor={abrirTutor}
    />
  )
}

export default Pets
