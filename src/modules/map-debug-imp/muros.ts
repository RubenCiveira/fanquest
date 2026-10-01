import type { DescripcionMuro, Medida } from '../gamemap'

/**
 * Muro interior para probar en una sala de esas medidas: vertical, por el
 * medio y de muro a muro, con un paso en el tramo de arriba (cobertura
 * ligera) y una puerta (cerrada) a media altura. Ninguno si la sala es
 * demasiado pequeña para que tenga paso y puerta separados
 */
export function murosDePrueba({ columnas, filas }: Medida): DescripcionMuro[] {
  if (columnas < 2 || filas < 3) return []
  const x = Math.floor(columnas / 2)
  return [{ desde: { x, y: 0 }, hasta: { x, y: filas }, pasos: [0], puertas: [Math.floor(filas / 2)], cobertura: 'ligera' }]
}
