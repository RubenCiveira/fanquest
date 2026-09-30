import type { MapaEnJuego } from '../../gamemap'
import type { AccionDeObjeto } from './objeto'
import type { PuertaDePrueba } from './puerta'

/** Lo que ofrece una puerta de prueba cerrada al personaje que la pisa: al hacerlo, la puerta se abre en ese mapa */
export class AbrirPuerta implements AccionDeObjeto {
  readonly id = 'abrir-puerta'
  readonly nombre = 'Abrir puerta'
  readonly icono = '🚪'
  #puerta: PuertaDePrueba
  #mapa: MapaEnJuego

  constructor(puerta: PuertaDePrueba, mapa: MapaEnJuego) {
    this.#puerta = puerta
    this.#mapa = mapa
  }

  hacer() {
    return this.#puerta.abrir(this.#mapa)
  }
}
