import type { Accion } from './accion'

/** Parte de un movimiento: hasta `distancia` casillas más; si consume una acción adicional (deslizar…), cuál */
export type TramoMovimiento = { distancia: number; accion?: Accion }

/**
 * Una forma de moverse. `tramos` se recorren seguidos: el primero es el
 * movimiento en sí y los siguientes lo alargan (6 + 3 deslizando). `accion` es
 * la que consume moverse así
 */
export type OpcionMovimiento = {
  id: string
  nombre: string
  /** `carga` se dibuja distinto: es un movimiento para contactar con el enemigo */
  tipo: 'normal' | 'carga'
  accion: Accion
  tramos: TramoMovimiento[]
  /** No puede pasar ni terminar a esta distancia de un enemigo o menos (1: junto a él, también en diagonal) */
  alejarseDeEnemigos?: number
  /** Tiene que terminar junto a un enemigo (también en diagonal) */
  terminarJuntoAEnemigo?: boolean
}

/**
 * Cómo puede moverse un personaje ahora: su movimiento `base` y las
 * `variaciones` (cargar, deslizar…). Al soltar, vale la primera que permita
 * el recorrido: la base y después las variaciones, en orden
 */
export type OpcionesMovimiento = { base: OpcionMovimiento; variaciones: OpcionMovimiento[] }
