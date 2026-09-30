import { describe, expect, it, vi } from 'vitest'
import type { Heroe, MapaEnJuego, Puerta } from '../../gamemap'
import { HeroeDePrueba, MOVIMIENTO_DE_PRUEBA, movimientoDePrueba } from './heroe'
import { PuertasDePrueba } from './puerta'

describe('héroe de prueba', () => {
  it('sin moverse, tiene todo su movimiento', () => {
    expect(movimientoDePrueba({ casillas: 0, acciones: [] })).toEqual(MOVIMIENTO_DE_PRUEBA)
  })

  it('tras moverse, le queda el resto del movimiento más deslizar', () => {
    const opciones = movimientoDePrueba({ casillas: 2, acciones: ['mover'] })
    expect([opciones?.base.tramos, opciones?.variaciones.map((v) => v.tramos.map((t) => t.distancia))]).toEqual([[{ distancia: 4 }], [[4, 3]]])
  })

  it('con todo el movimiento gastado, solo puede deslizar', () => {
    expect(movimientoDePrueba({ casillas: 6, acciones: ['mover'] })?.variaciones[0].tramos.map((t) => t.distancia)).toEqual([0, 3])
  })

  it('si ya ha deslizado, no puede moverse más', () => {
    expect(movimientoDePrueba({ casillas: 7, acciones: ['mover', 'deslizar'] })).toBeUndefined()
  })
})

describe('acciones del héroe de prueba', () => {
  const salida: Puerta = { id: 'salida-1', tipo: 'salida', casilla: { x: 2, y: 3 }, lado: 'abajo' }
  const mapa: MapaEnJuego = { mapa: { estancias: [], turno: 1 }, puertaEn: () => salida, abrirPuerta: vi.fn() }
  const enLaPuerta: Heroe = { id: 'barbaro', nombre: 'Bárbaro', estancia: 'estancia-1', casilla: { x: 2, y: 3 }, turnos: [] }
  /** El bárbaro, con la puerta de su casilla asociada */
  function barbaro() {
    const puertas = new PuertasDePrueba()
    puertas.asociar({ id: 'estancia-1', tipo: 'sala', columnas: 5, filas: 4, puertas: [salida], elementos: [], estancias: [] })
    return new HeroeDePrueba({ id: 'barbaro', nombre: 'Bárbaro' }, puertas)
  }

  it('en una salida cerrada, compone el comando de abrirla que da la puerta', async () => {
    expect((await barbaro().acciones(enLaPuerta, mapa)).map((a) => a.id)).toEqual(['abrir-puerta'])
  })

  it('si ya ha hecho una acción en este turno, no tiene más', async () => {
    const yaActuo = { ...enLaPuerta, turnos: [{ numero: 1, acciones: ['abrir-puerta'], movimientos: [] }] }
    expect(await barbaro().acciones(yaActuo, mapa)).toEqual([])
  })

  it('moverse no cuenta como acción: tras moverse puede abrir', async () => {
    const seMovio = { ...enLaPuerta, turnos: [{ numero: 1, acciones: [], movimientos: [{ opcion: 'mover', casillas: 3, acciones: ['mover'] }] }] }
    expect((await barbaro().acciones(seMovio, mapa)).map((a) => a.id)).toEqual(['abrir-puerta'])
  })

  it('lo que hizo en turnos anteriores no cuenta', async () => {
    const antes = { ...enLaPuerta, turnos: [{ numero: 0, acciones: ['abrir-puerta'], movimientos: [] }] }
    expect((await barbaro().acciones(antes, mapa)).map((a) => a.id)).toEqual(['abrir-puerta'])
  })

  it('en una casilla sin objetos, o en la zona de espera, no tiene acciones', async () => {
    const lejos = { ...enLaPuerta, casilla: { x: 0, y: 0 } }
    const enEspera = { ...enLaPuerta, casilla: undefined }
    expect([await barbaro().acciones(lejos, mapa), await barbaro().acciones(enEspera, mapa)]).toEqual([[], []])
  })
})
