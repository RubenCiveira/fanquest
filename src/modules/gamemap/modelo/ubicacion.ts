import type { Casilla } from './casilla'

/** Dónde está algo en el mapa: la estancia y su casilla en ella */
export type Ubicacion = { estancia: string; casilla: Casilla }
