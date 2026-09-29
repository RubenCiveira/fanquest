import { secciones, type Partida, type Zona } from './partida'
import { cabe, colocar, fijarRejilla, quitar, rejillaDe, type Pieza, type Rejilla } from './rejilla'

/**
 * Con la regla «Usar mapa», las zonas exploradas forman una mazmorra: cada
 * una guarda su rejilla con su sitio (`origen`) en el mapa y las nuevas se
 * pegan a la puerta por la que se entró. Las piezas se guardan en la rejilla
 * de su zona; en el mapa, sus casillas son `origen` + las de la zona.
 */

export type Punto = { x: number; y: number }

export type Pared = 'izquierda' | 'derecha' | 'arriba' | 'abajo'

/** Puerta (en casillas del mapa) de la zona `zona` por la que se entró en otra: esta se pega a ella */
export type Anclaje = { zona: number; puerta: Punto; pared: Pared }

/** Una zona con sitio en el mapa */
export type Sala = { zona: number; rejilla: Rejilla; origen: Punto }

type Medida = { columnas: number; filas: number }

type Rectangulo = { x0: number; y0: number; x1: number; y1: number }

const rectangulo = (origen: Punto, { columnas, filas }: Medida): Rectangulo => ({
  x0: origen.x,
  y0: origen.y,
  x1: origen.x + columnas,
  y1: origen.y + filas,
})

const solapan = (a: Rectangulo, b: Rectangulo) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1

const dentro = (s: Sala, x: number, y: number) =>
  x >= s.origen.x && y >= s.origen.y && x < s.origen.x + s.rejilla.columnas && y < s.origen.y + s.rejilla.filas

export const salaEn = (salas: Sala[], x: number, y: number) => salas.find((s) => dentro(s, x, y))

export const aLocal = (s: Sala, p: Pieza): Pieza => ({ ...p, x: p.x - s.origen.x, y: p.y - s.origen.y })

export const aGlobal = (s: Sala, p: Pieza): Pieza => ({ ...p, x: p.x + s.origen.x, y: p.y + s.origen.y })

/** Rectángulo que abarca todas las salas, en casillas del mapa */
export function limites(salas: Sala[]): Punto & Medida {
  if (!salas.length) return { x: 0, y: 0, columnas: 1, filas: 1 }
  const r = salas.map((s) => rectangulo(s.origen, s.rejilla))
  const x = Math.min(...r.map((q) => q.x0))
  const y = Math.min(...r.map((q) => q.y0))
  return { x, y, columnas: Math.max(...r.map((q) => q.x1)) - x, filas: Math.max(...r.map((q) => q.y1)) - y }
}

/** Casilla al otro lado de la pared */
const PASO: Record<Pared, Punto> = { izquierda: { x: -1, y: 0 }, derecha: { x: 1, y: 0 }, arriba: { x: 0, y: -1 }, abajo: { x: 0, y: 1 } }

/**
 * Sitio de una sala nueva pegada a la puerta por la que se entró y su casilla
 * de entrada (en la sala): la puerta, centrada en su muro; si choca con otra
 * sala, se desplaza a lo largo de la pared, con la puerta siempre dentro
 */
export function pegar(salas: Sala[], { puerta, pared }: Anclaje, { columnas, filas }: Medida): { origen: Punto; entrada: Punto } {
  const junto = { x: puerta.x + PASO[pared].x, y: puerta.y + PASO[pared].y }
  const horizontal = pared === 'izquierda' || pared === 'derecha'
  const largo = horizontal ? filas : columnas
  const centro = Math.floor((largo - 1) / 2)
  const sitio = (i: number) => {
    const entrada = horizontal
      ? { x: pared === 'derecha' ? 0 : columnas - 1, y: i }
      : { x: i, y: pared === 'abajo' ? 0 : filas - 1 }
    return { origen: { x: junto.x - entrada.x, y: junto.y - entrada.y }, entrada }
  }
  const orden = Array.from({ length: largo }, (_, i) => i).sort((a, b) => Math.abs(a - centro) - Math.abs(b - centro) || a - b)
  const libre = orden
    .map(sitio)
    .find((c) => !salas.some((s) => solapan(rectangulo(c.origen, { columnas, filas }), rectangulo(s.origen, s.rejilla))))
  return libre ?? sitio(centro)
}

/** Sin puerta a la que pegarse: a la derecha de lo explorado, con una casilla de separación */
export function aparte(salas: Sala[]): Punto {
  if (!salas.length) return { x: 0, y: 0 }
  const { x, y, columnas } = limites(salas)
  return { x: x + columnas + 1, y }
}

