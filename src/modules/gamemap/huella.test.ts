import { describe, expect, it } from 'vitest'
import { anadirPersonajesNoJugadores } from './apariciones'
import { enemigoEn, medirAtaque } from './ataques'
import { crearEstancia } from './estancias'
import { dimensionesDe, huella, huellaEnElMapa } from './huella'
import type { Mapa } from './modelo/mapa'
import type { Objeto } from './modelo/elemento'
import type { OpcionesMovimiento } from './modelo/opcionesMovimiento'
import type { Personaje } from './modelo/personaje'
import type { PersonajeNoJugador } from './modelo/personajeNoJugador'
import { casillasDeEnemigos, evaluarRecorrido, sePuedePasar } from './movimiento'
import { trabadoPor } from './zonaDeControl'

const barbaro: Personaje = { id: 'barbaro', nombre: 'Bárbaro', estancia: 'sala', casilla: { x: 0, y: 0 }, turnos: [] }
/** Un ogro de 2 × 2 de la Oscuridad con su esquina en 4,1: ocupa 4,1, 5,1, 4,2 y 5,2 */
const ogro: PersonajeNoJugador = { id: 'ogro', nombre: 'Ogro', estancia: 'sala', casilla: { x: 4, y: 1 }, largo: 2, ancho: 2, turnos: [], jugador: 'oscuridad' }
/** Sala de 8 × 4 con el bárbaro de Ana (Héroes) en 0,0 y el ogro, hostiles entre sí; y esos objetos */
const sala = (otros: Partial<Personaje> = {}, objetos: Objeto[] = []): Mapa => ({
  estancias: [{ ...crearEstancia({ id: 'sala', tipo: 'sala', columnas: 8, filas: 4 }), elementos: objetos }],
  escuadras: [{ id: 'rojos', nombre: 'Rojos', jugador: 'ana', personajes: [{ ...barbaro, ...otros }], turnos: [] }],
  personajesNoJugadores: [ogro],
  jugadores: {
    alianzas: [
      { id: 'heroes', nombre: 'Héroes', posturas: { monstruos: 'hostil' } },
      { id: 'monstruos', nombre: 'Monstruos', posturas: { heroes: 'hostil' } },
    ],
    jugadores: [
      { id: 'ana', nombre: 'Ana', tipo: 'humano', alianza: 'heroes' },
      { id: 'oscuridad', nombre: 'La Oscuridad', tipo: 'ia', alianza: 'monstruos' },
    ],
  },
})
const enFila = (...xs: number[]) => xs.map((x) => ({ x, y: 0 }))
const mover: OpcionesMovimiento = { base: { id: 'mover', nombre: 'Mover', tipo: 'normal', accion: { id: 'mover', nombre: 'Mover', icono: '🥾' }, tramos: [{ distancia: 6 }] }, variaciones: [] }

describe('huella de un personaje', () => {
  it('su largo va hacia donde mira: mirando arriba, en filas', () => {
    expect(dimensionesDe({ largo: 2, ancho: 1, orientacion: 'arriba' })).toEqual({ columnas: 1, filas: 2 })
  })

  it('mirando a un lado, en columnas', () => {
    expect(dimensionesDe({ largo: 2, ancho: 1, orientacion: 'derecha' })).toEqual({ columnas: 2, filas: 1 })
  })

  it('sin tamaño, una casilla', () => {
    expect(huella({ x: 3, y: 1 }, {})).toEqual([{ x: 3, y: 1 }])
  })

  it('las casillas que ocupa, desde su esquina superior izquierda', () => {
    expect(huellaEnElMapa(sala(), ogro)).toEqual([
      { x: 4, y: 1 },
      { x: 5, y: 1 },
      { x: 4, y: 2 },
      { x: 5, y: 2 },
    ])
  })
})

