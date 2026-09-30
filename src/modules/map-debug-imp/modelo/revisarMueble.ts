import type { MapaEnJuego, Mueble } from '../../gamemap'
import type { AccionDeObjeto } from './objeto'

/** Lo que ofrece un mueble de prueba sin revisar al personaje que está a su lado: al hacerlo, queda marcado `revisado` */
export class RevisarMueble implements AccionDeObjeto {
  readonly id: string
  readonly nombre: string
  readonly icono = '🧰'
  #mueble: Mueble
  #mapa: MapaEnJuego

  constructor(mueble: Mueble, mapa: MapaEnJuego) {
    // una acción por mueble: con varios al lado, cada uno la suya
    this.id = `revisar-mueble-${mueble.id}`
    this.nombre = `Revisar ${mueble.nombre}`
    this.#mueble = mueble
    this.#mapa = mapa
  }

  async hacer() {
    const motivo = this.#mapa.marcarFlagMueble(this.#mueble.id, 'revisado')
    if (motivo) throw new Error(motivo)
  }
}
