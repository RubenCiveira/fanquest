import type { Mazo } from '../../../lib/mazos'
import type { Heroe } from '../../../lib/personajes'
import { opcionesHechizosHeroe } from '../lib/hechizos'

type Props = {
  heroes: Heroe[]
  mazo: Mazo
  seleccion: Record<string, string[]>
  onCambiar: (heroe: string, hechizos: string[]) => void
}

const alternar = (lista: string[], id: string) => (lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id])

export function PanelHechizos({ heroes, mazo, seleccion, onCambiar }: Props) {
  const lanzadores = heroes.map((heroe) => ({ heroe, opciones: opcionesHechizosHeroe(heroe, mazo) })).filter(({ opciones }) => opciones.length)
  if (!lanzadores.length) return null

  return (
    <section className="panel-mazo boceto">
      <header className="panel-cabecera">
        <h2>Hechizos del grupo</h2>
        <span className="panel-estado">{lanzadores.length} lanzador{lanzadores.length > 1 ? 'es' : ''}</span>
      </header>
      <p className="nota">Marca los hechizos que lleva cada héroe al comenzar el reto.</p>

      <div className="hechizos-config">
        {lanzadores.map(({ heroe, opciones }) => {
          const elegidos = seleccion[heroe.id] ?? []
          return (
            <article key={heroe.id} className="hechizos-heroe">
              <h3>{heroe.nombre}</h3>
              {opciones.map((opcion) => {
                const todos = opcion.cartas.every((carta) => elegidos.includes(carta.id))
                const cambiarGrupo = () => {
                  const ids = opcion.cartas.map((carta) => carta.id)
                  onCambiar(heroe.id, todos ? elegidos.filter((id) => !ids.includes(id)) : [...new Set([...elegidos, ...ids])])
                }
                return (
                  <fieldset key={opcion.id} className="hechizos-grupo">
                    <legend>
                      <span>
                        {opcion.titulo}
                        <small>{opcion.descripcion}</small>
                      </span>
                      <button type="button" className="button mini secondary" onClick={cambiarGrupo}>
                        {todos ? 'Quitar grupo' : 'Añadir grupo'}
                      </button>
                    </legend>
                    <div className="hechizos-lista">
                      {opcion.cartas.map((carta) => (
                        <label key={carta.id}>
                          <input type="checkbox" checked={elegidos.includes(carta.id)} onChange={() => onCambiar(heroe.id, alternar(elegidos, carta.id))} />
                          <span>
                            <strong>{carta.titulo}</strong>
                            <small>{carta.texto}</small>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )
              })}
            </article>
          )
        })}
      </div>
    </section>
  )
}
