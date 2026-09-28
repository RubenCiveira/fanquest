import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cargarMazos, type Mazos } from '../../../lib/mazos'
import { cargarAliados, cargarHeroes, cargarMonstruos, type GrupoAliados, type Heroe, type Monstruos } from '../../../lib/personajes'
import { generarMision } from '../../generar/lib/generador'
import { cargarPlantillaAventuras } from '../../generar/lib/plantilla'
import { CONFIG_EXTRAS_DEFECTO } from '../../generar/lib/reglasExtras'
import type { Mision, PlantillaAventuras } from '../../generar/lib/tipos'
import { TABLAS_ENCUENTROS } from '../config/encuentros'
import type { Modo } from '../config/mazos'
import { cartasDeAtrezo, letraSalaDeMision, pideErrantes, seccionDe } from '../config/partida'
import {
  aparecen,
  apariciones,
  anadirPuerta,
  candidatosDeCategoria,
  monstruosAlAzar,
  cambiarSinPuertas,
  cambiarVidaMonstruo,
  conMapa,
  quitarPuerta,
  secciones,
  volver,
  atrezoColocado,
  avanzar,
  botinDeZona,
  cargarTesoroEnInventario,
  buscarPuertasSecretas,
  buscarTrampas,
  cogerBotinSuelo,
  dejarTesoroEnSuelo,
  moverse,
  cambiarPeligro,
  carta,
  elegirAtrezo,
  entrar,
  entrarPorPuertaSecreta,
  filaEncuentro,
  miembrosDelGrupo,
  nuevaPartida,
  robarTesoro,
  resultados,
  tirarCarta,
  turnoBrujo,
  type Contexto,
  type Partida,
} from './partida'
import { nuevaConfiguracion, barajarYGuardar, type Configuracion } from './preparacion'

let mazos: Mazos
let plantilla: PlantillaAventuras
let heroes: Heroe[]
let aliados: GrupoAliados[]
let monstruos: Monstruos
beforeAll(async () => {
  ;[mazos, plantilla, heroes, aliados, monstruos] = await Promise.all([
    cargarMazos(),
    cargarPlantillaAventuras(),
    cargarHeroes(),
    cargarAliados(),
    cargarMonstruos(),
  ])
})

afterEach(() => {
  vi.restoreAllMocks()
})

const SIN_EXTRAS = { ...CONFIG_EXTRAS_DEFECTO, probUna: 0, probDos: 0 }
const mision = (regla = 1): Mision => ({ ...generarMision(plantilla, regla, SIN_EXTRAS), peligro: 0, dadoTrampa: 'D8' })
const contexto = (modo: Modo = 'losetas', m = mision()): Contexto => ({ mazos, mision: m, modo, heroes: 2, monstruos, seleccion: {} })

/** Todos los dados sacan su mínimo (0) o su máximo (0.999) */
const dados = (r: number) => vi.spyOn(Math, 'random').mockReturnValue(r)

function partida(ctx = contexto(), cambios: Partial<Partida> = {}): Partida {
  const c: Configuracion = barajarYGuardar(mazos, { ...nuevaConfiguracion(mazos, ctx.mision), modo: ctx.modo, heroes: ['barbaro', 'enano'] })
  return { ...nuevaPartida(ctx, c, []), ...cambios }
}

const pasos = (p: Partida) => p.zona.pendientes.map((paso) => paso.tipo)

describe('empezar la partida', () => {
  it('empieza en la Sala Inicial con la mazmorra en el orden barajado', () => {
    const m = mision()
    const c = barajarYGuardar(mazos, nuevaConfiguracion(mazos, m))
    const p = nuevaPartida(contexto('losetas', m), c, [])
    expect([p.zona.tipo, p.caminos]).toEqual(['inicial', [c.barajado?.orden.mazmorra]])
  })

  it('el Mazo de Cofres tiene los cofres que no están en el de atrezo', () => {
    const cofres = mazos.atrezo.cartas.filter((c) => c.tipo === 'cofre').reduce((n, c) => n + c.copias, 0)
    const p = partida()
    const enAtrezo = p.mazos.atrezo.filter((id) => id.startsWith('cofre')).length
    expect(p.mazos.cofres.length).toBe(cofres - enAtrezo)
  })

  it('el grupo empieza con todos sus Puntos de Cuerpo', () => {
    const c: Configuracion = { modo: 'losetas', mazos: {}, heroes: ['barbaro'], aliados: ['animales/pequeno-roedor'] }
    const miembros = miembrosDelGrupo(c, heroes, aliados)
    const p = nuevaPartida(contexto(), c, miembros)
    expect(p.vidas).toEqual(Object.fromEntries(miembros.map((m) => [m.clave, m.cuerpo])))
  })
})

