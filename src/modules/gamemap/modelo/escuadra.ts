import type { Accion } from './accion'
import type { AccionEjecutada } from './accionEjecutada'
import type { ModoAgresivoSigiloso } from './activacion'
import type { EstadoEscuadra } from './estadoEscuadra'
import type { Heroe } from './heroe'
import type { HeroeEnMapa } from './heroeEnMapa'
import type { MapaEnJuego } from './mapaEnJuego'
import type { ResultadoActivacion } from './resultadoActivacion'

/** Grupo de héroes que da el proyecto; cada escuadra informa de quiénes la componen */
export interface Escuadra {
  id: string
  nombre: string
  heroes(): Promise<Heroe[]>
  /** Modo en que empieza, si la configuración permite modo agresivo o sigiloso */
  modoActivacion(): Promise<ModoAgresivoSigiloso>
  /**
   * Acciones que puede hacer ahora, según su estado y el mapa; `heroe`, el
   * suyo cuya ficha se ha pulsado para abrir el menú, con su posición. Pueden
   * ser comandos (`Comando`) con su código ya empaquetado. El gestor añade
   * detrás las suyas (cambiar de modo, terminar turno)
   */
  acciones(estado: EstadoEscuadra, mapa: MapaEnJuego, heroe?: HeroeEnMapa): Promise<Accion[]>
  /**
   * Tras cada acción o movimiento, con las acciones que lleva ejecutadas en el
   * turno: si responde `completo`, el gestor termina su turno
   */
  activar(acciones: AccionEjecutada[]): Promise<ResultadoActivacion>
}
