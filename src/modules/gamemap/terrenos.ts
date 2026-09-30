import type { Casilla } from './modelo/casilla'
import type { Estancia } from './modelo/estancia'
import type { Terreno, TipoTerreno } from './modelo/terreno'

/** Lo que cuesta entrar en una casilla de cada terreno (en veces lo que cuesta una normal) */
export const COSTE_TERRENO: Record<Exclude<TipoTerreno, 'impasable'>, number> = { dificil: 2, 'muy-dificil': 3 }

const cubre = ({ posicion, columnas, filas }: Terreno, { x, y }: Casilla) =>
  x >= posicion.x && y >= posicion.y && x < posicion.x + columnas && y < posicion.y + filas

/** Terreno de esa casilla de la estancia, si no es normal */
export const terrenoEn = (e: Estancia, c: Casilla): Terreno | undefined => e.terrenos?.find((t) => cubre(t, c))

/** Veces que cuesta entrar en esa casilla de la estancia lo que una normal; infinito si es impasable */
export function factorDeTerreno(e: Estancia, c: Casilla): number {
  const tipo = terrenoEn(e, c)?.tipo
  if (!tipo) return 1
  return tipo === 'impasable' ? Number.POSITIVE_INFINITY : COSTE_TERRENO[tipo]
}

/** Por qué el terreno no puede ir en la estancia (se sale o no tiene tamaño), o nada si puede */
export function motivoParaNoAnadirTerreno(e: Estancia, t: Terreno): string | undefined {
  const { posicion, columnas, filas } = t
  if (![columnas, filas].every((n) => Number.isInteger(n) && n > 0)) return `Un terreno ${t.tipo} necesita filas y columnas enteras y positivas`
  if (posicion.x < 0 || posicion.y < 0 || posicion.x + columnas > e.columnas || posicion.y + filas > e.filas) {
    return `Un terreno ${t.tipo} en ${posicion.x},${posicion.y} se sale de «${e.id}»`
  }
}
