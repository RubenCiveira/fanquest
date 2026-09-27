import type { CartaMazo } from '../../../lib/mazos'

/**
 * Reglas de Aventuras Infinitas para guiar la partida: exploración, trampas,
 * Nivel de Peligro y turno del Malvado Brujo.
 */

/** Sin sala inicial en la misión, la habitual de FAI */
export const SALA_INICIAL =
  'Escalera y puerta en una sala mediana o pequeña. Colocad a los héroes junto a la escalera. En la Sala Inicial no se tira en la Tabla de Encuentros.'

export const PELIGRO_MAXIMO = 10

/** Al alcanzar estos niveles se añade un cofre del Mazo de Cofres al de Atrezo */
export const PELIGRO_CON_COFRE = [5, 9]

/** Con 1D20 + Nivel de Peligro hasta aquí no hay monstruos y sube el peligro */
export const ENCUENTRO_SIN_MONSTRUOS = 10

/** Con este resultado del Dado de Trampa al moverse se activa una trampa */
export const TRAMPA_ACTIVADA = 1

/** Al buscar trampas se encuentra una con este resultado o menos */
export const TRAMPA_ENCONTRADA = 2

/** Al buscar puertas secretas (1D6 por pared sin puertas) basta un 6 */
export const PUERTA_SECRETA = 6

/** Tabla de Monstruos Errantes (1D6), a 1D6 casillas del héroe */
export const TABLA_ERRANTES = [
  { hasta: 1, errantes: 2, superiores: 0 },
  { hasta: 3, errantes: 0, superiores: 1 },
  { hasta: 6, errantes: 1, superiores: 0 },
]

export const filaErrantes = (dado: number) => TABLA_ERRANTES.find((f) => dado <= f.hasta) ?? TABLA_ERRANTES[2]

/** Tirada de Peligro (1DC) en el turno del Malvado Brujo sin monstruos */
export const TIRADA_PELIGRO = {
  Calavera: 'Puede que algo terrible ocurra: tirada de evento (1D10).',
  'Escudo blanco': 'La suerte os es propicia, no ocurre nada.',
  'Escudo negro': 'Aumenta en 1 el Nivel de Peligro.',
}

export type Evento = {
  titulo: string
  texto: string
  /** Tras el evento no baja el Nivel de Peligro (y sube 1) */
  subePeligro?: boolean
  /** Desde ahora se lanza el Dado de Trampa inmediatamente inferior */
  bajaDadoTrampa?: boolean
}

