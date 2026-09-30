import { describe, expect, it, vi } from 'vitest'
import { activacionDe, numeroDeTurno, turnoDeEscuadra, turnoDePersonaje } from '../activaciones'
import type { Accion } from '../modelo/accion'
import type { AccionEjecutada } from '../modelo/accionEjecutada'
import type { Casilla } from '../modelo/casilla'
import type { ClaseDeEscuadra } from '../modelo/claseDeEscuadra'
import type { DescripcionEstancia } from '../modelo/descripcionEstancia'
import type { Direccion } from '../modelo/direccion'
import type { Estancia } from '../modelo/estancia'
import type { Personaje } from '../modelo/personaje'
import type { Jugador } from '../modelo/jugador'
import type { Mapa } from '../modelo/mapa'
import type { MapaEnJuego } from '../modelo/mapaEnJuego'
import type { MovimientoGastado } from '../modelo/movimientoGastado'
import type { OpcionesMovimiento } from '../modelo/opcionesMovimiento'
import { gastadoPor } from '../movimiento'
import { GestorMapa } from './GestorMapa'
import type { Jugadores } from '../modelo/jugadores'

/** Reparto de prueba: Ana (rojos y azules) de los Héroes y la Oscuridad (IA) de los Monstruos, hostiles hacia los Héroes */
const REPARTO: Jugadores = {
  alianzas: [
    { id: 'heroes', nombre: 'Héroes' },
    { id: 'monstruos', nombre: 'Monstruos', posturas: { heroes: 'hostil' } },
  ],
  jugadores: [
    { id: 'j1', nombre: 'Ana', tipo: 'humano', alianza: 'heroes' },
    { id: 'oscuridad', nombre: 'La Oscuridad', tipo: 'ia', alianza: 'monstruos' },
  ],
}

const sala: DescripcionEstancia = {
  tipo: 'sala',
  tamano: { columnas: 4, filas: 3 },
  orientacion: 'abajo',
  salidas: 1,
  elementos: [{ tipo: 'objeto', nombre: 'Cofre', columnas: 1, filas: 1 }],
}
/** Sala amplia y vacía para moverse */
const amplia: DescripcionEstancia = { ...sala, tamano: { columnas: 12, filas: 8 }, elementos: [] }

const mover = { id: 'mover', nombre: 'Mover', icono: '🥾' }
const deslizar = { id: 'deslizar', nombre: 'Deslizar', icono: '💨' }
const opciones: OpcionesMovimiento = {
  base: { id: 'mover', nombre: 'Mover', tipo: 'normal', accion: mover, tramos: [{ distancia: 2 }] },
  variaciones: [{ id: 'mover-y-deslizar', nombre: 'Mover y deslizar', tipo: 'normal', accion: mover, tramos: [{ distancia: 2 }, { distancia: 1, accion: deslizar }] }],
}

/** Comando del bárbaro, con su código */
const gritar = { id: 'gritar', nombre: 'Gritar', icono: '📣', exec: vi.fn(async () => {}) }

/**
 * Proveedor de prueba: los rojos (el bárbaro, que puede gritar) empiezan
 * agresivos y los azules (el enano, sin acciones) sigilosos
 */
function proveedor(descripcion = sala, conElfo = false) {
  const acciones = vi.fn(async (_personaje: Personaje, _mapa: MapaEnJuego): Promise<Accion[]> => [gritar])
  const opcionesMovimiento = vi.fn(async (_personaje: Personaje, _gastado: MovimientoGastado) => opciones)
  const activar = vi.fn(async (_acciones: AccionEjecutada[]) => ({ completo: false }))
  const barbaro = { id: 'barbaro', nombre: 'Bárbaro', imagenVtt: 'barbaro.png', opcionesMovimiento, acciones }
  const elfo = { id: 'elfo', nombre: 'Elfo', opcionesMovimiento, acciones: async () => [] }
  const enano = { id: 'enano', nombre: 'Enano', opcionesMovimiento, acciones: async () => [] }
  return {
    configuracion: { ordenActivaciones: 'alternas', modosActivacion: 'agresivo-sigiloso', medicionMovimiento: 'ortogonal', terrenoPersonajes: 'normal', jugadores: REPARTO } as const,
    confirmar: vi.fn(async (_mensaje: string) => true),
    describirEstancia: vi.fn(async (_mapa?: Mapa, _entrada?: Direccion) => descripcion),
    estanciaCreada: vi.fn((_estancia: Estancia, _mapa: MapaEnJuego) => {}),
    turnoDe: vi.fn((_jugador: Jugador, _mapa: MapaEnJuego) => {}),
    finDeTurno: vi.fn((_mapa: MapaEnJuego) => {}),
    listarEscuadras: vi.fn(async (): Promise<ClaseDeEscuadra[]> => [
      { id: 'rojos', nombre: 'Rojos', jugador: 'j1', personajes: async () => (conElfo ? [barbaro, elfo] : [barbaro]), modoActivacion: async () => 'agresivo', activar },
      { id: 'azules', nombre: 'Azules', jugador: 'j1', personajes: async () => [enano], modoActivacion: async () => 'sigiloso', activar },
    ]),
    acciones,
    opcionesMovimiento,
    activar,
  }
}

