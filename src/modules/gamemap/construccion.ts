import { situar } from './elementos'
import { crearEstancia } from './estancias'
import type { DescripcionEstancia } from './modelo/descripcionEstancia'
import type { Direccion } from './modelo/direccion'
import type { Estancia } from './modelo/estancia'
import { orientar } from './orientacion'
import { motivoParaNoAnadirTerreno } from './terrenos'

/**
 * Estancia a partir de su descripción: con sus puertas (la entrada en el muro
 * `entrada`, si se entra desde una puerta; si no, en el contrario a la
 * orientación), su terreno y cada elemento en el sitio libre más cercano al
 * centro (fuera del terreno impasable) o, si no cabe, en la zona de espera
 */
export function construirEstancia(
  id: string,
  { tipo, tamano, orientacion, salidas, elementos, terrenos = [] }: DescripcionEstancia,
  entrada?: Direccion,
): Estancia {
  const invalido = elementos.find(({ columnas, filas }) => ![columnas, filas].every((n) => Number.isInteger(n) && n > 0))
  if (invalido) throw new Error(`«${invalido.nombre}» necesita filas y columnas enteras y positivas`)
  const orientada = orientar(crearEstancia({ id, tipo, ...tamano }), orientacion, salidas, entrada)
  const fuera = terrenos.map((t) => motivoParaNoAnadirTerreno(orientada, t)).find(Boolean)
  if (fuera) throw new Error(fuera)
  // con el terreno ya puesto, los objetos no caen en el impasable
  const vacia = terrenos.length ? { ...orientada, terrenos } : orientada
  return situar(
    vacia,
    elementos.map((descripcion, i) => ({ ...descripcion, id: `${id}-elemento-${i + 1}` })),
  )
}
