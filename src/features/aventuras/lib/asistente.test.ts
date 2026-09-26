import { describe, expect, it } from 'vitest'
import { avanzar, estadoAventura, estadoPaso, pasoActual, volverA } from './asistente'
import { PASOS, type Configuracion } from './preparacion'

const BASE: Configuracion = { paso: 'mazmorra', modo: 'losetas', mazos: {} }
const BARAJADA: Configuracion = { ...BASE, paso: 'barajar', barajado: { fecha: '2026-09-26T10:00:00.000Z', orden: {} } }

describe('asistente de preparación', () => {
  it('empieza en el paso de la mazmorra', () => {
    expect(PASOS.map((p) => estadoPaso(BASE, p))).toEqual(['actual', 'pendiente', 'pendiente'])
  })

  it('avanza paso a paso', () => {
    const c = avanzar(BASE)
    expect(PASOS.map((p) => estadoPaso(c, p))).toEqual(['completado', 'actual', 'pendiente'])
  })

  it('no pasa del último paso', () => {
    expect(avanzar({ ...BASE, paso: 'barajar' }).paso).toBe('barajar')
  })

  it('con los mazos barajados todos los pasos están completados', () => {
    expect(PASOS.map((p) => estadoPaso(BARAJADA, p))).toEqual(['completado', 'completado', 'completado'])
  })

  it('volver a un paso anula el barajado', () => {
    const c = volverA(BARAJADA, 'mazos')
    expect([c.paso, c.barajado, estadoAventura(c)]).toEqual(['mazos', undefined, 'configurando'])
  })

  it('volver a un paso conserva la selección de cartas', () => {
    const conCartas = { ...BARAJADA, mazos: { atrezo: { cartas: ['mesa-1'], reemplazos: [] } } }
    expect(volverA(conCartas, 'mazmorra').mazos).toEqual(conCartas.mazos)
  })

  it('el estado de la aventura sigue al barajado', () => {
    expect([estadoAventura(BASE), estadoAventura(BARAJADA)]).toEqual(['configurando', 'mazo-barajado'])
  })

  it('las configuraciones sin paso retoman donde se quedaron', () => {
    const { paso: _, ...sinPaso } = BARAJADA
    expect([pasoActual(sinPaso), pasoActual({ modo: 'losetas', mazos: {} })]).toEqual(['barajar', 'mazmorra'])
  })
})
