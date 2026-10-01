import { describe, expect, it } from 'vitest'
import { aAgrupar, recorridoParaAgrupar } from './agrupar'
import { crearEstancia } from './estancias'
import type { Casilla } from './modelo/casilla'
import type { Configuracion } from './modelo/configuracion'
import type { Objeto } from './modelo/elemento'
import type { Mapa } from './modelo/mapa'
import type { OpcionesMovimiento } from './modelo/opcionesMovimiento'
import type { Personaje } from './modelo/personaje'

const personaje = (id: string, casilla?: Casilla): Personaje => ({ id, nombre: id, estancia: 'sala', ...(casilla && { casilla }), turnos: [] })
const barbaro = personaje('barbaro', { x: 0, y: 0 })
const mover = { id: 'mover', nombre: 'Mover', icono: '🥾' }
/** Le quedan `n` casillas de movimiento base y, además, deslizar 3 con otra acción */
const quedan = (n: number): OpcionesMovimiento => ({
  base: { id: 'mover', nombre: 'Mover', tipo: 'normal', accion: mover, tramos: [{ distancia: n }] },
  variaciones: [{ id: 'deslizar', nombre: 'Deslizar', tipo: 'normal', accion: mover, tramos: [{ distancia: n }, { distancia: 3, accion: { id: 'deslizar', nombre: 'Deslizar', icono: '💨' } }] }],
})
const config: Pick<Configuracion, 'medicionMovimiento' | 'terrenoPersonajes' | 'distanciaControl' | 'cuerpoACuerpo'> = { medicionMovimiento: 'ortogonal', terrenoPersonajes: 'normal', distanciaControl: 0, cuerpoACuerpo: 'diagonal' }
/** Sala de columnas × filas con la escuadra de esos personajes, esos objetos y, si se dice, un orco hostil */
const sala = (personajes: Personaje[], { objetos = [], orco, columnas = 6, filas = 3 }: { objetos?: Objeto[]; orco?: Casilla; columnas?: number; filas?: number } = {}): Mapa => ({
  estancias: [{ ...crearEstancia({ id: 'sala', tipo: 'sala', columnas, filas }), elementos: objetos }],
  escuadras: [{ id: 'rojos', nombre: 'Rojos', jugador: 'ana', personajes, turnos: [] }],
  ...(orco && {
    personajesNoJugadores: [{ id: 'orco', nombre: 'Orco', estancia: 'sala', casilla: orco, turnos: [], jugador: 'oscuridad' }],
    jugadores: {
      alianzas: [
        { id: 'heroes', nombre: 'Héroes' },
        { id: 'monstruos', nombre: 'Monstruos', posturas: { heroes: 'hostil' as const } },
      ],
      jugadores: [
        { id: 'ana', nombre: 'Ana', tipo: 'humano' as const, alianza: 'heroes' },
        { id: 'oscuridad', nombre: 'La Oscuridad', tipo: 'ia' as const, alianza: 'monstruos' },
      ],
    },
  }),
})
/** A dónde llega el elfo al agruparse con el bárbaro */
const destino = (m: Mapa, elfo: Personaje, opciones = quedan(6), reglas = config) => recorridoParaAgrupar(m, reglas, barbaro, elfo, opciones)?.recorrido.at(-1)

describe('agruparse con el movimiento restante', () => {
  it('con movimiento de sobra, llega a la casilla libre más cercana al que agrupa', () => {
    const elfo = personaje('elfo', { x: 5, y: 2 })
    expect(destino(sala([barbaro, elfo]), elfo)).toEqual({ x: 1, y: 0 })
  })

  it('el movimiento que usa es el de su opción base', () => {
    const elfo = personaje('elfo', { x: 5, y: 2 })
    expect(recorridoParaAgrupar(sala([barbaro, elfo]), config, barbaro, elfo, quedan(6))?.opcion.id).toBe('mover')
  })

  it('sin movimiento para llegar a su lado, se acerca todo lo que puede', () => {
    const elfo = personaje('elfo', { x: 5, y: 0 })
    expect(destino(sala([barbaro, elfo], { filas: 1 }), elfo, quedan(2))).toEqual({ x: 3, y: 0 })
  })

  it('no usa acciones adicionales (deslizar) para llegar', () => {
    const elfo = personaje('elfo', { x: 5, y: 0 })
    expect(destino(sala([barbaro, elfo], { filas: 1 }), elfo, quedan(2))).not.toEqual({ x: 1, y: 0 })
  })

  it('sin movimiento restante, no se mueve', () => {
    const elfo = personaje('elfo', { x: 5, y: 0 })
    expect(recorridoParaAgrupar(sala([barbaro, elfo], { filas: 1 }), config, barbaro, elfo, quedan(0))).toBeUndefined()
  })

  it('el que ya está a su lado no se mueve', () => {
    const elfo = personaje('elfo', { x: 1, y: 1 })
    expect(recorridoParaAgrupar(sala([barbaro, elfo]), config, barbaro, elfo, quedan(6))).toBeUndefined()
  })

  it('no ocupa casillas con objetos', () => {
    const elfo = personaje('elfo', { x: 5, y: 2 })
    const cofre: Objeto = { id: 'cofre', tipo: 'objeto', nombre: 'Cofre', columnas: 1, filas: 1, posicion: { x: 1, y: 0 } }
    expect(destino(sala([barbaro, elfo], { objetos: [cofre] }), elfo)).toEqual({ x: 0, y: 1 })
  })

  it('no pasa a través de un enemigo ni se pone en su casilla', () => {
    const elfo = personaje('elfo', { x: 5, y: 2 })
    expect(destino(sala([barbaro, elfo], { orco: { x: 1, y: 0 } }), elfo)).toEqual({ x: 0, y: 1 })
  })

  it('no entra en la zona de control de un enemigo: se acerca hasta su borde', () => {
    // el orco en 3,1 controla de 2,0 a 4,2, toda la anchura de la sala: el elfo de 5,2 no la cruza y sube a 5,0, lo más cerca del bárbaro que puede
    const elfo = personaje('elfo', { x: 5, y: 2 })
    const conControl = { ...config, distanciaControl: 1 }
    expect(destino(sala([barbaro, elfo], { orco: { x: 3, y: 1 } }), elfo, quedan(6), conControl)).toEqual({ x: 5, y: 0 })
  })

  it('solo agrupa a los demás de su escuadra que están colocados', () => {
    const m = sala([barbaro, personaje('elfo', { x: 5, y: 2 }), personaje('enano')])
    expect(aAgrupar(m, 'barbaro').map((p) => p.id)).toEqual(['elfo'])
  })
})
