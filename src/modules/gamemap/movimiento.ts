import { apuntarAccion } from './acciones'
import { conPersonaje, conTurno, personajesDelMapa, numeroDeTurno, turnoDePersonaje } from './activaciones'
import { estanciaEn } from './estancias'
import type { Accion } from './modelo/accion'
import type { Casilla } from './modelo/casilla'
import type { Configuracion } from './modelo/configuracion'
import type { Direccion } from './modelo/direccion'
import type { Elemento } from './modelo/elemento'
import type { Estancia } from './modelo/estancia'
import type { Personaje } from './modelo/personaje'
import type { Mapa } from './modelo/mapa'
import type { MovimientoGastado } from './modelo/movimientoGastado'
import type { OpcionMovimiento, OpcionesMovimiento } from './modelo/opcionesMovimiento'

/**
 * Recorrido que se puede hacer con una de las opciones: `opcion`, la primera
 * que lo permite, y `tramos`, el tramo de la opción en que cae cada paso (sin
 * contar la casilla de salida). Si ninguna lo permite, el motivo
 */
export type RecorridoEvaluado = { opcion: OpcionMovimiento; tramos: number[] } | { motivo: string }

const PASOS: Casilla[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
]

const DIAGONALES: Casilla[] = [
  { x: 1, y: 1 },
  { x: 1, y: -1 },
  { x: -1, y: 1 },
  { x: -1, y: -1 },
]

/** Cómo se miden los movimientos (`Configuracion.medicionMovimiento`) */
export type MedicionMovimiento = Configuracion['medicionMovimiento']

/** Pasos posibles desde una casilla: sin diagonales o con ellas */
const pasosDe = (medicion: MedicionMovimiento) => (medicion === 'ortogonal' ? PASOS : [...PASOS, ...DIAGONALES])

/** Largo de un paso en diagonal: cuenta como uno, o √2 midiendo por Pitágoras */
const LARGO_DIAGONAL: Record<MedicionMovimiento, number> = { ortogonal: 1, diagonal: 1, euclidea: Math.SQRT2 }

const igual = (a: Casilla) => (b: Casilla) => a.x === b.x && a.y === b.y

const junto = (a: Casilla, b: Casilla) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1

const enDiagonal = (a: Casilla, b: Casilla) => Math.abs(a.x - b.x) === 1 && Math.abs(a.y - b.y) === 1

/** Distancia contando las diagonales como un paso: 1 es estar junto, también en diagonal */
const distancia = (a: Casilla, b: Casilla) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))

const cubre = (el: Elemento, { x, y }: Casilla) =>
  !!el.posicion && x >= el.posicion.x && y >= el.posicion.y && x < el.posicion.x + el.columnas && y < el.posicion.y + el.filas

const origenDe = (e: Estancia): Casilla => e.posicion ?? { x: 0, y: 0 }

/** Lado por el que se sale de `a` para ir a la casilla de al lado `b` */
const ladoHacia = (a: Casilla, b: Casilla): Direccion => (b.x > a.x ? 'derecha' : b.x < a.x ? 'izquierda' : b.y > a.y ? 'abajo' : 'arriba')

/**
 * Estancia del mapa y casilla en ella de una casilla del mapa (en las
 * casillas comunes, donde cada estancia tiene su `posicion`); nada si no es de
 * ninguna o es de una estancia interior
 */
export function casillaDelMapa(m: Mapa, c: Casilla): { estancia: Estancia; casilla: Casilla } | undefined {
  for (const estancia of m.estancias) {
    const { x, y } = origenDe(estancia)
    const casilla = { x: c.x - x, y: c.y - y }
    if (estanciaEn(estancia, casilla)?.estancia.id === estancia.id) return { estancia, casilla }
  }
}

/** Casilla del mapa en que está el personaje; nada si está en una zona de espera */
export function enElMapa(m: Mapa, personaje: Personaje): Casilla | undefined {
  const estancia = m.estancias.find((e) => e.id === personaje.estancia)
  if (!estancia || !personaje.casilla) return
  return { x: origenDe(estancia).x + personaje.casilla.x, y: origenDe(estancia).y + personaje.casilla.y }
}

/**
 * Si un personaje puede estar en la casilla del mapa: es de una estancia (no de
 * una interior) y no la ocupa un objeto. Por encima de otros personajes sí pasa
 */
export function transitable(m: Mapa, c: Casilla): boolean {
  const en = casillaDelMapa(m, c)
  return !!en && !en.estancia.elementos.some((el) => cubre(el, en.casilla))
}

/**
 * Si un personaje puede pasar de una casilla del mapa a la de al lado: dentro de
 * la misma estancia o, entre dos, cruzando una puerta abierta en esa arista.
 * En diagonal (si la medición lo permite), solo dentro de una estancia y sin
 * cortar esquinas: tiene que poder pasarse por las dos casillas en ortogonal
 */
