/** Postura de una alianza hacia otra: con `hostil`, sus personajes son enemigos de los de la otra */
export type Postura = 'aliada' | 'neutral' | 'hostil'

/**
 * Grupo de jugadores que juegan juntos, con su postura hacia cada otra
 * alianza (por id; sin postura, neutral). Los personajes de una alianza son
 * enemigos de los de otra si la primera es hostil hacia la segunda
 */
export type Alianza = { id: string; nombre: string; posturas?: Record<string, Postura> }
