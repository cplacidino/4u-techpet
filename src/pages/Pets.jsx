import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import PetLista from '../components/pets/PetLista'
import PetFormulario from '../components/pets/PetFormulario'
import PetPerfil from '../components/pets/PetPerfil'

// Pets.jsx orquestra as 3 views da seção:
//   'lista'      → grade de pets com busca e filtros
//   'formulario' → cadastro ou edição de um pet
//   'perfil'     → página completa de um pet (dados + histórico + vacinas)

function Pets() {
  const location = useLocation()
  const [view, setView] = useState('lista')
  const [petSelecionado, setPetSelecionado] = useState(null)
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)

  const carregarPets = useCallback(async () => {
    setLoading(true)
    try {
      const data = await window.api.pets.listar()
      setPets(data)
      // Navegar direto para o perfil se vier da busca global
      const { petId } = location.state ?? {}
      if (petId) {
        const pet = data.find(p => p.id === petId)
        if (pet) { setPetSelecionado(pet); setView('perfil') }
        window.history.replaceState({}, '')
      }
    } catch (err) {
      console.error('[Pets] Erro ao carregar lista:', err)
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line

  useEffect(() => { carregarPets() }, [carregarPets])

  const abrirNovoPet   = ()    => { setPetSelecionado(null); setView('formulario') }
  const abrirEditar    = (pet) => { setPetSelecionado(pet);  setView('formulario') }
  const abrirPerfil    = (pet) => { setPetSelecionado(pet);  setView('perfil') }
  const voltar         = ()    => { setPetSelecionado(null); setView('lista') }

  const salvarEVoltar  = async () => {
    await carregarPets()
    voltar()
  }

  if (view === 'formulario') return (
    <PetFormulario
      pet={petSelecionado}
      onSalvar={salvarEVoltar}
      onCancelar={voltar}
    />
  )

  if (view === 'perfil') return (
    <PetPerfil
      pet={petSelecionado}
      onEditar={() => abrirEditar(petSelecionado)}
      onVoltar={voltar}
      onDeletado={salvarEVoltar}
    />
  )

  return (
    <PetLista
      pets={pets}
      loading={loading}
      onNovoPet={abrirNovoPet}
      onVerPet={abrirPerfil}
    />
  )
}

export default Pets
