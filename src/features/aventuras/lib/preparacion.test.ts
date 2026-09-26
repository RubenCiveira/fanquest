import { beforeAll, describe, expect, it } from 'vitest'
import { generarMision } from '../../generar/lib/generador'
import { cargarPlantillaAventuras } from '../../generar/lib/plantilla'
import { CONFIG_EXTRAS_DEFECTO } from '../../generar/lib/reglasExtras'
import type { Mision, PlantillaAventuras } from '../../generar/lib/tipos'
import { MAZOS_POR_MODO, type Modo } from '../config/mazos'
import { cargarMazos, type IdMazo, type Mazos } from '../../../lib/mazos'
import {
  avisos,
  barajarYGuardar,
  cartasBase,
  completar,
  disponibles,
  mover,
  nuevaConfiguracion,
  ordenar,
  recuento,
  type SeleccionMazo,
} from './preparacion'

let mazos: Mazos
let plantilla: PlantillaAventuras
beforeAll(async () => {
  ;[mazos, plantilla] = await Promise.all([cargarMazos(), cargarPlantillaAventuras()])
})

const SIN_EXTRAS = { ...CONFIG_EXTRAS_DEFECTO, probUna: 0, probDos: 0 }
const mision = (regla: number): Mision => generarMision(plantilla, regla, SIN_EXTRAS)
const VACIA: SeleccionMazo = { cartas: [], reemplazos: [] }
const tipo = (mazo: IdMazo, id: string) => mazos[mazo].cartas.find((c) => c.id === id)?.tipo

describe('completar', () => {
  it('cumple la misión en todos los mazos, modos y reglas especiales', () => {
    const fallos = plantilla.especiales.reglas.flatMap(({ regla }) => {
      const m = mision(regla)
      return (['losetas', 'tablero'] as Modo[]).flatMap((modo) =>
        MAZOS_POR_MODO[modo].flatMap((id) => avisos(mazos[id], m, completar(mazos[id], m, VACIA)).map((a) => `${regla} ${id}: ${a}`)),
      )
    })
    expect(fallos).toEqual([])
  })

  it('nunca usa más copias de las que tiene el mazo', () => {
    const m = mision(4)
    const s = completar(mazos.atrezo, m, VACIA)
    expect([...disponibles(mazos.atrezo, s).values()].filter((n) => n < 0)).toEqual([])
  })

  it('arma el mazo de atrezo con 20 cartas', () => {
    expect(completar(mazos.atrezo, mision(0), VACIA).cartas).toHaveLength(20)
  })

  it('regla 1: cambia dos cartas que no son cofres por Librerías', () => {
    const { reemplazos } = completar(mazos.atrezo, mision(1), VACIA)
    expect(reemplazos.map((r) => [tipo('atrezo', r.reemplazo), tipo('atrezo', r.original) === 'cofre'])).toEqual([
      ['libreria', false],
      ['libreria', false],
    ])
  })

  it('regla 8: cambia una Sala Especial por la Sala Especial A', () => {
    const { cartas, reemplazos } = completar(mazos['salas-especiales'], mision(8), VACIA)
    expect([cartas.includes('sala-especial-de-mision-1'), reemplazos.length]).toEqual([true, 1])
  })

  it('sin reglas de cambio no hay reemplazos', () => {
    expect(completar(mazos.atrezo, mision(0), VACIA).reemplazos).toEqual([])
  })

  it('respeta lo que ya hay en la mesa', () => {
    const m = mision(0)
    const conCofre = { cartas: ['cofre-2'], reemplazos: [] }
    expect(completar(mazos.atrezo, m, conCofre).cartas.filter((c) => tipo('atrezo', c) === 'cofre')).toEqual(['cofre-2'])
  })
})

describe('mover', () => {
  it('pone una copia en la mesa', () => {
    expect(mover(VACIA, 'mesa-1', 1).cartas).toEqual(['mesa-1'])
  })

  it('al quitar una carta de regla especial la original vuelve al mazo', () => {
    const s = { cartas: ['libreria-1'], reemplazos: [{ original: 'tumba-1', reemplazo: 'libreria-1' }] }
    expect(mover(s, 'libreria-1', -1)).toEqual(VACIA)
  })
})

