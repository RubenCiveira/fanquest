import {
  activacionDe,
  conEscuadra,
  conPersonaje,
  conRotacion,
  conTurno,
  escuadraActiva,
  escuadrasDe,
  esperandoA,
  modosPermitidos,
  motivoDeTurno,
  numeroDeTurno,
  sinAcciones,
} from './activaciones'
import type { Accion } from './modelo/accion'
import type { ModoActivacion } from './modelo/activacion'
import type { Configuracion } from './modelo/configuracion'
import type { Mapa } from './modelo/mapa'
import type { ResultadoAccion } from './modelo/resultadoAccion'

/** Acción del gestor que da por terminada la activación en este turno */
export const TERMINAR_TURNO: Accion = { id: 'terminar-turno', nombre: 'Terminar turno', icono: '⌛' }

/** Acción del gestor que da por terminada la activación de la escuadra en este turno */
export const TERMINAR_TURNO_ESCUADRA: Accion = { ...TERMINAR_TURNO, nombre: 'Terminar turno de escuadra' }

/** Acción del gestor para dejar una estancia marcada como libre de trampas */
export const BUSCAR_TRAMPAS: Accion = { id: 'buscar-trampas', nombre: 'Buscar trampas', icono: '🕵️' }

/** Lo que se apunta en los turnos cuando un personaje ataca */
export const ATACAR: Accion = { id: 'atacar', nombre: 'Atacar', icono: '⚔️' }

/** Acción del gestor para que el resto de la escuadra se coloque alrededor del personaje */
export const AGRUPAR: Accion = { id: 'agrupar', nombre: 'Agrupar aquí', icono: '🫂' }

/** Id de la acción del gestor que pasa de agresivo a sigiloso o al revés */
export const CAMBIAR_MODO = 'cambiar-modo'

const OTRO_MODO = { agresivo: 'sigiloso', sigiloso: 'agresivo' } as const

/** Icono de la acción de cambiar a cada modo */
const ICONO_MODO = { agresivo: '⚔️', sigiloso: '👣' }

/** Modo de la escuadra: el de su activación en curso, si no el último y, si no hay, el primero permitido */
export function modoActual(m: Mapa, config: Configuracion, id: string): ModoActivacion {
  return activacionDe(m, id)?.modo ?? escuadrasDe(m).find((e) => e.id === id)?.modo ?? modosPermitidos(config)[0]
}

/**
 * Por qué la escuadra (o ese personaje suyo) no puede hacer acciones ahora, o
 * nada si puede: ya terminó su turno, otra está activándose, es el turno de
 * otro jugador o, al personaje, ya no le quedan acciones (su activación ha
 * terminado). En la activación de una escuadra pueden actuar todos sus
 * personajes
 */
export function motivoParaNoActuar(m: Mapa, config: Configuracion, id: string, personaje?: string): string | undefined {
  const escuadra = escuadrasDe(m).find((e) => e.id === id)
  if (!escuadra) return `No hay ninguna escuadra «${id}» en el mapa`
  if (activacionDe(m, id)?.terminada) return `${escuadra.nombre} ya ha terminado su turno`
  const activa = escuadraActiva(m)
  if (activa && activa.id !== id) return esperandoA(activa)
  const turno = motivoDeTurno(m, config, escuadra)
  if (turno) return turno
  const suyo = escuadra.personajes.find((p) => p.id === personaje)
  if (suyo && sinAcciones(m, suyo)) return `${suyo.nombre} ya ha terminado su activación`
}

/** Acciones que el gestor añade a las del personaje: cambiar al otro modo (si hay modos) y terminar turno */
export function accionesDelModo(config: Configuracion, modo: ModoActivacion): Accion[] {
  const cambiar = config.modosActivacion === 'agresivo-sigiloso' && modo !== 'normal' ? [{ id: CAMBIAR_MODO, nombre: `Cambiar a ${OTRO_MODO[modo]}`, icono: ICONO_MODO[OTRO_MODO[modo]] }] : []
  return [...cambiar, TERMINAR_TURNO]
}

/** Acciones que el gestor añade a las del personaje: cambiar al otro modo (si hay modos) y terminar turno */
export function accionesDelGestor(m: Mapa, config: Configuracion, id: string): Accion[] {
  const escuadra = escuadrasDe(m).find((e) => e.id === id)
  const terminar = escuadra && escuadra.personajes.length > 1 ? TERMINAR_TURNO_ESCUADRA : TERMINAR_TURNO
  return accionesDelModo(config, modoActual(m, config, id)).map((a) => (a.id === TERMINAR_TURNO.id ? terminar : a))
}

/**
 * Apunta la acción en el turno en curso de la escuadra (con el personaje que la
 * hace, que pasa a ser su personaje activo). La primera empieza su activación en
 * su modo actual; cambiar de modo cambia el de la activación y terminar turno
 * la da por terminada. Falla si la escuadra no puede actuar
 */
export function apuntarAccion(m: Mapa, config: Configuracion, id: string, accion: string, personaje?: string): Mapa {
  const motivo = motivoParaNoActuar(m, config, id, personaje)
  if (motivo) throw new Error(motivo)
  const modo = modoActual(m, config, id)
  const previa = activacionDe(m, id) ?? { modo, terminada: false }
  const activacion =
    accion === CAMBIAR_MODO && modo !== 'normal'
      ? { ...previa, modo: OTRO_MODO[modo] }
      : accion === TERMINAR_TURNO.id
        ? { ...previa, terminada: true }
        : previa
  const apuntada = conEscuadra(m, id, (e) => ({
    ...e,
    modo: activacion.modo,
    ...(personaje && { activo: personaje }),
    turnos: conTurno(e.turnos, { numero: numeroDeTurno(m), acciones: [] }, (t) => ({
      ...t,
      activacion,
      acciones: [...t.acciones, personaje ? { accion, personaje } : { accion }],
    })),
  }))
  return activacion.terminada && !previa.terminada ? conRotacion(apuntada, id) : apuntada
}

/**
 * Ejecuta la acción de la escuadra: la apunta en su turno y, si la hace un
 * personaje, también en el turno del personaje, con lo que su clase dijo
 * después (`resultado`: si aún le quedan acciones)
 */
export function ejecutarAccion(m: Mapa, config: Configuracion, id: string, accion: string, personaje?: string, resultado?: ResultadoAccion): Mapa {
  const apuntada = apuntarAccion(m, config, id, accion, personaje)
  if (!personaje) return apuntada
  return conPersonaje(apuntada, personaje, (h) => ({
    ...h,
    turnos: conTurno(h.turnos, { numero: numeroDeTurno(m), acciones: [], movimientos: [] }, (t) => ({ ...t, acciones: [...t.acciones, accion], ...(resultado && { quedanAcciones: resultado.quedanAcciones }) })),
  }))
}
