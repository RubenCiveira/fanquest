import type { Casilla } from './casilla'
import type { Medida } from './medida'

/** Cómo afecta un terreno al movimiento: no se puede pisar, o entrar en cada casilla cuesta dos o tres */
export type TipoTerreno = 'impasable' | 'dificil' | 'muy-dificil'

/**
 * Zona de terreno que afecta al movimiento, desde su `posicion` (esquina
 * superior izquierda, en casillas de su estancia). Con `imagen` (su URL), esa
 * imagen cubre todas sus casillas; sin ella, se marca según su tipo
 */
export type Terreno = Medida & { tipo: TipoTerreno; posicion: Casilla; imagen?: string }
