import { cargarHabilidades, cargarHeroes } from '../../lib/personajes'

export async function cargarFichasHeroes() {
  const [heroes, habilidades] = await Promise.all([cargarHeroes(), cargarHabilidades()])
  return { heroes, habilidades }
}
