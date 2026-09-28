import type { EstadoAventura } from './aventuras'
import type { Partida } from './partida'
import { PASOS, type Configuracion, type Paso } from './preparacion'

export const TITULO_PASO: Record<Paso, string> = {
  reglas: 'Reglas',
  heroes: 'Grupo',
  hechizos: 'Hechizos',
  mazos: 'Mazos',
  monstruos: 'Monstruos',
  barajar: 'Barajar',
}

export type EstadoPaso = 'completado' | 'actual' | 'pendiente'

/** Paso en curso; sin dato válido (aventuras antiguas), el que corresponde a lo hecho */
export function pasoActual(c: Configuracion): Paso {
  return c.paso && PASOS.includes(c.paso) ? c.paso : c.barajado ? 'barajar' : 'mazos'
}

export function estadoPaso(c: Configuracion, paso: Paso): EstadoPaso {
  if (c.barajado) return 'completado'
  const actual = PASOS.indexOf(pasoActual(c))
  const i = PASOS.indexOf(paso)
  return i < actual ? 'completado' : i === actual ? 'actual' : 'pendiente'
}

export function avanzar(c: Configuracion): Configuracion {
  const siguiente = PASOS[PASOS.indexOf(pasoActual(c)) + 1]
  return siguiente ? { ...c, paso: siguiente } : c
}

/** Vuelve a un paso completado: se anula lo preparado después (el barajado) */
export function volverA(c: Configuracion, paso: Paso): Configuracion {
  return { ...c, paso, barajado: undefined }
}

/** Volver a ese paso descarta un orden ya barajado */
export const anulaBarajado = (c: Configuracion) => Boolean(c.barajado)

/** El estado de la aventura se deriva de su configuración y de su partida */
export function estadoAventura(c: Configuracion, partida?: Partida): EstadoAventura {
  if (!c.barajado) return 'configurando'
  return partida?.fin ? 'terminada' : partida ? 'en-juego' : 'mazo-barajado'
}