describe('leer las cartas', () => {
  it('toda carta de mazmorra, salas y pasillo es una sección conocida', () => {
    const cartas = [...mazos.mazmorra.cartas, ...mazos.salas.cartas, ...mazos.pasillo.cartas]
    expect(new Set(cartas.map(seccionDe))).toEqual(new Set(['sala', 'especial', 'objetivo', 'pasillo', 'escaleras']))
  })

  it('los pasillos que piden monstruos errantes', () => {
    expect([...mazos.mazmorra.cartas, ...mazos.pasillo.cartas].filter(pideErrantes).map((c) => `${c.id}`)).toEqual([
      'pasillo-con-bifurcacion-2',
      'pasillo-3',
      'pasillo-2',
      'pasillo-6',
    ])
  })

  it('las salas normales grandes roban dos cartas de atrezo', () => {
    const dos = mazos.mazmorra.cartas.filter((c) => cartasDeAtrezo(c) === 2).map((c) => c.id)
    expect(dos).toEqual(['sala-normal-grande-1-puerta-1', 'sala-normal-grande-2-puertas-1'])
  })

  it('la Sala Especial de Misión 1 es la A', () => {
    expect(letraSalaDeMision(carta(mazos['salas-especiales'], 'sala-especial-de-mision-1'))).toBe('A')
  })
})

describe('abrir una puerta', () => {
  it('una sala normal pide atrezo, encuentro y dado de trampa, en ese orden', () => {
    const p = entrar(partida(contexto(), { caminos: [['sala-normal-mediana-1-puerta-1']] }), contexto(), {})
    expect([p.zona.tipo, pasos(p)]).toEqual(['sala', ['atrezo', 'encuentro', 'trampa']])
  })

  it('un pasillo con errantes pide la tabla de errantes antes del dado de trampa', () => {
    const p = entrar(partida(contexto(), { caminos: [['pasillo-3']] }), contexto(), {})
    expect(pasos(p)).toEqual(['errantes', 'trampa'])
  })

  it('una sala especial roba su carta antes del dado de trampa', () => {
    const p = entrar(partida(contexto(), { caminos: [['sala-especial-mediana-1-puerta-1']] }), contexto(), {})
    expect(pasos(p)).toEqual(['especial', 'trampa'])
  })

  it('en la Sala Objetivo hay monstruos y no se tira el dado de trampa', () => {
    const p = entrar(partida(contexto(), { caminos: [['sala-objetivo-grande-1']] }), contexto(), {})
    expect([p.hayMonstruos, pasos(p)]).toEqual([true, ['atrezo']])
  })

  it('sin cartas en el camino no se puede entrar', () => {
    const antes = partida(contexto(), { caminos: [[]] })
    expect(entrar(antes, contexto(), {})).toBe(antes)
  })

  it('una bifurcación reparte el resto del mazo entre las dos puertas', () => {
    const p = entrar(partida(contexto(), { caminos: [['pasillo-con-bifurcacion-1', 'a', 'b', 'c', 'd', 'e']] }), contexto(), {})
    expect(p.caminos).toEqual([['a', 'c', 'e'], ['b', 'd']])
  })

  it('una sala sin puertas une su camino con otro', () => {
    const p = entrar(
      partida(contexto(), { caminos: [['sala-normal-pequena-sin-puertas-1', 'a'], ['b']] }),
      contexto(),
      { puerta: 0 },
    )
    expect(p.caminos).toEqual([[], ['b', 'a']])
  })

  it('con tablero, un pasillo sale del Mazo de Pasillo y se rehace al acabarse', () => {
    const ctx = contexto('tablero')
    const p = entrar(partida(ctx, { mazos: { ...partida(ctx).mazos, pasillo: [] } }), ctx, { seccion: 'pasillo' })
    expect([p.zona.tipo, p.mazos.pasillo.length]).toEqual(['pasillo', 11])
  })

  it('con losetas, tras una puerta secreta se roban tres atrezos y se coloca uno', () => {
    const p = entrarPorPuertaSecreta(partida(), contexto())
    expect([p.zona.tipo, p.zona.pendientes[0]]).toEqual(['secreta', { tipo: 'atrezo', robar: 3, elegir: true }])
  })
})

