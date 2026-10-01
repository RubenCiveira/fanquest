import type { Casilla } from './casilla'

/**
 * Cómo se mantiene unida una escuadra: sus personajes colocados tienen que
 * estar a `distancia` o menos (en línea recta, según la medición del
 * movimiento) de alguno de los demás formando una cadena (`alguno`), de
 * todos los demás (`todos`) o del centro de un círculo (`centro`, por
 * Pitágoras), puesto donde deja dentro a más de ellos. Siempre queda alguno
 * dentro: la escuadra nunca se queda sin nadie por la coherencia
 */
export type Coherencia = { modo: 'alguno' | 'todos' | 'centro'; distancia: number }

/**
 * Lo que se dibuja como guía de la coherencia de una escuadra: el centro del
 * círculo (con `centro`, en coordenadas de casilla del mapa con decimales:
 * el medio de la casilla x,y es x + 0,5), las parejas de personajes que se miran (con
 * sus casillas del mapa y si están a la distancia) y los que quedan fuera
 */
export type GuiaDeCoherencia = {
  escuadra: string
  coherencia: Coherencia
  centro?: { x: number; y: number }
  enlaces: { de: string; a: string; desde: Casilla; hasta: Casilla; enCoherencia: boolean }[]
  fuera: string[]
}
