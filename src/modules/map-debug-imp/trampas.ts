import { esEnemigo, jugadorDe, todosLosPersonajes, type Mapa } from '../gamemap'

/** Si el personaje tiene enemigos colocados en su estancia actual */
export function tieneEnemigosActivosEnEstancia(mapa: Mapa, personajeId: string): boolean {
  const personaje = todosLosPersonajes(mapa).find((p) => p.id === personajeId)
  const alianza = jugadorDe(mapa, personajeId)?.alianza
  return !!personaje?.casilla && todosLosPersonajes(mapa).some((p) => p.id !== personajeId && p.casilla && p.estancia === personaje.estancia && esEnemigo(mapa, p.id, alianza))
}
