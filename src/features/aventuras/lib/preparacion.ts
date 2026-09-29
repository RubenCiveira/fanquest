import { barajar } from '../../../lib/dados'
import type { EfectoEspecial, Mision } from '../../generar/lib/tipos'
import {
  CARTAS_CON_OBJETIVO,
  categorias,
  MAZOS_POR_MODO,
  type Categoria,
  type Modo,
} from '../config/mazos'
import type { CartaMazo, IdMazo, Mazo, Mazos } from '../../../lib/mazos'
import type { Heroe, Sexo } from '../../../lib/personajes'
import { hechizosInicialesHeroe } from './hechizos'
import type { SeleccionMonstruos } from './monstruos'

/** Carta apartada por una regla especial y la que ocupa su lugar */
export type Reemplazo = { original: string; reemplazo: string }

/** Cartas sobre la mesa para un mazo (ids de carta, repetidos por copia) */
export type SeleccionMazo = { cartas: string[]; reemplazos: Reemplazo[] }

/** Pasos del asistente de preparación, en orden */
export const PASOS = ['reglas', 'heroes', 'hechizos', 'mazos', 'monstruos', 'barajar'] as const

export type Paso = (typeof PASOS)[number]

/** Las tablas de encuentros tienen columnas para 1, 2 y 3 o 4 héroes */
export const MAX_HEROES = 4

/** Reglas opcionales con las que se juega la partida */
export type Reglas = {
  /**
   * Puntos de Movimiento fijos por perfil («Nuevas reglas de movimiento» de
   * Aventuras Infinitas); sin ellos los héroes tiran sus dados cada turno
   */
  movimientoFijo: boolean
  /** Prepara Mazo de Tesoros equilibrado y Mazo de Sucesos para la partida */
  tesorosYSucesos: boolean
  /** Usa habilidades especiales de héroes que no sean selección o lanzamiento de hechizos */
  habilidadesEspeciales: boolean
}

export const REGLAS_POR_DEFECTO: Reglas = { movimientoFijo: true, tesorosYSucesos: false, habilidadesEspeciales: false }

export type HeroeSeleccionado = {
  /** Identificador único de este héroe concreto, para progreso entre aventuras */
  id: string
  /** Id del perfil de `templates/heroes` */
  tipo: string
  /** Nombre propio usado durante la aventura */
  nombre: string
  /** Las aventuras antiguas no lo tienen */
  sexo?: Sexo
}

export type Configuracion = {
  /** Paso del asistente en curso (las aventuras antiguas no lo tienen) */
  paso?: Paso
  /** Sin dato (aventuras antiguas), las reglas por defecto */
  reglas?: Reglas
  /** Héroes del grupo; las aventuras antiguas guardaban sólo ids de perfil */
  heroes?: (string | HeroeSeleccionado)[]
  /** Ids de cartas de `templates/mazos/hechizos` que lleva cada héroe */
  hechizos?: Record<string, string[]>
  /** Aliados que acompañan al grupo, con `claveAliado` */
  aliados?: string[]
  /** Monstruos elegidos; sin dato, la propuesta de la misión */
  monstruos?: SeleccionMonstruos
  modo: Modo
  mazos: Partial<Record<IdMazo, SeleccionMazo>>
  /** Orden final tras «barajar y guardar»; se pierde al cambiar la selección */
  barajado?: { fecha: string; orden: Partial<Record<IdMazo, string[]>> }
}

type ReglaCambio = Extract<EfectoEspecial, { tipo: 'cambiar-cartas' }>

const VACIA: SeleccionMazo = { cartas: [], reemplazos: [] }

/** Si una carta de ese tipo cuenta para la categoría */
export const coincide = (c: Categoria, tipo: string) =>
  c.prefijos.some((p) => tipo.startsWith(p)) && !c.excluir?.includes(tipo)

const quitarUna = (lista: string[], id: string) => {
  const i = lista.indexOf(id)
  return i < 0 ? lista : [...lista.slice(0, i), ...lista.slice(i + 1)]
}

