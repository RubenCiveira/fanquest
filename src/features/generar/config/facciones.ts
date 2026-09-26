import type { Faccion } from '../lib/tipos'

/** Facción y jefe se deciden con 1D6 cada uno */
export const FACCIONES: Faccion[] = [
  {
    nombre: 'No muertos',
    tirada: [
      1,
      2
    ],
    errante: 'Zombi',
    erranteSuperior: 'Momia',
    jefes: [
      {
        tipo: 'Vampiro',
        tirada: [
          1,
          2
        ]
      },
      {
        tipo: 'Tumulario',
        tirada: [
          3,
          4
        ]
      },
      {
        tipo: 'Bestia de Cieno',
        tirada: [
          5,
          6
        ]
      }
    ]
  },
  {
    nombre: 'Pieles-Verdes',
    tirada: [
      3,
      4
    ],
    errante: 'Orco',
    erranteSuperior: 'Fimir',
    jefes: [
      {
        tipo: 'Gran Jefe Orco',
        tirada: [
          1,
          2
        ]
      },
      {
        tipo: 'Troll',
        tirada: [
          3,
          4
        ]
      },
      {
        tipo: 'Campeón Ogro',
        tirada: [
          5,
          6
        ]
      }
    ]
  },
  {
    nombre: 'Agentes del Caos',
    tirada: [
      5
    ],
    errante: 'Cultista/Orco',
    erranteSuperior: 'H. Bestia/Fimir',
    jefes: [
      {
        tipo: 'Gárgola Avanzada',
        tirada: [
          1,
          2
        ]
      },
      {
        tipo: 'Minotauro',
        tirada: [
          3,
          4
        ]
      },
      {
        tipo: 'Paladín del Caos',
        tirada: [
          5,
          6
        ]
      }
    ]
  },
  {
    nombre: 'Forajidos',
    tirada: [
      6
    ],
    errante: 'Explorador',
    erranteSuperior: 'Asesino Forajido',
    jefes: [
      {
        tipo: 'Líder Forajido',
        tirada: [
          1,
          2
        ]
      },
      {
        tipo: 'Hombre Lobo',
        tirada: [
          3,
          4
        ]
      },
      {
        tipo: 'Campeón Ogro',
        tirada: [
          5,
          6
        ]
      }
    ]
  }
]
