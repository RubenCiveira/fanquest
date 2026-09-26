import { describe, expect, it } from 'vitest'
import { barajar, d6, entre } from './dados'

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
})
