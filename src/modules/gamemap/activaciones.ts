import type { Activacion, ModoActivacion } from './modelo/activacion'
import type { Configuracion } from './modelo/configuracion'
import type { Escuadra, TurnoDeEscuadra } from './modelo/escuadra'
import type { Jugador } from './modelo/jugador'
import type { Jugadores } from './modelo/jugadores'
import type { Personaje, TurnoDePersonaje } from './modelo/personaje'
import type { Mapa } from './modelo/mapa'
import type { PersonajeNoJugador } from './modelo/personajeNoJugador'

/** Número del turno en curso */
export const numeroDeTurno = (m: Mapa) => m.turno ?? 1

export const escuadrasDe = (m: Mapa): Escuadra[] => m.escuadras ?? []

/** Todos los personajes de todas las escuadras, colocados o en una zona de espera */
export const personajesDelMapa = (m: Mapa): Personaje[] => escuadrasDe(m).flatMap((e) => e.personajes)

/** Personajes no jugadores del mapa (enemigos…) */
export const personajesNoJugadoresDe = (m: Mapa): PersonajeNoJugador[] => m.personajesNoJugadores ?? []

/** Reparto de alianzas y jugadores del mapa (vacío si no lo tiene) */
export const jugadoresDe = (m: Mapa): Jugadores => m.jugadores ?? { alianzas: [], jugadores: [] }

/** Todos los personajes del mapa, de las escuadras y no jugadores */
export const todosLosPersonajes = (m: Mapa): Personaje[] => [...personajesDelMapa(m), ...personajesNoJugadoresDe(m)]

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

export const conPersonajeNoJugador = (m: Mapa, id: string, cambio: (h: PersonajeNoJugador) => PersonajeNoJugador): Mapa => ({
  ...m,
  personajesNoJugadores: personajesNoJugadoresDe(m).map((h) => (h.id === id ? cambio(h) : h)),
})

/** Activación de la escuadra en el turno en curso, si se ha activado */
export const activacionDe = (m: Mapa, id: string): Activacion | undefined => {
  const escuadra = escuadrasDe(m).find((e) => e.id === id)
  return escuadra && turnoDeEscuadra(escuadra, numeroDeTurno(m)).activacion
}

export const activacionesDeJugador = (m: Mapa, jugador: string) => m.activacionesJugadores?.filter((a) => a.numero === numeroDeTurno(m) && a.jugador === jugador) ?? []

export const activacionDeJugador = (m: Mapa, jugador: string) => activacionesDeJugador(m, jugador).find((a) => !a.activacion.terminada) ?? activacionesDeJugador(m, jugador).at(-1)

export const activacionDeNoJugador = (m: Mapa, personaje: string) => m.activacionesJugadores?.find((a) => a.numero === numeroDeTurno(m) && a.personaje === personaje)

/** Si su clase dijo, tras su última acción del turno en curso, que al personaje ya no le quedan acciones: su activación ha terminado */
export const sinAcciones = (m: Mapa, personaje: Personaje) => turnoDePersonaje(personaje, numeroDeTurno(m)).quedanAcciones === false

/** El personaje de escuadra se queda sin acciones en el turno en curso: su activación termina */
export const conAccionesAgotadas = (m: Mapa, id: string): Mapa =>
  conPersonaje(m, id, (h) => ({ ...h, turnos: conTurno(h.turnos, { numero: numeroDeTurno(m), acciones: [], movimientos: [] }, (t) => ({ ...t, quedanAcciones: false })) }))

/** Si a ninguno de los personajes de la escuadra le quedan acciones en el turno en curso */
export const escuadraSinAcciones = (m: Mapa, escuadra: Escuadra) => escuadra.personajes.length > 0 && escuadra.personajes.every((p) => sinAcciones(m, p))

/** Escuadras que juegan: las que tienen algún personaje */
const enJuego = (m: Mapa) => escuadrasDe(m).filter((e) => e.personajes.length)

/** Escuadra con la activación en curso, si la hay: hasta que termine, las demás no pueden actuar */
export const escuadraActiva = (m: Mapa): Escuadra | undefined =>
  enJuego(m).find((e) => {
    const activacion = activacionDe(m, e.id)
    return activacion && !activacion.terminada
  })

/** Los mismos elementos empezando por el de la posición `desde` y dando la vuelta */
const rotar = <T>(xs: T[], desde: number) => xs.map((_, i) => xs[(i + desde) % xs.length])

/** Activaciones que ha terminado el jugador en el turno en curso: de sus escuadras y de sus personajes no jugadores */
export const terminadasEnElTurno = (m: Mapa, jugador: string): number =>
  escuadrasDe(m).filter((e) => e.jugador === jugador && activacionDe(m, e.id)?.terminada).length +
  activacionesDeJugador(m, jugador).filter((a) => a.activacion.terminada).length

/**
 * Jugador al que le toca: el de la escuadra que se está activando o, si no
 * hay, el siguiente que tenga alguna escuadra por activar en el turno. Con
 * `iniciativa`, el del primer hueco del orden del turno (`Mapa.ordenDelTurno`)
 * que aún tenga activaciones en él (los huecos de un jugador se van llenando
 * en orden con las que ha terminado) y algo por activar; si no queda
 * ninguno, como `alternas`. Con activaciones `alternas`, empezando por la
 * alianza siguiente a la del último que terminó una activación; con
 * `personajes-primero`, por la primera alianza. Dentro de cada alianza, el
 * siguiente al último de ella que terminó. Nadie si no hay reparto de
 * jugadores o nadie tiene nada que activar
 */
