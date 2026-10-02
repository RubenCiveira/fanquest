import type { Casilla } from './modelo/casilla'
import type { Direccion } from './modelo/direccion'
import type { Encaramiento } from './modelo/encaramiento'

/** Hacia dónde mira un personaje que aún no ha girado */
export const ORIENTACION_INICIAL: Direccion = 'arriba'

/** El paso de una casilla a la de al lado en cada dirección */
export const VECTOR: Record<Direccion, Casilla> = { arriba: { x: 0, y: -1 }, abajo: { x: 0, y: 1 }, izquierda: { x: -1, y: 0 }, derecha: { x: 1, y: 0 } }

/** En orden de las agujas del reloj: girar a la derecha es ir a la siguiente */
const EN_RELOJ: Direccion[] = ['arriba', 'derecha', 'abajo', 'izquierda']

/** Giros de 90° para pasar de mirar hacia `a` a mirar hacia `b`: 0, 1 o 2 (darse la vuelta) */
export const girosEntre = (a: Direccion, b: Direccion): number => {
  const vueltas = Math.abs(EN_RELOJ.indexOf(a) - EN_RELOJ.indexOf(b))
  return Math.min(vueltas, 4 - vueltas)
}

/** Hacia dónde mira tras girar a la derecha (`1`) o a la izquierda (`-1`) o darse la vuelta (`2`) */
export const girada = (orientacion: Direccion, giro: 1 | -1 | 2): Direccion => EN_RELOJ[(EN_RELOJ.indexOf(orientacion) + giro + 4) % 4]

/** Cómo va el que se mueve tras un paso: hacia dónde mira y si va en diagonal */
export type Rumbo = { orientacion: Direccion; enDiagonal: boolean }

/**
 * Lo que cuesta girar para dar el paso de `de` a `a` (casillas de al lado)
 * con ese `rumbo`, y el rumbo con que queda. En recto, gira hasta mirar hacia
 * donde va. En diagonal, a la orientación más cercana cuyas diagonales de
 * delante la incluyen (sigue mirando en recto) y, si empieza un tramo en
 * diagonal, paga además `costeGiroDiagonal`
 */
export function giroDelPaso(rumbo: Rumbo, de: Casilla, a: Casilla, { costeGiro, costeGiroDiagonal }: Omit<Encaramiento, 'orientacion'>): { coste: number; rumbo: Rumbo } {
  const [dx, dy] = [a.x - de.x, a.y - de.y]
  const haciaX: Direccion = dx > 0 ? 'derecha' : 'izquierda'
  const haciaY: Direccion = dy > 0 ? 'abajo' : 'arriba'
  if (!dx || !dy) {
    const hacia = dx ? haciaX : haciaY
    return { coste: girosEntre(rumbo.orientacion, hacia) * costeGiro, rumbo: { orientacion: hacia, enDiagonal: false } }
  }
  // nunca empatan: las dos son perpendiculares, así que una está a un giro más que la otra
  const [hacia] = [haciaY, haciaX].sort((p, q) => girosEntre(rumbo.orientacion, p) - girosEntre(rumbo.orientacion, q))
  return { coste: girosEntre(rumbo.orientacion, hacia) * costeGiro + (rumbo.enDiagonal ? 0 : costeGiroDiagonal), rumbo: { orientacion: hacia, enDiagonal: true } }
}

/** Lo que cuesta girar en cada paso del recorrido (sin contar la casilla de salida) y hacia dónde mira al final */
export function girosDe(recorrido: Casilla[], encaramiento: Encaramiento): { costes: number[]; orientacion: Direccion } {
  let rumbo: Rumbo = { orientacion: encaramiento.orientacion, enDiagonal: false }
  const costes = recorrido.slice(1).map((c, i) => {
    const paso = giroDelPaso(rumbo, recorrido[i], c, encaramiento)
    rumbo = paso.rumbo
    return paso.coste
  })
  return { costes, orientacion: rumbo.orientacion }
}
