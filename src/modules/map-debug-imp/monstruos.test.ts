import { describe, expect, it } from 'vitest'
import type { Monstruo } from '../../lib/personajes'
import { monstruosDePrueba, monstruosDePruebaDeTipo } from './monstruos'

const orco = { id: 'orco', nombre: 'Orco', imagen: 'imagenes/orco.webp' } as Monstruo
const esqueleto = { id: 'esqueleto', nombre: 'Esqueleto', imagen: 'imagenes/esqueleto.webp' } as Monstruo
const sinImagen = { id: 'sombra', nombre: 'Sombra' } as Monstruo
const mapa = {
  estancias: [],
  personajesNoJugadores: [{ id: 'orco-1', nombre: 'Orco', estancia: 'estancia-1', turnos: [], jugador: 'oscuridad' }],
}

describe('monstruos de prueba', () => {
  it('uno o dos, según el azar', () => {
    expect([monstruosDePrueba([orco], undefined, () => 0).length, monstruosDePrueba([orco], undefined, () => 0.99).length]).toEqual([1, 2])
  })

  it('puede fijar cuántos monstruos crear', () => {
    expect(monstruosDePrueba([orco], undefined, () => 0, 3).map((m) => m.id)).toEqual(['orco-1', 'orco-2', 'orco-3'])
  })

  it('de la Oscuridad, con la imagen de la plantilla', () => {
    expect(monstruosDePrueba([orco], undefined, () => 0)[0]).toMatchObject({ nombre: 'Orco', jugador: 'oscuridad', imagenVtt: expect.stringContaining('monstruos/imagenes/orco.webp') })
  })

  it('solo los que tienen imagen', () => {
    expect(monstruosDePrueba([sinImagen])).toEqual([])
  })

  it('sin repetir ids de los personajes del mapa ni entre ellos', () => {
    expect(monstruosDePrueba([orco], mapa, () => 0.99).map((m) => m.id)).toEqual(['orco-2', 'orco-3'])
  })

  it('sin repetir ids reservados fuera del mapa', () => {
    expect(monstruosDePrueba([orco], undefined, () => 0, 2, ['orco-1']).map((m) => m.id)).toEqual(['orco-2', 'orco-3'])
  })

  it('puede crear monstruos de una plantilla concreta', () => {
    expect(monstruosDePruebaDeTipo([orco, esqueleto], 'esqueleto', undefined, 2).map((m) => m.id)).toEqual(['esqueleto-1', 'esqueleto-2'])
  })
})
