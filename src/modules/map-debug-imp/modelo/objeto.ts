import type { Accion, MapaEnJuego } from '../../gamemap'

/** Objeto del mapa de prueba en una casilla (una puerta…): ofrece sus acciones, sobre ese mapa, al héroe que la pisa */
export interface ObjetoDePrueba {
  acciones(mapa: MapaEnJuego): Accion[]
}