/** Gestor con la estancia inicial creada, el proveedor y el estado del bárbaro */
async function conInicial(descripcion = sala, conElfo = false) {
  const p = proveedor(descripcion, conElfo)
  const gestor = new GestorMapa(p)
  await gestor.nuevaEstancia()
  const barbaro = () => gestor.mapa.escuadras?.[0].personajes[0] ?? { id: '', nombre: '', estancia: '', turnos: [] }
  const elfo = () => gestor.mapa.escuadras?.[0].personajes[1] ?? { id: '', nombre: '', estancia: '', turnos: [] }
  return { gestor, p, barbaro, elfo }
}

/** Recorrido de `pasos` casillas hacia la derecha desde una casilla */
const enLinea = (desde: Casilla | undefined, pasos: number) =>
  Array.from({ length: pasos + 1 }, (_, i) => ({ x: (desde?.x ?? 0) + i, y: desde?.y ?? 0 }))

describe('gestor del mapa: estancias y escuadras', () => {
  it('en la primera estancia, el proveedor no recibe mapa', async () => {
    const { p } = await conInicial()
    expect(p.describirEstancia.mock.lastCall?.[0]).toBeUndefined()
  })

  it('en las siguientes, el proveedor recibe el mapa ya construido', async () => {
    const { gestor, p } = await conInicial()
    const construido = gestor.mapa
    await gestor.nuevaEstancia()
    expect(p.describirEstancia.mock.lastCall?.[0]).toBe(construido)
  })

  it('añade cada estancia nueva al mapa con un id propio', async () => {
    const { gestor } = await conInicial()
    await gestor.nuevaEstancia()
    expect(gestor.mapa.estancias.map((e) => e.id)).toEqual(['estancia-1', 'estancia-2'])
  })

  it('si el proveedor rechaza, el mapa no cambia', async () => {
    const gestor = new GestorMapa({ ...proveedor(), describirEstancia: () => Promise.reject(new Error('cancelada')) })
    await expect(gestor.nuevaEstancia()).rejects.toThrow('cancelada')
    expect(gestor.mapa.estancias).toEqual([])
  })

  it('avisa de cada cambio a quien se suscribe', async () => {
    const gestor = new GestorMapa(proveedor())
    const aviso = vi.fn()
    gestor.suscribir(aviso)
    await gestor.nuevaEstancia()
    expect(aviso).toHaveBeenCalledWith(gestor.mapa)
  })

  it('la estancia inicial crea el estado de cada escuadra con sus personajes, en el turno 1', async () => {
    const { gestor } = await conInicial()
    expect([numeroDeTurno(gestor.mapa), gestor.mapa.escuadras?.map((e) => [e.id, e.personajes.map((h) => h.id), e.turnos])]).toEqual([
      1,
      [
        ['rojos', ['barbaro'], []],
        ['azules', ['enano'], []],
      ],
    ])
  })

  it('cada personaje queda en la estancia inicial, en una casilla libre y con su imagen', async () => {
    const { barbaro } = await conInicial()
    expect(barbaro()).toMatchObject({ nombre: 'Bárbaro', imagenVtt: 'barbaro.png', estancia: 'estancia-1', casilla: expect.any(Object), turnos: [] })
  })

  it('los personajes no se colocan encima de objetos ni de otros personajes', async () => {
    const { gestor } = await conInicial()
    const casillas = [...gestor.mapa.estancias[0].elementos.map((el) => el.posicion), ...(gestor.mapa.escuadras?.flatMap((e) => e.personajes.map((h) => h.casilla)) ?? [])]
    expect(new Set(casillas.map((c) => `${c?.x},${c?.y}`)).size).toBe(3)
  })

  it('con modo agresivo o sigiloso, cada escuadra empieza en el modo que dice su clase', async () => {
    const { gestor } = await conInicial()
    expect(gestor.mapa.escuadras?.map((e) => e.modo)).toEqual(['agresivo', 'sigiloso'])
  })

  it('sin modo agresivo o sigiloso, las escuadras no tienen modo de partida', async () => {
    const gestor = new GestorMapa({ ...proveedor(), configuracion: { ordenActivaciones: 'alternas', modosActivacion: 'normal', medicionMovimiento: 'ortogonal', terrenoPersonajes: 'normal', jugadores: REPARTO } })
    await gestor.nuevaEstancia()
    expect(gestor.mapa.escuadras?.map((e) => e.modo)).toEqual([undefined, undefined])
  })

  it('las estancias siguientes no vuelven a crear escuadras', async () => {
    const { gestor, p } = await conInicial()
    await gestor.nuevaEstancia()
    expect([p.listarEscuadras.mock.calls.length, gestor.mapa.escuadras?.length]).toEqual([1, 2])
  })

  it('avisa al proveedor de cada estancia creada, ya en su sitio', async () => {
    const { gestor, p } = await conInicial()
    expect(p.estanciaCreada.mock.lastCall).toEqual([gestor.mapa.estancias[0], gestor])
  })

  it('la estancia inicial va en la esquina del mapa y la siguiente sin puerta, aparte a su derecha', async () => {
    const { gestor } = await conInicial()
    await gestor.nuevaEstancia()
    expect(gestor.mapa.estancias.map((e) => e.posicion)).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 0 },
    ])
  })
})

