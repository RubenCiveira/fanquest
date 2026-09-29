// Recorta las hojas de héroes (`<clase>-<hombre|mujer>.png`) en imprimibles:
//   papermini/  frente y espalda de la miniatura, sin la cota de 28 mm
//   vtt-face/   primera ficha (retrato)
//   vtt-heroe/  tercera ficha (héroe visto desde arriba)
// Uso: pnpm heroes:recortar [carpeta-de-hojas]
// No sobrescribe imágenes ya generadas: para regenerar una, bórrala antes.
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import sharp from 'sharp'

const ORIGEN = resolve(process.argv[2] ?? '../ref/images/heroes')
const DESTINO = resolve(import.meta.dirname, '../templates/heroes/printables')
const OSCURO = 128
const MARGEN = 8
// Píxeles que se descartan junto a cada línea de panel por el antialiasing.
const SANGRADO = 3

// Tramos consecutivos de índices que cumplen `cumple`.
function tramos(desde, hasta, cumple) {
  const resultado = []
  let inicio = null
  for (let i = desde; i <= hasta; i++) {
    if (i < hasta && cumple(i)) inicio ??= i
    else if (inicio !== null) {
      resultado.push([inicio, i - 1])
      inicio = null
    }
  }
  return resultado
}

async function cargar(archivo) {
  const { data, info } = await sharp(archivo)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { width: ancho, height: alto } = info
  const oscuro = (x, y) => data[y * ancho + x] < OSCURO
  const enFila = (y, x0, x1) => {
    let n = 0
    for (let x = x0; x <= x1; x++) n += oscuro(x, y)
    return n
  }
  const enColumna = (x, y0, y1) => {
    let n = 0
    for (let y = y0; y <= y1; y++) n += oscuro(x, y)
    return n
  }
  return { ancho, alto, oscuro, enFila, enColumna }
}

// Interiores de los tres paneles, separados por líneas verticales que
// ocupan casi todo el alto de la hoja aunque el dibujo las cruce.
function paneles({ ancho, alto, enFila, enColumna }) {
  const bordesY = tramos(0, alto, (y) => enFila(y, 0, ancho - 1) > ancho * 0.9)
  const [top, bottom] = [bordesY[0][1] + SANGRADO, bordesY.at(-1)[0] - SANGRADO]
  const lineas = tramos(0, ancho, (x) => enColumna(x, top, bottom) > (bottom - top) * 0.75)
  if (lineas.length !== 4) throw new Error(`se esperaban 3 paneles y hay ${lineas.length - 1}`)
  return lineas.slice(0, 3).map(([, fin], i) => ({
    left: fin + SANGRADO,
    right: lineas[i + 1][0] - SANGRADO,
    top,
    bottom,
  }))
}

// Figura de la miniatura: desde lo más alto hasta el borde inferior de la
// peana, dejando fuera la cota de 28 mm (flecha y texto) si la hay. La
// flecha es la única fila con un trazo continuo casi de lado a lado.
function figura({ oscuro, enFila, enColumna }, { left, right, top, bottom }) {
  const filas = (y) => enFila(y, left, right)
  const conDibujo = tramos(top, bottom + 1, (y) => filas(y) > 2)
  const inicio = conDibujo[0][0]
  let fin = conDibujo.at(-1)[1]
  let limite = bottom
  const esFlecha = (y) =>
    tramos(left, right + 1, (x) => oscuro(x, y)).some(([x0, x1]) => x1 - x0 > (right - left) * 0.6)
  const cota = tramos(top, bottom + 1, esFlecha).at(-1)
  if (cota) {
    limite = fin = cota[0] - 1
    while (fin > top && filas(fin) < 30) fin--
  }
  const columnas = tramos(left, right + 1, (x) => enColumna(x, inicio, fin) > 2)
  const x0 = Math.max(left, columnas[0][0] - MARGEN)
  const y0 = Math.max(top, inicio - MARGEN)
  return {
    left: x0,
    top: y0,
    width: Math.min(right, columnas.at(-1)[1] + MARGEN) - x0 + 1,
    height: Math.min(limite, fin + MARGEN) - y0 + 1,
  }
}