const veces = (lista: string[], id: string) => lista.filter((x) => x === id).length

function carta(mazo: Mazo, id: string): CartaMazo {
  const c = mazo.cartas.find((c) => c.id === id)
  if (!c) throw new Error(`El mazo ${mazo.id} no tiene la carta ${id}`)
  return c
}

/** Reglas especiales de la misión que cambian cartas de este mazo */
export function reglasDelMazo(mazo: IdMazo, mision: Mision): ReglaCambio[] {
  return (mision.efectos ?? []).filter(
    (e): e is ReglaCambio => e.tipo === 'cambiar-cartas' && e.mazo === mazo,
  )
}

const pone = (regla: ReglaCambio, c: CartaMazo) =>
  regla.poner.id ? c.id === regla.poner.id : c.tipo === regla.poner.tipo

/** Composición sin aplicar las reglas: la que debe cumplir la misión */
export function cartasBase(s: SeleccionMazo): string[] {
  let cartas = s.cartas
  for (const r of s.reemplazos) cartas = quitarUna(cartas, r.reemplazo)
  return [...cartas, ...s.reemplazos.map((r) => r.original)]
}

/** Copias de cada carta que siguen en el mazo (ni en la mesa ni apartadas) */
export function disponibles(mazo: Mazo, s: SeleccionMazo): Map<string, number> {
  const usadas = [...s.cartas, ...s.reemplazos.map((r) => r.original)]
  return new Map(mazo.cartas.map((c) => [c.id, c.copias - veces(usadas, c.id)]))
}

function aplicadas(mazo: Mazo, regla: ReglaCambio, s: SeleccionMazo) {
  return s.reemplazos.filter((r) => pone(regla, carta(mazo, r.reemplazo))).length
}

/** El motor escoge lo que falta y aplica las reglas especiales pendientes */
export function completar(mazo: Mazo, mision: Mision, s: SeleccionMazo): SeleccionMazo {
  const id = mazo.id as IdMazo
  const reglas = reglasDelMazo(id, mision)
  const disp = disponibles(mazo, s)
  const tomar = (candidatas: CartaMazo[], n: number) => {
    const copias = candidatas.flatMap((c) => Array<string>(Math.max(0, disp.get(c.id) ?? 0)).fill(c.id))
    const elegidas = barajar(copias).slice(0, Math.max(0, n))
    for (const e of elegidas) disp.set(e, (disp.get(e) ?? 0) - 1)
    return elegidas
  }
  const esReemplazo = (c: CartaMazo) => reglas.some((r) => pone(r, c))

  // se reservan antes las cartas que pondrán las reglas pendientes
  const porPoner = reglas.flatMap((r) =>
    tomar(mazo.cartas.filter((c) => pone(r, c)), r.poner.cantidad - aplicadas(mazo, r, s)).map(
      (reemplazo) => ({ regla: r, reemplazo }),
    ),
  )

  let cartas = [...s.cartas]
  const base = cartasBase(s)
  for (const cat of categorias(id, mision)) {
    const hay = base.filter((c) => coincide(cat, carta(mazo, c).tipo)).length
    const candidatas = mazo.cartas.filter((c) => coincide(cat, c.tipo) && !esReemplazo(c))
    cartas = [...cartas, ...tomar(candidatas, cat.cantidad - hay)]
  }

  const reemplazos = [...s.reemplazos]
  for (const { regla, reemplazo } of porPoner) {
    const quitables = cartas.filter((c) => {
      const cm = carta(mazo, c)
      return !esReemplazo(cm) && !regla.quitar.excepto?.includes(cm.tipo)
    })
    if (!quitables.length) break
    const original = barajar(quitables)[0]
    cartas = [...quitarUna(cartas, original), reemplazo]
    reemplazos.push({ original, reemplazo })
  }
  return { cartas, reemplazos }
}

