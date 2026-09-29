import type { Escuadra } from '../modelo/escuadra'

/** Lo que implementa el proyecto para decir qué escuadras de héroes hay: se colocan en la estancia inicial */
export interface ProveedorHeroes {
  listarEscuadras(): Promise<Escuadra[]>
}
