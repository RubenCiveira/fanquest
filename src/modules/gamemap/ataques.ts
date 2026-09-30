import { conPersonaje, conPersonajeNoJugador, todosLosPersonajes } from './activaciones'
import { esEnemigo, jugadorDe } from './jugadores'
import { enElMapa, sePuedePasar } from './movimiento'
import type { Ataque } from './modelo/ataque'
import type { Casilla } from './modelo/casilla'
import type { Mapa } from './modelo/mapa'
import type { Personaje } from './modelo/personaje'

/** El enemigo del personaje que está en esa casilla del mapa, si lo hay */
export function enemigoEn(m: Mapa, personajeId: string, casilla: Casilla): Personaje | undefined {
  const alianza = jugadorDe(m, personajeId)?.alianza
  return todosLosPersonajes(m).find((p) => {
    const suya = p.id !== personajeId && esEnemigo(m, p.id, alianza) && enElMapa(m, p)
    return !!suya && suya.x === casilla.x && suya.y === casilla.y
  })
}

/**
 * Tipo y distancia (en casillas, en recto o en diagonal) del ataque: cuerpo a
 * cuerpo si el objetivo está pegado, también en diagonal, y se podría pasar
 * de una casilla a la otra (sin muro ni esquina en medio); si no, a
 * distancia. Nada si alguno no está colocado
 */
export function medirAtaque(m: Mapa, atacante: Personaje, objetivo: Personaje): Pick<Ataque, 'tipo' | 'distancia'> | undefined {
  const [desde, hasta] = [enElMapa(m, atacante), enElMapa(m, objetivo)]
  if (!desde || !hasta) return
  const distancia = Math.max(Math.abs(desde.x - hasta.x), Math.abs(desde.y - hasta.y))
  return { tipo: distancia === 1 && sePuedePasar(m, desde, hasta, 'diagonal') ? 'cuerpo-a-cuerpo' : 'distancia', distancia }
}

/** Resta puntos de vida al personaje (de escuadra o no jugador), sin bajar de cero; sin cambios si no lleva la cuenta */
export function conVidaReducida(m: Mapa, id: string, puntos: number): Mapa {
  const herido = <P extends Personaje>(p: P): P => (p.vida === undefined ? p : { ...p, vida: Math.max(0, p.vida - puntos) })
  return conPersonajeNoJugador(conPersonaje(m, id, herido), id, herido)
}

/** El mapa sin ese personaje, esté en una escuadra o sea no jugador */
export const sinPersonaje = (m: Mapa, id: string): Mapa => ({
  ...m,
  ...(m.escuadras && { escuadras: m.escuadras.map((e) => ({ ...e, personajes: e.personajes.filter((p) => p.id !== id) })) }),
  ...(m.personajesNoJugadores && { personajesNoJugadores: m.personajesNoJugadores.filter((p) => p.id !== id) }),
})
