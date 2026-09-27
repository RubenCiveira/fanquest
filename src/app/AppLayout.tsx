import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { Icono } from '../components/Icono'
import { CabeceraContext } from '../lib/cabecera'
import { registrarVisita } from '../lib/matomo'
import { AvisoActualizacion } from './AvisoActualizacion'

const secciones = [
  { to: '/aventuras', label: 'Aventuras', icono: 'pergamino' },
  { to: '/imprimir', label: 'Imprimir', icono: 'imprimir' },
  { to: '/creditos', label: 'Créditos', icono: 'info' },
] as const

export function AppLayout() {
  const { pathname } = useLocation()
  // la barra superior recibe el título de cada página
  const [cabecera, setCabecera] = useState<HTMLElement | null>(null)

  useEffect(() => registrarVisita(), [pathname])

  return (
    <div className="app">
      <header className="app-header">
        <Link to="/aventuras" className="app-marca">
          FetenQuest
        </Link>
        <div className="app-seccion" ref={setCabecera} />
      </header>

      <CabeceraContext value={cabecera}>
        <main className="app-main">
          <Outlet />
        </main>
      </CabeceraContext>

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