describe('gestor del mapa: activaciones y acciones', () => {
  it('guarda la activación en el turno de la escuadra', async () => {
    const { gestor } = await conInicial()
    gestor.activarEscuadra('rojos', 'agresivo')
    expect(activacionDe(gestor.mapa, 'rojos')).toEqual({ modo: 'agresivo', terminada: false })
  })

  it('si la escuadra no puede activarse, dice por qué', async () => {
    const { gestor } = await conInicial()
    expect(gestor.activarEscuadra('rojos', 'normal')).toBe('El modo normal no está permitido: agresivo o sigiloso')
  })

  it('termina el turno cuando todas las escuadras han completado su activación', async () => {
    const { gestor } = await conInicial()
    for (const id of ['rojos', 'azules']) {
      gestor.activarEscuadra(id, 'agresivo')
      gestor.terminarActivacion(id)
    }
    gestor.terminarTurno()
    expect(numeroDeTurno(gestor.mapa)).toBe(2)
  })

  it('sin activaciones completas, no termina el turno', async () => {
    const { gestor } = await conInicial()
    expect(gestor.terminarTurno()).toBe('Falta terminar la activación de Rojos, Azules')
  })

  it('al pulsar un personaje, sus acciones van delante de las del gestor', async () => {
    const { gestor } = await conInicial()
    expect((await gestor.accionesDisponibles('rojos', 'barbaro')).map((a) => a.id)).toEqual(['gritar', 'buscar-trampas', 'cambiar-modo', 'terminar-turno'])
  })

  it('las acciones se piden a la clase del personaje, con su estado y el mapa', async () => {
    const { gestor, p, barbaro } = await conInicial()
    await gestor.accionesDisponibles('rojos', 'barbaro')
    expect(p.acciones.mock.lastCall).toEqual([barbaro(), gestor])
  })

  it('sin un personaje pulsado solo están las del gestor', async () => {
    const { gestor } = await conInicial()
    expect((await gestor.accionesDisponibles('rojos')).map((a) => a.id)).toEqual(['cambiar-modo', 'terminar-turno'])
  })

  it('buscar trampas marca la estancia y deja de estar disponible', async () => {
    const { gestor } = await conInicial()
    await gestor.ejecutarAccion('rojos', 'buscar-trampas', 'barbaro')
    expect([gestor.tieneFlag('estancia-1', 'sin_trampas'), (await gestor.accionesDisponibles('rojos', 'barbaro')).map((a) => a.id)]).toEqual([
      true,
      ['gritar', 'cambiar-modo', 'terminar-turno'],
    ])
  })

  it('permite marcar y consultar flags de estancias', async () => {
    const { gestor } = await conInicial()
    gestor.marcarFlag('estancia-1', 'sin_trampas')
    expect(gestor.tieneFlag('estancia-1', 'sin_trampas')).toBe(true)
  })

  it('un comando del personaje se ejecuta con su propio código', async () => {
    const { gestor } = await conInicial()
    gritar.exec.mockClear()
    await gestor.ejecutarAccion('rojos', 'gritar', 'barbaro')
    expect(gritar.exec).toHaveBeenCalledOnce()
  })

  it('la acción del personaje queda en su turno y en el de su escuadra, que lo tiene como activo', async () => {
    const { gestor, barbaro } = await conInicial()
    await gestor.ejecutarAccion('rojos', 'gritar', 'barbaro')
    const rojos = gestor.mapa.escuadras?.[0]
    expect([turnoDePersonaje(barbaro(), 1).acciones, rojos && turnoDeEscuadra(rojos, 1).acciones, rojos?.activo]).toEqual([
      ['gritar'],
      [{ accion: 'gritar', personaje: 'barbaro' }],
      'barbaro',
    ])
  })

  it('si el comando falla, no se apunta', async () => {
    const { gestor } = await conInicial()
    gritar.exec.mockRejectedValueOnce(new Error('cancelada'))
    await expect(gestor.ejecutarAccion('rojos', 'gritar', 'barbaro')).rejects.toThrow('cancelada')
    expect(gestor.mapa.escuadras?.[0].turnos).toEqual([])
  })

  it('una acción que no está disponible no se ejecuta', async () => {
    const { gestor } = await conInicial()
    expect(await gestor.ejecutarAccion('azules', 'gritar', 'enano')).toBe('«gritar» no es una acción disponible ahora')
  })

  it('tras cada acción, pasa a la clase de la escuadra las que lleva en el turno', async () => {
    const { gestor, p } = await conInicial()
    await gestor.ejecutarAccion('rojos', 'gritar', 'barbaro')
    expect(p.activar).toHaveBeenLastCalledWith([{ accion: 'gritar', personaje: 'barbaro' }])
  })

  it('si la escuadra dice que su activación está completa, termina su turno', async () => {
    const { gestor, p } = await conInicial()
    p.activar.mockResolvedValueOnce({ completo: true })
    await gestor.ejecutarAccion('rojos', 'gritar', 'barbaro')
    expect(activacionDe(gestor.mapa, 'rojos')?.terminada).toBe(true)
  })

  it('tras terminar turno, la escuadra no tiene acciones', async () => {
    const { gestor } = await conInicial()
    await gestor.ejecutarAccion('rojos', 'terminar-turno')
    expect(await gestor.accionesDisponibles('rojos', 'barbaro')).toEqual([])
  })

  it('pide las clases de las escuadras al proveedor una sola vez', async () => {
    const { gestor, p } = await conInicial()
    await gestor.accionesDisponibles('rojos', 'barbaro')
    await gestor.accionesDisponibles('azules', 'enano')
    expect(p.listarEscuadras).toHaveBeenCalledTimes(1)
  })
})

