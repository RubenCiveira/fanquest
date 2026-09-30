import type { Comando, MapaEnJuego, Objeto } from '../../gamemap'

/**
 * Comando que ofrece un objeto de prueba al personaje que está a su lado: al
 * ejecutarlo, el objeto sale de la estancia (en teoría pasa a su inventario)
 */
export class CogerObjeto implements Comando {
  readonly id: string
  readonly nombre: string
  readonly icono = '✋'
  #objeto: Objeto
  #mapa: MapaEnJuego

  constructor(objeto: Objeto, mapa: MapaEnJuego) {
    // un comando por objeto: con varios al lado, cada uno el suyo
    this.id = `coger-objeto-${objeto.id}`
    this.nombre = `Coger ${objeto.nombre}`
    this.#objeto = objeto
    this.#mapa = mapa
  }

  async exec() {
    const motivo = this.#mapa.quitarElemento(this.#objeto.id)
    if (motivo) throw new Error(motivo)
  }
}
