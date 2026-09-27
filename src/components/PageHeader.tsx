import { useContext, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import { CabeceraContext } from '../lib/cabecera'
import { Icono } from './Icono'

type Props = {
  title: string
  backTo?: string
  children?: ReactNode
}

/** Título de la página, con volver y acciones, en la barra superior de la app */
export function PageHeader({ title, backTo, children }: Props) {
  const destino = useContext(CabeceraContext)
  if (!destino) return null

  return createPortal(
    <div className="page-header">
      {backTo && (
        <Link to={backTo} className="back-link" aria-label="Volver">
          <Icono nombre="volver" />
        </Link>
      )}
      <h1>{title}</h1>
      {children}
    </div>,
    destino,
  )
}
