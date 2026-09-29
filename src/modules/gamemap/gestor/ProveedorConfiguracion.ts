import type { Configuracion } from '../modelo/configuracion'

/** Lo que implementa el proyecto para fijar las reglas de activación */
export interface ProveedorConfiguracion {
  configuracion: Configuracion
}
