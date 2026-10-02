import type { Direccion } from './direccion'

/**
 * Hacia dónde mira el que se mueve al empezar y lo que le cuesta girar, en
 * casillas de movimiento: cada giro de 90° (`costeGiro`; darse la vuelta, el
 * doble) y empezar un tramo en diagonal (`costeGiroDiagonal`). En diagonal
 * solo se va hacia las dos diagonales de delante del encaramiento: para otra,
 * antes hay que girar
 */
export type Encaramiento = { orientacion: Direccion; costeGiro: number; costeGiroDiagonal: number }
