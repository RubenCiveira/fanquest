import { describe, expect, it } from 'vitest'
import { GestorMapa, ruta, type ProveedorMapa } from '../gamemap'
import { escuadrasDePrueba } from './escuadras'
import { PuertasDePrueba } from './modelo/puerta'

/** Proveedor del banco de pruebas, sin diálogos: escuadras de prueba y siempre una sala de 6 × 4 hacia abajo con una salida */
function proveedorDePrueba() {
  const puertas = new PuertasDePrueba()
  const proveedor: ProveedorMapa = {
    configuracion: { ordenActivaciones: 'alternas', modosActivacion: 'agresivo-sigiloso', medicionMovimiento: 'ortogonal', terrenoPersonajes: 'normal' },
    confirmar: async () => true,
    describirEstancia: async () => ({ tipo: 'sala', tamano: { columnas: 6, filas: 4 }, orientacion: 'abajo', salidas: 1, elementos: [] }),
    ...escuadrasDePrueba(puertas),
    estanciaCreada: (estancia) => puertas.asociar(estancia),
  }
  return proveedor
}

/** El banco de pruebas de punta a punta: un gestor con la estancia inicial */
async function conSala(proveedor = proveedorDePrueba()) {
  const gestor = new GestorMapa(proveedor)
  await gestor.nuevaEstancia()
  return gestor
}

/** Estado del bárbaro en el mapa */
const barbaroDe = (gestor: GestorMapa) => gestor.mapa.escuadras?.[0].personajes.find((h) => h.id === 'barbaro')

/** Lleva al bárbaro a la casilla de la salida de la sala inicial */
async function barbaroEnLaSalida(gestor: GestorMapa) {
  const sala = gestor.mapa.estancias[0]
  const casilla = barbaroDe(gestor)?.casilla
  const salida = sala.puertas.find((p) => p.tipo === 'salida')
  if (!casilla || !salida) throw new Error('La sala de prueba no tiene bárbaro o salida')
  // la sala inicial está en 0,0: sus casillas son las del mapa
  await gestor.moverPersonaje('barbaro', ruta(gestor.mapa, casilla, salida.casilla) ?? [])
  return { estancia: sala.id, casilla: salida.casilla }
}

describe('banco de pruebas', () => {
  it('al empezar, ningún personaje está en una puerta: no hay nada que abrir', async () => {
    const gestor = await conSala()
    expect((await gestor.accionesDisponibles('escuadra-barbaro', 'barbaro')).map((a) => a.id)).not.toContain('abrir-puerta')
  })

  it('en la casilla de la salida, el personaje puede abrir la puerta', async () => {
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

  it('tras abrir la puerta, en otro turno el personaje cruza a la estancia de detrás', async () => {
    const gestor = await conSala()
    const { casilla } = await barbaroEnLaSalida(gestor)
    await gestor.ejecutarAccion('escuadra-barbaro', 'abrir-puerta', 'barbaro')
    // abrir la puerta completa la activación del bárbaro: termina el turno para que pueda volver a moverse
    await gestor.ejecutarAccion('escuadra-enano', 'terminar-turno')
    gestor.terminarTurno()
    const dentro = { x: casilla.x, y: casilla.y + 2 }
    expect(await gestor.moverPersonaje('barbaro', ruta(gestor.mapa, casilla, dentro) ?? [])).toBeUndefined()
    expect(barbaroDe(gestor)?.estancia).toBe(gestor.mapa.estancias[1].id)
  })

  it('la puerta se abre en el gestor que la usa, aunque otro gestor haya avisado de las mismas estancias', async () => {
    const proveedor = proveedorDePrueba()
    const gestor = await conSala(proveedor)
    // como StrictMode al crear dos veces la página: otro gestor con el mismo mapa y proveedor avisa de sus estancias
    const otro = new GestorMapa(proveedor, gestor.mapa)
    gestor.mapa.estancias.forEach((e) => proveedor.estanciaCreada(e, otro))
    await barbaroEnLaSalida(gestor)
    await gestor.ejecutarAccion('escuadra-barbaro', 'abrir-puerta', 'barbaro')
    expect([gestor.mapa.estancias.length, otro.mapa.estancias.length]).toEqual([2, 1])
  })
})
