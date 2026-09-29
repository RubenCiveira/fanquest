import { describe, expect, it } from 'vitest'
import { anidar, crearEstancia, estanciaEn, estanciasDe, motivoParaNoAnidar } from './estancias'

const jardin = crearEstancia({ id: 'jardin', tipo: 'exterior', columnas: 10, filas: 8 })
const sala = (id: string) => crearEstancia({ id, tipo: 'sala', columnas: 3, filas: 2 })

describe('estancias', () => {
  it('una estancia necesita filas y columnas positivas', () => {
    expect(() => crearEstancia({ id: 'nada', tipo: 'sala', columnas: 3, filas: 0 })).toThrow('enteras y positivas')
  })

  it('una estancia nueva no contiene otras', () => {
    expect(sala('salon').estancias).toEqual([])
  })

  it('una sala se anida en el jardín en su posición', () => {
    expect(anidar(jardin, sala('salon'), { x: 2, y: 1 }).estancias).toMatchObject([{ id: 'salon', posicion: { x: 2, y: 1 } }])
  })

  it('una sala no se puede salir del jardín', () => {
    expect(motivoParaNoAnidar(jardin, sala('salon'), { x: 8, y: 0 })).toBe('«salon» se sale de «jardin»')
  })

  it('dos salas no se pueden solapar', () => {
    expect(() => anidar(anidar(jardin, sala('salon'), { x: 2, y: 1 }), sala('cocina'), { x: 4, y: 2 })).toThrow('se solapa con «salon»')
  })

  it('dos salas pueden compartir pared', () => {
    expect(anidar(anidar(jardin, sala('salon'), { x: 2, y: 1 }), sala('cocina'), { x: 5, y: 1 }).estancias).toHaveLength(2)
  })

  it('no se repite el id de una estancia', () => {
    expect(motivoParaNoAnidar(anidar(jardin, sala('salon'), { x: 0, y: 0 }), sala('salon'), { x: 5, y: 5 })).toBe(
      'Ya hay una estancia «salon» en «jardin»',
    )
  })

  const casa = anidar(crearEstancia({ id: 'casa', tipo: 'sala', columnas: 6, filas: 4 }), sala('salon'), { x: 3, y: 2 })
  const finca = anidar(jardin, casa, { x: 2, y: 3 })

  it('la casilla es de la estancia más interior, en sus coordenadas', () => {
    expect(estanciaEn(finca, { x: 6, y: 6 })).toMatchObject({ estancia: { id: 'salon' }, casilla: { x: 1, y: 1 } })
  })

  it('la ruta va de la raíz a la estancia de la casilla', () => {
    expect(estanciaEn(finca, { x: 6, y: 6 })?.ruta.map((e) => e.id)).toEqual(['jardin', 'casa', 'salon'])
  })

  it('fuera de las estancias hijas, la casilla es de la madre', () => {
    expect(estanciaEn(finca, { x: 0, y: 0 })).toMatchObject({ estancia: { id: 'jardin' }, casilla: { x: 0, y: 0 } })
  })

  it('fuera de la raíz no hay estancia', () => {
    expect(estanciaEn(finca, { x: 10, y: 0 })).toBeUndefined()
  })

  it('lista las estancias con su esquina en casillas de la raíz', () => {
    expect(estanciasDe(finca).map(({ estancia, origen }) => [estancia.id, origen])).toEqual([
      ['jardin', { x: 0, y: 0 }],
      ['casa', { x: 2, y: 3 }],
      ['salon', { x: 5, y: 5 }],
    ])
  })
})
