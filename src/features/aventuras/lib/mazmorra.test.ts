import { describe, expect, it } from 'vitest'
import type { Partida, Zona } from './partida'
import { cabeEnMapa, moverEnMapa, pegar, retirarCaidos, salaEn, salas, situar, type Sala } from './mazmorra'
import type { Pieza, Rejilla } from './rejilla'

const rejilla = (columnas: number, filas: number, x: number, y: number, piezas: Pieza[] = []): Rejilla => ({
  columnas,
  filas,
  piezas,
  origen: { x, y },
})
const sala = (zona: number, r: Rejilla): Sala => ({ zona, rejilla: r, origen: r.origen ?? { x: 0, y: 0 } })
const zona = (id: number, r?: Rejilla, extra: Partial<Zona> = {}): Zona => ({
  id,
  tipo: id ? 'sala' : 'inicial',
  salidas: [],
  momentos: [],
  pendientes: [],
  sucesos: [],
  rejilla: r,
  ...extra,
})
const partida = (actual: Zona, exploradas: Zona[] = []) => ({ zona: actual, exploradas }) as Partida
const kor: Pieza = { id: 'kor', tipo: 'miembro', x: 0, y: 0 }
const inicial = sala(0, rejilla(6, 4, 0, 0))

describe('mazmorra con mapa', () => {
  it('la sala nueva se pega a la derecha, con la puerta centrada en su muro', () => {
    expect(pegar([inicial], { zona: 0, puerta: { x: 5, y: 1 }, pared: 'derecha' }, { columnas: 4, filas: 3 })).toEqual({
      origen: { x: 6, y: 0 },
      entrada: { x: 0, y: 1 },
    })
  })

  it('a la izquierda, la entrada queda en su última columna', () => {
    expect(pegar([inicial], { zona: 0, puerta: { x: 0, y: 2 }, pared: 'izquierda' }, { columnas: 4, filas: 3 })).toEqual({
      origen: { x: -4, y: 1 },
      entrada: { x: 3, y: 1 },
    })
  })

  it('arriba, la entrada queda en su última fila', () => {
    expect(pegar([inicial], { zona: 0, puerta: { x: 2, y: 0 }, pared: 'arriba' }, { columnas: 4, filas: 3 })).toEqual({
      origen: { x: 1, y: -3 },
      entrada: { x: 1, y: 2 },
    })
  })

  it('si choca con otra sala, se desplaza a lo largo de la pared', () => {
    const otra = sala(2, rejilla(3, 2, 6, 0))
    expect(pegar([inicial, otra], { zona: 0, puerta: { x: 5, y: 2 }, pared: 'derecha' }, { columnas: 4, filas: 3 })).toEqual({
      origen: { x: 6, y: 2 },
      entrada: { x: 0, y: 0 },
    })
  })

  it('encuentra la sala de una casilla del mapa', () => {
    expect(salaEn([inicial, sala(1, rejilla(4, 3, 6, 0))], 7, 2)?.zona).toBe(1)
  })

  it('entre salas no hay casillas', () => {
    expect(cabeEnMapa([inicial], { ...kor, x: 7, y: 1 })).toBeUndefined()
  })

  it('el atrezo no sale de su sala', () => {
    const mesa: Pieza = { id: 'cofre-1', tipo: 'atrezo', atrezo: 'cofre', x: 7, y: 1 }
    expect(cabeEnMapa([inicial, sala(1, rejilla(4, 3, 6, 0))], mesa, 0)).toBeUndefined()
  })

  it('un héroe pasa de una sala a otra y sale de la anterior', () => {
    const p = partida(zona(1, rejilla(4, 3, 6, 0)), [zona(0, rejilla(6, 4, 0, 0, [{ ...kor, x: 5, y: 1 }]))])
    expect(salas(moverEnMapa(p, { ...kor, x: 6, y: 1 })).map((s) => s.rejilla.piezas)).toEqual([[], [{ ...kor, x: 0, y: 1 }]])
  })

  it('al morir, las miniaturas se retiran del mapa y dejan libre su casilla', () => {
    const orco: Pieza = { id: 'orco-1', tipo: 'monstruo', x: 1, y: 1 }
    const goblin: Pieza = { id: 'goblin-1', tipo: 'monstruo', x: 2, y: 1 }
    const nim: Pieza = { id: 'nim', tipo: 'miembro', x: 3, y: 1 }
    const p = {
      ...partida(zona(0, rejilla(6, 4, 0, 0, [kor, orco, goblin, nim]))),
      vidas: { kor: 5, nim: 0 },
      monstruos: [{ id: 'goblin-1', monstruo: 'goblin', avanzado: false, numero: 1, cuerpo: 1, pc: 1 }],
    } as Partida
    expect(retirarCaidos(p).zona.rejilla?.piezas.map((pz) => pz.id)).toEqual(['kor', 'goblin-1'])
  })

  it('la zona nueva se pega a la puerta, con su entrada, y la anterior ya no cambia de tamaño', () => {
    const nueva = zona(1, { columnas: 4, filas: 3, piezas: [] }, { anclaje: { zona: 0, puerta: { x: 5, y: 1 }, pared: 'derecha' } })
    const p = situar(partida(nueva, [zona(0, rejilla(6, 4, 0, 0))]))
    expect([p.zona.rejilla, p.exploradas?.[0].rejilla?.fija]).toEqual([
      { ...rejilla(4, 3, 6, 0), piezas: [{ id: 'entrada', tipo: 'puerta', x: 0, y: 1 }] },
      true,
    ])
  })

  it('una zona a la que no se llegó por una puerta del mapa va aparte, a la derecha', () => {
    const p = situar(partida(zona(1, { columnas: 4, filas: 3, piezas: [] }), [zona(0, rejilla(6, 4, 0, 0))]))
    expect(p.zona.rejilla?.origen).toEqual({ x: 7, y: 0 })
  })
})
