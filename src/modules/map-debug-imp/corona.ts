import type { Casilla } from '../gamemap'

/** Las ocho direcciones alrededor de una ficha, empezando por arriba y en el sentido de las agujas del reloj */
const DIRECCIONES = [-90, -45, 0, 45, 90, 135, 180, 225].map((grados) => (grados * Math.PI) / 180)

/**
 * Sitios para `n` botones alrededor de `cx`, `cy` (con casillas de `lado`
 * de ancho) que no caigan sobre las casillas de `evitar` (otras fichas, que
 * así se pueden seguir pulsando y arrastrando): repartidos entre las
 * direcciones libres del anillo cercano y, si no bastan, también del lejano.
 * Si ni así hay sitio, en círculo
 */
export function sitiosDeBotones(cx: number, cy: number, n: number, evitar: Casilla[], lado: number) {
  const anillo = (radio: number) => DIRECCIONES.map((a) => ({ x: cx + radio * Math.cos(a), y: cy + radio * Math.sin(a) }))
  const libre = ({ x, y }: { x: number; y: number }) => !evitar.some((c) => c.x === Math.floor(x / lado) && c.y === Math.floor(y / lado))
  const cerca = anillo(lado * 1.3).filter(libre)
  if (cerca.length >= n) return Array.from({ length: n }, (_, i) => cerca[Math.floor((i * cerca.length) / n)])
  const libres = [...cerca, ...anillo(lado * 2.3).filter(libre)]
  if (libres.length >= n) return libres.slice(0, n)
  return Array.from({ length: n }, (_, i) => {
    const angulo = (2 * Math.PI * i) / n - Math.PI / 2
    return { x: cx + lado * 1.3 * Math.cos(angulo), y: cy + lado * 1.3 * Math.sin(angulo) }
  })
}
