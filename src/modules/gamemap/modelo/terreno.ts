import type { Casilla } from './casilla'
import type { Medida } from './medida'

/** Cómo afecta un terreno al movimiento: no se puede pisar, o entrar en cada casilla cuesta dos o tres */
export type TipoTerreno = 'impasable' | 'dificil' | 'muy-dificil'

/** Cómo protege un terreno de los disparos que lo cruzan: nada, algo, mucho, o no dejan pasar */
export type TipoCobertura = 'ninguna' | 'ligera' | 'pesada' | 'bloqueante'

/** Cómo se pinta un terreno con efecto; sin decoración, la vista usa su aviso por defecto */
export type DecoracionEfecto = { imagen?: string; fondo?: string }

/**
 * Zona de terreno que afecta al movimiento (`tipo`) y a los disparos que la
 * cruzan (`cobertura`; sin ella, ninguna), desde su `posicion` (esquina
 * superior izquierda, en casillas de su estancia). Con `efecto`, la clase del
 * personaje lo recibe en `alEntrar`; con `decoracion` (imagen o fondo), la
 * vista pinta ese efecto. Con `imagen` (su URL), esa imagen cubre todas sus
 * casillas; sin ella, se marca según su tipo
 */
export type Terreno = Medida & {
  tipo: TipoTerreno
  cobertura?: TipoCobertura
  efecto?: string
  decoracion?: DecoracionEfecto
  posicion: Casilla
  imagen?: string
  /** Lo pone el gestor solo para trazar rutas (los personajes, la zona de control), no es del mapa: las opciones de movimiento no cambian lo que cuesta */
  porReglas?: boolean
}

/** Veces lo que una casilla normal que le cuesta a una forma de moverse entrar en cada tipo de terreno; con un número, también el impasable se cruza */
export type CosteDelTerreno = Partial<Record<TipoTerreno, number>>
