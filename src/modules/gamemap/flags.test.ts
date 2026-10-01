import { describe, expect, it } from 'vitest'
import { crearEstancia } from './estancias'
import { conFlags, flagsDe } from './flags'
import type { Mapa } from './modelo/mapa'
import type { Personaje } from './modelo/personaje'

const barbaro: Personaje = { id: 'barbaro', nombre: 'Bárbaro', estancia: 'sala', turnos: [] }
/** Sala con una puerta, un cofre y una casa dentro, con una mesa; la escuadra del bárbaro y un orco */
const mapa: Mapa = {
  estancias: [
    {
      ...crearEstancia({ id: 'sala', tipo: 'sala', columnas: 6, filas: 6 }),
      puertas: [{ id: 'puerta', tipo: 'salida', casilla: { x: 5, y: 0 }, lado: 'derecha' }],
      elementos: [{ id: 'cofre', tipo: 'objeto', nombre: 'Cofre', columnas: 1, filas: 1 }],
      estancias: [{ ...crearEstancia({ id: 'casa', tipo: 'sala', columnas: 2, filas: 2 }), elementos: [{ id: 'mesa', tipo: 'mueble', nombre: 'Mesa', columnas: 1, filas: 1 }] }],
    },
  ],
  escuadras: [{ id: 'rojos', nombre: 'Rojos', jugador: 'ana', personajes: [barbaro], turnos: [] }],
  personajesNoJugadores: [{ ...barbaro, id: 'orco', nombre: 'Orco', jugador: 'oscuridad' }],
}
const marcar = (m: Mapa, tipo: Parameters<typeof conFlags>[1], id: string) => conFlags(m, tipo, id, (f) => [...f, 'marcado'])

describe('flags', () => {
  it('sin marcar, ninguna', () => {
    expect(flagsDe(mapa, 'escuadra', 'rojos')).toEqual([])
  })

  it('de algo que no está en el mapa, nada', () => {
    expect(flagsDe(mapa, 'personaje', 'nadie')).toBeUndefined()
  })

  it('el tipo cuenta: una estancia no es un elemento', () => {
    expect(flagsDe(mapa, 'elemento', 'sala')).toBeUndefined()
  })

  it.each([
    ['estancia', 'sala'],
    ['estancia', 'casa'],
    ['escuadra', 'rojos'],
    ['personaje', 'barbaro'],
    ['personaje', 'orco'],
    ['elemento', 'cofre'],
    ['elemento', 'mesa'],
    ['puerta', 'puerta'],
  ] as const)('se marcan en %s «%s»', (tipo, id) => {
    expect(flagsDe(marcar(mapa, tipo, id), tipo, id)).toEqual(['marcado'])
  })

  it('al quitar la última, no queda ninguna', () => {
    const sinNinguna = conFlags(marcar(mapa, 'personaje', 'orco'), 'personaje', 'orco', () => [])
    expect(sinNinguna.personajesNoJugadores?.[0].flags).toBeUndefined()
  })
})
