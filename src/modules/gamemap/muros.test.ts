import { describe, expect, it } from 'vitest'
import { medirAtaque, trayectoria } from './ataques'
import { construirEstancia } from './construccion'
import { crearEstancia } from './estancias'
import type { Casilla } from './modelo/casilla'
import type { Estancia } from './modelo/estancia'
import type { Mapa } from './modelo/mapa'
import type { Muro } from './modelo/muro'
import type { Personaje } from './modelo/personaje'
import { casillasDeControl, costeDe, enZonaDeControl, planearMovimiento, ruta, sePuedePasar } from './movimiento'
import { cruce, motivoParaNoAnadirMuro, tramosDe } from './muros'
import { marcarAbierta, puertaEn } from './puertas'
import { estaTrabado } from './zonaDeControl'

/** Muro vertical entre las columnas 1 y 2 de una sala de 4 × 3, con un paso en el tramo de arriba */
const muro: Muro = { id: 'muro', desde: { x: 2, y: 0 }, hasta: { x: 2, y: 3 }, pasos: [0] }
/** La sala con el muro y, en su tramo de abajo, una puerta interior (abierta o no) */
const sala = (abierta = false): Estancia => ({
  ...crearEstancia({ id: 'sala', tipo: 'sala', columnas: 4, filas: 3 }),
  muros: [muro],
  puertas: [{ id: 'puerta', tipo: 'interior', casilla: { x: 1, y: 2 }, lado: 'derecha', abierta }],
})
const mapa = (abierta = false): Mapa => ({ estancias: [sala(abierta)] })
const personaje = (id: string, casilla: Casilla): Personaje => ({ id, nombre: id, estancia: 'sala', casilla, turnos: [] })

describe('tramos de un muro', () => {
  it('vertical: el borde derecho de las casillas de su izquierda, de arriba abajo', () => {
    expect(tramosDe(muro)).toEqual([
      { casilla: { x: 1, y: 0 }, lado: 'derecha' },
      { casilla: { x: 1, y: 1 }, lado: 'derecha' },
      { casilla: { x: 1, y: 2 }, lado: 'derecha' },
    ])
  })

  it('horizontal: el borde de abajo de las casillas de encima', () => {
    expect(tramosDe({ id: 'h', desde: { x: 3, y: 1 }, hasta: { x: 1, y: 1 } })).toEqual([
      { casilla: { x: 1, y: 0 }, lado: 'abajo' },
      { casilla: { x: 2, y: 0 }, lado: 'abajo' },
    ])
  })

  it('en diagonal no es un muro', () => {
    expect(tramosDe({ id: 'd', desde: { x: 0, y: 0 }, hasta: { x: 2, y: 2 } })).toEqual([])
  })
})

describe('muros que valen', () => {
  const medidas = { columnas: 4, filas: 3 }

  it('recto y por dentro, vale', () => {
    expect(motivoParaNoAnadirMuro(medidas, muro, [2])).toBeUndefined()
  })

  it('no por el muro exterior', () => {
    expect(motivoParaNoAnadirMuro(medidas, { desde: { x: 0, y: 0 }, hasta: { x: 0, y: 3 } })).toBe('Un muro de 0,0 a 0,3 tiene que ir por dentro de la estancia')
  })

  it('sus pasos y puertas, en tramos suyos', () => {
    expect(motivoParaNoAnadirMuro(medidas, muro, [3])).toBe('Un muro de 2,0 a 2,3 solo tiene 3 tramos')
  })

  it('al construir la estancia, con id y sus puertas interiores cerradas', () => {
    const e = construirEstancia('sala', { tipo: 'sala', tamano: medidas, orientacion: 'abajo', salidas: 0, elementos: [], muros: [{ desde: { x: 2, y: 0 }, hasta: { x: 2, y: 3 }, puertas: [2] }] })
    expect([e.muros?.map((m) => m.id), e.puertas.filter((p) => p.tipo === 'interior')]).toEqual([
      ['sala-muro-1'],
      [{ id: 'sala-muro-1-puerta-3', tipo: 'interior', casilla: { x: 1, y: 2 }, lado: 'derecha' }],
    ])
  })
})