describe('secuencia de exploración', () => {
  it('con 1-10 en la tabla de encuentros no hay monstruos y sube el peligro', () => {
    dados(0)
    const p = avanzar(partida(contexto(), { zona: { id: 1, salidas: [], tipo: 'sala', momentos: [], pendientes: [{ tipo: 'encuentro' }], sucesos: [] } }), contexto())
    expect([p.peligro, p.hayMonstruos]).toEqual([1, false])
  })

  it('con más de 10 en la tabla de encuentros hay monstruos', () => {
    dados(0.999)
    const p = avanzar(partida(contexto(), { zona: { id: 1, salidas: [], tipo: 'sala', momentos: [], pendientes: [{ tipo: 'encuentro' }], sucesos: [] } }), contexto())
    expect([p.peligro, p.hayMonstruos]).toEqual([0, true])
  })

  it('con un 1 en el dado de trampa se activa una y sube el peligro', () => {
    dados(0)
    const p = avanzar(partida(contexto(), { zona: { id: 1, salidas: [], tipo: 'sala', momentos: [], pendientes: [{ tipo: 'trampa' }], sucesos: [] } }), contexto())
    expect([p.peligro, p.zona.sucesos[0]]).toMatchObject([1, { tipo: 'trampa', valor: 1, carta: expect.any(String) }])
  })

  it('en la Sala Objetivo se roba atrezo hasta sacar uno con atrezo', () => {
    const p = avanzar(
      partida(contexto(), {
        mazos: { ...partida().mazos, atrezo: ['sin-atrezo-1', 'sin-atrezo-2', 'armario-1', 'mesa-1'] },
        zona: { id: 1, salidas: [], tipo: 'objetivo', momentos: [], pendientes: [{ tipo: 'atrezo', robar: 'hasta-con-atrezo' }], sucesos: [] },
      }),
      contexto(),
    )
    expect(p.mazos.atrezo).toEqual(['mesa-1'])
  })

  it('la sala especial sube el peligro y marca la primera especial', () => {
    const p = avanzar(partida(contexto(), { zona: { id: 1, salidas: [], tipo: 'especial', momentos: [], pendientes: [{ tipo: 'especial' }], sucesos: [] } }), contexto())
    expect([p.peligro, p.zona.momentos]).toEqual([1, ['especial', 'primera-especial']])
  })

  it('de tres cartas de atrezo se coloca la elegida y las demás vuelven al mazo', () => {
    const inicio = partida(contexto(), {
      mazos: { ...partida().mazos, atrezo: ['armario-1', 'mesa-1', 'trono-1', 'tumba-1'] },
      zona: { id: 1, salidas: [], tipo: 'secreta', momentos: [], pendientes: [{ tipo: 'atrezo', robar: 3, elegir: true }], sucesos: [] },
    })
    const p = elegirAtrezo(avanzar(inicio, contexto()), 'mesa-1')
    expect([atrezoColocado(p.zona), [...p.mazos.atrezo].sort()]).toEqual([['mesa-1'], ['armario-1', 'trono-1', 'tumba-1']])
  })
})

