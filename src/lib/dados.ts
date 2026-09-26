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
