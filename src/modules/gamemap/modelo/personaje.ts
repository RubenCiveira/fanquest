import type { Casilla } from './casilla'
import type { MovimientoHecho } from './movimientoHecho'

/** Lo que ha hecho un personaje en un turno: sus acciones (sin contar moverse) y sus movimientos */
export type TurnoDePersonaje = { numero: number; acciones: string[]; movimientos: MovimientoHecho[] }

/**
 * Estado de un personaje en el mapa, que guarda el gestor: dónde está (la
 * estancia y su casilla en ella; sin casilla, en la zona de espera de la
 * estancia) y sus turnos
 */
export type Personaje = {
  id: string
  nombre: string
  imagenVtt?: string
  estancia: string
  casilla?: Casilla
  turnos: TurnoDePersonaje[]
}