describe('nivel de peligro', () => {
  it('al llegar a 5 se añade un cofre al mazo de atrezo', () => {
    const antes = partida(contexto(), { peligro: 4 })
    const p = cambiarPeligro(antes, 1)
    expect([p.mazos.atrezo.length, p.mazos.cofres.length]).toEqual([antes.mazos.atrezo.length + 1, antes.mazos.cofres.length - 1])
  })

  it('volver a llegar a 5 no añade otro cofre', () => {
    const p = cambiarPeligro(cambiarPeligro(cambiarPeligro(partida(contexto(), { peligro: 4 }), 1), -1), 1)
    expect(p.cofres).toEqual([5])
  })

  it('no baja de 0 ni pasa de 10', () => {
    expect([cambiarPeligro(partida(), -1).peligro, cambiarPeligro(partida(contexto(), { peligro: 10 }), 1).peligro]).toEqual([0, 10])
  })
})

describe('acciones', () => {
  it('sin atributo de movimiento, moverse tira 2D6 y el dado de trampa', () => {
    const antes = partida(contexto(), { zona: { id: 1, salidas: [], tipo: 'sala', momentos: [], pendientes: [], sucesos: [] } })
    dados(0.999)
    expect(moverse(antes, contexto(), true).zona.sucesos.map((s) => s.tipo)).toEqual(['movimiento', 'trampa'])
  })

  it('donde ya se buscaron trampas, moverse solo tira el movimiento', () => {
    const antes = partida(contexto(), { zona: { id: 1, salidas: [], tipo: 'sala', momentos: [], pendientes: [], sucesos: [], sinTrampas: true } })
    expect(moverse(antes, contexto(), true).zona.sucesos).toMatchObject([{ tipo: 'movimiento', valores: [expect.any(Number), expect.any(Number)] }])
  })

  it('buscar trampas deja la sección sin tirar el dado de trampa', () => {
    const antes = partida(contexto(), { zona: { id: 1, salidas: [], tipo: 'sala', momentos: [], pendientes: [], sucesos: [] } })
    dados(0.999)
    const p = buscarTrampas(antes, contexto())
    const [s] = p.zona.sucesos
    expect([p.zona.sinTrampas, s.tipo === 'trampa' && s.carta]).toEqual([true, undefined])
  })

  it('con un 6 se encuentra una puerta secreta', () => {
    dados(0.999)
    expect(buscarPuertasSecretas(partida(), 2).zona.puertaSecreta).toBe(true)
  })

  it('revisar un mueble resuelve su tirada', () => {
    dados(0.999)
    const p = tirarCarta(partida(), contexto(), 'atrezo', 'armario-1')
    const s = p.zona.sucesos[0]
    const tirada = carta(mazos.atrezo, 'armario-1').tirada
    expect(s.tipo === 'tirada' && tirada && resultados(tirada, s.valores).map((r) => r.texto)).toEqual(['Una poción común al azar.'])
  })

  it('el Malvado Brujo con escudo negro sube el peligro', () => {
    dados(0.999)
    expect(turnoBrujo(partida(), contexto()).peligro).toBe(1)
  })

  it('un evento baja el peligro al jugarse', () => {
    dados(0)
    expect(turnoBrujo(partida(contexto(), { peligro: 3 }), contexto()).peligro).toBe(2)
  })

  it('«Repleta de trampas» baja el dado de trampa', () => {
    const ctx = contexto()
    const antes = partida(ctx, { peligro: 3 })
    // calavera, evento 1 y el 4 de la tabla de eventos
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(0.15)
    expect(turnoBrujo(antes, ctx).dadoTrampa).toBe('D6')
  })

  it('el contador de muerte del PNJ avanza en cada tirada de peligro que lo supera', () => {
    dados(0.999)
    expect(turnoBrujo(partida(contexto('losetas', mision(11))), contexto('losetas', mision(11))).contadorMuerte).toBe(1)
  })
})

describe('encuentros', () => {
  it('por encima de 30 se usa la última fila y con 10 o menos no hay fila', () => {
    const m = { ...mision(), faccion: { nombre: 'No muertos', errante: 'Zombi', erranteSuperior: 'Momia' } }
    expect([filaEncuentro(m, 35)?.resultado, filaEncuentro(m, 10)]).toEqual([30, undefined])
  })

  it('los monstruos se colocan de más débiles a los de ataque a distancia', () => {
    const e = TABLAS_ENCUENTROS['pieles-verdes'].encuentros.find((e) => e.resultado === 17)
    expect(e && apariciones(e, 2, monstruos).map((a) => a.monstruos[0])).toEqual(['goblin', 'orco-arquero'])
  })
})

