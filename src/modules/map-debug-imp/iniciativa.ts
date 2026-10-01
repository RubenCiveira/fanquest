import { escuadrasDe, jugadoresDe, numeroDeTurno, personajesNoJugadoresDe, type HuecoDelTurno, type Mapa } from '../gamemap'

/**
 * Cartas de iniciativa de prueba (como en Aventuras Infinitas): al empezar
 * cada turno se reparte al azar una carta a cada jugador con algo en el mapa.
 * En su hueco, un humano activa todo lo suyo y la IA tantas activaciones como
 * escuadras de humanos haya menos una (al menos una); al final, la IA activa
 * lo que le quede (el turno escoba)
 */
export function iniciativaDePrueba(m: Mapa, azar: () => number = Math.random): HuecoDelTurno[] {
  const conAlgo = jugadoresDe(m).jugadores.filter(
    (j) => escuadrasDe(m).some((e) => e.jugador === j.id && e.personajes.length) || personajesNoJugadoresDe(m).some((p) => p.jugador === j.id),
  )
  const heroes = escuadrasDe(m).filter((e) => conAlgo.some((j) => j.id === e.jugador && j.tipo === 'humano')).length
  // se barajan las cartas: cada jugador, en un sitio al azar de los que quedan
  const cartas = [...conAlgo]
  for (let i = cartas.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1))
    ;[cartas[i], cartas[j]] = [cartas[j], cartas[i]]
  }
  return [
    ...cartas.map((j) => (j.tipo === 'ia' ? { jugador: j.id, activaciones: Math.max(1, heroes - 1) } : { jugador: j.id })),
    ...conAlgo.filter((j) => j.tipo === 'ia').map((j) => ({ jugador: j.id })),
  ]
}

/** El orden del turno en curso, para leerlo (`Bruno, La Oscuridad ×2, Ana, La Oscuridad`); nada si no lo tiene */
export function textoDeIniciativa(m: Mapa): string | undefined {
  if (m.ordenDelTurno?.numero !== numeroDeTurno(m)) return
  const { jugadores } = jugadoresDe(m)
  return m.ordenDelTurno.huecos
    .map(({ jugador, activaciones }) => `${jugadores.find((j) => j.id === jugador)?.nombre ?? jugador}${activaciones && activaciones > 1 ? ` ×${activaciones}` : ''}`)
    .join(', ')
}
