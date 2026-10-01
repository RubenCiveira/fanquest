import { describe, expect, it } from 'vitest'
import { conPersonajeEn, motivoParaNoRecorrer, planearDesplazamiento } from './desplazamientos'
import { crearEstancia } from './estancias'
import type { Casilla } from './modelo/casilla'
import type { Desplazamiento } from './modelo/desplazamiento'
import type { Mapa } from './modelo/mapa'
import type { Personaje } from './modelo/personaje'
import type { Terreno } from './modelo/terreno'
import { alcanzables, type ReglasDeMovimiento } from './movimiento'

const barbaro: Personaje = { id: 'barbaro', nombre: 'Bárbaro', estancia: 'pasillo', casilla: { x: 3, y: 0 }, turnos: [] }
const elfo: Personaje = { ...barbaro, id: 'elfo', nombre: 'Elfo' }
/** Pasillo de 8 × 1 con el bárbaro de Ana (Héroes) en 3,0, el orco de la Oscuridad (hostil) en 6,0 y, si se pide, el elfo de Ana y terreno */
const pasillo = ({ conElfo, terrenos = [] }: { conElfo?: Casilla; terrenos?: Terreno[] } = {}): Mapa => ({
  estancias: [{ ...crearEstancia({ id: 'pasillo', tipo: 'pasillo', columnas: 8, filas: 1 }), terrenos }],
  escuadras: [{ id: 'rojos', nombre: 'Rojos', jugador: 'ana', personajes: [barbaro, ...(conElfo ? [{ ...elfo, casilla: conElfo }] : [])], turnos: [] }],
  personajesNoJugadores: [{ id: 'orco', nombre: 'Orco', estancia: 'pasillo', casilla: { x: 6, y: 0 }, turnos: [], jugador: 'oscuridad' }],
  jugadores: {
    alianzas: [
      { id: 'heroes', nombre: 'Héroes', posturas: { monstruos: 'hostil' } },
      { id: 'monstruos', nombre: 'Monstruos', posturas: { heroes: 'hostil' } },
    ],
    jugadores: [
      { id: 'ana', nombre: 'Ana', tipo: 'humano', alianza: 'heroes' },
      { id: 'oscuridad', nombre: 'La Oscuridad', tipo: 'ia', alianza: 'monstruos' },
    ],
  },
})
const reglas: ReglasDeMovimiento = { medicionMovimiento: 'ortogonal', terrenoPersonajes: 'normal', distanciaControl: 1, cuerpoACuerpo: 'diagonal' }
const delOrco = { personaje: 'orco' }
/** Dónde termina el bárbaro y si llega, o el motivo */
const plan = (d: Desplazamiento, m = pasillo()) => {
  const planeado = planearDesplazamiento(m, reglas, barbaro, d)
  return 'motivo' in planeado ? planeado : { destino: planeado.recorrido.at(-1), llega: planeado.llega }
}
const barro: Terreno = { tipo: 'dificil', posicion: { x: 2, y: 0 }, columnas: 1, filas: 1 }

describe('casillas alcanzables', () => {
  it('cada una con su coste, de la más barata a la más cara, con la de salida', () => {
    expect(alcanzables(pasillo(), { x: 3, y: 0 }, 1).map(({ recorrido, coste }) => [recorrido.at(-1), coste])).toEqual([
      [{ x: 3, y: 0 }, 0],
      [{ x: 4, y: 0 }, 1],
      [{ x: 2, y: 0 }, 1],
    ])
  })

  it('cada una con su camino desde la de salida', () => {
    expect(alcanzables(pasillo(), { x: 3, y: 0 }, 2).at(-1)?.recorrido).toEqual([
      { x: 3, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 0 },
    ])
  })

  it('el terreno difícil cuesta el doble', () => {
    expect(alcanzables(pasillo({ terrenos: [barro] }), { x: 3, y: 0 }, 2).map(({ recorrido }) => recorrido.at(-1)?.x)).toEqual([3, 4, 2, 5])
  })
})

