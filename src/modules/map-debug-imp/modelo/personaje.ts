import {
  jugadorDe,
  numeroDeTurno,
  todosLosPersonajes,
  turnoDePersonaje,
  type Ataque,
  type ClaseDePersonaje,
  type Comando,
  type MapaEnJuego,
  type MovimientoGastado,
  type OpcionesMovimiento,
  type Personaje,
  type ResultadoAccion,
} from '../../gamemap'
import { JUGADOR_MONSTRUOS } from '../configuracion'
import { CogerObjeto } from './cogerObjeto'
import type { AccionDeObjeto } from './objeto'
import type { PuertasDePrueba } from './puerta'
import { RevisarMueble } from './revisarMueble'

export const MOVER = { id: 'mover', nombre: 'Mover', icono: '🥾' }

/** Cómo se decide el daño de un ataque (el diálogo del banco de pruebas); se rechaza si se cancela */
export type ResolverAtaque = (ataque: Ataque) => Promise<number>

/** Diálogos del banco de pruebas que usa un personaje: decidir el daño de un ataque y avisar de algo (se resuelve al cerrarlo) */
export type DialogosDePrueba = { resolverAtaque: ResolverAtaque; avisar: (aviso: { titulo: string; texto: string }) => Promise<void> }

/** Un personaje de prueba hace una acción por turno (moverse no cuenta): tras ella, ya no le quedan */
const TRAS_SU_ACCION: ResultadoAccion = { quedanAcciones: false }
const DESLIZAR = { id: 'deslizar', nombre: 'Deslizar', icono: '💨' }

/** Casillas del movimiento de un personaje de prueba */
const MOVIMIENTO = 6

/**
 * Cómo se mueve un personaje de prueba: 6 casillas, 8 para cargar contra un
 * enemigo (la única que entra en su zona de control) o 6 más 3 deslizando
 * (otra acción)
 */
