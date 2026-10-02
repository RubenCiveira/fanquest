import { fuenteLocal } from '../../lib/plantillas'
import type { Medida, Terreno, TipoCobertura, TipoTerreno } from '../gamemap'

/** Imagen del terreno de prueba que la lleva: un montón de escombros de las cartas de sucesos */
export const IMAGEN_ESCOMBROS = fuenteLocal.url('mazos', 'sucesos/imagenes/monton-de-escombros-1.webp')

const solapan = (a: Terreno, b: Terreno) =>
  a.posicion.x < b.posicion.x + b.columnas && b.posicion.x < a.posicion.x + a.columnas && a.posicion.y < b.posicion.y + b.filas && b.posicion.y < a.posicion.y + a.filas

/** Cobertura de cada terreno de prueba según su tipo: lo normal no tiene terreno ni cobertura */
export const COBERTURA_DE_PRUEBA: Record<TipoTerreno, TipoCobertura> = { dificil: 'ligera', 'muy-dificil': 'pesada', impasable: 'bloqueante' }

/**
 * Terreno para probar en una sala de esas medidas: barro difícil, zarzas muy
 * difíciles, un pilar impasable, lava difícil con efecto y escombros difíciles
 * con imagen, cada uno con la cobertura de su tipo (`COBERTURA_DE_PRUEBA`).
 * Solo los que caben dentro sin tocar los muros (así no tapan puertas) ni
 * pisarse entre sí
 */
export function terrenosDePrueba({ columnas, filas }: Medida, imagen = IMAGEN_ESCOMBROS): Terreno[] {
  const candidatos: Terreno[] = [
    { tipo: 'dificil', posicion: { x: 1, y: 1 }, columnas: 2, filas: 1 },
    { tipo: 'muy-dificil', posicion: { x: columnas - 2, y: 1 }, columnas: 1, filas: 2 },
    { tipo: 'impasable', posicion: { x: 1, y: filas - 2 }, columnas: 1, filas: 1 },
    { tipo: 'dificil', efecto: 'lava', decoracion: { fondo: '#d94a1e' }, posicion: { x: Math.floor(columnas / 2) - 1, y: Math.floor(filas / 2) }, columnas: 2, filas: 1 },
    { tipo: 'dificil', posicion: { x: columnas - 3, y: filas - 3 }, columnas: 2, filas: 2, ...(imagen && { imagen }) },
  ]
  const dentro = ({ posicion: { x, y }, columnas: c, filas: f }: Terreno) => x >= 1 && y >= 1 && x + c <= columnas - 1 && y + f <= filas - 1
  return candidatos
    .map((t) => ({ ...t, cobertura: COBERTURA_DE_PRUEBA[t.tipo] }))
    .reduce<Terreno[]>((puestos, t) => (dentro(t) && !puestos.some((p) => solapan(p, t)) ? [...puestos, t] : puestos), [])
}
