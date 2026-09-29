import { describe, expect, it } from 'vitest'
import type { Partida, Zona } from './partida'
import {
  adyacentes,
  casillaCercana,
  colocar,
  encajar,
  fijarRejilla,
  fijarTamano,
  girar,
  mueve,
  pared,
  puertaEn,
  redimensionar,
  rejillaDe,
  renombrar,
  tamanoZona,
  type Pieza,
  type Rejilla,
} from './rejilla'

const zona = (tipo: Zona['tipo'], cartas: string[] = []): Zona => ({
  id: 1,
  tipo,
  salidas: [],
  momentos: [],
  pendientes: [],
  sucesos: cartas.map((id) => ({ tipo: 'carta', mazo: 'mazmorra', id })),
})

const vacia: Rejilla = { columnas: 6, filas: 4, piezas: [] }
const heroe = (x: number, y: number): Pieza => ({ id: 'borin', tipo: 'miembro', x, y })
const mueble = (atrezo: string, x = 0, y = 0): Pieza => ({ id: atrezo, tipo: 'atrezo', atrezo, x, y })

describe('rejilla del mapa', () => {
  it('toma el tamaño de la loseta de la carta', () => {
    expect(tamanoZona(zona('sala', ['sala-normal-grande-1-puerta-1']))).toEqual({ columnas: 8, filas: 6 })
  })

  it('las escaleras «mediana o pequeña» son medianas', () => {
    expect(tamanoZona(zona('escaleras', ['sala-escaleras-mediana-o-pequena-1']))).toEqual({ columnas: 6, filas: 4 })
  })

  it('un pasillo es estrecho', () => {
    expect(tamanoZona(zona('pasillo'))).toEqual({ columnas: 2, filas: 7 })
  })

  it('al llegar a una zona se guarda su tamaño', () => {
    const p = { zona: zona('sala', ['sala-normal-pequena-1-puerta-1']) } as Partida
    expect(fijarRejilla(p).zona.rejilla).toEqual({ columnas: 4, filas: 3, piezas: [] })
  })

  it('una rejilla guardada no se vuelve a calcular', () => {
    const p = { zona: { ...zona('sala'), rejilla: vacia } } as Partida
    expect(fijarRejilla(p)).toBe(p)
  })

  it('una zona sin rejilla empieza vacía', () => {
    expect(rejillaDe(zona('inicial')).piezas).toEqual([])
  })

  it('mueve una pieza ya colocada', () => {
    expect(colocar(colocar(vacia, heroe(0, 0)), heroe(2, 1)).piezas).toEqual([heroe(2, 1)])
  })

  it('no coloca fuera de la rejilla', () => {
    expect(colocar(vacia, mueble('armario', 4, 0))).toBe(vacia)
  })

  it('no pone dos miniaturas en la misma casilla', () => {
    const r = colocar(vacia, { id: 'orco-1', tipo: 'monstruo', x: 1, y: 1 })
    expect(colocar(r, heroe(1, 1))).toBe(r)
  })

  it('una miniatura puede subirse a la mesa', () => {
    expect(colocar(colocar(vacia, mueble('mesa')), heroe(2, 1)).piezas).toHaveLength(2)
  })

  it('una miniatura no puede estar sobre un armario', () => {
    const r = colocar(vacia, mueble('armario'))
    expect(colocar(r, heroe(2, 0))).toBe(r)
  })

  it('girar el mobiliario cambia las casillas que ocupa', () => {
    const r = girar(colocar(vacia, mueble('armario')), 'armario')
    expect(colocar(r, heroe(2, 0)).piezas).toHaveLength(2)
  })

  it('al girar junto al borde, el mobiliario se desplaza para caber', () => {
    expect(girar(colocar(vacia, mueble('armario', 3, 3)), 'armario').piezas).toMatchObject([{ x: 3, y: 1, girada: true }])
  })

  it('dentro del mapa, la casilla bajo el puntero', () => {
    expect(casillaCercana(2.9, 1.1, vacia)).toEqual({ x: 2, y: 1 })
  })

  it('cerca del borde, atrae a la casilla más próxima', () => {
    expect(casillaCercana(6.4, -0.3, vacia)).toEqual({ x: 5, y: 0 })
  })

  it('con el mapa desplazado, las casillas ocultas no reciben fichas', () => {
    expect(casillaCercana(1.5, 1, vacia, { desde: 2, hasta: 6 })).toBeUndefined()
  })

  it('con el mapa desplazado, atrae en el borde real que se ve', () => {
    expect(casillaCercana(6.3, 1, vacia, { desde: 2, hasta: 6 })).toEqual({ x: 5, y: 1 })
  })

  it('lejos del mapa no hay casilla', () => {
    expect(casillaCercana(7, 1, vacia)).toBeUndefined()
  })

  it('el mobiliario soltado junto al borde se encaja dentro', () => {
    expect(encajar(vacia, mueble('mesa', 5, 3))).toMatchObject({ x: 3, y: 2 })
  })

  it('entrar en el mapa desde la bandeja es moverse', () => {
    expect(mueve(vacia, heroe(0, 0))).toBe(true)
  })

  it('soltar en la misma casilla no es moverse', () => {
    expect(mueve(colocar(vacia, heroe(1, 1)), heroe(1, 1))).toBe(false)
  })

  it('soltar donde no cabe no es moverse', () => {
    expect(mueve(colocar(vacia, mueble('armario')), heroe(1, 0))).toBe(false)
  })

  const puerta = (id: string, x: number, y: number): Pieza => ({ id, tipo: 'puerta', x, y })

  it('una puerta va en el borde del mapa', () => {
    expect(colocar(vacia, puerta('entrada', 0, 2)).piezas).toHaveLength(1)
  })

  it('una puerta no va en mitad de la sala', () => {
    expect(colocar(vacia, puerta('entrada', 2, 2))).toBe(vacia)
  })

  it('una miniatura puede pisar una puerta', () => {
    expect(colocar(colocar(vacia, puerta('salida-0', 5, 1)), heroe(5, 1)).piezas).toHaveLength(2)
  })

  it('encuentra la puerta de una casilla', () => {
    expect(puertaEn(colocar(vacia, puerta('salida-0', 5, 1)), 5, 1)?.id).toBe('salida-0')
  })

  it('la puerta se dibuja en su pared', () => {
    expect([pared(vacia, puerta('a', 0, 2)), pared(vacia, puerta('b', 5, 1)), pared(vacia, puerta('c', 2, 0)), pared(vacia, puerta('d', 2, 3))]).toEqual([
      'izquierda',
      'derecha',
      'arriba',
      'abajo',
    ])
  })

  it('una puerta que pasa a ser salida conserva su sitio', () => {
    expect(renombrar(colocar(vacia, puerta('nueva', 0, 1)), 'nueva', 'salida-2').piezas).toEqual([puerta('salida-2', 0, 1)])
  })

  it('el atrezo pegado a una miniatura es el que puede revisar', () => {
    const r = colocar(colocar(vacia, mueble('armario', 0, 0)), mueble('cofre', 5, 3))
    expect(adyacentes(r, heroe(1, 1)).map((p) => p.id)).toEqual(['armario'])
  })

  it('en diagonal no se está junto al atrezo', () => {
    expect(adyacentes(colocar(vacia, mueble('cofre', 0, 0)), heroe(1, 1))).toEqual([])
  })

  it('el tamaño elegido al descubrir la zona queda fijo', () => {
    expect(fijarTamano(vacia, 5, 3)).toEqual({ columnas: 5, filas: 3, piezas: [], fija: true })
  })

  it('al encoger, lo que queda fuera vuelve a la bandeja', () => {
    expect(redimensionar(colocar(vacia, heroe(5, 3)), 4, 4).piezas).toEqual([])
  })
})
