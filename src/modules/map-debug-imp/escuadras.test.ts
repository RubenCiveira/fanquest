import { describe, expect, it, vi } from 'vitest'
import type { AtaqueDeEscuadra, Escuadra, MapaEnJuego, PersonajeEnJuego } from '../gamemap'
import { JUGADORES_DE_PRUEBA } from './configuracion'
import { activacionDePrueba, atacarEscuadraDePrueba, escuadrasDePrueba, sinCoherenciaDePrueba } from './escuadras'
import { PersonajeDePrueba, MOVIMIENTO_DE_PRUEBA } from './modelo/personaje'
import { PuertasDePrueba } from './modelo/puerta'

/** Estado de un personaje recién colocado */
const enJuego = { id: 'barbaro', nombre: 'Bárbaro', estancia: 'estancia-1', turnos: [], estaTrabado: () => false, trabadoPor: () => [], conApoyos: () => [] }

describe('escuadras de prueba', () => {
  const escuadras = () => escuadrasDePrueba(new PuertasDePrueba()).listarEscuadras()

  it('una escuadra con el bárbaro y otra con el enano, con su ficha VTT', async () => {
    const personajes = await Promise.all((await escuadras()).map((e) => e.personajes()))
    expect(personajes.map((h) => h.map(({ id, imagenVtt }) => [id, Boolean(imagenVtt)]))).toEqual([[['barbaro', true]], [['enano', true]]])
  })

  it('añade escuadras de monstruos elegidas para la estancia inicial', async () => {
    const proveedor = escuadrasDePrueba(new PuertasDePrueba(), () => [[{ id: 'orco-1', nombre: 'Orco', jugador: 'oscuridad' }]])
    const escuadras = await proveedor.listarEscuadras()
    expect([escuadras[2].id, escuadras[2].jugador, (await escuadras[2].personajes()).map((p) => p.id)]).toEqual(['escuadra-monstruos-1', 'oscuridad', ['orco-1']])
  })

  it('sus personajes son personajes de prueba, siempre los mismos', async () => {
    const [escuadra] = await escuadras()
    const [primero] = await escuadra.personajes()
    const [otraVez] = await escuadra.personajes()
    expect([primero instanceof PersonajeDePrueba, primero === otraVez]).toEqual([true, true])
  })

  it('las dos empiezan en modo sigiloso', async () => {
    expect(await Promise.all((await escuadras()).map((e) => e.modoActivacion()))).toEqual(['sigiloso', 'sigiloso'])
  })

  it('el personaje pregunta por su movimiento con lo que ya ha gastado', async () => {
    const [enano] = await (await escuadras())[1].personajes()
    expect(await enano.opcionesMovimiento(enJuego, { casillas: 0, acciones: [] })).toEqual(MOVIMIENTO_DE_PRUEBA)
  })

  it('el bárbaro, sin haberse movido, también puede volar', async () => {
    const [barbaro] = await (await escuadras())[0].personajes()
    expect((await barbaro.opcionesMovimiento(enJuego, { casillas: 0, acciones: [] }))?.variaciones.map((v) => v.id)).toContain('volar')
  })

  it('tras moverse, ya no vuela', async () => {
    const [barbaro] = await (await escuadras())[0].personajes()
    expect((await barbaro.opcionesMovimiento(enJuego, { casillas: 2, acciones: ['mover'] }))?.variaciones.map((v) => v.id)).not.toContain('volar')
  })

  it('moverse sin más no completa la activación', () => {
    expect(activacionDePrueba([{ accion: 'mover', personaje: 'barbaro' }], ['barbaro'])).toEqual({ completo: false })
  })

  it('moverse y deslizar completa la activación', () => {
    expect(activacionDePrueba([{ accion: 'mover', personaje: 'barbaro' }, { accion: 'deslizar', personaje: 'barbaro' }], ['barbaro'])).toEqual({ completo: true })
  })

  it('las acciones de la escuadra sin personaje (cambiar de modo) no agotan a nadie', () => {
    expect(activacionDePrueba([{ accion: 'cambiar-modo' }, { accion: 'mover', personaje: 'barbaro' }], ['barbaro'])).toEqual({ completo: false })
  })

  it('con varios personajes, no se completa mientras a alguno le queden acciones', () => {
    const acciones = [
      { accion: 'mover', personaje: 'orco-1' },
      { accion: 'coger-objeto-cofre', personaje: 'orco-1' },
      { accion: 'mover', personaje: 'orco-2' },
    ]
    expect(activacionDePrueba(acciones, ['orco-1', 'orco-2'])).toEqual({ completo: false })
  })

  it('se completa cuando cada personaje se ha movido y ha hecho otra acción', () => {
    const acciones = [
      { accion: 'mover', personaje: 'orco-1' },
      { accion: 'agrupar', personaje: 'orco-1' },
      { accion: 'mover', personaje: 'orco-2' },
      { accion: 'deslizar', personaje: 'orco-2' },
    ]
    expect(activacionDePrueba(acciones, ['orco-1', 'orco-2'])).toEqual({ completo: true })
  })

  it('usar una acción sin moverse no completa la activación', () => {
    expect(activacionDePrueba([{ accion: 'cambiar-modo' }], ['barbaro'])).toEqual({ completo: false })
  })

  it('las escuadras de monstruos no buscan trampas; las de héroes, sí', async () => {
    const { listarEscuadras } = escuadrasDePrueba(new PuertasDePrueba(), () => [[{ id: 'orco-1', nombre: 'Orco', jugador: 'oscuridad' }]])
    expect((await listarEscuadras()).map((e) => [e.id, e.buscaTrampas ?? true])).toEqual([
      ['escuadra-barbaro', true],
      ['escuadra-enano', true],
      ['escuadra-monstruos-1', false],
    ])
  })
})