export function sePuedePasar(m: Mapa, a: Casilla, b: Casilla, medicion: MedicionMovimiento = 'ortogonal'): boolean {
  if (enDiagonal(a, b)) {
    const [salida, llegada] = [casillaDelMapa(m, a), casillaDelMapa(m, b)]
    if (medicion === 'ortogonal' || !salida || !llegada || salida.estancia.id !== llegada.estancia.id || !transitable(m, b)) return false
    return [{ x: b.x, y: a.y }, { x: a.x, y: b.y }].every((esquina) => sePuedePasar(m, a, esquina) && sePuedePasar(m, esquina, b))
  }
  const salida = casillaDelMapa(m, a)
  const llegada = casillaDelMapa(m, b)
  if (!junto(a, b) || !salida || !llegada || !transitable(m, b)) return false
  if (salida.estancia.id === llegada.estancia.id) return true
  const abierta = ({ estancia, casilla }: { estancia: Estancia; casilla: Casilla }, lado: Direccion) =>
    estancia.puertas.some((p) => p.abierta && p.lado === lado && igual(p.casilla)(casilla))
  return abierta(salida, ladoHacia(a, b)) || abierta(llegada, ladoHacia(b, a))
}

/** Lo que cuesta cada paso en diagonal al buscar la ruta: con diagonales que cuentan como uno, algo más, para preferir los rectos a igual coste */
const PESO_DIAGONAL: Record<MedicionMovimiento, number> = { ortogonal: Number.POSITIVE_INFINITY, diagonal: 1.001, euclidea: Math.SQRT2 }

/** Lo que falta como poco de `a` a `b` (la heurística de A*): sin obstáculos, en recto y en diagonal según la medición */
function falta(a: Casilla, b: Casilla, medicion: MedicionMovimiento) {
  const [dx, dy] = [Math.abs(a.x - b.x), Math.abs(a.y - b.y)]
  if (medicion === 'ortogonal') return dx + dy
  const diagonales = Math.min(dx, dy)
  return Math.max(dx, dy) - diagonales + diagonales * PESO_DIAGONAL[medicion]
}

/**
 * Ruta más corta (A*) de una casilla del mapa a otra, con los pasos que
 * permite la medición: sin atravesar objetos ni estancias interiores, sin
 * cortar esquinas en diagonal y cruzando de una estancia a otra solo por
 * puertas abiertas. Con las dos casillas, en orden; nada si no se puede llegar
 */
export function ruta(m: Mapa, desde: Casilla, hasta: Casilla, medicion: MedicionMovimiento = 'ortogonal'): Casilla[] | undefined {
  const clave = ({ x, y }: Casilla) => `${x},${y}`
  const coste = new Map([[clave(desde), 0]])
  const previa = new Map<string, Casilla>()
  const cerradas = new Set<string>()
  const abiertas = [desde]
  const prioridad = (c: Casilla) => (coste.get(clave(c)) ?? 0) + falta(c, hasta, medicion)
  while (abiertas.length) {
    abiertas.sort((a, b) => prioridad(a) - prioridad(b))
    const actual = abiertas.shift()
    if (!actual) break
    if (igual(actual)(hasta)) {
      const vuelta = [actual]
      for (let c = previa.get(clave(actual)); c; c = previa.get(clave(c))) vuelta.unshift(c)
      return vuelta
    }
    cerradas.add(clave(actual))
    for (const paso of pasosDe(medicion)) {
      const c = { x: actual.x + paso.x, y: actual.y + paso.y }
      if (cerradas.has(clave(c)) || !sePuedePasar(m, actual, c, medicion)) continue
      const nuevo = (coste.get(clave(actual)) ?? 0) + (enDiagonal(actual, c) ? PESO_DIAGONAL[medicion] : 1)
      if (nuevo < (coste.get(clave(c)) ?? Number.POSITIVE_INFINITY)) {
        if (!coste.has(clave(c))) abiertas.push(c)
        coste.set(clave(c), nuevo)
        previa.set(clave(c), actual)
      }
    }
  }
}

/** Lo que el personaje ya ha movido en el turno en curso: la suma de sus movimientos */
export function gastadoPor(m: Mapa, personaje: Personaje): MovimientoGastado {
  const { movimientos } = turnoDePersonaje(personaje, numeroDeTurno(m))
  return { casillas: movimientos.reduce((suma, mv) => suma + mv.casillas, 0), acciones: movimientos.flatMap((mv) => mv.acciones) }
}

/** Casillas que puede recorrer como mucho, con la opción que más llega */
export const alcance = ({ base, variaciones }: OpcionesMovimiento) =>
  Math.max(...[base, ...variaciones].map((o) => o.tramos.reduce((suma, t) => suma + t.distancia, 0)))

/**
 * Lo que se lleva movido al final de cada paso del recorrido, según la
 * medición: un paso recto cuenta uno y uno en diagonal, uno o √2 (redondeando
 * hacia arriba lo acumulado)
 */
export function costesDe(recorrido: Casilla[], medicion: MedicionMovimiento = 'ortogonal'): number[] {
  let largo = 0
  return recorrido.slice(1).map((c, i) => {
    largo += enDiagonal(recorrido[i], c) ? LARGO_DIAGONAL[medicion] : 1
    // sin arrastrar el error de coma flotante: 2 × √2 no llega a 3
    return Math.ceil(largo - 1e-9)
  })
}

