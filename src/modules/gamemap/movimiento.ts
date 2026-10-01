import { apuntarAccion } from './acciones'
import { conPersonaje, conPersonajeNoJugador, conTurno, numeroDeTurno, todosLosPersonajes, turnoDePersonaje } from './activaciones'
import { esEnemigo, jugadorDe } from './jugadores'
import { estanciaEn } from './estancias'
import { cruce } from './muros'
import { factorDeTerreno, terrenoEn } from './terrenos'
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

/**
 * Si dos casillas están en contacto para el cuerpo a cuerpo: pegadas en recto
 * o, con `cuerpoACuerpo: 'diagonal'`, también en diagonal
 */
export const enContacto = (a: Casilla, b: Casilla, cuerpoACuerpo: Configuracion['cuerpoACuerpo']) =>
  cuerpoACuerpo === 'diagonal' ? distancia(a, b) === 1 : junto(a, b)

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
 * una interior), no es terreno impasable y no la ocupa un objeto. Por encima
 * de otros personajes sí pasa
 */
export function transitable(m: Mapa, c: Casilla): boolean {
  const en = casillaDelMapa(m, c)
  return !!en && terrenoEn(en.estancia, en.casilla)?.tipo !== 'impasable' && !en.estancia.elementos.some((el) => cubre(el, en.casilla))
}

/** Personajes del mapa enemigos del personaje: los de alianzas hostiles hacia la suya */
export const enemigosDe = (m: Mapa, personaje: string): Personaje[] => {
  const alianza = jugadorDe(m, personaje)?.alianza
  return todosLosPersonajes(m).filter((p) => esEnemigo(m, p.id, alianza))
}

/** Casillas del mapa de los enemigos colocados del personaje: para alejarse de ellos o cargar */
export const casillasDeEnemigos = (m: Mapa, personaje: string): Casilla[] =>
  enemigosDe(m, personaje).flatMap((p) => {
    const suya = enElMapa(m, p)
    return suya ? [suya] : []
  })

/**
 * El mapa tal como lo ve un personaje al moverse: cada uno de sus enemigos
 * colocados es una casilla de terreno impasable y cada uno de los demás
 * personajes, una de terreno `terrenoPersonajes` (con `normal`, no cambia).
 * Solo para medir y trazar rutas: no se guarda
 */
export function conPersonajes(m: Mapa, personaje: string, terrenoPersonajes: Configuracion['terrenoPersonajes']): Mapa {
  const enemigos = new Set(enemigosDe(m, personaje).map((p) => p.id))
  const otros = todosLosPersonajes(m).flatMap((p) => {
    if (enemigos.has(p.id)) return [{ p, tipo: 'impasable' as const }]
    return terrenoPersonajes === 'normal' || p.id === personaje ? [] : [{ p, tipo: terrenoPersonajes }]
  })
  if (!otros.length) return m
  return {
    ...m,
    estancias: m.estancias.map((e) => {
      const suyos = otros.flatMap(({ p, tipo }) => (p.estancia === e.id && p.casilla ? [{ tipo, posicion: p.casilla, columnas: 1, filas: 1 }] : []))
      return suyos.length ? { ...e, terrenos: [...(e.terrenos ?? []), ...suyos] } : e
    }),
  }
}

/** Si una casilla del mapa está en la zona de control de alguno de los enemigos (sus casillas): a `distanciaControl` o menos, en recto o en diagonal */
/**
 * Casillas del mapa en la zona de control de un personaje en `origen`: a las
 * que se llega desde la suya en `distanciaControl` pasos o menos, en recto o
 * en diagonal, sin atravesar muros (`seComunican`); con la suya. El terreno,
 * los objetos y los personajes no la cortan
 */
export function casillasDeControl(m: Mapa, origen: Casilla, distanciaControl: number): Casilla[] {
  const clave = ({ x, y }: Casilla) => `${x},${y}`
  const vistas = new Set([clave(origen)])
  let borde = [origen]
  const zona = [origen]
  for (let paso = 0; paso < distanciaControl; paso++) {
    borde = borde.flatMap((c) =>
      [...PASOS, ...DIAGONALES].flatMap((d) => {
        const vecina = { x: c.x + d.x, y: c.y + d.y }
        if (vistas.has(clave(vecina)) || !seComunican(m, c, vecina)) return []
        vistas.add(clave(vecina))
        return [vecina]
      }),
    )
    zona.push(...borde)
  }
  return zona
}

