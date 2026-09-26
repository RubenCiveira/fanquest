import { fuenteLocal, type FuentePlantillas } from '../../../lib/plantillas'
import { NARRATIVAS, type PlantillaAventuras } from './tipos'

const COLECCION = 'aventuras'

/** Archivo JSON de cada parte y las claves que no pueden faltar */
const ARCHIVOS = {
  jefes: { archivo: 'jefes', claves: [] },
  personajes: { archivo: 'personajes', claves: ['mecenas', 'pnjs', 'perfilesPnj'] },
  lugares: { archivo: 'lugares', claves: ['heroes', 'aventura'] },
  objetos: { archivo: 'objetos', claves: [] },
  titulos: { archivo: 'titulos', claves: [...NARRATIVAS] },
  introducciones: { archivo: 'introducciones', claves: [...NARRATIVAS, 'relleno'] },
  epilogos: {
    archivo: 'epilogos',
    claves: [...NARRATIVAS, 'relleno', 'botinPorDefecto'],
  },
} satisfies Record<keyof PlantillaAventuras, { archivo: string; claves: string[] }>

async function leer(fuente: FuentePlantillas, archivo: string, claves: string[]) {
  const datos = await fuente.leer(COLECCION, archivo)
  if (typeof datos !== 'object' || datos === null) {
    throw new Error(`La plantilla ${archivo}.json no es un objeto JSON`)
  }
  const faltan = claves.filter((clave) => !(clave in datos))
  if (faltan.length) {
    throw new Error(`A la plantilla ${archivo}.json le falta: ${faltan.join(', ')}`)
  }
  return datos
}

async function cargar(fuente: FuentePlantillas): Promise<PlantillaAventuras> {
  const partes = await Promise.all(
    Object.entries(ARCHIVOS).map(async ([parte, { archivo, claves }]) => [
      parte,
      await leer(fuente, archivo, claves),
    ]),
  )
  // la forma de cada parte se ha comprobado en `leer`
  return Object.fromEntries(partes) as PlantillaAventuras
}

const cache = new WeakMap<FuentePlantillas, Promise<PlantillaAventuras>>()

/** Carga (una sola vez por fuente) los textos y elementos del generador */
export function cargarPlantillaAventuras(
  fuente: FuentePlantillas = fuenteLocal,
): Promise<PlantillaAventuras> {
  let plantilla = cache.get(fuente)
  if (!plantilla) {
    plantilla = cargar(fuente)
    // un fallo no se queda en caché: el siguiente intento vuelve a leer
    plantilla.catch(() => cache.delete(fuente))
    cache.set(fuente, plantilla)
  }
  return plantilla
}