describe('planear un desplazamiento', () => {
  it('lejos, apura las casillas', () => {
    expect(plan({ sentido: 'lejos', de: delOrco, casillas: 2 })).toEqual({ destino: { x: 1, y: 0 }, llega: true })
  })

  it('lejos, se para al quedar a `hasta` de la referencia', () => {
    expect(plan({ sentido: 'lejos', de: delOrco, casillas: 3, hasta: 4 })).toEqual({ destino: { x: 2, y: 0 }, llega: true })
  })

  it('sin casillas para llegar a `hasta`, va lo más lejos que puede y no llega', () => {
    expect(plan({ sentido: 'lejos', de: delOrco, casillas: 1, hasta: 6 })).toEqual({ destino: { x: 2, y: 0 }, llega: false })
  })

  it('hacia, hasta el contacto', () => {
    expect(plan({ sentido: 'hacia', de: delOrco, casillas: 5, hasta: 1 })).toEqual({ destino: { x: 5, y: 0 }, llega: true })
  })

  it('hacia, sin `hasta`, lo más cerca que puede sin pisar al enemigo', () => {
    expect(plan({ sentido: 'hacia', de: delOrco, casillas: 5 })).toEqual({ destino: { x: 5, y: 0 }, llega: true })
  })

  it('el enemigo más cercano también es una referencia', () => {
    expect(plan({ sentido: 'hacia', de: { enemigos: true }, casillas: 5 })).toMatchObject({ destino: { x: 5, y: 0 } })
  })

  it('hacia una ubicación del mapa', () => {
    expect(plan({ sentido: 'hacia', de: { ubicacion: { estancia: 'pasillo', casilla: { x: 0, y: 0 } } }, casillas: 9 })).toMatchObject({ destino: { x: 0, y: 0 } })
  })

  it('respetando la zona de control, no entra en ella', () => {
    expect(plan({ sentido: 'hacia', de: delOrco, casillas: 5, hasta: 1, zonaDeControl: 'respetar' })).toEqual({ destino: { x: 4, y: 0 }, llega: false })
  })

  it('no termina encima de otro personaje', () => {
    expect(plan({ sentido: 'lejos', de: delOrco, casillas: 2 }, pasillo({ conElfo: { x: 1, y: 0 } }))).toMatchObject({ destino: { x: 2, y: 0 } })
  })

  it('el terreno cuesta lo suyo', () => {
    expect(plan({ sentido: 'lejos', de: delOrco, casillas: 2 }, pasillo({ terrenos: [barro] }))).toMatchObject({ destino: { x: 2, y: 0 } })
  })

  it('con su forma de moverse, el terreno le cuesta lo que diga', () => {
    expect(plan({ sentido: 'lejos', de: delOrco, casillas: 2, forma: { terreno: { dificil: 1 } } }, pasillo({ terrenos: [barro] }))).toMatchObject({ destino: { x: 1, y: 0 } })
  })

  it('sin nada colocado de referencia, el motivo', () => {
    expect(plan({ sentido: 'lejos', de: { personaje: 'nadie' }, casillas: 2 })).toEqual({ motivo: 'No hay nada colocado de lo que desplazar a Bárbaro' })
  })
})

describe('desplazar por un recorrido', () => {
  const por = (recorrido: Casilla[], m = pasillo()) => motivoParaNoRecorrer(m, reglas, barbaro, { recorrido })
  const enLinea = (...xs: number[]) => xs.map((x) => ({ x, y: 0 }))

  it('un recorrido que vale, sin motivo', () => {
    expect(por(enLinea(3, 2, 1))).toBeUndefined()
  })

  it('tiene que empezar en el personaje', () => {
    expect(por(enLinea(2, 1))).toBe('El recorrido tiene que empezar en Bárbaro')
  })

  it('no pasa por encima de un enemigo', () => {
    expect(por(enLinea(3, 4, 5, 6, 7))).toBe('El recorrido pasa por donde no se puede')
  })

  it('no termina encima de otro personaje', () => {
    expect(por(enLinea(3, 2), pasillo({ conElfo: { x: 2, y: 0 } }))).toBe('Bárbaro no puede terminar encima de otro personaje')
  })
})

describe('llevar a un personaje a una casilla', () => {
  it('cambia su casilla', () => {
    expect(conPersonajeEn(pasillo(), 'orco', { x: 7, y: 0 }).personajesNoJugadores?.[0].casilla).toEqual({ x: 7, y: 0 })
  })

  it('no apunta nada en su turno', () => {
    expect(conPersonajeEn(pasillo(), 'barbaro', { x: 0, y: 0 }).escuadras?.[0].personajes[0].turnos).toEqual([])
  })
})
