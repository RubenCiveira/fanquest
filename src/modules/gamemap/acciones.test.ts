import { describe, expect, it } from 'vitest'
import { accionesDelGestor, CAMBIAR_MODO, ejecutarAccion, estadoDeEscuadra, motivoParaNoActuar, TERMINAR_TURNO } from './acciones'
import { terminarTurno, turnoDe } from './activaciones'
import { crearEstancia } from './estancias'
import type { Configuracion } from './modelo/configuracion'
import type { FichaHeroe } from './modelo/elemento'
import type { Mapa } from './modelo/mapa'

const ficha = (id: string, escuadra: string, posicion?: { x: number; y: number }): FichaHeroe => ({
  id,
  nombre: id,
  tipo: 'heroe',
  escuadra,
  columnas: 1,
  filas: 1,
  posicion,
})
const mapa: Mapa = {
  estancias: [
    { ...crearEstancia({ id: 'sala', tipo: 'sala', columnas: 3, filas: 3 }), elementos: [ficha('barbaro', 'rojos', { x: 1, y: 1 }), ficha('enano', 'azules')] },
  ],
  escuadras: [
    { id: 'rojos', nombre: 'Rojos' },
    { id: 'azules', nombre: 'Azules' },
  ],
  turno: { numero: 2, activaciones: {}, ultimosModos: { rojos: 'agresivo', azules: 'sigiloso' } },
}
const conModos: Configuracion = { ordenActivaciones: 'alternas', modosActivacion: 'agresivo-sigiloso' }
const normales: Configuracion = { ordenActivaciones: 'alternas', modosActivacion: 'normal' }

describe('acciones de las escuadras', () => {
  it('con modos, el gestor ofrece cambiar al otro modo y terminar turno', () => {
    expect(accionesDelGestor(mapa, conModos, 'rojos')).toEqual([{ id: CAMBIAR_MODO, nombre: 'Cambiar a sigiloso' }, TERMINAR_TURNO])
  })

  it('sin modos, el gestor solo ofrece terminar turno', () => {
    expect(accionesDelGestor({ ...mapa, turno: undefined }, normales, 'rojos')).toEqual([TERMINAR_TURNO])
  })

  it('el estado de la escuadra tiene su turno, sus héroes, su modo y lo que ya ha hecho', () => {
    expect(estadoDeEscuadra(ejecutarAccion(mapa, conModos, 'rojos', 'mover'), conModos, 'rojos')).toEqual({
      escuadra: 'rojos',
      turno: 2,
      heroes: [{ id: 'barbaro', estancia: 'sala', posicion: { x: 1, y: 1 } }],
      modo: 'agresivo',
      acciones: [{ accion: 'mover' }],
      movimientos: [],
    })
  })

  it('la primera acción empieza la activación en su modo actual', () => {
    expect(turnoDe(ejecutarAccion(mapa, conModos, 'azules', 'mover')).activaciones.azules).toEqual({ modo: 'sigiloso', terminada: false })
  })

  it('cambiar de modo cambia el de la activación', () => {
    expect(turnoDe(ejecutarAccion(mapa, conModos, 'rojos', CAMBIAR_MODO)).activaciones.rojos).toEqual({ modo: 'sigiloso', terminada: false })
  })

  it('terminar turno da por terminada la activación', () => {
    expect(turnoDe(ejecutarAccion(mapa, conModos, 'rojos', TERMINAR_TURNO.id)).activaciones.rojos.terminada).toBe(true)
  })

  it('una escuadra que ha terminado su turno no puede actuar', () => {
    expect(motivoParaNoActuar(ejecutarAccion(mapa, conModos, 'rojos', TERMINAR_TURNO.id), 'rojos')).toBe('Rojos ya ha terminado su turno')
  })

  it('mientras una escuadra se activa, las demás no pueden actuar', () => {
    expect(motivoParaNoActuar(ejecutarAccion(mapa, conModos, 'rojos', 'mover'), 'azules')).toBe('Rojos aún no ha terminado su activación')
  })

  it('el turno siguiente recuerda el modo al que se cambió y olvida las acciones', () => {
    const hecho = [
      ['rojos', CAMBIAR_MODO],
      ['rojos', TERMINAR_TURNO.id],
      ['azules', TERMINAR_TURNO.id],
    ].reduce((m, [id, accion]) => ejecutarAccion(m, conModos, id, accion), mapa)
    expect(turnoDe(terminarTurno(hecho))).toEqual({ numero: 3, activaciones: {}, ultimosModos: { rojos: 'sigiloso', azules: 'sigiloso' } })
  })
})
