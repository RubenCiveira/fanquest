import type { Accion } from './accion'
import type { AccionEjecutada } from './accionEjecutada'
import type { ModoAgresivoSigiloso } from './activacion'
import type { EstadoEscuadra } from './estadoEscuadra'
import type { Heroe } from './heroe'
import type { ResultadoActivacion } from './resultadoActivacion'

/** Grupo de héroes que da el proyecto; cada escuadra informa de quiénes la componen */
export interface Escuadra {
  id: string
  nombre: string
  heroes(): Promise<Heroe[]>
  /** Modo en que empieza, si la configuración permite modo agresivo o sigiloso */
  modoActivacion(): Promise<ModoAgresivoSigiloso>
  /** Acciones que puede hacer ahora; el gestor añade las suyas (cambiar de modo, terminar turno) */
  acciones(estado: EstadoEscuadra): Promise<Accion[]>
  /**
   * Tras cada acción o movimiento, con las acciones que lleva ejecutadas en el
   * turno: si responde `completo`, el gestor termina su turno
   */
  activar(acciones: AccionEjecutada[]): Promise<ResultadoActivacion>
}
