import { describe, expect, it } from 'vitest'
import type { Mapa } from '../gamemap'
import { JUGADORES_DE_PRUEBA } from './configuracion'
import { iniciativaDePrueba, textoDeIniciativa } from './iniciativa'

const personaje = (id: string) => ({ id, nombre: id, estancia: 'sala', casilla: { x: 0, y: 0 }, turnos: [] })
/** Ana y Bruno con una escuadra cada uno y la Oscuridad con un orco; los Mercenarios, sin nadie */
const partida: Mapa = {
  estancias: [],
  escuadras: [
    { id: 'de-ana', nombre: 'De Ana', jugador: 'ana', personajes: [personaje('barbaro')], turnos: [] },
    { id: 'de-bruno', nombre: 'De Bruno', jugador: 'bruno', personajes: [personaje('enano')], turnos: [] },
  ],
  personajesNoJugadores: [{ ...personaje('orco'), jugador: 'oscuridad' }],
  jugadores: JUGADORES_DE_PRUEBA,
  turno: 1,
}

describe('cartas de iniciativa de prueba', () => {
  it('una carta a cada jugador con algo en el mapa, barajadas; la IA, en su hueco, tantas como héroes menos uno y al final lo que le quede', () => {
    expect(iniciativaDePrueba(partida, () => 0)).toEqual([{ jugador: 'bruno' }, { jugador: 'oscuridad', activaciones: 1 }, { jugador: 'ana' }, { jugador: 'oscuridad' }])
  })

  it('el orden del turno en curso, para leerlo', () => {
    const conOrden = { ...partida, ordenDelTurno: { numero: 1, huecos: [{ jugador: 'bruno' }, { jugador: 'oscuridad', activaciones: 2 }] } }
    expect(textoDeIniciativa(conOrden)).toBe('Bruno, La Oscuridad ×2')
  })

  it('sin orden del turno en curso, nada', () => {
    expect(textoDeIniciativa({ ...partida, ordenDelTurno: { numero: 0, huecos: [] } })).toBeUndefined()
  })
})
