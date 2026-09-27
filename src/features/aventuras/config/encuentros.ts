/**
 * Tablas de encuentros de salas de Aventuras Infinitas (1D20 + Nivel de
 * Peligro). Con 1-10 no hay monstruos: se aumenta en 1 el Nivel de Peligro.
 */
export const TABLAS = ['no-muertos', 'pieles-verdes', 'caos', 'forajidos'] as const

export type IdTabla = (typeof TABLAS)[number]

/** Monstruos de un encuentro; con varias opciones se juega una sola */
export type Grupo = {
  monstruo: string | string[]
  /** Con 3 o 4 héroes, con 2 y con 1 */
  cantidad: [number, number, number]
  avanzado?: boolean
}

export type Encuentro = {
  resultado: number
  grupos: Grupo[]
  /** Sustitución según miniaturas disponibles o gusto de quien juega */
  alternativa?: string
}

const g = (monstruo: Grupo['monstruo'], tres: number, dos: number, uno: number): Grupo => ({
  monstruo,
  cantidad: [tres, dos, uno],
})

/** Según el Dios Oscuro elegido para la mazmorra */
const DEMONIOS = ['desangrador-de-khorne', 'diablilla-de-slaanesh', 'portador-de-plaga', 'horror-rosa']
const BESTIAS_O_DEMONIOS = ['hombre-bestia', ...DEMONIOS]
const CAMPEONES = ['campeon-de-khorne', 'campeon-de-slaanesh', 'campeon-de-nurgle', 'campeon-de-tzeentch']

