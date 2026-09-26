export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

type Valores = Record<string, string | number | null>

/**
 * Sustituye los marcadores `{clave}` y `{clave|mayus}` de un texto de
 * plantilla. Un marcador sin valor se deja tal cual para que se note.
 */
export function rellenar(texto: string, valores: Valores): string {
  return texto.replace(/\{(\w+)(\|mayus)?\}/g, (marca, clave: string, mayus) => {
    const valor = valores[clave]
    if (valor == null) return marca
    return mayus ? capitalize(String(valor)) : String(valor)
  })
}
