import type { Casilla } from './modelo/casilla'
import { OPUESTA, type Direccion } from './modelo/direccion'
import type { Estancia } from './modelo/estancia'
import type { Medida } from './modelo/medida'
import type { Puerta } from './modelo/puerta'

/** Casillas a lo largo del muro de ese lado */
export const largoMuro = (m: Medida, muro: Direccion) => (muro === 'arriba' || muro === 'abajo' ? m.columnas : m.filas)

/** Casilla del muro, contando desde arriba o desde la izquierda */
export function casillaDelMuro(e: Medida, muro: Direccion, i: number): Casilla {
  if (muro === 'arriba') return { x: i, y: 0 }
  if (muro === 'abajo') return { x: i, y: e.filas - 1 }
  return { x: muro === 'izquierda' ? 0 : e.columnas - 1, y: i }
}

/** Reparte `n` puertas por el muro: cada una en medio de su tramo igual */
const repartidas = (largo: number, n: number) => Array.from({ length: n }, (_, i) => Math.floor(((2 * i + 1) * largo) / (2 * n)))

/**
 * Orienta la estancia hacia un lado: se sale por el muro de la orientación,
 * con `salidas` puertas repartidas, y se entra por el muro `entrada` (la
 * puerta en su centro): el contrario, salvo que se entre desde una puerta que
 * encaja en otro muro. Falla si las salidas no caben o van en el muro de la
 * entrada
 */
export function orientar(e: Estancia, orientacion: Direccion, salidas: number, entrada: Direccion = OPUESTA[orientacion]): Estancia {
  if (entrada === orientacion) throw new Error(`«${e.id}» no puede salir por el muro de ${orientacion}, que es el de su entrada`)
  const largo = largoMuro(e, orientacion)
  if (!Number.isInteger(salidas) || salidas < 0 || salidas > largo) {
    throw new Error(`En el muro de ${orientacion} de «${e.id}» caben de 0 a ${largo} salidas, no ${salidas}`)
  }
  const [centro] = repartidas(largoMuro(e, entrada), 1)
  const puertaEntrada: Puerta = { id: 'entrada', tipo: 'entrada', casilla: casillaDelMuro(e, entrada, centro), lado: entrada }
  const salida = (i: number, n: number): Puerta => ({
    id: `salida-${n + 1}`,
    tipo: 'salida',
    casilla: casillaDelMuro(e, orientacion, i),
    lado: orientacion,
  })
  return { ...e, orientacion, puertas: [puertaEntrada, ...repartidas(largo, salidas).map(salida)] }
}
