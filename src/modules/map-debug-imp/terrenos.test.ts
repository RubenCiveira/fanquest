import { describe, expect, it } from 'vitest'
import { terrenosDePrueba } from './terrenos'

describe('terreno de prueba', () => {
  it('en una sala amplia caben los cuatro, uno con imagen', () => {
    expect(terrenosDePrueba({ columnas: 10, filas: 8 }, 'escombros.webp').map((t) => [t.tipo, t.imagen])).toEqual([
      ['dificil', undefined],
      ['muy-dificil', undefined],
      ['impasable', undefined],
      ['dificil', 'escombros.webp'],
    ])
  })

  it('cada uno con la cobertura de su tipo: difícil ligera, muy difícil pesada e impasable bloqueante', () => {
    expect(terrenosDePrueba({ columnas: 10, filas: 8 }).map((t) => [t.tipo, t.cobertura])).toEqual([
      ['dificil', 'ligera'],
      ['muy-dificil', 'pesada'],
      ['impasable', 'bloqueante'],
      ['dificil', 'ligera'],
    ])
  })

  it('no toca los muros, para no tapar puertas', () => {
    const { columnas, filas } = { columnas: 6, filas: 4 }
    expect(terrenosDePrueba({ columnas, filas }).every((t) => t.posicion.x >= 1 && t.posicion.y >= 1 && t.posicion.x + t.columnas < columnas && t.posicion.y + t.filas < filas)).toBe(true)
  })

  it('en una sala pequeña solo pone los que caben sin pisarse', () => {
    expect(terrenosDePrueba({ columnas: 6, filas: 4 }).map((t) => t.tipo)).toEqual(['dificil', 'muy-dificil', 'impasable'])
  })

  it('en un pasillo estrecho no pone ninguno', () => {
    expect(terrenosDePrueba({ columnas: 2, filas: 7 })).toEqual([])
  })

  it('la imagen de los escombros es una de las plantillas', () => {
    expect(terrenosDePrueba({ columnas: 10, filas: 8 }).at(-1)?.imagen).toMatch(/monton-de-escombros/)
  })
})
