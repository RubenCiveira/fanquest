import { ejecutarAccion } from './acciones'
import { estanciaEn } from './estancias'
import type { Accion } from './modelo/accion'
import type { Casilla } from './modelo/casilla'
import type { Configuracion } from './modelo/configuracion'
import type { Direccion } from './modelo/direccion'
import type { Elemento, FichaHeroe } from './modelo/elemento'
import type { Estancia } from './modelo/estancia'
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

const igual = (a: Casilla) => (b: Casilla) => a.x === b.x && a.y === b.y

const junto = (a: Casilla, b: Casilla) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1

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

/** Casilla del mapa en que está el elemento (colocado) de una de sus estancias */
export function enElMapa(m: Mapa, id: string): Casilla | undefined {
  for (const estancia of m.estancias) {
    const posicion = estancia.elementos.find((el) => el.id === id)?.posicion
    if (posicion) return { x: origenDe(estancia).x + posicion.x, y: origenDe(estancia).y + posicion.y }
  }
}

/**
 * Si la ficha puede estar en la casilla del mapa: es de una estancia (no de
 * una interior) y no la ocupa un objeto. Por encima de otros héroes sí pasa
 */
export function transitable(m: Mapa, ficha: FichaHeroe, c: Casilla): boolean {
  const en = casillaDelMapa(m, c)
  return !!en && !en.estancia.elementos.some((el) => el.id !== ficha.id && el.tipo === 'objeto' && cubre(el, en.casilla))
}

/**
 * Si la ficha puede pasar de una casilla del mapa a la de al lado: dentro de
 * la misma estancia o, entre dos, cruzando una puerta abierta en esa arista
 */
export function sePuedePasar(m: Mapa, ficha: FichaHeroe, a: Casilla, b: Casilla): boolean {
  const salida = casillaDelMapa(m, a)
  const llegada = casillaDelMapa(m, b)
  if (!junto(a, b) || !salida || !llegada || !transitable(m, ficha, b)) return false
  if (salida.estancia.id === llegada.estancia.id) return true
  const abierta = ({ estancia, casilla }: { estancia: Estancia; casilla: Casilla }, lado: Direccion) =>
    estancia.puertas.some((p) => p.abierta && p.lado === lado && igual(p.casilla)(casilla))
  return abierta(salida, ladoHacia(a, b)) || abierta(llegada, ladoHacia(b, a))
}

/** Camino más corto (sin la casilla de salida) por donde se puede pasar, sin las casillas de `evitar`; nada si no lo hay */
function camino(m: Mapa, ficha: FichaHeroe, desde: Casilla, hasta: Casilla, evitar: Casilla[]): Casilla[] | undefined {
  const vistas = new Set([...evitar, desde].map(({ x, y }) => `${x},${y}`))
  let frente: Casilla[][] = [[]]
  while (frente.length) {
    const siguiente: Casilla[][] = []
    for (const tramo of frente) {
      const ultima = tramo.at(-1) ?? desde
      for (const paso of PASOS) {
        const c = { x: ultima.x + paso.x, y: ultima.y + paso.y }
        if (vistas.has(`${c.x},${c.y}`) || !sePuedePasar(m, ficha, ultima, c)) continue
        if (igual(c)(hasta)) return [...tramo, c]
        vistas.add(`${c.x},${c.y}`)
        siguiente.push([...tramo, c])
      }
    }
    frente = siguiente
  }
}

/**
 * El recorrido (en casillas del mapa) al arrastrar la ficha hasta una
 * casilla: si ya está en él, se recorta hasta ella (se ha vuelto atrás); si
 * no, se alarga hasta ella por el camino más corto sin repetir casillas,
 * cruzando puertas abiertas si hace falta. Si no se puede llegar, no cambia
 */
export function extenderRecorrido(m: Mapa, ficha: FichaHeroe, recorrido: Casilla[], c: Casilla): Casilla[] {
  const i = recorrido.findIndex(igual(c))
  if (i >= 0) return recorrido.slice(0, i + 1)
  const ultima = recorrido.at(-1)
  const tramo = ultima && camino(m, ficha, ultima, c, recorrido)
  return tramo ? [...recorrido, ...tramo] : recorrido
}

/** Lo que el héroe ya ha movido en el turno: la suma de sus movimientos */
export function gastadoPor(m: Mapa, heroe: FichaHeroe): MovimientoGastado {
  const suyos = (m.turno?.movimientos?.[heroe.escuadra] ?? []).filter((mv) => mv.heroe === heroe.id)
  return { casillas: suyos.reduce((suma, mv) => suma + mv.casillas, 0), acciones: suyos.flatMap((mv) => mv.acciones) }
}

/** Casillas que puede recorrer como mucho, con la opción que más llega */
export const alcance = ({ base, variaciones }: OpcionesMovimiento) =>
  Math.max(...[base, ...variaciones].map((o) => o.tramos.reduce((suma, t) => suma + t.distancia, 0)))

