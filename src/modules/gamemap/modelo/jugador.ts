/** Quién juega: una persona o la inteligencia artificial */
export type TipoJugador = 'humano' | 'ia'

/** Jugador de la partida: dueño de escuadras y personajes, dentro de una alianza */
export type Jugador = { id: string; nombre: string; tipo: TipoJugador; alianza: string }
