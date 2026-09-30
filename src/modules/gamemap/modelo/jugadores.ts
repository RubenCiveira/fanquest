import type { Alianza } from './alianza'
import type { Jugador } from './jugador'

/** Reparto de la partida: las alianzas (en el orden en que se turnan) y sus jugadores (en el orden en que se turnan dentro de cada una) */
export type Jugadores = { alianzas: Alianza[]; jugadores: Jugador[] }
