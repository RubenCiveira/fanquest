import { describe, expect, it } from 'vitest'
import { escuadrasDePrueba } from './escuadras'

describe('escuadras de prueba', () => {
  it('una escuadra con el bárbaro y otra con el enano, con su ficha VTT', async () => {
    const escuadras = await escuadrasDePrueba.listarEscuadras()
    const heroes = await Promise.all(escuadras.map((e) => e.heroes()))
    expect(heroes.map((h) => h.map(({ id, imagenVtt }) => [id, Boolean(imagenVtt)]))).toEqual([[['barbaro', true]], [['enano', true]]])
  })

  it('las dos empiezan en modo sigiloso', async () => {
    const escuadras = await escuadrasDePrueba.listarEscuadras()
    expect(await Promise.all(escuadras.map((e) => e.modoActivacion()))).toEqual(['sigiloso', 'sigiloso'])
  })
})
