import { describe, expect, it } from 'vitest'
import { construirEstancia } from './construccion'
import type { DescripcionEstancia } from './modelo/descripcionEstancia'

const descripcion: DescripcionEstancia = {
  tipo: 'sala',
  tamano: { columnas: 6, filas: 4 },
  orientacion: 'abajo',
  salidas: 2,
  elementos: [{ tipo: 'objeto', nombre: 'Mesa', columnas: 3, filas: 2 }],
}

describe('construir una estancia', () => {
  it('toma tipo y tamaño de la descripción', () => {
    expect(construirEstancia('e1', descripcion)).toMatchObject({ id: 'e1', tipo: 'sala', columnas: 6, filas: 4 })
  })

  it('pone la entrada y las salidas según la orientación', () => {
    expect(construirEstancia('e1', descripcion).puertas.map((p) => p.lado)).toEqual(['arriba', 'abajo', 'abajo'])
  })

  it('da id a cada elemento y le busca sitio', () => {
    expect(construirEstancia('e1', descripcion).elementos).toEqual([
      { id: 'e1-elemento-1', tipo: 'objeto', nombre: 'Mesa', columnas: 3, filas: 2, posicion: { x: 1, y: 1 } },
    ])
  })

  it('lo que no cabe queda en la zona de espera', () => {
    const grande = { ...descripcion, elementos: [{ tipo: 'objeto' as const, nombre: 'Tumba', columnas: 8, filas: 1 }] }
    expect(construirEstancia('e1', grande).elementos[0].posicion).toBeUndefined()
  })

  it('un elemento necesita un tamaño válido', () => {
    const roto = { ...descripcion, elementos: [{ tipo: 'objeto' as const, nombre: 'Nada', columnas: 0, filas: 1 }] }
    expect(() => construirEstancia('e1', roto)).toThrow('«Nada» necesita filas y columnas')
  })
})
