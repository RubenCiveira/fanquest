import { todosLosPersonajes } from './activaciones'
import { jugadorDe, postura } from './jugadores'
import { enElMapa, enemigosDe, enZonaDeControl } from './movimiento'
import type { Mapa } from './modelo/mapa'
import type { Personaje } from './modelo/personaje'

/** Enemigos colocados en cuya zona de control (a `distanciaControl` o menos) está el personaje: los que lo traban en cuerpo a cuerpo. Ninguno si no está colocado */
export function trabadoPor(m: Mapa, distanciaControl: number, personaje: Personaje): Personaje[] {
  const suya = enElMapa(m, personaje)
  if (!suya) return []
  return enemigosDe(m, personaje.id).filter((en) => {
    const donde = enElMapa(m, en)
    return !!donde && enZonaDeControl([donde], distanciaControl)(suya)
  })
}

/** Si el personaje está en la zona de control de algún enemigo: trabado en cuerpo a cuerpo */
export const estaTrabado = (m: Mapa, distanciaControl: number, personaje: Personaje): boolean => trabadoPor(m, distanciaControl, personaje).length > 0

/**
 * Personajes colocados en la zona de control del personaje (a
 * `distanciaControl` o menos, en recto o en diagonal) que lo consideran
 * aliado: su alianza es aliada de la suya, o es la misma
 */
export function apoyosDe(m: Mapa, distanciaControl: number, personaje: Personaje): Personaje[] {
  const suya = enElMapa(m, personaje)
  const alianza = jugadorDe(m, personaje.id)?.alianza
  if (!suya || !alianza) return []
  return todosLosPersonajes(m).filter((p) => {
    const otra = jugadorDe(m, p.id)?.alianza
    const donde = enElMapa(m, p)
    return p.id !== personaje.id && !!otra && !!donde && postura(m, otra, alianza) === 'aliada' && enZonaDeControl([donde], distanciaControl)(suya)
  })
}
