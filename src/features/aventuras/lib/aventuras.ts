import type { Mision } from '../../generar/lib/tipos'
import type { Partida } from './partida'
import type { Configuracion } from './preparacion'

export type EstadoAventura = 'sin-empezar' | 'configurando' | 'mazo-barajado' | 'en-juego' | 'terminada'

export const ETIQUETA_ESTADO: Record<EstadoAventura, string> = {
  'sin-empezar': 'Sin empezar',
  configurando: 'Configurando',
  'mazo-barajado': 'Mazo barajado',
  'en-juego': 'En juego',
  terminada: 'Terminada',
}

/**
 * Misión guardada para jugarla. La misión es autónoma: guarda sus textos y
 * sus datos de preparación como números para las ayudas de juego.
 */
export type Aventura = {
  id: string
  /** Fecha ISO 8601 */
  guardadaEn: string
  estado: EstadoAventura
  mision: Mision
  /** Mazos preparados para la misión (desde «configurando») */
  configuracion?: Configuracion
  /** Partida en curso o terminada (desde «en-juego») */
  partida?: Partida
}

const CLAVE = 'fanquest.aventuras.v1'

function leer(): Aventura[] {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) ?? '[]')
  } catch {
    return []
  }
}

// La API es asíncrona para poder cambiar de almacenamiento sin tocar la UI

/** Aventuras guardadas, de la más reciente a la más antigua */
export async function listarAventuras(): Promise<Aventura[]> {
  return leer()
}

export async function obtenerAventura(id: string): Promise<Aventura | undefined> {
  return leer().find((aventura) => aventura.id === id)
}

/** Guarda la misión como aventura sin empezar; falla si no hay almacenamiento */
export async function guardarAventura(mision: Mision): Promise<Aventura> {
  const aventura: Aventura = {
    id: crypto.randomUUID(),
    guardadaEn: new Date().toISOString(),
    estado: 'sin-empezar',
    mision,
  }
  localStorage.setItem(CLAVE, JSON.stringify([aventura, ...leer()]))
  return aventura
}

export async function actualizarAventura(aventura: Aventura): Promise<void> {
  localStorage.setItem(
    CLAVE,
    JSON.stringify(leer().map((a) => (a.id === aventura.id ? aventura : a))),
  )
}

export async function borrarAventura(id: string): Promise<void> {
  localStorage.setItem(
    CLAVE,
    JSON.stringify(leer().filter((aventura) => aventura.id !== id)),
  )
}
