import type { ClaseDeEscuadra } from '../modelo/claseDeEscuadra'
import type { Casilla } from '../modelo/casilla'
import type { Mapa } from '../modelo/mapa'
import type { Personaje } from '../modelo/personaje'

/** Lo que implementa el proyecto para decir qué escuadras de personajes hay: se colocan en la estancia inicial */
export interface ProveedorPersonajes {
  listarEscuadras(): Promise<ClaseDeEscuadra[]>
  /** Motivo por el que ese personaje no puede colocarse ahí desde la zona de espera, o nada si puede */
  motivoParaNoColocar?(personaje: Personaje, casilla: Casilla, mapa: Mapa): string | undefined
}
