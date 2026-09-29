import { ejecutarAccion } from './acciones'
import { estanciaEn } from './estancias'
import type { Accion } from './modelo/accion'
import type { Casilla } from './modelo/casilla'
import type { Configuracion } from './modelo/configuracion'
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

/**
 * Si la ficha puede pasar por la casilla: es de la propia estancia (no de
 * una interior) y no la ocupa un objeto. Por encima de otros héroes sí pasa
 */
export const transitable = (e: Estancia, ficha: FichaHeroe, c: Casilla) =>
  estanciaEn(e, c)?.estancia.id === e.id && !e.elementos.some((el) => el.id !== ficha.id && el.tipo === 'objeto' && cubre(el, c))

/** Camino más corto (sin la casilla de salida) por casillas transitables que no estén en `evitar`; nada si no lo hay */
function camino(e: Estancia, ficha: FichaHeroe, desde: Casilla, hasta: Casilla, evitar: Casilla[]): Casilla[] | undefined {
  const vistas = new Set([...evitar, desde].map(({ x, y }) => `${x},${y}`))
  let frente: Casilla[][] = [[]]
  while (frente.length) {
    const siguiente: Casilla[][] = []
    for (const tramo of frente) {
      const ultima = tramo.at(-1) ?? desde
      for (const paso of PASOS) {
        const c = { x: ultima.x + paso.x, y: ultima.y + paso.y }
        if (vistas.has(`${c.x},${c.y}`) || !transitable(e, ficha, c)) continue
        if (igual(c)(hasta)) return [...tramo, c]
        vistas.add(`${c.x},${c.y}`)
        siguiente.push([...tramo, c])
      }
    }
    frente = siguiente
  }
}

/**
 * El recorrido al arrastrar la ficha hasta una casilla: si ya está en él, se
 * recorta hasta ella (se ha vuelto atrás); si no, se alarga hasta ella por el
 * camino más corto sin repetir casillas. Si no se puede llegar, no cambia
 */
export function extenderRecorrido(e: Estancia, ficha: FichaHeroe, recorrido: Casilla[], c: Casilla): Casilla[] {
  const i = recorrido.findIndex(igual(c))
  if (i >= 0) return recorrido.slice(0, i + 1)
  const ultima = recorrido.at(-1)
  const tramo = ultima && camino(e, ficha, ultima, c, recorrido)
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
 * Qué opción de movimiento permite el recorrido (de la casilla de la ficha a
 * la de destino, paso a paso en ortogonal) y en qué tramo cae cada paso.
 * `enemigos`: sus casillas, para las opciones que se alejan de ellos o cargan
 */
export function evaluarRecorrido(
  e: Estancia,
  ficha: FichaHeroe,
  recorrido: Casilla[],
  { base, variaciones }: OpcionesMovimiento,
  enemigos: Casilla[] = [],
): RecorridoEvaluado {
  const [salida, ...pasos] = recorrido
  const destino = pasos.at(-1)
  if (!salida || !ficha.posicion || !igual(salida)(ficha.posicion)) return { motivo: `El recorrido tiene que empezar en ${ficha.nombre}` }
  if (!destino) return { motivo: `${ficha.nombre} no se ha movido` }
  if (pasos.some((c, i) => !junto(recorrido[i], c) || !transitable(e, ficha, c))) return { motivo: 'El recorrido pasa por donde no se puede' }
  const encima = e.elementos.find((el) => el.id !== ficha.id && cubre(el, destino))
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
 * Lleva la ficha del héroe (de una estancia del mapa) al final del recorrido
 * ya evaluado y apunta en su escuadra el movimiento y las acciones que
 * consume, que empiezan su activación si no había empezado
 */
export function mover(m: Mapa, config: Configuracion, heroe: FichaHeroe, recorrido: Casilla[], valido: Valido): Mapa {
  const destino = recorrido.at(-1)
  const movido: Mapa = {
    ...m,
    estancias: m.estancias.map((e) => ({ ...e, elementos: e.elementos.map((el) => (el.id === heroe.id ? { ...el, posicion: destino } : el)) })),
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
