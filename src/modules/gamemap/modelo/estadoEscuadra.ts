import type { AccionEjecutada } from './accionEjecutada'
import type { ModoActivacion } from './activacion'
import type { Casilla } from './casilla'
import type { Escuadra } from './escuadra'
import type { MovimientoHecho } from './movimientoHecho'

/** Posición de un héroe: su estancia y su casilla en ella (sin casilla, está en la zona de espera) */
export type PosicionHeroe = { id: string; estancia: string; posicion?: Casilla }

/** Lo que el gestor cuenta a una escuadra al preguntarle qué acciones tiene */
export type EstadoEscuadra = {
  escuadra: Escuadra['id']
  /** Número del turno en curso */
  turno: number
  /** Sus héroes vivos */
  heroes: PosicionHeroe[]
  modo: ModoActivacion
  /** Acciones que ya ha ejecutado en este turno, en orden */
  acciones: AccionEjecutada[]
  /** Movimientos de sus héroes en este turno, en orden */
  movimientos: MovimientoHecho[]
}
