import type { Casilla } from './casilla'
import type { Medida } from './medida'

/**
 * Objeto que ocupa casillas de una estancia. `posicion` es la casilla de su
 * esquina superior izquierda; sin ella está en la zona de espera, para que el
 * jugador lo coloque a mano
 */
export type Objeto = Medida & { id: string; tipo: 'objeto'; nombre: string; posicion?: Casilla; flags?: string[] }

/** Mueble fijo de la estancia: ocupa casillas, puede tener imagen y estado propio */
export type Mueble = Medida & { id: string; tipo: 'mueble'; nombre: string; posicion?: Casilla; imagenVtt?: string; flags?: string[] }

/** Lo que ocupa casillas de una estancia (los personajes llevan su posición en su propio estado) */
export type Elemento = Objeto | Mueble
