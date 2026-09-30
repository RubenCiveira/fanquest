import { describe, expect, it } from 'vitest'
import { esEnemigo, jugadorDe, motivoParaNoCambiarJugadores, postura } from './jugadores'
import type { Jugadores } from './modelo/jugadores'
import type { Mapa } from './modelo/mapa'

const reparto: Jugadores = {
  alianzas: [
    { id: 'heroes', nombre: 'Héroes' },
    { id: 'culto', nombre: 'Culto', posturas: { heroes: 'hostil' } },
  ],
  jugadores: [
    { id: 'ana', nombre: 'Ana', tipo: 'humano', alianza: 'heroes' },
    { id: 'sacerdote', nombre: 'El sacerdote', tipo: 'ia', alianza: 'culto' },
  ],
}
const mapa: Mapa = {
  estancias: [],
  escuadras: [{ id: 'rojos', nombre: 'Rojos', jugador: 'ana', personajes: [{ id: 'barbaro', nombre: 'Bárbaro', estancia: 'sala', turnos: [] }], turnos: [] }],
  personajesNoJugadores: [{ id: 'acolito', nombre: 'Acólito', estancia: 'sala', turnos: [], jugador: 'sacerdote' }],
  jugadores: reparto,
}

describe('jugadores y alianzas', () => {
  it('el jugador de un personaje de escuadra es el de su escuadra', () => {
    expect(jugadorDe(mapa, 'barbaro')?.nombre).toBe('Ana')
  })

  it('el de un personaje no jugador, el suyo', () => {
    expect(jugadorDe(mapa, 'acolito')?.nombre).toBe('El sacerdote')
  })

  it('una alianza es aliada de sí misma', () => {
    expect(postura(mapa, 'heroes', 'heroes')).toBe('aliada')
  })

  it('sin postura, neutral', () => {
    expect(postura(mapa, 'heroes', 'culto')).toBe('neutral')
  })

  it('los personajes de una alianza hostil son enemigos', () => {
    expect(esEnemigo(mapa, 'acolito', 'heroes')).toBe(true)
  })

  it('la postura va en un sentido', () => {
    expect(esEnemigo(mapa, 'barbaro', 'culto')).toBe(false)
  })
})

describe('cambiar el reparto', () => {
  it('vale un reparto con todos los jugadores de la partida', () => {
    expect(motivoParaNoCambiarJugadores(mapa, { ...reparto, alianzas: [...reparto.alianzas, { id: 'nadie', nombre: 'Nadie' }] })).toBeUndefined()
  })

  it('cada jugador tiene que ser de una alianza que exista', () => {
    const perdido = { ...reparto, jugadores: [...reparto.jugadores, { id: 'bruno', nombre: 'Bruno', tipo: 'humano' as const, alianza: 'enanos' }] }
    expect(motivoParaNoCambiarJugadores(mapa, perdido)).toBe('No hay ninguna alianza «enanos» para Bruno')
  })

  it('las posturas son hacia alianzas que existan', () => {
    const mal = { ...reparto, alianzas: [{ id: 'heroes', nombre: 'Héroes', posturas: { orcos: 'hostil' as const } }, reparto.alianzas[1]] }
    expect(motivoParaNoCambiarJugadores(mapa, mal)).toBe('Héroes tiene postura hacia «orcos», que no es ninguna alianza')
  })

  it('no puede quedar sin jugador un personaje del mapa', () => {
    expect(motivoParaNoCambiarJugadores(mapa, { ...reparto, jugadores: reparto.jugadores.slice(0, 1) })).toBe('No hay ningún jugador «sacerdote» para Acólito')
  })

  it('sin ids repetidos', () => {
    expect(motivoParaNoCambiarJugadores(mapa, { ...reparto, jugadores: [...reparto.jugadores, reparto.jugadores[0]] })).toBe('El jugador «ana» está repetido')
  })
})
