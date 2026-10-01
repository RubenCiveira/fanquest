import { escuadrasDe, todosLosPersonajes } from './activaciones'
import { conPersonajes, enElMapa, planearMovimiento, sePuedePasar, transitable, type MedicionMovimiento } from './movimiento'
import type { Casilla } from './modelo/casilla'
import type { Configuracion } from './modelo/configuracion'
import type { Mapa } from './modelo/mapa'
import type { OpcionMovimiento, OpcionesMovimiento } from './modelo/opcionesMovimiento'
import type { Personaje } from './modelo/personaje'

const VECINAS: Casilla[] = [-1, 0, 1].flatMap((y) => [-1, 0, 1].flatMap((x) => (x || y ? [{ x, y }] : [])))

const clave = ({ x, y }: Casilla) => `${x},${y}`

/** Pegada a la casilla, también en diagonal */
const junto = (a: Casilla, b: Casilla) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) === 1

/**
 * Casillas del mapa a las que se llega desde `desde` (según la medición, sin
 * atravesar enemigos, cruzando solo puertas abiertas), de la más cercana a la
 * más lejana, sin contar la de salida
 */
function alrededor(m: Mapa, desde: Casilla, medicion: MedicionMovimiento): Casilla[] {
  const vistas = new Set([clave(desde)])
  const cola = [desde]
  for (let i = 0; i < cola.length; i++) {
    for (const paso of VECINAS) {
      const c = { x: cola[i].x + paso.x, y: cola[i].y + paso.y }
      if (vistas.has(clave(c)) || !sePuedePasar(m, cola[i], c, medicion)) continue
      vistas.add(clave(c))
      cola.push(c)
    }
  }
  return cola.slice(1)
}

/** Recorrido para acercarse al que agrupa, con la opción de movimiento que lo permite */
export type RecorridoParaAgrupar = { recorrido: Casilla[]; opcion: OpcionMovimiento; tramos: number[] }

/**
 * Cómo se acerca `miembro` a `lider`, de su misma escuadra, para agruparse
 * con su movimiento restante (`opciones`): a la casilla libre más cercana al
 * líder (sin terreno impasable, objetos ni personajes) a la que llega con su
 * opción base, sin acciones adicionales y sin entrar en la zona de control
 * de los enemigos. Si no llega a su lado, a la más cercana a la que llega. Nada si
 * ya está a su lado, no se puede acercar más o alguno no está colocado
 */
export function recorridoParaAgrupar(
  m: Mapa,
  config: Pick<Configuracion, 'medicionMovimiento' | 'terrenoPersonajes' | 'distanciaControl'>,
  lider: Personaje,
  miembro: Personaje,
  opciones: OpcionesMovimiento,
): RecorridoParaAgrupar | undefined {
  const centro = enElMapa(m, lider)
  const suya = enElMapa(m, miembro)
  if (!centro || !suya || junto(suya, centro)) return
  const ocupadas = new Set(todosLosPersonajes(m).flatMap((p) => enElMapa(m, p) ?? []).map(clave))
  const vista = conPersonajes(m, miembro.id, config.terrenoPersonajes)
  const soloBase = { base: opciones.base, variaciones: [] }
  for (const destino of alrededor(conPersonajes(m, lider.id, 'normal'), centro, config.medicionMovimiento)) {
    // las siguientes están más lejos del líder que donde ya está
    if (clave(destino) === clave(suya)) return
    if (ocupadas.has(clave(destino)) || !transitable(vista, destino)) continue
    const plan = planearMovimiento(m, config, miembro, destino, soloBase)
    if ('opcion' in plan) return plan
  }
}

/** Los demás personajes colocados de la escuadra del personaje, que se agrupan a su alrededor */
export const aAgrupar = (m: Mapa, personajeId: string): Personaje[] =>
  escuadrasDe(m)
    .find((e) => e.personajes.some((p) => p.id === personajeId))
    ?.personajes.filter((p) => p.id !== personajeId && p.casilla) ?? []
