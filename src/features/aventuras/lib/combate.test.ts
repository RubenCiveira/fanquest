import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ajustar,
  cambiarDados,
  danios,
  dadosDeAtaque,
  iniciarCombate,
  perdidas,
  repetir,
  siguiente,
  terminado,
  type Combatiente,
} from './combate'

const BARBARO: Combatiente = { clave: 'barbaro', nombre: 'Bárbaro', bando: 'grupo', ataque: 3, defensa: 2 }
const ORCO: Combatiente = { clave: 'orco-1', nombre: 'Grom', bando: 'monstruos', ataque: 3, defensa: 2 }
const LOBO: Combatiente = { clave: 'lobo-1', nombre: 'Luna', bando: 'monstruos', ataque: '4/4', defensa: 3 }

/** Los dados de combate sacan calavera (0), escudo blanco (0.7) o escudo negro (0.9) */
const caras = (...rs: number[]) => rs.reduce((s, r) => s.mockReturnValueOnce(r), vi.spyOn(Math, 'random'))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('combate', () => {
  it('«5/4» son dos ataques y «2+1» son tres dados', () => {
    expect([dadosDeAtaque('5/4'), dadosDeAtaque('2+1'), dadosDeAtaque(3)]).toEqual([[5, 4], [3], [3]])
  })

  it('se ataca y se defiende de cada ataque, en orden', () => {
    expect(iniciarCombate(LOBO, BARBARO).fases.map((f) => `${f.tipo} ${f.ataque}`)).toEqual([
      'ataque 0',
      'defensa 0',
      'ataque 1',
      'defensa 1',
    ])
  })

  it('un monstruo bloquea con escudos negros y no con blancos', () => {
    // ataque: 3 calaveras; defensa: un escudo blanco y un escudo negro
    caras(0, 0, 0, 0.7, 0.9)
    const c = siguiente(iniciarCombate(BARBARO, ORCO))
    expect(danios(c)).toEqual([2])
  })

  it('un héroe bloquea con escudos blancos', () => {
    caras(0, 0, 0, 0.7, 0.7)
    const c = siguiente(iniciarCombate(ORCO, BARBARO))
    expect(danios(c)).toEqual([1])
  })

  it('repetir no toca los dados que no se eligieron', () => {
    const antes = iniciarCombate(BARBARO, ORCO)
    expect(repetir(antes, [0]).fases[0].valores.slice(1)).toEqual(antes.fases[0].valores.slice(1))
  })

  it('repetir un dado lo vuelve a tirar y cuenta la repetición', () => {
    caras(0, 0, 0, 0.9)
    const c = repetir(iniciarCombate(BARBARO, ORCO), [0])
    expect([c.fases[0].valores.map((v) => (v <= 3 ? 'calavera' : 'escudo')), c.fases[0].repeticiones]).toEqual([
      ['escudo', 'calavera', 'calavera'],
      1,
    ])
  })

  it('se pueden añadir y quitar dados en la tirada en curso', () => {
    const c = cambiarDados(cambiarDados(iniciarCombate(BARBARO, ORCO), 1), 1)
    expect(cambiarDados(c, -1).fases[0].valores).toHaveLength(4)
  })

  it('tras la última defensa queda el resumen', () => {
    expect(terminado(siguiente(siguiente(iniciarCombate(BARBARO, ORCO))))).toBe(true)
  })

  it('las pérdidas suman el daño y los ajustes a mano, sin bajar de 0', () => {
    caras(0, 0, 0, 0.7, 0.7)
    const c = ajustar(ajustar(siguiente(siguiente(iniciarCombate(BARBARO, ORCO))), 'orco-1', 1), 'barbaro', -1)
    expect(perdidas(c).map((p) => p.pc)).toEqual([0, 4])
  })
})
