import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Icono } from './Icono'

type Props = {
  title: string
  backTo?: string
  children?: ReactNode
}

export function PageHeader({ title, backTo, children }: Props) {
  return (
    <div className="page-header">
      {backTo && (
        <Link to={backTo} className="back-link" aria-label="Volver">
          <Icono nombre="volver" />
        </Link>
      )}
      <h1>{title}</h1>
      {children}
    </div>
  )
}
