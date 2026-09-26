import { beforeAll, describe, expect, it } from 'vitest'
import { textoPlano } from './textoPlano'
import { generarMision } from './generador'
import { cargarPlantillaAventuras } from './plantilla'
import { CONFIG_EXTRAS_DEFECTO } from './reglasExtras'
import type { PlantillaAventuras } from './tipos'

let p: PlantillaAventuras
beforeAll(async () => {
  p = await cargarPlantillaAventuras()
})

const SIN_EXTRAS = { ...CONFIG_EXTRAS_DEFECTO, probUna: 0, probDos: 0 }

describe('generarMision', () => {
  it('no deja marcadores ni valores vacíos en ningún tipo de misión', () => {
    const textos = p.especiales.reglas.flatMap(({ regla }) =>
      Array.from({ length: 40 }, () => textoPlano(generarMision(p, regla, CONFIG_EXTRAS_DEFECTO))),
    )
    expect(textos.filter((t) => /undefined|null|NaN|\{\w+(\|mayus)?\}/.test(t))).toEqual([])
  })

  it('usa el tipo de misión elegido con su regla y sus efectos', () => {
    const m = generarMision(p, 8, CONFIG_EXTRAS_DEFECTO)
    expect([m.regla, m.efectos.map((e) => e.tipo)]).toEqual([8, ['cambiar-cartas', 'sala', 'sala', 'pnj']])
  })

  it('una misión aleatoria sale de la tabla de objetivos', () => {
    const reglas = new Set(Array.from({ length: 300 }, () => generarMision(p, 'aleatoria', SIN_EXTRAS).regla))
    expect(Math.max(...reglas)).toBeLessThanOrEqual(14)
  })

  it('solo sortea PNJ en los tipos de misión que lo usan', () => {
    expect(generarMision(p, 0, SIN_EXTRAS).objetivo).toBe('Matar al Jefe Final.')
  })

  it('respeta los rangos de preparación sin reglas extras', () => {
    const m = generarMision(p, 0, SIN_EXTRAS)
    expect([m.salasNormales >= 6 && m.salasNormales <= 7, m.salasEspeciales >= 2 && m.salasEspeciales <= 3, m.dadoTrampa]).toEqual([true, true, 'D8'])
  })

  it('lanza un error con un tipo de misión inexistente', () => {
    expect(() => generarMision(p, 99, SIN_EXTRAS)).toThrow('No existe el tipo de misión 99')
  })
})