/** Zonas exploradas (la actual incluida) con sitio en el mapa */
export const salas = (p: Partida): Sala[] =>
  secciones(p).flatMap((z) => (z.rejilla?.origen ? [{ zona: z.id, rejilla: z.rejilla, origen: z.rejilla.origen }] : []))

/** Cambia una zona, sea la actual o una ya explorada */
export function conZona(p: Partida, id: number, cambio: (z: Zona) => Zona): Partida {
  if (p.zona.id === id) return { ...p, zona: cambio(p.zona) }
  return { ...p, exploradas: (p.exploradas ?? []).map((z) => (z.id === id ? cambio(z) : z)) }
}

const conRejillaDe = (p: Partida, id: number, cambio: (r: Rejilla) => Rejilla) =>
  conZona(p, id, (z) => ({ ...z, rejilla: cambio(rejillaDe(z)) }))

/**
 * Da sitio en el mapa a la zona actual: pegada a la puerta por la que se
 * entró, con su entrada colocada (y la zona de la que se viene ya con su
 * tamaño fijo), o aparte. `repegar` la vuelve a pegar tras cambiar su tamaño
 */
export function situar(p: Partida, repegar = false): Partida {
  const conRejilla = fijarRejilla(p)
  const r = rejillaDe(conRejilla.zona)
  const { anclaje } = conRejilla.zona
  if (r.origen && !(repegar && anclaje)) return conRejilla
  const otras = salas(conRejilla).filter((s) => s.zona !== conRejilla.zona.id)
  if (!anclaje) return conRejillaDe(conRejilla, conRejilla.zona.id, (q) => ({ ...q, origen: aparte(otras) }))
  const { origen, entrada } = pegar(otras, anclaje, r)
  const pegada = conRejillaDe(conRejilla, conRejilla.zona.id, (q) => ({
    ...q,
    origen,
    piezas: [...q.piezas.filter((pz) => pz.id !== 'entrada'), { id: 'entrada', tipo: 'puerta', x: entrada.x, y: entrada.y }],
  }))
  return conRejillaDe(pegada, anclaje.zona, (q) => ({ ...q, fija: true }))
}

/**
 * Sala en la que cabe la pieza (en casillas del mapa): dentro de una sala
 * (la suya, si es atrezo o puerta: `propia`), sin salirse ni chocar
 */
export function cabeEnMapa(todas: Sala[], pieza: Pieza, propia?: number): Sala | undefined {
  const s = salaEn(todas, pieza.x, pieza.y)
  if (!s || (propia !== undefined && s.zona !== propia)) return
  return cabe(s.rejilla, aLocal(s, pieza)) ? s : undefined
}

/** Saca la pieza del mapa: de su sala (`propia`) o, si es una ficha, de la que esté */
export function quitarDelMapa(p: Partida, id: string, propia?: number): Partida {
  return salas(p)
    .filter((s) => (propia === undefined || s.zona === propia) && s.rejilla.piezas.some((pz) => pz.id === id))
    .reduce((a, s) => conRejillaDe(a, s.zona, (r) => quitar(r, id)), p)
}

/**
 * Coloca o mueve una pieza (en casillas del mapa). Héroes y monstruos pueden
 * cambiar de sala y salen de la anterior; el atrezo y las puertas se quedan en
 * la suya (`propia`). Si no cabe, nada cambia
 */
export function moverEnMapa(p: Partida, pieza: Pieza, propia?: number): Partida {
  const destino = cabeEnMapa(salas(p), pieza, propia)
  if (!destino) return p
  const fuera = propia === undefined ? quitarDelMapa(p, pieza.id) : p
  return conRejillaDe(fuera, destino.zona, (r) => colocar(r, aLocal(destino, pieza)))
}

/** Las miniaturas de quien muere (monstruo eliminado o héroe a 0 PC) se retiran y dejan libre su casilla */
export function retirarCaidos(p: Partida): Partida {
  const enJuego = new Set((p.monstruos ?? []).map((m) => m.id))
  const caida = (pz: Pieza) => (pz.tipo === 'monstruo' && !enJuego.has(pz.id)) || (pz.tipo === 'miembro' && p.vidas?.[pz.id] === 0)
  return salas(p)
    .filter((s) => s.rejilla.piezas.some(caida))
    .reduce((a, s) => conRejillaDe(a, s.zona, (r) => ({ ...r, piezas: r.piezas.filter((pz) => !caida(pz)) })), p)
}
