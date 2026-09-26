/** Agrupa los tipos de misión según la narrativa que les corresponde */
export const NARRATIVAS = [
  'jefe',
  'rescate',
  'explorador',
  'salvavidas',
  'aliado',
  'objeto',
] as const

export type TipoNarrativa = (typeof NARRATIVAS)[number]

type Rango = { min: number; max: number }

/** Valores que se reparten con una tirada de 1D6 */
type PorTirada = { tirada: number[] }

export type Faccion = PorTirada & {
  nombre: string
  errante: string
  erranteSuperior: string
  jefes: (PorTirada & { tipo: string })[]
}

export type TipoMision = {
  regla: number
  etiqueta: string
  narrativa: TipoNarrativa
  /** Admite {pnj}, {perfil} y {objeto}; solo se sortean los que aparecen */
  objetivo: string
  reglaEspecial: string
}

export type CampoPreparacion =
  | 'peligro'
  | 'dadoTrampa'
  | 'salasNormales'
  | 'salasEspeciales'

export type EfectoReglaExtra = {
  campo: CampoPreparacion
  suma: number
  minimo?: number
}

export type ReglaExtra = {
  id: string
  nombre: string
  texto: string
  /** Estado inicial en la configuración de quien juega */
  activa: boolean
  efectos?: EfectoReglaExtra[]
}

export type ConfigPreparacion = {
  salasNormales: Rango
  salasEspeciales: Rango
  pasillos: Rango
  peligro: number
  dadoTrampa: string
  /** De más a menos trampas: los efectos se desplazan por esta lista */
  dadosTrampa: string[]
  recompensas: number[]
  atrezoAdicional: string[]
  mazoAtrezo: string
  puntosCuerpoJefe: string
  salaObjetivo: string
  /** Para tipos de jefe sin nombres en la plantilla */
  jefePorDefecto: string
}

export type ConfigReglasExtras = {
  probabilidades: { una: number; dos: number }
  sinReglas: string
  reglas: ReglaExtra[]
}

type TextosPorNarrativa = Record<TipoNarrativa, string[]>

/**
 * Contenido de `templates/aventuras/`: textos y elementos que se combinan y
 * que se pueden ampliar. Las reglas del juego están en `config/`.
 */
export type PlantillaAventuras = {
  /** Nombres propios por tipo de jefe de las facciones */
  jefes: Record<string, string[]>
  personajes: { mecenas: string[]; pnjs: string[]; perfilesPnj: string[] }
  lugares: { heroes: string[]; aventura: string[] }
  objetos: string[]
  titulos: TextosPorNarrativa
  introducciones: TextosPorNarrativa & { relleno: string }
  epilogos: TextosPorNarrativa & { relleno: string; botinPorDefecto: string }
}

/** Preferencias de quien juega sobre las reglas extras */
export type ConfigExtras = {
  /** Solo las reglas que se han cambiado respecto a la plantilla */
  activas: Record<string, boolean>
  probUna: number
  probDos: number
}

export type Preparacion = Record<Exclude<CampoPreparacion, 'dadoTrampa'>, number> & {
  dadoTrampa: string
}

/**
 * Misión ya resuelta: no depende de la plantilla, de modo que se puede
 * guardar y volver a mostrar aunque las plantillas cambien.
 */
export type Mision = Preparacion & {
  regla: number
  titulo: string
  introduccion: string
  epilogo: string
  pasillos: number
  recompensa: number
  mazoAtrezo: string
  faccion: Omit<Faccion, 'tirada' | 'jefes'>
  jefe: string
  tipoJefe: string
  puntosCuerpoJefe: string
  objetivo: string
  salaObjetivo: string
  reglaEspecial: string
  extras: Pick<ReglaExtra, 'nombre' | 'texto'>[]
  sinReglasExtras: string
}
