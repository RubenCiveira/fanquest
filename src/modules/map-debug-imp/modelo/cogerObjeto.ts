import type { MapaEnJuego, Objeto } from '../../gamemap'
import type { AccionDeObjeto } from './objeto'

/**
 * Lo que ofrece un objeto de prueba al personaje que está a su lado: al
 * hacerlo, el objeto sale de la estancia (en teoría pasa a su inventario)
 */
export class CogerObjeto implements AccionDeObjeto {
  readonly id: string
  readonly nombre: string
  readonly icono = '✋'
  #objeto: Objeto
  #mapa: MapaEnJuego

  constructor(objeto: Objeto, mapa: MapaEnJuego) {
    // una acción por objeto: con varios al lado, cada uno la suya
    this.id = `coger-objeto-${objeto.id}`
    this.nombre = `Coger ${objeto.nombre}`
    this.#objeto = objeto
    this.#mapa = mapa
  }

  async hacer() {
    const motivo = this.#mapa.quitarElemento(this.#objeto.id)
    if (motivo) throw new Error(motivo)
  }
}
