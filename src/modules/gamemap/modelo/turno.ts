import type { AccionEjecutada } from './accionEjecutada'
import type { Activacion, ModoActivacion } from './activacion'
import type { MovimientoHecho } from './movimientoHecho'

/**
 * Turno en curso: `activaciones` por id de escuadra (valen para todos sus
 * héroes); la que no tiene aún no se ha activado. `ultimosModos`: el último
 * modo agresivo o sigiloso de cada escuadra en turnos anteriores (al empezar,
 * el que dio la escuadra), para saber cómo quedó hasta que vuelva a activarse.
 * `acciones`: las acciones que ha ejecutado cada escuadra en este turno
 * y `movimientos`, los movimientos de sus héroes
 */
export type Turno = {
  numero: number
  activaciones: Record<string, Activacion>
  ultimosModos?: Record<string, ModoActivacion>
  acciones?: Record<string, AccionEjecutada[]>
  movimientos?: Record<string, MovimientoHecho[]>
}
