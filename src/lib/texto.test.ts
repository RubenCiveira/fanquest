import { describe, expect, it } from 'vitest'
import { capitalize, rellenar } from './texto'

describe('rellenar', () => {
  it('sustituye los marcadores por sus valores', () => {
    expect(rellenar('{jefe} en {lugar}', { jefe: 'Viper', lugar: 'la cripta' })).toBe('Viper en la cripta')
  })

  it('pone en mayúscula la primera letra con |mayus', () => {
    expect(rellenar('{mecenas|mayus} llega', { mecenas: 'el sacerdote' })).toBe('El sacerdote llega')
  })

  it('deja a la vista los marcadores sin valor', () => {
    expect(rellenar('Salvar a {pnj}', { pnj: null })).toBe('Salvar a {pnj}')
  })

  it('admite números', () => {
    expect(rellenar('{recompensa} mo', { recompensa: 90 })).toBe('90 mo')
  })
})

describe('capitalize', () => {
  it('solo cambia la primera letra', () => {
    expect(capitalize('la posada del Dragón')).toBe('La posada del Dragón')
  })
})
