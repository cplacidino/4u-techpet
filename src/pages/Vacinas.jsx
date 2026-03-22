import { useState, useEffect, useCallback } from 'react'
import VacinaLista from '../components/vacinas/VacinaLista'
import VacinaFormulario from '../components/vacinas/VacinaFormulario'

function Vacinas() {
  const [view, setView] = useState('lista')
  const [vacinaEditando, setVacinaEditando] = useState(null)
  const [vacinas, setVacinas] = useState([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const lista = await window.api.vacinas.listar()
      setVacinas(lista)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  function abrirFormulario(vacina = null) {
    setVacinaEditando(vacina)
    setView('formulario')
  }

  function fecharFormulario() {
    setVacinaEditando(null)
    setView('lista')
    carregar()
  }

  if (view === 'formulario') {
    return (
      <VacinaFormulario
        vacina={vacinaEditando}
        onSalvar={fecharFormulario}
        onCancelar={fecharFormulario}
      />
    )
  }

  return (
    <VacinaLista
      vacinas={vacinas}
      carregando={carregando}
      onNova={() => abrirFormulario()}
      onEditar={(v) => abrirFormulario(v)}
      onAtualizar={carregar}
    />
  )
}

export default Vacinas