describe('cartasBase y disponibles', () => {
  const s = { cartas: ['libreria-1', 'mesa-1'], reemplazos: [{ original: 'tumba-1', reemplazo: 'libreria-1' }] }

  it('la composición base cuenta la original, no el reemplazo', () => {
    expect(cartasBase(s).sort()).toEqual(['mesa-1', 'tumba-1'])
  })

  it('la carta apartada no está disponible', () => {
    expect(disponibles(mazos.atrezo, s).get('tumba-1')).toBe(0)
  })
})

describe('avisos', () => {
  it('avisa de lo que falta', () => {
    expect(avisos(mazos.atrezo, mision(0), VACIA)).toEqual(['Falta 1: cofre', 'Faltan 9: con atrezo al azar', 'Faltan 10: sin atrezo'])
  })

  it('avisa de lo que sobra', () => {
    const m = mision(0)
    const s = completar(mazos.atrezo, m, VACIA)
    expect(avisos(mazos.atrezo, m, mover(s, 'sin-atrezo-1', 1))).toEqual(['Sobra 1: sin atrezo'])
  })

  it('avisa de cartas que no forman parte del mazo en la misión', () => {
    const m = mision(0)
    const s = mover(completar(mazos.mazmorra, m, VACIA), 'sala-escaleras-mediana-o-pequena-1', 1)
    expect(avisos(mazos.mazmorra, m, s)).toEqual(['«Sala Escaleras, Mediana o Pequeña» no forma parte de este mazo en la misión'])
  })

  it('avisa de la regla especial sin aplicar', () => {
    const m = mision(8)
    const s = mover(completar(mazos['salas-especiales'], m, VACIA), 'sala-especial-de-mision-1', -1)
    expect(avisos(mazos['salas-especiales'], m, s)).toContain('Regla especial: falta cambiar 1 carta por Sala Especial de Misión')
  })
})

describe('recuento', () => {
  it('cuenta por categoría de la misión', () => {
    const m = mision(0)
    const r = recuento(mazos.mazmorra, m, completar(mazos.mazmorra, m, VACIA))
    expect(r.map(({ categoria, hay }) => [categoria.id, hay === categoria.cantidad])).toEqual([
      ['normales', true],
      ['especiales', true],
      ['pasillos', true],
      ['objetivo', true],
    ])
  })
})

describe('ordenar', () => {
  it.each([
    ['losetas', 'mazmorra', 4],
    ['tablero', 'salas', 3],
  ] as const)('%s (%s): la Sala Objetivo va entre las %i últimas cartas', (modo, id, ultimas) => {
    const m = mision(0)
    const s = completar(mazos[id], m, VACIA)
    const posiciones = Array.from({ length: 50 }, () => {
      const orden = ordenar(mazos[id], s, modo)
      return orden.length - orden.findIndex((c) => tipo(id, c)?.startsWith('sala-objetivo'))
    })
    expect(Math.max(...posiciones)).toBeLessThanOrEqual(ultimas)
  })

  it('el orden es una permutación de la mesa', () => {
    const s = completar(mazos.atrezo, mision(0), VACIA)
    expect([...ordenar(mazos.atrezo, s, 'losetas')].sort()).toEqual([...s.cartas].sort())
  })
})

describe('configuración', () => {
  it('empieza con losetas y los mazos de ambos modos preparados', () => {
    const c = nuevaConfiguracion(mazos, mision(0))
    expect([c.modo, Object.keys(c.mazos).sort()]).toEqual(['losetas', ['atrezo', 'mazmorra', 'salas', 'salas-especiales']])
  })

  it('barajar y guardar solo ordena los mazos del modo', () => {
    const c = barajarYGuardar(mazos, { ...nuevaConfiguracion(mazos, mision(0)), modo: 'tablero' })
    expect(Object.keys(c.barajado?.orden ?? {}).sort()).toEqual(['atrezo', 'salas', 'salas-especiales'])
  })
})
