import { turnoDePersonaje } from './activaciones'
import { distanciaSegun } from './ataques'
import { huellaEnElMapa } from './huella'
import { enElMapa, type MedicionMovimiento } from './movimiento'
import type { Casilla } from './modelo/casilla'
import type { Coherencia, GuiaDeCoherencia } from './modelo/coherencia'
import type { Escuadra } from './modelo/escuadra'
import type { Mapa } from './modelo/mapa'

/** Un personaje colocado de la escuadra: su casilla y todas las que ocupa */
type Colocado = { id: string; casilla: Casilla; huella: Casilla[] }

/** Grupos de personajes unidos en cadena: cada uno a `distancia` o menos de alguno del grupo; el más grande primero (con empate, el del primero de la escuadra) */
function cadenas(colocados: Colocado[], cerca: (a: Colocado, b: Colocado) => boolean): Colocado[][] {
  const grupos: Colocado[][] = []
  for (const p of colocados) {
    if (grupos.some((g) => g.includes(p))) continue
    const grupo = [p]
    for (let i = 0; i < grupo.length; i++) grupo.push(...colocados.filter((q) => !grupo.includes(q) && cerca(grupo[i], q)))
    grupos.push(grupo)
  }
  // `sort` es estable: con empate, sigue el orden de la escuadra
  return grupos.sort((a, b) => b.length - a.length)
}

/** Con `todos`, quita uno a uno al que está lejos de más de los que quedan (con empate, el último) hasta que todos están cerca de todos */
function lejosDeTodos(colocados: Colocado[], cerca: (a: Colocado, b: Colocado) => boolean): Colocado[] {
  const quedan = [...colocados]
  const fuera: Colocado[] = []
  for (;;) {
    const lejos = quedan.map((p) => quedan.filter((q) => q !== p && !cerca(p, q)).length)
    const peor = Math.max(0, ...lejos)
    if (!peor) return fuera
    fuera.push(...quedan.splice(lejos.lastIndexOf(peor), 1))
  }
}

/** El personaje de la escuadra que se movió el último: el de su última acción, en el turno más reciente, que se movió en ese turno */
function ultimoEnMoverse(escuadra: Escuadra): string | undefined {
  for (const turno of [...escuadra.turnos].sort((a, b) => b.numero - a.numero)) {
    for (const { personaje } of [...turno.acciones].reverse()) {
      const suyo = escuadra.personajes.find((p) => p.id === personaje)
      if (suyo && turnoDePersonaje(suyo, turno.numero).movimientos.length) return suyo.id
    }
  }
}

type Punto = { x: number; y: number }

/**
 * Con `centro`: dónde poner el círculo de radio `distancia` para que deje
 * dentro a más personajes (con empate, a uno con el `ultimo` que se movió; si
 * no, el primero que se encuentra). Se prueban como centros cada personaje y
 * los puntos desde los que el círculo pasa justo por dos de ellos. El
 * círculo queda en el medio de los que deja dentro si así siguen dentro
 */
function mejorCirculo(colocados: Colocado[], distancia: number, ultimo?: string): { centro: Punto; dentro: Colocado[] } {
  const enCirculo = (c: Punto) => (p: Colocado) => Math.hypot(p.casilla.x - c.x, p.casilla.y - c.y) <= distancia + 1e-9
  const porDos = colocados.flatMap((a, i) =>
    colocados.slice(i + 1).flatMap((b) => {
      const [dx, dy] = [b.casilla.x - a.casilla.x, b.casilla.y - a.casilla.y]
      const largo = Math.hypot(dx, dy)
      if (largo > 2 * distancia) return []
      const medio = { x: (a.casilla.x + b.casilla.x) / 2, y: (a.casilla.y + b.casilla.y) / 2 }
      const alto = Math.sqrt(distancia ** 2 - (largo / 2) ** 2) / largo
      return [
        { x: medio.x - dy * alto, y: medio.y + dx * alto },
        { x: medio.x + dy * alto, y: medio.y - dx * alto },
      ]
    }),
  )
  const valor = (dentro: Colocado[]) => dentro.length * 2 + Number(dentro.some((p) => p.id === ultimo))
  const [mejor] = [...colocados.map((p) => p.casilla), ...porDos]
    .map((centro) => ({ centro, dentro: colocados.filter(enCirculo(centro)) }))
    // `sort` es estable: con empate, el primero que se encuentra
    .sort((a, b) => valor(b.dentro) - valor(a.dentro))
  const medio = { x: mejor.dentro.reduce((s, p) => s + p.casilla.x, 0) / mejor.dentro.length, y: mejor.dentro.reduce((s, p) => s + p.casilla.y, 0) / mejor.dentro.length }
  return mejor.dentro.every(enCirculo(medio)) ? { centro: medio, dentro: mejor.dentro } : mejor
}

/**
 * La guía de la coherencia de la escuadra (sus personajes colocados, en
 * casillas del mapa) y quiénes quedan fuera: con `alguno`, los que no están
 * en la cadena más grande (a cada uno se le une con el más cercano de ella);
 * con `todos`, los que hay que quitar para que los demás estén cerca de
 * todos; con `centro`, los que quedan fuera del círculo de la distancia que
 * deja dentro a más (`mejorCirculo`). Siempre queda alguno dentro: la
 * escuadra nunca se queda sin nadie por la coherencia
 */
export function guiaDeCoherencia(m: Mapa, medicion: MedicionMovimiento, escuadra: Escuadra, coherencia: Coherencia): GuiaDeCoherencia {
  const colocados = escuadra.personajes.flatMap((p) => {
    const casilla = enElMapa(m, p)
    return casilla ? [{ id: p.id, casilla, huella: huellaEnElMapa(m, p) }] : []
  })
  // ocupando varias casillas, entre las más cercanas de los dos
  const entre = (a: Colocado, b: Colocado) => Math.min(...a.huella.flatMap((ca) => b.huella.map((cb) => distanciaSegun(medicion, ca, cb))))
  const cerca = (a: Colocado, b: Colocado) => entre(a, b) <= coherencia.distancia
  const enlace = (a: Colocado, b: Colocado) => ({ de: a.id, a: b.id, desde: a.casilla, hasta: b.casilla, enCoherencia: cerca(a, b) })
  const parejas = colocados.flatMap((a, i) => colocados.slice(i + 1).map((b) => [a, b] as const))
  const base = { escuadra: escuadra.id, coherencia }
  if (coherencia.modo === 'centro') {
    if (!colocados.length) return { ...base, enlaces: [], fuera: [] }
    const { centro, dentro } = mejorCirculo(colocados, coherencia.distancia, ultimoEnMoverse(escuadra))
    return { ...base, centro, enlaces: [], fuera: colocados.filter((p) => !dentro.includes(p)).map((p) => p.id) }
  }
  if (coherencia.modo === 'todos') return { ...base, enlaces: parejas.map(([a, b]) => enlace(a, b)), fuera: lejosDeTodos(colocados, cerca).map((p) => p.id) }
  const [principal = [], ...sueltos] = cadenas(colocados, cerca)
  const fuera = sueltos.flat()
  const masCercano = (p: Colocado) =>
    principal.reduce((mejor, q) => (entre(p, q) < entre(p, mejor) ? q : mejor))
  return {
    ...base,
    enlaces: [...parejas.filter(([a, b]) => cerca(a, b)).map(([a, b]) => enlace(a, b)), ...fuera.map((p) => enlace(p, masCercano(p)))],
    fuera: fuera.map((p) => p.id),
  }
}
