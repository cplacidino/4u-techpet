import { useState, useEffect, useCallback } from 'react'
import AgendaLista from '../components/agendamentos/AgendaLista'
import AgendaFormulario from '../components/agendamentos/AgendaFormulario'

// Agendamentos.jsx orquestra as views:
//   'lista'      → agenda do dia com navegação por data
//   'formulario' → criar ou editar agendamento

function Agendamentos() {
  const [view, setView]         = useState('lista')
  const [selecionado, setSelecionado] = useState(null)
  const [dataSelecionada, setDataSelecionada] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [agendamentos, setAgendamentos] = useState([])
  const [loading, setLoading]   = useState(true)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const data = await window.api.agendamentos.buscarPorData(dataSelecionada)
      setAgendamentos(data)
    } catch (err) {
      console.error('[Agendamentos]', err)
    } finally {
      setLoading(false)
    }
  }, [dataSelecionada])

  useEffect(() => { carregar() }, [carregar])

  const abrirNovo    = ()    => { setSelecionado(null); setView('formulario') }
  const abrirEditar  = (ag)  => { setSelecionado(ag);   setView('formulario') }
  const voltar       = ()    => { setSelecionado(null);  setView('lista') }
  const salvarEVoltar = async () => { await carregar(); voltar() }

  if (view === 'formulario') return (
    <AgendaFormulario
      agendamento={selecionado}
      dataInicial={dataSelecionada}
      onSalvar={salvarEVoltar}
      onCancelar={voltar}
    />
  )

  return (
    <AgendaLista
      agendamentos={agendamentos}
      loading={loading}
      dataSelecionada={dataSelecionada}
      onDataChange={setDataSelecionada}
      onNovo={abrirNovo}
      onEditar={abrirEditar}
      onAtualizar={carregar}
    />
  )
}

export default Agendamentos
