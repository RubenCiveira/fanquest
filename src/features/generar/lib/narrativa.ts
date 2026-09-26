import { rnd } from '../../../lib/dados'
import { rellenar } from '../../../lib/texto'
import { MINIMO_PALABRAS_NARRATIVA } from '../config/narrativa'

type Valores = Parameters<typeof rellenar>[1]

/** Elige una variante y la rellena con los valores de la misión */
export function redactar(variantes: string[], valores: Valores): string {
  return rellenar(rnd(variantes), valores)
}

/** Alarga con el relleno de la plantilla los textos demasiado cortos */
export function redactarLargo(
  variantes: string[],
  relleno: string,
  valores: Valores,
): string {
  const texto = redactar(variantes, valores)
  return texto.split(/\s+/).length < MINIMO_PALABRAS_NARRATIVA
    ? `${texto} ${rellenar(relleno, valores)}`
    : texto
}
