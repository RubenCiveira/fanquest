import { escuadrasDelMapa, modosPermitidos, turnoDe } from './activaciones'
import { estanciasDe } from './estancias'
import type { Accion } from './modelo/accion'
import type { ModoActivacion } from './modelo/activacion'
import type { Configuracion } from './modelo/configuracion'
import type { EstadoEscuadra } from './modelo/estadoEscuadra'
import type { Mapa } from './modelo/mapa'

/** Acción del gestor que da por terminada la activación de la escuadra en este turno */
export const TERMINAR_TURNO: Accion = { id: 'terminar-turno', nombre: 'Terminar turno' }

/** Id de la acción del gestor que pasa de agresivo a sigiloso o al revés */
export const CAMBIAR_MODO = 'cambiar-modo'

const OTRO_MODO = { agresivo: 'sigiloso', sigiloso: 'agresivo' } as const

/** Modo de la escuadra: el de su activación en curso, si no el último y, si no hay, el primero permitido */
export function modoActual(m: Mapa, config: Configuracion, id: string): ModoActivacion {
  const turno = turnoDe(m)
  return turno.activaciones[id]?.modo ?? turno.ultimosModos?.[id] ?? modosPermitidos(config)[0]
}

/** Por qué la escuadra no puede hacer acciones ahora, o nada si puede: ya terminó su turno u otra está activándose */
export function motivoParaNoActuar(m: Mapa, id: string): string | undefined {
  const escuadras = escuadrasDelMapa(m)
  const escuadra = escuadras.find((e) => e.id === id)
  if (!escuadra) return `No hay ninguna escuadra «${id}» en el mapa`
  const { activaciones } = turnoDe(m)
  if (activaciones[id]?.terminada) return `${escuadra.nombre} ya ha terminado su turno`
  const enCurso = escuadras.find((e) => e.id !== id && activaciones[e.id] && !activaciones[e.id].terminada)
  if (enCurso) return `${enCurso.nombre} aún no ha terminado su activación`
}

/** Acciones que el gestor añade a las de la escuadra: cambiar al otro modo (si hay modos) y terminar turno */
export function accionesDelGestor(m: Mapa, config: Configuracion, id: string): Accion[] {
  const modo = modoActual(m, config, id)
  const cambiar = config.modosActivacion === 'agresivo-sigiloso' && modo !== 'normal' ? [{ id: CAMBIAR_MODO, nombre: `Cambiar a ${OTRO_MODO[modo]}` }] : []
  return [...cambiar, TERMINAR_TURNO]
}

/** Lo que se cuenta a la escuadra al preguntarle por sus acciones */
export function estadoDeEscuadra(m: Mapa, config: Configuracion, id: string): EstadoEscuadra {
  const turno = turnoDe(m)
  const heroes = m.estancias.flatMap((raiz) =>
    estanciasDe(raiz).flatMap(({ estancia }) =>
      estancia.elementos.flatMap((el) => (el.tipo === 'heroe' && el.escuadra === id ? [{ id: el.id, estancia: estancia.id, posicion: el.posicion }] : [])),
    ),
  )
  return { escuadra: id, turno: turno.numero, heroes, modo: modoActual(m, config, id), acciones: turno.acciones?.[id] ?? [] }
}

/**
 * Apunta la acción de la escuadra en el turno. La primera empieza su
 * activación en su modo actual; cambiar de modo cambia el de la activación y
 * terminar turno la da por terminada. Falla si la escuadra no puede actuar
 */
export function ejecutarAccion(m: Mapa, config: Configuracion, id: string, accion: string): Mapa {
  const motivo = motivoParaNoActuar(m, id)
  if (motivo) throw new Error(motivo)
  const turno = turnoDe(m)
  const modo = modoActual(m, config, id)
  const previa = turno.activaciones[id] ?? { modo, terminada: false }
  const activacion =
    accion === CAMBIAR_MODO && modo !== 'normal'
      ? { ...previa, modo: OTRO_MODO[modo] }
      : accion === TERMINAR_TURNO.id
        ? { ...previa, terminada: true }
        : previa
  return {
    ...m,
    turno: {
      ...turno,
      activaciones: { ...turno.activaciones, [id]: activacion },
      acciones: { ...turno.acciones, [id]: [...(turno.acciones?.[id] ?? []), accion] },
    },
  }
}
