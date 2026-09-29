import { describe, expect, it } from 'vitest'
import { activacionDePrueba, escuadrasDePrueba, MOVIMIENTO_DE_PRUEBA, movimientoDePrueba } from './escuadras'

describe('escuadras de prueba', () => {
  it('una escuadra con el bárbaro y otra con el enano, con su ficha VTT', async () => {
    const escuadras = await escuadrasDePrueba.listarEscuadras()
    const heroes = await Promise.all(escuadras.map((e) => e.heroes()))
    expect(heroes.map((h) => h.map(({ id, imagenVtt }) => [id, Boolean(imagenVtt)]))).toEqual([[['barbaro', true]], [['enano', true]]])
  })

  it('las dos empiezan en modo sigiloso', async () => {
    const escuadras = await escuadrasDePrueba.listarEscuadras()
    expect(await Promise.all(escuadras.map((e) => e.modoActivacion()))).toEqual(['sigiloso', 'sigiloso'])
  })

  it('el héroe pregunta por su movimiento con lo que ya ha gastado', async () => {
    const [escuadra] = await escuadrasDePrueba.listarEscuadras()
    const [barbaro] = await escuadra.heroes()
    const estado = { escuadra: escuadra.id, turno: 1, heroes: [], modo: 'sigiloso' as const, acciones: [], movimientos: [] }
    expect(await barbaro.opcionesMovimiento(estado, { casillas: 0, acciones: [] })).toEqual(MOVIMIENTO_DE_PRUEBA)
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

  it('moverse sin más no completa la activación', () => {
    expect(activacionDePrueba([{ accion: 'mover', heroe: 'barbaro' }])).toEqual({ completo: false })
  })

  it('moverse y deslizar completa la activación', () => {
    expect(activacionDePrueba([{ accion: 'mover', heroe: 'barbaro' }, { accion: 'deslizar', heroe: 'barbaro' }])).toEqual({ completo: true })
  })

  it('moverse y usar otra acción de la escuadra completa la activación', () => {
    expect(activacionDePrueba([{ accion: 'cambiar-modo' }, { accion: 'mover', heroe: 'barbaro' }])).toEqual({ completo: true })
  })

  it('usar una acción sin moverse no completa la activación', () => {
    expect(activacionDePrueba([{ accion: 'cambiar-modo' }])).toEqual({ completo: false })
  })
})
