import { describe, expect, it } from 'vitest'
import { crearEstancia } from './estancias'
import type { Casilla } from './modelo/casilla'
import type { Postura } from './modelo/alianza'
import type { Objeto } from './modelo/elemento'
import type { Personaje } from './modelo/personaje'
import type { Mapa } from './modelo/mapa'
import type { OpcionesMovimiento } from './modelo/opcionesMovimiento'
import { turnoDePersonaje } from './activaciones'
import { accionesConsumidas, casillasDeEnemigos, conPersonajes, conZonaDeControl, costeDe, evaluarRecorrido, gastadoPor, mover as moverPersonaje, ruta } from './movimiento'
import { orientar } from './orientacion'
import type { Jugadores } from './modelo/jugadores'

/** Sin reparto de jugadores: nadie tiene turno ni enemigos */
const SIN_JUGADORES: Jugadores = { alianzas: [], jugadores: [] }

const barbaro: Personaje = { id: 'barbaro', nombre: 'Bárbaro', estancia: 'sala', casilla: { x: 0, y: 0 }, turnos: [] }
const mesa: Objeto = { id: 'mesa', nombre: 'Mesa', tipo: 'objeto', columnas: 1, filas: 2, posicion: { x: 1, y: 0 } }
/** Sala de 12 × 4 con el bárbaro en 0,0, sus objetos y otros personajes */
const sala = (objetos: Objeto[] = [], otros: Personaje[] = []): Mapa => ({
  estancias: [{ ...crearEstancia({ id: 'sala', tipo: 'sala', columnas: 12, filas: 4 }), elementos: objetos }],
  escuadras: [{ id: 'rojos', nombre: 'Rojos', jugador: 'j1', personajes: [barbaro, ...otros], turnos: [] }],
})

const mover = { id: 'mover', nombre: 'Mover', icono: '🥾' }
const opciones: OpcionesMovimiento = {
  base: { id: 'mover', nombre: 'Mover', tipo: 'normal', accion: mover, tramos: [{ distancia: 6 }] },
  variaciones: [
    { id: 'cargar', nombre: 'Cargar', tipo: 'carga', accion: { id: 'cargar', nombre: 'Cargar', icono: '🐂' }, tramos: [{ distancia: 8 }], terminarJuntoAEnemigo: true },
    {
      id: 'deslizar',
      nombre: 'Mover y deslizar',
      tipo: 'normal',
      accion: mover,
      tramos: [{ distancia: 6 }, { distancia: 3, accion: { id: 'deslizar', nombre: 'Deslizar', icono: '💨' } }],
    },
  ],
}

/** Recorrido en línea recta por la fila 3 desde la casilla de salida (0,0) bajando primero */
const recto = (pasos: number): Casilla[] => [
  { x: 0, y: 0 },
  ...Array.from({ length: Math.min(pasos, 3) }, (_, i) => ({ x: 0, y: i + 1 })),
  ...Array.from({ length: Math.max(0, pasos - 3) }, (_, i) => ({ x: i + 1, y: 3 })),
]