/** Tramo de la opción en que cae cada uno de los `pasos`; nada si no le llegan */
function tramosDe(opcion: OpcionMovimiento, pasos: number): number[] | undefined {
  const tramos = opcion.tramos.flatMap(({ distancia }, i) => Array<number>(distancia).fill(i))
  return pasos <= tramos.length ? tramos.slice(0, pasos) : undefined
}

/**
 * Qué opción de movimiento permite el recorrido (en casillas del mapa, de la
 * de la ficha a la de destino, paso a paso en ortogonal y cruzando solo
 * puertas abiertas) y en qué tramo cae cada paso. `enemigos`: sus casillas
 * del mapa, para las opciones que se alejan de ellos o cargan
 */
export function evaluarRecorrido(
  m: Mapa,
  ficha: FichaHeroe,
  recorrido: Casilla[],
  { base, variaciones }: OpcionesMovimiento,
  enemigos: Casilla[] = [],
): RecorridoEvaluado {
  const [salida, ...pasos] = recorrido
  const destino = pasos.at(-1)
  const donde = enElMapa(m, ficha.id)
  if (!salida || !donde || !igual(salida)(donde)) return { motivo: `El recorrido tiene que empezar en ${ficha.nombre}` }
  if (!destino) return { motivo: `${ficha.nombre} no se ha movido` }
  if (pasos.some((c, i) => !sePuedePasar(m, ficha, recorrido[i], c))) return { motivo: 'El recorrido pasa por donde no se puede' }
  const final = casillaDelMapa(m, destino)
  const encima = final?.estancia.elementos.find((el) => el.id !== ficha.id && cubre(el, final.casilla))
  if (encima) return { motivo: `No se puede terminar encima de ${encima.nombre}` }

  const opciones = [base, ...variaciones]
  const permite = (o: OpcionMovimiento) =>
    (!o.alejarseDeEnemigos || pasos.every((c) => enemigos.every((en) => distancia(c, en) > (o.alejarseDeEnemigos ?? 0)))) &&
    (!o.terminarJuntoAEnemigo || enemigos.some((en) => distancia(destino, en) === 1))
  for (const opcion of opciones) {
    const tramos = tramosDe(opcion, pasos.length)
    if (tramos && permite(opcion)) return { opcion, tramos }
  }
  const maximo = alcance({ base, variaciones })
  if (pasos.length > maximo) return { motivo: `Demasiado lejos: ${pasos.length} casillas y como mucho ${maximo}` }
  return { motivo: 'Ninguna forma de moverse permite ese recorrido' }
}

type Valido = { opcion: OpcionMovimiento; tramos: number[] }

/** Acciones adicionales que consume el recorrido: las de los tramos que alargan el movimiento y se han usado (deslizar…) */
export const accionesAdicionales = ({ opcion, tramos }: Valido): Accion[] =>
  opcion.tramos.flatMap((t, i) => (t.accion && tramos.includes(i) ? [t.accion] : []))

/** Ids de las acciones que consume el movimiento: la de la opción y las adicionales */
export const accionesConsumidas = (valido: Valido): string[] => [valido.opcion.accion.id, ...accionesAdicionales(valido).map((a) => a.id)]

/**
 * Lleva la ficha del héroe al final del recorrido ya evaluado (en casillas del
 * mapa: si es otra estancia, pasa a ella) y apunta en su escuadra el
 * movimiento y las acciones que consume, que empiezan su activación si no
 * había empezado
 */
export function mover(m: Mapa, config: Configuracion, heroe: FichaHeroe, recorrido: Casilla[], valido: Valido): Mapa {
  const destino = casillaDelMapa(m, recorrido.at(-1) ?? { x: Number.NaN, y: Number.NaN })
  if (!destino) throw new Error(`El recorrido de ${heroe.nombre} no termina en ninguna estancia`)
  const movido: Mapa = {
    ...m,
    estancias: m.estancias.map((e) => {
      const sin = e.elementos.filter((el) => el.id !== heroe.id)
      return { ...e, elementos: e.id === destino.estancia.id ? [...sin, { ...heroe, posicion: destino.casilla }] : sin }
    }),
  }
  const acciones = accionesConsumidas(valido)
  const conAcciones = acciones.reduce((a, accion) => ejecutarAccion(a, config, heroe.escuadra, accion, heroe.id), movido)
  const turno = conAcciones.turno ?? { numero: 1, activaciones: {} }
  const hecho = { heroe: heroe.id, opcion: valido.opcion.id, casillas: recorrido.length - 1, acciones }
  return {
    ...conAcciones,
    turno: { ...turno, movimientos: { ...turno.movimientos, [heroe.escuadra]: [...(turno.movimientos?.[heroe.escuadra] ?? []), hecho] } },
  }
}
