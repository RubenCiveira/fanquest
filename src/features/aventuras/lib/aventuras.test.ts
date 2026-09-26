import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { generarMision } from '../../generar/lib/generador'
import { cargarPlantillaAventuras } from '../../generar/lib/plantilla'
import { CONFIG_EXTRAS_DEFECTO } from '../../generar/lib/reglasExtras'
import type { Mision } from '../../generar/lib/tipos'
import {
  actualizarAventura,
  borrarAventura,
  guardarAventura,
  listarAventuras,
  obtenerAventura,
} from './aventuras'

let mision: Mision
beforeAll(async () => {
  mision = generarMision(await cargarPlantillaAventuras(), 0, CONFIG_EXTRAS_DEFECTO)
})

beforeEach(() => {
  const datos = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (clave: string) => datos.get(clave) ?? null,
    setItem: (clave: string, valor: string) => void datos.set(clave, valor),
  })
})

describe('almacén de aventuras', () => {
  it('guarda la misión como aventura sin empezar', async () => {
    const a = await guardarAventura(mision)
    expect([a.estado, (await obtenerAventura(a.id))?.mision.titulo]).toEqual(['sin-empezar', mision.titulo])
  })

  it('lista de la más reciente a la más antigua', async () => {
    const primera = await guardarAventura(mision)
    const segunda = await guardarAventura(mision)
    expect((await listarAventuras()).map((a) => a.id)).toEqual([segunda.id, primera.id])
  })

  it('actualiza una aventura', async () => {
    const a = await guardarAventura(mision)
    await actualizarAventura({ ...a, estado: 'configurando' })
    expect((await obtenerAventura(a.id))?.estado).toBe('configurando')
  })

  it('borra solo la aventura indicada', async () => {
    const queda = await guardarAventura(mision)
    const borrada = await guardarAventura(mision)
    await borrarAventura(borrada.id)
    expect((await listarAventuras()).map((a) => a.id)).toEqual([queda.id])
  })

  it('sin datos guardados no hay aventuras', async () => {
    expect(await listarAventuras()).toEqual([])
  })
})
