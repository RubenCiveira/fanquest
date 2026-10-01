import type { Personaje } from './personaje'

/**
 * Personaje tal como lo reciben las clases del proyecto (sus acciones, su
 * movimiento, sus ataques) y como lo da `MapaEnJuego`: su estado y lo que el
 * gestor sabe de él en el mapa, calculado al preguntarlo (con el mapa de ese
 * momento y la zona de control de `Configuracion.distanciaControl`)
 */
export type PersonajeEnJuego = Personaje & {
  /** Si está en la zona de control de algún enemigo: trabado en cuerpo a cuerpo */
  estaTrabado(): boolean
  /** Los personajes en su zona de control que lo consideran aliado (su alianza es aliada de la suya, o es la misma) */
  conApoyos(): PersonajeEnJuego[]
}
