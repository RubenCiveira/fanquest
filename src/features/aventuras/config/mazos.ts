import type { Mision } from '../../generar/lib/tipos'
import type { IdMazo } from '../../../lib/mazos'

/** Tablero con salas fijas o losetas modulares (Aventuras Infinitas) */
export type Modo = 'tablero' | 'losetas'

export const ETIQUETA_MODO: Record<Modo, string> = {
  losetas: 'Losetas',
  tablero: 'Tablero',
}

export const DESCRIPCION_MODO: Record<Modo, string> = {
  losetas: 'Salas y pasillos modulares. Se juega con el Mazo de Mazmorra.',
  tablero: 'Un tablero con salas fijas. Se juega con el Mazo de Salas y el de Pasillo.',
}

/** Mazos que se preparan para la misión según el modo */
export const MAZOS_POR_MODO: Record<Modo, IdMazo[]> = {
  losetas: ['mazmorra', 'salas-especiales', 'atrezo'],
  tablero: ['salas', 'salas-especiales', 'atrezo'],
}

export const NOMBRE_MAZO: Partial<Record<IdMazo, string>> = {
  mazmorra: 'Mazo de Mazmorra',
  salas: 'Mazo de Salas',
  'salas-especiales': 'Mazo de Salas Especiales',
  atrezo: 'Mazo de Atrezo',
  tesoros: 'Mazo de Tesoros',
  sucesos: 'Mazo de Sucesos',
}

/** Cartas que se barajan con la Sala Objetivo al final del mazo */
export const CARTAS_CON_OBJETIVO: Record<Modo, number> = {
  tablero: 2,
  losetas: 3,
}

/** Grupo de cartas que la misión pide en un mazo */
export type Categoria = {
  id: string
  etiqueta: string
  /** Tipos de carta que cuentan: los que empiezan por algún prefijo… */
  prefijos: string[]
  /** …salvo estos */
  excluir?: string[]
  cantidad: number
}

const objetivo: Categoria = { id: 'objetivo', etiqueta: 'Sala Objetivo', prefijos: ['sala-objetivo'], cantidad: 1 }

/** Composición que la misión pide para cada mazo */
export function categorias(mazo: IdMazo, m: Mision): Categoria[] {
  const normales = { id: 'normales', etiqueta: 'Salas normales', prefijos: ['sala-normal'], cantidad: m.salasNormales }
  const especiales = { id: 'especiales', etiqueta: 'Salas especiales', prefijos: ['sala-especial'], cantidad: m.salasEspeciales }

  switch (mazo) {
    case 'mazmorra':
      return [normales, especiales, { id: 'pasillos', etiqueta: 'Pasillos', prefijos: ['pasillo'], cantidad: m.pasillos }, objetivo]
    case 'salas':
      return [normales, especiales, objetivo]
    case 'salas-especiales':
      return [{ id: 'especiales', etiqueta: 'Salas especiales', prefijos: [''], excluir: ['sala-especial-de-mision'], cantidad: m.salasEspeciales }]
    case 'atrezo':
      return [
        { id: 'cofre', etiqueta: 'Cofre', prefijos: ['cofre'], cantidad: 1 },
        { id: 'con-atrezo', etiqueta: 'Con atrezo al azar', prefijos: [''], excluir: ['cofre', 'sin-atrezo'], cantidad: 9 },
        { id: 'sin-atrezo', etiqueta: 'Sin atrezo', prefijos: ['sin-atrezo'], cantidad: 10 },
      ]
    default:
      return []
  }
}
