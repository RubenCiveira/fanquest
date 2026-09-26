import type { ConfigPreparacion } from '../lib/tipos'

export const PREPARACION: ConfigPreparacion = {
  salasNormales: {
    min: 6,
    max: 7
  },
  salasEspeciales: {
    min: 2,
    max: 3
  },
  pasillos: {
    min: 3,
    max: 4
  },
  peligro: 0,
  dadoTrampa: 'D8',
  dadosTrampa: [
    'D4',
    'D6',
    'D8',
    'D10',
    'D12'
  ],
  recompensas: [
    90,
    100,
    100,
    110
  ],
  atrezoAdicional: [
    'Opcionalmente, un atrezo adicional si hay espacio.',
    'Opcionalmente, dos atrezos adicionales si hay espacio.'
  ],
  mazoAtrezo: 'Mazo de Atrezo: 1 Cofre + 9 cartas con atrezo al azar · 10 cartas sin atrezo.',
  puntosCuerpoJefe: 'Suma +1 PC por héroe en juego +1 PC por el rango más elevado del grupo.',
  salaObjetivo: 'Sala Objetivo: Contiene al Jefe Final, un cofre y un monstruo errante por héroe en juego.',
  jefePorDefecto: 'Señor Oscuro'
}
