import type { Accion } from './accion'
import type { ResultadoAccion } from './resultadoAccion'

/**
 * Acción que lleva su propio código: la escuadra la crea con lo que necesita
 * (el personaje, el mapa…) ya empaquetado y el gestor solo llama a `exec` al
 * elegirla. `exec` resuelve con el estado del personaje tras la acción (si
 * aún le quedan acciones), que el gestor apunta en su turno. Si falla o se
 * cancela, la acción no se apunta
 */
export interface Comando extends Accion {
  exec(): Promise<ResultadoAccion>
}

/** Si la acción es un comando con código que ejecutar */
export const esComando = (accion: Accion): accion is Comando => 'exec' in accion && typeof accion.exec === 'function'
