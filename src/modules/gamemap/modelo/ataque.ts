import type { Casilla } from './casilla'
import type { PersonajeEnJuego } from './personajeEnJuego'
import type { TipoCobertura } from './terreno'

/** Cuerpo a cuerpo si el objetivo está pegado al atacante (también en diagonal, sin muros entre ellos); si no, a distancia */
export type TipoAtaque = 'cuerpo-a-cuerpo' | 'distancia'

/**
 * Lo que cruza la línea recta del centro de la casilla del atacante al de la
 * del objetivo: sus casillas (del mapa, en orden, sin contar las de los dos;
 * si pasa justo por una esquina, sigue en diagonal) y, en ellas, cuántos
 * personajes aliados (los que no son enemigos del atacante) y enemigos hay,
 * cuántas casillas dan cada tipo de cobertura (la mayor de sus terrenos, si
 * hay varios; sin terreno, ninguna) y cuántos muros interiores la dan (los
 * que cruza la línea, con la del muro o bloqueante por una puerta cerrada),
 * cuántas tienen
 * objetos y cuántos muros cruza (de una estancia a otra sin una puerta
 * abierta en medio, o fuera de las estancias)
 */
export type Trayectoria = {
  casillas: Casilla[]
  aliados: number
  enemigos: number
  coberturas: Record<TipoCobertura, number>
  objetos: number
  muros: number
}

/**
 * Ataque que se pide a la clase del atacante: a quién, de qué tipo, a cuántas
 * casillas según la medición del movimiento (`distancia`, en línea recta y
 * sin obstáculos), cuánto costaría llegar moviéndose (`recorrido`, rodeando
 * obstáculos y con el terreno; sin él, no se puede llegar) y por dónde pasa
 * la línea del ataque (`trayectoria`)
 */
export type Ataque = { atacante: PersonajeEnJuego; objetivo: PersonajeEnJuego; tipo: TipoAtaque; distancia: number; recorrido?: number; trayectoria: Trayectoria }
