import { numeroDeTurno, turnoDePersonaje, type Accion, type ClaseDePersonaje, type Personaje, type MapaEnJuego, type MovimientoGastado, type OpcionesMovimiento } from '../../gamemap'
import type { PuertasDePrueba } from './puerta'

export const MOVER = { id: 'mover', nombre: 'Mover', icono: '🥾' }
const DESLIZAR = { id: 'deslizar', nombre: 'Deslizar', icono: '💨' }

/** Casillas del movimiento de un personaje de prueba */
const MOVIMIENTO = 6

/**
 * Cómo se mueve un personaje de prueba: 6 casillas sin acercarse a un enemigo,
 * 8 para cargar contra uno o 6 más 3 deslizando (otra acción)
 */
export const MOVIMIENTO_DE_PRUEBA: OpcionesMovimiento = {
  base: { id: 'mover', nombre: 'Mover', tipo: 'normal', accion: MOVER, tramos: [{ distancia: MOVIMIENTO }], alejarseDeEnemigos: 1 },
  variaciones: [
    { id: 'cargar', nombre: 'Cargar', tipo: 'carga', accion: { id: 'cargar', nombre: 'Cargar', icono: '🐂' }, tramos: [{ distancia: 8 }], terminarJuntoAEnemigo: true },
    {
      id: 'mover-y-deslizar',
      nombre: 'Mover y deslizar',
      tipo: 'normal',
      accion: MOVER,
      tramos: [{ distancia: MOVIMIENTO }, { distancia: 3, accion: DESLIZAR }],
      alejarseDeEnemigos: 1,
    },
  ],
}

/**
 * Cómo puede moverse un personaje de prueba tras lo que ya ha movido este turno:
 * sin moverse, `MOVIMIENTO_DE_PRUEBA`; si ya se ha movido, lo que le quede de
 * mover más deslizar 3 (sin cargar); si ya ha deslizado, no puede moverse más
 */
export function movimientoDePrueba({ casillas, acciones }: MovimientoGastado): OpcionesMovimiento | undefined {
  if (acciones.includes(DESLIZAR.id)) return
  if (!casillas) return MOVIMIENTO_DE_PRUEBA
  const quedan = Math.max(0, MOVIMIENTO - casillas)
  const [, deslizar] = MOVIMIENTO_DE_PRUEBA.variaciones
  return {
    base: { ...MOVIMIENTO_DE_PRUEBA.base, tramos: [{ distancia: quedan }] },
    variaciones: [{ ...deslizar, tramos: [{ distancia: quedan }, { distancia: 3, accion: DESLIZAR }] }],
  }
}

/**
 * Clase de un personaje del mapa de prueba: se mueve según `movimientoDePrueba` y,
 * si aún no ha hecho ninguna acción en el turno, ofrece las acciones de los
 * objetos de su casilla (abrir la puerta que pisa…)
 */
export class PersonajeDePrueba implements ClaseDePersonaje {
  readonly id: string
  readonly nombre: string
  readonly imagenVtt?: string
  #puertas: PuertasDePrueba

  constructor({ id, nombre, imagenVtt }: Pick<ClaseDePersonaje, 'id' | 'nombre' | 'imagenVtt'>, puertas: PuertasDePrueba) {
    this.id = id
    this.nombre = nombre
    this.imagenVtt = imagenVtt
    this.#puertas = puertas
  }

  async opcionesMovimiento(_personaje: Personaje, gastado: MovimientoGastado) {
    return movimientoDePrueba(gastado)
  }

  async acciones(personaje: Personaje, mapa: MapaEnJuego): Promise<Accion[]> {
    if (!personaje.casilla || turnoDePersonaje(personaje, numeroDeTurno(mapa.mapa)).acciones.length) return []
    return this.#puertas.objetosEn({ estancia: personaje.estancia, casilla: personaje.casilla }).flatMap((objeto) => objeto.acciones(mapa))
  }
}