describe('ruta hasta una casilla', () => {
  it('a la casilla de al lado, un paso', () => {
    expect(ruta(sala(), { x: 0, y: 0 }, { x: 0, y: 1 })).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 1 },
    ])
  })

  it('a su propia casilla, sin pasos', () => {
    expect(ruta(sala(), { x: 0, y: 0 }, { x: 0, y: 0 })).toEqual([{ x: 0, y: 0 }])
  })

  it('en línea recta si no hay nada en medio', () => {
    expect(ruta(sala(), { x: 0, y: 0 }, { x: 0, y: 3 })).toEqual(recto(3))
  })

  it('rodea los objetos por el camino más corto', () => {
    expect(ruta(sala([mesa]), { x: 0, y: 0 }, { x: 2, y: 0 })).toHaveLength(7)
  })

  it('a una casilla ocupada por un objeto no hay ruta', () => {
    expect(ruta(sala([mesa]), { x: 0, y: 0 }, { x: 1, y: 1 })).toBeUndefined()
  })

  it('fuera del mapa no hay ruta', () => {
    expect(ruta(sala(), { x: 0, y: 0 }, { x: 20, y: 0 })).toBeUndefined()
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
    expect(evaluarRecorrido(sala(), barbaro, recto(8), opciones, { enemigos: [{ x: 6, y: 2 }] })).toMatchObject({ opcion: { id: 'cargar' } })
  })

  it('no puede pasar por la zona de control de un enemigo sin cargar', () => {
    expect(evaluarRecorrido(sala(), barbaro, recto(4), opciones, { enemigos: [{ x: 1, y: 1 }], distanciaControl: 1 })).toEqual({
      motivo: 'El recorrido entra en la zona de control de un enemigo',
    })
  })

  it('sin zona de control, pasa junto a los enemigos', () => {
    expect(evaluarRecorrido(sala(), barbaro, recto(4), opciones, { enemigos: [{ x: 1, y: 1 }], distanciaControl: 0 })).toMatchObject({ opcion: { id: 'mover' } })
  })

  it('una zona de control mayor llega más lejos', () => {
    const lejos = [{ x: 2, y: 1 }]
    expect([
      evaluarRecorrido(sala(), barbaro, recto(4), opciones, { enemigos: lejos, distanciaControl: 1 }),
      evaluarRecorrido(sala(), barbaro, recto(4), opciones, { enemigos: lejos, distanciaControl: 2 }),
    ]).toEqual([expect.objectContaining({ opcion: expect.objectContaining({ id: 'mover' }) }), { motivo: 'El recorrido entra en la zona de control de un enemigo' }])
  })

  it('una carga sí atraviesa la zona de control hasta el enemigo', () => {
    // baja por la columna 0 pasando junto al enemigo en 1,1 y acaba junto a él en 0,2
    expect(evaluarRecorrido(sala(), barbaro, recto(2), opciones, { enemigos: [{ x: 1, y: 1 }], distanciaControl: 1 })).toMatchObject({ opcion: { id: 'cargar' } })
  })

  it('la ruta que rodea la zona de control no entra en ella', () => {
    const m = conZonaDeControl(sala(), [{ x: 3, y: 0 }], 1)
    expect(ruta(m, { x: 0, y: 0 }, { x: 6, y: 0 })?.some((c) => Math.abs(c.x - 3) <= 1 && c.y <= 1)).toBe(false)
  })

  it('no puede atravesar un objeto', () => {
    const porLaMesa = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]
    expect(evaluarRecorrido(sala([mesa]), barbaro, porLaMesa, opciones)).toEqual({ motivo: 'El recorrido pasa por donde no se puede' })
  })

  it('pasa por encima de otro personaje, pero no termina encima', () => {
    const enano: Personaje = { ...barbaro, id: 'enano', nombre: 'Enano', casilla: { x: 0, y: 1 } }
    expect(evaluarRecorrido(sala([], [enano]), barbaro, recto(1), opciones)).toEqual({ motivo: 'No se puede terminar encima de Enano' })
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
  const enLaSala: Personaje = { ...barbaro, estancia: 'arriba', casilla: { x: 1, y: 1 } }
  const salaConSalida = (abierta: boolean): Mapa => {
    const arriba = orientar(crearEstancia({ id: 'arriba', tipo: 'sala', columnas: 3, filas: 3 }), 'abajo', 1)
    const abajo = orientar(crearEstancia({ id: 'abajo', tipo: 'pasillo', columnas: 3, filas: 4 }), 'abajo', 0)
    return {
      estancias: [
        { ...arriba, puertas: arriba.puertas.map((p) => (p.tipo === 'salida' ? { ...p, abierta } : p)) },
        { ...abajo, posicion: { x: 0, y: 3 } },
      ],
      escuadras: [{ id: 'rojos', nombre: 'Rojos', jugador: 'j1', personajes: [enLaSala], turnos: [] }],
    }
  }
  const porLaPuerta = [
    { x: 1, y: 1 },
    { x: 1, y: 2 },
    { x: 1, y: 3 },
    { x: 1, y: 4 },
  ]

  it('con la puerta abierta, el recorrido pasa a la estancia de al lado', () => {
    expect(evaluarRecorrido(salaConSalida(true), enLaSala, porLaPuerta, opciones)).toMatchObject({ opcion: { id: 'mover' } })
  })

  it('con la puerta cerrada, el muro no se cruza', () => {
    expect(evaluarRecorrido(salaConSalida(false), enLaSala, porLaPuerta, opciones)).toEqual({ motivo: 'El recorrido pasa por donde no se puede' })
  })

  it('entre dos estancias pegadas solo se cruza por la puerta', () => {
    const porElMuro = [{ x: 1, y: 1 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }]
    expect(evaluarRecorrido(salaConSalida(true), enLaSala, porElMuro, opciones)).toEqual({ motivo: 'El recorrido pasa por donde no se puede' })
  })

  it('una puerta abierta no se cruza en diagonal', () => {
    const cruzandoEnDiagonal = [{ x: 1, y: 1 }, { x: 1, y: 2 }, { x: 0, y: 3 }]
    expect(evaluarRecorrido(salaConSalida(true), enLaSala, cruzandoEnDiagonal, opciones, { medicion: 'diagonal' })).toEqual({
      motivo: 'El recorrido pasa por donde no se puede',
    })
  })

  it('la ruta a la otra estancia pasa por la puerta abierta', () => {
    expect(ruta(salaConSalida(true), { x: 1, y: 1 }, { x: 0, y: 4 })?.slice(0, 3)).toEqual(porLaPuerta.slice(0, 3))
  })

  const normales = { ordenActivaciones: 'alternas', modosActivacion: 'normal', medicionMovimiento: 'ortogonal', terrenoPersonajes: 'normal', distanciaControl: 0, jugadores: SIN_JUGADORES } as const
  const moverPorLaPuerta = () => moverPersonaje(salaConSalida(true), normales, 'rojos', enLaSala, porLaPuerta, { opcion: opciones.base, tramos: [0, 0, 0] })

  it('al mover a la otra estancia, el personaje pasa a ella con su casilla en ella', () => {
    const [movido] = moverPorLaPuerta().escuadras?.[0].personajes ?? []
    expect([movido.estancia, movido.casilla]).toEqual(['abajo', { x: 1, y: 1 }])
  })

  it('el movimiento queda en el turno del personaje y cuenta como gastado', () => {
    const m = moverPorLaPuerta()
    const [movido] = m.escuadras?.[0].personajes ?? []
    expect([turnoDePersonaje(movido, 1).movimientos, gastadoPor(m, movido)]).toEqual([
      [{ opcion: 'mover', casillas: 3, acciones: ['mover'] }],
      { casillas: 3, acciones: ['mover'] },
    ])
  })

  it('las acciones que consume el movimiento van al turno de la escuadra, como del personaje', () => {
    expect(moverPorLaPuerta().escuadras?.[0].turnos[0].acciones).toEqual([{ accion: 'mover', personaje: 'barbaro' }])
  })
})

