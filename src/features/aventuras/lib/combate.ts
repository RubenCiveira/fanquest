import { caraDC, tirar, type CaraDC } from '../../../lib/dados'

/**
 * Combate de FetenQuest: el atacante lanza sus dados de combate (cada
 * calavera es un impacto) y el defensor, los suyos: los héroes bloquean con
 * escudos blancos y los monstruos con escudos negros. Cada calavera sin
 * bloquear quita 1 Punto de Cuerpo. Con varios ataques («5/4») el defensor
 * se defiende de cada uno.
 */

export type Bando = 'grupo' | 'monstruos'

export type Combatiente = {
  clave: string
  nombre: string
  bando: Bando
  /** Dados de ataque: un número, «2+1» o «5/4» (dos ataques) */
  ataque: number | string
  defensa: number
}

export type Fase = {
  tipo: 'ataque' | 'defensa'
  /** Ataque al que pertenece (0 el primero) */
  ataque: number
  /** Un valor de 1D6 por dado de combate; vacío hasta tirarlos */
  valores: number[]
  /** Veces que se ha repetido algún dado */
  repeticiones: number
}

export type Combate = {
  atacante: Combatiente
  defensor: Combatiente
  fases: Fase[]
  /** Fase en curso; con todas hechas, el resumen */
  actual: number
  /** Daño que se suma o resta a mano (hechizos, fuego…), por clave */
  ajustes: Record<string, number>
}

/** Cada ataque de la acción y sus dados: «5/4» son dos ataques; «2+1», tres dados */
export function dadosDeAtaque(ataque: number | string): number[] {
  if (typeof ataque === 'number') return [ataque]
  return ataque.split('/').map((a) => a.split('+').reduce((n, d) => n + (Number(d) || 0), 0))
}

const tirarDados = (n: number) => Array.from({ length: n }, () => tirar('1DC'))

export function iniciarCombate(atacante: Combatiente, defensor: Combatiente): Combate {
  const fases = dadosDeAtaque(atacante.ataque).flatMap((dados, ataque): Fase[] => [
    { tipo: 'ataque', ataque, valores: Array<number>(dados).fill(0), repeticiones: 0 },
    { tipo: 'defensa', ataque, valores: Array<number>(defensor.defensa).fill(0), repeticiones: 0 },
  ])
  return tirarFase({ atacante, defensor, fases, actual: 0, ajustes: {} })
}

const conFase = (c: Combate, cambio: (f: Fase) => Fase): Combate => ({
  ...c,
  fases: c.fases.map((f, i) => (i === c.actual ? cambio(f) : f)),
})

/** Lanza todos los dados de la fase en curso */
const tirarFase = (c: Combate) => conFase(c, (f) => ({ ...f, valores: tirarDados(f.valores.length) }))

/** Repite los dados elegidos (hechizos, reglas especiales) o todos (ventaja) */
export const repetir = (c: Combate, indices: number[]) =>
  conFase(c, (f) => ({
    ...f,
    valores: f.valores.map((v, i) => (indices.includes(i) ? tirar('1DC') : v)),
    repeticiones: f.repeticiones + 1,
  }))

/** Un dado más (se tira) o uno menos (el último) en la fase en curso */
export const cambiarDados = (c: Combate, delta: 1 | -1) =>
  conFase(c, (f) => ({ ...f, valores: delta > 0 ? [...f.valores, tirar('1DC')] : f.valores.slice(0, -1) }))

/** Pasa a la siguiente tirada y la lanza; tras la última queda el resumen */
export function siguiente(c: Combate): Combate {
  const avanzado = { ...c, actual: c.actual + 1 }
  return avanzado.actual < c.fases.length ? tirarFase(avanzado) : avanzado
}

export const terminado = (c: Combate) => c.actual >= c.fases.length

export const contar = (valores: number[], cara: CaraDC) => valores.filter((v) => caraDC(v) === cara).length

/** Con qué cara bloquea cada bando */
export const caraDeDefensa = (b: Bando): CaraDC => (b === 'grupo' ? 'Escudo blanco' : 'Escudo negro')

/** Daño de cada ataque: calaveras que la defensa no bloquea */
export function danios(c: Combate): number[] {
  const bloquea = caraDeDefensa(c.defensor.bando)
  return c.fases
    .filter((f) => f.tipo === 'ataque')
    .map((ataque) => {
      const defensa = c.fases.find((f) => f.tipo === 'defensa' && f.ataque === ataque.ataque)
      return Math.max(0, contar(ataque.valores, 'Calavera') - contar(defensa?.valores ?? [], bloquea))
    })
}

export const ajustar = (c: Combate, clave: string, delta: number): Combate => ({
  ...c,
  ajustes: { ...c.ajustes, [clave]: (c.ajustes[clave] ?? 0) + delta },
})

/** Puntos de Cuerpo que pierde cada combatiente, con los ajustes a mano */
export function perdidas(c: Combate): { clave: string; nombre: string; pc: number }[] {
  const danio = danios(c).reduce((a, b) => a + b, 0)
  return [
    { ...c.atacante, pc: Math.max(0, c.ajustes[c.atacante.clave] ?? 0) },
    { ...c.defensor, pc: Math.max(0, danio + (c.ajustes[c.defensor.clave] ?? 0)) },
  ].map(({ clave, nombre, pc }) => ({ clave, nombre, pc }))
}
