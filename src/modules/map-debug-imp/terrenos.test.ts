import { describe, expect, it } from 'vitest'
import { terrenosDePrueba } from './terrenos'

describe('terreno de prueba', () => {
  it('en una sala amplia caben los cinco, uno con imagen y otro con efecto', () => {
    expect(terrenosDePrueba({ columnas: 10, filas: 8 }, 'escombros.webp').map((t) => [t.tipo, t.imagen, t.efecto])).toEqual([
      ['dificil', undefined, undefined],
      ['muy-dificil', undefined, undefined],
      ['impasable', undefined, undefined],
      ['dificil', undefined, 'lava'],
      ['dificil', 'escombros.webp', undefined],
    ])
  })

  it('la lava lleva una decoración de fondo', () => {
    expect(terrenosDePrueba({ columnas: 10, filas: 8 }).find((t) => t.efecto === 'lava')?.decoracion).toEqual({ fondo: '#d94a1e' })
  })

  it('cada uno con la cobertura de su tipo: difícil ligera, muy difícil pesada e impasable bloqueante', () => {
    expect(terrenosDePrueba({ columnas: 10, filas: 8 }).map((t) => [t.tipo, t.cobertura])).toEqual([
      ['dificil', 'ligera'],
      ['muy-dificil', 'pesada'],
      ['impasable', 'bloqueante'],
      ['dificil', 'ligera'],
      ['dificil', 'ligera'],
    ])
  })

  it('no toca los muros, para no tapar puertas', () => {
    const { columnas, filas } = { columnas: 6, filas: 4 }
    expect(terrenosDePrueba({ columnas, filas }).every((t) => t.posicion.x >= 1 && t.posicion.y >= 1 && t.posicion.x + t.columnas < columnas && t.posicion.y + t.filas < filas)).toBe(true)
  })

  it('en una sala pequeña solo pone los que caben sin pisarse', () => {
    expect(terrenosDePrueba({ columnas: 6, filas: 4 }).map((t) => t.efecto ?? t.tipo)).toEqual(['dificil', 'muy-dificil', 'impasable', 'lava'])
  })

  it('en un pasillo estrecho no pone ninguno', () => {
    expect(terrenosDePrueba({ columnas: 2, filas: 7 })).toEqual([])
  })

  it('la imagen de los escombros es una de las plantillas', () => {
    expect(terrenosDePrueba({ columnas: 10, filas: 8 }).at(-1)?.imagen).toMatch(/monton-de-escombros/)
  })
})
