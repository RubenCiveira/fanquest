import type { Casilla } from './modelo/casilla'
import type { Direccion } from './modelo/direccion'
import type { Estancia } from './modelo/estancia'
import type { Medida } from './modelo/medida'
import type { Arista, Muro } from './modelo/muro'
import type { Puerta } from './modelo/puerta'
import type { TipoCobertura } from './modelo/terreno'

const PASO: Record<Direccion, Casilla> = { arriba: { x: 0, y: -1 }, abajo: { x: 0, y: 1 }, izquierda: { x: -1, y: 0 }, derecha: { x: 1, y: 0 } }

/** La casilla del otro lado de la arista */
export const alOtroLado = ({ casilla, lado }: Arista): Casilla => ({ x: casilla.x + PASO[lado].x, y: casilla.y + PASO[lado].y })

/** La misma arista, siempre con la casilla de la izquierda o de arriba: para compararlas */
function normal({ casilla, lado }: Arista): Arista {
  if (lado === 'izquierda') return { casilla: { x: casilla.x - 1, y: casilla.y }, lado: 'derecha' }
  if (lado === 'arriba') return { casilla: { x: casilla.x, y: casilla.y - 1 }, lado: 'abajo' }
  return { casilla, lado }
}

const misma = (a: Arista, b: Arista) => {
  const [na, nb] = [normal(a), normal(b)]
  return na.lado === nb.lado && na.casilla.x === nb.casilla.x && na.casilla.y === nb.casilla.y
}

/** Arista entre dos casillas de al lado (en recto); nada si no lo están */
export function aristaEntre(a: Casilla, b: Casilla): Arista | undefined {
  if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) !== 1) return
  return { casilla: a, lado: b.x > a.x ? 'derecha' : b.x < a.x ? 'izquierda' : b.y > a.y ? 'abajo' : 'arriba' }
}

/** Los tramos del muro, en orden de arriba abajo o de izquierda a derecha: cada uno, la arista que cruza. Ninguno si no es recto */
export function tramosDe({ desde, hasta }: Muro): Arista[] {
  if (desde.x === hasta.x) {
    const y = Math.min(desde.y, hasta.y)
    return Array.from({ length: Math.abs(hasta.y - desde.y) }, (_, i) => ({ casilla: { x: desde.x - 1, y: y + i }, lado: 'derecha' }))
  }
  if (desde.y === hasta.y) {
    const x = Math.min(desde.x, hasta.x)
    return Array.from({ length: Math.abs(hasta.x - desde.x) }, (_, i) => ({ casilla: { x: x + i, y: desde.y - 1 }, lado: 'abajo' }))
  }
  return []
}

/** Puerta de la estancia en esa arista (de su muro exterior o de uno de dentro), si la hay */
export const puertaEnArista = (e: Estancia, arista: Arista): Puerta | undefined => e.puertas.find((p) => misma(p, arista))

/** El tramo de muro interior de la estancia en esa arista, con su muro y si es un paso; nada si no hay muro ahí */
export function muroEnArista(e: Estancia, arista: Arista): { muro: Muro; paso: boolean } | undefined {
  for (const muro of e.muros ?? []) {
    const i = tramosDe(muro).findIndex((t) => misma(t, arista))
    if (i >= 0) return { muro, paso: !!muro.pasos?.includes(i) }
  }
}

/**
 * Cómo se cruza de una casilla de la estancia a la de al lado (en recto):
 * `libre` sin muro, por un paso o por una puerta abierta; por un `muro` o una
 * puerta interior `cerrada`, no se puede
 */
export function cruce(e: Estancia, a: Casilla, b: Casilla): 'libre' | 'muro' | 'cerrado' {
  const arista = aristaEntre(a, b)
  if (!arista) return 'libre'
  const puerta = puertaEnArista(e, arista)
  if (puerta?.tipo === 'interior') return puerta.abierta ? 'libre' : 'cerrado'
  const muro = muroEnArista(e, arista)
  return muro && !muro.paso ? 'muro' : 'libre'
}

/**
 * Cobertura que da el muro interior de esa arista a un disparo que la cruza:
 * el muro y una puerta cerrada, bloqueante; una puerta abierta, ligera; un
 * paso, la `cobertura` del muro (sin ella, ligera). Nada si no hay muro
 */
export function coberturaDeArista(e: Estancia, arista: Arista): TipoCobertura | undefined {
  const puerta = puertaEnArista(e, arista)
  if (puerta?.tipo === 'interior') return puerta.abierta ? 'ligera' : 'bloqueante'
  const muro = muroEnArista(e, arista)
  if (!muro) return
  return muro.paso ? (muro.muro.cobertura ?? 'ligera') : 'bloqueante'
}

/**
 * Por qué el muro no puede ir en una estancia de esas medidas, o nada si
 * puede: tiene que ser recto, de al menos un tramo, por dentro (no por el
 * muro exterior) y con sus pasos y puertas (`otros`) en tramos suyos
 */
export function motivoParaNoAnadirMuro({ columnas, filas }: Medida, muro: Pick<Muro, 'desde' | 'hasta' | 'pasos'>, otros: number[] = []): string | undefined {
  const { desde, hasta } = muro
  const tramos = tramosDe({ id: '', ...muro }).length
  if (!tramos) return `Un muro de ${desde.x},${desde.y} a ${hasta.x},${hasta.y} tiene que ir en recto y medir al menos una casilla`
  const dentro =
    desde.x === hasta.x
      ? desde.x > 0 && desde.x < columnas && Math.min(desde.y, hasta.y) >= 0 && Math.max(desde.y, hasta.y) <= filas
      : desde.y > 0 && desde.y < filas && Math.min(desde.x, hasta.x) >= 0 && Math.max(desde.x, hasta.x) <= columnas
  if (!dentro) return `Un muro de ${desde.x},${desde.y} a ${hasta.x},${hasta.y} tiene que ir por dentro de la estancia`
  if ([...(muro.pasos ?? []), ...otros].some((i) => !Number.isInteger(i) || i < 0 || i >= tramos)) return `Un muro de ${desde.x},${desde.y} a ${hasta.x},${hasta.y} solo tiene ${tramos} tramos`
}