describe('medición de los movimientos', () => {
  /** Recorrido en diagonal hacia abajo a la derecha desde 0,0 */
  const enDiagonal = (pasos: number): Casilla[] => Array.from({ length: pasos + 1 }, (_, i) => ({ x: i, y: i }))

  it('sin diagonales, un paso en diagonal no se puede dar', () => {
    expect(evaluarRecorrido(sala(), barbaro, enDiagonal(1), opciones)).toEqual({ motivo: 'El recorrido pasa por donde no se puede' })
  })

  it('con diagonales que cuentan como uno, tres pasos en diagonal cuestan tres', () => {
    expect(costeDe(sala(), enDiagonal(3), 'diagonal')).toBe(3)
  })

  it('por Pitágoras, tres pasos en diagonal cuestan lo que su largo redondeado hacia arriba', () => {
    expect(costeDe(sala(), enDiagonal(3), 'euclidea')).toBe(5)
  })

  it('por Pitágoras, dos diagonales no llegan a tres casillas', () => {
    expect(costeDe(sala(), enDiagonal(2), 'euclidea')).toBe(3)
  })

  it('los tramos se cuentan por lo que cuesta cada paso: 3 diagonales por Pitágoras ya tocan el tramo de deslizar', () => {
    const cuatro = [...enDiagonal(3), { x: 4, y: 3 }, { x: 5, y: 3 }]
    expect(evaluarRecorrido(sala(), barbaro, cuatro, opciones, { medicion: 'euclidea' })).toMatchObject({ opcion: { id: 'deslizar' }, tramos: [0, 0, 0, 0, 1] })
  })

  it('en diagonal no se cortan las esquinas de un objeto', () => {
    // la mesa ocupa 1,0 y 1,1: de 0,1 a 1,2 se rozaría su esquina
    const rozando = [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 2 }]
    expect(evaluarRecorrido(sala([mesa]), barbaro, rozando, opciones, { medicion: 'diagonal' })).toEqual({ motivo: 'El recorrido pasa por donde no se puede' })
  })

  it('la ruta va en diagonal si la medición lo permite', () => {
    expect(ruta(sala(), { x: 0, y: 0 }, { x: 3, y: 3 }, 'diagonal')).toEqual(enDiagonal(3))
  })

  it('con diagonales que cuentan como uno, a igual coste prefiere los pasos rectos', () => {
    expect(ruta(sala(), { x: 0, y: 0 }, { x: 3, y: 0 }, 'diagonal')).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ])
  })

  it('por Pitágoras, la ruta es la más corta de largo', () => {
    const camino = ruta(sala(), { x: 0, y: 0 }, { x: 3, y: 1 }, 'euclidea') ?? []
    expect([camino.length - 1, costeDe(sala(), camino, 'euclidea')]).toEqual([3, 4])
  })

  it('el movimiento apunta lo que cuesta según la medición', () => {
    const conDiagonales = { ordenActivaciones: 'alternas', modosActivacion: 'normal', medicionMovimiento: 'euclidea', terrenoPersonajes: 'normal', distanciaControl: 0, jugadores: SIN_JUGADORES } as const
    const m = moverPersonaje(sala(), conDiagonales, 'rojos', barbaro, enDiagonal(3), { opcion: opciones.base, tramos: [0, 0, 0] })
    expect(gastadoPor(m, m.escuadras?.[0].personajes[0] ?? barbaro).casillas).toBe(5)
  })
})

