import type { EstadoEscuadra } from './estadoEscuadra'
import type { MovimientoGastado } from './movimientoGastado'
import type { OpcionesMovimiento } from './opcionesMovimiento'

/** Héroe tal como lo da el proyecto */
export interface Heroe {
  id: string
  nombre: string
  /** URL de su ficha VTT, la figura vista desde arriba que se pinta en el mapa */
  imagenVtt?: string
  /**
   * Cómo puede moverse ahora, según el estado de su escuadra y lo que ya ha
   * movido este turno (`gastado`); se pregunta al empezar a arrastrar su
   * ficha, también si ya se ha movido. Sin opciones, no puede moverse
   */
  opcionesMovimiento(estado: EstadoEscuadra, gastado: MovimientoGastado): Promise<OpcionesMovimiento | undefined>
}