describe('gestor del mapa: movimiento', () => {
  it('pregunta a la clase del personaje cómo puede moverse, con su estado y sin nada gastado', async () => {
    const { gestor, p, barbaro } = await conInicial(amplia)
    expect([await gestor.opcionesMovimiento('barbaro'), p.opcionesMovimiento.mock.lastCall]).toEqual([opciones, [barbaro(), { casillas: 0, acciones: [] }]])
  })

  it('dentro del movimiento base, mueve sin preguntar y lo apunta en el turno del personaje', async () => {
    const { gestor, p, barbaro } = await conInicial(amplia)
    const desde = barbaro().casilla
    await gestor.moverPersonaje('barbaro', enLinea(desde, 2))
    expect([p.confirmar.mock.calls.length, barbaro().casilla, turnoDePersonaje(barbaro(), 1).movimientos]).toEqual([
      0,
      { x: (desde?.x ?? 0) + 2, y: desde?.y },
      [{ opcion: 'mover', casillas: 2, acciones: ['mover'] }],
    ])
  })

  it('las acciones que consume moverse van al turno de la escuadra, no a las acciones del personaje', async () => {
    const { gestor, barbaro } = await conInicial(amplia)
    await gestor.moverPersonaje('barbaro', enLinea(barbaro().casilla, 2))
    const rojos = gestor.mapa.escuadras?.[0]
    expect([rojos && turnoDeEscuadra(rojos, 1).acciones, turnoDePersonaje(barbaro(), 1).acciones]).toEqual([[{ accion: 'mover', personaje: 'barbaro' }], []])
  })

  it('deja mover a varios personajes de la escuadra en la misma activación', async () => {
    const { gestor, barbaro, elfo } = await conInicial(amplia, true)
    await gestor.moverPersonaje('barbaro', enLinea(barbaro().casilla, 1))
    await gestor.moverPersonaje('elfo', enLinea(elfo().casilla, 1))
    expect(turnoDeEscuadra(gestor.mapa.escuadras?.[0] ?? { id: '', nombre: '', jugador: '', personajes: [], turnos: [] }, 1).acciones).toEqual([
      { accion: 'mover', personaje: 'barbaro' },
      { accion: 'mover', personaje: 'elfo' },
    ])
  })

  it('para deslizar, pide confirmación y, confirmado, apunta también deslizar', async () => {
    const { gestor, p, barbaro } = await conInicial(amplia)
    await gestor.moverPersonaje('barbaro', enLinea(barbaro().casilla, 3))
    expect([p.confirmar.mock.lastCall?.[0], turnoDePersonaje(barbaro(), 1).movimientos[0].acciones]).toEqual(['Confirme que queremos deslizar', ['mover', 'deslizar']])
  })

  it('sin confirmar, no hace nada', async () => {
    const { gestor, p, barbaro } = await conInicial(amplia)
    p.confirmar.mockResolvedValueOnce(false)
    const antes = gestor.mapa
    expect([await gestor.moverPersonaje('barbaro', enLinea(barbaro().casilla, 3)), gestor.mapa]).toEqual([undefined, antes])
  })

  it('si el recorrido no vale, dice por qué y el personaje no se mueve', async () => {
    const { gestor, barbaro } = await conInicial(amplia)
    const antes = gestor.mapa
    expect([await gestor.moverPersonaje('barbaro', enLinea(barbaro().casilla, 4)), gestor.mapa]).toEqual(['Demasiado lejos: 4 casillas y como mucho 3', antes])
  })

  it('si ya se ha movido, se le pregunta de nuevo diciendo lo que ha gastado', async () => {
    const { gestor, p, barbaro } = await conInicial(amplia)
    await gestor.moverPersonaje('barbaro', enLinea(barbaro().casilla, 2))
    await gestor.opcionesMovimiento('barbaro')
    expect(p.opcionesMovimiento.mock.lastCall?.[1]).toEqual({ casillas: 2, acciones: ['mover'] })
  })

  it('un personaje cuya escuadra ya terminó su turno no puede moverse', async () => {
    const { gestor } = await conInicial(amplia)
    await gestor.ejecutarAccion('rojos', 'terminar-turno')
    expect(await gestor.opcionesMovimiento('barbaro')).toBeUndefined()
  })

  it('un personaje del mapa no se coloca a mano: se mueve arrastrándolo', async () => {
    const { gestor } = await conInicial(amplia)
    expect(gestor.colocarPersonaje('barbaro', { x: 0, y: 0 })).toBe('Bárbaro se mueve arrastrando su ficha')
  })

  it('un personaje de la zona de espera se coloca a mano en una casilla libre', async () => {
    const gestor = new GestorMapa(proveedor(), {
      estancias: [{ id: 'sala', tipo: 'sala', columnas: 3, filas: 3, puertas: [], elementos: [], estancias: [] }],
      escuadras: [{ id: 'rojos', nombre: 'Rojos', jugador: 'j1', personajes: [{ id: 'barbaro', nombre: 'Bárbaro', estancia: 'sala', turnos: [] }], turnos: [] }],
    })
    gestor.colocarPersonaje('barbaro', { x: 1, y: 1 })
    expect(gestor.mapa.escuadras?.[0].personajes[0].casilla).toEqual({ x: 1, y: 1 })
  })
})