/** Si una casilla del mapa está en la zona de control (`casillasDeControl`) de alguno de los enemigos (sus casillas) */
export function enZonaDeControl(m: Mapa, enemigos: Casilla[], distanciaControl: number): (c: Casilla) => boolean {
  if (distanciaControl <= 0) return () => false
  const zona = new Set(enemigos.flatMap((en) => casillasDeControl(m, en, distanciaControl)).map(({ x, y }) => `${x},${y}`))
  return ({ x, y }) => zona.has(`${x},${y}`)
}

/**
 * El mapa con la zona de control de los enemigos (sus casillas) como terreno
 * impasable: para buscar rutas que la rodeen. Solo para trazar: no se guarda
 */
export function conZonaDeControl(m: Mapa, enemigos: Casilla[], distanciaControl: number): Mapa {
  if (distanciaControl <= 0 || !enemigos.length) return m
  const zona = enemigos.flatMap((en) =>
    casillasDeControl(m, en, distanciaControl).flatMap((c) => {
      const suya = casillaDelMapa(m, c)
      return suya ? [suya] : []
    }),
  )
  return {
    ...m,
    estancias: m.estancias.map((e) => {
      const suyas = zona.flatMap(({ estancia, casilla }) => (estancia.id === e.id ? [{ tipo: 'impasable' as const, posicion: casilla, columnas: 1, filas: 1 }] : []))
      return suyas.length ? { ...e, terrenos: [...(e.terrenos ?? []), ...suyas] } : e
    }),
  }
}

/** Veces que cuesta entrar en la casilla del mapa lo que una normal: dos en terreno difícil y tres en muy difícil */
function factorEn(m: Mapa, c: Casilla) {
  const en = casillaDelMapa(m, c)
  return en ? factorDeTerreno(en.estancia, en.casilla) : 1
}

/**
 * Si dos casillas del mapa de al lado se comunican, sin mirar lo que hay en
 * ellas (terreno, objetos): dentro de una estancia, sin un muro interior en
 * medio (salvo por un paso o una puerta abierta); entre dos, por una puerta
 * abierta en esa arista. En diagonal, solo dentro de una estancia y sin
 * cortar esquinas: comunicadas por las dos casillas de los lados
 */
export function seComunican(m: Mapa, a: Casilla, b: Casilla): boolean {
  const [salida, llegada] = [casillaDelMapa(m, a), casillaDelMapa(m, b)]
  if (!salida || !llegada) return false
  if (enDiagonal(a, b)) {
    return salida.estancia.id === llegada.estancia.id && [{ x: b.x, y: a.y }, { x: a.x, y: b.y }].every((lado) => seComunican(m, a, lado) && seComunican(m, lado, b))
  }
  if (!junto(a, b)) return false
  if (salida.estancia.id === llegada.estancia.id) return cruce(salida.estancia, salida.casilla, llegada.casilla) === 'libre'
  const abierta = ({ estancia, casilla }: { estancia: Estancia; casilla: Casilla }, lado: Direccion) =>
    estancia.puertas.some((p) => p.abierta && p.lado === lado && igual(p.casilla)(casilla))
  return abierta(salida, ladoHacia(a, b)) || abierta(llegada, ladoHacia(b, a))
}

/**
 * Si un personaje puede pasar de una casilla del mapa a la de al lado: se
 * comunican (`seComunican`: sin muros en medio, entre estancias por puertas
 * abiertas) y se puede estar en la de llegada. En diagonal (si la medición lo
 * permite), también en las dos casillas de los lados: no se cortan esquinas
 */
