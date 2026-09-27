import { beforeAll, describe, expect, it } from 'vitest'
import { FACCIONES } from '../../generar/config/facciones'
import { cargarPlantillaAventuras } from '../../generar/lib/plantilla'
import type { PlantillaAventuras, TipoMision } from '../../generar/lib/tipos'
import { aplicarFaccion, aplicarTipo, exportarMision, importarMision, misionVacia, nombreArchivo } from './editarMision'

let plantilla: PlantillaAventuras
const tipo = (regla: number): TipoMision => {
  const t = plantilla.especiales.reglas.find((r) => r.regla === regla)
  if (!t) throw new Error(`Sin tipo ${regla}`)
  return t
}
beforeAll(async () => {
  plantilla = await cargarPlantillaAventuras()
})

describe('editar misiones a mano', () => {
  it('una misión vacía parte de la preparación estándar y de la primera facción', () => {
    const m = misionVacia(tipo(0))
    expect([m.salasNormales, m.salasEspeciales, m.pasillos, m.dadoTrampa, m.faccion.nombre, m.tipoJefe]).toEqual([
      6,
      2,
      3,
      'D8',
      'No muertos',
      'Vampiro',
    ])
  })

  it('el tipo de misión pone su regla especial y sus efectos para la partida', () => {
    const m = aplicarTipo(misionVacia(tipo(0)), tipo(11))
    expect([m.regla, m.reglaEspecial, m.efectos]).toEqual([11, tipo(11).texto, tipo(11).efectos])
  })

  it('en el objetivo quedan a la vista los marcadores que no tiene la misión', () => {
    expect(aplicarTipo(misionVacia(tipo(0)), tipo(8)).objetivo).toContain('{pnj}')
  })

  it('al cambiar de facción, el jefe pasa a uno de los suyos', () => {
    const [, pielesVerdes] = FACCIONES
    expect(aplicarFaccion(misionVacia(tipo(0)), pielesVerdes).tipoJefe).toBe(pielesVerdes.jefes[0].tipo)
  })

  it('lo exportado se importa igual', () => {
    const m = { ...misionVacia(tipo(9)), titulo: 'Rescate en la cripta' }
    expect(importarMision(exportarMision(m), misionVacia(tipo(0)))).toEqual(m)
  })

  it('una misión suelta con campos de menos se completa con los de la base', () => {
    const base = misionVacia(tipo(0))
    expect(importarMision('{"titulo": "Solo título"}', base)).toEqual({ ...base, titulo: 'Solo título' })
  })

  it('sin título no es una aventura', () => {
    expect(() => importarMision('{"mision": {}}', misionVacia(tipo(0)))).toThrow('título')
  })

  it('el archivo se nombra por el título, sin tildes ni espacios', () => {
    expect(nombreArchivo({ ...misionVacia(tipo(0)), titulo: 'El Último Aliento' })).toBe('el-ultimo-aliento.json')
  })
})
