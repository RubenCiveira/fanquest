import { beforeAll, describe, expect, it } from 'vitest'
import {
  cargarAliados,
  cargarHabilidades,
  cargarHeroes,
  cargarMonstruos,
  FAMILIAS_MONSTRUOS,
  GRUPOS_ALIADOS,
  PERFILES_MOVIMIENTO,
  urlFichaVtt,
  urlRetrato,
  type GrupoAliados,
  type Habilidades,
  type Heroe,
  type Monstruos,
} from './personajes'

let heroes: Heroe[]
let habilidades: Habilidades
let monstruos: Monstruos
let aliados: GrupoAliados[]
beforeAll(async () => {
  ;[heroes, habilidades, monstruos, aliados] = await Promise.all([
    cargarHeroes(),
    cargarHabilidades(),
    cargarMonstruos(),
    cargarAliados(),
  ])
})

// los archivos tal cual están en disco, para detectar los que la carga no conoce
const archivosMonstruos = import.meta.glob<unknown[]>('/templates/monstruos/*.json', { eager: true, import: 'monstruos' })
const archivosAliados = import.meta.glob('/templates/aliados/*.json')
const nombres = (archivos: Record<string, unknown>) =>
  Object.keys(archivos)
    .map((ruta) => ruta.replace(/^.*\/|\.json$/g, ''))
    .sort()

describe('héroes de templates/heroes', () => {
  it('tienen los 24 héroes del manual con ids únicos', () => {
    expect([heroes.length, new Set(heroes.map((h) => h.id)).size]).toEqual([24, 24])
  })

  it('cada héroe tiene su retrato', () => {
    expect(heroes.filter((h) => !urlRetrato('heroes', h)).map((h) => h.id)).toEqual([])
  })

  it('usa la ficha VTT del sexo del héroe', () => {
    expect([urlFichaVtt('heroes', 'druida', 'mujer'), urlFichaVtt('heroes', 'druida', 'hombre')]).toEqual([
      expect.stringContaining('druida-mujer.png'),
      undefined,
    ])
  })

  it('usa la figura VTT del héroe vista desde arriba', () => {
    expect(urlFichaVtt('heroes', 'druida', 'mujer', 'vtt-heroe')).toContain('vtt-heroe/druida-mujer.png')
  })

  it('cada ficha VTT es de un héroe y un sexo', () => {
    const ids = new Set(heroes.flatMap((h) => [`${h.id}-hombre`, `${h.id}-mujer`]))
    const archivos = Object.keys(import.meta.glob('/templates/heroes/printables/vtt-*/*.png'))
    expect(archivos.map((ruta) => ruta.replace(/^.*\/|\.png$/g, '')).filter((id) => !ids.has(id))).toEqual([])
  })

  it('cada héroe tiene un perfil de movimiento de la tabla', () => {
    expect(heroes.filter((h) => !(h.movimiento in PERFILES_MOVIMIENTO)).map((h) => h.id)).toEqual([])
  })

  it('toda habilidad citada existe en templates/habilidades', () => {
    const citadas = heroes.flatMap((h) => [...h.habilidades, ...(h.opcionales ?? []), ...(h.eligeUna ?? [])])
    expect(citadas.filter((id) => !habilidades[id])).toEqual([])
  })

  it('las opcionales son habilidades del propio héroe', () => {
    const sueltas = heroes.flatMap((h) => (h.opcionales ?? []).filter((id) => !h.habilidades.includes(id)))
    expect(sueltas).toEqual([])
  })
})

describe('habilidades de templates/habilidades', () => {
  it('todas las usa algún héroe', () => {
    const usadas = new Set(heroes.flatMap((h) => [...h.habilidades, ...(h.eligeUna ?? [])]))
    expect(Object.keys(habilidades).filter((id) => !usadas.has(id))).toEqual([])
  })
})

describe('monstruos de templates/monstruos', () => {
  it('cada archivo es una familia conocida', () => {
    expect(nombres(archivosMonstruos)).toEqual([...FAMILIAS_MONSTRUOS].sort())
  })

  it('los ids no se repiten entre familias', () => {
    const total = Object.values(archivosMonstruos).reduce((n, lista) => n + lista.length, 0)
    expect(Object.keys(monstruos).length).toBe(total)
  })

  it('cada imagen tiene su archivo', () => {
    const lista = Object.values(monstruos)
    expect(lista.filter((m) => m.imagen && !urlRetrato('monstruos', m)).map((m) => m.id)).toEqual([])
  })

  it('las categorías van de 1 a 8', () => {
    const fuera = Object.values(monstruos).filter((m) => m.categoria !== undefined && (m.categoria < 1 || m.categoria > 8))
    expect(fuera.map((m) => m.id)).toEqual([])
  })

  it('cada monstruo tiene al menos 12 nombres cortos distintos para sus miniaturas', () => {
    const pocos = Object.values(monstruos).filter((m) => new Set(m.nombres ?? []).size < 12 || m.nombres?.some((n) => n.length > 12))
    expect(pocos.map((m) => m.id)).toEqual([])
  })

  it('los monstruos sin datos en los libros explican su estimación', () => {
    expect(Object.values(monstruos).filter((m) => m.estimado === '').map((m) => m.id)).toEqual([])
  })
})

describe('aliados de templates/aliados', () => {
  it('cada archivo es un grupo conocido', () => {
    expect(nombres(archivosAliados)).toEqual([...GRUPOS_ALIADOS].sort())
  })

  it.each(GRUPOS_ALIADOS)('%s: ids únicos', (id) => {
    const lista = aliados.find((g) => g.id === id)?.aliados ?? []
    expect([lista.length > 0, new Set(lista.map((a) => a.id)).size]).toEqual([true, lista.length])
  })
})
