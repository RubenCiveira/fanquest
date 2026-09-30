import type { Direccion, Mapa } from '../gamemap'
import { jardinConCasa } from './estancias'

export const ETIQUETA_ORIENTACION: Record<Direccion, string> = {
  abajo: 'hacia abajo',
  izquierda: 'hacia la izquierda',
  derecha: 'hacia la derecha',
  arriba: 'hacia arriba',
}

/** Mapa de prueba con el id con que se guarda */
export type MapaGuardado = { id: string; mapa: Mapa }

const CLAVE = 'fetenquest.map-debug.v4'

function guardados(): MapaGuardado[] {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) ?? '[]') as MapaGuardado[]
  } catch {
    return []
  }
}

/** Mapas de prueba: el de ejemplo y los creados, que se guardan en este navegador */
export const listarMapas = (): MapaGuardado[] => [{ id: 'jardin-con-casa', mapa: { estancias: [jardinConCasa()] } }, ...guardados()]

export const obtenerMapa = (id: string) => listarMapas().find((m) => m.id === id)

/** Id libre para un mapa nuevo */
export function nuevoId() {
  const ids = new Set(listarMapas().map((m) => m.id))
  let n = 1
  while (ids.has(`mapa-${n}`)) n++
  return `mapa-${n}`
}

export function guardarMapa(id: string, mapa: Mapa) {
  localStorage.setItem(CLAVE, JSON.stringify([...guardados().filter((m) => m.id !== id), { id, mapa }]))
}
