import { describe, expect, it } from 'vitest'
import { REGLAS_EXTRAS } from '../config/reglasExtras'
import {
  aplicarReglasExtras,
  CONFIG_EXTRAS_DEFECTO,
  probabilidades,
  reglaActiva,
  tirarReglasExtras,
} from './reglasExtras'
import type { Preparacion } from './tipos'

const DADOS = ['D4', 'D6', 'D8', 'D10', 'D12']
const BASE: Preparacion = { peligro: 0, dadoTrampa: 'D8', salasNormales: 6, salasEspeciales: 2 }
const regla = (id: string) => {
  const r = REGLAS_EXTRAS.reglas.find((r) => r.id === id)
  if (!r) throw new Error(`No existe la regla extra ${id}`)
  return r
}

describe('probabilidades', () => {
  it('reparte el resto a ninguna regla', () => {
    expect(probabilidades({ ...CONFIG_EXTRAS_DEFECTO, probUna: 50, probDos: 10 })).toEqual({ p1: 50, p2: 10, ninguna: 40 })
  })

  it('normaliza si la suma supera 100', () => {
    expect(probabilidades({ ...CONFIG_EXTRAS_DEFECTO, probUna: 150, probDos: 50 })).toEqual({ p1: 75, p2: 25, ninguna: 0 })
  })
})

describe('tirarReglasExtras', () => {
  it('saca exactamente una regla con el 100 % en una', () => {
    expect(tirarReglasExtras({ ...CONFIG_EXTRAS_DEFECTO, probUna: 100, probDos: 0 })).toHaveLength(1)
  })

  it('no saca ninguna con probabilidades a 0', () => {
    expect(tirarReglasExtras({ ...CONFIG_EXTRAS_DEFECTO, probUna: 0, probDos: 0 })).toHaveLength(0)
  })

  it('solo saca reglas activas', () => {
    const activas = Object.fromEntries(REGLAS_EXTRAS.reglas.map((r) => [r.id, r.id === 'niebla']))
    const extras = tirarReglasExtras({ activas, probUna: 0, probDos: 100 })
    expect(extras.map((r) => r.id)).toEqual(['niebla'])
  })

  it('respeta el estado inicial de la regla si no se ha tocado', () => {
    expect(reglaActiva(regla('niebla'), CONFIG_EXTRAS_DEFECTO)).toBe(regla('niebla').activa)
  })
})

describe('aplicarReglasExtras', () => {
  it('Misión Peligrosa sube el peligro', () => {
    expect(aplicarReglasExtras([regla('mision-peligrosa')], BASE, DADOS).peligro).toBe(1)
  })

  it('Más Trampas baja el dado de trampa', () => {
    expect(aplicarReglasExtras([regla('mas-trampas')], BASE, DADOS).dadoTrampa).toBe('D6')
  })

  it('Menos Trampas no pasa del último dado', () => {
    const base = { ...BASE, dadoTrampa: 'D12' }
    expect(aplicarReglasExtras([regla('menos-trampas')], base, DADOS).dadoTrampa).toBe('D12')
  })

  it('Comienzo Intenso cambia una sala normal por una especial con mínimo 4', () => {
    const base = { ...BASE, salasNormales: 4 }
    const r = aplicarReglasExtras([regla('comienzo-intenso')], base, DADOS)
    expect([r.salasNormales, r.salasEspeciales]).toEqual([4, 3])
  })
})