describe('gestor del mapa: enemigos', () => {
  const orco = { id: 'orco', nombre: 'Orco', jugador: 'oscuridad' } as const

  it('los personajes no jugadores de la descripción aparecen en la estancia nueva', async () => {
    const { gestor } = await conInicial({ ...amplia, personajesNoJugadores: [{ ...orco, casilla: { x: 11, y: 7 } }] })
    expect(gestor.mapa.personajesNoJugadores).toEqual([{ id: 'orco', nombre: 'Orco', estancia: 'estancia-1', casilla: { x: 11, y: 7 }, turnos: [], jugador: 'oscuridad' }])
  })

  it('se añaden a una estancia del mapa y avisa del cambio', async () => {
    const { gestor } = await conInicial(amplia)
    const aviso = vi.fn()
    gestor.suscribir(aviso)
    gestor.anadirPersonajes('estancia-1', [{ ...orco, casilla: { x: 0, y: 0 } }])
    expect(aviso.mock.lastCall?.[0].personajesNoJugadores).toHaveLength(1)
  })

  it('al azar, con el azar que se le da al gestor', async () => {
    const gestor = new GestorMapa(proveedor(amplia), undefined, () => 0)
    await gestor.nuevaEstancia()
    expect(gestor.anadirPersonajes('estancia-1', [orco])[0].casilla).toEqual({ x: 0, y: 0 })
  })

  it('no se puede mover a través de un enemigo', async () => {
    const { gestor, barbaro } = await conInicial(amplia)
    const desde = barbaro().casilla ?? { x: 0, y: 0 }
    const hacia = (dx: number) => ({ x: desde.x + dx, y: desde.y })
    const [colocado] = gestor.anadirPersonajes('estancia-1', [{ ...orco, casilla: hacia(-1) }])
    expect([colocado.casilla, await gestor.moverPersonaje('barbaro', [desde, hacia(-1), hacia(-2)])]).toEqual([hacia(-1), 'El recorrido pasa por donde no se puede'])
  })
})

describe('gestor del mapa: muebles', () => {
  it('añade muebles a una estancia del mapa y avisa del cambio', async () => {
    const { gestor } = await conInicial(amplia)
    const aviso = vi.fn()
    gestor.suscribir(aviso)
    const [mesa] = gestor.anadirMuebles('estancia-1', [{ id: 'mesa', tipo: 'mueble', nombre: 'Mesa', columnas: 1, filas: 1 }])
    expect([!!mesa.posicion, Boolean(aviso.mock.lastCall?.[0].estancias[0].elementos.find((el: { id: string }) => el.id === 'mesa'))]).toEqual([true, true])
  })

  it('no permite mover muebles a mano', async () => {
    const { gestor } = await conInicial(amplia)
    gestor.anadirMuebles('estancia-1', [{ id: 'mesa', tipo: 'mueble', nombre: 'Mesa', columnas: 1, filas: 1 }])
    expect(gestor.colocarElemento('estancia-1', 'mesa', { x: 1, y: 1 })).toBe('El mueble «Mesa» no se puede mover')
  })

  it('marca flags de muebles y los consulta', async () => {
    const { gestor } = await conInicial(amplia)
    gestor.anadirMuebles('estancia-1', [{ id: 'mesa', tipo: 'mueble', nombre: 'Mesa', columnas: 1, filas: 1 }])
    gestor.marcarFlagMueble('mesa', 'revisado')
    expect(gestor.tieneFlagMueble('mesa', 'revisado')).toBe(true)
  })

  it('devuelve los muebles colocados al lado de un personaje', async () => {
    const gestor = new GestorMapa(proveedor(), {
      estancias: [{ id: 'sala', tipo: 'sala', columnas: 3, filas: 3, puertas: [], elementos: [{ id: 'mesa', tipo: 'mueble', nombre: 'Mesa', columnas: 1, filas: 1, posicion: { x: 2, y: 1 } }], estancias: [] }],
      escuadras: [{ id: 'rojos', nombre: 'Rojos', jugador: 'j1', personajes: [{ id: 'barbaro', nombre: 'Bárbaro', estancia: 'sala', casilla: { x: 1, y: 1 }, turnos: [] }], turnos: [] }],
    })
    expect(gestor.dameLoQueEstaAlLado(gestor.mapa.escuadras?.[0].personajes[0] ?? { id: '', nombre: '', estancia: '', turnos: [] }).map((el) => el.id)).toEqual(['mesa'])
  })
})

