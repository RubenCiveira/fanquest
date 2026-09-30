import type { Jugador } from '../modelo/jugador'
import type { MapaEnJuego } from '../modelo/mapaEnJuego'

/** Lo que implementa el proyecto para enterarse de a quién le toca */
export interface ProveedorTurnos {
  /**
   * Tras cada activación que termina (y al empezar un turno nuevo), el
   * jugador al que le toca, si a alguno le queda algo por activar: para
   * avisarle o, si es la IA, jugar por ella
   */
  turnoDe(jugador: Jugador, mapa: MapaEnJuego): void
}
