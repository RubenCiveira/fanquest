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

/** Tipo de misión y su regla especial (`templates/aventuras/especiales.json`) */
export type TipoMision = {
  regla: number
  etiqueta: string
  narrativa: TipoNarrativa
  /** Admite {pnj}, {perfil} y {objeto}; solo se sortean los que aparecen */
  objetivo: string
  /** Texto completo de la regla especial, tal como se muestra */
  texto: string
  /** La regla estructurada para el motor de ayuda a la misión */
  efectos: EfectoEspecial[]
}

/** Momento del juego que interesa a un efecto */
export type Sala =
  | 'inicial'
  | 'primera-sala'
  | 'especial'
  | 'primera-especial'
  | 'especial-a'
  | 'objetivo'

/** Número de algo en juego: fijo o en función de los héroes */
export type Cantidad = number | 'heroes'

type TiradaExito = {
  dado: string
  /** Resultado mínimo para tener éxito */
  exito: number
  /** Bonificación acumulada por cada repetición anterior sin éxito */
  bonoPorRepeticion?: number
}

type ResultadoPnj = {
  resultado: string
  estado: 'muerto' | 'malherido' | 'sano'
  mercenario?: boolean
  puntosCuerpo?: 'mitad'
  texto: string
}

export type EfectoEspecial =
  /** Preparación: cambia cartas al azar de un mazo por otras */
  | {
      tipo: 'cambiar-cartas'
      mazo: string
      quitar: { cantidad: number; excepto?: string[] }
      /** Por `tipo` (cualquier variante) o por `id` (una carta concreta) */
      poner: { tipo?: string; id?: string; cantidad: number }
    }
  /** Preparación: cartas para un mazo que la app aún no gestiona */
  | { tipo: 'anadir-cartas'; mazo: string; cantidad: number; carta: string }
  /** Al descubrir la sala indicada */
  | {
      tipo: 'sala'
      sala: Sala
      texto?: string
      elementos?: { tipo: string; siEsPosible?: boolean; contiene?: string; sinCartaDeCofre?: boolean }[]
      monstruos?: { categoria: number; faccion: 'mision'; cantidad: Cantidad }[]
      sustituirMonstruos?: { de: string; a: string; cantidad?: number }[]
      siPnjMuerto?: { sustituirMonstruos: { de: string; a: string; cantidad?: number }[] }
      sinAtrezo?: boolean
      sinPuertas?: boolean
      tiradaEncuentros?: boolean
    }
  /** Dónde y cómo se encuentra el objeto de la misión */
  | {
      tipo: 'objeto'
      buscar: (
        | { al: 'revisar'; carta: string; tirada?: TiradaExito; soloElPrimero?: boolean }
        | { al: 'buscar-tesoros'; carta: string }
        | { al: 'abrir-cofre'; sala: Sala }
        | { al: 'buscar-tesoros-o-revisar'; sala: Sala; tirada: TiradaExito }
      )[]
      alEncontrar?: { puedeSalir: boolean; recompensa?: number; puedeContinuar?: boolean }
      /** Si no aparece antes, lo tiene el Jefe de la Sala Objetivo */
      siNoSeEncuentra?: 'jefe'
    }
  /** Cuándo aparece el PNJ y en qué estado */
  | {
      tipo: 'pnj'
      aparece: 'inicio' | Sala
      estado: 'acompanante' | 'cautivo' | 'escondido' | 'torturado' | 'sacrificio'
      /** Acción que lo descubre, sobre una carta de atrezo */
      al?: 'revisar'
      carta?: string
      mercenario?: boolean
      tirada?: { dado: string; resultados: ResultadoPnj[] }
      liberar?: { requiere: string; tras: 'jefe' }
      alLiberar?: 'fin-mision'
    }
  /** En cada tirada de peligro se tira por la vida del PNJ */
  | {
      tipo: 'contador-muerte'
      sobre: 'pnj'
      cuando: 'tirada-peligro'
      dado: string
      sumaNivelPeligro: boolean
      /** Con este resultado o más se añade un contador */
      umbral: number
      /** Contadores con los que el PNJ muere */
      maximo: number
      alCompletar: string
    }
  /** Modificadores del Jefe Final */
  | { tipo: 'jefe'; puntosCuerpo: number }
  /** Recompensa extra (`extra`) o que se pierde (`perdida`) según una condición */
  | {
      tipo: 'recompensa'
      extra?: number
      perdida?: boolean
      condicion: 'jefe-y-pnj-vivo' | 'pnj-muerto' | 'objeto-antes-de-sala-objetivo'
      puedeSalir?: boolean
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
  /** Tipos de misión con su regla especial */
  especiales: { reglas: TipoMision[] }
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
  /** Efectos de la regla especial, para las ayudas durante la partida */
  efectos: EfectoEspecial[]
  extras: Pick<ReglaExtra, 'nombre' | 'texto'>[]
  sinReglasExtras: string
}
