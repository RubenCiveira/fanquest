import { ORIENTACION_INICIAL } from './encaramiento'
import type { Casilla } from './modelo/casilla'
import type { Direccion } from './modelo/direccion'
import type { Mapa } from './modelo/mapa'
import type { Personaje } from './modelo/personaje'

/** Tamaño de un personaje: casillas hacia donde mira (`largo`) y de lado (`ancho`), y hacia dónde mira */
export type Tamano = Pick<Personaje, 'largo' | 'ancho' | 'orientacion'>

/** Columnas y filas que ocupa según hacia dónde mira: mirando arriba o abajo, su largo va en filas; a un lado, en columnas */
export function dimensionesDe({ largo = 1, ancho = 1, orientacion = ORIENTACION_INICIAL }: Tamano): { columnas: number; filas: number } {
  return orientacion === 'arriba' || orientacion === 'abajo' ? { columnas: ancho, filas: largo } : { columnas: largo, filas: ancho }
}

/** Si ocupa más de una casilla */
export const esGrande = ({ largo = 1, ancho = 1 }: Tamano) => largo > 1 || ancho > 1

/** Su tamaño para moverse (`FormaDeMoverse.tamano`), si ocupa más de una casilla */
export const tamanoDe = ({ largo, ancho, orientacion }: Tamano): Tamano | undefined => (esGrande({ largo, ancho }) ? { largo, ancho, orientacion } : undefined)

/** Si ocupa lo mismo mire hacia donde mire */
export const esCuadrado = ({ largo = 1, ancho = 1 }: Tamano) => largo === ancho

/** Casillas que ocupa con su esquina superior izquierda en `casilla`, mirando hacia `orientacion` (sin decirla, la suya) */
export function huella(casilla: Casilla, tamano: Tamano, orientacion: Direccion | undefined = tamano.orientacion): Casilla[] {
  const { columnas, filas } = dimensionesDe({ ...tamano, orientacion })
  return Array.from({ length: columnas * filas }, (_, i) => ({ x: casilla.x + (i % columnas), y: casilla.y + Math.floor(i / columnas) }))
}

/** Casillas del mapa que ocupa el personaje (o nada, si está en la zona de espera) */
export function huellaEnElMapa(m: Mapa, personaje: Pick<Personaje, 'estancia' | 'casilla'> & Tamano): Casilla[] {
  const estancia = m.estancias.find((e) => e.id === personaje.estancia)
  if (!estancia || !personaje.casilla) return []
  const origen = estancia.posicion ?? { x: 0, y: 0 }
  return huella({ x: origen.x + personaje.casilla.x, y: origen.y + personaje.casilla.y }, personaje)
}
