import { useEffect, useRef, useState } from 'react'
import { Icono } from '../../../components/Icono'
import type { Mazo } from '../../../lib/mazos'
import { urlRetrato, type Heroe } from '../../../lib/personajes'
import { type OpcionHechizos, opcionesHechizosHeroe } from '../lib/hechizos'

type Props = {
  heroes: Heroe[]
  mazo: Mazo
  seleccion: Record<string, string[]>
  onCambiar: (heroe: string, hechizos: string[]) => void
  onAceptar: () => void
}

const alternar = (lista: string[], id: string) => (lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id])

function DialogHechizos({
  heroe,
  opcion,
  elegidos,
  onCambiar,
  onCerrar,
}: {
  heroe: Heroe
  opcion: OpcionHechizos
  elegidos: string[]
  onCambiar: (hechizos: string[]) => void
  onCerrar: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => ref.current?.showModal(), [])
  const todos = opcion.cartas.every((carta) => elegidos.includes(carta.id))
  const cambiarGrupo = () => {
    const ids = opcion.cartas.map((carta) => carta.id)
    onCambiar(todos ? elegidos.filter((id) => !ids.includes(id)) : [...new Set([...elegidos, ...ids])])
  }

  return (
    <dialog ref={ref} className="dialog hechizos-dialog" aria-label={`${opcion.titulo} de ${heroe.nombre}`} onClose={onCerrar} onClick={(e) => e.target === ref.current && onCerrar()}>
      <button type="button" className="icon-button dialog-carta-cerrar" onClick={onCerrar} aria-label="Cerrar">
        <Icono nombre="cerrar" />
      </button>
      <header>
        <img src={urlRetrato('heroes', heroe)} alt="" />
        <div>
          <h2>{opcion.titulo}</h2>
          <p className="nota">{heroe.nombre}. {opcion.descripcion}</p>
        </div>
      </header>
      <div className="hechizos-dialog-acciones">
        <button type="button" className="button mini secondary" onClick={cambiarGrupo}>
          {todos ? 'Quitar grupo' : 'Añadir grupo'}
        </button>
      </div>
      <div className="hechizos-lista">
        {opcion.cartas.map((carta) => (
          <label key={carta.id}>
            <input type="checkbox" checked={elegidos.includes(carta.id)} onChange={() => onCambiar(alternar(elegidos, carta.id))} />
            <span>
              <strong>{carta.titulo}</strong>
              <small>{carta.texto}</small>
            </span>
          </label>
        ))}
      </div>
    </dialog>
  )
}

export function PanelHechizos({ heroes, mazo, seleccion, onCambiar, onAceptar }: Props) {
  const [abierta, setAbierta] = useState<{ heroe: string; opcion: string } | null>(null)
  const lanzadores = heroes.map((heroe) => ({ heroe, opciones: opcionesHechizosHeroe(heroe, mazo) })).filter(({ opciones }) => opciones.length)
  const seleccionDialog = abierta && lanzadores.flatMap(({ heroe, opciones }) => opciones.map((opcion) => ({ heroe, opcion }))).find(({ heroe, opcion }) => heroe.id === abierta.heroe && opcion.id === abierta.opcion)
  if (!lanzadores.length) {
    return (
      <section className="panel-mazo boceto hechizos-vacio">
        <header className="panel-cabecera">
          <h2>Hechizos del grupo</h2>
        </header>
        <p>No hay héroes con capacidad de lanzar hechizos en el grupo actual.</p>
        <button type="button" className="button" onClick={onAceptar}>
          OK, continuar
        </button>
      </section>
    )
  }

  return (
    <section className="panel-mazo boceto">
      <header className="panel-cabecera">
        <h2>Hechizos del grupo</h2>
        <span className="panel-estado">{lanzadores.length} lanzador{lanzadores.length > 1 ? 'es' : ''}</span>
      </header>
      <p className="nota">Elige una miniatura y abre la categoría de hechizos que quieras preparar para este reto.</p>

      <div className="hechizos-config">
        {lanzadores.map(({ heroe, opciones }) => {
          const elegidos = seleccion[heroe.id] ?? []
          return (
            <article key={heroe.id} className="hechizos-heroe">
              <header>
                <img src={urlRetrato('heroes', heroe)} alt="" />
                <div>
                  <h3>{heroe.nombre}</h3>
                  <p className="nota">{elegidos.length} hechizo{elegidos.length !== 1 ? 's' : ''} preparado{elegidos.length !== 1 ? 's' : ''}</p>
                </div>
              </header>
              <div className="hechizos-categorias">
                {opciones.map((opcion) => {
                  const elegidosCategoria = opcion.cartas.filter((carta) => elegidos.includes(carta.id)).length
                  return (
                    <button
                      key={opcion.id}
                      type="button"
                      className="button mini secondary"
                      onClick={() => setAbierta({ heroe: heroe.id, opcion: opcion.id })}
                    >
                      {opcion.titulo}
                      <span>{elegidosCategoria}/{opcion.cartas.length}</span>
                    </button>
                  )
                })}
              </div>
            </article>
          )
        })}
      </div>
      {seleccionDialog && (
        <DialogHechizos
          heroe={seleccionDialog.heroe}
          opcion={seleccionDialog.opcion}
          elegidos={seleccion[seleccionDialog.heroe.id] ?? []}
          onCambiar={(hechizos) => onCambiar(seleccionDialog.heroe.id, hechizos)}
          onCerrar={() => setAbierta(null)}
        />
      )}
      <button type="button" className="button" onClick={onAceptar}>
        Siguiente: Mazos
      </button>
    </section>
  )
}
