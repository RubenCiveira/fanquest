import type { Partida } from './partida'

/**
 * Turno de las fichas con la regla «Usar mapa». En su turno cada una se
 * mueve y hace una acción (atacar, buscar…) en el orden que quiera; con las
 * dos, su turno ha terminado. Además, el Dado de Trampa se tira una vez por
 * turno. Las listas de partidas guardadas antes de algún campo pueden faltar
 */
export type Turno = { terminados: string[]; conTrampa: string[]; movidos?: string[]; conAccion?: string[] }

const SIN_EMPEZAR: Turno = { terminados: [], conTrampa: [], movidos: [], conAccion: [] }

const turno = (p: Partida): Turno => p.turno ?? SIN_EMPEZAR

const anadir = (lista: string[] = [], clave: string) => (lista.includes(clave) ? lista : [...lista, clave])

export const terminarTurno = (p: Partida, clave: string): Partida => ({
  ...p,
  turno: { ...turno(p), terminados: anadir(turno(p).terminados, clave) },
})

export const haTerminado = (p: Partida, clave: string) => turno(p).terminados.includes(clave)

/** Con movimiento y acción hechos, el turno termina solo */
const terminarSiHaHechoTodo = (p: Partida, clave: string): Partida => {
  const { movidos = [], conAccion = [] } = turno(p)
  return movidos.includes(clave) && conAccion.includes(clave) ? terminarTurno(p, clave) : p
}

export const seMueve = (p: Partida, clave: string): Partida =>
  terminarSiHaHechoTodo({ ...p, turno: { ...turno(p), movidos: anadir(turno(p).movidos, clave) } }, clave)

export const actua = (p: Partida, clave: string): Partida =>
  terminarSiHaHechoTodo({ ...p, turno: { ...turno(p), conAccion: anadir(turno(p).conAccion, clave) } }, clave)

/** Fichas que aún no han terminado su turno, en el orden dado */
export const sinTerminar = (p: Partida, claves: string[]) => claves.filter((clave) => !haTerminado(p, clave))

/** Tiró el Dado de Trampa (o ya lo había tirado) en este turno */
export const tiroTrampa = (p: Partida, clave: string): Partida => ({
  ...p,
  turno: { ...turno(p), conTrampa: anadir(turno(p).conTrampa, clave) },
})

export const yaTiroTrampa = (p: Partida, clave: string) => turno(p).conTrampa.includes(clave)

export const nuevoTurno = (p: Partida): Partida => ({ ...p, turno: SIN_EMPEZAR })
