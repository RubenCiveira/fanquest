import type { Escuadra } from './escuadra'
import type { Estancia } from './estancia'
import type { Turno } from './turno'

/** Lo que el mapa guarda de una escuadra (la del proveedor tiene métodos y no se guarda) */
export type DatosEscuadra = Pick<Escuadra, 'id' | 'nombre'>

/**
 * Estancias generadas hasta ahora, en el orden en que se crearon; las
 * escuadras de héroes que hay y el turno en curso (sin él, el primero)
 */
export type Mapa = { estancias: Estancia[]; escuadras?: DatosEscuadra[]; turno?: Turno }