describe('enemigos', () => {
  /** El bárbaro (rojos, de Ana en los Héroes) y un orco de la Oscuridad en los Monstruos, con esa postura hacia los Héroes */
  const orco = (casilla: Casilla, haciaHeroes: Postura = 'hostil'): Mapa => ({
    ...sala(),
    personajesNoJugadores: [{ id: 'orco', nombre: 'Orco', estancia: 'sala', casilla, turnos: [], jugador: 'oscuridad' }],
    jugadores: {
      alianzas: [
        { id: 'heroes', nombre: 'Héroes' },
        { id: 'monstruos', nombre: 'Monstruos', posturas: { heroes: haciaHeroes } },
      ],
      jugadores: [
        { id: 'j1', nombre: 'Ana', tipo: 'humano', alianza: 'heroes' },
        { id: 'oscuridad', nombre: 'La Oscuridad', tipo: 'ia', alianza: 'monstruos' },
      ],
    },
  })

  it('sus casillas son las del mapa', () => {
    expect(casillasDeEnemigos({ ...orco({ x: 1, y: 1 }), estancias: [{ ...sala().estancias[0], posicion: { x: 10, y: 5 } }] }, 'barbaro')).toEqual([{ x: 11, y: 6 }])
  })

  it('los de una alianza neutral no son enemigos', () => {
    expect(casillasDeEnemigos(orco({ x: 1, y: 1 }, 'neutral'), 'barbaro')).toEqual([])
  })

  it('la postura va en un sentido: los Héroes no son enemigos de los Monstruos si no son hostiles hacia ellos', () => {
    expect(casillasDeEnemigos(orco({ x: 1, y: 1 }), 'orco')).toEqual([])
  })

  it('no se puede pasar por encima de un enemigo, aunque los personajes no estorben', () => {
    const conOrco = conPersonajes(orco({ x: 1, y: 0 }), 'barbaro', 'normal')
    expect(ruta(conOrco, { x: 0, y: 0 }, { x: 2, y: 0 })).toHaveLength(5)
  })

  it('por encima de uno que no es enemigo se pasa según la regla de los personajes', () => {
    const conOrco = conPersonajes(orco({ x: 1, y: 0 }, 'neutral'), 'barbaro', 'normal')
    expect(ruta(conOrco, { x: 0, y: 0 }, { x: 2, y: 0 })).toHaveLength(3)
  })

  it('no se termina encima de un enemigo', () => {
    const m = orco({ x: 0, y: 2 })
    expect(evaluarRecorrido(m, barbaro, recto(2), opciones, { enemigos: casillasDeEnemigos(m, 'barbaro') })).toEqual({ motivo: 'No se puede terminar encima de Orco' })
  })

  it('para acabar junto a un enemigo sin alejarse, hay que cargar', () => {
    const m = orco({ x: 1, y: 3 })
    expect(evaluarRecorrido(m, barbaro, recto(3), opciones, { enemigos: casillasDeEnemigos(m, 'barbaro'), distanciaControl: 1 })).toMatchObject({ opcion: { id: 'cargar' } })
  })
})
