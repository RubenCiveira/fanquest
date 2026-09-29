import type { Casilla } from './casilla'
import type { Direccion } from './direccion'

/**
 * Puerta en el muro exterior de una estancia: va en la arista entre su
 * `casilla` (de la estancia, en el borde) y la de fuera por su `lado`
 */
export type Puerta = { id: string; tipo: 'entrada' | 'salida'; casilla: Casilla; lado: Direccion }
