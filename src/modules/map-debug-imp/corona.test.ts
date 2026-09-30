import { describe, expect, it } from 'vitest'
import { sitiosDeBotones } from './corona'

const LADO = 10
/** Casilla en que cae cada botón */
const casillas = (sitios: { x: number; y: number }[]) => sitios.map(({ x, y }) => ({ x: Math.floor(x / LADO), y: Math.floor(y / LADO) }))
/** Ficha en la casilla 5,5: su centro */
const [cx, cy] = [55, 55]

describe('botones de la corona', () => {
  it('sin fichas alrededor, se reparten empezando por arriba', () => {
    expect(casillas(sitiosDeBotones(cx, cy, 2, [], LADO))).toEqual([
      { x: 5, y: 4 },
      { x: 5, y: 6 },
    ])
  })

  it('no tapan la ficha que hay justo debajo', () => {
    expect(casillas(sitiosDeBotones(cx, cy, 2, [{ x: 5, y: 6 }], LADO))).not.toContainEqual({ x: 5, y: 6 })
  })

  it('si las casillas de al lado están ocupadas, van al anillo lejano sin tapar ninguna', () => {
    const alrededor = [4, 5, 6].flatMap((x) => [4, 5, 6].map((y) => ({ x, y })))
    const sitios = casillas(sitiosDeBotones(cx, cy, 3, alrededor, LADO))
    expect(sitios.some((c) => alrededor.some((o) => o.x === c.x && o.y === c.y))).toBe(false)
  })
})
