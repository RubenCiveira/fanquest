import { describe, expect, it } from 'vitest'
import { girada, giroDelPaso, girosDe, girosEntre } from './encaramiento'
import type { Casilla } from './modelo/casilla'

const enLinea = (...casillas: [number, number][]): Casilla[] => casillas.map(([x, y]) => ({ x, y }))
const unoPorGiro = { costeGiro: 1, costeGiroDiagonal: 0 }

describe('giros de encaramiento', () => {
  it('a un lado es un giro y darse la vuelta, dos', () => {
    expect([girosEntre('arriba', 'arriba'), girosEntre('arriba', 'derecha'), girosEntre('arriba', 'izquierda'), girosEntre('arriba', 'abajo')]).toEqual([0, 1, 1, 2])
  })

  it('girar a la derecha, a la izquierda o darse la vuelta', () => {
    expect([girada('arriba', 1), girada('arriba', -1), girada('arriba', 2)]).toEqual(['derecha', 'izquierda', 'abajo'])
  })

  it('en recto, gira hasta mirar hacia donde va', () => {
    expect(giroDelPaso({ orientacion: 'arriba', enDiagonal: false }, { x: 0, y: 0 }, { x: 1, y: 0 }, unoPorGiro)).toEqual({ coste: 1, rumbo: { orientacion: 'derecha', enDiagonal: false } })
  })

  it('en una diagonal de delante, no gira', () => {
    expect(giroDelPaso({ orientacion: 'arriba', enDiagonal: false }, { x: 0, y: 0 }, { x: 1, y: -1 }, unoPorGiro)).toEqual({ coste: 0, rumbo: { orientacion: 'arriba', enDiagonal: true } })
  })

  it('en una diagonal de detrás, gira a la orientación más cercana que la tiene delante', () => {
    expect(giroDelPaso({ orientacion: 'arriba', enDiagonal: false }, { x: 0, y: 0 }, { x: 1, y: 1 }, unoPorGiro)).toEqual({ coste: 1, rumbo: { orientacion: 'derecha', enDiagonal: true } })
  })

  it('empezar un tramo en diagonal cuesta el giro a la diagonal; seguir en él, no', () => {
    expect(girosDe(enLinea([0, 0], [1, -1], [2, -2], [2, -3], [3, -4]), { orientacion: 'arriba', costeGiro: 0, costeGiroDiagonal: 1 }).costes).toEqual([1, 0, 0, 1])
  })

  it('al final mira hacia su último paso en recto', () => {
    expect(girosDe(enLinea([0, 0], [0, 1], [1, 1]), { orientacion: 'arriba', ...unoPorGiro })).toEqual({ costes: [2, 1], orientaciones: ['abajo', 'derecha'], orientacion: 'derecha' })
  })
})
