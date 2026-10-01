import { conPersonaje, conPersonajeNoJugador, escuadrasDe, todosLosPersonajes } from './activaciones'
import { estanciasDe } from './estancias'
import type { Estancia } from './modelo/estancia'
import type { Mapa } from './modelo/mapa'
import type { TipoConFlags } from './modelo/tipoConFlags'

type ConFlags = { id: string; flags?: string[] }

const NINGUNO: Record<TipoConFlags, string> = {
  estancia: 'ninguna estancia',
  escuadra: 'ninguna escuadra',
  personaje: 'ningún personaje',
  elemento: 'ningún elemento',
  puerta: 'ninguna puerta',
}

/** Por qué no se pueden cambiar sus flags: no está en el mapa */
export const motivoSinFlags = (tipo: TipoConFlags, id: string) => `No hay ${NINGUNO[tipo]} «${id}» en el mapa`

/** Sus flags cambiadas, sin ninguna si no queda ninguna */
const cambiadas = <T extends ConFlags>(x: T, id: string, cambio: (flags: string[]) => string[]): T => {
  if (x.id !== id) return x
  const flags = cambio(x.flags ?? [])
  return { ...x, flags: flags.length ? flags : undefined }
}

function enEstancia(e: Estancia, tipo: TipoConFlags, id: string, cambio: (flags: string[]) => string[]): Estancia {
  return {
    ...(tipo === 'estancia' ? cambiadas(e, id, cambio) : e),
    ...(tipo === 'elemento' && { elementos: e.elementos.map((el) => cambiadas(el, id, cambio)) }),
    ...(tipo === 'puerta' && { puertas: e.puertas.map((p) => cambiadas(p, id, cambio)) }),
    estancias: e.estancias.map((hija) => enEstancia(hija, tipo, id, cambio)),
  }
}

/** Las flags de lo que tiene ese tipo e id (vacías si no tiene); nada si no está en el mapa */
export function flagsDe(m: Mapa, tipo: TipoConFlags, id: string): string[] | undefined {
  const estancias = m.estancias.flatMap((raiz) => estanciasDe(raiz).map(({ estancia }) => estancia))
  const candidatos: ConFlags[] = {
    estancia: () => estancias,
    escuadra: () => escuadrasDe(m),
    personaje: () => todosLosPersonajes(m),
    elemento: () => estancias.flatMap((e) => e.elementos),
    puerta: () => estancias.flatMap((e) => e.puertas),
  }[tipo]()
  const encontrado = candidatos.find((x) => x.id === id)
  return encontrado && (encontrado.flags ?? [])
}

/** El mapa con las flags de lo que tiene ese tipo e id cambiadas */
export function conFlags(m: Mapa, tipo: TipoConFlags, id: string, cambio: (flags: string[]) => string[]): Mapa {
  if (tipo === 'escuadra') return { ...m, escuadras: escuadrasDe(m).map((e) => cambiadas(e, id, cambio)) }
  if (tipo === 'personaje') return conPersonajeNoJugador(conPersonaje(m, id, (p) => cambiadas(p, id, cambio)), id, (p) => cambiadas(p, id, cambio))
  return { ...m, estancias: m.estancias.map((e) => enEstancia(e, tipo, id, cambio)) }
}
