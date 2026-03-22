import { createContext, useContext, useEffect, useState } from 'react'

const ConfigContext = createContext({ config: {}, recarregar: () => {} })

export function useConfig() {
  return useContext(ConfigContext)
}

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState({})

  async function recarregar() {
    try {
      const all = await window.api.configuracoes.getAll()
      setConfig(all ?? {})
    } catch {}
  }

  useEffect(() => { recarregar() }, []) // eslint-disable-line

  return (
    <ConfigContext.Provider value={{ config, recarregar }}>
      {children}
    </ConfigContext.Provider>
  )
}
