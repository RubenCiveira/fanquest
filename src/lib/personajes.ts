import type { TiradaCarta } from './mazos'
import { cachePorFuente, fuenteLocal, type FuentePlantillas } from './plantillas'

/**
 * Puntos de Movimiento fijos según la descripción temática de la miniatura
 * (Aventuras Infinitas, «Nuevas reglas de movimiento y áreas de influencia»).
 * Se juegan junto a las cartas de iniciativa.
 */
export const PERFILES_MOVIMIENTO = {
  pesado: { puntos: 4, descripcion: 'Algo pesado y reptante', ejemplos: 'Momias' },
  tambaleante: { puntos: 5, descripcion: 'Algo lento y tambaleante', ejemplos: 'Zombis, portadores de plaga' },
  lento: {
    puntos: 6,
    descripcion: 'Alguien con piernas cortas o más lento que un humano en forma',
    ejemplos: 'Enanos, esqueletos, un humano torpe o con una pesada armadura',
  },
  humanoide: {
    puntos: 7,
    descripcion: 'Una criatura humanoide en forma',
    ejemplos: 'Humanos, orcos, fimirs, abominaciones, guerreros del Caos',
  },
  agil: { puntos: 8, descripcion: 'Alguien rápido, ágil, ligero o cuadrúpedo', ejemplos: 'Elfos, goblins, canes' },
  veloz: { puntos: 9, descripcion: 'Alguien extremadamente rápido, cuadrúpedo veloz', ejemplos: 'Caballos, felinos rápidos' },
  volador: { puntos: 10, descripcion: 'Alguien volador', ejemplos: 'Diablillos, harpías, dragones voladores' },
} as const

export type PerfilMovimiento = keyof typeof PERFILES_MOVIMIENTO

/** Sin Puntos de Movimiento fijos, los héroes tiran estos dados cada turno (FetenQuest) */
export const DADOS_MOVIMIENTO = '2D6'

/** Dados de ataque: un número o, p. ej., «2+1» o «5/4» (dos ataques) */
type Dados = number | string

export type Estadisticas = {
  movimiento: number
  ataque: Dados
  defensa: number
  cuerpo: number
  mente: number
}

/** Regla especial; las que se explican solas (p. ej. «No-muerto») no llevan texto */
export type ReglaEspecial = { nombre: string; texto?: string }

/** Héroe de `templates/heroes/base.json` */
export type Heroe = Omit<Estadisticas, 'movimiento'> & {
  id: string
  nombre: string
  grupo: 'clasico' | 'extra'
  /** Alineamiento malvado (regla opcional) */
  malvado?: boolean
  cita: string
  descripcion: string
  movimiento: PerfilMovimiento
  equipo: string
  limitaciones: string
  /** Ids de `templates/habilidades/base.json` con las que empieza */
  habilidades: string[]
  /** Las que el manual marca como opcionales */
  opcionales?: string[]
  /** Además, una de estas a su elección (p. ej. la marca de su Dios) */
  eligeUna?: string[]
  imagen: string
}

/** Habilidad de héroe de `templates/habilidades/base.json` */
export type Habilidad = {
  id: string
  titulo: string
  texto: string
  /** Tablas que la habilidad pide tirar */
  tiradas?: TiradaCarta[]
}

export type Habilidades = Record<string, Habilidad>

/** Familias del bestiario: un archivo `templates/monstruos/<familia>.json` cada una */
export const FAMILIAS_MONSTRUOS = [
  'no-muertos',
  'pieles-verdes',
  'ogros-y-trolls',
  'forajidos',
  'caos',
  'demonios',
  'skaven',
  'bestias',
  'elementales',
] as const

export type FamiliaMonstruos = (typeof FAMILIAS_MONSTRUOS)[number]

/** Monstruo de `templates/monstruos/<familia>.json` */
export type Monstruo = Estadisticas & {
  id: string
  nombre: string
  familia: FamiliaMonstruos
  /** Nombres cortos para distinguir miniaturas iguales en la mesa */
  nombres?: string[]
  /** Poder de 1 a 8 de las Categorías de monstruos de Aventuras Infinitas */
  categoria?: number
  descripcion: string
  reglas: ReglaEspecial[]
  /** Versión de «Monstruos avanzados» del bestiario */
  avanzado?: Estadisticas & { reglas: ReglaEspecial[] }
  /** Sin estadísticas en los libros: en qué se basan las estimadas */
  estimado?: string
  imagen?: string
}

export type Monstruos = Record<string, Monstruo>

/** Mercenario, compañero animal o PNJ que acompaña a los héroes */
export type Aliado = Estadisticas & {
  id: string
  nombre: string
  descripcion?: string
  reglas: ReglaEspecial[]
  /** Precio en la ciudad, si se compra o contrata */
  coste?: string
}

