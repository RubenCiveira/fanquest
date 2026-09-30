import { estanciaEn } from './estancias'
import { terrenoEn } from './terrenos'
import type { Casilla } from './modelo/casilla'
import type { Elemento } from './modelo/elemento'
import type { Estancia } from './modelo/estancia'
import type { Medida } from './modelo/medida'

const casillasDe = ({ columnas, filas }: Medida, { x, y }: Casilla): Casilla[] =>
  Array.from({ length: columnas * filas }, (_, i) => ({ x: x + (i % columnas), y: y + Math.floor(i / columnas) }))

const misma = (a: Casilla) => (b: Casilla) => a.x === b.x && a.y === b.y

/**
 * Por qué el elemento no puede ir en esa casilla de la estancia, o nada si
 * puede: no se sale, no tapa una puerta, no cae en terreno impasable ni pisa
 * una estancia interior u otro elemento colocado
 */
export function motivoParaNoColocar(e: Estancia, elemento: Elemento, posicion: Casilla): string | undefined {
  const casillas = casillasDe(elemento, posicion)
  if (casillas.some((c) => estanciaEn(e, c) === undefined)) return `«${elemento.nombre}» se sale de «${e.id}»`
  const puerta = e.puertas.find((p) => casillas.some(misma(p.casilla)))
  if (puerta) return `«${elemento.nombre}» tapa la puerta «${puerta.id}»`
  if (casillas.some((c) => terrenoEn(e, c)?.tipo === 'impasable')) return `«${elemento.nombre}» cae en terreno impasable`
  const interior = casillas.map((c) => estanciaEn(e, c)?.estancia).find((de) => de && de.id !== e.id)
  if (interior) return `«${elemento.nombre}» pisa la estancia «${interior.id}»`
  const choque = e.elementos.find(
    (otro) => otro.id !== elemento.id && otro.posicion && casillasDe(otro, otro.posicion).some((c) => casillas.some(misma(c))),
  )
  if (choque) return `«${elemento.nombre}» choca con «${choque.nombre}»`
}

/** Casilla libre para el elemento, la más cercana al centro de la estancia; nada si no cabe en ninguna */
export function buscarSitio(e: Estancia, elemento: Elemento): Casilla | undefined {
  const posibles = casillasDe({ columnas: e.columnas - elemento.columnas + 1, filas: e.filas - elemento.filas + 1 }, { x: 0, y: 0 })
  const lejania = ({ x, y }: Casilla) => (2 * x + elemento.columnas - e.columnas) ** 2 + (2 * y + elemento.filas - e.filas) ** 2
  return posibles.filter((c) => !motivoParaNoColocar(e, elemento, c)).sort((a, b) => lejania(a) - lejania(b))[0]
}

/** Coloca o mueve el elemento; sin `posicion` vuelve a la zona de espera. Falla si no puede ir ahí */
export function colocarElemento(e: Estancia, id: string, posicion?: Casilla): Estancia {
  const elemento = e.elementos.find((el) => el.id === id)
  if (!elemento) throw new Error(`No hay ningún elemento «${id}» en «${e.id}»`)
  const motivo = posicion && motivoParaNoColocar(e, elemento, posicion)
  if (motivo) throw new Error(motivo)
  return { ...e, elementos: e.elementos.map((el) => (el.id === id ? { ...el, posicion } : el)) }
}

/** Añade los elementos a la estancia, cada uno en el sitio libre más cercano al centro o, si no cabe, en la zona de espera */
export const situar = (e: Estancia, elementos: Elemento[]): Estancia =>
  elementos.reduce((hecha, elemento) => {
    const posicion = buscarSitio(hecha, elemento)
    return { ...hecha, elementos: [...hecha.elementos, posicion ? { ...elemento, posicion } : elemento] }
  }, e)
