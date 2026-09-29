import { describe, expect, it } from 'vitest'
import { crearEstancia } from './estancias'
import { orientar } from './orientacion'

const sala = crearEstancia({ id: 'sala', tipo: 'sala', columnas: 7, filas: 4 })

describe('orientación y puertas', () => {
  it('hacia abajo, se entra por el centro del muro de arriba', () => {
    expect(orientar(sala, 'abajo', 0).puertas).toEqual([{ id: 'entrada', tipo: 'entrada', casilla: { x: 3, y: 0 }, lado: 'arriba' }])
  })

  it('hacia abajo, las salidas se reparten por el muro de abajo', () => {
    expect(orientar(sala, 'abajo', 3).puertas.slice(1).map((p) => [p.id, p.casilla, p.lado])).toEqual([
      ['salida-1', { x: 1, y: 3 }, 'abajo'],
      ['salida-2', { x: 3, y: 3 }, 'abajo'],
      ['salida-3', { x: 5, y: 3 }, 'abajo'],
    ])
  })

  it('hacia la izquierda, se entra por el muro de la derecha', () => {
    expect(orientar(sala, 'izquierda', 1).puertas.map((p) => [p.casilla, p.lado])).toEqual([
      [{ x: 6, y: 2 }, 'derecha'],
      [{ x: 0, y: 2 }, 'izquierda'],
    ])
  })

  it('la estancia guarda su orientación', () => {
    expect(orientar(sala, 'arriba', 1).orientacion).toBe('arriba')
  })

  it('no caben más salidas que casillas tiene el muro', () => {
    expect(() => orientar(sala, 'derecha', 5)).toThrow('caben de 0 a 4 salidas')
  })
})
