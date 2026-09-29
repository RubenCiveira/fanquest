import type { Casilla } from './casilla'
import type { Escuadra } from './escuadra'
import type { Heroe } from './heroe'
import type { Medida } from './medida'

/**
 * Lo que ocupa casillas de una estancia. `posicion` es la casilla de su
 * esquina superior izquierda; sin ella está en la zona de espera, para que
 * el jugador lo coloque a mano
 */
type Ocupante = Medida & { id: string; nombre: string; posicion?: Casilla }

export type Objeto = Ocupante & { tipo: 'objeto' }

/** Ficha de un héroe: ocupa una casilla, su id es el del héroe y `escuadra`, el de la suya */
export type FichaHeroe = Ocupante & Pick<Heroe, 'imagenVtt'> & { tipo: 'heroe'; escuadra: Escuadra['id'] }

export type Elemento = Objeto | FichaHeroe
