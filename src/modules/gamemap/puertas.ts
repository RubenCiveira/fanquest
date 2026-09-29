import type { Casilla } from './modelo/casilla'
import { OPUESTA, type Direccion } from './modelo/direccion'
import type { Estancia } from './modelo/estancia'
import type { Mapa } from './modelo/mapa'
import type { Medida } from './modelo/medida'
import type { Puerta } from './modelo/puerta'
import type { Ubicacion } from './modelo/ubicacion'
import { casillaDelMuro, largoMuro } from './orientacion'

const igual = (a: Casilla, b: Casilla) => a.x === b.x && a.y === b.y

/** Puerta de esa casilla de una estancia del mapa (no interior), si la hay */
export const puertaEn = (m: Mapa, { estancia, casilla }: Ubicacion): Puerta | undefined =>
  m.estancias.find((e) => e.id === estancia)?.puertas.find((p) => igual(p.casilla, casilla))

/** Marca abierta la puerta de esa casilla, hacia la estancia `destino` */
export const marcarAbierta = (m: Mapa, { estancia, casilla }: Ubicacion, destino: string): Mapa => ({
  ...m,
  estancias: m.estancias.map((e) =>
    e.id === estancia ? { ...e, puertas: e.puertas.map((p) => (igual(p.casilla, casilla) ? { ...p, abierta: true, destino } : p)) } : e,
  ),
})

const PASO: Record<Direccion, Casilla> = { arriba: { x: 0, y: -1 }, abajo: { x: 0, y: 1 }, izquierda: { x: -1, y: 0 }, derecha: { x: 1, y: 0 } }

const origenDe = (e: Estancia): Casilla => e.posicion ?? { x: 0, y: 0 }

const solapan = (a: Casilla, ma: Medida, b: Casilla, mb: Medida) =>
  a.x < b.x + mb.columnas && b.x < a.x + ma.columnas && a.y < b.y + mb.filas && b.y < a.y + ma.filas

/**
 * Coloca la estancia nueva en el mapa pegada a la puerta `desde`: su entrada
 * comparte arista con esa puerta y queda abierta hacia la estancia de la que
 * se viene. La entrada va en medio de su muro o, si así choca con otra
 * estancia, se desliza a lo largo del muro (sin separarse de la puerta) hasta
 * un sitio libre. La estancia nueva tiene que tener la entrada en el muro
 * contrario al de la puerta (orientada hacia donde se cruza)
 */
export function pegar(m: Mapa, desde: Ubicacion, nueva: Estancia): Estancia {
  const madre = m.estancias.find((e) => e.id === desde.estancia)
  const puerta = puertaEn(m, desde)
  if (!madre || !puerta) throw new Error(`No hay ninguna puerta en la casilla ${desde.casilla.x},${desde.casilla.y} de «${desde.estancia}»`)
  const { x, y } = origenDe(madre)
  const fuera = { x: x + puerta.casilla.x + PASO[puerta.lado].x, y: y + puerta.casilla.y + PASO[puerta.lado].y }
  const muro = OPUESTA[puerta.lado]
  const largo = largoMuro(nueva, muro)
  const centro = Math.floor(largo / 2)
  const sitio = (i: number) => {
    const entrada = casillaDelMuro(nueva, muro, i)
    return { entrada, posicion: { x: fuera.x - entrada.x, y: fuera.y - entrada.y } }
  }
  const orden = Array.from({ length: largo }, (_, i) => i).sort((a, b) => Math.abs(a - centro) - Math.abs(b - centro) || a - b)
  const libre = orden.map(sitio).find(({ posicion }) => !m.estancias.some((e) => solapan(posicion, nueva, origenDe(e), e)))
  const { entrada, posicion } = libre ?? sitio(centro)
  return {
    ...nueva,
    posicion,
    puertas: nueva.puertas.map((p) => (p.tipo === 'entrada' ? { ...p, casilla: entrada, lado: muro, abierta: true, destino: madre.id } : p)),
  }
}

/** Sitio para una estancia que no sale de ninguna puerta: a la derecha de todo lo que hay, con una casilla de separación */
export function aparte(m: Mapa): Casilla {
  if (!m.estancias.length) return { x: 0, y: 0 }
  const x = Math.max(...m.estancias.map((e) => origenDe(e).x + e.columnas))
  const y = Math.min(...m.estancias.map((e) => origenDe(e).y))
  return { x: x + 1, y }
}
