import type { AccionEjecutada } from './accionEjecutada'
import type { ModoAgresivoSigiloso } from './activacion'
import type { ClaseDeHeroe } from './claseDeHeroe'
import type { ResultadoActivacion } from './resultadoActivacion'

/** Grupo de héroes según lo define el proyecto: quiénes lo componen y cómo se activa */
export interface ClaseDeEscuadra {
  id: string
  nombre: string
  heroes(): Promise<ClaseDeHeroe[]>
  /** Modo en que empieza, si la configuración permite modo agresivo o sigiloso */
  modoActivacion(): Promise<ModoAgresivoSigiloso>
  /**
   * Tras cada acción o movimiento, con las acciones que lleva ejecutadas en el
   * turno: si responde `completo`, el gestor termina su turno
   */
  activar(acciones: AccionEjecutada[]): Promise<ResultadoActivacion>
}
