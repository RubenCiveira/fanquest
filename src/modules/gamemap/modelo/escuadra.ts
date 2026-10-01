import type { AccionEjecutada } from './accionEjecutada'
import type { Activacion, ModoActivacion } from './activacion'
import type { Personaje } from './personaje'

/** Lo que ha hecho una escuadra en un turno: su activación (si se ha activado) y las acciones de todos sus personajes */
export type TurnoDeEscuadra = { numero: number; activacion?: Activacion; acciones: AccionEjecutada[] }

/**
 * Estado de una escuadra en el mapa, que guarda el gestor: el jugador del
 * que es (y sus personajes con ella), sus personajes, el que está actuando
 * (`activo`), el último modo en que se activó (o el de partida) y sus turnos
 */
export type Escuadra = {
  id: string
  nombre: string
  jugador: string
  personajes: Personaje[]
  activo?: string
  modo?: ModoActivacion
  turnos: TurnoDeEscuadra[]
  /** Marcas de estado de la escuadra que cambian durante la partida */
  flags?: string[]
}
