import { estanciasDe } from './estancias'
import type { ModoActivacion } from './modelo/activacion'
import type { Configuracion } from './modelo/configuracion'
import type { FichaHeroe } from './modelo/elemento'
import type { DatosEscuadra, Mapa } from './modelo/mapa'
import type { Turno } from './modelo/turno'

const PRIMER_TURNO: Turno = { numero: 1, activaciones: {} }

export const turnoDe = (m: Mapa): Turno => m.turno ?? PRIMER_TURNO

/** Fichas de héroe de todas las estancias, colocadas o en la zona de espera */
export const heroesDelMapa = (m: Mapa): FichaHeroe[] =>
  m.estancias.flatMap((raiz) =>
    estanciasDe(raiz).flatMap(({ estancia }) => estancia.elementos.flatMap((el) => (el.tipo === 'heroe' ? [el] : []))),
  )

/** Escuadras con algún héroe en el mapa, con su nombre (o su id, si el mapa no lo guarda) */
export const escuadrasDelMapa = (m: Mapa): DatosEscuadra[] =>
  [...new Set(heroesDelMapa(m).map((h) => h.escuadra))].map((id) => m.escuadras?.find((e) => e.id === id) ?? { id, nombre: id })

/** Modos entre los que elige una escuadra al activarse */
export const modosPermitidos = ({ modosActivacion }: Configuracion): ModoActivacion[] =>
  modosActivacion === 'agresivo-sigiloso' ? ['agresivo', 'sigiloso'] : ['normal']

/**
 * Por qué la escuadra no puede activarse en ese modo, o nada si puede: solo
 * una vez por turno, en un modo que permita la configuración y sin otra
 * escuadra a medio activar. La activación vale para todos sus héroes
 */
export function motivoParaNoActivar(m: Mapa, config: Configuracion, id: string, modo: ModoActivacion): string | undefined {
  const escuadras = escuadrasDelMapa(m)
  const escuadra = escuadras.find((e) => e.id === id)
  if (!escuadra) return `No hay ninguna escuadra «${id}» en el mapa`
  if (!modosPermitidos(config).includes(modo)) return `El modo ${modo} no está permitido: ${modosPermitidos(config).join(' o ')}`
  const { activaciones } = turnoDe(m)
  if (activaciones[id]) return `${escuadra.nombre} ya se ha activado este turno`
  const enCurso = escuadras.find((e) => activaciones[e.id] && !activaciones[e.id].terminada)
  if (enCurso) return `${enCurso.nombre} aún no ha terminado su activación`
}

/** Empieza la activación de la escuadra en ese modo; falla si no puede */
export function activar(m: Mapa, config: Configuracion, id: string, modo: ModoActivacion): Mapa {
  const motivo = motivoParaNoActivar(m, config, id, modo)
  if (motivo) throw new Error(motivo)
  const turno = turnoDe(m)
  return { ...m, turno: { ...turno, activaciones: { ...turno.activaciones, [id]: { modo, terminada: false } } } }
}

/** Da por completa la activación en curso de la escuadra; falla si no la tiene */
export function terminarActivacion(m: Mapa, id: string): Mapa {
  const turno = turnoDe(m)
  const activacion = turno.activaciones[id]
  if (!activacion || activacion.terminada) throw new Error(`«${id}» no tiene ninguna activación en curso`)
  return { ...m, turno: { ...turno, activaciones: { ...turno.activaciones, [id]: { ...activacion, terminada: true } } } }
}

/** Por qué no se puede terminar el turno (escuadras sin activación completa), o nada si se puede */
export function motivoParaNoTerminarTurno(m: Mapa): string | undefined {
  const { activaciones } = turnoDe(m)
  const pendientes = escuadrasDelMapa(m).filter((e) => !activaciones[e.id]?.terminada)
  if (pendientes.length) return `Falta terminar la activación de ${pendientes.map((e) => e.nombre).join(', ')}`
}

/**
 * Pasa al turno siguiente, con todas las escuadras sin activar pero
 * recordando su último modo agresivo o sigiloso; falla si alguna no ha terminado
 */
export function terminarTurno(m: Mapa): Mapa {
  const motivo = motivoParaNoTerminarTurno(m)
  if (motivo) throw new Error(motivo)
  const { numero, activaciones, ultimosModos } = turnoDe(m)
  const modos = Object.entries(activaciones).flatMap(([id, { modo }]) => (modo === 'normal' ? [] : [[id, modo]]))
  return { ...m, turno: { numero: numero + 1, activaciones: {}, ultimosModos: { ...ultimosModos, ...Object.fromEntries(modos) } } }
}
