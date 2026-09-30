import {
  activacionDe,
  conEscuadra,
  conHeroe,
  conTurno,
  escuadraActiva,
  escuadrasDe,
  esperandoA,
  modosPermitidos,
  numeroDeTurno,
} from './activaciones'
import type { Accion } from './modelo/accion'
import type { ModoActivacion } from './modelo/activacion'
import type { Configuracion } from './modelo/configuracion'
import type { Mapa } from './modelo/mapa'

/** Acción del gestor que da por terminada la activación de la escuadra en este turno */
export const TERMINAR_TURNO: Accion = { id: 'terminar-turno', nombre: 'Terminar turno', icono: '⌛' }

/** Id de la acción del gestor que pasa de agresivo a sigiloso o al revés */
export const CAMBIAR_MODO = 'cambiar-modo'

const OTRO_MODO = { agresivo: 'sigiloso', sigiloso: 'agresivo' } as const

/** Icono de la acción de cambiar a cada modo */
const ICONO_MODO = { agresivo: '⚔️', sigiloso: '👣' }

/** Modo de la escuadra: el de su activación en curso, si no el último y, si no hay, el primero permitido */
export function modoActual(m: Mapa, config: Configuracion, id: string): ModoActivacion {
  return activacionDe(m, id)?.modo ?? escuadrasDe(m).find((e) => e.id === id)?.modo ?? modosPermitidos(config)[0]
}

/** Por qué la escuadra no puede hacer acciones ahora, o nada si puede: ya terminó su turno u otra está activándose */
export function motivoParaNoActuar(m: Mapa, id: string): string | undefined {
  const escuadra = escuadrasDe(m).find((e) => e.id === id)
  if (!escuadra) return `No hay ninguna escuadra «${id}» en el mapa`
  if (activacionDe(m, id)?.terminada) return `${escuadra.nombre} ya ha terminado su turno`
  const activa = escuadraActiva(m)
  if (activa && activa.id !== id) return esperandoA(activa)
}

/** Acciones que el gestor añade a las del héroe: cambiar al otro modo (si hay modos) y terminar turno */
export function accionesDelGestor(m: Mapa, config: Configuracion, id: string): Accion[] {
  const modo = modoActual(m, config, id)
  const cambiar = config.modosActivacion === 'agresivo-sigiloso' && modo !== 'normal' ? [{ id: CAMBIAR_MODO, nombre: `Cambiar a ${OTRO_MODO[modo]}`, icono: ICONO_MODO[OTRO_MODO[modo]] }] : []
  return [...cambiar, TERMINAR_TURNO]
}

/**
 * Apunta la acción en el turno en curso de la escuadra (con el héroe que la
 * hace, que pasa a ser su héroe activo). La primera empieza su activación en
 * su modo actual; cambiar de modo cambia el de la activación y terminar turno
 * la da por terminada. Falla si la escuadra no puede actuar
 */
export function apuntarAccion(m: Mapa, config: Configuracion, id: string, accion: string, heroe?: string): Mapa {
  const motivo = motivoParaNoActuar(m, id)
  if (motivo) throw new Error(motivo)
  const modo = modoActual(m, config, id)
  const previa = activacionDe(m, id) ?? { modo, terminada: false }
  const activacion =
    accion === CAMBIAR_MODO && modo !== 'normal'
      ? { ...previa, modo: OTRO_MODO[modo] }
      : accion === TERMINAR_TURNO.id
        ? { ...previa, terminada: true }
        : previa
  return conEscuadra(m, id, (e) => ({
    ...e,
    modo: activacion.modo,
    ...(heroe && { activo: heroe }),
    turnos: conTurno(e.turnos, { numero: numeroDeTurno(m), acciones: [] }, (t) => ({
      ...t,
      activacion,
      acciones: [...t.acciones, heroe ? { accion, heroe } : { accion }],
    })),
  }))
}

/**
 * Ejecuta la acción de la escuadra: la apunta en su turno y, si la hace un
 * héroe, también en el turno del héroe
 */
export function ejecutarAccion(m: Mapa, config: Configuracion, id: string, accion: string, heroe?: string): Mapa {
  const apuntada = apuntarAccion(m, config, id, accion, heroe)
  if (!heroe) return apuntada
  return conHeroe(apuntada, heroe, (h) => ({
    ...h,
    turnos: conTurno(h.turnos, { numero: numeroDeTurno(m), acciones: [], movimientos: [] }, (t) => ({ ...t, acciones: [...t.acciones, accion] })),
  }))
}
