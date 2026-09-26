import { beforeAll, describe, expect, it } from 'vitest'
import { generarMision } from '../../generar/lib/generador'
import { cargarPlantillaAventuras } from '../../generar/lib/plantilla'
import { CONFIG_EXTRAS_DEFECTO } from '../../generar/lib/reglasExtras'
import type { PlantillaAventuras } from '../../generar/lib/tipos'
import { categorias, MAZOS_POR_MODO } from '../config/mazos'
import { cargarMazos, MAZOS, urlImagen, type Mazos } from './mazos'
import { coincide } from './preparacion'

let mazos: Mazos
let plantilla: PlantillaAventuras
beforeAll(async () => {
  ;[mazos, plantilla] = await Promise.all([cargarMazos(), cargarPlantillaAventuras()])
})

describe('mazos de templates/mazos', () => {
  it('tienen las 147 cartas del PDF', () => {
    const total = MAZOS.reduce((n, id) => n + mazos[id].cartas.reduce((m, c) => m + c.copias, 0), 0)
    expect(total).toBe(147)
  })

  it.each(MAZOS)('%s: ids únicos con forma tipo-número', (id) => {
    const cartas = mazos[id].cartas
    const mal = cartas.filter((c) => !new RegExp(`^${c.tipo}-[1-9]\\d*$`).test(c.id))
    expect([new Set(cartas.map((c) => c.id)).size === cartas.length, mal]).toEqual([true, []])
  })

  it.each(MAZOS)('%s: cada imagen tiene su archivo', (id) => {
    const sinArchivo = mazos[id].cartas.filter((c) => c.imagen && !urlImagen(id, c))
    expect(sinArchivo.map((c) => c.id)).toEqual([])
  })

  it('las trampas son solo texto', () => {
    expect(mazos.trampas.cartas.some((c) => c.imagen)).toBe(false)
  })

  it('toda carta de salas y mazmorra pertenece a una categoría (salvo escaleras)', () => {
    const mision = generarMision(plantilla, 0, CONFIG_EXTRAS_DEFECTO)
    const sueltas = (['salas', 'mazmorra'] as const).flatMap((id) =>
      mazos[id].cartas
        .filter((c) => !c.tipo.includes('escaleras'))
        .filter((c) => !categorias(id, mision).some((cat) => coincide(cat, c.tipo)))
        .map((c) => c.id),
    )
    expect(sueltas).toEqual([])
  })
})

describe('reglas especiales contra los mazos', () => {
  it('toda carta que citan los efectos existe en su mazo', () => {
    const tipos = (id: keyof Mazos) => new Set(mazos[id].cartas.map((c) => c.tipo))
    const ids = (id: keyof Mazos) => new Set(mazos[id].cartas.map((c) => c.id))
    const rotas: string[] = []
    for (const { regla, efectos } of plantilla.especiales.reglas) {
      for (const e of efectos) {
        if (e.tipo === 'cambiar-cartas') {
          const mazo = e.mazo as keyof Mazos
          if (e.poner.tipo && !tipos(mazo).has(e.poner.tipo)) rotas.push(`${regla}: ${e.poner.tipo}`)
          if (e.poner.id && !ids(mazo).has(e.poner.id)) rotas.push(`${regla}: ${e.poner.id}`)
          for (const t of e.quitar.excepto ?? []) if (!tipos(mazo).has(t)) rotas.push(`${regla}: ${t}`)
        }
        if (e.tipo === 'sala') for (const el of e.elementos ?? []) if (!tipos('atrezo').has(el.tipo)) rotas.push(`${regla}: ${el.tipo}`)
        if (e.tipo === 'objeto') for (const b of e.buscar) if (b.al === 'revisar' && !tipos('atrezo').has(b.carta)) rotas.push(`${regla}: ${b.carta}`)
        if (e.tipo === 'pnj' && e.carta && !tipos('atrezo').has(e.carta)) rotas.push(`${regla}: ${e.carta}`)
      }
    }
    expect(rotas).toEqual([])
  })

  it('los mazos de cada modo existen', () => {
    const faltan = [...MAZOS_POR_MODO.losetas, ...MAZOS_POR_MODO.tablero].filter((id) => !mazos[id])
    expect(faltan).toEqual([])
  })
})