describe('gestor del mapa: agrupar y coger', () => {
  /**
   * Los rojos con el bárbaro en 0,0 y el elfo en `elfo`, en una sala de 5 × 3.
   * La clase del elfo mueve 2 por turno, menos lo que ya haya gastado
   */
  async function conElfo(elfo: Casilla) {
    const p = proveedor()
    const [rojos] = await p.listarEscuadras()
    const [barbaro] = await rojos.personajes()
    const gestor = new GestorMapa(
      { ...p, listarEscuadras: async () => [{ ...rojos, personajes: async () => [
            barbaro,
            {
              ...barbaro,
              id: 'elfo',
              nombre: 'Elfo',
              opcionesMovimiento: async (_personaje: Personaje, { casillas }: MovimientoGastado) => ({
                base: { ...opciones.base, tramos: [{ distancia: Math.max(0, 2 - casillas) }] },
                variaciones: [],
              }),
            },
          ] }] },
      {
        estancias: [{ id: 'sala', tipo: 'sala', columnas: 5, filas: 3, puertas: [], elementos: [], estancias: [] }],
        escuadras: [
          {
            id: 'rojos',
            nombre: 'Rojos',
            jugador: 'j1',
            personajes: [
              { id: 'barbaro', nombre: 'Bárbaro', estancia: 'sala', casilla: { x: 0, y: 0 }, turnos: [] },
              { id: 'elfo', nombre: 'Elfo', estancia: 'sala', casilla: elfo, turnos: [] },
            ],
            turnos: [],
          },
        ],
        turno: 1,
      },
    )
    const elfoDe = () => gestor.mapa.escuadras?.[0].personajes[1] ?? { id: '', nombre: '', estancia: '', turnos: [] }
    return { gestor, elfoDe }
  }

  it('un personaje de una escuadra con más personajes puede agrupar', async () => {
    const { gestor } = await conElfo({ x: 4, y: 2 })
    expect((await gestor.accionesDisponibles('rojos', 'barbaro')).map((a) => a.id)).toContain('agrupar')
  })

  it('solo, no tiene a quién agrupar', async () => {
    const { gestor } = await conInicial()
    expect((await gestor.accionesDisponibles('rojos', 'barbaro')).map((a) => a.id)).not.toContain('agrupar')
  })

  it('agrupar trae al resto de la escuadra a su lado con su movimiento, que queda gastado', async () => {
    const { gestor, elfoDe } = await conElfo({ x: 3, y: 0 })
    await gestor.ejecutarAccion('rojos', 'agrupar', 'barbaro')
    expect([elfoDe().casilla, turnoDePersonaje(elfoDe(), 1).movimientos]).toEqual([{ x: 1, y: 0 }, [{ opcion: 'mover', casillas: 2, acciones: ['mover'] }]])
  })

  it('sin movimiento para llegar, se queda a medio camino', async () => {
    const { gestor, elfoDe } = await conElfo({ x: 4, y: 0 })
    await gestor.ejecutarAccion('rojos', 'agrupar', 'barbaro')
    expect(elfoDe().casilla).toEqual({ x: 2, y: 0 })
  })

  it('el que ya ha gastado su movimiento no se mueve al agrupar', async () => {
    const { gestor, elfoDe } = await conElfo({ x: 3, y: 0 })
    await gestor.moverPersonaje('elfo', [{ x: 3, y: 0 }, { x: 3, y: 1 }, { x: 3, y: 2 }])
    await gestor.ejecutarAccion('rojos', 'agrupar', 'barbaro')
    expect([elfoDe().casilla, gastadoPor(gestor.mapa, elfoDe()).casillas]).toEqual([{ x: 3, y: 2 }, 2])
  })

  it('el que ha gastado parte de su movimiento solo se acerca con lo que le queda', async () => {
    const { gestor, elfoDe } = await conElfo({ x: 4, y: 0 })
    await gestor.moverPersonaje('elfo', [{ x: 4, y: 0 }, { x: 4, y: 1 }])
    await gestor.ejecutarAccion('rojos', 'agrupar', 'barbaro')
    // de 4,1 (a 5 del bárbaro) le queda 1: acaba a 4, en 4,0 o en 3,1
    const { x, y } = elfoDe().casilla ?? { x: Number.NaN, y: Number.NaN }
    expect([x + y, gastadoPor(gestor.mapa, elfoDe()).casillas]).toEqual([4, 2])
  })

  it('agrupar se apunta como acción del que agrupa, y el movimiento, del que se mueve', async () => {
    const { gestor } = await conElfo({ x: 3, y: 0 })
    await gestor.ejecutarAccion('rojos', 'agrupar', 'barbaro')
    expect(turnoDeEscuadra(gestor.mapa.escuadras?.[0] ?? { id: '', nombre: '', jugador: '', personajes: [], turnos: [] }, 1).acciones).toEqual([
      { accion: 'mover', personaje: 'elfo' },
      { accion: 'agrupar', personaje: 'barbaro' },
    ])
  })

  it('quita un elemento de su estancia', async () => {
    const { gestor } = await conInicial()
    gestor.quitarElemento('estancia-1-elemento-1')
    expect(gestor.mapa.estancias[0].elementos).toEqual([])
  })

  it('no quita lo que no está', async () => {
    const { gestor } = await conInicial()
    expect(gestor.quitarElemento('nada')).toBe('No hay ningún elemento «nada» en el mapa')
  })
})

