import { useState } from 'react'
import { CartaAliado } from '../../../components/CartaAliado'
import { NaipeDialog } from '../../../components/NaipeDialog'
import type { Aliado, GrupoAliados } from '../../../lib/personajes'
import { claveAliado } from '../lib/preparacion'

type Props = {
  grupos: GrupoAliados[]
  /** Claves de los aliados que acompañan al grupo */
  elegidos: string[]
  onAlternar: (clave: string) => void
  /** Aviso de la misión, p. ej. si tiene un PNJ */
  nota?: string
}

/** Aliados opcionales que acompañan a los héroes en esta aventura */
export function PanelAliados({ grupos, elegidos, onAlternar, nota }: Props) {
  const [abierto, setAbierto] = useState<{ grupo: GrupoAliados; aliado: Aliado } | null>(null)
  const clave = abierto && claveAliado(abierto.grupo.id, abierto.aliado.id)

  return (
    <section className="panel-mazo boceto">
      <header className="panel-cabecera">
        <h2>Aliados</h2>
        <span className="panel-estado">{elegidos.length ? `${elegidos.length} en el grupo` : 'Opcional'}</span>
      </header>
      <p className="nota">Compañeros animales y el PNJ de la misión si os acompaña.</p>
      {nota && <p className="nota mal">{nota}</p>}

      {grupos.map((grupo) => (
        <details key={grupo.id} className="aliados-grupo">
          <summary>{grupo.nombre}</summary>
          <ul className="aliados-reglas nota">
            {grupo.reglas.map((regla) => (
              <li key={regla}>{regla}</li>
            ))}
          </ul>
          <div className="naipes">
            {grupo.aliados.map((aliado) => {
              const enGrupo = elegidos.includes(claveAliado(grupo.id, aliado.id))
              return (
                <button
                  key={aliado.id}
                  type="button"
                  className="naipe-boton"
                  onClick={() => setAbierto({ grupo, aliado })}
                  aria-label={`Ver ${aliado.nombre}`}
                  aria-pressed={enGrupo}
                >
                  <CartaAliado aliado={aliado} sello={enGrupo ? 'En el grupo' : undefined} />
                </button>
              )
            })}
          </div>
        </details>
      ))}

      {abierto && clave && (
        <NaipeDialog
          etiqueta={abierto.aliado.nombre}
          onCerrar={() => setAbierto(null)}
          acciones={
            <button
              type="button"
              className={elegidos.includes(clave) ? 'button secondary' : 'button'}
              onClick={() => {
                onAlternar(clave)
                setAbierto(null)
              }}
            >
              {elegidos.includes(clave) ? 'Quitar del grupo' : 'Añadir al grupo'}
            </button>
          }
        >
          <CartaAliado aliado={abierto.aliado} variante="completa" />
        </NaipeDialog>
      )}
    </section>
  )
}
