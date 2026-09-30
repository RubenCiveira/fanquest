import { describe, expect, it } from 'vitest'
import { activacionDePrueba, escuadrasDePrueba } from './escuadras'
import { HeroeDePrueba, MOVIMIENTO_DE_PRUEBA } from './modelo/heroe'
import { PuertasDePrueba } from './modelo/puerta'

/** Estado de un héroe recién colocado */
const enJuego = { id: 'barbaro', nombre: 'Bárbaro', estancia: 'estancia-1', turnos: [] }

describe('escuadras de prueba', () => {
  const escuadras = () => escuadrasDePrueba(new PuertasDePrueba()).listarEscuadras()

  it('una escuadra con el bárbaro y otra con el enano, con su ficha VTT', async () => {
    const heroes = await Promise.all((await escuadras()).map((e) => e.heroes()))
    expect(heroes.map((h) => h.map(({ id, imagenVtt }) => [id, Boolean(imagenVtt)]))).toEqual([[['barbaro', true]], [['enano', true]]])
  })

  it('sus héroes son héroes de prueba, siempre los mismos', async () => {
    const [escuadra] = await escuadras()
    const [primero] = await escuadra.heroes()
    const [otraVez] = await escuadra.heroes()
    expect([primero instanceof HeroeDePrueba, primero === otraVez]).toEqual([true, true])
  })

  it('las dos empiezan en modo sigiloso', async () => {
    expect(await Promise.all((await escuadras()).map((e) => e.modoActivacion()))).toEqual(['sigiloso', 'sigiloso'])
  })

  it('el héroe pregunta por su movimiento con lo que ya ha gastado', async () => {
    const [barbaro] = await (await escuadras())[0].heroes()
    expect(await barbaro.opcionesMovimiento(enJuego, { casillas: 0, acciones: [] })).toEqual(MOVIMIENTO_DE_PRUEBA)
  })

  it('moverse sin más no completa la activación', () => {
    expect(activacionDePrueba([{ accion: 'mover', heroe: 'barbaro' }])).toEqual({ completo: false })
  })

  it('moverse y deslizar completa la activación', () => {
    expect(activacionDePrueba([{ accion: 'mover', heroe: 'barbaro' }, { accion: 'deslizar', heroe: 'barbaro' }])).toEqual({ completo: true })
  })

  it('moverse y usar otra acción de la escuadra completa la activación', () => {
    expect(activacionDePrueba([{ accion: 'cambiar-modo' }, { accion: 'mover', heroe: 'barbaro' }])).toEqual({ completo: true })
  })

  it('usar una acción sin moverse no completa la activación', () => {
    expect(activacionDePrueba([{ accion: 'cambiar-modo' }])).toEqual({ completo: false })
  })
})
