import { situar } from './elementos'
import { crearEstancia } from './estancias'
import type { DescripcionEstancia, DescripcionMuro } from './modelo/descripcionEstancia'
import type { Direccion } from './modelo/direccion'
import type { Estancia } from './modelo/estancia'
import type { Puerta } from './modelo/puerta'
import { motivoParaNoAnadirMuro, tramosDe } from './muros'
import { orientar } from './orientacion'
import { motivoParaNoAnadirTerreno } from './terrenos'

/** La estancia con esos muros interiores (con ids `<estancia>-muro-<n>`) y sus puertas interiores, cerradas */
function conMuros(e: Estancia, muros: DescripcionMuro[]): Estancia {
  const conId = muros.map(({ puertas: _puertas, ...muro }, i) => ({ ...muro, id: `${e.id}-muro-${i + 1}` }))
  const puertas = muros.flatMap(({ puertas = [] }, i) => {
    const tramos = tramosDe(conId[i])
    return puertas.map((t): Puerta => ({ id: `${conId[i].id}-puerta-${t + 1}`, tipo: 'interior', ...tramos[t] }))
  })
  return { ...e, muros: conId, puertas: [...e.puertas, ...puertas] }
}

/**
 * Estancia a partir de su descripción: con sus puertas (la entrada en el muro
 * `entrada`, si se entra desde una puerta; si no, en el contrario a la
 * orientación), su terreno, sus muros interiores (con sus puertas, cerradas)
 * y cada elemento en el sitio libre más cercano al centro (fuera del terreno
 * impasable) o, si no cabe, en la zona de espera
 */
export function construirEstancia(
  id: string,
  { tipo, tamano, orientacion, salidas, elementos, muebles = [], terrenos = [], muros = [] }: DescripcionEstancia,
  entrada?: Direccion,
): Estancia {
  const invalido = [...elementos, ...muebles].find(({ columnas, filas }) => ![columnas, filas].every((n) => Number.isInteger(n) && n > 0))
  if (invalido) throw new Error(`«${invalido.nombre}» necesita filas y columnas enteras y positivas`)
  const orientada = orientar(crearEstancia({ id, tipo, ...tamano }), orientacion, salidas, entrada)
  const fuera = [...terrenos.map((t) => motivoParaNoAnadirTerreno(orientada, t)), ...muros.map((m) => motivoParaNoAnadirMuro(tamano, m, m.puertas))].find(Boolean)
  if (fuera) throw new Error(fuera)
  // con el terreno ya puesto, los objetos no caen en el impasable
  const conTerreno = terrenos.length ? { ...orientada, terrenos } : orientada
  const vacia = muros.length ? conMuros(conTerreno, muros) : conTerreno
  return situar(
    vacia,
    [...elementos.map((descripcion, i) => ({ ...descripcion, id: `${id}-elemento-${i + 1}` })), ...muebles],
  )
}
