import { describe, expect, it } from 'vitest'
import { activacionDePrueba, escuadrasDePrueba } from './escuadras'
import { PersonajeDePrueba, MOVIMIENTO_DE_PRUEBA } from './modelo/personaje'
import { PuertasDePrueba } from './modelo/puerta'

/** Estado de un personaje recién colocado */
const enJuego = { id: 'barbaro', nombre: 'Bárbaro', estancia: 'estancia-1', turnos: [] }

describe('escuadras de prueba', () => {
  const escuadras = () => escuadrasDePrueba(new PuertasDePrueba()).listarEscuadras()

  it('una escuadra con el bárbaro y otra con el enano, con su ficha VTT', async () => {
    const personajes = await Promise.all((await escuadras()).map((e) => e.personajes()))
    expect(personajes.map((h) => h.map(({ id, imagenVtt }) => [id, Boolean(imagenVtt)]))).toEqual([[['barbaro', true]], [['enano', true]]])
  })

  it('añade escuadras de monstruos elegidas para la estancia inicial', async () => {
    const proveedor = escuadrasDePrueba(new PuertasDePrueba(), () => [[{ id: 'orco-1', nombre: 'Orco', jugador: 'oscuridad' }]])
    const escuadras = await proveedor.listarEscuadras()
    expect([escuadras[2].id, escuadras[2].jugador, (await escuadras[2].personajes()).map((p) => p.id)]).toEqual(['escuadra-monstruos-1', 'oscuridad', ['orco-1']])
  })

  it('sus personajes son personajes de prueba, siempre los mismos', async () => {
    const [escuadra] = await escuadras()
    const [primero] = await escuadra.personajes()
    const [otraVez] = await escuadra.personajes()
    expect([primero instanceof PersonajeDePrueba, primero === otraVez]).toEqual([true, true])
  })

  it('las dos empiezan en modo sigiloso', async () => {
    expect(await Promise.all((await escuadras()).map((e) => e.modoActivacion()))).toEqual(['sigiloso', 'sigiloso'])
  })

  it('el personaje pregunta por su movimiento con lo que ya ha gastado', async () => {
    const [barbaro] = await (await escuadras())[0].personajes()
    expect(await barbaro.opcionesMovimiento(enJuego, { casillas: 0, acciones: [] })).toEqual(MOVIMIENTO_DE_PRUEBA)
  })

  it('moverse sin más no completa la activación', () => {
    expect(activacionDePrueba([{ accion: 'mover', personaje: 'barbaro' }])).toEqual({ completo: false })
  })

  it('moverse y deslizar completa la activación', () => {
    expect(activacionDePrueba([{ accion: 'mover', personaje: 'barbaro' }, { accion: 'deslizar', personaje: 'barbaro' }])).toEqual({ completo: true })
  })

  it('moverse y usar otra acción de la escuadra completa la activación', () => {
    expect(activacionDePrueba([{ accion: 'cambiar-modo' }, { accion: 'mover', personaje: 'barbaro' }])).toEqual({ completo: true })
  })

  it('usar una acción sin moverse no completa la activación', () => {
    expect(activacionDePrueba([{ accion: 'cambiar-modo' }])).toEqual({ completo: false })
  })
})
