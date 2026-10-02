import { todosLosPersonajes } from './activaciones'
import { huellaEnElMapa } from './huella'
import { jugadorDe, postura } from './jugadores'
import { enemigosDe, enZonaDeControl } from './movimiento'
import type { Mapa } from './modelo/mapa'
import type { Personaje } from './modelo/personaje'

/** Enemigos colocados en cuya zona de control (a `distanciaControl` pasos o menos, sin atravesar muros) está el personaje: los que lo traban en cuerpo a cuerpo. Ninguno si no está colocado */
export function trabadoPor(m: Mapa, distanciaControl: number, personaje: Personaje): Personaje[] {
  const suyas = huellaEnElMapa(m, personaje)
  return enemigosDe(m, personaje.id).filter((en) => suyas.some(enZonaDeControl(m, huellaEnElMapa(m, en), distanciaControl)))
}

/** Si el personaje está en la zona de control de algún enemigo: trabado en cuerpo a cuerpo */
export const estaTrabado = (m: Mapa, distanciaControl: number, personaje: Personaje): boolean => trabadoPor(m, distanciaControl, personaje).length > 0

/**
 * Personajes colocados en la zona de control del personaje (a
 * `distanciaControl` pasos o menos, en recto o en diagonal y sin atravesar
 * muros) que lo consideran
 * aliado: su alianza es aliada de la suya, o es la misma
 */
export function apoyosDe(m: Mapa, distanciaControl: number, personaje: Personaje): Personaje[] {
  const suyas = huellaEnElMapa(m, personaje)
  const alianza = jugadorDe(m, personaje.id)?.alianza
  if (!suyas.length || !alianza) return []
  // en su zona de control: alguna casilla del otro está a la distancia de alguna de las suyas
  const enSuZona = enZonaDeControl(m, suyas, distanciaControl)
  return todosLosPersonajes(m).filter((p) => {
    const otra = jugadorDe(m, p.id)?.alianza
    return p.id !== personaje.id && !!otra && postura(m, otra, alianza) === 'aliada' && huellaEnElMapa(m, p).some(enSuZona)
  })
}
