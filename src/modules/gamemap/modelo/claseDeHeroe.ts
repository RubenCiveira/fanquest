import type { Accion } from './accion'
import type { Heroe } from './heroe'
import type { MapaEnJuego } from './mapaEnJuego'
import type { MovimientoGastado } from './movimientoGastado'
import type { OpcionesMovimiento } from './opcionesMovimiento'

/**
 * Lo que puede hacer un héroe, según lo define el proyecto. El gestor le
 * pregunta con el estado del héroe (`Heroe`: su posición y sus turnos)
 */
export interface ClaseDeHeroe {
  id: string
  nombre: string
  /** URL de su ficha VTT, la figura vista desde arriba que se pinta en el mapa */
  imagenVtt?: string
  /**
   * Cómo puede moverse ahora, con lo que ya ha movido este turno (`gastado`);
   * se pregunta al empezar a arrastrar su ficha. Sin opciones, no puede moverse
   */
  opcionesMovimiento(heroe: Heroe, gastado: MovimientoGastado): Promise<OpcionesMovimiento | undefined>
  /**
   * Acciones que puede hacer ahora donde está (se pregunta al pulsar su
   * ficha): el héroe mira qué hay en su casilla y compone sus comandos. El
   * gestor añade detrás las suyas (cambiar de modo, terminar turno)
   */
  acciones(heroe: Heroe, mapa: MapaEnJuego): Promise<Accion[]>
}
