import type { Activacion, ModoActivacion } from './modelo/activacion'
import type { Configuracion } from './modelo/configuracion'
import type { Escuadra, TurnoDeEscuadra } from './modelo/escuadra'
import type { Personaje, TurnoDePersonaje } from './modelo/personaje'
import type { Mapa } from './modelo/mapa'

/** Número del turno en curso */
export const numeroDeTurno = (m: Mapa) => m.turno ?? 1

export const escuadrasDe = (m: Mapa): Escuadra[] => m.escuadras ?? []

/** Todos los personajes de todas las escuadras, colocados o en una zona de espera */
export const personajesDelMapa = (m: Mapa): Personaje[] => escuadrasDe(m).flatMap((e) => e.personajes)

/** Lo que ha hecho la escuadra en ese turno (vacío si nada) */
export const turnoDeEscuadra = (e: Escuadra, numero: number): TurnoDeEscuadra => e.turnos.find((t) => t.numero === numero) ?? { numero, acciones: [] }

/** Lo que ha hecho el personaje en ese turno (vacío si nada) */
export const turnoDePersonaje = (h: Personaje, numero: number): TurnoDePersonaje =>
  h.turnos.find((t) => t.numero === numero) ?? { numero, acciones: [], movimientos: [] }

/** Cambia la entrada de un turno de la lista, o la añade (desde `vacia`) si aún no existe */
export function conTurno<T extends { numero: number }>(turnos: T[], vacia: T, cambio: (t: T) => T): T[] {
  const actual = turnos.find((t) => t.numero === vacia.numero)
  return actual ? turnos.map((t) => (t === actual ? cambio(t) : t)) : [...turnos, cambio(vacia)]
}

export const conEscuadra = (m: Mapa, id: string, cambio: (e: Escuadra) => Escuadra): Mapa => ({
  ...m,
  escuadras: escuadrasDe(m).map((e) => (e.id === id ? cambio(e) : e)),
})

export const conPersonaje = (m: Mapa, id: string, cambio: (h: Personaje) => Personaje): Mapa => ({
  ...m,
  escuadras: escuadrasDe(m).map((e) => ({ ...e, personajes: e.personajes.map((h) => (h.id === id ? cambio(h) : h)) })),
})

/** Activación de la escuadra en el turno en curso, si se ha activado */
export const activacionDe = (m: Mapa, id: string): Activacion | undefined => {
  const escuadra = escuadrasDe(m).find((e) => e.id === id)
  return escuadra && turnoDeEscuadra(escuadra, numeroDeTurno(m)).activacion
}

/** Escuadras que juegan: las que tienen algún personaje */
const enJuego = (m: Mapa) => escuadrasDe(m).filter((e) => e.personajes.length)

/** Escuadra con la activación en curso, si la hay: hasta que termine, las demás no pueden actuar */
export const escuadraActiva = (m: Mapa): Escuadra | undefined =>
  enJuego(m).find((e) => {
    const activacion = activacionDe(m, e.id)
    return activacion && !activacion.terminada
  })

/** Por qué una escuadra no puede actuar mientras otra se activa */
export const esperandoA = (activa: Pick<Escuadra, 'nombre'>) => `No se puede activar hasta terminar la activación de ${activa.nombre}`

/** Modos entre los que elige una escuadra al activarse */
export const modosPermitidos = ({ modosActivacion }: Configuracion): ModoActivacion[] =>
  modosActivacion === 'agresivo-sigiloso' ? ['agresivo', 'sigiloso'] : ['normal']

/** Cambia la activación de la escuadra en el turno en curso (y su último modo) */
export const conActivacion = (m: Mapa, id: string, activacion: Activacion): Mapa =>
  conEscuadra(m, id, (e) => ({
    ...e,
    modo: activacion.modo,
    turnos: conTurno(e.turnos, { numero: numeroDeTurno(m), acciones: [] }, (t) => ({ ...t, activacion })),
  }))

/**
 * Por qué la escuadra no puede activarse en ese modo, o nada si puede: solo
 * una vez por turno, en un modo que permita la configuración y sin otra
 * escuadra a medio activar. La activación vale para todos sus personajes
 */
export function motivoParaNoActivar(m: Mapa, config: Configuracion, id: string, modo: ModoActivacion): string | undefined {
  const escuadra = enJuego(m).find((e) => e.id === id)
  if (!escuadra) return `No hay ninguna escuadra «${id}» en el mapa`
  if (!modosPermitidos(config).includes(modo)) return `El modo ${modo} no está permitido: ${modosPermitidos(config).join(' o ')}`
  if (activacionDe(m, id)) return `${escuadra.nombre} ya se ha activado este turno`
  const activa = escuadraActiva(m)
  if (activa) return esperandoA(activa)
}

/** Empieza la activación de la escuadra en ese modo; falla si no puede */
export function activar(m: Mapa, config: Configuracion, id: string, modo: ModoActivacion): Mapa {
  const motivo = motivoParaNoActivar(m, config, id, modo)
  if (motivo) throw new Error(motivo)
  return conActivacion(m, id, { modo, terminada: false })
}

/** Da por completa la activación en curso de la escuadra; falla si no la tiene */
export function terminarActivacion(m: Mapa, id: string): Mapa {
  const activacion = activacionDe(m, id)
  if (!activacion || activacion.terminada) throw new Error(`«${id}» no tiene ninguna activación en curso`)
  return conActivacion(m, id, { ...activacion, terminada: true })
}

/** Por qué no se puede terminar el turno (escuadras sin activación completa), o nada si se puede */
export function motivoParaNoTerminarTurno(m: Mapa): string | undefined {
  const pendientes = enJuego(m).filter((e) => !activacionDe(m, e.id)?.terminada)
  if (pendientes.length) return `Falta terminar la activación de ${pendientes.map((e) => e.nombre).join(', ')}`
}

/**
 * Pasa al turno siguiente: cada escuadra y cada personaje empiezan una entrada de
 * turno nueva cuando hagan algo; su último modo queda en la escuadra. Falla si
 * alguna escuadra no ha terminado
 */
export function terminarTurno(m: Mapa): Mapa {
  const motivo = motivoParaNoTerminarTurno(m)
  if (motivo) throw new Error(motivo)
  return { ...m, turno: numeroDeTurno(m) + 1 }
}
