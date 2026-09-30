import { describe, expect, it } from 'vitest'
import { anadirPersonajesNoJugadores, sitioParaPersonaje } from './apariciones'
import { crearEstancia } from './estancias'
import type { DescripcionPersonajeNoJugador } from './modelo/descripcionPersonaje'
import type { Estancia } from './modelo/estancia'
import type { Mapa } from './modelo/mapa'

/** Sala de 3 × 2 con la columna de la izquierda impasable y el bárbaro en 1,0 */
const sala: Estancia = { ...crearEstancia({ id: 'sala', tipo: 'sala', columnas: 3, filas: 2 }), terrenos: [{ tipo: 'impasable', posicion: { x: 0, y: 0 }, columnas: 1, filas: 2 }] }
const mapa: Mapa = {
  estancias: [sala],
  escuadras: [{ id: 'rojos', nombre: 'Rojos', jugador: 'j1', personajes: [{ id: 'barbaro', nombre: 'Bárbaro', estancia: 'sala', casilla: { x: 1, y: 0 }, turnos: [] }], turnos: [] }],
}
const orco: DescripcionPersonajeNoJugador = { id: 'orco', nombre: 'Orco', imagenVtt: 'orco.png', jugador: 'oscuridad' }
/** Azar que elige siempre la primera casilla libre */
const primera = () => 0

describe('sitio donde aparece un personaje', () => {
  it('en la casilla pedida si está libre', () => {
    expect(sitioParaPersonaje(mapa, sala, { casilla: { x: 2, y: 1 } })).toEqual({ x: 2, y: 1 })
  })

  it('nunca en terreno impasable', () => {
    expect(sitioParaPersonaje(mapa, sala, { casilla: { x: 0, y: 1 } })).toBeUndefined()
  })

  it('nunca encima de otro personaje', () => {
    expect(sitioParaPersonaje(mapa, sala, { casilla: { x: 1, y: 0 } })).toBeUndefined()
  })

  it('al azar, solo entre las casillas libres de la estancia', () => {
    expect([0, 0.5, 0.99].map((n) => sitioParaPersonaje(mapa, sala, {}, () => n))).toEqual([
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ])
  })

  it('al azar dentro de su zona', () => {
    expect(sitioParaPersonaje(mapa, sala, { zona: { posicion: { x: 0, y: 1 }, columnas: 2, filas: 1 } }, primera)).toEqual({ x: 1, y: 1 })
  })
})

describe('añadir personajes no jugadores', () => {
  it('cada uno de su jugador, en la estancia y sin turnos', () => {
    expect(anadirPersonajesNoJugadores(mapa, 'sala', [{ ...orco, casilla: { x: 2, y: 0 } }]).anadidos).toEqual([
      { id: 'orco', nombre: 'Orco', imagenVtt: 'orco.png', estancia: 'sala', casilla: { x: 2, y: 0 }, turnos: [], jugador: 'oscuridad' },
    ])
  })

  it('uno tras otro, sin pisar a los anteriores', () => {
    const { mapa: con } = anadirPersonajesNoJugadores(mapa, 'sala', [orco, { ...orco, id: 'otro-orco' }], primera)
    expect(con.personajesNoJugadores?.map((p) => p.casilla)).toEqual([
      { x: 2, y: 0 },
      { x: 1, y: 1 },
    ])
  })

  it('sin sitio, a la zona de espera', () => {
    const { anadidos } = anadirPersonajesNoJugadores(mapa, 'sala', [{ ...orco, zona: { posicion: { x: 0, y: 0 }, columnas: 1, filas: 2 } }], primera)
    expect(anadidos[0].casilla).toBeUndefined()
  })

  it('no repite ids de personajes del mapa', () => {
    expect(() => anadirPersonajesNoJugadores(mapa, 'sala', [{ ...orco, id: 'barbaro' }])).toThrow('Ya hay un personaje «barbaro» en el mapa')
  })

  it('falla si la estancia no está en el mapa', () => {
    expect(() => anadirPersonajesNoJugadores(mapa, 'cueva', [orco])).toThrow('No hay ninguna estancia «cueva» en el mapa')
  })
})
