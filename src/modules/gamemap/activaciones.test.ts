import { describe, expect, it } from 'vitest'
import {
  activar,
  escuadrasDelMapa,
  motivoParaNoActivar,
  motivoParaNoTerminarTurno,
  terminarActivacion,
  terminarTurno,
  turnoDe,
} from './activaciones'
import { crearEstancia } from './estancias'
import type { Configuracion } from './modelo/configuracion'
import type { FichaHeroe } from './modelo/elemento'
import type { Mapa } from './modelo/mapa'

const ficha = (id: string, escuadra: string): FichaHeroe => ({ id, nombre: id, tipo: 'heroe', escuadra, columnas: 1, filas: 1 })
const mapa: Mapa = {
  estancias: [
    { ...crearEstancia({ id: 'sala', tipo: 'sala', columnas: 3, filas: 3 }), elementos: [ficha('barbaro', 'rojos'), ficha('elfo', 'rojos'), ficha('enano', 'azules')] },
  ],
  escuadras: [
    { id: 'rojos', nombre: 'Rojos' },
    { id: 'azules', nombre: 'Azules' },
  ],
}
const conModos: Configuracion = { ordenActivaciones: 'alternas', modosActivacion: 'agresivo-sigiloso' }
const normales: Configuracion = { ordenActivaciones: 'heroes-primero', modosActivacion: 'normal' }

const completas = (m: Mapa, config: Configuracion, modos: Record<string, 'normal' | 'agresivo' | 'sigiloso'>) =>
  Object.entries(modos).reduce((a, [id, modo]) => terminarActivacion(activar(a, config, id, modo), id), m)

describe('activaciones por escuadra', () => {
  it('sin turno guardado, es el primero y nadie se ha activado', () => {
    expect(turnoDe(mapa)).toEqual({ numero: 1, activaciones: {} })
  })

  it('las escuadras del mapa son las de sus héroes, con su nombre', () => {
    expect(escuadrasDelMapa(mapa)).toEqual(mapa.escuadras)
  })

  it('una escuadra se activa en el modo elegido', () => {
    expect(turnoDe(activar(mapa, conModos, 'rojos', 'sigiloso')).activaciones).toEqual({ rojos: { modo: 'sigiloso', terminada: false } })
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
      'Rojos aún no ha terminado su activación',
    )
  })

  it('una escuadra no se activa dos veces en el mismo turno', () => {
    expect(motivoParaNoActivar(completas(mapa, conModos, { rojos: 'agresivo' }), conModos, 'rojos', 'sigiloso')).toBe(
      'Rojos ya se ha activado este turno',
    )
  })

  it('terminar la activación conserva el modo', () => {
    expect(turnoDe(completas(mapa, conModos, { azules: 'sigiloso' })).activaciones.azules).toEqual({ modo: 'sigiloso', terminada: true })
  })

  it('no se termina el turno con escuadras sin activación completa', () => {
    expect(motivoParaNoTerminarTurno(activar(mapa, normales, 'rojos', 'normal'))).toBe('Falta terminar la activación de Rojos, Azules')
  })

  it('con todas terminadas, pasa al turno siguiente sin activaciones', () => {
    expect(turnoDe(terminarTurno(completas(mapa, normales, { rojos: 'normal', azules: 'normal' })))).toMatchObject({ numero: 2, activaciones: {} })
  })

  const turnoCon = (modos: Record<string, 'agresivo' | 'sigiloso'>, m = mapa) => terminarTurno(completas(m, conModos, modos))

  it('el turno siguiente recuerda el último modo agresivo o sigiloso de cada escuadra', () => {
    expect(turnoDe(turnoCon({ rojos: 'agresivo', azules: 'sigiloso' })).ultimosModos).toEqual({ rojos: 'agresivo', azules: 'sigiloso' })
  })

  it('el último modo se actualiza con la activación más reciente', () => {
    const dos = turnoCon({ rojos: 'sigiloso', azules: 'sigiloso' }, turnoCon({ rojos: 'agresivo', azules: 'sigiloso' }))
    expect(turnoDe(dos).ultimosModos).toEqual({ rojos: 'sigiloso', azules: 'sigiloso' })
  })

  it('las activaciones normales no dejan último modo', () => {
    expect(turnoDe(terminarTurno(completas(mapa, normales, { rojos: 'normal', azules: 'normal' }))).ultimosModos).toEqual({})
  })
})
