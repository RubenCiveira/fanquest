import { situar } from './elementos'
import { crearEstancia } from './estancias'
import type { DescripcionEstancia } from './modelo/descripcionEstancia'
import type { Estancia } from './modelo/estancia'
import { orientar } from './orientacion'

/**
 * Estancia a partir de su descripción: con sus puertas y cada elemento en
 * el sitio libre más cercano al centro o, si no cabe, en la zona de espera
 */
export function construirEstancia(id: string, { tipo, tamano, orientacion, salidas, elementos }: DescripcionEstancia): Estancia {
  const invalido = elementos.find(({ columnas, filas }) => ![columnas, filas].every((n) => Number.isInteger(n) && n > 0))
  if (invalido) throw new Error(`«${invalido.nombre}» necesita filas y columnas enteras y positivas`)
  const vacia = orientar(crearEstancia({ id, tipo, ...tamano }), orientacion, salidas)
  return situar(
    vacia,
    elementos.map((descripcion, i) => ({ ...descripcion, id: `${id}-elemento-${i + 1}` })),
  )
}
