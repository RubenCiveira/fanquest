import type { Aparicion } from './aparicion'
import type { Personaje } from './personaje'

/** Personaje que se pide añadir a una estancia: quién es y dónde aparece */
export type DescripcionPersonaje = Pick<Personaje, 'id' | 'nombre' | 'imagenVtt'> & Aparicion

/** Personaje no jugador que se pide añadir, con el jugador del que es */
export type DescripcionPersonajeNoJugador = DescripcionPersonaje & { jugador: string }