describe('cruzar un muro interior', () => {
  it('por el muro no se pasa', () => {
    expect([cruce(sala(), { x: 1, y: 1 }, { x: 2, y: 1 }), sePuedePasar(mapa(), { x: 1, y: 1 }, { x: 2, y: 1 })]).toEqual(['muro', false])
  })

  it('por un paso se cruza limpiamente', () => {
    expect(costeDe(mapa(), [{ x: 1, y: 0 }, { x: 2, y: 0 }])).toBe(1)
  })

  it('por una puerta cerrada no se pasa; abierta, limpiamente', () => {
    expect([sePuedePasar(mapa(), { x: 1, y: 2 }, { x: 2, y: 2 }), costeDe(mapa(true), [{ x: 1, y: 2 }, { x: 2, y: 2 }])]).toEqual([false, 1])
  })

  it('en diagonal no se corta la esquina de un muro', () => {
    expect(sePuedePasar(mapa(), { x: 1, y: 1 }, { x: 2, y: 2 }, 'diagonal')).toBe(false)
  })

  it('la ruta lo rodea por el paso', () => {
    expect(ruta(mapa(), { x: 1, y: 1 }, { x: 2, y: 1 })).toEqual([
      { x: 1, y: 1 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 1 },
    ])
  })

  it('o por una puerta abierta', () => {
    // sin el paso, por la puerta del tramo de abajo
    const sinPaso = { estancias: [{ ...sala(true), muros: [{ ...muro, pasos: [] }] }] }
    expect(ruta(sinPaso, { x: 1, y: 1 }, { x: 2, y: 1 })).toEqual([
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 2, y: 1 },
    ])
  })

  it('si el muro aísla una zona sin pasos ni puertas abiertas, no se puede salir', () => {
    const cerrada = { estancias: [{ ...sala(false), muros: [{ ...muro, pasos: [] }] }] }
    expect(ruta(cerrada, { x: 1, y: 1 }, { x: 2, y: 1 })).toBeUndefined()
  })
})

describe('puertas interiores', () => {
  it('se encuentran desde las casillas de los dos lados', () => {
    expect([puertaEn(mapa(), { estancia: 'sala', casilla: { x: 1, y: 2 } })?.id, puertaEn(mapa(), { estancia: 'sala', casilla: { x: 2, y: 2 } })?.id]).toEqual(['puerta', 'puerta'])
  })

  it('se abren desde cualquiera de los dos lados', () => {
    expect(puertaEn(marcarAbierta(mapa(), { estancia: 'sala', casilla: { x: 2, y: 2 } }, 'sala'), { estancia: 'sala', casilla: { x: 1, y: 2 } })?.abierta).toBe(true)
  })
})

describe('cobertura de los muros interiores', () => {
  const coberturas = (m: Mapa, desde: Casilla, hasta: Casilla) => trayectoria(m, personaje('a', desde), personaje('b', hasta))?.coberturas

  it('el muro bloquea los disparos que lo cruzan', () => {
    expect(coberturas(mapa(), { x: 0, y: 1 }, { x: 3, y: 1 })).toMatchObject({ bloqueante: 1, ligera: 0 })
  })

  it('por un paso, el muro da la cobertura de sus pasos', () => {
    expect(coberturas(mapa(), { x: 0, y: 0 }, { x: 3, y: 0 })).toMatchObject({ ligera: 1 })
  })

  it('una puerta cerrada bloquea; abierta, da cobertura ligera', () => {
    expect([coberturas(mapa(), { x: 0, y: 2 }, { x: 3, y: 2 })?.bloqueante, coberturas(mapa(true), { x: 0, y: 2 }, { x: 3, y: 2 })?.ligera]).toEqual([1, 1])
  })

  it('un disparo que no lo cruza no tiene cobertura', () => {
    expect(coberturas(mapa(), { x: 2, y: 0 }, { x: 3, y: 2 })).toMatchObject({ ligera: 0, bloqueante: 0 })
  })

  it('por una esquina del muro, entre el paso y el muro, la menor de las dos', () => {
    expect(coberturas(mapa(), { x: 1, y: 0 }, { x: 2, y: 1 })).toMatchObject({ ligera: 1 })
  })
})

describe('cuerpo a cuerpo y muros interiores', () => {
  const tipo = (m: Mapa, desde: Casilla, hasta: Casilla) =>
    medirAtaque(m, { medicionMovimiento: 'ortogonal', terrenoPersonajes: 'normal', cuerpoACuerpo: 'ortogonal' }, personaje('a', desde), personaje('b', hasta))?.tipo

  it('a través del muro no hay cuerpo a cuerpo', () => {
    expect(tipo(mapa(), { x: 1, y: 1 }, { x: 2, y: 1 })).toBe('distancia')
  })

  it('por un paso, sí', () => {
    expect(tipo(mapa(), { x: 1, y: 0 }, { x: 2, y: 0 })).toBe('cuerpo-a-cuerpo')
  })
})

