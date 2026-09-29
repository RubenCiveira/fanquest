import type { Casilla } from './modelo/casilla'
import { OPUESTA, type Direccion } from './modelo/direccion'
import type { Estancia } from './modelo/estancia'
import type { Medida } from './modelo/medida'
import type { Puerta } from './modelo/puerta'

/** Casillas a lo largo del muro de ese lado */
export const largoMuro = (m: Medida, muro: Direccion) => (muro === 'arriba' || muro === 'abajo' ? m.columnas : m.filas)

/** Casilla del muro, contando desde arriba o desde la izquierda */
function casillaDelMuro(e: Estancia, muro: Direccion, i: number): Casilla {
  if (muro === 'arriba') return { x: i, y: 0 }
  if (muro === 'abajo') return { x: i, y: e.filas - 1 }
  return { x: muro === 'izquierda' ? 0 : e.columnas - 1, y: i }
}

/** Reparte `n` puertas por el muro: cada una en medio de su tramo igual */
const repartidas = (largo: number, n: number) => Array.from({ length: n }, (_, i) => Math.floor(((2 * i + 1) * largo) / (2 * n)))

/**
 * Orienta la estancia hacia un lado: se entra por el muro contrario (la
 * puerta de entrada en su centro) y se sale por el de la orientación, con
 * `salidas` puertas repartidas. Falla si no caben en el muro
 */
export function orientar(e: Estancia, orientacion: Direccion, salidas: number): Estancia {
  const largo = largoMuro(e, orientacion)
  if (!Number.isInteger(salidas) || salidas < 0 || salidas > largo) {
    throw new Error(`En el muro de ${orientacion} de «${e.id}» caben de 0 a ${largo} salidas, no ${salidas}`)
  }
  const muroEntrada = OPUESTA[orientacion]
  const [centro] = repartidas(largoMuro(e, muroEntrada), 1)
  const entrada: Puerta = { id: 'entrada', tipo: 'entrada', casilla: casillaDelMuro(e, muroEntrada, centro), lado: muroEntrada }
  const salida = (i: number, n: number): Puerta => ({
    id: `salida-${n + 1}`,
    tipo: 'salida',
    casilla: casillaDelMuro(e, orientacion, i),
    lado: orientacion,
  })
  return { ...e, orientacion, puertas: [entrada, ...repartidas(largo, salidas).map(salida)] }
}
