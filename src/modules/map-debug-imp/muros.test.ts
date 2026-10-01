import { describe, expect, it } from 'vitest'
import { murosDePrueba } from './muros'

describe('muro de prueba', () => {
  it('vertical por el medio, con un paso arriba y una puerta a media altura', () => {
    expect(murosDePrueba({ columnas: 6, filas: 4 })).toEqual([{ desde: { x: 3, y: 0 }, hasta: { x: 3, y: 4 }, pasos: [0], puertas: [2], cobertura: 'ligera' }])
  })

  it('en una sala demasiado pequeña, ninguno', () => {
    expect(murosDePrueba({ columnas: 1, filas: 4 })).toEqual([])
  })
})
