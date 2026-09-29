import type { Casilla } from './modelo/casilla'
import type { Estancia } from './modelo/estancia'
import type { Medida } from './modelo/medida'

/** Estancia vacía; falla si las medidas no son números enteros positivos */
export function crearEstancia({ id, tipo, columnas, filas }: Pick<Estancia, 'id' | 'tipo'> & Medida): Estancia {
  if (![columnas, filas].every((n) => Number.isInteger(n) && n > 0)) {
    throw new Error(`La estancia «${id}» necesita filas y columnas enteras y positivas: ${filas} × ${columnas}`)
  }
  return { id, tipo, columnas, filas, puertas: [], elementos: [], estancias: [] }
}

const ids = (e: Estancia): string[] => [e.id, ...e.estancias.flatMap(ids)]

const dentro = ({ x, y }: Casilla, { columnas, filas }: Medida) => x >= 0 && y >= 0 && x < columnas && y < filas

/** Casilla de la estancia hija que corresponde a una de su madre */
const aHija = (hija: Estancia, { x, y }: Casilla): Casilla => ({ x: x - (hija.posicion?.x ?? 0), y: y - (hija.posicion?.y ?? 0) })

function solapan(a: Estancia, b: Estancia) {
  const [pa, pb] = [a.posicion ?? { x: 0, y: 0 }, b.posicion ?? { x: 0, y: 0 }]
  return pa.x < pb.x + b.columnas && pb.x < pa.x + a.columnas && pa.y < pb.y + b.filas && pb.y < pa.y + a.filas
}

/** Por qué la hija no puede ir en esa casilla de la madre, o nada si puede */
export function motivoParaNoAnidar(madre: Estancia, hija: Estancia, posicion: Casilla): string | undefined {
  const colocada = { ...hija, posicion }
  const ultima = { x: posicion.x + hija.columnas - 1, y: posicion.y + hija.filas - 1 }
  if (!dentro(posicion, madre) || !dentro(ultima, madre)) return `«${hija.id}» se sale de «${madre.id}»`
  const choque = madre.estancias.find((otra) => solapan(otra, colocada))
  if (choque) return `«${hija.id}» se solapa con «${choque.id}»`
  const repetido = ids(hija).find((id) => ids(madre).includes(id))
  if (repetido) return `Ya hay una estancia «${repetido}» en «${madre.id}»`
}

/** Mete la hija en la madre desde esa casilla; falla si se sale, se solapa con otra o repite un id */
export function anidar(madre: Estancia, hija: Estancia, posicion: Casilla): Estancia {
  const motivo = motivoParaNoAnidar(madre, hija, posicion)
  if (motivo) throw new Error(motivo)
  return { ...madre, estancias: [...madre.estancias, { ...hija, posicion }] }
}

/**
 * Estancia más interior que tiene esa casilla (de `raiz`), con la casilla
 * en sus coordenadas y la `ruta` desde la raíz hasta ella
 */
export function estanciaEn(
  raiz: Estancia,
  casilla: Casilla,
): { estancia: Estancia; casilla: Casilla; ruta: Estancia[] } | undefined {
  if (!dentro(casilla, raiz)) return
  const hija = raiz.estancias.find((e) => dentro(aHija(e, casilla), e))
  const interior = hija && estanciaEn(hija, aHija(hija, casilla))
  return interior ? { ...interior, ruta: [raiz, ...interior.ruta] } : { estancia: raiz, casilla, ruta: [raiz] }
}

/** Todas las estancias, madres antes que hijas, con su esquina en casillas de la raíz */
export function estanciasDe(raiz: Estancia, origen: Casilla = { x: 0, y: 0 }): { estancia: Estancia; origen: Casilla }[] {
  return [
    { estancia: raiz, origen },
    ...raiz.estancias.flatMap((e) => estanciasDe(e, { x: origen.x + (e.posicion?.x ?? 0), y: origen.y + (e.posicion?.y ?? 0) })),
  ]
}