describe('monstruos en juego', () => {
  const noMuertos = () => ({ ...mision(), faccion: { nombre: 'No muertos', errante: 'Zombi', erranteSuperior: 'Momia' } })

  it('un encuentro pone en juego sus monstruos con sus PC', () => {
    const ctx = contexto('losetas', noMuertos())
    const antes = partida(ctx, { zona: { id: 1, salidas: [], tipo: 'sala', momentos: [], pendientes: [{ tipo: 'encuentro' }], sucesos: [] } })
    dados(0.55) // un 12 en 1D20: con 2 héroes, 2 esqueletos
    expect(avanzar(antes, ctx).monstruos?.map((m) => [m.id, m.pc])).toEqual([
      ['esqueleto-1', monstruos.esqueleto.cuerpo],
      ['esqueleto-2', monstruos.esqueleto.cuerpo],
    ])
  })

  it('en la Sala Objetivo aparecen un errante por héroe y el Jefe Final', () => {
    const ctx = contexto('losetas', { ...noMuertos(), tipoJefe: 'Vampiro' })
    const p = entrar(partida(ctx, { caminos: [['sala-objetivo-grande-1']] }), ctx, {})
    expect(p.monstruos?.map((m) => m.id)).toEqual(['zombi-1', 'zombi-2', 'conde-vampiro-1'])
  })

  it('el Jefe Final lleva el nombre de la misión', () => {
    const ctx = contexto('losetas', { ...noMuertos(), tipoJefe: 'Vampiro', jefe: 'Vlad el Pálido' })
    const p = entrar(partida(ctx, { caminos: [['sala-objetivo-grande-1']] }), ctx, {})
    expect(p.monstruos?.at(-1)?.nombre).toBe('Vlad el Pálido')
  })

  it('cada monstruo recibe un nombre corto de su lista sin repetir', () => {
    const ctx = contexto()
    const p = aparecen(partida(ctx), ctx, [{ opciones: ['goblin'], avanzado: false, cantidad: 20 }])
    expect(new Set(p.monstruos?.map((m) => m.nombre))).toEqual(new Set(monstruos.goblin.nombres))
  })

  it('de varias opciones aparece la que tenéis preparada', () => {
    const ctx = { ...contexto(), seleccion: { 'horror-rosa': 3 } }
    const p = aparecen(partida(ctx), ctx, [{ opciones: ['desangrador-de-khorne', 'horror-rosa'], avanzado: false, cantidad: 1 }])
    expect(p.monstruos?.map((m) => m.monstruo)).toEqual(['horror-rosa'])
  })

  it('a 0 PC el monstruo muere y, sin monstruos, ya no hay monstruos en juego', () => {
    const ctx = contexto()
    const p = aparecen(partida(ctx), ctx, [{ opciones: ['goblin'], avanzado: false, cantidad: 1, cuerpo: 1 }])
    const tras = cambiarVidaMonstruo(p, 'goblin-1', -1)
    expect([tras.monstruos, tras.hayMonstruos]).toEqual([[], false])
  })
})

describe('tesoros en sala', () => {
  const conTesoro = () => {
    const ctx = contexto()
    const p = partida(ctx)
    return { ctx, p: { ...p, mazos: { ...p.mazos, tesoros: ['pequena-bolsa-de-oro-1'] } } }
  }

  it('robar tesoro muestra la carta sin cargarla automáticamente', () => {
    const { ctx, p } = conTesoro()
    const [id, tras] = robarTesoro(p, ctx)
    expect([id, tras.inventario?.barbaro?.oro]).toEqual(['pequena-bolsa-de-oro-1', undefined])
  })

  it('el tesoro puede cargarse en inventario o dejarse en el suelo', () => {
    const { ctx, p } = conTesoro()
    const cargado = cargarTesoroEnInventario(p, ctx, 'barbaro', 'pequena-bolsa-de-oro-1')
    const enSuelo = dejarTesoroEnSuelo(p, ctx, 'pequena-bolsa-de-oro-1')
    expect([cargado.inventario?.barbaro.oro, botinDeZona(enSuelo).map((b) => b.tipo === 'oro' && b.cantidad)]).toEqual([25, [25]])
  })

  it('cualquier héroe puede coger el botín del suelo', () => {
    const { ctx, p } = conTesoro()
    const enSuelo = dejarTesoroEnSuelo(p, ctx, 'pequena-bolsa-de-oro-1')
    const [botin] = botinDeZona(enSuelo)
    const cogido = cogerBotinSuelo(enSuelo, 'enano', botin.id)
    expect([cogido.inventario?.enano.oro, botinDeZona(cogido)]).toEqual([25, []])
  })
})

