import { describe, expect, it, vi } from 'vitest'
import type { AccionEjecutada } from '../modelo/accionEjecutada'
import type { HeroeEnMapa } from '../modelo/heroeEnMapa'
import type { MapaEnJuego } from '../modelo/mapaEnJuego'
import type { DescripcionEstancia } from '../modelo/descripcionEstancia'
import type { Direccion } from '../modelo/direccion'
import type { Mapa } from '../modelo/mapa'
import type { EstadoEscuadra } from '../modelo/estadoEscuadra'
import type { MovimientoGastado } from '../modelo/movimientoGastado'
import type { OpcionesMovimiento } from '../modelo/opcionesMovimiento'
import { GestorMapa } from './GestorMapa'

const sala: DescripcionEstancia = {
  tipo: 'sala',
  tamano: { columnas: 4, filas: 3 },
  orientacion: 'abajo',
  salidas: 1,
  elementos: [{ tipo: 'objeto', nombre: 'Cofre', columnas: 1, filas: 1 }],
}

const mover = { id: 'mover', nombre: 'Mover', icono: '🥾' }
const opciones: OpcionesMovimiento = {
  base: { id: 'mover', nombre: 'Mover', tipo: 'normal', accion: mover, tramos: [{ distancia: 2 }] },
  variaciones: [
    {
      id: 'mover-y-deslizar',
      nombre: 'Mover y deslizar',
      tipo: 'normal',
      accion: mover,
      tramos: [{ distancia: 2 }, { distancia: 1, accion: { id: 'deslizar', nombre: 'Deslizar', icono: '💨' } }],
    },
  ],
}
/** Por defecto, ninguna activación queda completa tras una acción */
const activar = vi.fn(async (_acciones: AccionEjecutada[]) => ({ completo: false }))

/** Comando de los rojos que solo dan con un héroe pulsado */
const gritar = { id: 'gritar', nombre: 'Gritar', icono: '📣', exec: vi.fn(async () => {}) }

const opcionesMovimiento = vi.fn(async (_estado: EstadoEscuadra, _gastado: MovimientoGastado) => opciones)

const proveedor = () => ({
  confirmar: vi.fn(async () => true),
  configuracion: { ordenActivaciones: 'alternas', modosActivacion: 'agresivo-sigiloso' } as const,
  describirEstancia: vi.fn(async (_mapa?: Mapa, _entrada?: Direccion) => sala),
  listarEscuadras: vi.fn(async () => [
    {
      id: 'rojos',
      nombre: 'Rojos',
      heroes: async () => [{ id: 'barbaro', nombre: 'Bárbaro', imagenVtt: 'barbaro.png', opcionesMovimiento }],
      modoActivacion: async () => 'agresivo' as const,
      acciones: vi.fn(async (_estado: EstadoEscuadra, _mapa: MapaEnJuego, heroe?: HeroeEnMapa) => [
        { id: 'mover', nombre: 'Mover', icono: '🥾' },
        ...(heroe ? [gritar] : []),
      ]),
      activar,
    },
    {
      id: 'azules',
      nombre: 'Azules',
      heroes: async () => [{ id: 'enano', nombre: 'Enano', opcionesMovimiento }],
      modoActivacion: async () => 'sigiloso' as const,
      acciones: async () => [],
      activar,
    },
  ]),
})

