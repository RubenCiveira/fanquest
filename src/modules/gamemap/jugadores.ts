import { escuadrasDe, jugadoresDe, personajesNoJugadoresDe } from './activaciones'
import type { Postura } from './modelo/alianza'
import type { Jugador } from './modelo/jugador'
import type { Jugadores } from './modelo/jugadores'
import type { Mapa } from './modelo/mapa'

/** Jugador del personaje: el de su escuadra o, si no está en ninguna, el suyo */
export function jugadorDe(m: Mapa, personaje: string): Jugador | undefined {
  const id =
    escuadrasDe(m).find((e) => e.personajes.some((p) => p.id === personaje))?.jugador ?? personajesNoJugadoresDe(m).find((p) => p.id === personaje)?.jugador
  return jugadoresDe(m).jugadores.find((j) => j.id === id)
}

/** Postura de una alianza hacia otra: aliada consigo misma y, si no la tiene, neutral */
export function postura(m: Mapa, de: string, hacia: string): Postura {
  if (de === hacia) return 'aliada'
  return jugadoresDe(m).alianzas.find((a) => a.id === de)?.posturas?.[hacia] ?? 'neutral'
}

/** Si el personaje es enemigo de los de esa alianza: la suya es hostil hacia ella */
export function esEnemigo(m: Mapa, personaje: string, deAlianza: string | undefined): boolean {
  const suya = jugadorDe(m, personaje)?.alianza
  return !!suya && !!deAlianza && postura(m, suya, deAlianza) === 'hostil'
}

/**
 * Por qué no vale ese reparto para el mapa, o nada si vale: ids sin repetir,
 * cada jugador en una alianza que exista, posturas hacia alianzas que existan
 * y el jugador de cada escuadra y de cada personaje no jugador, en el reparto
 */
export function motivoParaNoCambiarJugadores(m: Mapa, { alianzas, jugadores }: Jugadores): string | undefined {
  const repetido = (ids: string[]) => ids.find((id, i) => ids.indexOf(id) !== i)
  const alianzaRepetida = repetido(alianzas.map((a) => a.id))
  if (alianzaRepetida) return `La alianza «${alianzaRepetida}» está repetida`
  const jugadorRepetido = repetido(jugadores.map((j) => j.id))
  if (jugadorRepetido) return `El jugador «${jugadorRepetido}» está repetido`
  const sinAlianza = jugadores.find((j) => !alianzas.some((a) => a.id === j.alianza))
  if (sinAlianza) return `No hay ninguna alianza «${sinAlianza.alianza}» para ${sinAlianza.nombre}`
  for (const alianza of alianzas) {
    const otra = Object.keys(alianza.posturas ?? {}).find((id) => !alianzas.some((a) => a.id === id))
    if (otra) return `${alianza.nombre} tiene postura hacia «${otra}», que no es ninguna alianza`
  }
  const huerfano = [...escuadrasDe(m), ...personajesNoJugadoresDe(m)].find((x) => !jugadores.some((j) => j.id === x.jugador))
  if (huerfano) return `No hay ningún jugador «${huerfano.jugador}» para ${huerfano.nombre}`
}
