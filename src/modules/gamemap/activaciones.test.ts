import { describe, expect, it } from 'vitest'
import {
  activacionDe,
  activar,
  escuadraActiva,
  motivoParaNoActivar,
  motivoParaNoTerminarTurno,
  numeroDeTurno,
  terminarActivacion,
  terminarTurno,
  turnoDeEscuadra,
} from './activaciones'
import { crearEstancia } from './estancias'
import type { Configuracion } from './modelo/configuracion'
import type { Heroe } from './modelo/heroe'
import type { Mapa } from './modelo/mapa'

const heroe = (id: string): Heroe => ({ id, nombre: id, estancia: 'sala', casilla: { x: 0, y: 0 }, turnos: [] })
const mapa: Mapa = {
  estancias: [crearEstancia({ id: 'sala', tipo: 'sala', columnas: 3, filas: 3 })],
  escuadras: [
    { id: 'rojos', nombre: 'Rojos', heroes: [heroe('barbaro'), heroe('elfo')], turnos: [] },
    { id: 'azules', nombre: 'Azules', heroes: [heroe('enano')], turnos: [] },
  ],
  turno: 1,
}
const conModos: Configuracion = { ordenActivaciones: 'alternas', modosActivacion: 'agresivo-sigiloso', medicionMovimiento: 'ortogonal' }
const normales: Configuracion = { ordenActivaciones: 'heroes-primero', modosActivacion: 'normal', medicionMovimiento: 'ortogonal' }

const completas = (m: Mapa, config: Configuracion, modos: Record<string, 'normal' | 'agresivo' | 'sigiloso'>) =>
  Object.entries(modos).reduce((a, [id, modo]) => terminarActivacion(activar(a, config, id, modo), id), m)

describe('activaciones por escuadra', () => {
  it('sin turno guardado, es el primero', () => {
    expect(numeroDeTurno({ estancias: [] })).toBe(1)
  })

  it('la activación queda en el turno en curso de la escuadra', () => {
    const [rojos] = activar(mapa, conModos, 'rojos', 'sigiloso').escuadras ?? []
    expect(rojos.turnos).toEqual([{ numero: 1, activacion: { modo: 'sigiloso', terminada: false }, acciones: [] }])
  })

  it('activarse guarda el modo como último de la escuadra', () => {
    expect(activar(mapa, conModos, 'rojos', 'agresivo').escuadras?.[0].modo).toBe('agresivo')
  })

  it('no se activa un héroe suelto, sino su escuadra', () => {
    expect(motivoParaNoActivar(mapa, conModos, 'barbaro', 'agresivo')).toBe('No hay ninguna escuadra «barbaro» en el mapa')
  })

  it('con modos agresivo y sigiloso, no hay activación normal', () => {
    expect(motivoParaNoActivar(mapa, conModos, 'rojos', 'normal')).toBe('El modo normal no está permitido: agresivo o sigiloso')
  })

  it('sin modos, todas las activaciones son normales', () => {
    expect(motivoParaNoActivar(mapa, normales, 'rojos', 'agresivo')).toBe('El modo agresivo no está permitido: normal')
  })

  it('no se activa otra escuadra hasta que termine la que está en curso', () => {
    expect(motivoParaNoActivar(activar(mapa, conModos, 'rojos', 'agresivo'), conModos, 'azules', 'sigiloso')).toBe(
      'No se puede activar hasta terminar la activación de Rojos',
    )
  })

  it('una escuadra no se activa dos veces en el mismo turno', () => {
    expect(motivoParaNoActivar(completas(mapa, conModos, { rojos: 'agresivo' }), conModos, 'rojos', 'sigiloso')).toBe(
      'Rojos ya se ha activado este turno',
    )
  })

  it('terminar la activación conserva el modo', () => {
    expect(activacionDe(completas(mapa, conModos, { azules: 'sigiloso' }), 'azules')).toEqual({ modo: 'sigiloso', terminada: true })
  })

  it('sin nadie activándose, no hay escuadra activa', () => {
    expect(escuadraActiva(completas(mapa, conModos, { rojos: 'agresivo' }))).toBeUndefined()
  })

  it('la escuadra activa es la que tiene la activación en curso', () => {
    expect(escuadraActiva(activar(mapa, conModos, 'azules', 'sigiloso'))?.id).toBe('azules')
  })

  it('no se termina el turno con escuadras sin activación completa', () => {
    expect(motivoParaNoTerminarTurno(activar(mapa, normales, 'rojos', 'normal'))).toBe('Falta terminar la activación de Rojos, Azules')
  })

  it('con todas terminadas, pasa al turno siguiente y nadie se ha activado en él', () => {
    const siguiente = terminarTurno(completas(mapa, normales, { rojos: 'normal', azules: 'normal' }))
    expect([numeroDeTurno(siguiente), activacionDe(siguiente, 'rojos')]).toEqual([2, undefined])
  })

  it('los turnos anteriores de cada escuadra se conservan', () => {
    const siguiente = terminarTurno(completas(mapa, conModos, { rojos: 'agresivo', azules: 'sigiloso' }))
    const rojos = siguiente.escuadras?.[0]
    expect(rojos && [turnoDeEscuadra(rojos, 1).activacion, rojos.modo]).toEqual([{ modo: 'agresivo', terminada: true }, 'agresivo'])
  })
})