/** Lo que cuesta el recorrido entero según la medición */
export const costeDe = (recorrido: Casilla[], medicion: MedicionMovimiento = 'ortogonal') => costesDe(recorrido, medicion).at(-1) ?? 0

/** Tramo de la opción en que cae cada paso, según lo movido al final de cada uno; nada si no le llegan */
function tramosDe(opcion: OpcionMovimiento, costes: number[]): number[] | undefined {
  let hasta = 0
  const limites = opcion.tramos.map(({ distancia }) => (hasta += distancia))
  const tramos = costes.map((c) => limites.findIndex((limite) => c <= limite))
  return tramos.every((t) => t >= 0) ? tramos : undefined
}

/**
 * Qué opción de movimiento permite el recorrido del personaje (en casillas del
 * mapa, de la suya a la de destino, paso a paso según la `medicion` y
 * cruzando solo puertas abiertas) y en qué tramo cae cada paso. No puede
 * terminar encima de un objeto ni de otro personaje. `enemigos`: sus casillas del
 * mapa, para las opciones que se alejan de ellos o cargan
 */
export function evaluarRecorrido(
  m: Mapa,
  personaje: Personaje,
  recorrido: Casilla[],
  { base, variaciones }: OpcionesMovimiento,
  { medicion = 'ortogonal', enemigos = [] }: { medicion?: MedicionMovimiento; enemigos?: Casilla[] } = {},
): RecorridoEvaluado {
  const [salida, ...pasos] = recorrido
  const destino = pasos.at(-1)
  const donde = enElMapa(m, personaje)
  if (!salida || !donde || !igual(salida)(donde)) return { motivo: `El recorrido tiene que empezar en ${personaje.nombre}` }
  if (!destino) return { motivo: `${personaje.nombre} no se ha movido` }
  if (pasos.some((c, i) => !sePuedePasar(m, recorrido[i], c, medicion))) return { motivo: 'El recorrido pasa por donde no se puede' }
  const otro = personajesDelMapa(m).find((h) => {
    const suya = h.id !== personaje.id && enElMapa(m, h)
    return !!suya && igual(destino)(suya)
  })
  if (otro) return { motivo: `No se puede terminar encima de ${otro.nombre}` }

  const opciones = [base, ...variaciones]
  const permite = (o: OpcionMovimiento) =>
    (!o.alejarseDeEnemigos || pasos.every((c) => enemigos.every((en) => distancia(c, en) > (o.alejarseDeEnemigos ?? 0)))) &&
    (!o.terminarJuntoAEnemigo || enemigos.some((en) => distancia(destino, en) === 1))
  const costes = costesDe(recorrido, medicion)
  for (const opcion of opciones) {
    const tramos = tramosDe(opcion, costes)
    if (tramos && permite(opcion)) return { opcion, tramos }
  }
  const maximo = alcance({ base, variaciones })
  const coste = costeDe(recorrido, medicion)
  if (coste > maximo) return { motivo: `Demasiado lejos: ${coste} casillas y como mucho ${maximo}` }
  return { motivo: 'Ninguna forma de moverse permite ese recorrido' }
}

type Valido = { opcion: OpcionMovimiento; tramos: number[] }

/** Acciones adicionales que consume el recorrido: las de los tramos que alargan el movimiento y se han usado (deslizar…) */
export const accionesAdicionales = ({ opcion, tramos }: Valido): Accion[] =>
  opcion.tramos.flatMap((t, i) => (t.accion && tramos.includes(i) ? [t.accion] : []))

/** Ids de las acciones que consume el movimiento: la de la opción y las adicionales */
export const accionesConsumidas = (valido: Valido): string[] => [valido.opcion.accion.id, ...accionesAdicionales(valido).map((a) => a.id)]

/**
 * Lleva al personaje de la escuadra al final del recorrido ya evaluado (en
 * casillas del mapa: si es otra estancia, pasa a ella), apunta el movimiento en
 * su turno (lo que cuesta según la medición de `config`) y las acciones que
 * consume en el de su escuadra, que empiezan su activación si no había empezado
 */
export function mover(m: Mapa, config: Configuracion, escuadra: string, personaje: Personaje, recorrido: Casilla[], valido: Valido): Mapa {
  const destino = casillaDelMapa(m, recorrido.at(-1) ?? { x: Number.NaN, y: Number.NaN })
  if (!destino) throw new Error(`El recorrido de ${personaje.nombre} no termina en ninguna estancia`)
  const acciones = accionesConsumidas(valido)
  const hecho = { opcion: valido.opcion.id, casillas: costeDe(recorrido, config.medicionMovimiento), acciones }
  const movido = conPersonaje(m, personaje.id, (h) => ({
    ...h,
    estancia: destino.estancia.id,
    casilla: destino.casilla,
    turnos: conTurno(h.turnos, { numero: numeroDeTurno(m), acciones: [], movimientos: [] }, (t) => ({ ...t, movimientos: [...t.movimientos, hecho] })),
  }))
  return acciones.reduce((a, accion) => apuntarAccion(a, config, escuadra, accion, personaje.id), movido)
}
