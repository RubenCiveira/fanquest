import type { Casilla } from './casilla'
import type { Medida } from './medida'

/** Zona rectangular de una estancia, desde su esquina superior izquierda */
export type Zona = Medida & { posicion: Casilla }

/**
 * Dónde aparece un personaje en su estancia: en una `casilla` concreta o en
 * una casilla libre al azar de una `zona`; sin ninguna de las dos, en una
 * casilla libre al azar de toda la estancia. Vale para cualquier personaje
 */
export type Aparicion = { casilla?: Casilla; zona?: Zona }
