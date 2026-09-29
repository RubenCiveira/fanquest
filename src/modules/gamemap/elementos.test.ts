import { describe, expect, it } from 'vitest'
import { buscarSitio, colocarElemento, motivoParaNoColocar, situar } from './elementos'
import { anidar, crearEstancia } from './estancias'
import type { Elemento } from './modelo/elemento'
import type { Estancia } from './modelo/estancia'
import { orientar } from './orientacion'

const mesa: Elemento = { id: 'mesa', tipo: 'objeto', nombre: 'Mesa', columnas: 3, filas: 2 }
const sala = (columnas: number, filas: number) => crearEstancia({ id: 'sala', tipo: 'sala', columnas, filas })
const con = (e: Estancia, ...elementos: Elemento[]): Estancia => ({ ...e, elementos })

describe('elementos de una estancia', () => {
  it('un elemento no se sale de la estancia', () => {
    expect(motivoParaNoColocar(sala(4, 3), mesa, { x: 2, y: 0 })).toBe('«Mesa» se sale de «sala»')
  })

  it('un elemento no tapa una puerta', () => {
    expect(motivoParaNoColocar(orientar(sala(3, 4), 'abajo', 0), mesa, { x: 0, y: 0 })).toBe('«Mesa» tapa la puerta «entrada»')
  })

  it('un elemento no pisa una estancia interior', () => {
    const jardin = anidar(sala(6, 6), crearEstancia({ id: 'cobertizo', tipo: 'sala', columnas: 2, filas: 2 }), { x: 4, y: 4 })
    expect(motivoParaNoColocar(jardin, mesa, { x: 3, y: 3 })).toBe('«Mesa» pisa la estancia «cobertizo»')
  })

  it('dos elementos no se solapan', () => {
    const cofre: Elemento = { id: 'cofre', tipo: 'objeto', nombre: 'Cofre', columnas: 1, filas: 1, posicion: { x: 2, y: 1 } }
    expect(motivoParaNoColocar(con(sala(6, 4), cofre), mesa, { x: 0, y: 0 })).toBe('«Mesa» choca con «Cofre»')
  })

  it('busca sitio lo más cerca posible del centro', () => {
    expect(buscarSitio(sala(7, 4), mesa)).toEqual({ x: 2, y: 1 })
  })

  it('si no cabe en ningún sitio, no hay sitio', () => {
    expect(buscarSitio(con(sala(3, 2), { ...mesa, id: 'otra', posicion: { x: 0, y: 0 } }), mesa)).toBeUndefined()
  })

  it('colocar un elemento de la zona de espera le da posición', () => {
    expect(colocarElemento(con(sala(6, 4), mesa), 'mesa', { x: 1, y: 1 }).elementos).toEqual([{ ...mesa, posicion: { x: 1, y: 1 } }])
  })

  it('sin posición, el elemento vuelve a la zona de espera', () => {
    expect(colocarElemento(con(sala(6, 4), { ...mesa, posicion: { x: 1, y: 1 } }), 'mesa').elementos[0].posicion).toBeUndefined()
  })

  it('no se coloca donde no puede ir', () => {
    expect(() => colocarElemento(con(sala(4, 3), mesa), 'mesa', { x: 2, y: 0 })).toThrow('se sale')
  })

  it('situar pone cada elemento sin chocar con los anteriores', () => {
    const cofre: Elemento = { id: 'cofre', tipo: 'objeto', nombre: 'Cofre', columnas: 1, filas: 1 }
    expect(situar(sala(3, 1), [cofre, { ...cofre, id: 'otro' }]).elementos.map((el) => el.posicion)).toEqual([
      { x: 1, y: 0 },
      { x: 0, y: 0 },
    ])
  })

  it('situar deja en la zona de espera lo que no cabe', () => {
    expect(situar(sala(2, 2), [mesa]).elementos[0].posicion).toBeUndefined()
  })
})
