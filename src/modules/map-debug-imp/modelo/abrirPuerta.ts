import type { Comando, MapaEnJuego } from '../../gamemap'
import type { PuertaDePrueba } from './puerta'

/** Comando que ofrece una puerta de prueba cerrada al personaje que la pisa: al ejecutarlo, la puerta se abre en ese mapa */
export class AbrirPuerta implements Comando {
  readonly id = 'abrir-puerta'
  readonly nombre = 'Abrir puerta'
  readonly icono = '🚪'
  #puerta: PuertaDePrueba
  #mapa: MapaEnJuego

  constructor(puerta: PuertaDePrueba, mapa: MapaEnJuego) {
    this.#puerta = puerta
    this.#mapa = mapa
  }

  exec() {
    return this.#puerta.abrir(this.#mapa)
  }
}
