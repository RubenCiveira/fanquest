import type { Personaje } from './personaje'

/** Personaje que no está en ninguna escuadra (enemigos, acólitos…): un tipo más de personaje, de un jugador */
export type PersonajeNoJugador = Personaje & { jugador: string }
