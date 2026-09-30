import type { Personaje } from './personaje'

/** Cuerpo a cuerpo si el objetivo está pegado al atacante (también en diagonal, sin muros entre ellos); si no, a distancia */
export type TipoAtaque = 'cuerpo-a-cuerpo' | 'distancia'

/** Ataque que se pide a la clase del atacante: a quién, de qué tipo y a cuántas casillas (en recto o en diagonal) */
export type Ataque = { atacante: Personaje; objetivo: Personaje; tipo: TipoAtaque; distancia: number }
