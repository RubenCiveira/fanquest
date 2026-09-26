import { describe, expect, it } from 'vitest'
import { fuenteLocal, type FuentePlantillas } from '../../../lib/plantillas'
import { cargarPlantillaAventuras } from './plantilla'

/** Fuente local con un archivo modificado */
function fuenteCon(archivo: string, cambiar: (datos: Record<string, unknown>) => unknown): FuentePlantillas {
  return {
    async leer(coleccion, nombre) {
      const datos = structuredClone(await fuenteLocal.leer(coleccion, nombre)) as Record<string, unknown>
      return nombre === archivo ? cambiar(datos) : datos
    },
    url: fuenteLocal.url,
  }
}

describe('cargarPlantillaAventuras', () => {
  it('carga las plantillas de templates/aventuras', async () => {
    const p = await cargarPlantillaAventuras()
    expect(p.especiales.reglas).toHaveLength(15)
  })

  it('reutiliza la carga por fuente', () => {
    expect(cargarPlantillaAventuras()).toBe(cargarPlantillaAventuras())
  })

  it('rechaza una plantilla sin todas las narrativas', async () => {
    const fuente = fuenteCon('titulos', (d) => ({ jefe: d.jefe }))
    await expect(cargarPlantillaAventuras(fuente)).rejects.toThrow('titulos.json le falta: rescate')
  })

  it('rechaza efectos desconocidos en las reglas especiales', async () => {
    const fuente = fuenteCon('especiales', (d) => {
      const reglas = d.reglas as { efectos: unknown[] }[]
      reglas[1].efectos.push({ tipo: 'teletransporte' })
      return d
    })
    await expect(cargarPlantillaAventuras(fuente)).rejects.toThrow('efectos desconocidos (1: teletransporte)')
  })

  it('rechaza que falten reglas de la tabla de objetivos', async () => {
    const fuente = fuenteCon('especiales', (d) => ({ reglas: (d.reglas as { regla: number }[]).filter((r) => r.regla !== 7) }))
    await expect(cargarPlantillaAventuras(fuente)).rejects.toThrow('no define las reglas 7')
  })

  it('rechaza un archivo inexistente', async () => {
    const fuente: FuentePlantillas = { leer: () => fuenteLocal.leer('aventuras', 'no-existe'), url: fuenteLocal.url }
    await expect(cargarPlantillaAventuras(fuente)).rejects.toThrow('No existe la plantilla')
  })
})
