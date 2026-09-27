/** Elemento al azar de una lista */
export function rnd<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Entero al azar entre min y max, ambos incluidos */
export function entre(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

export function d6(): number {
  return entre(1, 6)
}

/** Copia barajada (Fisher-Yates) */
export function barajar<T>(arr: readonly T[]): T[] {
  const copia = [...arr]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = entre(0, i)
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

/** Caras del dado de combate: la tirada de peligro lo cambia por 1D6 */
export const CARAS_DC = [
  { hasta: 3, cara: 'Calavera' },
  { hasta: 5, cara: 'Escudo blanco' },
  { hasta: 6, cara: 'Escudo negro' },
] as const

export type CaraDC = (typeof CARAS_DC)[number]['cara']

export const caraDC = (valor: number): CaraDC => (CARAS_DC.find((c) => valor <= c.hasta) ?? CARAS_DC[2]).cara

const NOTACION = /^(\d*)D(\d+|C)$/i

/** Si la notación («1D6», «D8», «2D6», «1DC») se puede tirar */
export const tirable = (dado: string) => NOTACION.test(dado.trim())

/** Tira dados en notación «1D6», «D8», «2D6» o «1DC» (el de combate como 1D6) */
export function tirar(dado: string): number {
  const [, n, caras] = NOTACION.exec(dado.trim()) ?? []
  if (!caras) throw new Error(`No se puede tirar ${dado}`)
  const max = caras.toUpperCase() === 'C' ? 6 : Number(caras)
  return Array.from({ length: Number(n || 1) }, () => entre(1, max)).reduce((a, b) => a + b, 0)
}

/**
 * Si el valor cae en el resultado de una tabla: «5», «1-4», «4+», «5 ó 6»
 * o una cara del dado de combate («Escudo negro»)
 */
export function enResultado(resultado: string, valor: number): boolean {
  const texto = resultado.trim().toLowerCase()
  const cara = CARAS_DC.find((c) => c.cara.toLowerCase() === texto)
  if (cara) return caraDC(valor) === cara.cara
  return texto.split(/\s*ó\s*/).some((parte) => {
    const [, desde, signo, hasta] = /^(\d+)\s*(-|\+)?\s*(\d+)?$/.exec(parte) ?? []
    if (!desde) return false
    if (signo === '+') return valor >= Number(desde)
    return valor >= Number(desde) && valor <= Number(hasta ?? desde)
  })
}
