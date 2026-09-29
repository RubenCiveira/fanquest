import { describe, expect, it } from 'vitest'
import { crearEstancia } from './estancias'
import type { Mapa } from './modelo/mapa'
import { orientar } from './orientacion'
import { aparte, marcarAbierta, pegar, puertaEn } from './puertas'

const mapa: Mapa = { estancias: [orientar(crearEstancia({ id: 'sala', tipo: 'sala', columnas: 5, filas: 3 }), 'abajo', 1)] }
const salida = { estancia: 'sala', casilla: { x: 2, y: 2 } }

describe('puertas del mapa', () => {
  it('encuentra la puerta de una casilla', () => {
    expect(puertaEn(mapa, salida)).toMatchObject({ id: 'salida-1', tipo: 'salida' })
  })

  it('en una casilla sin puerta no hay puerta', () => {
    expect(puertaEn(mapa, { estancia: 'sala', casilla: { x: 1, y: 1 } })).toBeUndefined()
  })

  it('una puerta abierta recuerda a qué estancia da', () => {
    expect(puertaEn(marcarAbierta(mapa, salida, 'estancia-2'), salida)).toMatchObject({ abierta: true, destino: 'estancia-2' })
  })

  // la sala de 5 × 3 está en 0,0 y su salida, en 2,2 (muro de abajo): se sale a la casilla 2,3 del mapa
  const nueva = orientar(crearEstancia({ id: 'pasillo', tipo: 'pasillo', columnas: 3, filas: 4 }), 'abajo', 1)
  const entradaEnMapa = (e: ReturnType<typeof pegar>) => {
    const entrada = e.puertas.find((p) => p.tipo === 'entrada')
    return entrada && { x: (e.posicion?.x ?? 0) + entrada.casilla.x, y: (e.posicion?.y ?? 0) + entrada.casilla.y }
  }

  it('la entrada de la estancia nueva queda junto a la puerta, al otro lado del muro', () => {
    expect(entradaEnMapa(pegar(mapa, salida, nueva))).toEqual({ x: 2, y: 3 })
  })

  it('la estancia nueva se centra en su entrada', () => {
    expect(pegar(mapa, salida, nueva).posicion).toEqual({ x: 1, y: 3 })
  })

  it('la entrada de la estancia nueva queda abierta hacia la de la que se viene', () => {
    expect(pegar(mapa, salida, nueva).puertas.find((p) => p.tipo === 'entrada')).toMatchObject({ lado: 'arriba', abierta: true, destino: 'sala' })
  })

  it('si choca con otra estancia, se desliza por su muro sin separarse de la puerta', () => {
    const conVecina: Mapa = { estancias: [...mapa.estancias, { ...crearEstancia({ id: 'vecina', tipo: 'sala', columnas: 2, filas: 2 }), posicion: { x: 0, y: 3 } }] }
    const pegada = pegar(conVecina, salida, nueva)
    expect([pegada.posicion, entradaEnMapa(pegada)]).toEqual([{ x: 2, y: 3 }, { x: 2, y: 3 }])
  })

  it('una estancia sin puerta de la que salir va a la derecha de todo, con una casilla de separación', () => {
    expect(aparte(mapa)).toEqual({ x: 6, y: 0 })
  })
})
