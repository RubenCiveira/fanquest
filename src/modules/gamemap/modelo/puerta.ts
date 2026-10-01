import type { Casilla } from './casilla'
import type { Direccion } from './direccion'

/**
 * Puerta en un muro de una estancia: va en la arista entre su `casilla` y la
 * de al lado por su `lado`. La entrada y las salidas, en el muro exterior (la
 * casilla, en el borde): al abrirla queda `abierta` y `destino` es la
 * estancia a la que da. Las `interior`, en un muro de dentro de la estancia
 * (`Estancia.muros`): cerrada no se cruza; al abrirla da a la misma estancia
 */
export type Puerta = { id: string; tipo: 'entrada' | 'salida' | 'interior'; casilla: Casilla; lado: Direccion; abierta?: boolean; destino?: string }
