import { describe, expect, it } from 'vitest'
import { construirEstancia } from './construccion'
import { crearEstancia } from './estancias'
import type { Casilla } from './modelo/casilla'
import type { Mapa } from './modelo/mapa'
import type { Personaje } from './modelo/personaje'
import type { Terreno } from './modelo/terreno'
import type { OpcionesMovimiento } from './modelo/opcionesMovimiento'
import { conPersonajes, costeDe, evaluarRecorrido, gastadoPor, mover as moverPersonaje, ruta } from './movimiento'
import { coberturaEn, factorDeTerreno, terrenoEn } from './terrenos'
import type { Jugadores } from './modelo/jugadores'

/** Sin reparto de jugadores: nadie tiene turno ni enemigos */
const SIN_JUGADORES: Jugadores = { alianzas: [], jugadores: [] }

const barro: Terreno = { tipo: 'dificil', posicion: { x: 1, y: 0 }, columnas: 1, filas: 3 }
const zarzas: Terreno = { tipo: 'muy-dificil', posicion: { x: 3, y: 0 }, columnas: 1, filas: 1 }
const muro: Terreno = { tipo: 'impasable', posicion: { x: 2, y: 1 }, columnas: 1, filas: 2 }
const estancia = { ...crearEstancia({ id: 'sala', tipo: 'sala', columnas: 6, filas: 3 }), terrenos: [barro, zarzas, muro] }
const barbaro: Personaje = { id: 'barbaro', nombre: 'Bárbaro', estancia: 'sala', casilla: { x: 0, y: 0 }, turnos: [] }
const mapa: Mapa = { estancias: [estancia], escuadras: [{ id: 'rojos', nombre: 'Rojos', jugador: 'j1', personajes: [barbaro], turnos: [] }] }
const mover = { id: 'mover', nombre: 'Mover', icono: '🥾' }
const seis: OpcionesMovimiento = { base: { id: 'mover', nombre: 'Mover', tipo: 'normal', accion: mover, tramos: [{ distancia: 6 }] }, variaciones: [] }
/** Por la fila de arriba de 0,0 a x,0 */
const porArriba = (hasta: number): Casilla[] => Array.from({ length: hasta + 1 }, (_, x) => ({ x, y: 0 }))

describe('terrenos', () => {
  it('si dos terrenos cubren la casilla, cuenta el peor', () => {
    const encima = { ...estancia, terrenos: [barro, { ...zarzas, posicion: barro.posicion }] }
    expect(factorDeTerreno(encima, barro.posicion)).toBe(3)
  })

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

describe('casillas con personajes', () => {
  // pasillo de 5 × 1: el bárbaro en 0,0 y el enano en medio, en 2,0
  const pasillo = crearEstancia({ id: 'pasillo', tipo: 'pasillo', columnas: 5, filas: 1 })
  const enano: Personaje = { ...barbaro, id: 'enano', nombre: 'Enano', estancia: 'pasillo', casilla: { x: 2, y: 0 } }
  const enElPasillo: Personaje = { ...barbaro, estancia: 'pasillo' }
  const conEnano: Mapa = { estancias: [pasillo], escuadras: [{ id: 'grupo', nombre: 'Grupo', jugador: 'j1', personajes: [enElPasillo, enano], turnos: [] }] }
  const hastaElFondo = porArriba(4)

  it('con personajes normales, el mapa no cambia', () => {
    expect(conPersonajes(conEnano, 'barbaro', 'normal')).toBe(conEnano)
  })

  it('el propio personaje no cuenta: solo los demás', () => {
    expect(conPersonajes(conEnano, 'barbaro', 'dificil').estancias[0].terrenos).toEqual([{ tipo: 'dificil', posicion: { x: 2, y: 0 }, columnas: 1, filas: 1, porReglas: true }])
  })

  it('con personajes difíciles, pasar por encima del enano cuesta dos', () => {
    expect(costeDe(conPersonajes(conEnano, 'barbaro', 'dificil'), hastaElFondo)).toBe(5)
  })

  it('con personajes impasables, el enano parado en el pasillo cierra el paso', () => {
    expect(ruta(conPersonajes(conEnano, 'barbaro', 'impasable'), { x: 0, y: 0 }, { x: 4, y: 0 })).toBeUndefined()
  })

  it('un personaje sobre terreno peor que su regla no lo mejora: cuenta el peor', () => {
    const conZarzas = { ...conEnano, estancias: [{ ...pasillo, terrenos: [{ tipo: 'muy-dificil' as const, posicion: { x: 2, y: 0 }, columnas: 1, filas: 1 }] }] }
    expect(costeDe(conPersonajes(conZarzas, 'barbaro', 'dificil'), hastaElFondo)).toBe(6)
  })

  it('al moverse, lo gastado cuenta el paso por encima del otro personaje', () => {
    const config = { ordenActivaciones: 'alternas', modosActivacion: 'normal', medicionMovimiento: 'ortogonal', terrenoPersonajes: 'dificil', distanciaControl: 0, cuerpoACuerpo: 'diagonal', jugadores: SIN_JUGADORES } as const
    const movido = moverPersonaje(conEnano, config, 'grupo', enElPasillo, hastaElFondo, { opcion: seis.base, tramos: [0, 0, 0, 0] })
    expect(gastadoPor(movido, movido.escuadras?.[0].personajes[0] ?? enElPasillo).casillas).toBe(5)
  })
})

describe('cobertura del terreno', () => {
  const con = (terrenos: Terreno[]) => ({ ...crearEstancia({ id: 'sala', tipo: 'sala', columnas: 3, filas: 3 }), terrenos })
  const barro: Terreno = { tipo: 'dificil', cobertura: 'ligera', posicion: { x: 0, y: 0 }, columnas: 2, filas: 2 }

  it('sin terreno, ninguna', () => {
    expect(coberturaEn(con([barro]), { x: 2, y: 2 })).toBe('ninguna')
  })

  it('la de su terreno', () => {
    expect(coberturaEn(con([barro]), { x: 1, y: 1 })).toBe('ligera')
  })

  it('un terreno sin cobertura no cubre', () => {
    expect(coberturaEn(con([{ ...barro, cobertura: undefined }]), { x: 1, y: 1 })).toBe('ninguna')
  })

  it('con varios terrenos, la mayor', () => {
    const muro: Terreno = { tipo: 'dificil', cobertura: 'pesada', posicion: { x: 1, y: 1 }, columnas: 1, filas: 1 }
    expect(coberturaEn(con([barro, muro]), { x: 1, y: 1 })).toBe('pesada')
  })
})