export function sePuedePasar(m: Mapa, a: Casilla, b: Casilla, medicion: MedicionMovimiento = 'ortogonal'): boolean {
  if (!seComunican(m, a, b) || !transitable(m, b)) return false
  return !enDiagonal(a, b) || (medicion !== 'ortogonal' && [{ x: b.x, y: a.y }, { x: a.x, y: b.y }].every((lado) => transitable(m, lado)))
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
      const nuevo = (coste.get(clave(actual)) ?? 0) + (enDiagonal(actual, c) ? PESO_DIAGONAL[medicion] : 1) * factorEn(m, c)
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
 * Lo que se lleva movido al final de cada paso del recorrido (en casillas del
 * mapa), según la medición: un paso recto cuenta uno y uno en diagonal, uno o
 * √2, por dos si entra en terreno difícil o por tres si es muy difícil
 * (redondeando hacia arriba lo acumulado)
 */
export function costesDe(m: Mapa, recorrido: Casilla[], medicion: MedicionMovimiento = 'ortogonal'): number[] {
  let largo = 0
  return recorrido.slice(1).map((c, i) => {
    largo += (enDiagonal(recorrido[i], c) ? LARGO_DIAGONAL[medicion] : 1) * factorEn(m, c)
    // sin arrastrar el error de coma flotante: 2 × √2 no llega a 3
    return Math.ceil(largo - 1e-9)
  })
}

/** Lo que cuesta el recorrido entero según la medición y el terreno */
export const costeDe = (m: Mapa, recorrido: Casilla[], medicion: MedicionMovimiento = 'ortogonal') => costesDe(m, recorrido, medicion).at(-1) ?? 0

/** Tramo de la opción en que cae cada paso, según lo movido al final de cada uno; nada si no le llegan */
function tramosDe(opcion: OpcionMovimiento, costes: number[]): number[] | undefined {
  let hasta = 0
  const limites = opcion.tramos.map(({ distancia }) => (hasta += distancia))
  const tramos = costes.map((c) => limites.findIndex((limite) => c <= limite))
  return tramos.every((t) => t >= 0) ? tramos : undefined
}

/** Las reglas de la configuración que cuentan para planear un movimiento */
export type ReglasDeMovimiento = Pick<Configuracion, 'medicionMovimiento' | 'terrenoPersonajes' | 'distanciaControl' | 'cuerpoACuerpo'>

/** Motivo de `evaluarRecorrido` cuando el recorrido entra en la zona de control de un enemigo sin cargar */
const EN_ZONA_DE_CONTROL = 'El recorrido entra en la zona de control de un enemigo'

/** Motivo de `evaluarRecorrido` para destrabarse sin salir de la zona de control enemiga */
const SIN_SALIR_DE_LA_ZONA = 'Para destrabarse tiene que terminar fuera de la zona de control enemiga'

/**
 * Qué opción de movimiento permite el recorrido del personaje (en casillas del
 * mapa, de la suya a la de destino, paso a paso según la `medicion` y
 * cruzando solo puertas abiertas) y en qué tramo cae cada paso. No puede
 * terminar encima de un objeto ni de otro personaje. `enemigos`: sus casillas del
 * mapa, para su zona de control (a `distanciaControl` o menos de alguno) y
 * para terminar en contacto con ellos (`cuerpoACuerpo`: en recto o también
 * en diagonal):
 * quien empieza en ella está trabado. Un movimiento normal no puede empezar
 * en ella ni entrar; una carga tiene que empezar fuera y puede cruzarla;
 * destrabarse tiene que empezar en ella y terminar fuera; posicionarse tiene
 * que empezar en ella y terminar pegado a uno de los enemigos que lo traban
 */
export function evaluarRecorrido(
  m: Mapa,
  personaje: Personaje,
  recorrido: Casilla[],
  { base, variaciones }: OpcionesMovimiento,
  {
    medicion = 'ortogonal',
    enemigos = [],
    distanciaControl = 0,
    cuerpoACuerpo = 'diagonal',
  }: { medicion?: MedicionMovimiento; enemigos?: Casilla[]; distanciaControl?: number; cuerpoACuerpo?: Configuracion['cuerpoACuerpo'] } = {},
): RecorridoEvaluado {
  const [salida, ...pasos] = recorrido
  const destino = pasos.at(-1)
  const donde = enElMapa(m, personaje)
  if (!salida || !donde || !igual(salida)(donde)) return { motivo: `El recorrido tiene que empezar en ${personaje.nombre}` }
  if (!destino) return { motivo: `${personaje.nombre} no se ha movido` }
  if (pasos.some((c, i) => !sePuedePasar(m, recorrido[i], c, medicion))) return { motivo: 'El recorrido pasa por donde no se puede' }
  const otro = todosLosPersonajes(m).find((h) => {
    const suya = h.id !== personaje.id && enElMapa(m, h)
    return !!suya && igual(destino)(suya)
  })
  if (otro) return { motivo: `No se puede terminar encima de ${otro.nombre}` }

  const opciones = [base, ...variaciones]
  const enZona = enZonaDeControl(m, enemigos, distanciaControl)
  const [trabado, entraEnZona, terminaEnZona] = [enZona(salida), pasos.some(enZona), enZona(destino)]
  const loTraban = enemigos.filter((en) => enZonaDeControl(m, [en], distanciaControl)(salida))
  const segunZona: Record<OpcionMovimiento['tipo'], boolean> = {
    normal: !trabado && !entraEnZona,
    carga: !trabado,
    destrabarse: trabado && !terminaEnZona,
    posicionarse: trabado && loTraban.some((en) => enContacto(destino, en, cuerpoACuerpo)),
  }
  const terminaJunto = enemigos.some((en) => enContacto(destino, en, cuerpoACuerpo))
  const permite = (o: OpcionMovimiento) => segunZona[o.tipo] && (!o.terminarJuntoAEnemigo || terminaJunto)
  const costes = costesDe(m, recorrido, medicion)
  for (const opcion of opciones) {
    const tramos = tramosDe(opcion, costes)
    if (tramos && permite(opcion)) return { opcion, tramos }
  }
  const llega = (tipo: OpcionMovimiento['tipo']) => opciones.some((o) => o.tipo === tipo && tramosDe(o, costes))
  if (trabado && terminaJunto && llega('posicionarse')) return { motivo: 'Para posicionarse tiene que pegarse a un enemigo que lo traba' }
  if (trabado && terminaJunto && llega('carga')) return { motivo: `${personaje.nombre} está trabado en cuerpo a cuerpo: no puede cargar, solo posicionarse junto a quien lo traba` }
  if (trabado && terminaEnZona && llega('destrabarse')) return { motivo: SIN_SALIR_DE_LA_ZONA }
  if (trabado && llega('normal')) return { motivo: `${personaje.nombre} está trabado en cuerpo a cuerpo: para salir tiene que destrabarse` }
  if (entraEnZona && llega('normal')) return { motivo: EN_ZONA_DE_CONTROL }
  const maximo = alcance({ base, variaciones })
  const coste = costeDe(m, recorrido, medicion)
  if (coste > maximo) return { motivo: `Demasiado lejos: ${coste} casillas y como mucho ${maximo}` }
  return { motivo: 'Ninguna forma de moverse permite ese recorrido' }
}

/**
 * Cómo puede llegar el personaje desde su casilla a la de `destino` (del
 * mapa) con alguna de sus `opciones`, cada una por su mejor camino según las
 * reglas de `config`: las normales, rodeando la zona de control de sus
 * enemigos; las demás (cargar, destrabarse, posicionarse), por el más corto,
 * aunque la crucen. Vale la primera
 * que llega (la base y después las variaciones), con su recorrido. Si
 * ninguna, el motivo (que entra en la zona de control, si es lo que lo
 * impide) y el recorrido más corto que se ha intentado, para dibujarlo
 */
export function planearMovimiento(
  m: Mapa,
  { medicionMovimiento: medicion, terrenoPersonajes, distanciaControl, cuerpoACuerpo }: ReglasDeMovimiento,
  personaje: Personaje,
  destino: Casilla,
  opciones: OpcionesMovimiento,
): (Valido & { recorrido: Casilla[] }) | { motivo: string; recorrido?: Casilla[] } {
  const desde = enElMapa(m, personaje)
  if (!desde) return { motivo: `${personaje.nombre} no está colocado en el mapa` }
  const vista = conPersonajes(m, personaje.id, terrenoPersonajes)
  const enemigos = casillasDeEnemigos(m, personaje.id)
  const reglas = { medicion, enemigos, distanciaControl, cuerpoACuerpo }
  const directo = ruta(vista, desde, destino, medicion)
  const rodeando = ruta(conZonaDeControl(vista, enemigos, distanciaControl), desde, destino, medicion)
  for (const opcion of [opciones.base, ...opciones.variaciones]) {
    const recorrido = opcion.tipo === 'normal' ? rodeando : directo
    const evaluado = recorrido && evaluarRecorrido(vista, personaje, recorrido, { base: opcion, variaciones: [] }, reglas)
    if (recorrido && evaluado && 'opcion' in evaluado) return { recorrido, ...evaluado }
  }
  const motivoDe = (recorrido: Casilla[]) => {
    const evaluado = evaluarRecorrido(vista, personaje, recorrido, opciones, reglas)
    return 'motivo' in evaluado ? evaluado.motivo : 'Ninguna forma de moverse permite ese recorrido'
  }
  // trabado (solo puede salir o posicionarse, por el camino corto), o si por el camino corto lo que lo impide es la zona de control, es lo que importa
  const trabado = enZonaDeControl(vista, enemigos, distanciaControl)(desde)
  if (directo && (!rodeando || trabado || motivoDe(directo) === EN_ZONA_DE_CONTROL)) return { motivo: motivoDe(directo), recorrido: directo }
  return rodeando ? { motivo: motivoDe(rodeando), recorrido: rodeando } : { motivo: 'No se puede llegar ahí' }
}

type Valido = { opcion: OpcionMovimiento; tramos: number[] }

/** Acciones adicionales que consume el recorrido: las de los tramos que alargan el movimiento y se han usado (deslizar…) */
export const accionesAdicionales = ({ opcion, tramos }: Valido): Accion[] =>
  opcion.tramos.flatMap((t, i) => (t.accion && tramos.includes(i) ? [t.accion] : []))

/** Ids de las acciones que consume el movimiento: la de la opción y las adicionales */
export const accionesConsumidas = (valido: Valido): string[] => [valido.opcion.accion.id, ...accionesAdicionales(valido).map((a) => a.id)]

/**
 * Lleva al personaje (de una escuadra o no jugador) al final del recorrido ya
 * evaluado (en casillas del mapa: si es otra estancia, pasa a ella) y apunta
 * el movimiento en su turno: lo que cuesta según la medición y los demás
 * personajes de `config`, y las acciones que consume. Esas acciones no las
 * apunta en ninguna activación: eso depende de quién es (`mover`)
 */
export function desplazar(m: Mapa, config: Configuracion, personaje: Personaje, recorrido: Casilla[], valido: Valido): Mapa {
  const destino = casillaDelMapa(m, recorrido.at(-1) ?? { x: Number.NaN, y: Number.NaN })
  if (!destino) throw new Error(`El recorrido de ${personaje.nombre} no termina en ninguna estancia`)
  const hecho = {
    opcion: valido.opcion.id,
    casillas: costeDe(conPersonajes(m, personaje.id, config.terrenoPersonajes), recorrido, config.medicionMovimiento),
    acciones: accionesConsumidas(valido),
  }
  const movido = <P extends Personaje>(p: P): P => ({
    ...p,
    estancia: destino.estancia.id,
    casilla: destino.casilla,
    turnos: conTurno(p.turnos, { numero: numeroDeTurno(m), acciones: [], movimientos: [] }, (t) => ({ ...t, movimientos: [...t.movimientos, hecho] })),
  })
  return conPersonajeNoJugador(conPersonaje(m, personaje.id, movido), personaje.id, movido)
}

/**
 * Lleva al personaje de la escuadra al final del recorrido ya evaluado
 * (`desplazar`) y apunta las acciones que consume en el turno de su escuadra,
 * que empiezan su activación si no había empezado
 */
export const mover = (m: Mapa, config: Configuracion, escuadra: string, personaje: Personaje, recorrido: Casilla[], valido: Valido): Mapa =>
  accionesConsumidas(valido).reduce((a, accion) => apuntarAccion(a, config, escuadra, accion, personaje.id), desplazar(m, config, personaje, recorrido, valido))