describe('gestor del mapa: jugadores', () => {
  it('la estancia inicial guarda el reparto de jugadores de la configuración', async () => {
    const { gestor } = await conInicial()
    expect(gestor.mapa.jugadores).toEqual(REPARTO)
  })

  it('no empieza si una escuadra es de un jugador que no está en el reparto', async () => {
    const p = proveedor()
    const gestor = new GestorMapa({ ...p, configuracion: { ...p.configuracion, jugadores: { ...REPARTO, jugadores: REPARTO.jugadores.slice(1) } } })
    await expect(gestor.nuevaEstancia()).rejects.toThrow('No hay ningún jugador «j1» para Rojos')
  })

  it('dice a qué jugador le toca', async () => {
    const { gestor } = await conInicial()
    expect(gestor.jugadorEnTurno?.nombre).toBe('Ana')
  })

  it('al terminar una activación, avisa al proveedor de a quién le toca', async () => {
    const { gestor, p } = await conInicial()
    await gestor.ejecutarAccion('rojos', 'terminar-turno')
    expect(p.turnoDe.mock.lastCall?.[0].nombre).toBe('Ana')
  })

  it('al terminar la última activación, avisa al proveedor de que ha terminado el turno', async () => {
    const { gestor, p } = await conInicial()
    await gestor.ejecutarAccion('azules', 'terminar-turno')
    await gestor.ejecutarAccion('rojos', 'terminar-turno')
    expect(p.finDeTurno).toHaveBeenCalledWith(gestor)
  })

  it('un jugador con PNJ tiene turno y puede moverlos a mano', async () => {
    const { gestor, barbaro } = await conInicial(amplia)
    const desde = barbaro().casilla ?? { x: 0, y: 0 }
    const hacia = (dx: number) => ({ x: desde.x + dx, y: desde.y })
    gestor.anadirPersonajes('estancia-1', [{ id: 'orco', nombre: 'Orco', jugador: 'oscuridad', casilla: hacia(1) }])
    await gestor.ejecutarAccion('rojos', 'terminar-turno')
    await gestor.moverPersonajeNoJugador('orco', [hacia(1), hacia(2)], opciones)
    expect(gestor.mapa.personajesNoJugadores?.[0].casilla).toEqual(hacia(2))
  })

  it('los PNJ informan su modo inicial de activación', async () => {
    const { gestor, barbaro } = await conInicial(amplia)
    const desde = barbaro().casilla ?? { x: 0, y: 0 }
    gestor.anadirPersonajes('estancia-1', [{ id: 'orco', nombre: 'Orco', jugador: 'oscuridad', casilla: { x: desde.x - 1, y: desde.y } }])
    await gestor.ejecutarAccion('rojos', 'terminar-turno')
    expect(gestor.modoActivacionNoJugador('orco')).toBe('sigiloso')
  })

  it('en la activación de PNJ solo actúa un monstruo', async () => {
    const { gestor, barbaro } = await conInicial(amplia)
    const desde = barbaro().casilla ?? { x: 0, y: 0 }
    const hacia = (dx: number) => ({ x: desde.x + dx, y: desde.y })
    gestor.anadirPersonajes('estancia-1', [
      { id: 'orco', nombre: 'Orco', jugador: 'oscuridad', casilla: hacia(1) },
      { id: 'goblin', nombre: 'Goblin', jugador: 'oscuridad', casilla: hacia(2) },
    ])
    await gestor.ejecutarAccion('rojos', 'terminar-turno')
    await gestor.moverPersonajeNoJugador('orco', [hacia(1), { x: desde.x + 1, y: desde.y + 1 }], opciones)
    expect(gestor.motivoParaNoActuarNoJugador('goblin')).toBe('En esta activación ya actúa Orco')
  })

  it('tras terminar la activación de un PNJ, otro PNJ del jugador puede actuar si no hay otros jugadores pendientes', async () => {
    const gestor = new GestorMapa(proveedor(), {
      estancias: [{ id: 'estancia-1', tipo: 'sala', columnas: 12, filas: 8, puertas: [], elementos: [], estancias: [] }],
      personajesNoJugadores: [
        { id: 'orco', nombre: 'Orco', jugador: 'oscuridad', estancia: 'estancia-1', casilla: { x: 1, y: 1 }, turnos: [] },
        { id: 'goblin', nombre: 'Goblin', jugador: 'oscuridad', estancia: 'estancia-1', casilla: { x: 2, y: 1 }, turnos: [] },
      ],
      jugadores: REPARTO,
      turno: 1,
    })
    gestor.ejecutarAccionNoJugador('orco', 'terminar-turno')
    expect(gestor.motivoParaNoActuarNoJugador('goblin')).toBeUndefined()
  })

  it('al terminar la activación de un jugador con PNJ pasa al siguiente jugador', async () => {
    const { gestor, barbaro } = await conInicial(amplia)
    const desde = barbaro().casilla ?? { x: 0, y: 0 }
    gestor.anadirPersonajes('estancia-1', [{ id: 'orco', nombre: 'Orco', jugador: 'oscuridad', casilla: { x: desde.x - 1, y: desde.y } }])
    await gestor.ejecutarAccion('rojos', 'terminar-turno')
    gestor.terminarActivacionJugador('oscuridad')
    expect(gestor.jugadorEnTurno?.nombre).toBe('Ana')
  })

  it('mientras una escuadra se activa, dice por qué no puede actuar otro personaje', async () => {
    const { gestor } = await conInicial()
    await gestor.ejecutarAccion('rojos', 'gritar', 'barbaro')
    expect(gestor.motivoParaNoActuar('enano')).toBe('No se puede activar hasta terminar la activación de Rojos')
  })

  it('un reparto que no vale no cambia nada y dice por qué', async () => {
    const { gestor } = await conInicial()
    const antes = gestor.mapa
    expect([gestor.cambiarJugadores({ ...REPARTO, alianzas: [] }), gestor.mapa]).toEqual(['No hay ninguna alianza «heroes» para Ana', antes])
  })

  it('un cambio de postura en mitad de la partida cambia quién es enemigo', async () => {
    const { gestor, barbaro } = await conInicial(amplia)
    const desde = barbaro().casilla ?? { x: 0, y: 0 }
    const hacia = (dx: number) => ({ x: desde.x + dx, y: desde.y })
    gestor.anadirPersonajes('estancia-1', [{ id: 'orco', nombre: 'Orco', jugador: 'oscuridad', casilla: hacia(1) }])
    gestor.cambiarJugadores({ ...REPARTO, alianzas: REPARTO.alianzas.map((a) => ({ ...a, posturas: {} })) })
    expect(await gestor.moverPersonaje('barbaro', [desde, hacia(1), hacia(2)])).toBeUndefined()
  })
})

