import { conPersonaje, conPersonajeNoJugador, escuadrasDe, todosLosPersonajes } from './activaciones'
import { distanciaSegun } from './ataques'
import { alcanzables, casillaDelMapa, casillasDeEnemigos, conPersonajes, conZonaDeControl, enElMapa, sePuedePasar, type MedicionMovimiento, type ReglasDeMovimiento } from './movimiento'
import type { Casilla } from './modelo/casilla'
import type { Desplazamiento, DesplazamientoPorRecorrido, Referencia } from './modelo/desplazamiento'
import type { Mapa } from './modelo/mapa'
import type { Personaje } from './modelo/personaje'

const igual = (a: Casilla, b: Casilla) => a.x === b.x && a.y === b.y

/** Casillas del mapa de la referencia, para ese personaje (sus enemigos…): las de lo que está colocado */
export function casillasDeReferencia(m: Mapa, personaje: Personaje, de: Referencia): Casilla[] {
  if ('enemigos' in de) return casillasDeEnemigos(m, personaje.id)
  if ('ubicacion' in de) return [enElMapa(m, de.ubicacion) ?? []].flat()
  const suyos = 'personaje' in de ? todosLosPersonajes(m).filter((p) => p.id === de.personaje) : (escuadrasDe(m).find((e) => e.id === de.escuadra)?.personajes ?? [])
  return suyos.flatMap((p) => enElMapa(m, p) ?? [])
}

/** Distancia en línea recta (según la medición) de la casilla a la más cercana de las de la referencia */
export const distanciaA = (medicion: MedicionMovimiento, c: Casilla, referencia: Casilla[]) => Math.min(...referencia.map((r) => distanciaSegun(medicion, c, r)))

/** Casillas del mapa de los demás personajes colocados: en ellas no se puede terminar */
const ocupadasPorOtros = (m: Mapa, personaje: Personaje) => todosLosPersonajes(m).flatMap((p) => (p.id === personaje.id ? [] : (enElMapa(m, p) ?? [])))

/**
 * Por dónde se desplaza el personaje (`Desplazamiento`): de las casillas a las
 * que llega con `casillas` (como se mueve, con su `forma` y viendo a los demás
 * personajes según `terrenoPersonajes`; rodeando la zona de control de sus
 * enemigos si la respeta), sin terminar encima de otro, la que mejor cumple
 * el sentido: hacia, la más cercana a la referencia sin pasar de `hasta`;
 * lejos, la más lejana hasta `hasta`. Entre las que valen lo mismo, la más
 * barata (sin ninguna mejor, se queda donde está). Con si llega a `hasta`.
 * Nada que hacer si no está colocado o la referencia no tiene nada colocado
 */
export function planearDesplazamiento(m: Mapa, reglas: ReglasDeMovimiento, personaje: Personaje, d: Desplazamiento): { recorrido: Casilla[]; llega: boolean } | { motivo: string } {
  const desde = enElMapa(m, personaje)
  if (!desde) return { motivo: `${personaje.nombre} no está colocado en el mapa` }
  const referencia = casillasDeReferencia(m, personaje, d.de)
  if (!referencia.length) return { motivo: `No hay nada colocado ${d.sentido === 'hacia' ? 'hacia lo que' : 'de lo que'} desplazar a ${personaje.nombre}` }
  const { medicionMovimiento: medicion } = reglas
  const vista = conPersonajes(m, personaje.id, reglas.terrenoPersonajes)
  const porDonde = d.zonaDeControl === 'respetar' ? conZonaDeControl(vista, casillasDeEnemigos(m, personaje.id), reglas.distanciaControl) : vista
  const ocupadas = ocupadasPorOtros(m, personaje)
  const distancia = (c: Casilla) => distanciaA(medicion, c, referencia)
  // cuánto vale terminar en cada casilla: más es mejor
  const valor = (c: Casilla) => (d.sentido === 'hacia' ? -Math.max(distancia(c), d.hasta ?? 0) : Math.min(distancia(c), d.hasta ?? Number.POSITIVE_INFINITY))
  const [mejor] = alcanzables(porDonde, desde, d.casillas, medicion, d.forma)
    .filter(({ recorrido }) => !ocupadas.some((o) => igual(o, recorrido.at(-1) ?? desde)))
    // de más barata a más cara: a igual valor, se queda la primera
    .sort((a, b) => valor(b.recorrido.at(-1) ?? desde) - valor(a.recorrido.at(-1) ?? desde))
  const destino = mejor.recorrido.at(-1) ?? desde
  const llega = d.hasta === undefined || (d.sentido === 'hacia' ? distancia(destino) <= d.hasta : distancia(destino) >= d.hasta)
  return { recorrido: mejor.recorrido, llega }
}

/**
 * Por qué el personaje no puede desplazarse por ese recorrido
 * (`DesplazamientoPorRecorrido`): no está colocado, no empieza en su casilla,
 * pasa por donde no se puede (con su `forma`, viendo a los demás personajes
 * según `terrenoPersonajes`) o termina encima de otro. Nada si puede
 */
export function motivoParaNoRecorrer(m: Mapa, reglas: ReglasDeMovimiento, personaje: Personaje, { recorrido, forma }: DesplazamientoPorRecorrido): string | undefined {
  const desde = enElMapa(m, personaje)
  const [salida, ...pasos] = recorrido
  const destino = pasos.at(-1) ?? salida
  if (!desde) return `${personaje.nombre} no está colocado en el mapa`
  if (!salida || !igual(salida, desde)) return `El recorrido tiene que empezar en ${personaje.nombre}`
  const vista = conPersonajes(m, personaje.id, reglas.terrenoPersonajes)
  if (!pasos.every((c, i) => sePuedePasar(vista, recorrido[i], c, reglas.medicionMovimiento, forma))) return 'El recorrido pasa por donde no se puede'
  if (ocupadasPorOtros(m, personaje).some((o) => igual(o, destino))) return `${personaje.nombre} no puede terminar encima de otro personaje`
}

/** El mapa con el personaje (de escuadra o no jugador) en esa casilla del mapa, sin apuntar nada en su turno: un desplazamiento forzado no gasta movimiento */
export function conPersonajeEn(m: Mapa, id: string, c: Casilla): Mapa {
  const destino = casillaDelMapa(m, c)
  if (!destino) throw new Error(`La casilla ${c.x},${c.y} no es de ninguna estancia`)
  const llevado = <P extends Personaje>(p: P): P => ({ ...p, estancia: destino.estancia.id, casilla: destino.casilla })
  return conPersonajeNoJugador(conPersonaje(m, id, llevado), id, llevado)
}
