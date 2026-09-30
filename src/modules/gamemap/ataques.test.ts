import { describe, expect, it } from 'vitest'
import { conVidaReducida, enemigoEn, medirAtaque, sinPersonaje } from './ataques'
import { crearEstancia } from './estancias'
import type { Casilla } from './modelo/casilla'
import type { Objeto } from './modelo/elemento'
import type { Mapa } from './modelo/mapa'
import type { Personaje } from './modelo/personaje'
import type { Postura } from './modelo/alianza'

const barbaro: Personaje = { id: 'barbaro', nombre: 'Bárbaro', estancia: 'sala', casilla: { x: 1, y: 1 }, vida: 8, turnos: [] }
/** Sala de 6 × 3 con el bárbaro de Ana (Héroes) en 1,1 y un orco de la Oscuridad (Monstruos, con esa postura hacia los Héroes) */
const sala = (orco: Casilla, haciaHeroes: Postura = 'hostil', objetos: Objeto[] = []): Mapa => ({
  estancias: [{ ...crearEstancia({ id: 'sala', tipo: 'sala', columnas: 6, filas: 3 }), elementos: objetos }],
  escuadras: [{ id: 'rojos', nombre: 'Rojos', jugador: 'ana', personajes: [barbaro], turnos: [] }],
  personajesNoJugadores: [{ id: 'orco', nombre: 'Orco', estancia: 'sala', casilla: orco, vida: 3, turnos: [], jugador: 'oscuridad' }],
  jugadores: {
    alianzas: [
      { id: 'heroes', nombre: 'Héroes' },
      { id: 'monstruos', nombre: 'Monstruos', posturas: { heroes: haciaHeroes } },
    ],
    jugadores: [
      { id: 'ana', nombre: 'Ana', tipo: 'humano', alianza: 'heroes' },
      { id: 'oscuridad', nombre: 'La Oscuridad', tipo: 'ia', alianza: 'monstruos' },
    ],
  },
})
const orcoDe = (m: Mapa) => m.personajesNoJugadores?.[0] ?? barbaro
const medir = (m: Mapa) => medirAtaque(m, barbaro, orcoDe(m))

describe('enemigo bajo el puntero', () => {
  it('el enemigo que está en esa casilla', () => {
    expect(enemigoEn(sala({ x: 4, y: 1 }), 'barbaro', { x: 4, y: 1 })?.id).toBe('orco')
  })

  it('uno que no es enemigo no cuenta', () => {
    expect(enemigoEn(sala({ x: 4, y: 1 }, 'neutral'), 'barbaro', { x: 4, y: 1 })).toBeUndefined()
  })

  it('la casilla vacía, nadie', () => {
    expect(enemigoEn(sala({ x: 4, y: 1 }), 'barbaro', { x: 3, y: 1 })).toBeUndefined()
  })
})

describe('tipo de ataque', () => {
  it('pegado, cuerpo a cuerpo', () => {
    expect(medir(sala({ x: 2, y: 1 }))).toEqual({ tipo: 'cuerpo-a-cuerpo', distancia: 1 })
  })

  it('pegado en diagonal, también cuerpo a cuerpo', () => {
    expect(medir(sala({ x: 2, y: 2 }))).toEqual({ tipo: 'cuerpo-a-cuerpo', distancia: 1 })
  })

  it('en diagonal con la esquina tapada por dos objetos, a distancia', () => {
    const objetos: Objeto[] = [
      { id: 'c1', tipo: 'objeto', nombre: 'c1', columnas: 1, filas: 1, posicion: { x: 2, y: 1 } },
      { id: 'c2', tipo: 'objeto', nombre: 'c2', columnas: 1, filas: 1, posicion: { x: 1, y: 2 } },
    ]
    expect(medir(sala({ x: 2, y: 2 }, 'hostil', objetos))?.tipo).toBe('distancia')
  })

  it('lejos, a distancia, contando las casillas en recto o en diagonal', () => {
    expect(medir(sala({ x: 5, y: 2 }))).toEqual({ tipo: 'distancia', distancia: 4 })
  })
})

describe('vida', () => {
  it('se reduce en esos puntos', () => {
    expect(orcoDe(conVidaReducida(sala({ x: 4, y: 1 }), 'orco', 2)).vida).toBe(1)
  })

  it('no baja de cero', () => {
    expect(orcoDe(conVidaReducida(sala({ x: 4, y: 1 }), 'orco', 9)).vida).toBe(0)
  })

  it('también la de los personajes de escuadra', () => {
    expect(conVidaReducida(sala({ x: 4, y: 1 }), 'barbaro', 3).escuadras?.[0].personajes[0].vida).toBe(5)
  })

  it('quitar a un personaje no jugador del mapa', () => {
    expect(sinPersonaje(sala({ x: 4, y: 1 }), 'orco').personajesNoJugadores).toEqual([])
  })

  it('quitar a un personaje de su escuadra', () => {
    expect(sinPersonaje(sala({ x: 4, y: 1 }), 'barbaro').escuadras?.[0].personajes).toEqual([])
  })
})
