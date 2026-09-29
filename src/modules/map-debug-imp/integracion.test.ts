import { describe, expect, it } from 'vitest'
import { extenderRecorrido, GestorMapa, type ProveedorMapa } from '../gamemap'
import { escuadrasDePrueba } from './escuadras'

/** El banco de pruebas de punta a punta: escuadras de prueba y una sala de 6 × 4 hacia abajo con una salida */
async function conSala() {
  const proveedor: ProveedorMapa = {
    configuracion: { ordenActivaciones: 'alternas', modosActivacion: 'agresivo-sigiloso' },
    confirmar: async () => true,
    describirEstancia: async () => ({ tipo: 'sala', tamano: { columnas: 6, filas: 4 }, orientacion: 'abajo', salidas: 1, elementos: [] }),
    ...escuadrasDePrueba,
  }
  const gestor = new GestorMapa(proveedor)
  await gestor.nuevaEstancia()
  return gestor
}

/** Lleva al bárbaro a la casilla de la salida de la sala inicial */
async function barbaroEnLaSalida(gestor: GestorMapa) {
  const sala = gestor.mapa.estancias[0]
  const barbaro = sala.elementos.find((el) => el.id === 'barbaro')
  const salida = sala.puertas.find((p) => p.tipo === 'salida')
  if (barbaro?.tipo !== 'heroe' || !barbaro.posicion || !salida) throw new Error('La sala de prueba no tiene bárbaro o salida')
  // la sala inicial está en 0,0: sus casillas son las del mapa
  await gestor.moverHeroe('barbaro', extenderRecorrido(gestor.mapa, barbaro, [barbaro.posicion], salida.casilla))
  return { estancia: sala.id, casilla: salida.casilla }
}

describe('banco de pruebas', () => {
  it('al empezar, ningún héroe está en una puerta: no hay nada que abrir', async () => {
    const gestor = await conSala()
    expect((await gestor.accionesDisponibles('escuadra-barbaro', 'barbaro')).map((a) => a.id)).not.toContain('abrir-puerta')
  })

  it('en la casilla de la salida, el héroe puede abrir la puerta', async () => {
    const gestor = await conSala()
    await barbaroEnLaSalida(gestor)
    expect((await gestor.accionesDisponibles('escuadra-barbaro', 'barbaro')).map((a) => a.id)).toContain('abrir-puerta')
  })

  it('abrir la puerta añade la estancia de detrás y la deja abierta', async () => {
    const gestor = await conSala()
    const salida = await barbaroEnLaSalida(gestor)
    await gestor.ejecutarAccion('escuadra-barbaro', 'abrir-puerta', 'barbaro')
    expect([gestor.mapa.estancias.length, gestor.puertaEn(salida)?.abierta]).toEqual([2, true])
  })

  it('la estancia abierta queda con su entrada abierta pegada a la puerta, al otro lado del muro', async () => {
    const gestor = await conSala()
    const { casilla } = await barbaroEnLaSalida(gestor)
    await gestor.ejecutarAccion('escuadra-barbaro', 'abrir-puerta', 'barbaro')
    const nueva = gestor.mapa.estancias[1]
    const entrada = nueva.puertas.find((p) => p.tipo === 'entrada')
    expect({ x: (nueva.posicion?.x ?? 0) + (entrada?.casilla.x ?? -9), y: (nueva.posicion?.y ?? 0) + (entrada?.casilla.y ?? -9), abierta: entrada?.abierta }).toEqual({
      x: casilla.x,
      y: casilla.y + 1,
      abierta: true,
    })
  })

  it('tras abrir la puerta, en otro turno el héroe cruza a la estancia de detrás', async () => {
    const gestor = await conSala()
    const { casilla } = await barbaroEnLaSalida(gestor)
    await gestor.ejecutarAccion('escuadra-barbaro', 'abrir-puerta', 'barbaro')
    // abrir la puerta completa la activación del bárbaro: termina el turno para que pueda volver a moverse
    await gestor.ejecutarAccion('escuadra-enano', 'terminar-turno')
    gestor.terminarTurno()
    const barbaro = gestor.mapa.estancias[0].elementos.find((el) => el.id === 'barbaro')
    if (barbaro?.tipo !== 'heroe') throw new Error('El bárbaro no está en la sala inicial')
    const dentro = { x: casilla.x, y: casilla.y + 2 }
    expect(await gestor.moverHeroe('barbaro', extenderRecorrido(gestor.mapa, barbaro, [casilla], dentro))).toBeUndefined()
    expect(gestor.mapa.estancias[1].elementos.map((el) => el.id)).toContain('barbaro')
  })
})