describe('mapa de la mazmorra', () => {
  const inicio = (caminos: string[][]) => partida(contexto(), { caminos })

  it('la puerta cruzada lleva a la nueva sección y esta recuerda su entrada', () => {
    const p = entrar(inicio([['pasillo-1', 'pasillo-2']]), contexto(), { puerta: 0 })
    const inicial = secciones(p)[0]
    expect([inicial.salidas[0].destino, p.zona.padre]).toEqual([p.zona.id, 0])
  })

  it('volver por la entrada recupera la sección anterior con lo que pasó en ella', () => {
    const ctx = contexto()
    const sala = avanzar(entrar(inicio([['sala-normal-mediana-1-puerta-1', 'pasillo-1']]), ctx, { puerta: 0 }), ctx)
    const deVuelta = volver(entrar(sala, ctx, { puerta: 0 }))
    expect([deVuelta.zona.id, deVuelta.zona.sucesos]).toEqual([sala.zona.id, sala.zona.sucesos])
  })

  it('avanzar por una puerta ya explorada no roba carta', () => {
    const ctx = contexto()
    const ida = entrar(inicio([['pasillo-1', 'pasillo-2']]), ctx, { puerta: 0 })
    const vuelta = entrar(volver(ida), ctx, { puerta: 0 })
    expect([vuelta.zona.id, vuelta.caminos]).toEqual([ida.zona.id, ida.caminos])
  })

  it('tras una bifurcación cada puerta roba de su mitad del mazo', () => {
    const ctx = contexto()
    const bifurcacion = entrar(inicio([['pasillo-con-bifurcacion-1', 'pasillo-1', 'pasillo-2', 'pasillo-3']]), ctx, { puerta: 0 })
    const segunda = entrar(volver(entrar(bifurcacion, ctx, { puerta: 0 })), ctx, { puerta: 1 })
    expect(segunda.zona.sucesos[0]).toEqual({ tipo: 'carta', mazo: 'mazmorra', id: 'pasillo-2' })
  })

  it('las partidas anteriores al mapa tienen una puerta por camino con cartas', () => {
    const { exploradas: _, ...antigua } = inicio([['a'], [], ['b']])
    const { id: __, salidas: ___, ...zona } = antigua.zona
    expect(conMapa({ ...antigua, zona } as Partida, 'losetas').zona.salidas).toEqual([{ camino: 0 }, { camino: 2 }])
  })

  it('en una partida anterior al mapa siempre se puede volver por la entrada', () => {
    const { exploradas: _, ...antigua } = inicio([[], ['b']])
    const zona = { tipo: 'sala', momentos: [], pendientes: [], sucesos: [{ tipo: 'carta', mazo: 'mazmorra', id: 'sala-normal-pequena-sin-puertas-1' }] }
    const p = volver(conMapa({ ...antigua, zona } as unknown as Partida, 'losetas'))
    expect([p.zona.nombre, p.zona.salidas]).toEqual(['Secciones ya exploradas', [{ destino: 1 }, { camino: 1 }]])
  })
})

