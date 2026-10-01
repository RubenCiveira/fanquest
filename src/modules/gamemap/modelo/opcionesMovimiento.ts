import type { Accion } from './accion'
import type { CosteDelTerreno } from './terreno'

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
  /**
   * Cómo trata la zona de control de los enemigos (`Configuracion.distanciaControl`;
   * quien empieza en ella está trabado en cuerpo a cuerpo): `normal` no puede
   * empezar en ella ni entrar; `carga`, para contactar con un enemigo, tiene
   * que empezar fuera y puede cruzarla; `destrabarse` tiene que empezar en
   * ella y terminar fuera de toda zona enemiga; `posicionarse` tiene que
   * empezar en ella y terminar pegado a uno de los enemigos que lo traban.
   * Las que no son normales se dibujan distinto
   */
  tipo: 'normal' | 'carga' | 'destrabarse' | 'posicionarse'
  accion: Accion
  tramos: TramoMovimiento[]
  /** Tiene que terminar junto a un enemigo (en contacto, según `Configuracion.cuerpoACuerpo`) */
  terminarJuntoAEnemigo?: boolean
  /**
   * Lo que le cuesta a esta forma de moverse entrar en cada tipo de terreno
   * (veces una casilla normal: 1, como si no estuviera); con un número para
   * `impasable`, lo cruza. Lo que no diga, lo normal: difícil 2, muy difícil 3
   * e impasable no se pisa. No cambia lo que pone el gestor (personajes, zona
   * de control)
   */
  terreno?: CosteDelTerreno
  /**
   * Si cruza por encima de los muros interiores de una estancia (volando…),
   * como si fueran pasos. Nunca las puertas interiores cerradas ni el muro de
   * la estancia, que solo se cruza por una puerta abierta
   */
  cruzaMuros?: boolean
}

/**
 * Cómo puede moverse un personaje ahora: su movimiento `base` y las
 * `variaciones` (cargar, deslizar…). Al soltar, vale la primera que permita
 * el recorrido: la base y después las variaciones, en orden
 */
export type OpcionesMovimiento = { base: OpcionMovimiento; variaciones: OpcionMovimiento[] }
