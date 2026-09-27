/**
 * Origen de las plantillas. Toda lectura es asíncrona para que una fuente
 * remota pueda sustituir o complementar a la local sin cambiar a quien la usa.
 */
export type FuentePlantillas = {
  /** Lee `templates/<coleccion>/<archivo>.json` */
  leer(coleccion: string, archivo: string): Promise<unknown>
  /** URL de un recurso (imagen) de `templates/<coleccion>/<ruta>` */
  url(coleccion: string, ruta: string): string | undefined
}

// cada JSON queda en su propio chunk y solo se descarga al pedirlo
const locales = import.meta.glob<unknown>('/templates/**/*.json', {
  import: 'default',
})

// las imágenes se publican como archivos aparte; aquí solo sus URL
const recursos = import.meta.glob<string>('/templates/**/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
})

/** Carga una sola vez por fuente; si falla, se reintenta en la siguiente llamada */
export function cachePorFuente<T>(cargar: (fuente: FuentePlantillas) => Promise<T>) {
  const cache = new WeakMap<FuentePlantillas, Promise<T>>()
  return (fuente: FuentePlantillas = fuenteLocal): Promise<T> => {
    let valor = cache.get(fuente)
    if (!valor) {
      valor = cargar(fuente)
      valor.catch(() => cache.delete(fuente))
      cache.set(fuente, valor)
    }
    return valor
  }
}

export const fuenteLocal: FuentePlantillas = {
  async leer(coleccion, archivo) {
    const cargar = locales[`/templates/${coleccion}/${archivo}.json`]
    if (!cargar) {
      throw new Error(`No existe la plantilla ${coleccion}/${archivo}.json`)
    }
    return cargar()
  },
  url(coleccion, ruta) {
    return recursos[`/templates/${coleccion}/${ruta}`]
  },
}
