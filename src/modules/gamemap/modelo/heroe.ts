import type { Casilla } from './casilla'
import type { MovimientoHecho } from './movimientoHecho'

/** Lo que ha hecho un héroe en un turno: sus acciones (sin contar moverse) y sus movimientos */
export type TurnoDeHeroe = { numero: number; acciones: string[]; movimientos: MovimientoHecho[] }

/**
 * Estado de un héroe en el mapa, que guarda el gestor: dónde está (la
 * estancia y su casilla en ella; sin casilla, en la zona de espera de la
 * estancia) y sus turnos
 */
export type Heroe = {
  id: string
  nombre: string
  imagenVtt?: string
  estancia: string
  casilla?: Casilla
  turnos: TurnoDeHeroe[]
}
