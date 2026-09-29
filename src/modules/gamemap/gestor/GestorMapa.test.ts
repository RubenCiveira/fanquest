import { describe, expect, it, vi } from 'vitest'
import type { DescripcionEstancia } from '../modelo/descripcionEstancia'
import { GestorMapa } from './GestorMapa'

const sala: DescripcionEstancia = {
  tipo: 'sala',
  tamano: { columnas: 4, filas: 3 },
  orientacion: 'abajo',
  salidas: 1,
  elementos: [{ tipo: 'objeto', nombre: 'Cofre', columnas: 1, filas: 1 }],
}

const proveedor = () => ({
  configuracion: { ordenActivaciones: 'alternas', modosActivacion: 'agresivo-sigiloso' } as const,
  describirEstancia: vi.fn(async () => sala),
  listarEscuadras: vi.fn(async () => [
    {
      id: 'rojos',
      nombre: 'Rojos',
      heroes: async () => [{ id: 'barbaro', nombre: 'Bárbaro', imagenVtt: 'barbaro.png' }],
      modoActivacion: async () => 'agresivo' as const,
      acciones: vi.fn(async () => [{ id: 'mover', nombre: 'Mover' }]),
    },
    {
      id: 'azules',
      nombre: 'Azules',
      heroes: async () => [{ id: 'enano', nombre: 'Enano' }],
      modoActivacion: async () => 'sigiloso' as const,
      acciones: async () => [],
    },
  ]),
})

describe('gestor del mapa', () => {
  it('en la primera estancia, el proveedor no recibe mapa', async () => {
    const p = proveedor()
    await new GestorMapa(p).nuevaEstancia()
    expect(p.describirEstancia).toHaveBeenCalledWith(undefined)
  })

  it('en las siguientes, el proveedor recibe el mapa ya construido', async () => {
    const p = proveedor()
    const gestor = new GestorMapa(p)
    await gestor.nuevaEstancia()
    const construido = gestor.mapa
    await gestor.nuevaEstancia()
    expect(p.describirEstancia).toHaveBeenLastCalledWith(construido)
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
    const p = { ...proveedor(), listarEscuadras: async () => [{ id: 'rojos', nombre: 'Rojos', heroes: async () => [], modoActivacion, acciones: async () => [] }] }
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
    expect(rojos.acciones).toHaveBeenLastCalledWith(expect.objectContaining({ escuadra: 'rojos', turno: 1, modo: 'agresivo', acciones: ['mover'] }))
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
})
