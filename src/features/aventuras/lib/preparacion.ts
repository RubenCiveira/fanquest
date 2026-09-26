import { barajar } from '../../../lib/dados'
import type { EfectoEspecial, Mision } from '../../generar/lib/tipos'
import {
  CARTAS_CON_OBJETIVO,
  categorias,
  MAZOS_POR_MODO,
  type Categoria,
  type Modo,
} from '../config/mazos'
import type { CartaMazo, IdMazo, Mazo, Mazos } from './mazos'

/** Carta apartada por una regla especial y la que ocupa su lugar */
export type Reemplazo = { original: string; reemplazo: string }

/** Cartas sobre la mesa para un mazo (ids de carta, repetidos por copia) */
export type SeleccionMazo = { cartas: string[]; reemplazos: Reemplazo[] }

/** Pasos del asistente de preparación, en orden */
export const PASOS = ['mazmorra', 'mazos', 'barajar'] as const

export type Paso = (typeof PASOS)[number]

export type Configuracion = {
  /** Paso del asistente en curso (las aventuras antiguas no lo tienen) */
  paso?: Paso
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

/** Primera configuración: el motor prepara todos los mazos de ambos modos */
export function nuevaConfiguracion(mazos: Mazos, mision: Mision): Configuracion {
  const ids = [...new Set([...MAZOS_POR_MODO.losetas, ...MAZOS_POR_MODO.tablero])]
  return {
    paso: 'mazmorra',
    modo: 'losetas',
    mazos: Object.fromEntries(ids.map((id) => [id, completar(mazos[id], mision, VACIA)])),
  }
}

export function barajarYGuardar(mazos: Mazos, c: Configuracion): Configuracion {
  return {
    ...c,
    barajado: {
      fecha: new Date().toISOString(),
      orden: Object.fromEntries(
        MAZOS_POR_MODO[c.modo].map((id) => [id, ordenar(mazos[id], c.mazos[id] ?? VACIA, c.modo)]),
      ),
    },
  }
}

export const seleccion = (c: Configuracion, id: IdMazo) => c.mazos[id] ?? VACIA
