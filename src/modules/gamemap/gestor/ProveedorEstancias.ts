import type { DescripcionEstancia } from '../modelo/descripcionEstancia'
import type { Direccion } from '../modelo/direccion'
import type { Estancia } from '../modelo/estancia'
import type { Mapa } from '../modelo/mapa'
import type { MapaEnJuego } from '../modelo/mapaEnJuego'

/**
 * Lo que implementa el proyecto para decidir cada estancia nueva: con una
 * tabla, un mazo o un formulario. `mapa` es el ya construido; en la primera
 * estancia no hay. `entrada`: si se abre desde una puerta, el muro de la
 * estancia nueva que encaja con ella, donde irá su entrada (su orientación,
 * hacia donde están las salidas, no puede ser ese muro). Si se rechaza la
 * promesa, no se crea ninguna
 */
export interface ProveedorEstancias {
  describirEstancia(mapa?: Mapa, entrada?: Direccion): Promise<DescripcionEstancia>
  /**
   * Aviso de que la estancia ya está creada y en su sitio, con sus puertas:
   * el proyecto puede asociarle lo suyo (objetos para sus puertas…). `mapa`,
   * lo que el gestor le deja hacer sobre el mapa
   */
  estanciaCreada(estancia: Estancia, mapa: MapaEnJuego): void
}
