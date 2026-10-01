import { describe, expect, it } from 'vitest'
import {
  activacionDe,
  activar,
  conActivacionDeJugador,
  conActivacion,
  escuadraActiva,
  jugadorEnTurno,
  motivoParaNoActivar,
  motivoParaNoTerminarTurno,
  numeroDeTurno,
  terminarActivacion,
  terminarTurno,
  turnoDeEscuadra,
} from './activaciones'
import { crearEstancia } from './estancias'
import type { Configuracion } from './modelo/configuracion'
import type { HuecoDelTurno } from './modelo/ordenDelTurno'
import type { Personaje } from './modelo/personaje'
import type { Mapa } from './modelo/mapa'

const personaje = (id: string): Personaje => ({ id, nombre: id, estancia: 'sala', casilla: { x: 0, y: 0 }, turnos: [] })
const mapa: Mapa = {
  estancias: [crearEstancia({ id: 'sala', tipo: 'sala', columnas: 3, filas: 3 })],
  escuadras: [
    { id: 'rojos', nombre: 'Rojos', jugador: 'j1', personajes: [personaje('barbaro'), personaje('elfo')], turnos: [] },
    { id: 'azules', nombre: 'Azules', jugador: 'j1', personajes: [personaje('enano')], turnos: [] },
  ],
  turno: 1,
}
const conModos: Configuracion = { ordenActivaciones: 'alternas', modosActivacion: 'agresivo-sigiloso', medicionMovimiento: 'ortogonal', terrenoPersonajes: 'normal', distanciaControl: 0, cuerpoACuerpo: 'diagonal', coherencia: 'ninguna', distanciaCoherencia: 0, jugadores: { alianzas: [], jugadores: [] } }
const normales: Configuracion = { ordenActivaciones: 'personajes-primero', modosActivacion: 'normal', medicionMovimiento: 'ortogonal', terrenoPersonajes: 'normal', distanciaControl: 0, cuerpoACuerpo: 'diagonal', coherencia: 'ninguna', distanciaCoherencia: 0, jugadores: { alianzas: [], jugadores: [] } }

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

  it('no se activa un personaje suelto, sino su escuadra', () => {
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

describe('a qué jugador le toca', () => {
  /** Ana y Tomás en los Héroes, Bruno en los Enanos y la Oscuridad (sin escuadras) en los Monstruos; una escuadra cada uno */
  const escuadra = (id: string, jugador: string) => ({ id, nombre: id, jugador, personajes: [personaje(`${id}-1`)], turnos: [] })
  const partida: Mapa = {
    estancias: mapa.estancias,
    escuadras: [escuadra('de-ana', 'ana'), escuadra('de-tomas', 'tomas'), escuadra('de-bruno', 'bruno')],
    jugadores: {
      alianzas: [
        { id: 'heroes', nombre: 'Héroes' },
        { id: 'enanos', nombre: 'Enanos' },
        { id: 'monstruos', nombre: 'Monstruos' },
      ],
      jugadores: [
        { id: 'ana', nombre: 'Ana', tipo: 'humano', alianza: 'heroes' },
        { id: 'tomas', nombre: 'Tomás', tipo: 'humano', alianza: 'heroes' },
        { id: 'bruno', nombre: 'Bruno', tipo: 'humano', alianza: 'enanos' },
        { id: 'oscuridad', nombre: 'La Oscuridad', tipo: 'ia', alianza: 'monstruos' },
      ],
    },
    turno: 1,
  }
  const conMonstruos: Mapa = {
    ...partida,
    escuadras: [escuadra('de-ana', 'ana'), escuadra('de-bruno', 'bruno')],
    personajesNoJugadores: [{ id: 'orco', nombre: 'Orco', estancia: 'sala', casilla: { x: 1, y: 1 }, turnos: [], jugador: 'oscuridad' }],
    jugadores: {
      alianzas: [
        { id: 'heroes', nombre: 'Héroes' },
        { id: 'monstruos', nombre: 'Monstruos' },
      ],
      jugadores: [
        { id: 'ana', nombre: 'Ana', tipo: 'humano', alianza: 'heroes' },
        { id: 'bruno', nombre: 'Bruno', tipo: 'humano', alianza: 'heroes' },
        { id: 'oscuridad', nombre: 'La Oscuridad', tipo: 'ia', alianza: 'monstruos' },
      ],
    },
  }
  const conDosMonstruos: Mapa = { ...conMonstruos, personajesNoJugadores: [...(conMonstruos.personajesNoJugadores ?? []), { id: 'goblin', nombre: 'Goblin', estancia: 'sala', casilla: { x: 2, y: 1 }, turnos: [], jugador: 'oscuridad' }] }
  /** A quién le va tocando mientras cada uno activa y termina su escuadra */
  function sucesion(m: Mapa, config: Configuracion) {
    const orden: string[] = []
    for (let turno = jugadorEnTurno(m, config); turno; turno = jugadorEnTurno(m, config)) {
      const suya = m.escuadras?.find((e) => e.jugador === turno.id && !activacionDe(m, e.id))
      orden.push(turno.nombre)
      m = suya ? terminarActivacion(activar(m, config, suya.id, 'normal'), suya.id) : conActivacionDeJugador(m, turno.id)
    }
    return orden
  }

  it('sin reparto de jugadores, a nadie', () => {
    expect(jugadorEnTurno(mapa, normales)).toBeUndefined()
  })

  it('alternas: rota entre alianzas y, dentro de cada una, entre sus jugadores; salta a quien no tiene nada que activar', () => {
    expect(sucesion(partida, { ...normales, ordenActivaciones: 'alternas' })).toEqual(['Ana', 'Bruno', 'Tomás'])
  })

  it('alianza a alianza: primero todos los de la primera', () => {
    expect(sucesion(partida, normales)).toEqual(['Ana', 'Tomás', 'Bruno'])
  })

  it('alternas: tras un héroe le toca a la alianza de monstruos aunque solo tenga PNJ', () => {
    expect(sucesion(conMonstruos, { ...normales, ordenActivaciones: 'alternas' })).toEqual(['Ana', 'La Oscuridad', 'Bruno'])
  })

  it('alianza a alianza: los héroes completan sus activaciones antes que los monstruos', () => {
    expect(sucesion(conMonstruos, normales)).toEqual(['Ana', 'Bruno', 'La Oscuridad'])
  })

  it('alternas: un jugador sigue pendiente mientras le queden PNJ sin activar', () => {
    expect(sucesion(conDosMonstruos, { ...normales, ordenActivaciones: 'alternas' })).toEqual(['Ana', 'La Oscuridad', 'Bruno', 'La Oscuridad'])
  })

  /** Con iniciativa y esos huecos como orden del turno en curso */
  const conOrden = (m: Mapa, ...huecos: HuecoDelTurno[]): Mapa => ({ ...m, ordenDelTurno: { numero: 1, huecos } })
  const iniciativa: Configuracion = { ...normales, ordenActivaciones: 'iniciativa' }

  it('iniciativa: sigue el orden del turno', () => {
    expect(sucesion(conOrden(partida, { jugador: 'bruno' }, { jugador: 'tomas' }, { jugador: 'ana' }), iniciativa)).toEqual(['Bruno', 'Tomás', 'Ana'])
  })

  it('iniciativa: en su hueco, cada uno activa hasta su cupo; sin cupo, lo que le quede', () => {
    const orden = conOrden(conDosMonstruos, { jugador: 'oscuridad', activaciones: 1 }, { jugador: 'ana' }, { jugador: 'bruno' }, { jugador: 'oscuridad' })
    expect(sucesion(orden, iniciativa)).toEqual(['La Oscuridad', 'Ana', 'Bruno', 'La Oscuridad'])
  })

  it('iniciativa: acabado el orden, lo que queda va como alternas', () => {
    expect(sucesion(conOrden(partida, { jugador: 'bruno' }), iniciativa)).toEqual(['Bruno', 'Ana', 'Tomás'])
  })

  it('iniciativa: sin orden del turno en curso, como alternas', () => {
    expect(sucesion({ ...conOrden(partida, { jugador: 'bruno' }), turno: 2 }, iniciativa)).toEqual(['Ana', 'Bruno', 'Tomás'])
  })

  it('alianza a alianza: los PNJ restantes se activan al final', () => {
    expect(sucesion(conDosMonstruos, normales)).toEqual(['Ana', 'Bruno', 'La Oscuridad', 'La Oscuridad'])
  })

  it('en el turno siguiente, las alternas siguen la rotación', () => {
    const config = { ...normales, ordenActivaciones: 'alternas' as const }
    const acabado = ['de-ana', 'de-bruno', 'de-tomas'].reduce((m, id) => terminarActivacion(activar(m, config, id, 'normal'), id), partida)
    expect(jugadorEnTurno(terminarTurno(acabado), config)?.nombre).toBe('Bruno')
  })

  it('mientras una escuadra se activa, le toca a su jugador', () => {
    expect(jugadorEnTurno(conActivacion(partida, 'de-bruno', { modo: 'normal', terminada: false }), normales)?.nombre).toBe('Bruno')
  })

  it('no se activa una escuadra de otro jugador', () => {
    expect(motivoParaNoActivar(partida, normales, 'de-tomas', 'normal')).toBe('Le toca a Ana')
  })
})
