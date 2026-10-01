import { describe, expect, it } from 'vitest'
import { guiaDeCoherencia } from './coherencia'
import { crearEstancia } from './estancias'
import type { Casilla } from './modelo/casilla'
import type { Coherencia } from './modelo/coherencia'
import type { Escuadra } from './modelo/escuadra'
import type { Mapa } from './modelo/mapa'

/** Sala de 12 × 12 con la escuadra de esos personajes (a, b, c… en esas casillas; `undefined`, en la zona de espera) */
function conEscuadra(...casillas: (Casilla | undefined)[]): { mapa: Mapa; escuadra: Escuadra } {
  const personajes = casillas.map((casilla, i) => ({ id: 'abcde'[i], nombre: 'ABCDE'[i], estancia: 'sala', ...(casilla && { casilla }), turnos: [] }))
  const escuadra: Escuadra = { id: 'rojos', nombre: 'Rojos', jugador: 'ana', personajes, turnos: [] }
  return { mapa: { estancias: [crearEstancia({ id: 'sala', tipo: 'sala', columnas: 12, filas: 12 })], escuadras: [escuadra] }, escuadra }
}
const guia = (coherencia: Coherencia, ...casillas: (Casilla | undefined)[]) => {
  const { mapa, escuadra } = conEscuadra(...casillas)
  return guiaDeCoherencia(mapa, 'ortogonal', escuadra, coherencia)
}
const enFila = (...xs: number[]) => xs.map((x) => ({ x, y: 0 }))
/** La escuadra con ese personaje movido en el turno 1, después de que se movieran los demás */
const seMovio = (escuadra: Escuadra, id: string): Escuadra => ({
  ...escuadra,
  turnos: [{ numero: 1, acciones: [...escuadra.personajes.filter((p) => p.id !== id), ...escuadra.personajes.filter((p) => p.id === id)].map((p) => ({ accion: 'mover', personaje: p.id })) }],
  personajes: escuadra.personajes.map((p) => ({ ...p, turnos: [{ numero: 1, acciones: [], movimientos: [{ opcion: 'mover', casillas: 1, acciones: ['mover'] }] }] })),
})
const conAlguno: Coherencia = { modo: 'alguno', distancia: 1 }

describe('coherencia con alguno: en cadena', () => {
  it('todos en cadena, nadie fuera', () => {
    expect(guia(conAlguno, ...enFila(0, 1, 2)).fuera).toEqual([])
  })

  it('el que no está en la cadena, fuera', () => {
    expect(guia(conAlguno, ...enFila(0, 1, 5)).fuera).toEqual(['c'])
  })

  it('se queda la cadena más grande', () => {
    expect(guia(conAlguno, ...enFila(0, 5, 6)).fuera).toEqual(['a'])
  })

  it('con cadenas igual de grandes, se queda la del primero', () => {
    expect(guia(conAlguno, ...enFila(0, 5)).fuera).toEqual(['b'])
  })

  it('une a los de la cadena y a cada uno de fuera con el más cercano de ella', () => {
    expect(guia(conAlguno, ...enFila(0, 1, 5)).enlaces.map(({ de, a, enCoherencia }) => [de, a, enCoherencia])).toEqual([
      ['a', 'b', true],
      ['c', 'b', false],
    ])
  })

  it('los de la zona de espera no cuentan', () => {
    expect(guia(conAlguno, { x: 0, y: 0 }, undefined, { x: 1, y: 0 }).fuera).toEqual([])
  })
})

describe('coherencia con todos', () => {
  const conTodos: Coherencia = { modo: 'todos', distancia: 2 }

  it('fuera, el que está lejos de más; con empate, el último', () => {
    expect(guia(conTodos, ...enFila(0, 2, 4)).fuera).toEqual(['c'])
  })

  it('une a cada pareja, diciendo si están a la distancia', () => {
    expect(guia(conTodos, ...enFila(0, 2, 4)).enlaces.map(({ de, a, enCoherencia }) => [de, a, enCoherencia])).toEqual([
      ['a', 'b', true],
      ['a', 'c', false],
      ['b', 'c', true],
    ])
  })
})

describe('coherencia con el centro', () => {
  const conCentro: Coherencia = { modo: 'centro', distancia: 3 }
  const casillas = [
    { x: 0, y: 0 },
    { x: 0, y: 2 },
    { x: 6, y: 1 },
  ]

  it('si caben todos, el centro es el medio de sus casillas', () => {
    expect(guia(conCentro, { x: 0, y: 0 }, { x: 0, y: 2 }, { x: 3, y: 1 }).centro).toEqual({ x: 1, y: 1 })
  })

  it('si no caben todos, el círculo rodea a los más que pueda', () => {
    expect(guia(conCentro, ...casillas).fuera).toEqual(['c'])
  })

  it('y queda en el medio de los que deja dentro', () => {
    expect(guia(conCentro, ...casillas).centro).toEqual({ x: 0, y: 1 })
  })

  it('aunque ninguno esté cerca del medio de todos, el círculo se va a donde hay más', () => {
    // el medio de los cuatro, 4,1, queda a más de 3 de todos
    expect(guia(conCentro, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 11, y: 2 }).fuera).toEqual(['d'])
  })

  it('con empate, se queda el grupo del último que se movió', () => {
    const { mapa, escuadra } = conEscuadra({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 10, y: 0 }, { x: 11, y: 0 })
    expect(guiaDeCoherencia(mapa, 'ortogonal', seMovio(escuadra, 'c'), conCentro).fuera).toEqual(['a', 'b'])
  })
})

describe('la escuadra nunca se queda sin nadie por la coherencia', () => {
  const lejos = enFila(0, 5, 10)

  it.each(['alguno', 'todos', 'centro'] as const)('con %s, todos separados, alguno se queda', (modo) => {
    expect(guia({ modo, distancia: 1 }, ...lejos).fuera).toHaveLength(2)
  })

  it('con el centro y todos separados, se queda el último que se movió', () => {
    const { mapa, escuadra } = conEscuadra(...lejos)
    expect(guiaDeCoherencia(mapa, 'ortogonal', seMovio(escuadra, 'b'), { modo: 'centro', distancia: 1 }).fuera).toEqual(['a', 'c'])
  })
})
