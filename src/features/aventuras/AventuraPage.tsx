import { useState } from 'react'
import { Link, useLoaderData } from 'react-router'
import { Icono } from '../../components/Icono'
import { PageHeader } from '../../components/PageHeader'
import { MisionCard } from '../generar/components/MisionCard'
import { BorrarAventuraDialog } from './components/BorrarAventuraDialog'
import { ETIQUETA_ESTADO, type Aventura } from './lib/aventuras'

export function AventuraPage() {
  const { estado, mision } = useLoaderData<Aventura>()
  const [confirmarBorrado, setConfirmarBorrado] = useState(false)

  return (
    <>
      <PageHeader title="Aventura" backTo="/aventuras">
        <span className="estado">{ETIQUETA_ESTADO[estado]}</span>
      </PageHeader>

      <Link to="jugar" className="button aventura-empezar">
        <Icono nombre="dado" />
        Empezar aventura
      </Link>

      <MisionCard mision={mision} />

      <button
        type="button"
        className="button secondary aventura-borrar"
        onClick={() => setConfirmarBorrado(true)}
      >
        Borrar aventura
      </button>

      {confirmarBorrado && (
        <BorrarAventuraDialog
          titulo={mision.titulo}
          onCerrar={() => setConfirmarBorrado(false)}
        />
      )}
    </>
  )
}