export function jugadorEnTurno(m: Mapa, { ordenActivaciones }: Pick<Configuracion, 'ordenActivaciones'>): Jugador | undefined {
  const { alianzas, jugadores } = jugadoresDe(m)
  const activa = escuadraActiva(m)
  if (activa) return jugadores.find((j) => j.id === activa.jugador)
  const jugadorActivo = m.activacionesJugadores?.find((a) => a.numero === numeroDeTurno(m) && !a.activacion.terminada)
  if (jugadorActivo) return jugadores.find((j) => j.id === jugadorActivo.jugador)
  const rotacion = m.rotacion ?? []
  const pendiente = (j: Jugador) =>
    escuadrasDe(m).some((e) => e.jugador === j.id && e.personajes.length && !activacionDe(m, e.id)) ||
    personajesNoJugadoresDe(m).some((p) => p.jugador === j.id && !activacionDeNoJugador(m, p.id)?.activacion.terminada)
  const huecos = ordenActivaciones === 'iniciativa' && m.ordenDelTurno?.numero === numeroDeTurno(m) ? m.ordenDelTurno.huecos : []
  const sinHueco = new Map(jugadores.map((j) => [j.id, terminadasEnElTurno(m, j.id)]))
  for (const { jugador, activaciones = Number.POSITIVE_INFINITY } of huecos) {
    const suyo = jugadores.find((j) => j.id === jugador)
    const llenas = Math.min(sinHueco.get(jugador) ?? 0, activaciones)
    sinHueco.set(jugador, (sinHueco.get(jugador) ?? 0) - llenas)
    if (suyo && llenas < activaciones && pendiente(suyo)) return suyo
  }
  const ultimo = jugadores.find((j) => j.id === rotacion.at(-1))
  const desde = ordenActivaciones !== 'personajes-primero' && ultimo ? alianzas.findIndex((a) => a.id === ultimo.alianza) + 1 : 0
  for (const alianza of rotar(alianzas, desde)) {
    const suyos = jugadores.filter((j) => j.alianza === alianza.id)
    const ultimoSuyo = suyos.findIndex((j) => j.id === rotacion.findLast((id) => suyos.some((s) => s.id === id)))
    const siguiente = rotar(suyos, ultimoSuyo + 1).find(pendiente)
    if (siguiente) return siguiente
  }
}

/** Por qué una escuadra no puede actuar mientras otra se activa */
export const esperandoA = (activa: Pick<Escuadra, 'nombre'>) => `No se puede activar hasta terminar la activación de ${activa.nombre}`

/** Por qué no puede actuar la escuadra si es el turno de otro jugador */
export function motivoDeTurno(m: Mapa, config: Pick<Configuracion, 'ordenActivaciones'>, escuadra: Escuadra): string | undefined {
  const turno = jugadorEnTurno(m, config)
  if (turno && turno.id !== escuadra.jugador) return `Le toca a ${turno.nombre}`
}

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

/** Apunta en la rotación que el jugador de la escuadra ha terminado una activación: de ahí sale a quién le toca */
export function conRotacion(m: Mapa, id: string): Mapa {
  const jugador = escuadrasDe(m).find((e) => e.id === id)?.jugador
  return jugador ? { ...m, rotacion: [...(m.rotacion ?? []), jugador] } : m
}

/** Apunta que el jugador ha completado su activación de PNJ en este turno */
export function conActivacionDeJugador(m: Mapa, jugador: string): Mapa {
  const actual = activacionesDeJugador(m, jugador).find((a) => !a.activacion.terminada)
  const personaje = actual?.personaje ?? personajesNoJugadoresDe(m).find((p) => p.jugador === jugador && !activacionDeNoJugador(m, p.id)?.activacion.terminada)?.id
  const activacion = actual?.activacion ?? { modo: 'normal' as const, terminada: false }
  const terminada = { ...activacion, terminada: true }
  return {
    ...m,
    activacionesJugadores: actual
      ? (m.activacionesJugadores ?? []).map((a) => (a === actual ? { ...a, activacion: terminada } : a))
      : [...(m.activacionesJugadores ?? []), { numero: numeroDeTurno(m), jugador, ...(personaje && { personaje }), activacion: terminada, acciones: [] }],
    rotacion: [...(m.rotacion ?? []), jugador],
  }
}

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
  return motivoDeTurno(m, config, escuadra)
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
  return conRotacion(conActivacion(m, id, { ...activacion, terminada: true }), id)
}

/** Por qué no se puede terminar el turno (escuadras sin activación completa), o nada si se puede */
export function motivoParaNoTerminarTurno(m: Mapa): string | undefined {
  const pendientes = enJuego(m).filter((e) => !activacionDe(m, e.id)?.terminada)
  if (pendientes.length) return `Falta terminar la activación de ${pendientes.map((e) => e.nombre).join(', ')}`
  const pendiente = jugadoresDe(m).jugadores.find((j) => personajesNoJugadoresDe(m).some((p) => p.jugador === j.id && !activacionDeNoJugador(m, p.id)?.activacion.terminada))
  if (pendiente) return `Falta terminar la activación de ${pendiente.nombre}`
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
