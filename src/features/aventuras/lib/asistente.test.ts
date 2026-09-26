import { describe, expect, it } from 'vitest'
import { avanzar, estadoAventura, estadoPaso, pasoActual, volverA } from './asistente'
import { PASOS, type Configuracion, type Paso } from './preparacion'

const BASE: Configuracion = { paso: 'mazos', modo: 'losetas', mazos: {} }
const BARAJADA: Configuracion = { ...BASE, paso: 'barajar', barajado: { fecha: '2026-09-26T10:00:00.000Z', orden: {} } }

describe('asistente de preparación', () => {
  it('empieza en el paso de los mazos', () => {
    expect(PASOS.map((p) => estadoPaso(BASE, p))).toEqual(['actual', 'pendiente'])
  })

  it('avanza paso a paso', () => {
    const c = avanzar(BASE)
    expect(PASOS.map((p) => estadoPaso(c, p))).toEqual(['completado', 'actual'])
  })

  it('no pasa del último paso', () => {
    expect(avanzar({ ...BASE, paso: 'barajar' }).paso).toBe('barajar')
  })

  it('con los mazos barajados todos los pasos están completados', () => {
    expect(PASOS.map((p) => estadoPaso(BARAJADA, p))).toEqual(['completado', 'completado'])
  })

  it('volver a un paso anula el barajado', () => {
    const c = volverA(BARAJADA, 'mazos')
    expect([c.paso, c.barajado, estadoAventura(c)]).toEqual(['mazos', undefined, 'configurando'])
  })

  it('volver a un paso conserva la selección de cartas y el modo', () => {
    const conCartas: Configuracion = { ...BARAJADA, modo: 'tablero', mazos: { atrezo: { cartas: ['mesa-1'], reemplazos: [] } } }
    const c = volverA(conCartas, 'mazos')
    expect([c.modo, c.mazos]).toEqual(['tablero', conCartas.mazos])
  })

  it('el estado de la aventura sigue al barajado', () => {
    expect([estadoAventura(BASE), estadoAventura(BARAJADA)]).toEqual(['configurando', 'mazo-barajado'])
  })

  it('las configuraciones sin paso retoman donde se quedaron', () => {
    const { paso: _, ...sinPaso } = BARAJADA
    expect([pasoActual(sinPaso), pasoActual({ modo: 'losetas', mazos: {} })]).toEqual(['barajar', 'mazos'])
  })

  it('el antiguo paso «mazmorra» retoma en los mazos', () => {
    expect(pasoActual({ ...BASE, paso: 'mazmorra' as Paso })).toBe('mazos')
  })
})
