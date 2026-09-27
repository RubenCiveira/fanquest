import type { ReactNode } from 'react'
import type { Estadisticas } from '../lib/personajes'

type Props = {
  titulo: string
  imagen?: string
  estadisticas: Estadisticas
  /** Igual que en `Carta`: naipe pequeño o la carta entera */
  variante?: 'mini' | 'completa'
  copias?: number
  sello?: string
  /** Texto del naipe pequeño */
  resumen?: string
  /** Contenido de la carta entera, bajo las estadísticas */
  children?: ReactNode
}

const ESTADISTICAS: [keyof Estadisticas, string, string][] = [
  ['movimiento', 'Mov', 'Movimiento'],
  ['ataque', 'Ata', 'Ataque'],
  ['defensa', 'Def', 'Defensa'],
  ['cuerpo', 'Cue', 'Cuerpo'],
  ['mente', 'Men', 'Mente'],
]

/** Héroe o monstruo dibujado como un naipe con su fila de estadísticas */
export function CartaPersonaje({ titulo, imagen, estadisticas, variante = 'mini', copias = 1, sello, resumen, children }: Props) {
  const completa = variante === 'completa'

  return (
    <figure className={`carta carta-personaje carta-${variante} carta-${imagen ? 'mediana' : 'texto'}`}>
      <figcaption className="carta-titulo">{titulo}</figcaption>
      {/* la completa se carga ya: puede estar oculta hasta imprimir */}
      {imagen && <img src={imagen} alt="" loading={completa ? 'eager' : 'lazy'} />}

      <dl className="carta-stats">
        {ESTADISTICAS.map(([clave, corta, larga]) => (
          <div key={clave}>
            <dt title={larga}>{completa ? larga : corta}</dt>
            <dd>{estadisticas[clave]}</dd>
          </div>
        ))}
      </dl>

      {completa ? <div className="carta-cuerpo">{children}</div> : resumen && <p className="carta-resumen">{resumen}</p>}

      {copias > 1 && <span className="carta-copias">×{copias}</span>}
      {sello && <span className="carta-sello">{sello}</span>}
    </figure>
  )
}
