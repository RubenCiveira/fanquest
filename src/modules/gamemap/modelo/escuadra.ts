import type { AccionEjecutada } from './accionEjecutada'
import type { Activacion, ModoActivacion } from './activacion'
import type { Heroe } from './heroe'

/** Lo que ha hecho una escuadra en un turno: su activación (si se ha activado) y las acciones de todos sus héroes */
export type TurnoDeEscuadra = { numero: number; activacion?: Activacion; acciones: AccionEjecutada[] }

/**
 * Estado de una escuadra en el mapa, que guarda el gestor: sus héroes, el que
 * está actuando (`activo`), el último modo en que se activó (o el de partida)
 * y sus turnos
 */
export type Escuadra = {
  id: string
  nombre: string
  heroes: Heroe[]
  activo?: string
  modo?: ModoActivacion
  turnos: TurnoDeEscuadra[]
}