// Fichas circulares: en cada mitad del panel, las tres circunferencias con
// más borde oscuro y blanco justo por fuera (las armas pueden salirse del
// círculo, así que no hay huecos limpios entre fichas).
function fichas({ oscuro }, { left, right, top, bottom }) {
  const mitad = (right - left) / 2
  const angulos = Array.from({ length: 90 }, (_, i) => (i * Math.PI) / 45)
  const pixel = (cx, cy, r, a) =>
    oscuro(Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a)))
  const puntuacion = (cx, cy, r) =>
    angulos.filter((a) => pixel(cx, cy, r, a) && ![5, 10, 15].some((d) => pixel(cx, cy, r + d, a)))
      .length
  const circulos = [0, 1].flatMap((columna) => {
    const centro = left + mitad * (columna + 0.5)
    const candidatos = []
    for (let r = Math.round(mitad * 0.38); r <= mitad * 0.52; r += 2)
      for (let cy = top + r; cy <= bottom - r; cy += 2)
        for (let cx = Math.round(centro - mitad * 0.1); cx <= centro + mitad * 0.1; cx += 2)
          candidatos.push({ cx, cy, r, puntos: puntuacion(cx, cy, r) })
    candidatos.sort((a, b) => b.puntos - a.puntos)
    const elegidos = []
    for (const c of candidatos) {
      if (elegidos.length === 3) break
      if (elegidos.every((e) => Math.abs(e.cy - c.cy) > e.r * 1.5)) elegidos.push(c)
    }
    if (elegidos.at(-1).puntos < angulos.length * 0.6)
      throw new Error('no se encuentran las 6 fichas')
    return elegidos.sort((a, b) => a.cy - b.cy).map((c, fila) => ({ ...c, fila, columna }))
  })
  return circulos
    .sort((a, b) => a.fila - b.fila || a.columna - b.columna)
    .map(({ cx, cy, r }) => ({ left: cx - r - 3, top: cy - r - 3, width: 2 * r + 7, height: 2 * r + 7 }))
}

async function ficha(archivo, recuadro, salida) {
  const lado = Math.max(recuadro.width, recuadro.height)
  const mascara = Buffer.from(
    `<svg width="${lado}" height="${lado}"><circle cx="${lado / 2}" cy="${lado / 2}" r="${lado / 2}"/></svg>`,
  )
  await sharp(archivo)
    .extract(recuadro)
    .resize(lado, lado, { fit: 'fill' })
    .ensureAlpha()
    .composite([{ input: mascara, blend: 'dest-in' }])
    .png()
    .toFile(salida)
}

async function papermini(archivo, [frente, espalda], salida) {
  const alto = Math.max(frente.height, espalda.height)
  const piezas = await Promise.all(
    [frente, espalda].map((r) => sharp(archivo).extract(r).png().toBuffer()),
  )
  await sharp({
    create: {
      width: frente.width + espalda.width,
      height: alto,
      channels: 3,
      background: '#fff',
    },
  })
    .composite([
      { input: piezas[0], left: 0, top: alto - frente.height },
      { input: piezas[1], left: frente.width, top: alto - espalda.height },
    ])
    .png()
    .toFile(salida)
}

const salidas = ['papermini', 'vtt-face', 'vtt-heroe']
for (const dir of salidas) mkdirSync(join(DESTINO, dir), { recursive: true })

for (const nombre of readdirSync(ORIGEN).filter((n) => n.endsWith('.png')).sort()) {
  if (!/^[a-z0-9-]+-(hombre|mujer)\.png$/.test(nombre)) {
    console.warn(`✗ ${nombre}: el nombre debe acabar en -hombre.png o -mujer.png`)
    continue
  }
  const [rutaMini, rutaCara, rutaHeroe] = salidas.map((dir) => join(DESTINO, dir, nombre))
  if ([rutaMini, rutaCara, rutaHeroe].every(existsSync)) {
    console.log(`= ${nombre}: ya procesada`)
    continue
  }
  const archivo = join(ORIGEN, nombre)
  try {
    const hoja = await cargar(archivo)
    const [frente, espalda, fichero] = paneles(hoja)
    const [cara, , heroe] = fichas(hoja, fichero)
    if (!existsSync(rutaMini))
      await papermini(archivo, [figura(hoja, frente), figura(hoja, espalda)], rutaMini)
    if (!existsSync(rutaCara)) await ficha(archivo, cara, rutaCara)
    if (!existsSync(rutaHeroe)) await ficha(archivo, heroe, rutaHeroe)
    console.log(`✓ ${basename(nombre, '.png')}`)
  } catch (error) {
    console.warn(`✗ ${nombre}: ${error.message}`)
  }
}
