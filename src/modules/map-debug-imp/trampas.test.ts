import { describe, expect, it } from 'vitest'
import type { Mapa } from '../gamemap'
import { tieneEnemigosActivosEnEstancia } from './trampas'

const base: Mapa = {
  estancias: [{ id: 'sala', tipo: 'sala', columnas: 4, filas: 4, puertas: [], elementos: [], estancias: [] }],
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
  escuadras: [{ id: 'rojos', nombre: 'Rojos', jugador: 'ana', personajes: [{ id: 'barbaro', nombre: 'Bárbaro', estancia: 'sala', casilla: { x: 1, y: 1 }, turnos: [] }], turnos: [] }],
}

describe('trampas del debugger', () => {
  it('detecta enemigos colocados en la misma estancia', () => {
    expect(tieneEnemigosActivosEnEstancia({ ...base, personajesNoJugadores: [{ id: 'orco', nombre: 'Orco', jugador: 'oscuridad', estancia: 'sala', casilla: { x: 2, y: 1 }, turnos: [] }] }, 'barbaro')).toBe(true)
  })

  it('ignora enemigos en espera o en otra estancia', () => {
    expect(tieneEnemigosActivosEnEstancia({ ...base, personajesNoJugadores: [{ id: 'orco', nombre: 'Orco', jugador: 'oscuridad', estancia: 'sala', turnos: [] }] }, 'barbaro')).toBe(false)
  })
})
