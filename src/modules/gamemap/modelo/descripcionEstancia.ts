import type { Casilla } from './casilla'
import type { DescripcionPersonajeNoJugador } from './descripcionPersonaje'
import type { Direccion } from './direccion'
import type { Mueble, Objeto } from './elemento'
import type { TipoEstancia } from './estancia'
import type { Medida } from './medida'
import type { Muro } from './muro'
import type { Terreno } from './terreno'

/** Objeto que pide la descripción: la librería le da id y le busca sitio */
export type DescripcionElemento = Omit<Objeto, 'id' | 'posicion' | 'flags'>

/** Mueble fijo que pide la descripción: el proyecto da el id estable */
export type DescripcionMueble = Omit<Mueble, 'posicion' | 'flags'>

/** Muro interior que pide la descripción: la librería le da id y crea sus puertas interiores, cerradas, en los tramos de `puertas` */
export type DescripcionMuro = Omit<Muro, 'id'> & { puertas?: number[] }

/** Salidas explícitas de una estancia, cuando no basta con repartirlas en un solo muro */
export type DescripcionSalida = { casilla: Casilla; lado: Direccion }

/** Lo que el proyecto dice de una estancia nueva; con ello la librería la crea y gestiona su estado */
export type DescripcionEstancia = {
  tipo: TipoEstancia
  tamano: Medida
  orientacion: Direccion
  salidas: number
  salidasPorMuro?: DescripcionSalida[]
  elementos: DescripcionElemento[]
  muebles?: DescripcionMueble[]
  /** Zonas de terreno difícil o impasable, en casillas de la estancia */
  terrenos?: Terreno[]
  /** Muros dentro de la estancia, por los bordes entre casillas, con sus pasos y puertas */
  muros?: DescripcionMuro[]
  /** Personajes no jugadores (enemigos…) que aparecen en ella, y dónde */
  personajesNoJugadores?: DescripcionPersonajeNoJugador[]
}