/** Grupos de aliados: un archivo `templates/aliados/<grupo>.json` cada uno */
export const GRUPOS_ALIADOS = ['animales', 'mercenarios', 'pnjs'] as const

export type IdGrupoAliados = (typeof GRUPOS_ALIADOS)[number]

export type GrupoAliados = {
  id: IdGrupoAliados
  nombre: string
  /** Reglas comunes a todo el grupo */
  reglas: string[]
  aliados: Aliado[]
}

/** Lee `templates/<coleccion>/<archivo>.json` y comprueba que tiene la lista `clave` */
async function leer<T>(fuente: FuentePlantillas, coleccion: string, archivo: string, clave: string): Promise<T> {
  const datos = await fuente.leer(coleccion, archivo)
  const lista = typeof datos === 'object' && datos !== null ? (datos as Record<string, unknown>)[clave] : null
  if (!Array.isArray(lista)) throw new Error(`templates/${coleccion}/${archivo}.json no tiene ${clave}`)
  // la lista se ha comprobado; el resto de la forma lo cubren los tests de las plantillas
  return datos as T
}

/** Carga (una sola vez por fuente) los héroes, en el orden del manual */
export const cargarHeroes = cachePorFuente(
  async (fuente) => (await leer<{ heroes: Heroe[] }>(fuente, 'heroes', 'base', 'heroes')).heroes,
)

/** Carga (una sola vez por fuente) las habilidades de héroes, por id */
export const cargarHabilidades = cachePorFuente(async (fuente): Promise<Habilidades> => {
  const { habilidades } = await leer<{ habilidades: Habilidad[] }>(fuente, 'habilidades', 'base', 'habilidades')
  return Object.fromEntries(habilidades.map((h) => [h.id, h]))
})

/** Carga (una sola vez por fuente) los monstruos de todas las familias, por id */
export const cargarMonstruos = cachePorFuente(async (fuente): Promise<Monstruos> => {
  const familias = await cargarBestiario(fuente)
  return Object.fromEntries(familias.flatMap((f) => f.monstruos).map((m) => [m.id, m]))
})

export type Familia = { id: FamiliaMonstruos; nombre: string; monstruos: Monstruo[] }

/** Carga (una sola vez por fuente) el bestiario agrupado por familias */
export const cargarBestiario = cachePorFuente((fuente) =>
  Promise.all(
    FAMILIAS_MONSTRUOS.map(async (familia): Promise<Familia> => {
      const datos = await leer<Omit<Familia, 'id'> & { monstruos: Omit<Monstruo, 'familia'>[] }>(
        fuente,
        'monstruos',
        familia,
        'monstruos',
      )
      return { id: familia, nombre: datos.nombre, monstruos: datos.monstruos.map((m) => ({ ...m, familia })) }
    }),
  ),
)

/** Carga (una sola vez por fuente) los grupos de aliados */
export const cargarAliados = cachePorFuente((fuente) =>
  Promise.all(GRUPOS_ALIADOS.map((grupo) => leer<GrupoAliados>(fuente, 'aliados', grupo, 'aliados'))),
)

export const puntosMovimiento = (heroe: Heroe) => PERFILES_MOVIMIENTO[heroe.movimiento].puntos

/** Estadísticas y reglas con las que juega el monstruo */
export function version(m: Monstruo, avanzado = false): Estadisticas & { reglas: ReglaEspecial[] } {
  return avanzado && m.avanzado ? m.avanzado : m
}

/** Sexo del héroe: elige su ficha VTT */
export type Sexo = 'hombre' | 'mujer'

/**
 * Ficha VTT de `templates/<coleccion>/printables/<carpeta>/`, si la hay:
 * `<id>-<sexo>.png` para los héroes y `<id>.png` para los monstruos.
 * `vtt-face` es el retrato y `vtt-heroe`, la figura vista desde arriba
 */
export function urlFichaVtt(
  coleccion: 'heroes' | 'monstruos',
  id: string,
  sexo?: Sexo,
  carpeta: 'vtt-face' | 'vtt-heroe' = 'vtt-face',
  fuente: FuentePlantillas = fuenteLocal,
): string | undefined {
  return fuente.url(coleccion, `printables/${carpeta}/${sexo ? `${id}-${sexo}` : id}.png`)
}

export function urlRetrato(
  coleccion: 'heroes' | 'monstruos' | 'aliados',
  personaje: { imagen?: string },
  fuente: FuentePlantillas = fuenteLocal,
): string | undefined {
  return personaje.imagen && fuente.url(coleccion, personaje.imagen)
}
