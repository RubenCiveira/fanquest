import { describe, expect, it } from 'vitest'
import { repartoEnOrden } from './reparto'

const objetivos = [
  { id: 'cerca', vida: 2 },
  { id: 'medio', vida: 1 },
  { id: 'lejos', vida: 3 },
]

describe('reparto del daño de un ataque de escuadra', () => {
  it('a cada uno, en orden, lo que le queda de vida', () => {
    expect(repartoEnOrden(objetivos, 4)).toEqual({ cerca: 2, medio: 1, lejos: 1 })
  })

  it('lo que sobra, al último', () => {
    expect(repartoEnOrden(objetivos, 9)).toEqual({ cerca: 2, medio: 1, lejos: 6 })
  })

  it('sin cuenta de vida, todo al primero que no la lleva', () => {
    expect(repartoEnOrden([{ id: 'sin', vida: undefined }, ...objetivos], 4)).toEqual({ sin: 4, cerca: 0, medio: 0, lejos: 0 })
  })
})