/** Pone o quita una copia de una carta en la mesa */
export function mover(s: SeleccionMazo, id: string, delta: 1 | -1): SeleccionMazo {
  if (delta === 1) return { ...s, cartas: [...s.cartas, id] }
  // al quitar una carta puesta por una regla, la original vuelve al mazo
  const r = s.reemplazos.findIndex((r) => r.reemplazo === id)
  return {
    cartas: quitarUna(s.cartas, id),
    reemplazos: r < 0 ? s.reemplazos : s.reemplazos.filter((_, i) => i !== r),
  }
}

export type Recuento = { categoria: Categoria; hay: number }

export function recuento(mazo: Mazo, mision: Mision, s: SeleccionMazo): Recuento[] {
  const base = cartasBase(s)
  return categorias(mazo.id as IdMazo, mision).map((categoria) => ({
    categoria,
    hay: base.filter((c) => coincide(categoria, carta(mazo, c).tipo)).length,
  }))
}

/** Problemas de la selección para la misión (avisos no bloqueantes) */
export function avisos(mazo: Mazo, mision: Mision, s: SeleccionMazo): string[] {
  const cats = categorias(mazo.id as IdMazo, mision)
  const lista = recuento(mazo, mision, s).flatMap(({ categoria: c, hay }) =>
    hay < c.cantidad
      ? [`${c.cantidad - hay === 1 ? 'Falta' : 'Faltan'} ${c.cantidad - hay}: ${c.etiqueta.toLowerCase()}`]
      : hay > c.cantidad
        ? [`${hay - c.cantidad === 1 ? 'Sobra' : 'Sobran'} ${hay - c.cantidad}: ${c.etiqueta.toLowerCase()}`]
        : [],
  )
  const ajenas = new Set(
    cartasBase(s).filter((c) => !cats.some((cat) => coincide(cat, carta(mazo, c).tipo))),
  )
  for (const c of ajenas) lista.push(`«${carta(mazo, c).titulo}» no forma parte de este mazo en la misión`)
  for (const regla of reglasDelMazo(mazo.id as IdMazo, mision)) {
    const falta = regla.poner.cantidad - aplicadas(mazo, regla, s)
    const nombre = mazo.cartas.find((c) => pone(regla, c))?.titulo
    if (falta > 0) lista.push(`Regla especial: falta cambiar ${falta} carta${falta > 1 ? 's' : ''} por ${nombre}`)
  }
  return lista
}

/** Orden final; la Sala Objetivo va en las últimas cartas */
export function ordenar(mazo: Mazo, s: SeleccionMazo, modo: Modo): string[] {
  const esObjetivo = (id: string) => carta(mazo, id).tipo.startsWith('sala-objetivo')
  const objetivos = s.cartas.filter(esObjetivo)
  if (!objetivos.length) return barajar(s.cartas)
  const resto = barajar(s.cartas.filter((c) => !esObjetivo(c)))
  const corte = Math.max(0, resto.length - CARTAS_CON_OBJETIVO[modo])
  return [...resto.slice(0, corte), ...barajar([...resto.slice(corte), ...objetivos])]
}

const todasLasCopias = (mazo: Mazo) => mazo.cartas.flatMap((carta) => Array<string>(carta.copias).fill(carta.id))

function mazoTesorosEquilibrado(mazo: Mazo): string[] {
  const copias = todasLasCopias(mazo)
  const porCategoria = (categoria: CartaMazo['categoria']) =>
    copias.filter((id) => carta(mazo, id).categoria === categoria)
  const negativas = porCategoria('negativa')
  const positivas = porCategoria('positiva')
  const neutrales = copias.filter((id) => !carta(mazo, id).categoria)
  const negativasElegidas = barajar(negativas)
  const positivasElegidas = barajar(positivas).slice(0, negativasElegidas.length * 2)
  const maxNeutrales = Math.min(neutrales.length, Math.floor(negativasElegidas.length / 2), Math.max(0, 40 - negativasElegidas.length - positivasElegidas.length))
  return barajar([...positivasElegidas, ...negativasElegidas, ...barajar(neutrales).slice(0, maxNeutrales)])
}

