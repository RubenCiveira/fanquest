import type { Partida, Zona } from './partida'

/**
 * Lo colocado en la rejilla (regla «Usar mapa»). `x` e `y` son la casilla
 * superior izquierda; el atrezo ocupa varias según su tipo de carta.
 */
export type Pieza = { id: string; x: number; y: number } & (
  | { tipo: 'miembro' | 'monstruo' }
  | { tipo: 'atrezo'; atrezo: string; girada?: boolean }
)

/** Casillas de la sala o pasillo en que están los héroes */
export type Rejilla = { columnas: number; filas: number; piezas: Pieza[] }

type Medida = { columnas: number; filas: number }

/** Tamaños típicos de loseta de Aventuras Infinitas; se ajustan en la partida */
const TAMANOS = {
  pasillo: { columnas: 2, filas: 7 },
  pequena: { columnas: 4, filas: 3 },
  mediana: { columnas: 6, filas: 4 },
  grande: { columnas: 8, filas: 6 },
} satisfies Record<string, Medida>

/** Área del mobiliario según el manual de FetenQuest; el resto ocupa una casilla */
const HUELLAS: Record<string, Medida> = {
  mesa: { columnas: 3, filas: 2 },
  'banco-de-alquimista': { columnas: 3, filas: 2 },
  'potro-de-tortura': { columnas: 3, filas: 2 },
  'mesa-del-brujo': { columnas: 3, filas: 2 },
  tumba: { columnas: 3, filas: 2 },
  armario: { columnas: 3, filas: 1 },
  libreria: { columnas: 3, filas: 1 },
  chimenea: { columnas: 3, filas: 1 },
  armeria: { columnas: 3, filas: 1 },
}

/** Mobiliario al que se puede subir una miniatura */
const TRANSITABLE = new Set(['mesa', 'potro-de-tortura'])

export const MAX_LADO = 16

/** Tamaño inicial según la carta que salió: el Mazo de Mazmorra lo indica */
export function tamanoZona(z: Zona): Medida {
  if (z.tipo === 'pasillo') return TAMANOS.pasillo
  const ids = z.sucesos.flatMap((s) => (s.tipo === 'carta' ? [s.id] : []))
  const tamano = (['grande', 'mediana', 'pequena'] as const).find((t) => ids.some((id) => id.includes(t)))
  return TAMANOS[tamano ?? 'mediana']
}

export const rejillaDe = (z: Zona): Rejilla => z.rejilla ?? { ...tamanoZona(z), piezas: [] }

export function huella(p: Pieza): Medida {
  if (p.tipo !== 'atrezo') return { columnas: 1, filas: 1 }
  const h = HUELLAS[p.atrezo] ?? { columnas: 1, filas: 1 }
  return p.girada ? { columnas: h.filas, filas: h.columnas } : h
}

const casillas = (p: Pieza) => {
  const { columnas, filas } = huella(p)
  return Array.from({ length: columnas * filas }, (_, i) => `${p.x + (i % columnas)},${p.y + Math.floor(i / columnas)}`)
}

/** Dos piezas pueden compartir casilla si una es una ficha subida a mobiliario transitable */
function compatibles(a: Pieza, b: Pieza) {
  if (a.tipo === 'atrezo' && b.tipo === 'atrezo') return false
  if (a.tipo !== 'atrezo' && b.tipo !== 'atrezo') return false
  const mueble = a.tipo === 'atrezo' ? a : b
  return mueble.tipo === 'atrezo' && TRANSITABLE.has(mueble.atrezo)
}

/** Si la pieza puede ir ahí: dentro de la rejilla y sin chocar con otra */
export function cabe(r: Rejilla, p: Pieza) {
  const { columnas, filas } = huella(p)
  if (p.x < 0 || p.y < 0 || p.x + columnas > r.columnas || p.y + filas > r.filas) return false
  const propias = new Set(casillas(p))
  return r.piezas.every((otra) => otra.id === p.id || compatibles(p, otra) || !casillas(otra).some((c) => propias.has(c)))
}

