/**
 * Lo que implementa el proyecto para que el jugador confirme algo antes de
 * hacerlo (mover consumiendo una acción adicional, p. ej.): `true` si confirma
 */
export interface ProveedorConfirmacion {
  confirmar(mensaje: string): Promise<boolean>
}