export const TABLAS_ENCUENTROS: Record<IdTabla, { nombre: string; encuentros: Encuentro[] }> = {
  'no-muertos': {
    nombre: 'No-Muertos',
    encuentros: [
      { resultado: 11, grupos: [g('rata-gigante', 3, 2, 1)], alternativa: 'Esqueletos' },
      { resultado: 12, grupos: [g('esqueleto', 3, 2, 1)] },
      { resultado: 13, grupos: [g('esqueleto', 2, 1, 1), g('esqueleto-arquero', 1, 1, 1)], alternativa: 'Esqueletos' },
      { resultado: 14, grupos: [g('esqueleto', 4, 3, 2)] },
      { resultado: 15, grupos: [g('zombi', 2, 1, 1), g('esqueleto', 1, 1, 0)] },
      { resultado: 16, grupos: [g('zombi', 2, 1, 1), g('esqueleto', 2, 2, 1)] },
      { resultado: 17, grupos: [g('zombi', 2, 1, 1), g('esqueleto-arquero', 2, 2, 1)], alternativa: 'Zombis y Esqueletos' },
      { resultado: 18, grupos: [g('zombi', 4, 3, 2)], alternativa: 'Zombis y Esqueletos' },
      { resultado: 19, grupos: [g('momia', 2, 1, 1), g('esqueleto', 2, 1, 0)], alternativa: 'Calaveras de la Maldición' },
      {
        resultado: 20,
        grupos: [g('momia', 2, 1, 1), g('esqueleto', 3, 2, 1)],
        alternativa: 'Calaveras de la Maldición y Esqueletos',
      },
      {
        resultado: 21,
        grupos: [g('momia', 2, 2, 1), g('zombi', 2, 1, 1), g('esqueleto', 2, 1, 1)],
        alternativa: 'Calaveras de la Maldición, Zombis y Esqueletos',
      },
      { resultado: 22, grupos: [g('tumulario', 3, 2, 2)], alternativa: 'Espectros o Guerreros del Caos' },
      { resultado: 23, grupos: [g('espectro', 3, 2, 2)], alternativa: 'Guerreros del Caos' },
      { resultado: 24, grupos: [g('tumulario', 2, 2, 2), g('esqueleto', 4, 2, 1)], alternativa: 'Guerreros del Caos y Esqueletos' },
      {
        resultado: 25,
        grupos: [g('espectro', 2, 2, 2), g('zombi', 2, 1, 1), g('esqueleto', 2, 1, 0)],
        alternativa: 'Guerreros del Caos, Zombis y Esqueletos',
      },
      {
        resultado: 26,
        grupos: [g('licantropo', 1, 1, 1), g('zombi', 2, 2, 2), g('esqueleto', 3, 1, 0)],
        alternativa: 'Lobo Gigante, 2 Momias o 2 Calaveras de la Maldición, Zombis y Esqueletos',
      },
      {
        resultado: 27,
        grupos: [g('lobo-gigante', 1, 1, 1), g('momia', 2, 2, 2), g('esqueleto', 3, 1, 0)],
        alternativa: 'Gárgola o Guerreros del Caos, Momias o Calaveras de la Maldición y Esqueletos',
      },
      {
        resultado: 28,
        grupos: [g('licantropo', 1, 1, 1), { ...g('momia', 3, 2, 1), avanzado: true }],
        alternativa: 'Gárgola y Momias avanzadas o Guerreros del Caos',
      },
      { resultado: 29, grupos: [g('licantropo', 2, 1, 1), g('lobo-gigante', 2, 2, 1)], alternativa: 'Gárgola y Guerreros del Caos' },
      {
        resultado: 30,
        grupos: [g('conde-vampiro', 1, 1, 1), g('tumulario', 3, 2, 1)],
        alternativa: 'Liche o 2 Guerreros del Caos por el Vampiro; 1 Guerrero del Caos por Tumulario',
      },
    ],
  },
  'pieles-verdes': {
    nombre: 'Pieles Verdes',
    encuentros: [
      { resultado: 11, grupos: [g('rata-gigante', 3, 2, 1)], alternativa: 'Goblins' },
      { resultado: 12, grupos: [g('goblin', 3, 2, 1)] },
      { resultado: 13, grupos: [g('goblin', 2, 1, 1), g('goblin-arquero', 1, 1, 1)], alternativa: 'Goblins' },
      { resultado: 14, grupos: [g('goblin', 4, 3, 2)] },
      { resultado: 15, grupos: [g('orco', 2, 1, 1), g('goblin', 1, 1, 0)] },
      { resultado: 16, grupos: [g('orco', 2, 1, 1), g('goblin', 2, 2, 1)] },
      { resultado: 17, grupos: [g('orco-arquero', 2, 1, 1), g('goblin', 2, 2, 1)], alternativa: 'Orcos' },
      { resultado: 18, grupos: [g('orco', 4, 3, 2)] },
      { resultado: 19, grupos: [g('fimir', 2, 1, 1), g('goblin', 2, 1, 0)] },
      { resultado: 20, grupos: [g('fimir', 2, 1, 1), g('goblin', 3, 2, 2)] },
      { resultado: 21, grupos: [g('fimir', 2, 2, 1), g('orco', 2, 1, 1), g('goblin', 2, 1, 1)] },
      { resultado: 22, grupos: [g('orco-negro', 3, 2, 2)], alternativa: 'Guerreros del Caos' },
      { resultado: 23, grupos: [g('chaman-goblin', 1, 1, 1), g('goblin', 3, 2, 1)], alternativa: 'Guerreros del Caos y Goblins' },
      { resultado: 24, grupos: [g('orco-negro', 3, 3, 2), g('goblin', 4, 2, 2)], alternativa: 'Guerreros del Caos y Goblins' },
      { resultado: 25, grupos: [g('chaman-goblin', 1, 1, 1), g('orco', 3, 2, 1)], alternativa: 'Guerreros del Caos y Orcos' },
      {
        resultado: 26,
        grupos: [g('gran-jefe-orco', 1, 1, 1), g('orco', 2, 2, 1), g('goblin', 3, 1, 1)],
        alternativa: 'Gárgola o Lobo Gigante, Orcos y Goblins',
      },
      {
        resultado: 27,
        grupos: [g('campeon-ogro', 1, 1, 1), g('orco', 2, 2, 1), g('goblin', 3, 1, 1)],
        alternativa: 'Gárgola, Orcos y Goblins',
      },
      {
        resultado: 28,
        grupos: [g('senor-de-los-ogros', 1, 1, 1), g('orco', 3, 2, 1)],
        alternativa: 'Mantícora, Minotauro o 2 Guerreros del Caos, y Orcos',
      },
      {
        resultado: 29,
        grupos: [g('troll', 1, 1, 1), g('orco', 3, 2, 1)],
        alternativa: 'Señor de los Ogros, Mantícora o Minotauro, y Orcos',
      },
      {
        resultado: 30,
        grupos: [g('senor-de-los-ogros', 1, 1, 1), g('campeon-ogro', 2, 1, 1)],
        alternativa: 'Paladín del Caos por el Señor de los Ogros; Gárgolas por los Campeones Ogro',
      },
    ],
  },
  caos: {
    nombre: 'Caos y Demonios',
    encuentros: [
      { resultado: 11, grupos: [g('rata-gigante', 3, 2, 1)], alternativa: 'Goblins o Esqueletos' },
      { resultado: 12, grupos: [g('diablillo', 3, 2, 1)], alternativa: 'Goblins o Esqueletos' },
      { resultado: 13, grupos: [g('diablillo', 2, 1, 1), g('horror-azul', 1, 1, 1)], alternativa: 'Goblins o Esqueletos' },
      { resultado: 14, grupos: [g('cultista', 2, 1, 1)], alternativa: 'Orcos o Zombis' },
      { resultado: 15, grupos: [g('barbaro-del-caos', 2, 1, 1), g('diablillo', 1, 1, 0)], alternativa: 'Orcos, Zombis o Cultistas' },
      { resultado: 16, grupos: [g('diablillo', 2, 1, 1), g('cultista', 2, 2, 1)], alternativa: 'Goblins y Orcos o Esqueletos y Zombis' },
      { resultado: 17, grupos: [g('barbaro-del-caos', 2, 1, 1), g('cultista', 2, 2, 1)], alternativa: 'Orcos o Zombis' },
      { resultado: 18, grupos: [g('barbaro-del-caos', 4, 3, 2)], alternativa: 'Cultistas, Orcos o Zombis' },
      {
        resultado: 19,
        grupos: [g(BESTIAS_O_DEMONIOS, 2, 1, 1), g('barbaro-del-caos', 1, 1, 0)],
        alternativa: 'Fimirs o Momias, y Orcos o Zombis',
      },
      { resultado: 20, grupos: [g(BESTIAS_O_DEMONIOS, 3, 2, 1)], alternativa: 'Fimirs o Momias' },
      {
        resultado: 21,
        grupos: [g(BESTIAS_O_DEMONIOS, 2, 1, 0), g('guerrero-del-caos', 1, 1, 1)],
        alternativa: 'Fimirs o Momias, y Tumularios',
      },
      { resultado: 22, grupos: [g('guerrero-del-caos', 3, 2, 2)] },
      { resultado: 23, grupos: [g('brujo-del-caos', 1, 1, 1), g('horror-azul', 2, 1, 1)], alternativa: 'Guerreros del Caos' },
      { resultado: 24, grupos: [g('gargola', 1, 1, 1), g('barbaro-del-caos', 2, 1, 1)], alternativa: 'Gárgola y Orcos o Gárgola y Zombis' },
      {
        resultado: 25,
        grupos: [g('guerrero-del-caos', 2, 2, 1), g(CAMPEONES, 2, 1, 1)],
        alternativa: 'Guerreros del Caos avanzados',
      },
      {
        resultado: 26,
        grupos: [g('gargola', 1, 1, 1), g('guerrero-del-caos', 2, 1, 1), g('barbaro-del-caos', 2, 1, 0)],
        alternativa: 'Gárgola, Guerreros del Caos y Orcos o Zombis',
      },
      {
        resultado: 27,
        grupos: [g('minotauro', 1, 1, 1), g('barbaro-del-caos', 3, 2, 1)],
        alternativa: 'Cualquier monstruo de Cat. 6 o 2 Guerreros del Caos por el Minotauro; Cultistas, Orcos o Zombis por los Bárbaros',
      },
      {
        resultado: 28,
        grupos: [g('manticora', 1, 1, 1), g(DEMONIOS, 3, 2, 1)],
        alternativa: 'Cualquier monstruo de Cat. 6 o 2 Guerreros del Caos por la Mantícora; Fimirs o Momias por los demonios',
      },
      {
        resultado: 29,
        grupos: [g('paladin-del-caos', 1, 1, 1), g(DEMONIOS, 3, 2, 1)],
        alternativa: 'Cualquier monstruo de Cat. 6 y Guerreros del Caos',
      },
      {
        resultado: 30,
        grupos: [g('principe-demonio', 1, 1, 1), g(CAMPEONES, 2, 1, 1)],
        alternativa: 'Gran Dragón y Gárgolas o Dragón Zombi y Gárgolas',
      },
    ],
  },
  forajidos: {
    nombre: 'Forajidos',
    encuentros: [
      { resultado: 11, grupos: [g('rata-gigante', 3, 2, 1)], alternativa: 'Goblins' },
      { resultado: 12, grupos: [g('bandido', 3, 2, 1)], alternativa: 'Goblins' },
      { resultado: 13, grupos: [g('bandido', 2, 1, 1), g('lobo-salvaje', 1, 1, 1)], alternativa: 'Goblins' },
      { resultado: 14, grupos: [g('bandido', 4, 3, 2)], alternativa: 'Goblins' },
      { resultado: 15, grupos: [g('explorador-forajido', 2, 1, 1), g('bandido', 1, 1, 0)], alternativa: 'Orcos' },
      { resultado: 16, grupos: [g('explorador-forajido', 2, 1, 1), g('bandido', 2, 2, 1)], alternativa: 'Orcos y Goblins' },
      { resultado: 17, grupos: [g('explorador-forajido', 2, 1, 1), g('lobo-salvaje', 2, 2, 1)], alternativa: 'Orcos y Goblins' },
      { resultado: 18, grupos: [g('explorador-forajido', 4, 3, 2)], alternativa: 'Orcos' },
      { resultado: 19, grupos: [g('asesino-a-sueldo', 2, 1, 1), g('bandido', 2, 1, 1)], alternativa: 'Fimirs' },
      { resultado: 20, grupos: [g('asesino-a-sueldo', 2, 1, 1), g('bandido', 3, 2, 2)], alternativa: 'Fimirs y Goblins' },
      {
        resultado: 21,
        grupos: [g('asesino-a-sueldo', 2, 2, 1), g('explorador-forajido', 2, 1, 1), g('lobo-salvaje', 2, 1, 1)],
        alternativa: 'Fimirs, Orcos y Goblins',
      },
      {
        resultado: 22,
        grupos: [g('lider-forajido', 1, 1, 1), g('bandido', 3, 2, 1)],
        alternativa: 'Sin el Líder; Guerreros del Caos por los Bandidos',
      },
      {
        resultado: 23,
        grupos: [g('hechicero-renegado', 1, 1, 1), g('explorador-forajido', 3, 2, 1)],
        alternativa: 'Brujo del Caos (con las estadísticas del Hechicero Renegado) y Orcos',
      },
      {
        resultado: 24,
        grupos: [g('lider-forajido', 1, 1, 1), g('asesino-a-sueldo', 3, 2, 2), g('explorador-forajido', 2, 1, 0)],
        alternativa: 'Guerreros del Caos, Fimirs y Goblins',
      },
      {
        resultado: 25,
        grupos: [g('lider-forajido', 2, 1, 1), g('hechicero-renegado', 2, 1, 1), g('bandido', 2, 2, 1)],
        alternativa: 'Guerreros del Caos, Fimirs y Goblins',
      },
      {
        resultado: 26,
        grupos: [g('licantropo', 1, 1, 1), g('hechicero-renegado', 2, 1, 1), g('lobo-salvaje', 2, 1, 0)],
        alternativa: 'Gárgola o Lobo Gigante, Orcos y Goblins',
      },
      {
        resultado: 27,
        grupos: [g('campeon-ogro', 1, 1, 1), g('lider-forajido', 1, 1, 0), g('bandido', 3, 1, 2)],
        alternativa: 'Gárgola y Orcos',
      },
      {
        resultado: 28,
        grupos: [g('conde-vampiro', 1, 1, 1), g('explorador-forajido', 3, 2, 1)],
        alternativa: 'Mantícora, Basilisco o 2 Guerreros del Caos, y Orcos',
      },
      {
        resultado: 29,
        grupos: [g('minotauro', 1, 1, 1), g('explorador-forajido', 3, 1, 1)],
        alternativa: 'Basilisco, Mantícora o Minotauro, y Orcos',
      },
      {
        resultado: 30,
        grupos: [g('senor-de-los-ogros', 1, 1, 1), g('lider-forajido', 2, 1, 1)],
        alternativa: 'Paladín del Caos por el Señor de los Ogros; Guerreros del Caos por los Líderes',
      },
    ],
  },
}

