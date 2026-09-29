import { describe, expect, it } from 'vitest'
import { crearEstancia } from './estancias'
import type { Casilla } from './modelo/casilla'
import type { FichaHeroe, Objeto } from './modelo/elemento'
import type { Mapa } from './modelo/mapa'
import type { OpcionesMovimiento } from './modelo/opcionesMovimiento'
import { accionesConsumidas, evaluarRecorrido, extenderRecorrido, mover as moverFicha } from './movimiento'
import { orientar } from './orientacion'

const barbaro: FichaHeroe = { id: 'barbaro', nombre: 'Bárbaro', tipo: 'heroe', escuadra: 'rojos', columnas: 1, filas: 1, posicion: { x: 0, y: 0 } }
const mesa: Objeto = { id: 'mesa', nombre: 'Mesa', tipo: 'objeto', columnas: 1, filas: 2, posicion: { x: 1, y: 0 } }
const sala = (...elementos: (FichaHeroe | Objeto)[]): Mapa => ({
  estancias: [{ ...crearEstancia({ id: 'sala', tipo: 'sala', columnas: 12, filas: 4 }), elementos: [barbaro, ...elementos] }],
})

const mover = { id: 'mover', nombre: 'Mover', icono: '🥾' }
const opciones: OpcionesMovimiento = {
  base: { id: 'mover', nombre: 'Mover', tipo: 'normal', accion: mover, tramos: [{ distancia: 6 }], alejarseDeEnemigos: 1 },
  variaciones: [
    { id: 'cargar', nombre: 'Cargar', tipo: 'carga', accion: { id: 'cargar', nombre: 'Cargar', icono: '🐂' }, tramos: [{ distancia: 8 }], terminarJuntoAEnemigo: true },
    {
      id: 'deslizar',
      nombre: 'Mover y deslizar',
      tipo: 'normal',
      accion: mover,
      tramos: [{ distancia: 6 }, { distancia: 3, accion: { id: 'deslizar', nombre: 'Deslizar', icono: '💨' } }],
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

describe('cruzar puertas', () => {
  // la sala de 3 × 3 en 0,0 tiene su salida abajo en 1,2; el pasillo de 3 × 4 está pegado debajo, con su entrada arriba en 1,0 (1,3 del mapa)
  const salaConSalida = (abierta: boolean): Mapa => {
    const arriba = orientar(crearEstancia({ id: 'arriba', tipo: 'sala', columnas: 3, filas: 3 }), 'abajo', 1)
    const abajo = orientar(crearEstancia({ id: 'abajo', tipo: 'pasillo', columnas: 3, filas: 4 }), 'abajo', 0)
    return {
      estancias: [
        { ...arriba, elementos: [{ ...barbaro, posicion: { x: 1, y: 1 } }], puertas: arriba.puertas.map((p) => (p.tipo === 'salida' ? { ...p, abierta } : p)) },
        { ...abajo, posicion: { x: 0, y: 3 } },
      ],
    }
  }
  const porLaPuerta = [
    { x: 1, y: 1 },
    { x: 1, y: 2 },
    { x: 1, y: 3 },
    { x: 1, y: 4 },
  ]

  it('con la puerta abierta, el recorrido pasa a la estancia de al lado', () => {
    expect(evaluarRecorrido(salaConSalida(true), barbaro, porLaPuerta, opciones)).toMatchObject({ opcion: { id: 'mover' } })
  })

  it('con la puerta cerrada, el muro no se cruza', () => {
    expect(evaluarRecorrido(salaConSalida(false), barbaro, porLaPuerta, opciones)).toEqual({ motivo: 'El recorrido pasa por donde no se puede' })
  })

  it('entre dos estancias pegadas solo se cruza por la puerta', () => {
    const porElMuro = [{ x: 1, y: 1 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }]
    expect(evaluarRecorrido(salaConSalida(true), barbaro, porElMuro, opciones)).toEqual({ motivo: 'El recorrido pasa por donde no se puede' })
  })

  it('al arrastrar hasta la otra estancia, el camino pasa por la puerta abierta', () => {
    expect(extenderRecorrido(salaConSalida(true), barbaro, [{ x: 1, y: 1 }], { x: 0, y: 4 })).toEqual([...porLaPuerta.slice(0, 3), { x: 0, y: 3 }, { x: 0, y: 4 }])
  })

  it('al mover a la otra estancia, la ficha pasa a ella con su casilla en ella', () => {
    const m = salaConSalida(true)
    const valido = { opcion: opciones.base, tramos: [0, 0, 0] }
    const movido = moverFicha(m, { ordenActivaciones: 'alternas', modosActivacion: 'normal' }, { ...barbaro, posicion: { x: 1, y: 1 } }, porLaPuerta, valido)
    expect(movido.estancias.map((e) => e.elementos.map((el) => [el.id, el.posicion]))).toEqual([[], [['barbaro', { x: 1, y: 1 }]]])
  })
})
