import type { Casilla, Estancia, MapaEnJuego, Puerta, Ubicacion } from '../../gamemap'
import { AbrirPuerta } from './abrirPuerta'
import type { AccionDeObjeto, ObjetoDePrueba } from './objeto'

/**
 * Puerta del mapa de prueba, asociada a una puerta de una estancia por su
 * casilla. No guarda ningún mapa: su estado (abierta o no) y abrirla van sobre
 * el mapa que se le pasa, el del gestor que la está usando
 */
export class PuertaDePrueba implements ObjetoDePrueba {
  readonly tipo: Puerta['tipo']
  #donde: Ubicacion

  constructor(donde: Ubicacion, tipo: Puerta['tipo']) {
    this.#donde = donde
    this.tipo = tipo
  }

  abierta(mapa: MapaEnJuego) {
    return !!mapa.puertaEn(this.#donde)?.abierta
  }

  /** Abre la puerta: el mapa pide la estancia que hay detrás */
  async abrir(mapa: MapaEnJuego) {
    await mapa.abrirPuerta(this.#donde)
  }

  /** Para el personaje que la pisa: abrirla, si es una salida cerrada */
  acciones(mapa: MapaEnJuego): AccionDeObjeto[] {
    return this.tipo === 'salida' && !this.abierta(mapa) ? [new AbrirPuerta(this, mapa)] : []
  }
}

const clave = (estancia: string, { x, y }: Casilla) => `${estancia}:${x},${y}`

/** Puertas de prueba de las estancias creadas, por su estancia y su casilla */
export class PuertasDePrueba {
  #puertas = new Map<string, PuertaDePrueba>()

  /** Asocia una puerta de prueba a cada puerta de la estancia (volver a asociarla no cambia nada) */
  asociar(estancia: Estancia) {
    for (const { casilla, tipo } of estancia.puertas) {
      this.#puertas.set(clave(estancia.id, casilla), new PuertaDePrueba({ estancia: estancia.id, casilla }, tipo))
    }
  }

  /** Puerta de prueba de esa casilla, si la hay */
  en({ estancia, casilla }: Ubicacion) {
    return this.#puertas.get(clave(estancia, casilla))
  }

  /** Los objetos de prueba de esa casilla: su puerta, si la hay */
  objetosEn(ubicacion: Ubicacion): ObjetoDePrueba[] {
    const puerta = this.en(ubicacion)
    return puerta ? [puerta] : []
  }
}
