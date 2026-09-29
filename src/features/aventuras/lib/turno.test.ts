import { describe, expect, it } from 'vitest'
import type { Partida } from './partida'
import { actua, haTerminado, nuevoTurno, seMueve, sinTerminar, terminarTurno, tiroTrampa, yaTiroTrampa } from './turno'

const partida = {} as Partida

describe('turnos con mapa', () => {
  it('un héroe termina su turno', () => {
    expect(terminarTurno(partida, 'kor').turno?.terminados).toEqual(['kor'])
  })

  it('terminar dos veces no repite la marca', () => {
    expect(terminarTurno(terminarTurno(partida, 'kor'), 'kor').turno?.terminados).toEqual(['kor'])
  })

  it('dice quién falta por terminar', () => {
    expect(sinTerminar(terminarTurno(partida, 'kor'), ['kor', 'brianna', 'nim'])).toEqual(['brianna', 'nim'])
  })

  it('moverse sin actuar no termina el turno: aún puede atacar', () => {
    expect(haTerminado(seMueve(partida, 'kor'), 'kor')).toBe(false)
  })

  it('mover y después atacar termina el turno', () => {
    expect(haTerminado(actua(seMueve(partida, 'kor'), 'kor'), 'kor')).toBe(true)
  })

  it('atacar y después mover también lo termina', () => {
    expect(haTerminado(seMueve(actua(partida, 'kor'), 'kor'), 'kor')).toBe(true)
  })

  it('el dado de trampa se tira una vez por turno', () => {
    expect(yaTiroTrampa(tiroTrampa(partida, 'kor'), 'kor')).toBe(true)
  })

  it('un turno nuevo quita las marcas y vuelve a pedir el dado de trampa', () => {
    const p = nuevoTurno(tiroTrampa(actua(seMueve(partida, 'kor'), 'kor'), 'kor'))
    expect([sinTerminar(p, ['kor']), yaTiroTrampa(p, 'kor'), haTerminado(seMueve(p, 'kor'), 'kor')]).toEqual([['kor'], false, false])
  })
})
