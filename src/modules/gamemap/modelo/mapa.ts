import type { Escuadra } from './escuadra'
import type { Estancia } from './estancia'

/**
 * Estado del mapa: las estancias generadas hasta ahora (en el orden en que se
 * crearon), las escuadras con sus héroes y el número del turno en curso (sin
 * él, el primero)
 */
export type Mapa = { estancias: Estancia[]; escuadras?: Escuadra[]; turno?: number }