describe('gestor del mapa: puertas', () => {
  /** La salida de la sala de prueba (4 × 3, hacia abajo): en medio del muro de abajo */
  const salida = { estancia: 'estancia-1', casilla: { x: 2, y: 2 } }

  it('abrir una puerta pide una estancia nueva y la deja abierta hacia ella', async () => {
    const { gestor } = await conInicial()
    await gestor.abrirPuerta(salida)
    expect([gestor.mapa.estancias.map((e) => e.id), gestor.puertaEn(salida)]).toEqual([
      ['estancia-1', 'estancia-2'],
      expect.objectContaining({ id: 'salida-1', abierta: true, destino: 'estancia-2' }),
    ])
  })

  it('una puerta abierta no se vuelve a abrir', async () => {
    const { gestor } = await conInicial()
    await gestor.abrirPuerta(salida)
    await expect(gestor.abrirPuerta(salida)).rejects.toThrow('ya está abierta')
  })

  it('si no se da la estancia nueva, la puerta sigue cerrada', async () => {
    const { gestor, p } = await conInicial()
    p.describirEstancia.mockRejectedValueOnce(new Error('cancelada'))
    await expect(gestor.abrirPuerta(salida)).rejects.toThrow('cancelada')
    expect(gestor.puertaEn(salida)?.abierta).toBeUndefined()
  })

  it('al abrir una puerta, el proveedor sabe por qué muro se entrará', async () => {
    const { gestor, p } = await conInicial()
    await gestor.abrirPuerta(salida)
    expect(p.describirEstancia.mock.lastCall?.[1]).toBe('arriba')
  })

  it('la estancia que se abre queda con su entrada junto a la puerta, al otro lado del muro', async () => {
    const { gestor } = await conInicial()
    const nueva = await gestor.abrirPuerta(salida)
    const entrada = nueva.puertas.find((p) => p.tipo === 'entrada')
    expect(entrada && { x: (nueva.posicion?.x ?? 0) + entrada.casilla.x, y: (nueva.posicion?.y ?? 0) + entrada.casilla.y }).toEqual({ x: 2, y: 3 })
  })

  it('la estancia que se abre mantiene su orientación y pone la entrada en el muro de la puerta', async () => {
    const { gestor, p } = await conInicial()
    p.describirEstancia.mockResolvedValueOnce({ ...sala, orientacion: 'derecha' })
    const nueva = await gestor.abrirPuerta(salida)
    expect([nueva.orientacion, nueva.puertas.map((pu) => [pu.tipo, pu.lado])]).toEqual([
      'derecha',
      [
        ['entrada', 'arriba'],
        ['salida', 'derecha'],
      ],
    ])
  })

  it('si la estancia pide salir por el muro de la entrada, no se abre y la puerta sigue cerrada', async () => {
    const { gestor, p } = await conInicial()
    p.describirEstancia.mockResolvedValueOnce({ ...sala, orientacion: 'arriba' })
    await expect(gestor.abrirPuerta(salida)).rejects.toThrow('no puede salir por el muro de arriba')
    expect(gestor.puertaEn(salida)?.abierta).toBeUndefined()
  })

  it('con personajes impasables, no se pasa por encima de otro personaje', async () => {
    const p = { ...proveedor(amplia), configuracion: { ordenActivaciones: 'alternas', modosActivacion: 'agresivo-sigiloso', medicionMovimiento: 'ortogonal', terrenoPersonajes: 'impasable', jugadores: REPARTO } as const }
    const gestor = new GestorMapa(p, {
      estancias: [{ id: 'estancia-1', tipo: 'sala', columnas: 12, filas: 8, puertas: [], elementos: [], estancias: [] }],
      escuadras: [
        { id: 'rojos', nombre: 'Rojos', jugador: 'j1', personajes: [{ id: 'barbaro', nombre: 'Bárbaro', estancia: 'estancia-1', casilla: { x: 1, y: 1 }, turnos: [] }], turnos: [] },
        { id: 'azules', nombre: 'Azules', jugador: 'j1', personajes: [{ id: 'enano', nombre: 'Enano', estancia: 'estancia-1', casilla: { x: 2, y: 1 }, turnos: [] }], turnos: [] },
      ],
      turno: 1,
      jugadores: REPARTO,
    })
    const [barbaro, enano] = gestor.mapa.escuadras?.map((e) => e.personajes[0].casilla) ?? []
    // el enano está justo a la derecha del bárbaro: el recorrido recto lo atraviesa
    expect([enano, await gestor.moverPersonaje('barbaro', enLinea(barbaro, 2))]).toEqual([{ x: (barbaro?.x ?? 0) + 1, y: barbaro?.y }, 'El recorrido pasa por donde no se puede'])
  })
})
