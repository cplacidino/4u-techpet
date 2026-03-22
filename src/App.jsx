import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { ConfigProvider } from './contexts/ConfigContext'
import Layout from './components/Layout'
import RotaProtegida from './components/RotaProtegida'
import SplashScreen from './components/SplashScreen'
import LoginScreen from './components/LoginScreen'
import AtualizacaoNotificacao from './components/AtualizacaoNotificacao'
import Dashboard from './pages/Dashboard'
import Pets from './pages/Pets'
import Agendamentos from './pages/Agendamentos'
import Vacinas from './pages/Vacinas'
import Financeiro from './pages/Financeiro'
import Configuracoes from './pages/Configuracoes'
import Estoque from './pages/Estoque'
import Veterinarios from './pages/Veterinarios'
import Consultas from './pages/Consultas'
import Internacoes from './pages/Internacoes'
import Cirurgias from './pages/Cirurgias'
import Prescricoes from './pages/Prescricoes'
import Vendas from './pages/Vendas'
import Fiado from './pages/Fiado'
import Planos from './pages/Planos'

// HashRouter é obrigatório no Electron — o app carrega de file://
// e o BrowserRouter normal quebraria as rotas no executável final.
function App() {
  const [splashFim, setSplashFim] = useState(false)
  const [autenticado, setAutenticado] = useState(false)
  const [verificando, setVerificando] = useState(true)

  useEffect(() => {
    // Após splash, verifica se já tem sessão válida
    if (!splashFim) return
    window.api.auth.verificar().then(res => {
      if (res.valido) setAutenticado(true)
      setVerificando(false)
    })
  }, [splashFim])

  return (
    <ThemeProvider>
      <ConfigProvider>
      {!splashFim && <SplashScreen onFim={() => setSplashFim(true)} />}
      {splashFim && !verificando && !autenticado && (
        <LoginScreen onLogin={() => setAutenticado(true)} />
      )}
      {autenticado && (
        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Layout>
            <Routes>
              <Route path="/"              element={<Dashboard />} />
              <Route path="/pets"          element={<RotaProtegida modKey="mod_pets"><Pets /></RotaProtegida>} />
              <Route path="/agendamentos"  element={<RotaProtegida modKey="mod_agendamentos"><Agendamentos /></RotaProtegida>} />
              <Route path="/vacinas"       element={<RotaProtegida modKey="mod_vacinas"><Vacinas /></RotaProtegida>} />
              <Route path="/financeiro"    element={<RotaProtegida modKey="mod_financeiro"><Financeiro /></RotaProtegida>} />
              <Route path="/estoque"       element={<RotaProtegida modKey="mod_estoque"><Estoque /></RotaProtegida>} />
              <Route path="/veterinarios"  element={<RotaProtegida modKey="mod_veterinarios"><Veterinarios /></RotaProtegida>} />
              <Route path="/consultas"     element={<RotaProtegida modKey="mod_consultas"><Consultas /></RotaProtegida>} />
              <Route path="/internacoes"   element={<RotaProtegida modKey="mod_internacoes"><Internacoes /></RotaProtegida>} />
              <Route path="/cirurgias"     element={<RotaProtegida modKey="mod_cirurgias"><Cirurgias /></RotaProtegida>} />
              <Route path="/prescricoes"   element={<RotaProtegida modKey="mod_prescricoes"><Prescricoes /></RotaProtegida>} />
              <Route path="/vendas"        element={<RotaProtegida modKey="mod_vendas"><Vendas /></RotaProtegida>} />
              <Route path="/fiado"         element={<RotaProtegida modKey="mod_vendas"><Fiado /></RotaProtegida>} />
              <Route path="/planos"        element={<Planos />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
            </Routes>
          </Layout>
          <AtualizacaoNotificacao />
        </HashRouter>
      )}
      </ConfigProvider>
    </ThemeProvider>
  )
}

export default App