describe('personajes de varias casillas en el mapa', () => {
  it('el enemigo está en cualquiera de las casillas que ocupa', () => {
    expect(enemigoEn(sala(), 'barbaro', { x: 5, y: 2 })?.id).toBe('ogro')
  })

  it('sus enemigos ven todas sus casillas', () => {
    expect(casillasDeEnemigos(sala(), 'barbaro')).toHaveLength(4)
  })

  it('en contacto con cualquiera de sus casillas, se le ataca cuerpo a cuerpo', () => {
    const reglas = { medicionMovimiento: 'ortogonal', terrenoPersonajes: 'normal', cuerpoACuerpo: 'ortogonal' } as const
    expect(medirAtaque(sala({ casilla: { x: 6, y: 2 } }), reglas, { ...barbaro, casilla: { x: 6, y: 2 } }, ogro)).toMatchObject({ tipo: 'cuerpo-a-cuerpo', distancia: 1 })
  })

  it('la distancia de un ataque va a su casilla más cercana', () => {
    const reglas = { medicionMovimiento: 'ortogonal', terrenoPersonajes: 'normal', cuerpoACuerpo: 'diagonal' } as const
    expect(medirAtaque(sala(), reglas, barbaro, ogro)?.distancia).toBe(5)
  })

  it('traba desde cualquiera de sus casillas', () => {
    expect(trabadoPor(sala({ casilla: { x: 6, y: 3 } }), 1, { ...barbaro, casilla: { x: 6, y: 3 } }).map((p) => p.id)).toEqual(['ogro'])
  })

  it('no se puede terminar un movimiento encima de ninguna de sus casillas', () => {
    expect(evaluarRecorrido(sala({ casilla: { x: 5, y: 0 } }), { ...barbaro, casilla: { x: 5, y: 0 } }, [{ x: 5, y: 0 }, { x: 5, y: 1 }], mover)).toEqual({ motivo: 'No se puede terminar encima de Ogro' })
  })

  it('al aparecer, no se pisa con otro', () => {
    const conLeon = anadirPersonajesNoJugadores(sala(), 'sala', [{ id: 'leon', nombre: 'León', jugador: 'oscuridad', largo: 2, ancho: 1, casilla: { x: 4, y: 0 } }]).mapa
    // mirando arriba, el león ocuparía 4,0 y 4,1, que es del ogro: se queda en la zona de espera
    expect(conLeon.personajesNoJugadores?.find((p) => p.id === 'leon')?.casilla).toBeUndefined()
  })

  it('al aparecer, guarda su tamaño (lo que es 1, no hace falta)', () => {
    const conLeon = anadirPersonajesNoJugadores(sala(), 'sala', [{ id: 'leon', nombre: 'León', jugador: 'oscuridad', largo: 2, ancho: 1, casilla: { x: 1, y: 2 } }]).mapa
    const { casilla, largo, ancho } = conLeon.personajesNoJugadores?.find((p) => p.id === 'leon') ?? ogro
    expect({ casilla, largo, ancho }).toEqual({ casilla: { x: 1, y: 2 }, largo: 2, ancho: undefined })
  })
})

describe('moverse ocupando varias casillas', () => {
  /** Dos objetos en la fila 1 (columnas 2 y 4) dejan un hueco de una casilla en la 3 */
  const conHueco = sala({}, [
    { id: 'a', tipo: 'objeto', nombre: 'a', columnas: 1, filas: 1, posicion: { x: 2, y: 1 } },
    { id: 'b', tipo: 'objeto', nombre: 'b', columnas: 1, filas: 2, posicion: { x: 4, y: 0 } },
  ])
  const grande = { tamano: { largo: 2, ancho: 2 } }

  it('una sola casilla pasa por un hueco de una', () => {
    expect(sePuedePasar(conHueco, { x: 3, y: 0 }, { x: 3, y: 1 })).toBe(true)
  })

  it('ocupando 2 × 2 no cabe por él', () => {
    expect(sePuedePasar(conHueco, { x: 2, y: 2 }, { x: 2, y: 1 }, 'ortogonal', grande)).toBe(false)
  })

  it('ocupando 2 × 2 avanza si todas sus casillas pueden', () => {
    expect(sePuedePasar(sala(), { x: 0, y: 2 }, { x: 1, y: 2 }, 'ortogonal', grande)).toBe(true)
  })

  it('al girar, las casillas nuevas de su huella tienen que estar libres', () => {
    // un león (2 × 1) que mira arriba en 3,0 (ocupa 3,0 y 3,1) gira a la derecha al avanzar a 3,0: ocuparía 3,0 y 4,0, donde está el objeto b
    expect(sePuedePasar(conHueco, { x: 3, y: 1 }, { x: 3, y: 0 }, 'ortogonal', { tamano: { largo: 2, ancho: 1 } }, ['arriba', 'derecha'])).toBe(false)
  })

  it('en un recorrido, pasa lo de todas sus casillas', () => {
    expect(evaluarRecorrido(sala({ largo: 2, ancho: 2 }), { ...barbaro, largo: 2, ancho: 2 }, enFila(0, 1, 2), mover)).toMatchObject({ opcion: { id: 'mover' } })
  })
})
