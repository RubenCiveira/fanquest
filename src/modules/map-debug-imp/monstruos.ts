import { urlRetrato, type Monstruo } from '../../lib/personajes'
import { todosLosPersonajes, type DescripcionPersonajeNoJugador, type Mapa } from '../gamemap'
import { JUGADOR_MONSTRUOS } from './configuracion'

/**
 * Uno o dos monstruos de la Oscuridad (`JUGADOR_MONSTRUOS`) al azar (`azar`, entre 0 y 1) de los que
 * tienen imagen, para una estancia nueva: sin posición, así que el gestor los
 * reparte al azar por ella. Sus ids no repiten los de los personajes del mapa
 */
export function monstruosDePrueba(monstruos: Monstruo[], mapa?: Mapa, azar: () => number = Math.random): DescripcionPersonajeNoJugador[] {
  const conImagen = monstruos.filter((m) => m.imagen)
  if (!conImagen.length) return []
  const usados = new Set(mapa ? todosLosPersonajes(mapa).map((p) => p.id) : [])
  return Array.from({ length: 1 + Math.floor(azar() * 2) }, () => {
    const monstruo = conImagen[Math.floor(azar() * conImagen.length)]
    let n = 1
    while (usados.has(`${monstruo.id}-${n}`)) n++
    usados.add(`${monstruo.id}-${n}`)
    return { id: `${monstruo.id}-${n}`, nombre: monstruo.nombre, imagenVtt: urlRetrato('monstruos', monstruo), jugador: JUGADOR_MONSTRUOS }
  })
}