export const mazosDePartida = (c: Configuracion): IdMazo[] => [
  ...MAZOS_POR_MODO[c.modo],
  ...(reglas(c).tesorosYSucesos ? (['tesoros', 'sucesos'] as const) : []),
]

/** Primera configuración: el motor prepara todos los mazos de ambos modos */
export function nuevaConfiguracion(mazos: Mazos, mision: Mision): Configuracion {
  const ids = [...new Set([...MAZOS_POR_MODO.losetas, ...MAZOS_POR_MODO.tablero])]
  return {
    paso: 'reglas',
    heroes: [],
    modo: 'losetas',
    mazos: Object.fromEntries(ids.map((id) => [id, completar(mazos[id], mision, VACIA)])),
  }
}

export function barajarYGuardar(mazos: Mazos, c: Configuracion): Configuracion {
  const preparar = (id: IdMazo) => {
    if (id === 'tesoros') return mazoTesorosEquilibrado(mazos.tesoros)
    if (id === 'sucesos') return barajar(todasLasCopias(mazos.sucesos))
    return ordenar(mazos[id], c.mazos[id] ?? VACIA, c.modo)
  }
  return {
    ...c,
    barajado: {
      fecha: new Date().toISOString(),
      orden: Object.fromEntries(mazosDePartida(c).map((id) => [id, preparar(id)])),
    },
  }
}

export const seleccion = (c: Configuracion, id: IdMazo) => c.mazos[id] ?? VACIA

export const reglas = (c: Configuracion): Reglas => ({ ...REGLAS_POR_DEFECTO, ...c.reglas })

const alternar = (lista: string[], id: string) =>
  lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]

const esHeroeSeleccionado = (heroe: string | HeroeSeleccionado): heroe is HeroeSeleccionado =>
  typeof heroe !== 'string'

export const heroesSeleccionados = (c: Configuracion, plantillas: Heroe[] = []): HeroeSeleccionado[] =>
  (c.heroes ?? []).map((heroe) => {
    if (esHeroeSeleccionado(heroe)) return heroe
    return { id: heroe, tipo: heroe, nombre: plantillas.find((h) => h.id === heroe)?.nombre ?? heroe }
  })

const idHeroe = (tipo: string) => {
  const uuid = globalThis.crypto?.randomUUID?.()
  return uuid ? `heroe-${uuid}` : `heroe-${tipo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Añade un héroe al grupo; con el grupo completo no añade. Los
 * monstruos vuelven a la propuesta, que depende de cuántos héroes hay.
 */
export function anadirHeroe(c: Configuracion, tipo: string, nombre: string, sexo: Sexo, heroes: Heroe[] = [], hechizos?: Mazo): Configuracion {
  const grupo = heroesSeleccionados(c, heroes)
  if (grupo.length >= MAX_HEROES) return c
  const heroe = heroes.find((h) => h.id === tipo)
  if (!heroe) return c
  const seleccionado = { id: idHeroe(tipo), tipo, nombre: nombre.trim() || heroe.nombre, sexo }
  const iniciales = heroe && hechizos ? hechizosInicialesHeroe(heroe, hechizos) : []
  return {
    ...c,
    heroes: [...grupo, seleccionado],
    hechizos: iniciales.length ? { ...c.hechizos, [seleccionado.id]: iniciales } : c.hechizos,
    monstruos: undefined,
  }
}

export function quitarHeroe(c: Configuracion, id: string, heroes: Heroe[] = []): Configuracion {
  const grupo = heroesSeleccionados(c, heroes)
  const { [id]: _quitado, ...resto } = c.hechizos ?? {}
  return { ...c, heroes: grupo.filter((heroe) => heroe.id !== id), hechizos: resto, monstruos: undefined }
}

/** Un aliado se identifica por su grupo (`templates/aliados/<grupo>.json`) y su id */
export const claveAliado = (grupo: string, id: string) => `${grupo}/${id}`

export const alternarAliado = (c: Configuracion, clave: string): Configuracion => ({
  ...c,
  aliados: alternar(c.aliados ?? [], clave),
})
