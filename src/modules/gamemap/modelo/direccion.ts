/** Uno de los cuatro lados de una casilla o de una estancia */
export type Direccion = 'arriba' | 'abajo' | 'izquierda' | 'derecha'

export const OPUESTA: Record<Direccion, Direccion> = { arriba: 'abajo', abajo: 'arriba', izquierda: 'derecha', derecha: 'izquierda' }
