import type { Accion } from './accion'
import type { Ataque } from './ataque'
import type { Personaje } from './personaje'
import type { MapaEnJuego } from './mapaEnJuego'
import type { MovimientoGastado } from './movimientoGastado'
import type { OpcionesMovimiento } from './opcionesMovimiento'
import type { ResultadoAccion } from './resultadoAccion'

/**
 * Lo que puede hacer un personaje, según lo define el proyecto. El gestor le
 * pregunta con el estado del personaje (`Personaje`: su posición y sus turnos)
 */
export interface ClaseDePersonaje {
  id: string
  nombre: string
  /** URL de su ficha VTT, la figura vista desde arriba que se pinta en el mapa */
  imagenVtt?: string
  /** Puntos de vida con los que empieza; sin ellos, no se lleva la cuenta */
  vida?: number
  /**
   * Cómo puede moverse ahora, con lo que ya ha movido este turno (`gastado`);
   * se pregunta al empezar a arrastrar su ficha. Sin opciones, no puede moverse
   */
  opcionesMovimiento(personaje: Personaje, gastado: MovimientoGastado): Promise<OpcionesMovimiento | undefined>
  /**
   * Acciones que puede hacer ahora donde está (se pregunta al pulsar su
   * ficha): el personaje mira qué hay en su casilla y compone sus comandos. El
   * gestor añade detrás las suyas (cambiar de modo, terminar turno)
   */
  acciones(personaje: Personaje, mapa: MapaEnJuego): Promise<Accion[]>
  /**
   * Ataca a un enemigo: se llama al soltar su ficha arrastrada sobre la de un
   * enemigo. Presenta el ataque (un diálogo, dados…) y aplica el resultado con
   * `mapa.reducirVida` y `mapa.eliminarPersonaje`. Como cualquier acción,
   * resuelve con el estado del atacante (si aún le quedan acciones). Si falla
   * o se cancela, el ataque no se apunta
   */
  atacar(ataque: Ataque, mapa: MapaEnJuego): Promise<ResultadoAccion>
}
