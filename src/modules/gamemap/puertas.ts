import type { Casilla } from './modelo/casilla'
import { OPUESTA, type Direccion } from './modelo/direccion'
import type { Estancia } from './modelo/estancia'
import type { Mapa } from './modelo/mapa'
import type { Medida } from './modelo/medida'
import type { Puerta } from './modelo/puerta'
import type { Ubicacion } from './modelo/ubicacion'
import { alOtroLado } from './muros'
import { casillaDelMuro, largoMuro } from './orientacion'

const igual = (a: Casilla, b: Casilla) => a.x === b.x && a.y === b.y

/**
 * Puerta de esa casilla de una estancia del mapa (no interior), si la hay: la
 * de su muro exterior en esa casilla o una de sus muros interiores a uno de
 * sus lados (se llega por cualquiera de los dos)
 */
export const puertaEn = (m: Mapa, { estancia, casilla }: Ubicacion): Puerta | undefined =>
  m.estancias
    .find((e) => e.id === estancia)
    ?.puertas.find((p) => igual(p.casilla, casilla) || (p.tipo === 'interior' && igual(alOtroLado(p), casilla)))

/** Marca abierta la puerta de esa casilla (`puertaEn`), hacia la estancia `destino` */
export function marcarAbierta(m: Mapa, ubicacion: Ubicacion, destino: string): Mapa {
  const puerta = puertaEn(m, ubicacion)
  return {
    ...m,
    estancias: m.estancias.map((e) =>
      e.id === ubicacion.estancia ? { ...e, puertas: e.puertas.map((p) => (p.id === puerta?.id ? { ...p, abierta: true, destino } : p)) } : e,
    ),
  }
}

const PASO: Record<Direccion, Casilla> = { arriba: { x: 0, y: -1 }, abajo: { x: 0, y: 1 }, izquierda: { x: -1, y: 0 }, derecha: { x: 1, y: 0 } }

const origenDe = (e: Estancia): Casilla => e.posicion ?? { x: 0, y: 0 }

const dentro = ({ x, y }: Casilla, e: Estancia) => {
  const o = origenDe(e)
  return x >= o.x && y >= o.y && x < o.x + e.columnas && y < o.y + e.filas
}

const global = (e: Estancia, c: Casilla): Casilla => ({ x: origenDe(e).x + c.x, y: origenDe(e).y + c.y })

/** Estancia ya explorada que hay justo al otro lado de esa puerta, si existe */
export function estanciaAlOtroLado(m: Mapa, ubicacion: Ubicacion): Estancia | undefined {
  const estancia = m.estancias.find((e) => e.id === ubicacion.estancia)
  const puerta = puertaEn(m, ubicacion)
  if (!estancia || !puerta || puerta.tipo === 'interior') return
  const fuera = global(estancia, { x: puerta.casilla.x + PASO[puerta.lado].x, y: puerta.casilla.y + PASO[puerta.lado].y })
  return m.estancias.find((e) => e.id !== estancia.id && dentro(fuera, e))
}

/** Añade una puerta cerrada en un muro exterior de una estancia ya construida */
export function anadirPuerta(m: Mapa, estanciaId: string, casilla: Casilla, lado: Direccion): Mapa {
  const estancia = m.estancias.find((e) => e.id === estanciaId)
  if (!estancia) throw new Error(`No hay ninguna estancia «${estanciaId}» en el mapa`)
  const i = lado === 'arriba' || lado === 'abajo' ? casilla.x : casilla.y
  const enMuro = Number.isInteger(i) && i >= 0 && i < largoMuro(estancia, lado) && casillaDelMuro(estancia, lado, i)
  if (!enMuro || enMuro.x !== casilla.x || enMuro.y !== casilla.y) throw new Error(`La casilla ${casilla.x},${casilla.y} no está en el muro de ${lado} de «${estanciaId}»`)
  if (estancia.puertas.some((p) => p.casilla.x === casilla.x && p.casilla.y === casilla.y && p.lado === lado)) throw new Error(`Ya hay una puerta en la casilla ${casilla.x},${casilla.y} de «${estanciaId}»`)
  const puertas = [...estancia.puertas, { id: `${estancia.id}-puerta-${estancia.puertas.length + 1}`, tipo: 'salida' as const, casilla, lado }]
  return { ...m, estancias: m.estancias.map((e) => (e.id === estancia.id ? { ...e, puertas } : e)) }
}

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