export const MOVIMIENTO_DE_PRUEBA: OpcionesMovimiento = {
  base: { id: 'mover', nombre: 'Mover', tipo: 'normal', accion: MOVER, tramos: [{ distancia: MOVIMIENTO }] },
  variaciones: [
    { id: 'cargar', nombre: 'Cargar', tipo: 'carga', accion: { id: 'cargar', nombre: 'Cargar', icono: '🐂' }, tramos: [{ distancia: 8 }], terminarJuntoAEnemigo: true },
    {
      id: 'mover-y-deslizar',
      nombre: 'Mover y deslizar',
      tipo: 'normal',
      accion: MOVER,
      tramos: [{ distancia: MOVIMIENTO }, { distancia: 3, accion: DESLIZAR }],
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
 * Clase de un personaje del mapa de prueba: se mueve según `movimientoDePrueba`
 * y hace una acción por turno. Ofrece las acciones de los objetos de su
 * casilla (abrir la puerta que pisa…), revisar cada mueble sin revisar y coger
 * cada objeto que tiene al lado, y ataca; si ya no le queda su acción, al
 * intentarlo lo avisa en un diálogo y no la hace
 */
export class PersonajeDePrueba implements ClaseDePersonaje {
  readonly id: string
  readonly nombre: string
  readonly imagenVtt?: string
  readonly vida?: number
  #puertas: PuertasDePrueba
  #dialogos: DialogosDePrueba

  constructor({ id, nombre, imagenVtt, vida }: Pick<ClaseDePersonaje, 'id' | 'nombre' | 'imagenVtt' | 'vida'>, puertas: PuertasDePrueba, dialogos: DialogosDePrueba) {
    this.id = id
    this.nombre = nombre
    this.imagenVtt = imagenVtt
    this.vida = vida
    this.#puertas = puertas
    this.#dialogos = dialogos
  }

  async opcionesMovimiento(_personaje: Personaje, gastado: MovimientoGastado) {
    return movimientoDePrueba(gastado)
  }

  async acciones(personaje: Personaje, mapa: MapaEnJuego): Promise<Comando[]> {
    if (!personaje.casilla) return []
    const alLado = mapa.dameLoQueEstaAlLado(personaje)
    const deObjetos: AccionDeObjeto[] = [
      ...this.#puertas.objetosEn({ estancia: personaje.estancia, casilla: personaje.casilla }).flatMap((objeto) => objeto.acciones(mapa)),
      ...alLado.flatMap((el) => (el.tipo === 'mueble' && !el.flags?.includes('revisado') ? [new RevisarMueble(el, mapa)] : [])),
      ...alLado.flatMap((el) => (el.tipo === 'objeto' ? [new CogerObjeto(el, mapa)] : [])),
    ]
    return deObjetos.map((accion) => ({
      id: accion.id,
      nombre: accion.nombre,
      icono: accion.icono,
      exec: async () => {
        await this.#gastarAccion(mapa)
        await accion.hacer()
        return TRAS_SU_ACCION
      },
    }))
  }

  /**
   * Pinta en la consola lo que el gestor dice del ataque (tipo, distancias,
   * trayectoria con las coberturas que cruza y si el atacante y el objetivo
   * están trabados y con qué apoyos) y, si aún le queda su acción del turno: un monstruo falla
   * siempre contra un héroe (lo avisa en un diálogo); en otro caso, pide el
   * daño del ataque (`resolverAtaque`: el diálogo del banco de pruebas), se lo
   * quita al objetivo y, si se queda sin vida, lo elimina del mapa
   */
  async atacar(ataque: Ataque, mapa: MapaEnJuego): Promise<ResultadoAccion> {
    const { atacante, objetivo, tipo, distancia, recorrido, trayectoria } = ataque
    // banco de pruebas: se ve en la consola qué calcula el gestor de cada ataque
    console.log(`[map-debug] ${atacante.nombre} ataca a ${objetivo.nombre}`, {
      tipo,
      distancia,
      recorrido,
      casillas: trayectoria.casillas.map(({ x, y }) => `${x},${y}`).join(' → '),
      aliados: trayectoria.aliados,
      enemigos: trayectoria.enemigos,
      coberturas: trayectoria.coberturas,
      objetos: trayectoria.objetos,
      muros: trayectoria.muros,
      atacanteTrabado: atacante.estaTrabado(),
      apoyosDelAtacante: atacante.conApoyos().map((p) => p.nombre),
      objetivoTrabado: objetivo.estaTrabado(),
      apoyosDelObjetivo: objetivo.conApoyos().map((p) => p.nombre),
    })
    await this.#gastarAccion(mapa)
    const esMonstruo = (id: string) => jugadorDe(mapa.mapa, id)?.id === JUGADOR_MONSTRUOS
    if (esMonstruo(atacante.id) && !esMonstruo(objetivo.id)) {
      await this.#dialogos.avisar({ titulo: 'Ataque', texto: `${atacante.nombre} ataca a ${objetivo.nombre}: ¡ups, ha fallado!` })
      return TRAS_SU_ACCION
    }
    const motivo = mapa.reducirVida(objetivo.id, await this.#dialogos.resolverAtaque(ataque))
    if (motivo) throw new Error(motivo)
    const vida = todosLosPersonajes(mapa.mapa).find((p) => p.id === objetivo.id)?.vida
    if (vida !== undefined && vida <= 0) mapa.eliminarPersonaje(objetivo.id)
    return TRAS_SU_ACCION
  }

  /**
   * Comprueba, con su estado de ahora en el mapa, que aún le queda su acción
   * del turno; si no, lo avisa en un diálogo y, al cerrarlo, se cancela (la
   * acción no se hace ni se apunta)
   */
  async #gastarAccion(mapa: MapaEnJuego) {
    const yo = todosLosPersonajes(mapa.mapa).find((p) => p.id === this.id)
    if (!yo || !turnoDePersonaje(yo, numeroDeTurno(mapa.mapa)).acciones.length) return
    await this.#dialogos.avisar({ titulo: 'Sin acciones', texto: `${this.nombre} ya ha hecho su acción de este turno.` })
    throw new DOMException(`${this.nombre} no tiene acciones`, 'AbortError')
  }
}
