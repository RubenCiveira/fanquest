import type { Accion } from './accion'
import type { Ataque } from './ataque'
import type { PersonajeEnJuego } from './personajeEnJuego'
import type { MapaEnJuego } from './mapaEnJuego'
import type { MovimientoGastado } from './movimientoGastado'
import type { OpcionesMovimiento } from './opcionesMovimiento'
import type { ResultadoAccion } from './resultadoAccion'
import type { ResultadoAlEntrar } from './resultadoAlEntrar'
import type { Ubicacion } from './ubicacion'

/**
 * Lo que puede hacer un personaje, según lo define el proyecto. El gestor le
 * pregunta con el personaje en juego (`PersonajeEnJuego`: su estado, con su
 * posición y sus turnos, y si está trabado o con apoyos)
 */
export interface ClaseDePersonaje {
  id: string
  nombre: string
  /** URL de su ficha VTT, la figura vista desde arriba que se pinta en el mapa */
  imagenVtt?: string
  /** Puntos de vida con los que empieza; sin ellos, no se lleva la cuenta */
  vida?: number
  /** Casillas que ocupa hacia donde mira (`largo`) y de lado (`ancho`); sin ellas, una (`Personaje.largo`, `ancho`) */
  largo?: number
  ancho?: number
  /**
   * Cómo puede moverse ahora, con lo que ya ha movido este turno (`gastado`);
   * se pregunta al empezar a arrastrar su ficha. Sin opciones, no puede moverse
   */
  opcionesMovimiento(personaje: PersonajeEnJuego, gastado: MovimientoGastado): Promise<OpcionesMovimiento | undefined>
  /**
   * Acciones que puede hacer ahora donde está (se pregunta al pulsar su
   * ficha): el personaje mira qué hay en su casilla y compone sus comandos. El
   * gestor añade detrás las suyas (cambiar de modo, terminar turno)
   */
  acciones(personaje: PersonajeEnJuego, mapa: MapaEnJuego): Promise<Accion[]>
  /**
   * Por qué no puede hacer ese ataque (fuera de su alcance, sin línea de
   * visión…), o nada si puede: lo decide con los datos del ataque (tipo,
   * distancias, trayectoria). Se pregunta al pasar su ficha arrastrada por
   * encima de un enemigo, para mostrarlo, y antes de atacar: si hay motivo,
   * no ataca
   */
  motivoParaNoAtacar(ataque: Ataque, mapa: MapaEnJuego): string | undefined
  /**
   * Ataca a un enemigo: se llama al soltar su ficha arrastrada sobre la de un
   * enemigo. Presenta el ataque (un diálogo, dados…) y aplica el resultado con
   * `mapa.reducirVida` y `mapa.eliminarPersonaje`. Como cualquier acción,
   * resuelve con el estado del atacante (si aún le quedan acciones). Si falla
   * o se cancela, el ataque no se apunta
   */
  atacar(ataque: Ataque, mapa: MapaEnJuego): Promise<ResultadoAccion>
  /**
   * Avisa de que va a entrar en esa casilla de su recorrido (`donde`: la
   * estancia y la casilla en ella), para que el proyecto resuelva lo que pase
   * al pisarla (una trampa, un área de influencia…). Se llama al mover su
   * ficha, ya validado el recorrido y antes de moverlo (el personaje aún está
   * donde empezó), casilla a casilla y en orden, solo en las que podría
   * quedarse (las de otros personajes se saltan). Con `detenerse`, se mueve
   * solo hasta ahí y no se pregunta por las demás; con `terminar-turno`,
   * además ya no le quedan acciones en el turno. Sin el método, siempre sigue
   */
  alEntrar?(personaje: PersonajeEnJuego, donde: Ubicacion, mapa: MapaEnJuego): Promise<ResultadoAlEntrar>
}
