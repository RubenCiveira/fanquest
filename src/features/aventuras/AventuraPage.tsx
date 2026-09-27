import { useState } from 'react'
import { Form, Link, useLoaderData } from 'react-router'
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

      {estado === 'sin-empezar' ? (
        <Form method="post" className="aventura-empezar">
          <button type="submit" name="intent" value="empezar" className="button">
            <Icono nombre="dado" />
            Empezar aventura
          </button>
        </Form>
      ) : estado === 'configurando' ? (
        <Link to="configurar" className="button aventura-empezar">
          <Icono nombre="dado" />
          Continuar preparación
        </Link>
      ) : (
        <div className="aventura-empezar fila-botones">
          <Link to="jugar" className="button">
            <Icono nombre="dado" />
            {estado === 'mazo-barajado' ? 'Empezar partida' : estado === 'en-juego' ? 'Continuar partida' : 'Ver partida'}
          </Link>
          <Link to="configurar" className="button secondary">
            Ver preparación
          </Link>
        </div>
      )}

      <MisionCard mision={mision} />

      <Link to="editar" className="button secondary aventura-borrar">
        Editar aventura
      </Link>

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