/** Tabla de Eventos de Mazmorra (1D20); tras el evento el peligro baja 1 */
export const EVENTOS_MAZMORRA: Evento[] = [
  {
    titulo: 'Emboscada',
    texto:
      'Coloca tantos Monstruos Errantes como héroes en juego donde ningún héroe tenga línea de visión, lo más cerca posible del héroe más vulnerable (menos defensa o menos PC). Actúan este mismo turno.',
  },
  {
    titulo: 'Merodeadores',
    texto:
      'Coloca un Monstruo Errante Superior por cada 2 héroes en juego en una casilla sobre la que ningún héroe tenga línea de visión. Actúan este mismo turno.',
  },
  {
    titulo: 'Alarido espeluznante',
    texto: 'Un grito que no conseguís identificar retumba por la mazmorra. Aumenta en 1 el Nivel de Peligro y no lo reduzcas tras el evento.',
    subePeligro: true,
  },
  {
    titulo: 'Repleta de trampas',
    texto:
      'Desde ahora lanzaréis el Dado de Trampa inmediatamente inferior (con menos caras). Si ya usáis el más bajo, no ocurre nada.',
    bajaDadoTrampa: true,
  },
  {
    titulo: 'Oleada de muerte',
    texto:
      'Cada héroe lanza 1DC. Calavera: pierde 1 PC. Escudo blanco: decide si pierde 1 PC o 1 PM. Escudo negro: pierde 1 PC y 1 PM.',
  },
  {
    titulo: 'Tromba de agua subterránea',
    texto:
      'Cada héroe es desplazado a la casilla más alejada posible de la sala o sección de pasillo anterior a la suya y pierde 2 PC. Puede anular cada PC sacrificando un objeto, arma o poción, que se pierde en la corriente.',
  },
  {
    titulo: 'Derrumbamiento',
    texto:
      'Cada héroe lanza 1D6. El techo de la sección de quien saque más se viene abajo: los héroes en ella resuelven la trampa Roca Caída (2DC sin defensa). No coloques el marcador de roca caída.',
  },
  {
    titulo: 'Roca rodante',
    texto:
      'Determinad un héroe al azar: su sección es la afectada. En un pasillo, todos los héroes en él se defienden de un ataque de 3 calaveras. En una sala, cada héroe recibe un ataque de 3DC del que puede defenderse.',
  },
  {
    titulo: 'Hacha oscilante',
    texto: 'Determinad un héroe al azar. Él y quienes estén a tres casillas o menos se defienden de un ataque de 3DC.',
  },
  {
    titulo: 'Abismo',
    texto:
      'Coloca un marcador de foso bajo cada héroe; cada uno lanza 1DC. Calavera o escudo negro: cae al abismo (trampa de Abismo sin subir el Nivel de Peligro). Escudo blanco: se aparta a una casilla adyacente al foso si puede; si no, como calavera.',
  },
  {
    titulo: 'Paredes aplastantes',
    texto:
      'Determinad un héroe al azar: se ven afectados los héroes de su sala o sección de pasillo. Cada uno lanza tantos D6 como sus PC o sus PM máximos; cada 6 anula 1 punto de daño. Hay que anular tantos puntos como héroes en juego; el resto se reparte entre los afectados como deseen.',
  },
  {
    titulo: 'Gas venenoso',
    texto:
      'Determinad al azar un héroe que esté en una sala (si todos están en pasillos, no ocurre nada). Los héroes de esa sala lanzan 1DC en su turno y pierden 1 PC con calavera. No pueden salir hasta romper una puerta (no defiende; tiene tantos PC como héroes en juego +1); al romperla, el gas se disipa.',
  },
  {
    titulo: 'Murciélagos gigantes',
    texto: 'Cada héroe lanza 2DC y pierde tantos PC como calaveras obtenga.',
  },
  {
    titulo: 'Brecha en la realidad',
    texto: 'Cada héroe lanza 2D6-1 en la Tabla de Vientos del Caos en su siguiente turno, antes de hacer nada más.',
  },
  {
    titulo: 'Despiste',
    texto:
      'Determinad un héroe al azar; lanza 1DC. Calavera: pierde 2D6×10 mo. Escudo blanco: pierde una pócima al azar (si no tiene, como calavera). Escudo negro: pierde al azar un arma que no lleve equipada (si no tiene, como escudo blanco).',
  },
  {
    titulo: 'Asalto',
    texto:
      'Coloca tantos Bandidos (monstruo avanzado) como héroes en juego lo más cerca posible del grupo, donde no tengan línea de visión. En su primer turno intentan robar; quienes roben huyen hacia la salida y el resto combate. Si un bandido llega a la salida, lo robado se pierde para siempre.',
  },
  {
    titulo: 'Alteración en los Vientos de la Magia',
    texto:
      'Durante el resto de la partida, toda tirada en la tabla de Vientos de la Magia lleva -1 (acumulable), y cualquier doble obliga a tirar en la tabla de Vientos del Caos (sin penalizador).',
  },
  {
    titulo: 'Ataque de pánico',
    texto:
      'Determinad un héroe al azar; lanza tantos D6 como sus PM máximos. Si no saca ningún 6, entra en Estado de Shock hasta que algún efecto le haga recuperar PC o PM.',
  },
  {
    titulo: 'Enredaderas malditas',
    texto:
      'La sección con más héroes (o una al azar) y las adyacentes ya exploradas son terreno difícil (salir de una casilla cuesta 2 PM). Quien empiece su turno en ellas lanza tantos D6 como sus PC máximos y pierde 1 PC si no saca ningún 6. Las enredaderas no defienden, tienen 2 PC por héroe en juego y el fuego les hace doble daño.',
  },
  {
    titulo: 'Enjambre de alimañas',
    texto:
      'La sección con más héroes (o una al azar) y las adyacentes ya exploradas quedan infestadas. Quien empiece su turno en ellas lanza 1DC: calavera, pierde 1 PC; escudo blanco, nada; escudo negro, pierde 1 PC y vuelve a tirar. Las alimañas tienen 1 PC por héroe en juego, no defienden y solo se dañan con escudos negros, daño mágico en área o fuego.',
  },
]

/** Qué se explora al robar una carta del Mazo de Mazmorra, de Salas o de Pasillo */
export type Seccion = 'pasillo' | 'sala' | 'especial' | 'objetivo' | 'escaleras'

export function seccionDe(carta: CartaMazo): Seccion {
  if (carta.tipo.startsWith('pasillo')) return 'pasillo'
  if (carta.tipo.startsWith('sala-normal')) return 'sala'
  if (carta.tipo.startsWith('sala-especial')) return 'especial'
  if (carta.tipo.startsWith('sala-objetivo')) return 'objetivo'
  return 'escaleras'
}

/*
 * Lo que pide cada carta está en su texto: las reglas se leen de ahí para
 * no duplicarlas en las plantillas de los mazos.
 */

export const pideErrantes = (c: CartaMazo) => /Tabla de Monstruos Errantes/i.test(c.texto ?? '')

export const cartasDeAtrezo = (c: CartaMazo) => (/dos Cartas de Atrezo/i.test(c.texto ?? '') ? 2 : 1)

/** Sala o pasillo con dos puertas que reparte el Mazo de Mazmorra */
export const bifurca = (c: CartaMazo) => /Reparte este Mazo de Mazmorra/i.test(c.texto ?? '')

/** Sala sin puertas: solo se sale por donde se entró (o por una puerta secreta) */
export const sinPuertas = (c: CartaMazo) => c.tipo.endsWith('sin-puertas')

/** Sala sin puertas que une su Mazo de Mazmorra con otro */
export const une = (c: CartaMazo) => /Une este Mazo de Mazmorra/i.test(c.texto ?? '')

export const subePeligro = (texto: string) => /Aumenta en 1 el Nivel de Peligro/i.test(texto)

/** Letra del epígrafe de la misión de una Sala Especial de Misión (A, B…) */
export function letraSalaDeMision(carta: CartaMazo): string | undefined {
  if (carta.tipo !== 'sala-especial-de-mision') return undefined
  return 'ABCDE'[Number(carta.id.split('-').pop()) - 1]
}

/** Orden al colocar monstruos: débiles, fuertes, a distancia y magia o jefes */
export const REGLAS_A_DISTANCIA = ['Armas a distancia']
export const REGLAS_DE_MAGIA = [
  'Conocimiento arcano',
  'Maestro arcano',
  'Conocimiento mágico',
  'Nigromancia',
  'Brujería skaven',
]
