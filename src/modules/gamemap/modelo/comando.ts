import type { Accion } from './accion'

/**
 * Acción que lleva su propio código: la escuadra la crea con lo que necesita
 * (el héroe, el mapa…) ya empaquetado y el gestor solo llama a `exec` al
 * elegirla. Si `exec` falla o se cancela, la acción no se apunta
 */
export interface Comando extends Accion {
  exec(): Promise<void>
}

/** Si la acción es un comando con código que ejecutar */
export const esComando = (accion: Accion): accion is Comando => 'exec' in accion && typeof accion.exec === 'function'
