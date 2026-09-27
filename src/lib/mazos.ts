import { cachePorFuente, fuenteLocal, type FuentePlantillas } from './plantillas'

/** Carta de un mazo de `templates/mazos/<mazo>/base.json` */
export type CartaMazo = {
  id: string
  /** El `id` sin número: agrupa las variantes de una misma carta */
  tipo: string
  titulo: string
  copias: number
  imagen?: { archivo: string; tamano: 'pequeña' | 'mediana' | 'grande' }
  cita?: string
  texto?: string
  /** Lo que va tras la tirada (p. ej. el contenido del cofre) */
  notas?: string
  tirada?: TiradaCarta
  /** Solo trampas */
  activada?: { sinMonstruos: string; conMonstruos: string }
  encontrada?: string
}

export type TiradaCarta = {
  accion?: string
  dado?: string
  resultados: { resultado: string; texto?: string; tirada?: TiradaCarta }[]
}

export type Mazo = {
  id: string
  nombre: string
  dorso: string
  cartas: CartaMazo[]
}

export const MAZOS = [
  'atrezo',
  'trampas',
  'salas-especiales',
  'salas',
  'mazmorra',
  'pasillo',
] as const

export type IdMazo = (typeof MAZOS)[number]

export type Mazos = Record<IdMazo, Mazo>

/** Carga (una sola vez por fuente) los mazos base */
export const cargarMazos = cachePorFuente(async (fuente): Promise<Mazos> => {
  const mazos = await Promise.all(
    MAZOS.map(async (id) => {
      const mazo = await fuente.leer('mazos', `${id}/base`)
      if (typeof mazo !== 'object' || mazo === null || !('cartas' in mazo)) {
        throw new Error(`El mazo ${id} no tiene cartas`)
      }
      // la forma se ha comprobado arriba
      return [id, mazo as Mazo] as const
    }),
  )
  return Object.fromEntries(mazos) as Mazos
})

export function urlImagen(
  mazo: IdMazo,
  carta: CartaMazo,
  fuente: FuentePlantillas = fuenteLocal,
): string | undefined {
  return carta.imagen && fuente.url('mazos', `${mazo}/${carta.imagen.archivo}`)
}

export function urlDorso(mazo: Mazo, fuente: FuentePlantillas = fuenteLocal): string | undefined {
  return fuente.url('mazos', `${mazo.id}/${mazo.dorso}`)
}