/** Tabla de cada facción del generador (`generar/config/facciones.ts`) */
export const TABLA_POR_FACCION: Record<string, IdTabla> = {
  'No muertos': 'no-muertos',
  'Pieles-Verdes': 'pieles-verdes',
  'Agentes del Caos': 'caos',
  Forajidos: 'forajidos',
}

/** Monstruo del bestiario para cada nombre de errante y jefe del generador */
export const MONSTRUO_DE_NOMBRE: Record<string, { monstruo: string; avanzado?: boolean }> = {
  Zombi: { monstruo: 'zombi' },
  Momia: { monstruo: 'momia' },
  Orco: { monstruo: 'orco' },
  Fimir: { monstruo: 'fimir' },
  Cultista: { monstruo: 'cultista' },
  'H. Bestia': { monstruo: 'hombre-bestia' },
  Explorador: { monstruo: 'explorador-forajido' },
  'Asesino Forajido': { monstruo: 'asesino-a-sueldo' },
  Vampiro: { monstruo: 'conde-vampiro' },
  Tumulario: { monstruo: 'tumulario' },
  'Bestia de Cieno': { monstruo: 'bestia-del-cieno' },
  'Gran Jefe Orco': { monstruo: 'gran-jefe-orco' },
  Troll: { monstruo: 'troll' },
  'Campeón Ogro': { monstruo: 'campeon-ogro' },
  'Gárgola Avanzada': { monstruo: 'gargola', avanzado: true },
  Minotauro: { monstruo: 'minotauro' },
  'Paladín del Caos': { monstruo: 'paladin-del-caos' },
  'Líder Forajido': { monstruo: 'lider-forajido' },
  'Hombre Lobo': { monstruo: 'licantropo' },
}

/**
 * Errantes que puede haber a la vez: la tabla de monstruos errantes coloca
 * hasta 2 y la Sala Objetivo, uno por héroe en juego.
 */
export const ERRANTES_MINIMOS = 2
