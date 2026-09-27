import { beforeAll, describe, expect, it } from 'vitest'
import { cargarMonstruos, type Monstruos } from '../../../lib/personajes'
import { FACCIONES } from '../../generar/config/facciones'
import { generarMision } from '../../generar/lib/generador'
import { cargarPlantillaAventuras } from '../../generar/lib/plantilla'
import { CONFIG_EXTRAS_DEFECTO } from '../../generar/lib/reglasExtras'
import type { Mision } from '../../generar/lib/tipos'
import { MONSTRUO_DE_NOMBRE, TABLA_POR_FACCION, TABLAS, TABLAS_ENCUENTROS } from '../config/encuentros'
import { claveMonstruo, mazoMonstruos, opciones, propuesta, puntosCuerpoJefe, seleccionMonstruos } from './monstruos'

let monstruos: Monstruos
let caos: Mision
beforeAll(async () => {
  const [bestiario, plantilla] = await Promise.all([cargarMonstruos(), cargarPlantillaAventuras()])
  monstruos = bestiario
  caos = {
    ...generarMision(plantilla, 0, { ...CONFIG_EXTRAS_DEFECTO, probUna: 0, probDos: 0 }),
    faccion: { nombre: 'Agentes del Caos', errante: 'Cultista/Orco', erranteSuperior: 'H. Bestia/Fimir' },
    jefe: 'Nightstone',
    tipoJefe: 'Gárgola Avanzada',
    efectos: [],
  }
})

const copias = (tabla: (typeof TABLAS)[number], heroes: number) =>
  Object.fromEntries(mazoMonstruos(tabla, heroes).map((c) => [c.monstruo + (c.avanzado ? ' avanzado' : ''), c.copias]))

describe('tablas de encuentros', () => {
  it.each(TABLAS)('%s: resultados del 11 al 30', (tabla) => {
    const resultados = TABLAS_ENCUENTROS[tabla].encuentros.map((e) => e.resultado)
    expect(resultados).toEqual(Array.from({ length: 20 }, (_, i) => i + 11))
  })

  it.each(TABLAS)('%s: todo monstruo existe en templates/monstruos', (tabla) => {
    const ids = TABLAS_ENCUENTROS[tabla].encuentros.flatMap((e) => e.grupos.flatMap((g) => [g.monstruo].flat()))
    expect(ids.filter((id) => !monstruos[id])).toEqual([])
  })

  it.each(TABLAS)('%s: los avanzados tienen versión avanzada', (tabla) => {
    const grupos = TABLAS_ENCUENTROS[tabla].encuentros.flatMap((e) => e.grupos).filter((g) => g.avanzado)
    expect(grupos.flatMap((g) => [g.monstruo].flat()).filter((id) => !monstruos[id]?.avanzado)).toEqual([])
  })

  it('toda facción del generador tiene tabla', () => {
    expect(FACCIONES.filter((f) => !TABLA_POR_FACCION[f.nombre]).map((f) => f.nombre)).toEqual([])
  })
})

describe('mazo temático de monstruos', () => {
  it('lleva las miniaturas del encuentro más numeroso', () => {
    const c = copias('no-muertos', 4)
    expect([c.esqueleto, c.zombi, c.momia, c['momia avanzado'], c['conde-vampiro']]).toEqual([4, 4, 2, 3, 1])
  })

  it('con menos héroes pide menos miniaturas', () => {
    const c = copias('no-muertos', 1)
    expect([c.esqueleto, c.zombi, c.momia]).toEqual([2, 2, 2])
  })

  it('sin grupo usa la columna de 3 o 4 héroes', () => {
    expect(mazoMonstruos('forajidos', 0)).toEqual(mazoMonstruos('forajidos', 3))
  })

  it('incluye todas las opciones de un encuentro', () => {
    const c = copias('caos', 4)
    expect([c['hombre-bestia'], c['horror-rosa'], c['campeon-de-nurgle']]).toEqual([3, 3, 2])
  })
})

describe('monstruos de la misión', () => {
  const papeles = (heroes: number) =>
    Object.fromEntries(propuesta(caos, heroes).map((c) => [claveMonstruo(c.monstruo, c.avanzado), [c.copias, ...c.papeles]]))

  it('todo errante y jefe del generador es un monstruo del bestiario', () => {
    const nombres = FACCIONES.flatMap((f) => [
      ...f.errante.split('/'),
      ...f.erranteSuperior.split('/'),
      ...f.jefes.map((j) => j.tipo),
    ])
    const sueltos = nombres.filter((n) => !MONSTRUO_DE_NOMBRE[n.trim()] || !monstruos[MONSTRUO_DE_NOMBRE[n.trim()].monstruo])
    expect(sueltos).toEqual([])
  })

  it('con dos errantes posibles propone el primero', () => {
    expect(opciones('Cultista/Orco')[0]?.monstruo).toBe('cultista')
  })

  it('propone tantos errantes como héroes, al menos 2', () => {
    expect([papeles(1).cultista, papeles(4).cultista]).toEqual([
      [2, 'encuentros', 'errante'],
      [4, 'encuentros', 'errante'],
    ])
  })

  it('propone el errante superior y el Jefe Final con su versión', () => {
    const p = papeles(3)
    expect([p['hombre-bestia']?.at(-1), p['gargola:avanzado']]).toEqual(['errante-superior', [1, 'jefe']])
  })

  it('sin selección guardada se usa la propuesta', () => {
    expect(seleccionMonstruos(undefined, caos, 3)['gargola:avanzado']).toBe(1)
  })

  it('el Jefe Final suma un PC por héroe y los de la regla especial', () => {
    const conRegla: Mision = { ...caos, efectos: [{ tipo: 'jefe', puntosCuerpo: 2 }] }
    expect([puntosCuerpoJefe(caos, monstruos, 3), puntosCuerpoJefe(conRegla, monstruos, 3)]).toEqual([7, 9])
  })
})
