import { describe, expect, it, vi } from 'vitest'
import type { MapaEnJuego, Puerta } from '../gamemap'
import { AbrirPuerta, accionesDeEscuadra, activacionDePrueba, escuadrasDePrueba, MOVIMIENTO_DE_PRUEBA, movimientoDePrueba } from './escuadras'

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

  const barbaro = { id: 'barbaro', nombre: 'Bárbaro', escuadra: 'escuadra-barbaro', posicion: { estancia: 'estancia-1', casilla: { x: 2, y: 3 } } }
  const salida: Puerta = { id: 'salida-1', tipo: 'salida', casilla: { x: 2, y: 3 }, lado: 'abajo' }
  const mapaCon = (puerta?: Puerta): MapaEnJuego => ({ mapa: { estancias: [] }, puertaEn: () => puerta, abrirPuerta: vi.fn() })
  const estado = { escuadra: 'escuadra-barbaro', turno: 1, heroes: [], modo: 'sigiloso' as const, acciones: [], movimientos: [] }

  it('si el héroe pulsado está en una salida cerrada, la escuadra ofrece abrirla', async () => {
    expect((await accionesDeEscuadra(estado, mapaCon(salida), barbaro)).map((a) => [a.id, a instanceof AbrirPuerta])).toEqual([['abrir-puerta', true]])
  })

  it('sobre una puerta ya abierta, o sin puerta, no hay nada que abrir', async () => {
    const acciones = [await accionesDeEscuadra(estado, mapaCon({ ...salida, abierta: true }), barbaro), await accionesDeEscuadra(estado, mapaCon(), barbaro)]
    expect(acciones).toEqual([[], []])
  })

  it('la entrada no se abre: es por donde se llegó', async () => {
    expect(await accionesDeEscuadra(estado, mapaCon({ ...salida, tipo: 'entrada' }), barbaro)).toEqual([])
  })

  it('sin un héroe pulsado, no hay puerta que abrir', async () => {
    expect(await accionesDeEscuadra(estado, mapaCon(salida))).toEqual([])
  })

  it('el comando abre la puerta de la casilla del héroe', async () => {
    const mapa = mapaCon(salida)
    await new AbrirPuerta(barbaro.posicion, mapa).exec()
    expect(mapa.abrirPuerta).toHaveBeenCalledWith(barbaro.posicion)
  })
})
