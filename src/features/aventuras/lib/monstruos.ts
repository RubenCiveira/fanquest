import type { Mision } from '../../generar/lib/tipos'
import { version, type Monstruos } from '../../../lib/personajes'
import {
  ERRANTES_MINIMOS,
  MONSTRUO_DE_NOMBRE,
  TABLA_POR_FACCION,
  TABLAS_ENCUENTROS,
  type IdTabla,
} from '../config/encuentros'

/** Carta del mazo temático: un monstruo y cuántas miniaturas hacen falta */
export type CartaMonstruo = { monstruo: string; avanzado: boolean; copias: number }

/** Por qué la misión necesita ese monstruo */
export type Papel = 'encuentros' | 'errante' | 'errante-superior' | 'jefe'

export type CartaPropuesta = CartaMonstruo & { papeles: Papel[] }

/** Monstruos elegidos para la misión: copias por `claveMonstruo` */
export type SeleccionMonstruos = Record<string, number>

export const claveMonstruo = (monstruo: string, avanzado = false) => (avanzado ? `${monstruo}:avanzado` : monstruo)

export function desdeClave(clave: string): Omit<CartaMonstruo, 'copias'> {
  const [monstruo = clave, avanzado] = clave.split(':')
  return { monstruo, avanzado: avanzado === 'avanzado' }
}

/** Columna de la tabla según los héroes en juego; sin grupo, la de 3 o 4 */
export const columna = (heroes: number) => (heroes === 1 ? 2 : heroes === 2 ? 1 : 0)

/**
 * Mazo temático de una tabla de encuentros: cada monstruo que puede salir,
 * con tantas copias como coloca el encuentro que más pide, en orden de
 * aparición (de menos a más poder). Las opciones (p. ej. el demonio de cada
 * Dios Oscuro) llevan todas sus copias.
 */
export function mazoMonstruos(tabla: IdTabla, heroes: number): CartaMonstruo[] {
  const cartas = new Map<string, CartaMonstruo>()
  for (const { grupos } of TABLAS_ENCUENTROS[tabla].encuentros) {
    for (const { monstruo, cantidad, avanzado = false } of grupos) {
      const copias = cantidad[columna(heroes)]
      for (const id of [monstruo].flat()) {
        const clave = claveMonstruo(id, avanzado)
        const carta = cartas.get(clave)
        if (carta) carta.copias = Math.max(carta.copias, copias)
        else cartas.set(clave, { monstruo: id, avanzado, copias })
      }
    }
  }
  return [...cartas.values()].filter((c) => c.copias > 0)
}

export const tablaDeMision = (m: Mision): IdTabla | undefined => TABLA_POR_FACCION[m.faccion.nombre]

/** Monstruos que nombra el generador; «Cultista/Orco» son dos opciones */
export const opciones = (nombre: string) => nombre.split('/').flatMap((n) => MONSTRUO_DE_NOMBRE[n.trim()] ?? [])

/**
 * Propuesta de monstruos para la misión: el mazo de su tabla de encuentros,
 * el errante (la primera opción), el errante superior y el Jefe Final.
 */
export function propuesta(m: Mision, heroes: number): CartaPropuesta[] {
  const cartas = new Map<string, CartaPropuesta>()
  const anadir = (monstruo: string, avanzado: boolean, copias: number, papel: Papel) => {
    const clave = claveMonstruo(monstruo, avanzado)
    const carta = cartas.get(clave)
    if (!carta) cartas.set(clave, { monstruo, avanzado, copias, papeles: [papel] })
    else {
      carta.copias = Math.max(carta.copias, copias)
      carta.papeles.push(papel)
    }
  }
  const tabla = tablaDeMision(m)
  for (const c of tabla ? mazoMonstruos(tabla, heroes) : []) anadir(c.monstruo, c.avanzado, c.copias, 'encuentros')
  const [errante] = opciones(m.faccion.errante)
  if (errante) anadir(errante.monstruo, !!errante.avanzado, Math.max(ERRANTES_MINIMOS, heroes), 'errante')
  const [superior] = opciones(m.faccion.erranteSuperior)
  if (superior) anadir(superior.monstruo, !!superior.avanzado, 1, 'errante-superior')
  const [jefe] = opciones(m.tipoJefe)
  if (jefe) anadir(jefe.monstruo, !!jefe.avanzado, 1, 'jefe')
  return [...cartas.values()]
}

/** Lo elegido o, si aún no se ha tocado, la propuesta */
export function seleccionMonstruos(elegidos: SeleccionMonstruos | undefined, m: Mision, heroes: number) {
  return elegidos ?? Object.fromEntries(propuesta(m, heroes).map((c) => [claveMonstruo(c.monstruo, c.avanzado), c.copias]))
}

/** Puntos de Cuerpo del Jefe Final sin contar el rango del grupo */
export function puntosCuerpoJefe(m: Mision, monstruos: Monstruos, heroes: number): number | undefined {
  const [jefe] = opciones(m.tipoJefe)
  const monstruo = jefe && monstruos[jefe.monstruo]
  if (!monstruo) return undefined
  const cuerpo = version(monstruo, jefe.avanzado).cuerpo
  const extra = (m.efectos ?? []).reduce((n, e) => n + (e.tipo === 'jefe' ? e.puntosCuerpo : 0), 0)
  return cuerpo + heroes + extra
}
