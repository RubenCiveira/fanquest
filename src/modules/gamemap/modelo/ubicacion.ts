import type { Casilla } from './casilla'
import type { Terreno } from './terreno'

/** Dónde está algo en el mapa: la estancia y su casilla en ella */
export type Ubicacion = { estancia: string; casilla: Casilla; terreno?: Terreno }
