import type { Casilla } from './casilla'
import type { Direccion } from './direccion'
import type { Elemento } from './elemento'
import type { Medida } from './medida'
import type { Muro } from './muro'
import type { Puerta } from './puerta'
import type { Terreno } from './terreno'

export type TipoEstancia = 'exterior' | 'sala' | 'pasillo'

/**
 * Mapa rectangular de `filas` × `columnas` casillas. Puede contener otras
 * estancias (en un jardín, las cuatro salas de una casa): cada una ocupa,
 * desde su `posicion`, casillas de su madre que dejan de ser de esta
 */
export type Estancia = Medida & {
  id: string
  tipo: TipoEstancia
  /**
   * Casilla de la madre en la que queda su esquina superior izquierda. En las
   * estancias del mapa, su sitio en las casillas comunes del mapa (sin ella, 0,0)
   */
  posicion?: Casilla
  /** Hacia dónde se recorre: se entra por el muro contrario y se sale por este */
  orientacion?: Direccion
  puertas: Puerta[]
  elementos: Elemento[]
  /** Marcas de estado de la estancia que cambian durante la partida */
  flags?: string[]
  /** Zonas de terreno difícil o impasable (sin ellas, todo es terreno normal) */
  terrenos?: Terreno[]
  /** Muros dentro de la estancia, por los bordes entre casillas (sus puertas, en `puertas`) */
  muros?: Muro[]
  estancias: Estancia[]
}
