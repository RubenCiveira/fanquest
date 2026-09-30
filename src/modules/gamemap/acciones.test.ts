import { describe, expect, it } from 'vitest'
import { accionesDelGestor, CAMBIAR_MODO, ejecutarAccion, motivoParaNoActuar, TERMINAR_TURNO } from './acciones'
import { activacionDe, numeroDeTurno, terminarTurno, turnoDeEscuadra, turnoDePersonaje } from './activaciones'
import { crearEstancia } from './estancias'
import type { Configuracion } from './modelo/configuracion'
import type { Mapa } from './modelo/mapa'

const mapa: Mapa = {
  estancias: [crearEstancia({ id: 'sala', tipo: 'sala', columnas: 3, filas: 3 })],
  escuadras: [
    { id: 'rojos', nombre: 'Rojos', modo: 'agresivo', personajes: [{ id: 'barbaro', nombre: 'Bárbaro', estancia: 'sala', casilla: { x: 1, y: 1 }, turnos: [] }], turnos: [] },
    { id: 'azules', nombre: 'Azules', modo: 'sigiloso', personajes: [{ id: 'enano', nombre: 'Enano', estancia: 'sala', turnos: [] }], turnos: [] },
  ],
  turno: 2,
}
const conModos: Configuracion = { ordenActivaciones: 'alternas', modosActivacion: 'agresivo-sigiloso', medicionMovimiento: 'ortogonal', terrenoPersonajes: 'normal' }
const normales: Configuracion = { ordenActivaciones: 'alternas', modosActivacion: 'normal', medicionMovimiento: 'ortogonal', terrenoPersonajes: 'normal' }
const rojos = (m: Mapa) => m.escuadras?.find((e) => e.id === 'rojos') ?? { id: '', nombre: '', personajes: [], turnos: [] }

describe('acciones de las escuadras', () => {
  it('con modos, el gestor ofrece cambiar al otro modo y terminar turno', () => {
    expect(accionesDelGestor(mapa, conModos, 'rojos')).toEqual([{ id: CAMBIAR_MODO, nombre: 'Cambiar a sigiloso', icono: '👣' }, TERMINAR_TURNO])
  })

  it('sin modos, el gestor solo ofrece terminar turno', () => {
    const sinModos = { ...mapa, escuadras: mapa.escuadras?.map((e) => ({ ...e, modo: undefined })) }
    expect(accionesDelGestor(sinModos, normales, 'rojos')).toEqual([TERMINAR_TURNO])
  })

  it('la acción de un personaje queda en el turno de su escuadra, como suya', () => {
    expect(turnoDeEscuadra(rojos(ejecutarAccion(mapa, conModos, 'rojos', 'gritar', 'barbaro')), 2).acciones).toEqual([{ accion: 'gritar', personaje: 'barbaro' }])
  })

  it('y en el turno del personaje', () => {
    const barbaro = rojos(ejecutarAccion(mapa, conModos, 'rojos', 'gritar', 'barbaro')).personajes[0]
    expect(turnoDePersonaje(barbaro, 2).acciones).toEqual(['gritar'])
  })

  it('el personaje que actúa pasa a ser el activo de su escuadra', () => {
    expect(rojos(ejecutarAccion(mapa, conModos, 'rojos', 'gritar', 'barbaro')).activo).toBe('barbaro')
  })

  it('la primera acción empieza la activación en su modo actual', () => {
    expect(activacionDe(ejecutarAccion(mapa, conModos, 'azules', 'gritar'), 'azules')).toEqual({ modo: 'sigiloso', terminada: false })
  })

  it('cambiar de modo cambia el de la activación y el último de la escuadra', () => {
    const cambiado = ejecutarAccion(mapa, conModos, 'rojos', CAMBIAR_MODO)
    expect([activacionDe(cambiado, 'rojos'), rojos(cambiado).modo]).toEqual([{ modo: 'sigiloso', terminada: false }, 'sigiloso'])
  })

  it('terminar turno da por terminada la activación', () => {
    expect(activacionDe(ejecutarAccion(mapa, conModos, 'rojos', TERMINAR_TURNO.id), 'rojos')?.terminada).toBe(true)
  })

  it('una escuadra que ha terminado su turno no puede actuar', () => {
    expect(motivoParaNoActuar(ejecutarAccion(mapa, conModos, 'rojos', TERMINAR_TURNO.id), 'rojos')).toBe('Rojos ya ha terminado su turno')
  })

  it('mientras una escuadra se activa, las demás no pueden actuar', () => {
    expect(motivoParaNoActuar(ejecutarAccion(mapa, conModos, 'rojos', 'gritar'), 'azules')).toBe('No se puede activar hasta terminar la activación de Rojos')
  })

  it('en el turno siguiente la escuadra recuerda el modo al que cambió y empieza sin acciones', () => {
    const hecho = [
      ['rojos', CAMBIAR_MODO],
      ['rojos', TERMINAR_TURNO.id],
      ['azules', TERMINAR_TURNO.id],
    ].reduce((m, [id, accion]) => ejecutarAccion(m, conModos, id, accion), mapa)
    const siguiente = terminarTurno(hecho)
    expect([rojos(siguiente).modo, turnoDeEscuadra(rojos(siguiente), numeroDeTurno(siguiente)).acciones]).toEqual(['sigiloso', []])
  })
})