describe('gestor del mapa', () => {
  it('en la primera estancia, el proveedor no recibe mapa', async () => {
    const p = proveedor()
    await new GestorMapa(p).nuevaEstancia()
    expect(p.describirEstancia.mock.lastCall?.[0]).toBeUndefined()
  })

  it('en las siguientes, el proveedor recibe el mapa ya construido', async () => {
    const p = proveedor()
    const gestor = new GestorMapa(p)
    await gestor.nuevaEstancia()
    const construido = gestor.mapa
    await gestor.nuevaEstancia()
    expect(p.describirEstancia.mock.lastCall?.[0]).toBe(construido)
  })

  it('añade cada estancia nueva al mapa con un id propio', async () => {
    const gestor = new GestorMapa(proveedor())
    await gestor.nuevaEstancia()
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

  it('coloca a mano un elemento', async () => {
    const gestor = new GestorMapa(proveedor())
    await gestor.nuevaEstancia()
    gestor.colocarElemento('estancia-1', 'estancia-1-elemento-1', { x: 0, y: 1 })
    expect(gestor.mapa.estancias[0].elementos[0].posicion).toEqual({ x: 0, y: 1 })
  })

  it('si el elemento no puede ir ahí, dice por qué y el mapa no cambia', async () => {
    const gestor = new GestorMapa(proveedor())
    const antes = (await gestor.nuevaEstancia(), gestor.mapa)
    expect([gestor.colocarElemento('estancia-1', 'estancia-1-elemento-1', { x: 9, y: 0 }), gestor.mapa]).toEqual([
      '«Cofre» se sale de «estancia-1»',
      antes,
    ])
  })

  it('coloca en la estancia inicial a los héroes de cada escuadra', async () => {
    const gestor = new GestorMapa(proveedor())
    await gestor.nuevaEstancia()
    expect(gestor.mapa.estancias[0].elementos.filter((el) => el.tipo === 'heroe').map((el) => [el.id, el.escuadra])).toEqual([
      ['barbaro', 'rojos'],
      ['enano', 'azules'],
    ])
  })

  it('la ficha del héroe ocupa una casilla con su imagen VTT', async () => {
    const gestor = new GestorMapa(proveedor())
    await gestor.nuevaEstancia()
    expect(gestor.mapa.estancias[0].elementos.find((el) => el.id === 'barbaro')).toMatchObject({
      nombre: 'Bárbaro',
      imagenVtt: 'barbaro.png',
      columnas: 1,
      filas: 1,
      posicion: expect.any(Object),
    })
  })

  it('en las estancias siguientes no pide escuadras', async () => {
    const p = proveedor()
    const gestor = new GestorMapa(p)
    await gestor.nuevaEstancia()
    await gestor.nuevaEstancia()
    expect(p.listarEscuadras).toHaveBeenCalledTimes(1)
  })

  it('guarda qué escuadras hay al crear la estancia inicial', async () => {
    const gestor = new GestorMapa(proveedor())
    await gestor.nuevaEstancia()
    expect(gestor.mapa.escuadras).toEqual([
      { id: 'rojos', nombre: 'Rojos' },
      { id: 'azules', nombre: 'Azules' },
    ])
  })

  it('guarda el modo de activación de cada escuadra', async () => {
    const gestor = new GestorMapa(proveedor())
    await gestor.nuevaEstancia()
    gestor.activarEscuadra('rojos', 'agresivo')
    expect(gestor.mapa.turno?.activaciones).toEqual({ rojos: { modo: 'agresivo', terminada: false } })
  })

  it('si la escuadra no puede activarse, dice por qué', async () => {
    const gestor = new GestorMapa(proveedor())
    await gestor.nuevaEstancia()
    expect(gestor.activarEscuadra('rojos', 'normal')).toBe('El modo normal no está permitido: agresivo o sigiloso')
  })

  it('una estancia nueva no borra el turno en curso', async () => {
    const gestor = new GestorMapa(proveedor())
    await gestor.nuevaEstancia()
    gestor.activarEscuadra('rojos', 'sigiloso')
    await gestor.nuevaEstancia()
    expect(gestor.mapa.turno?.activaciones.rojos).toEqual({ modo: 'sigiloso', terminada: false })
  })

  it('termina el turno cuando todas las escuadras han completado su activación', async () => {
    const gestor = new GestorMapa(proveedor())
    await gestor.nuevaEstancia()
    for (const id of ['rojos', 'azules']) {
      gestor.activarEscuadra(id, 'agresivo')
      gestor.terminarActivacion(id)
    }
    gestor.terminarTurno()
    expect(gestor.mapa.turno).toEqual({ numero: 2, activaciones: {}, ultimosModos: { rojos: 'agresivo', azules: 'agresivo' } })
  })

  it('sin activaciones completas, no termina el turno', async () => {
    const gestor = new GestorMapa(proveedor())
    await gestor.nuevaEstancia()
    expect(gestor.terminarTurno()).toBe('Falta terminar la activación de Rojos, Azules')
  })

  it('pregunta a cada escuadra su modo de partida', async () => {
    const gestor = new GestorMapa(proveedor())
    await gestor.nuevaEstancia()
    expect(gestor.mapa.turno?.ultimosModos).toEqual({ rojos: 'agresivo', azules: 'sigiloso' })
  })

  it('sin modo agresivo o sigiloso, las escuadras no tienen modo de partida', async () => {
    const gestor = new GestorMapa({ ...proveedor(), configuracion: { ordenActivaciones: 'alternas', modosActivacion: 'normal' } })
    await gestor.nuevaEstancia()
    expect(gestor.mapa.turno?.ultimosModos).toBeUndefined()
  })

  it('no pregunta el modo a una escuadra que ya lo tiene', async () => {
    const modoActivacion = vi.fn(async () => 'agresivo' as const)
    const p = { ...proveedor(), listarEscuadras: async () => [{ id: 'rojos', nombre: 'Rojos', heroes: async () => [], modoActivacion, acciones: async () => [], activar }] }
    await new GestorMapa(p, { estancias: [], turno: { numero: 3, activaciones: {}, ultimosModos: { rojos: 'sigiloso' } } }).nuevaEstancia()
    expect(modoActivacion).not.toHaveBeenCalled()
  })

  it('las acciones disponibles son las de la escuadra y después las del gestor', async () => {
    const gestor = new GestorMapa(proveedor())
    await gestor.nuevaEstancia()
    expect((await gestor.accionesDisponibles('rojos')).map((a) => a.nombre)).toEqual(['Mover', 'Cambiar a sigiloso', 'Terminar turno'])
  })

  it('al preguntar por las acciones, la escuadra recibe su estado', async () => {
    const p = proveedor()
    const gestor = new GestorMapa(p)
    await gestor.nuevaEstancia()
    await gestor.ejecutarAccion('rojos', 'mover')
    const [rojos] = await p.listarEscuadras.mock.results[0].value
    await gestor.accionesDisponibles('rojos')
    expect(rojos.acciones.mock.lastCall?.[0]).toEqual(expect.objectContaining({ escuadra: 'rojos', turno: 1, modo: 'agresivo', acciones: [{ accion: 'mover' }] }))
  })

  it('pide las escuadras al proveedor una sola vez', async () => {
    const p = proveedor()
    const gestor = new GestorMapa(p)
    await gestor.nuevaEstancia()
    await gestor.accionesDisponibles('rojos')
    await gestor.accionesDisponibles('azules')
    expect(p.listarEscuadras).toHaveBeenCalledTimes(1)
  })

  it('una acción que no está disponible no se ejecuta', async () => {
    const gestor = new GestorMapa(proveedor())
    await gestor.nuevaEstancia()
    expect(await gestor.ejecutarAccion('azules', 'mover')).toBe('«mover» no es una acción disponible ahora')
  })

  it('tras terminar turno, la escuadra no tiene acciones', async () => {
    const gestor = new GestorMapa(proveedor())
    await gestor.nuevaEstancia()
    await gestor.ejecutarAccion('rojos', 'terminar-turno')
    expect(await gestor.accionesDisponibles('rojos')).toEqual([])
  })

  /** Recorrido de `pasos` casillas hacia la derecha desde la casilla de salida */
  const enLinea = (desde: { x: number; y: number }, pasos: number) => Array.from({ length: pasos + 1 }, (_, i) => ({ x: desde.x + i, y: desde.y }))

  /** Gestor con una estancia inicial amplia y vacía y la casilla del bárbaro en ella */
  async function conBarbaro(confirma = true) {
    const amplia = { ...sala, tamano: { columnas: 12, filas: 8 }, elementos: [] }
    const p = { ...proveedor(), confirmar: vi.fn(async () => confirma), describirEstancia: async () => amplia }
    const gestor = new GestorMapa(p)
    await gestor.nuevaEstancia()
    const posicion = gestor.mapa.estancias[0].elementos.find((el) => el.id === 'barbaro')?.posicion ?? { x: -1, y: -1 }
    return { gestor, posicion, confirmar: p.confirmar, proveedor: p }
  }

  it('pregunta al héroe cómo puede moverse, con el estado de su escuadra y sin nada gastado', async () => {
    const { gestor } = await conBarbaro()
    expect([await gestor.opcionesMovimiento('barbaro'), opcionesMovimiento.mock.lastCall]).toEqual([
      opciones,
      [expect.objectContaining({ escuadra: 'rojos', turno: 1 }), { casillas: 0, acciones: [] }],
    ])
  })

  it('mueve al héroe y apunta en su escuadra la acción que consume', async () => {
    const { gestor, posicion } = await conBarbaro()
    const destino = { x: posicion.x, y: posicion.y + 1 }
    await gestor.moverHeroe('barbaro', [posicion, destino])
    const estancia = gestor.mapa.estancias[0]
    expect([estancia.elementos.find((el) => el.id === 'barbaro')?.posicion, gestor.mapa.turno?.acciones?.rojos]).toEqual([
      destino,
      [{ accion: 'mover', heroe: 'barbaro' }],
    ])
  })

  it('si el recorrido no vale, dice por qué y el héroe no se mueve', async () => {
    const { gestor, posicion } = await conBarbaro()
    const antes = gestor.mapa
    expect([await gestor.moverHeroe('barbaro', enLinea(posicion, 4)), gestor.mapa]).toEqual(['Demasiado lejos: 4 casillas y como mucho 3', antes])
  })

  it('un héroe cuya escuadra ya terminó su turno no puede moverse', async () => {
    const { gestor } = await conBarbaro()
    await gestor.ejecutarAccion('rojos', 'terminar-turno')
    expect(await gestor.opcionesMovimiento('barbaro')).toBeUndefined()
  })

  it('dentro del movimiento base, mueve sin preguntar y apunta cuántas casillas', async () => {
    const { gestor, posicion, confirmar } = await conBarbaro()
    await gestor.moverHeroe('barbaro', enLinea(posicion, 2))
    expect([confirmar.mock.calls.length, gestor.mapa.turno?.movimientos?.rojos]).toEqual([
      0,
      [{ heroe: 'barbaro', opcion: 'mover', casillas: 2, acciones: ['mover'] }],
    ])
  })

  it('para deslizar, pide confirmación', async () => {
    const { gestor, posicion, confirmar } = await conBarbaro()
    await gestor.moverHeroe('barbaro', enLinea(posicion, 3))
    expect(confirmar).toHaveBeenCalledWith('Confirme que queremos deslizar')
  })

  it('confirmado, mueve y apunta el movimiento y la acción de deslizar', async () => {
    const { gestor, posicion } = await conBarbaro()
    await gestor.moverHeroe('barbaro', enLinea(posicion, 3))
    expect([gestor.mapa.turno?.acciones?.rojos, gestor.mapa.turno?.movimientos?.rojos]).toEqual([
      [
        { accion: 'mover', heroe: 'barbaro' },
        { accion: 'deslizar', heroe: 'barbaro' },
      ],
      [{ heroe: 'barbaro', opcion: 'mover-y-deslizar', casillas: 3, acciones: ['mover', 'deslizar'] }],
    ])
  })

  it('sin confirmar, no hace nada', async () => {
    const { gestor, posicion } = await conBarbaro(false)
    const antes = gestor.mapa
    expect([await gestor.moverHeroe('barbaro', enLinea(posicion, 3)), gestor.mapa]).toEqual([undefined, antes])
  })

  it('si el héroe ya se ha movido, se le pregunta de nuevo diciendo lo que ha gastado', async () => {
    const { gestor, posicion } = await conBarbaro()
    await gestor.moverHeroe('barbaro', enLinea(posicion, 2))
    await gestor.opcionesMovimiento('barbaro')
    expect(opcionesMovimiento.mock.lastCall?.[1]).toEqual({ casillas: 2, acciones: ['mover'] })
  })

  it('tras moverse, pasa a la escuadra las acciones que lleva', async () => {
    const { gestor, posicion } = await conBarbaro()
    await gestor.moverHeroe('barbaro', enLinea(posicion, 2))
    expect(activar).toHaveBeenLastCalledWith([{ accion: 'mover', heroe: 'barbaro' }])
  })

  it('si la escuadra dice que su activación está completa, termina su turno', async () => {
    const { gestor, posicion } = await conBarbaro()
    activar.mockResolvedValueOnce({ completo: true })
    await gestor.moverHeroe('barbaro', enLinea(posicion, 2))
    expect(gestor.mapa.turno?.activaciones.rojos).toEqual({ modo: 'agresivo', terminada: true })
  })

  it('si no está completa, la escuadra sigue activándose', async () => {
    const { gestor, posicion } = await conBarbaro()
    await gestor.moverHeroe('barbaro', enLinea(posicion, 2))
    expect(gestor.mapa.turno?.activaciones.rojos).toEqual({ modo: 'agresivo', terminada: false })
  })

  it('tras terminar turno a mano no se pregunta a la escuadra', async () => {
    const { gestor } = await conBarbaro()
    activar.mockClear()
    await gestor.ejecutarAccion('rojos', 'terminar-turno')
    expect(activar).not.toHaveBeenCalled()
  })

  it('un héroe colocado no se lleva a otra casilla a mano: se mueve arrastrándolo', async () => {
    const { gestor, posicion } = await conBarbaro()
    const antes = gestor.mapa
    expect([gestor.colocarElemento('estancia-1', 'barbaro', { x: posicion.x, y: posicion.y + 2 }), gestor.mapa]).toEqual([
      'Bárbaro se mueve arrastrando su ficha',
      antes,
    ])
  })

  it('un héroe colocado tampoco vuelve a mano a la zona de espera', async () => {
    const { gestor } = await conBarbaro()
    expect(gestor.colocarElemento('estancia-1', 'barbaro')).toBe('Bárbaro se mueve arrastrando su ficha')
  })

  it('al pulsar un héroe, la escuadra da también las acciones que dependen de él', async () => {
    const gestor = new GestorMapa(proveedor())
    await gestor.nuevaEstancia()
    expect((await gestor.accionesDisponibles('rojos', 'barbaro')).map((a) => a.id)).toEqual(['mover', 'gritar', 'cambiar-modo', 'terminar-turno'])
  })

  it('la escuadra recibe el mapa y el héroe pulsado, con su posición', async () => {
    const { gestor, posicion, proveedor: p } = await conBarbaro()
    await gestor.accionesDisponibles('rojos', 'barbaro')
    const [rojos] = await p.listarEscuadras.mock.results[0].value
    expect(rojos.acciones.mock.lastCall?.slice(1)).toEqual([
      gestor,
      { id: 'barbaro', nombre: 'Bárbaro', escuadra: 'rojos', posicion: { estancia: 'estancia-1', casilla: posicion } },
    ])
  })

  it('un comando se ejecuta con su propio código', async () => {
    const { gestor } = await conBarbaro()
    gritar.exec.mockClear()
    await gestor.ejecutarAccion('rojos', 'gritar', 'barbaro')
    expect(gritar.exec).toHaveBeenCalledOnce()
  })

  it('una acción de la escuadra con un héroe pulsado queda apuntada como suya', async () => {
    const { gestor } = await conBarbaro()
    await gestor.ejecutarAccion('rojos', 'gritar', 'barbaro')
    expect(gestor.mapa.turno?.acciones?.rojos).toEqual([{ accion: 'gritar', heroe: 'barbaro' }])
  })

  it('si el comando falla, no se apunta', async () => {
    const { gestor } = await conBarbaro()
    gritar.exec.mockRejectedValueOnce(new Error('cancelada'))
    await expect(gestor.ejecutarAccion('rojos', 'gritar', 'barbaro')).rejects.toThrow('cancelada')
    expect(gestor.mapa.turno?.acciones?.rojos).toBeUndefined()
  })

  /** La salida de la sala de prueba (4 × 3, hacia abajo): en medio del muro de abajo */
  const salida = { estancia: 'estancia-1', casilla: { x: 2, y: 2 } }

  it('abrir una puerta pide una estancia nueva y la deja abierta hacia ella', async () => {
    const gestor = new GestorMapa(proveedor())
    await gestor.nuevaEstancia()
    await gestor.abrirPuerta(salida)
    expect([gestor.mapa.estancias.map((e) => e.id), gestor.puertaEn(salida)]).toEqual([
      ['estancia-1', 'estancia-2'],
      expect.objectContaining({ id: 'salida-1', abierta: true, destino: 'estancia-2' }),
    ])
  })

  it('una puerta abierta no se vuelve a abrir', async () => {
    const gestor = new GestorMapa(proveedor())
    await gestor.nuevaEstancia()
    await gestor.abrirPuerta(salida)
    await expect(gestor.abrirPuerta(salida)).rejects.toThrow('ya está abierta')
  })

  it('si no se da la estancia nueva, la puerta sigue cerrada', async () => {
    const p = proveedor()
    const gestor = new GestorMapa(p)
    await gestor.nuevaEstancia()
    p.describirEstancia.mockRejectedValueOnce(new Error('cancelada'))
    await expect(gestor.abrirPuerta(salida)).rejects.toThrow('cancelada')
    expect(gestor.puertaEn(salida)?.abierta).toBeUndefined()
  })

  it('la estancia inicial va en la esquina del mapa y la siguiente sin puerta, aparte a su derecha', async () => {
    const gestor = new GestorMapa(proveedor())
    await gestor.nuevaEstancia()
    await gestor.nuevaEstancia()
    expect(gestor.mapa.estancias.map((e) => e.posicion)).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 0 },
    ])
  })

  it('la estancia que se abre queda con su entrada junto a la puerta, al otro lado del muro', async () => {
    const gestor = new GestorMapa(proveedor())
    await gestor.nuevaEstancia()
    const nueva = await gestor.abrirPuerta(salida)
    const entrada = nueva.puertas.find((p) => p.tipo === 'entrada')
    expect(entrada && { x: (nueva.posicion?.x ?? 0) + entrada.casilla.x, y: (nueva.posicion?.y ?? 0) + entrada.casilla.y }).toEqual({ x: 2, y: 3 })
  })

  it('al abrir una puerta, el proveedor sabe por qué muro se entrará', async () => {
    const p = proveedor()
    const gestor = new GestorMapa(p)
    await gestor.nuevaEstancia()
    await gestor.abrirPuerta(salida)
    expect(p.describirEstancia.mock.lastCall?.[1]).toBe('arriba')
  })

  it('la estancia que se abre mantiene su orientación y pone la entrada en el muro de la puerta', async () => {
    const p = proveedor()
    const gestor = new GestorMapa(p)
    await gestor.nuevaEstancia()
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
    const p = proveedor()
    const gestor = new GestorMapa(p)
    await gestor.nuevaEstancia()
    p.describirEstancia.mockResolvedValueOnce({ ...sala, orientacion: 'arriba' })
    await expect(gestor.abrirPuerta(salida)).rejects.toThrow('no puede salir por el muro de arriba')
    expect(gestor.puertaEn(salida)?.abierta).toBeUndefined()
  })
})
