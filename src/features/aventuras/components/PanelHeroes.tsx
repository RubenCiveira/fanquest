import { useState } from 'react'
import { CartaHeroe } from '../../../components/CartaHeroe'
import { NaipeDialog } from '../../../components/NaipeDialog'
import type { Habilidades, Heroe } from '../../../lib/personajes'
import { MAX_HEROES } from '../lib/preparacion'

type Props = {
  heroes: Heroe[]
  habilidades: Habilidades
  /** Ids del grupo */
  grupo: string[]
  onAlternar: (id: string) => void
  movimientoFijo: boolean
}

/** Elegir el grupo de héroes: al tocar una ficha se abre con la acción */
export function PanelHeroes({ heroes, habilidades, grupo, onAlternar, movimientoFijo }: Props) {
  const [abierto, setAbierto] = useState<Heroe | null>(null)
  const completo = grupo.length >= MAX_HEROES
  const enGrupo = abierto && grupo.includes(abierto.id)

  return (
    <section className="panel-mazo boceto">
      <header className="panel-cabecera">
        <h2>Grupo de héroes</h2>
        <span className={grupo.length ? 'panel-estado' : 'panel-estado mal'}>
          {grupo.length} / {MAX_HEROES}
        </span>
      </header>
      <p className="resumen-grupos">
        {grupo.length
          ? heroes.filter((h) => grupo.includes(h.id)).map((h) => <span key={h.id}>{h.nombre}</span>)
          : 'Toca una ficha para verla y añadirla al grupo.'}
      </p>

      <div className="naipes">
        {heroes.map((heroe) => (
          <button
            key={heroe.id}
            type="button"
            className="naipe-boton"
            onClick={() => setAbierto(heroe)}
            aria-label={`Ver ${heroe.nombre}`}
            aria-pressed={grupo.includes(heroe.id)}
          >
            <CartaHeroe heroe={heroe} sello={grupo.includes(heroe.id) ? 'En el grupo' : undefined} movimientoFijo={movimientoFijo} />
          </button>
        ))}
      </div>

      {abierto && (
        <NaipeDialog
          etiqueta={abierto.nombre}
          onCerrar={() => setAbierto(null)}
          acciones={
            <>
              <button
                type="button"
                className={enGrupo ? 'button secondary' : 'button'}
                disabled={!enGrupo && completo}
                onClick={() => {
                  onAlternar(abierto.id)
                  setAbierto(null)
                }}
              >
                {enGrupo ? 'Quitar del grupo' : 'Añadir al grupo'}
              </button>
              {!enGrupo && completo && <p className="nota">El grupo ya tiene {MAX_HEROES} héroes.</p>}
            </>
          }
        >
          <CartaHeroe heroe={abierto} habilidades={habilidades} variante="completa" movimientoFijo={movimientoFijo} />
        </NaipeDialog>
      )}
    </section>
  )
}
