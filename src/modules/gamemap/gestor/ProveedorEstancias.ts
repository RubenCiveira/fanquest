import type { DescripcionEstancia } from '../modelo/descripcionEstancia'
import type { Mapa } from '../modelo/mapa'

/**
 * Lo que implementa el proyecto para decidir cada estancia nueva: con una
 * tabla, un mazo o un formulario. `mapa` es el ya construido; en la primera
 * estancia no hay. Si se rechaza la promesa, no se crea ninguna
 */
export interface ProveedorEstancias {
  describirEstancia(mapa?: Mapa): Promise<DescripcionEstancia>
}
