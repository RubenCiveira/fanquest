/**
 * Origen de las plantillas. Toda lectura es asíncrona para que una fuente
 * remota pueda sustituir o complementar a la local sin cambiar a quien la usa.
 */
export type FuentePlantillas = {
  /** Lee `templates/<coleccion>/<archivo>.json` */
  leer(coleccion: string, archivo: string): Promise<unknown>
}

// cada JSON queda en su propio chunk y solo se descarga al pedirlo
const locales = import.meta.glob<unknown>('/templates/**/*.json', {
  import: 'default',
})

export const fuenteLocal: FuentePlantillas = {
  async leer(coleccion, archivo) {
    const cargar = locales[`/templates/${coleccion}/${archivo}.json`]
    if (!cargar) {
      throw new Error(`No existe la plantilla ${coleccion}/${archivo}.json`)
    }
    return cargar()
  },
}