describe('fuera de coherencia en el banco de pruebas', () => {
  const escuadra: Escuadra = { id: 'escuadra-monstruos-1', nombre: 'Escuadra de monstruos 1', jugador: 'oscuridad', personajes: [], turnos: [] }
  const fuera = [enJuego, { ...enJuego, id: 'enano', nombre: 'Enano' }]
  const mapa = () => ({ eliminarPersonaje: vi.fn() }) as unknown as MapaEnJuego
  const dialogos = () => ({ resolverAtaque: vi.fn(), repartirDano: vi.fn(), avisar: vi.fn(async (_aviso: { titulo: string; texto: string }) => {}) })

  it('los que quedan fuera desaparecen como si hubieran muerto', async () => {
    const m = mapa()
    await sinCoherenciaDePrueba(escuadra, fuera, m, dialogos())
    expect(vi.mocked(m.eliminarPersonaje).mock.calls).toEqual([['barbaro'], ['enano']])
  })

  it('lo avisa en un diálogo', async () => {
    const avisos = dialogos()
    await sinCoherenciaDePrueba(escuadra, fuera, mapa(), avisos)
    expect(avisos.avisar.mock.lastCall?.[0].texto).toBe('Bárbaro y Enano han quedado fuera de la coherencia de Escuadra de monstruos 1 y desaparecen.')
  })
})

describe('ataque de escuadra en el banco de pruebas', () => {
  const sinCobertura = { ninguna: 0, ligera: 0, pesada: 0, bloqueante: 0 }
  const trayectoria = { casillas: [], aliados: 0, enemigos: 0, coberturas: sinCobertura, objetos: 0, muros: 0 }
  const barbaro = { ...enJuego, vida: 8 }
  const orco = (id: string, vida: number) => ({ ...enJuego, id, nombre: id, vida, jugador: 'oscuridad' })
  /** Mapa en juego con el bárbaro de Ana y dos orcos de la Oscuridad (2 y 1 de vida), que reduce la vida de verdad */
  function mapaDePrueba() {
    const estado = { estancias: [], turno: 1, escuadras: [{ id: 'escuadra-barbaro', nombre: 'Bárbaro', jugador: 'ana', personajes: [barbaro], turnos: [] }], personajesNoJugadores: [orco('orco-1', 2), orco('orco-2', 1)], jugadores: JUGADORES_DE_PRUEBA }
    return {
      mapa: estado,
      reducirVida: vi.fn((id: string, puntos: number) => void (estado.personajesNoJugadores = estado.personajesNoJugadores.map((p) => (p.id === id ? { ...p, vida: Math.max(0, p.vida - puntos) } : p)))),
      eliminarPersonaje: vi.fn(),
    } as unknown as MapaEnJuego & { reducirVida: ReturnType<typeof vi.fn>; eliminarPersonaje: ReturnType<typeof vi.fn> }
  }
  const ataqueDe = (atacante: PersonajeEnJuego, ...objetivos: PersonajeEnJuego[]): AtaqueDeEscuadra => ({
    ataques: [{ atacante, objetivo: objetivos[0], tipo: 'cuerpo-a-cuerpo', distancia: 1, trayectoria }],
    objetivos,
    sinAtacar: [],
  })
  const conReparto = (reparto: Record<string, number>) => ({ resolverAtaque: vi.fn(), repartirDano: vi.fn(async () => reparto), avisar: vi.fn(async (_aviso: { titulo: string; texto: string }) => {}) })
  vi.spyOn(console, 'log').mockImplementation(() => {})

  it('quita a cada objetivo el daño que se reparte en el diálogo', async () => {
    const mapa = mapaDePrueba()
    await atacarEscuadraDePrueba(ataqueDe(barbaro, orco('orco-1', 2), orco('orco-2', 1)), mapa, conReparto({ 'orco-1': 1, 'orco-2': 1 }))
    expect(mapa.reducirVida.mock.calls).toEqual([
      ['orco-1', 1],
      ['orco-2', 1],
    ])
  })

  it('elimina a quien se queda sin vida', async () => {
    const mapa = mapaDePrueba()
    await atacarEscuadraDePrueba(ataqueDe(barbaro, orco('orco-1', 2), orco('orco-2', 1)), mapa, conReparto({ 'orco-1': 1, 'orco-2': 1 }))
    expect(mapa.eliminarPersonaje.mock.calls).toEqual([['orco-2']])
  })

  it('tras atacar, a los atacantes no les quedan acciones', async () => {
    expect(await atacarEscuadraDePrueba(ataqueDe(barbaro, orco('orco-1', 2)), mapaDePrueba(), conReparto({}))).toEqual({ quedanAcciones: false })
  })

  it('si atacan monstruos a quien no lo es, fallan y no se reparte nada', async () => {
    const avisos = conReparto({})
    await atacarEscuadraDePrueba(ataqueDe(orco('orco-1', 2), barbaro), mapaDePrueba(), avisos)
    expect([avisos.repartirDano.mock.calls.length, avisos.avisar.mock.lastCall?.[0].texto]).toEqual([0, 'orco-1 ataca: ¡ups, ha fallado!'])
  })
})
