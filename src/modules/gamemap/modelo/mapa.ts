import type { Escuadra } from './escuadra'
import type { Estancia } from './estancia'
import type { AccionEjecutada } from './accionEjecutada'
import type { Activacion } from './activacion'
import type { Jugadores } from './jugadores'
import type { PersonajeNoJugador } from './personajeNoJugador'
import type { OrdenDelTurno } from './ordenDelTurno'

/**
 * Estado del mapa: las estancias generadas hasta ahora (en el orden en que se
 * crearon), las escuadras con sus personajes, los personajes no jugadores
 * (enemigos…), el número del turno en curso (sin él, el primero), el reparto
 * de jugadores y alianzas (sin él, no hay turnos de jugador ni enemigos) y la
 * `rotacion`: los jugadores que han terminado una activación, en orden, de la
 * que sale a quién le toca; con iniciativa, el orden del turno en curso
 */
export type Mapa = {
  estancias: Estancia[]
  escuadras?: Escuadra[]
  personajesNoJugadores?: PersonajeNoJugador[]
  turno?: number
  jugadores?: Jugadores
  activacionesJugadores?: { numero: number; jugador: string; activacion: Activacion; acciones: AccionEjecutada[]; personaje?: string }[]
  rotacion?: string[]
  ordenDelTurno?: OrdenDelTurno
}
