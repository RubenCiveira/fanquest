import type { ClaseDeEscuadra } from '../modelo/claseDeEscuadra'

/** Lo que implementa el proyecto para decir qué escuadras de personajes hay: se colocan en la estancia inicial */
export interface ProveedorPersonajes {
  listarEscuadras(): Promise<ClaseDeEscuadra[]>
}
