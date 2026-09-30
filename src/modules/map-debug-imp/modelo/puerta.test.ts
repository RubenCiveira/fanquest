import { describe, expect, it, vi } from 'vitest'
import type { MapaEnJuego, Puerta } from '../../gamemap'
import { crearEstancia, orientar } from '../../gamemap'
import { AbrirPuerta } from './abrirPuerta'
import { PuertaDePrueba, PuertasDePrueba } from './puerta'

const donde = { estancia: 'estancia-1', casilla: { x: 2, y: 3 } }
const mapaCon = (puerta?: Puerta): MapaEnJuego => ({
  mapa: { estancias: [] },
  puertaEn: () => puerta,
  tieneFlag: () => false,
  marcarFlag: vi.fn(),
  dameLoQueEstaAlLado: () => [],
  tieneFlagMueble: () => false,
  marcarFlagMueble: vi.fn(),
  quitarElemento: vi.fn(),
  reducirVida: vi.fn(),
  eliminarPersonaje: vi.fn(),
  abrirPuerta: vi.fn(),
  anadirPersonajes: vi.fn(),
  anadirMuebles: vi.fn(),
  cambiarJugadores: vi.fn(),
  terminarTurno: vi.fn(),
})
const salida: Puerta = { id: 'salida-1', tipo: 'salida', casilla: donde.casilla, lado: 'abajo' }

describe('puertas de prueba', () => {
  it('la puerta está abierta si lo está la del mapa que se le pasa', () => {
    const puerta = new PuertaDePrueba(donde, 'salida')
    expect([puerta.abierta(mapaCon(salida)), puerta.abierta(mapaCon({ ...salida, abierta: true }))]).toEqual([false, true])
  })

  it('abrir la puerta pide al mapa que se le pasa abrir la de su casilla', async () => {
    const mapa = mapaCon(salida)
    await new PuertaDePrueba(donde, 'salida').abrir(mapa)
    expect(mapa.abrirPuerta).toHaveBeenCalledWith(donde)
  })

  it('una salida cerrada ofrece abrirse', () => {
    expect(new PuertaDePrueba(donde, 'salida').acciones(mapaCon(salida)).map((a) => [a.id, a instanceof AbrirPuerta])).toEqual([['abrir-puerta', true]])
  })

  it('una puerta abierta, o la entrada, no ofrecen nada', () => {
    expect([new PuertaDePrueba(donde, 'salida').acciones(mapaCon({ ...salida, abierta: true })), new PuertaDePrueba(donde, 'entrada').acciones(mapaCon(salida))]).toEqual([
      [],
      [],
    ])
  })

  it('el comando abre la puerta en el mapa con el que se ofreció', async () => {
    const mapa = mapaCon(salida)
    const [abrir] = new PuertaDePrueba(donde, 'salida').acciones(mapa)
    await (abrir as AbrirPuerta).hacer()
    expect(mapa.abrirPuerta).toHaveBeenCalledWith(donde)
  })

  it('al crearse una estancia, cada puerta suya tiene su puerta de prueba', () => {
    const puertas = new PuertasDePrueba()
    const sala = orientar(crearEstancia({ id: 'estancia-1', tipo: 'sala', columnas: 5, filas: 4 }), 'abajo', 1)
    puertas.asociar(sala)
    expect(sala.puertas.map((p) => puertas.en({ estancia: 'estancia-1', casilla: p.casilla })?.tipo)).toEqual(['entrada', 'salida'])
  })

  it('los objetos de una casilla son su puerta de prueba, si la hay', () => {
    const puertas = new PuertasDePrueba()
    puertas.asociar({ id: 'estancia-1', tipo: 'sala', columnas: 5, filas: 4, puertas: [salida], elementos: [], estancias: [] })
    expect([puertas.objetosEn(donde).length, puertas.objetosEn({ ...donde, casilla: { x: 0, y: 0 } })]).toEqual([1, []])
  })
})
