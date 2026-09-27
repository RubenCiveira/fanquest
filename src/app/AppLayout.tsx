import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { Icono } from '../components/Icono'
import { registrarVisita } from '../lib/matomo'
import { AvisoActualizacion } from './AvisoActualizacion'

const secciones = [
  { to: '/generar', label: 'Generar', icono: 'dado' },
  { to: '/aventuras', label: 'Aventuras', icono: 'pergamino' },
  { to: '/imprimir', label: 'Imprimir', icono: 'imprimir' },
] as const

export function AppLayout() {
  const { pathname } = useLocation()

  useEffect(() => registrarVisita(), [pathname])

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-title">FanQuest</span>
        <Link to="/creditos" className="app-creditos">
          Créditos
        </Link>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="app-nav" aria-label="Secciones">
        {secciones.map(({ to, label, icono }) => (
          <NavLink key={to} to={to} className="app-nav-link">
            <Icono nombre={icono} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <AvisoActualizacion />
    </div>
  )
}
