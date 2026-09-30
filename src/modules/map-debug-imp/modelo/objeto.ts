import type { Accion, MapaEnJuego } from '../../gamemap'

/**
 * Lo que un objeto de prueba (una puerta, un cofre, un mueble…) deja hacer a
 * un personaje: el efecto sobre el mapa (`hacer`). El personaje lo convierte
 * en su comando, que antes comprueba si aún le queda su acción del turno
 */
export type AccionDeObjeto = Accion & { hacer(): Promise<void> }

/** Objeto del mapa de prueba en una casilla (una puerta…): ofrece sus acciones, sobre ese mapa, al personaje que la pisa */
export interface ObjetoDePrueba {
  acciones(mapa: MapaEnJuego): AccionDeObjeto[]
}
