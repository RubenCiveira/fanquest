import type { Jugador } from '../modelo/jugador'
import type { Escuadra } from '../modelo/escuadra'
import type { HuecoDelTurno } from '../modelo/ordenDelTurno'
import type { MapaEnJuego } from '../modelo/mapaEnJuego'
import type { PersonajeEnJuego } from '../modelo/personajeEnJuego'

/** Lo que implementa el proyecto para enterarse de a quién le toca */
export interface ProveedorTurnos {
  /**
   * Tras cada activación que termina (y al empezar un turno nuevo), el
   * jugador al que le toca, si a alguno le queda algo por activar: para
   * avisarle o, si es la IA, jugar por ella
   */
  turnoDe(jugador: Jugador, mapa: MapaEnJuego): void
  /** Cuando nadie tiene más activaciones pendientes, antes de empezar el siguiente turno */
  finDeTurno(mapa: MapaEnJuego): void
  /**
   * Con `ordenActivaciones: 'iniciativa'`, al empezar cada turno (también el
   * primero): en qué orden activan los jugadores (cartas de iniciativa…),
   * cada uno con cuántas activaciones seguidas (sin decirlo, todas las que le
   * queden). Lo que quede al acabar el orden va como `alternas`. Sin él, todo
   * va como `alternas`
   */
  ordenDelTurno?(mapa: MapaEnJuego): HuecoDelTurno[]
  /**
   * Cuando termina la activación de una escuadra y, con la coherencia de la
   * configuración (`Configuracion.coherencia`), algunos de sus personajes quedan fuera:
   * cuáles. El proyecto decide qué les pasa (se eliminan, huyen…). Sin él, no
   * se avisa
   */
  escuadraSinCoherencia?(escuadra: Escuadra, fuera: PersonajeEnJuego[], mapa: MapaEnJuego): void
}