/** Coloca o mueve una pieza; si no cabe ahí, la rejilla no cambia */
export function colocar(r: Rejilla, p: Pieza): Rejilla {
  if (!cabe(r, p)) return r
  return { ...r, piezas: [...r.piezas.filter((otra) => otra.id !== p.id), p] }
}

export const quitar = (r: Rejilla, id: string): Rejilla => ({ ...r, piezas: r.piezas.filter((p) => p.id !== id) })

/** Desplaza la pieza lo justo para que no se salga por un borde */
export function encajar(r: Rejilla, p: Pieza): Pieza {
  const { columnas, filas } = huella(p)
  return { ...p, x: Math.max(0, Math.min(p.x, r.columnas - columnas)), y: Math.max(0, Math.min(p.y, r.filas - filas)) }
}

/** Gira el mobiliario; junto a un borde se desplaza lo justo para caber */
export function girar(r: Rejilla, id: string): Rejilla {
  const p = r.piezas.find((p) => p.id === id)
  return p?.tipo === 'atrezo' ? colocar(r, encajar(r, { ...p, girada: !p.girada })) : r
}

/** Cambia el tamaño; lo que queda fuera vuelve a la bandeja */
export function redimensionar(r: Rejilla, columnas: number, filas: number): Rejilla {
  const nueva = {
    columnas: Math.min(MAX_LADO, Math.max(1, columnas)),
    filas: Math.min(MAX_LADO, Math.max(1, filas)),
    piezas: [],
  }
  return { ...nueva, piezas: r.piezas.filter((p) => cabe(nueva, p)) }
}

export const conRejilla = (p: Partida, cambio: (r: Rejilla) => Rejilla): Partida => ({
  ...p,
  zona: { ...p.zona, rejilla: cambio(rejillaDe(p.zona)) },
})

/** Guarda el tamaño de la zona al llegar a ella, aunque aún no se haya colocado nada */
export const fijarRejilla = (p: Partida): Partida => (p.zona.rejilla ? p : conRejilla(p, (r) => r))

/** Hasta cuántas casillas fuera del mapa atrae una ficha hacia el borde */
const ATRACCION = 0.5

/**
 * Casilla para un punto en unidades de casilla (0,0 es la esquina superior
 * izquierda): la que está debajo o, cerca del borde, la más próxima. Con el
 * mapa desplazado, `visibles` son las columnas que se ven: las ocultas no
 * reciben fichas y solo atraen los bordes reales del mapa
 */
export function casillaCercana(
  x: number,
  y: number,
  { columnas, filas }: Medida,
  visibles = { desde: 0, hasta: columnas },
): { x: number; y: number } | undefined {
  // con margen: un desplazamiento de décimas de píxel no oculta el borde
  const izquierda = visibles.desde > 0.01 ? visibles.desde : -ATRACCION
  const derecha = visibles.hasta < columnas - 0.01 ? visibles.hasta : columnas + ATRACCION
  if (x < izquierda || y < -ATRACCION || x >= derecha || y >= filas + ATRACCION) return
  return {
    x: Math.max(0, Math.min(columnas - 1, Math.floor(x))),
    y: Math.max(0, Math.min(filas - 1, Math.floor(y))),
  }
}

/** Casilla del mapa (`MapaZona`) bajo el puntero o atraída por él, si la hay */
export function casillaEn(x: number, y: number): { x: number; y: number } | undefined {
  const rejilla = document.querySelector<HTMLElement>('.rejilla')
  if (!rejilla) return
  const r = rejilla.getBoundingClientRect()
  const medida = { columnas: Number(rejilla.dataset.columnas), filas: Number(rejilla.dataset.filas) }
  const ancho = r.width / medida.columnas
  // el marco recorta el mapa cuando no cabe y se desplaza
  const marco = rejilla.parentElement?.getBoundingClientRect() ?? r
  const visibles = { desde: (marco.left - r.left) / ancho, hasta: (marco.right - r.left) / ancho }
  return casillaCercana((x - r.left) / ancho, ((y - r.top) / r.height) * medida.filas, medida, visibles)
}
