import { describe, expect, it } from 'vitest'
import { construirEstancia } from './construccion'
import { crearEstancia } from './estancias'
import type { Casilla } from './modelo/casilla'
import type { Mapa } from './modelo/mapa'
import type { Personaje } from './modelo/personaje'
import type { Terreno } from './modelo/terreno'
import type { OpcionesMovimiento } from './modelo/opcionesMovimiento'
import { costeDe, evaluarRecorrido, ruta } from './movimiento'
import { factorDeTerreno, terrenoEn } from './terrenos'

const barro: Terreno = { tipo: 'dificil', posicion: { x: 1, y: 0 }, columnas: 1, filas: 3 }
const zarzas: Terreno = { tipo: 'muy-dificil', posicion: { x: 3, y: 0 }, columnas: 1, filas: 1 }
const muro: Terreno = { tipo: 'impasable', posicion: { x: 2, y: 1 }, columnas: 1, filas: 2 }
const estancia = { ...crearEstancia({ id: 'sala', tipo: 'sala', columnas: 6, filas: 3 }), terrenos: [barro, zarzas, muro] }
const barbaro: Personaje = { id: 'barbaro', nombre: 'Bárbaro', estancia: 'sala', casilla: { x: 0, y: 0 }, turnos: [] }
const mapa: Mapa = { estancias: [estancia], escuadras: [{ id: 'rojos', nombre: 'Rojos', personajes: [barbaro], turnos: [] }] }
const mover = { id: 'mover', nombre: 'Mover', icono: '🥾' }
const seis: OpcionesMovimiento = { base: { id: 'mover', nombre: 'Mover', tipo: 'normal', accion: mover, tramos: [{ distancia: 6 }] }, variaciones: [] }
/** Por la fila de arriba de 0,0 a x,0 */
const porArriba = (hasta: number): Casilla[] => Array.from({ length: hasta + 1 }, (_, x) => ({ x, y: 0 }))

describe('terrenos', () => {
  it('cada casilla tiene el terreno que la cubre', () => {
    expect([terrenoEn(estancia, { x: 1, y: 2 })?.tipo, terrenoEn(estancia, { x: 0, y: 0 })]).toEqual(['dificil', undefined])
  })

  it('entrar en terreno difícil cuesta dos, en muy difícil tres, e impasable no se puede', () => {
    expect([{ x: 0, y: 0 }, barro.posicion, zarzas.posicion, muro.posicion].map((c) => factorDeTerreno(estancia, c))).toEqual([1, 2, 3, Number.POSITIVE_INFINITY])
  })

  it('el coste del recorrido suma lo que cuesta entrar en cada casilla', () => {
    // 0,0 → barro (2) → normal (1) → zarzas (3)
    expect(costeDe(mapa, porArriba(3))).toBe(6)
  })

  it('por Pitágoras, una diagonal a terreno difícil cuesta el doble de √2', () => {
    expect(costeDe(mapa, [{ x: 0, y: 0 }, { x: 1, y: 1 }], 'euclidea')).toBe(3)
  })

  it('el terreno impasable no se pisa', () => {
    expect(evaluarRecorrido(mapa, barbaro, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }], seis)).toEqual({ motivo: 'El recorrido pasa por donde no se puede' })
  })

  it('las opciones se miden con el coste del terreno', () => {
    expect(evaluarRecorrido(mapa, barbaro, porArriba(4), seis)).toEqual({ motivo: 'Demasiado lejos: 7 casillas y como mucho 6' })
  })

  it('la ruta evita el terreno caro si rodeando sale más barato', () => {
    // a 0,2 recto: dos casillas normales; la ruta no se mete en el barro de 1,x
    expect(ruta(mapa, { x: 0, y: 0 }, { x: 0, y: 2 })).toEqual([{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }])
  })

  it('la ruta no atraviesa el impasable y se lo rodea', () => {
    const camino = ruta(mapa, { x: 1, y: 2 }, { x: 3, y: 2 }) ?? []
    expect([camino.some((c) => c.x === 2 && c.y > 0), camino.at(-1)]).toEqual([false, { x: 3, y: 2 }])
  })

  it('al construir la estancia, su terreno viene en la descripción', () => {
    const construida = construirEstancia('e1', { tipo: 'sala', tamano: { columnas: 6, filas: 3 }, orientacion: 'abajo', salidas: 0, elementos: [], terrenos: [muro] })
    expect(construida.terrenos).toEqual([muro])
  })

  it('un terreno que se sale de la estancia no se puede construir', () => {
    const fuera = { ...muro, posicion: { x: 5, y: 2 } }
    expect(() => construirEstancia('e1', { tipo: 'sala', tamano: { columnas: 6, filas: 3 }, orientacion: 'abajo', salidas: 0, elementos: [], terrenos: [fuera] })).toThrow('se sale')
  })

  it('los objetos no se colocan en terreno impasable', () => {
    const todoMuro = { ...muro, posicion: { x: 0, y: 0 }, columnas: 6, filas: 2 }
    const construida = construirEstancia('e1', {
      tipo: 'sala',
      tamano: { columnas: 6, filas: 3 },
      orientacion: 'abajo',
      salidas: 0,
      elementos: [{ tipo: 'objeto', nombre: 'Cofre', columnas: 1, filas: 1 }],
      terrenos: [todoMuro],
    })
    expect(construida.elementos[0].posicion?.y).toBe(2)
  })
})
