import { urlRetrato, type Monstruo } from '../../lib/personajes'
import { todosLosPersonajes, type DescripcionPersonajeNoJugador, type Mapa } from '../gamemap'
import { JUGADOR_MONSTRUOS } from './configuracion'

/**
 * Monstruos de la Oscuridad (`JUGADOR_MONSTRUOS`) al azar (`azar`, entre 0 y 1) de los que
 * tienen imagen, con su cuerpo como vida, para una estancia nueva: sin posición, así que el gestor los
 * reparte al azar por ella. Sus ids no repiten los de los personajes del mapa
 */
export function monstruosDePrueba(
  monstruos: Monstruo[],
  mapa?: Mapa,
  azar: () => number = Math.random,
  cantidad = 1 + Math.floor(azar() * 2),
  idsReservados: string[] = [],
): DescripcionPersonajeNoJugador[] {
  const conImagen = monstruos.filter((m) => m.imagen)
  if (!conImagen.length) return []
  const usados = new Set([...(mapa ? todosLosPersonajes(mapa).map((p) => p.id) : []), ...idsReservados])
  return Array.from({ length: cantidad }, () => {
    const monstruo = conImagen[Math.floor(azar() * conImagen.length)]
    let n = 1
    while (usados.has(`${monstruo.id}-${n}`)) n++
    usados.add(`${monstruo.id}-${n}`)
    return { id: `${monstruo.id}-${n}`, nombre: monstruo.nombre, imagenVtt: urlRetrato('monstruos', monstruo), vida: monstruo.cuerpo, jugador: JUGADOR_MONSTRUOS }
  })
}

/** Monstruos de prueba de una plantilla concreta, con ids no repetidos */
export function monstruosDePruebaDeTipo(monstruos: Monstruo[], tipo: string, mapa?: Mapa, cantidad = 1, idsReservados: string[] = []): DescripcionPersonajeNoJugador[] {
  return monstruosDePrueba(monstruos.filter((m) => m.id === tipo), mapa, () => 0, cantidad, idsReservados)
}
