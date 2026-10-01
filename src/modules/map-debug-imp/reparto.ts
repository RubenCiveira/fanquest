import type { PersonajeEnJuego } from '../gamemap'

/**
 * Cómo se propone repartir `total` de daño entre los objetivos, en su orden
 * (los más cercanos primero): a cada uno, lo que le quede de vida, y lo que
 * sobre al último; sin cuenta de vida, todo al primero que no la lleva
 */
export function repartoEnOrden(objetivos: Pick<PersonajeEnJuego, 'id' | 'vida'>[], total: number): Record<string, number> {
  let queda = total
  return Object.fromEntries(
    objetivos.map(({ id, vida }, i) => {
      const suyo = i === objetivos.length - 1 || vida === undefined ? queda : Math.min(queda, vida)
      queda -= suyo
      return [id, suyo]
    }),
  )
}
