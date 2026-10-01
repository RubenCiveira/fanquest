import { describe, expect, it } from 'vitest'
import { crearEstancia } from './estancias'
import type { Postura } from './modelo/alianza'
import type { Casilla } from './modelo/casilla'
import type { Mapa } from './modelo/mapa'
import type { Personaje } from './modelo/personaje'
import { apoyosDe, estaTrabado } from './zonaDeControl'

const personaje = (id: string, casilla: Casilla): Personaje => ({ id, nombre: id, estancia: 'sala', casilla, turnos: [] })
const barbaro = personaje('barbaro', { x: 2, y: 2 })
/**
 * Sala de 6 × 5 con el bárbaro de Ana (Héroes) en 2,2, más personajes de Ana,
 * de Lía (Elfos, con esa postura hacia los Héroes) y orcos de la Oscuridad
 * (Monstruos, con esa postura hacia los Héroes)
 */
function sala({ deAna = [], deLia = [], orcos = [], elfos = 'aliada', monstruos = 'hostil' }: { deAna?: Personaje[]; deLia?: Personaje[]; orcos?: Personaje[]; elfos?: Postura; monstruos?: Postura }): Mapa {
  return {
    estancias: [crearEstancia({ id: 'sala', tipo: 'sala', columnas: 6, filas: 5 })],
    escuadras: [
      { id: 'rojos', nombre: 'Rojos', jugador: 'ana', personajes: [barbaro, ...deAna], turnos: [] },
      { id: 'verdes', nombre: 'Verdes', jugador: 'lia', personajes: deLia, turnos: [] },
    ],
    personajesNoJugadores: orcos.map((o) => ({ ...o, jugador: 'oscuridad' })),
    jugadores: {
      alianzas: [
        { id: 'heroes', nombre: 'Héroes' },
        { id: 'elfos', nombre: 'Elfos', posturas: { heroes: elfos } },
        { id: 'monstruos', nombre: 'Monstruos', posturas: { heroes: monstruos } },
      ],
      jugadores: [
        { id: 'ana', nombre: 'Ana', tipo: 'humano', alianza: 'heroes' },
        { id: 'lia', nombre: 'Lía', tipo: 'humano', alianza: 'elfos' },
        { id: 'oscuridad', nombre: 'La Oscuridad', tipo: 'ia', alianza: 'monstruos' },
      ],
    },
  }
}

describe('trabado en cuerpo a cuerpo', () => {
  it('en la zona de control de un enemigo, está trabado', () => {
    expect(estaTrabado(sala({ orcos: [personaje('orco', { x: 3, y: 3 })] }), 1, barbaro)).toBe(true)
  })

  it('fuera de ella, no', () => {
    expect(estaTrabado(sala({ orcos: [personaje('orco', { x: 4, y: 2 })] }), 1, barbaro)).toBe(false)
  })

  it('con una zona de control mayor, también más lejos', () => {
    expect(estaTrabado(sala({ orcos: [personaje('orco', { x: 4, y: 2 })] }), 2, barbaro)).toBe(true)
  })

  it('sin zona de control, nunca', () => {
    expect(estaTrabado(sala({ orcos: [personaje('orco', { x: 3, y: 2 })] }), 0, barbaro)).toBe(false)
  })

  it('a su lado alguien que no es enemigo no lo traba', () => {
    expect(estaTrabado(sala({ orcos: [personaje('orco', { x: 3, y: 2 })], monstruos: 'neutral' }), 1, barbaro)).toBe(false)
  })
})

describe('apoyos', () => {
  const ids = (m: Mapa, distancia = 1) => apoyosDe(m, distancia, barbaro).map((p) => p.id)

  it('los de su alianza en su zona de control', () => {
    expect(ids(sala({ deAna: [personaje('enano', { x: 1, y: 1 })] }))).toEqual(['enano'])
  })

  it('los de una alianza aliada de la suya', () => {
    expect(ids(sala({ deLia: [personaje('elfa', { x: 3, y: 2 })] }))).toEqual(['elfa'])
  })

  it('no los de una alianza neutral ni los enemigos', () => {
    expect(ids(sala({ deLia: [personaje('elfa', { x: 3, y: 2 })], elfos: 'neutral', orcos: [personaje('orco', { x: 1, y: 2 })] }))).toEqual([])
  })

  it('no los que están fuera de su zona de control', () => {
    expect(ids(sala({ deAna: [personaje('enano', { x: 4, y: 2 })] }))).toEqual([])
  })

  it('con una zona de control mayor, también los más lejanos', () => {
    expect(ids(sala({ deAna: [personaje('enano', { x: 4, y: 2 })] }), 2)).toEqual(['enano'])
  })
})
