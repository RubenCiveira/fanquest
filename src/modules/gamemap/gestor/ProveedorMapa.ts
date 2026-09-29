import type { ProveedorConfiguracion } from './ProveedorConfiguracion'
import type { ProveedorConfirmacion } from './ProveedorConfirmacion'
import type { ProveedorEstancias } from './ProveedorEstancias'
import type { ProveedorHeroes } from './ProveedorHeroes'

/** Todo lo que el proyecto da al gestor del mapa: un objeto que cumple cada una de estas interfaces */
export type ProveedorMapa = ProveedorConfiguracion & ProveedorConfirmacion & ProveedorEstancias & ProveedorHeroes
