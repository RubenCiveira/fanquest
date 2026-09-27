import { describe, expect, it } from 'vitest'
import { barajar, d6, enResultado, entre, tirar } from './dados'

describe('dados', () => {
  it('entre respeta los límites incluidos', () => {
    const tiradas = Array.from({ length: 500 }, () => entre(6, 7))
    expect(new Set(tiradas)).toEqual(new Set([6, 7]))
  })

  it('d6 da valores de 1 a 6', () => {
    const tiradas = new Set(Array.from({ length: 500 }, d6))
    expect([...tiradas].sort()).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('barajar devuelve una permutación sin tocar el original', () => {
    const original = ['a', 'b', 'c', 'd', 'e']
    const barajada = barajar(original)
    expect([...barajada].sort()).toEqual(original)
  })

  it('tirar entiende la notación de los libros', () => {
    const tiradas = new Set(Array.from({ length: 300 }, () => [tirar('D8'), tirar('2D6'), tirar('1DC')]).flat())
    expect([Math.min(...tiradas), Math.max(...tiradas)]).toEqual([1, 12])
  })

  it('enResultado reconoce rangos, mínimos, alternativas y caras del dado de combate', () => {
    const casos: [string, number][] = [['1-4', 4], ['5', 5], ['4+', 6], ['5 ó 6', 6], ['Escudo negro', 6], ['Calavera', 2]]
    expect(casos.every(([r, v]) => enResultado(r, v)) && !enResultado('1-4', 5) && !enResultado('Escudo blanco', 6)).toBe(true)
  })
})
