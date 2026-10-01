import { todosLosPersonajes } from './activaciones'
import { jugadorDe, postura } from './jugadores'
import { casillasDeEnemigos, enElMapa, enZonaDeControl } from './movimiento'
import type { Mapa } from './modelo/mapa'
import type { Personaje } from './modelo/personaje'

/** Si el personaje está en la zona de control (a `distanciaControl` o menos) de algún enemigo: trabado en cuerpo a cuerpo. No, si no está colocado */
export function estaTrabado(m: Mapa, distanciaControl: number, personaje: Personaje): boolean {
  const suya = enElMapa(m, personaje)
  return !!suya && enZonaDeControl(casillasDeEnemigos(m, personaje.id), distanciaControl)(suya)
}

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