describe('zona de control y muros interiores', () => {
  const ordenadas = (cs: Casilla[]) => cs.map(({ x, y }) => `${x},${y}`).sort()

  it('sin muros, las casillas de alrededor', () => {
    expect(ordenadas(casillasDeControl({ estancias: [crearEstancia({ id: 'sala', tipo: 'sala', columnas: 4, filas: 3 })] }, { x: 1, y: 1 }, 1))).toEqual(
      ['0,0', '0,1', '0,2', '1,0', '1,1', '1,2', '2,0', '2,1', '2,2'],
    )
  })

  it('no atraviesa el muro: el orco en 2,1 no controla las casillas de la izquierda', () => {
    expect(ordenadas(casillasDeControl(mapa(), { x: 2, y: 1 }, 1))).toEqual(['2,0', '2,1', '2,2', '3,0', '3,1', '3,2'])
  })

  it('pasa por un paso, contando los pasos que da', () => {
    // a dos pasos: 2,0 y, por el paso de arriba, 1,0
    expect(enZonaDeControl(mapa(), [{ x: 2, y: 1 }], 2)({ x: 1, y: 0 })).toBe(true)
  })

  it('no pasa por una puerta cerrada; abierta, sí', () => {
    expect([enZonaDeControl(mapa(), [{ x: 2, y: 2 }], 1)({ x: 1, y: 2 }), enZonaDeControl(mapa(true), [{ x: 2, y: 2 }], 1)({ x: 1, y: 2 })]).toEqual([false, true])
  })

  it('al otro lado del muro de un enemigo no se está trabado', () => {
    const conOrco: Mapa = {
      ...mapa(),
      escuadras: [{ id: 'rojos', nombre: 'Rojos', jugador: 'ana', personajes: [{ id: 'barbaro', nombre: 'Bárbaro', estancia: 'sala', casilla: { x: 1, y: 1 }, turnos: [] }], turnos: [] }],
      personajesNoJugadores: [{ id: 'orco', nombre: 'Orco', estancia: 'sala', casilla: { x: 2, y: 1 }, turnos: [], jugador: 'oscuridad' }],
      jugadores: {
        alianzas: [{ id: 'heroes', nombre: 'Héroes' }, { id: 'monstruos', nombre: 'Monstruos', posturas: { heroes: 'hostil' } }],
        jugadores: [
          { id: 'ana', nombre: 'Ana', tipo: 'humano', alianza: 'heroes' },
          { id: 'oscuridad', nombre: 'La Oscuridad', tipo: 'ia', alianza: 'monstruos' },
        ],
      },
    }
    expect(estaTrabado(conOrco, 1, conOrco.escuadras?.[0].personajes[0] ?? personaje('x', { x: 0, y: 0 }))).toBe(false)
  })
})

describe('formas de moverse que cruzan muros interiores', () => {
  const porEncima = { cruzaMuros: true }
  /** La sala sin el paso: el muro solo se cruza por la puerta (cerrada) */
  const sinPaso = (): Mapa => ({ estancias: [{ ...sala(), muros: [{ ...muro, pasos: [] }] }] })

  it('cruzan el muro por encima, en recto', () => {
    expect(ruta(sinPaso(), { x: 1, y: 1 }, { x: 2, y: 1 }, 'ortogonal', porEncima)).toEqual([
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ])
  })

  it('no cruzan una puerta interior cerrada', () => {
    expect(sePuedePasar(sinPaso(), { x: 1, y: 2 }, { x: 2, y: 2 }, 'ortogonal', porEncima)).toBe(false)
  })

  it('no cruzan el muro de la estancia', () => {
    const dos: Mapa = { estancias: [crearEstancia({ id: 'a', tipo: 'sala', columnas: 2, filas: 1 }), { ...crearEstancia({ id: 'b', tipo: 'sala', columnas: 2, filas: 1 }), posicion: { x: 2, y: 0 } }] }
    expect(sePuedePasar(dos, { x: 1, y: 0 }, { x: 2, y: 0 }, 'ortogonal', porEncima)).toBe(false)
  })

  it('la zona de control sigue sin atravesar el muro', () => {
    expect(enZonaDeControl(sinPaso(), [{ x: 2, y: 1 }], 1)({ x: 1, y: 1 })).toBe(false)
  })

  it('el planificador vuela por encima del muro si no hay otro camino', () => {
    const barbaro = personaje('barbaro', { x: 1, y: 1 })
    const m = { ...sinPaso(), escuadras: [{ id: 'rojos', nombre: 'Rojos', jugador: 'ana', personajes: [barbaro], turnos: [] }] }
    const accion = { id: 'mover', nombre: 'Mover', icono: '🥾' }
    const opciones = {
      base: { id: 'mover', nombre: 'Mover', tipo: 'normal' as const, accion, tramos: [{ distancia: 6 }] },
      variaciones: [{ id: 'volar', nombre: 'Volar', tipo: 'normal' as const, accion, tramos: [{ distancia: 4 }], cruzaMuros: true }],
    }
    const plan = planearMovimiento(m, { medicionMovimiento: 'ortogonal', terrenoPersonajes: 'normal', distanciaControl: 0, cuerpoACuerpo: 'ortogonal' }, barbaro, { x: 2, y: 1 }, opciones)
    expect('opcion' in plan && plan.opcion.id).toBe('volar')
  })
})

