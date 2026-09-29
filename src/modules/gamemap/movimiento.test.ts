import { describe, expect, it } from 'vitest'
import { crearEstancia } from './estancias'
import type { Casilla } from './modelo/casilla'
import type { FichaHeroe, Objeto } from './modelo/elemento'
import type { Estancia } from './modelo/estancia'
import type { OpcionesMovimiento } from './modelo/opcionesMovimiento'
import { accionesConsumidas, evaluarRecorrido, extenderRecorrido } from './movimiento'

const barbaro: FichaHeroe = { id: 'barbaro', nombre: 'Bárbaro', tipo: 'heroe', escuadra: 'rojos', columnas: 1, filas: 1, posicion: { x: 0, y: 0 } }
const mesa: Objeto = { id: 'mesa', nombre: 'Mesa', tipo: 'objeto', columnas: 1, filas: 2, posicion: { x: 1, y: 0 } }
const sala = (...elementos: (FichaHeroe | Objeto)[]): Estancia => ({ ...crearEstancia({ id: 'sala', tipo: 'sala', columnas: 12, filas: 4 }), elementos: [barbaro, ...elementos] })

const mover = { id: 'mover', nombre: 'Mover' }
const opciones: OpcionesMovimiento = {
  base: { id: 'mover', nombre: 'Mover', tipo: 'normal', accion: mover, tramos: [{ distancia: 6 }], alejarseDeEnemigos: 1 },
  variaciones: [
    { id: 'cargar', nombre: 'Cargar', tipo: 'carga', accion: { id: 'cargar', nombre: 'Cargar' }, tramos: [{ distancia: 8 }], terminarJuntoAEnemigo: true },
    {
      id: 'deslizar',
      nombre: 'Mover y deslizar',
      tipo: 'normal',
      accion: mover,
      tramos: [{ distancia: 6 }, { distancia: 3, accion: { id: 'deslizar', nombre: 'Deslizar' } }],
      alejarseDeEnemigos: 1,
    },
  ],
}

/** Recorrido en línea recta por la fila 3 desde la casilla de salida (0,0) bajando primero */
const recto = (pasos: number): Casilla[] => [
  { x: 0, y: 0 },
  ...Array.from({ length: Math.min(pasos, 3) }, (_, i) => ({ x: 0, y: i + 1 })),
  ...Array.from({ length: Math.max(0, pasos - 3) }, (_, i) => ({ x: i + 1, y: 3 })),
]

describe('recorrido al arrastrar', () => {
  it('se alarga hasta la casilla junto a la última', () => {
    expect(extenderRecorrido(sala(), barbaro, [{ x: 0, y: 0 }], { x: 0, y: 1 })).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 1 },
    ])
  })

  it('si se salta casillas, las rellena rodeando los objetos', () => {
    expect(extenderRecorrido(sala(mesa), barbaro, [{ x: 0, y: 0 }], { x: 2, y: 0 })).toHaveLength(7)
  })

  it('al volver a una casilla del recorrido, se recorta hasta ella', () => {
    expect(extenderRecorrido(sala(), barbaro, recto(4), { x: 0, y: 2 })).toEqual(recto(2))
  })

  it('a una casilla ocupada por un objeto no se llega', () => {
    expect(extenderRecorrido(sala(mesa), barbaro, [{ x: 0, y: 0 }], { x: 1, y: 1 })).toEqual([{ x: 0, y: 0 }])
  })
})

describe('opciones de movimiento', () => {
  it('hasta su movimiento base, vale la base', () => {
    expect(evaluarRecorrido(sala(), barbaro, recto(6), opciones)).toEqual({ opcion: opciones.base, tramos: [0, 0, 0, 0, 0, 0] })
  })

  it('más allá, vale la primera variación que lo permite: sin enemigos no hay carga, sí deslizar', () => {
    expect(evaluarRecorrido(sala(), barbaro, recto(8), opciones)).toMatchObject({ opcion: { id: 'deslizar' }, tramos: [0, 0, 0, 0, 0, 0, 1, 1] })
  })

  it('más allá de todas las opciones, está demasiado lejos', () => {
    expect(evaluarRecorrido(sala(), barbaro, recto(10), opciones)).toEqual({ motivo: 'Demasiado lejos: 10 casillas y como mucho 9' })
  })

  it('con un enemigo al final del camino, carga', () => {
    expect(evaluarRecorrido(sala(), barbaro, recto(8), opciones, [{ x: 6, y: 2 }])).toMatchObject({ opcion: { id: 'cargar' } })
  })

  it('no puede pasar junto a un enemigo sin cargar', () => {
    expect(evaluarRecorrido(sala(), barbaro, recto(4), opciones, [{ x: 1, y: 1 }])).toEqual({
      motivo: 'Ninguna forma de moverse permite ese recorrido',
    })
  })

  it('no puede atravesar un objeto', () => {
    const porLaMesa = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]
    expect(evaluarRecorrido(sala(mesa), barbaro, porLaMesa, opciones)).toEqual({ motivo: 'El recorrido pasa por donde no se puede' })
  })

  it('pasa por encima de otro héroe, pero no termina encima', () => {
    const enano: FichaHeroe = { ...barbaro, id: 'enano', nombre: 'Enano', posicion: { x: 0, y: 1 } }
    expect(evaluarRecorrido(sala(enano), barbaro, recto(1), opciones)).toEqual({ motivo: 'No se puede terminar encima de Enano' })
  })

  it('el recorrido empieza en la ficha', () => {
    expect(evaluarRecorrido(sala(), barbaro, recto(3).slice(1), opciones)).toEqual({ motivo: 'El recorrido tiene que empezar en Bárbaro' })
  })

  it('mover y deslizar consume las dos acciones', () => {
    const evaluado = evaluarRecorrido(sala(), barbaro, recto(8), opciones)
    expect('opcion' in evaluado && accionesConsumidas(evaluado)).toEqual(['mover', 'deslizar'])
  })

  it('sin llegar al tramo de deslizar, solo consume mover', () => {
    expect(accionesConsumidas({ opcion: opciones.variaciones[1], tramos: [0, 0] })).toEqual(['mover'])
  })
})
