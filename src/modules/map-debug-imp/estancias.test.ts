import { describe, expect, it } from 'vitest'
import { estanciaEn } from '../gamemap'
import { jardinConCasa } from './estancias'

describe('mapa de pruebas', () => {
  it('la casa está en medio del jardín', () => {
    expect(estanciaEn(jardinConCasa(), { x: 8, y: 6 })?.estancia.id).toBe('despensa')
  })
})