describe('secciones sin puertas', () => {
  it('con tablero, una sala sin puertas no deja avanzar', () => {
    const ctx = contexto('tablero')
    const p = entrar(partida(ctx, { caminos: [['sala-normal-sin-puertas-1']] }), ctx, { seccion: 'sala' })
    expect([p.zona.sinPuertas, p.zona.salidas]).toEqual([true, []])
  })

  it('con losetas y otro camino en juego, la sala sin puertas no deja avanzar', () => {
    const p = entrar(partida(contexto(), { caminos: [['sala-normal-pequena-sin-puertas-1', 'a'], ['b']] }), contexto(), { puerta: 0 })
    expect([p.zona.sinPuertas, p.zona.salidas]).toEqual([true, []])
  })

  it('con losetas y un solo mazo, la carta pone una puerta para no quedar atrapados', () => {
    const p = entrar(partida(contexto(), { caminos: [['sala-normal-pequena-sin-puertas-1', 'a']] }), contexto(), { puerta: 0 })
    expect([p.zona.sinPuertas, p.zona.salidas]).toEqual([undefined, [{ camino: 0 }]])
  })

  it('la regla de la misión puede dejar la Sala Especial A sin puertas', () => {
    const ctx = contexto('losetas', mision(9))
    const antes = partida(ctx, {
      mazos: { ...partida(ctx).mazos, 'salas-especiales': ['sala-especial-de-mision-1'] },
      zona: { id: 1, salidas: [{ camino: 0 }], tipo: 'especial', momentos: [], pendientes: [{ tipo: 'especial' }], sucesos: [] },
    })
    const p = avanzar(antes, ctx)
    expect([p.zona.sinPuertas, p.zona.salidas]).toEqual([true, []])
  })
})

describe('editar las puertas', () => {
  const pasillo = (caminos: string[][]) => entrar(partida(contexto(), { caminos }), contexto(), { puerta: 0 })

  it('añadir una puerta reparte el mazo entre las dos, como una bifurcación', () => {
    const p = anadirPuerta(pasillo([['pasillo-1', 'a', 'b', 'c']]))
    expect([p.zona.salidas, p.caminos]).toEqual([[{ camino: 0 }, { camino: 1 }], [['a', 'c'], ['b']]])
  })

  it('quitar una puerta devuelve sus cartas al mazo de otra', () => {
    const p = quitarPuerta(anadirPuerta(pasillo([['pasillo-1', 'a', 'b', 'c']])))
    expect([p.zona.salidas, p.caminos[0].toSorted()]).toEqual([[{ camino: 0 }], ['a', 'b', 'c']])
  })

  it('sin puertas por delante la sección queda sin puertas', () => {
    expect(quitarPuerta(pasillo([['pasillo-1', 'a']])).zona.sinPuertas).toBe(true)
  })

  it('una puerta añadida vuelve a dejar avanzar', () => {
    expect(anadirPuerta(quitarPuerta(pasillo([['pasillo-1', 'a']]))).zona.sinPuertas).toBeUndefined()
  })

  it('no se quitan las puertas ya exploradas', () => {
    const ctx = contexto()
    const inicial = volver(entrar(partida(ctx, { caminos: [['pasillo-1', 'a']] }), ctx, { puerta: 0 }))
    expect(quitarPuerta(inicial)).toBe(inicial)
  })

  it('con tablero se marca si la sección no tiene puertas', () => {
    expect(cambiarSinPuertas(partida(contexto('tablero')), true).zona.sinPuertas).toBe(true)
  })
})

describe('monstruos al azar', () => {
  const pielesVerdes = () => ({ ...mision(), faccion: { nombre: 'Pieles-Verdes', errante: 'Orco', erranteSuperior: 'Fimir' } })

  it('se sortean entre los de esa categoría de la tabla de encuentros de la misión', () => {
    expect(candidatosDeCategoria(contexto('losetas', pielesVerdes()), 4).toSorted()).toEqual(['chaman-goblin', 'orco-negro'])
  })

  it('si la tabla no tiene ninguno de esa categoría, entre todos los del bestiario', () => {
    expect(candidatosDeCategoria(contexto('losetas', pielesVerdes()), 8).toSorted()).toEqual(['dragon-zombi', 'gran-dragon', 'principe-demonio'])
  })

  it('cada tirada pone en juego el monstruo que sale', () => {
    const ctx = contexto('losetas', pielesVerdes())
    const antes = partida(ctx)
    dados(0)
    const p = monstruosAlAzar(antes, ctx, 4, 2)
    const [primero] = candidatosDeCategoria(ctx, 4)
    expect(p.monstruos?.map((m) => m.monstruo)).toEqual([primero, primero])
  })
})
