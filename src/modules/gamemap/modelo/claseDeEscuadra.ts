import type { AccionEjecutada } from './accionEjecutada'
import type { ModoAgresivoSigiloso } from './activacion'
import type { ClaseDePersonaje } from './claseDePersonaje'
import type { ResultadoActivacion } from './resultadoActivacion'

/** Grupo de personajes según lo define el proyecto: quiénes lo componen y cómo se activa */
export interface ClaseDeEscuadra {
  id: string
  nombre: string
  /** Id del jugador del que es, de los de la configuración */
  jugador: string
  personajes(): Promise<ClaseDePersonaje[]>
  /** Modo en que empieza, si la configuración permite modo agresivo o sigiloso */
  modoActivacion(): Promise<ModoAgresivoSigiloso>
  /**
   * Tras cada acción o movimiento, con las acciones que lleva ejecutadas en el
   * turno: si responde `completo`, el gestor termina su turno
   */
  activar(acciones: AccionEjecutada[]): Promise<ResultadoActivacion>
}
