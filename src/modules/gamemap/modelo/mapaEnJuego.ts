import type { Estancia } from './estancia'
import type { Mapa } from './mapa'
import type { Puerta } from './puerta'
import type { Ubicacion } from './ubicacion'

/** Lo que el gestor deja hacer al proyecto sobre el mapa: al preguntar por las acciones y desde sus comandos */
export interface MapaEnJuego {
  /** El mapa tal como está ahora */
  readonly mapa: Mapa
  /** Puerta de esa casilla, si la hay */
  puertaEn(ubicacion: Ubicacion): Puerta | undefined
  /**
   * Abre la puerta de esa casilla: pide al proveedor la estancia a la que da
   * y la marca abierta hacia ella. Falla si no hay puerta, ya está abierta o
   * el proveedor no da la estancia (la puerta sigue cerrada)
   */
  abrirPuerta(ubicacion: Ubicacion): Promise<Estancia>
}
