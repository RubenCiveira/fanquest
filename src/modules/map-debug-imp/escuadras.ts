import { cargarHeroes, urlFichaVtt } from '../../lib/personajes'
import type { AccionEjecutada, ClaseDeEscuadra, DescripcionPersonajeNoJugador, ProveedorPersonajes, ResultadoActivacion } from '../gamemap'
import { JUGADOR_MONSTRUOS } from './configuracion'
import { PersonajeDePrueba, MOVER } from './modelo/personaje'
import type { PuertasDePrueba } from './modelo/puerta'

/**
 * La activación de una escuadra de prueba está completa cuando a ninguno de sus
 * `personajes` (ids) le quedan acciones: cada uno se ha movido y además ha
 * hecho otra acción suya (deslizar, coger…). Las de la escuadra sin personaje
 * (cambiar de modo) no cuentan
 */
export const activacionDePrueba = (acciones: AccionEjecutada[], personajes: string[]): ResultadoActivacion => ({
  completo: personajes.every((id) => {
    const suyas = acciones.filter((a) => a.personaje === id)
    return suyas.some((a) => a.accion === MOVER.id) && suyas.some((a) => a.accion !== MOVER.id)
  }),
})

/**
 * Clase de una escuadra de prueba con los personajes de FetenQuest de esos ids
 * (`PersonajeDePrueba`, con su ficha VTT vista desde arriba, que abren las puertas
 * de `puertas`); empieza en modo sigiloso y su turno termina según
 * `activacionDePrueba`
 */
function escuadra(id: string, nombre: string, jugador: string, ids: string[], puertas: PuertasDePrueba): ClaseDeEscuadra {
  // las mismas clases de personaje cada vez
  let suyos: Promise<PersonajeDePrueba[]> | undefined
  return {
    id,
    nombre,
    jugador,
    personajes: () =>
      (suyos ??= cargarHeroes().then((todos) =>
        todos
          .filter((h) => ids.includes(h.id))
          .map((h) => new PersonajeDePrueba({ id: h.id, nombre: h.nombre, imagenVtt: urlFichaVtt('heroes', h.id, 'hombre', 'vtt-heroe') }, puertas)),
      )),
    modoActivacion: async () => 'sigiloso',
    activar: async (acciones) => {
      const resultado = activacionDePrueba(acciones, ids)
      // banco de pruebas: se ve en la consola qué recibe y qué responde cada escuadra
      console.log(`[map-debug] activar ${id}`, acciones, resultado)
      return resultado
    },
  }
}

/** Dos escuadras de prueba, la de Ana con el bárbaro y la de Bruno con el enano, más las escuadras de monstruos elegidas */
export const escuadrasDePrueba = (puertas: PuertasDePrueba, escuadrasMonstruos: () => DescripcionPersonajeNoJugador[][] = () => []): ProveedorPersonajes => ({
  listarEscuadras: async () => [
    escuadra('escuadra-barbaro', 'Escuadra del bárbaro', 'ana', ['barbaro'], puertas),
    escuadra('escuadra-enano', 'Escuadra del enano', 'bruno', ['enano'], puertas),
    ...escuadrasMonstruos().map((personajes, i): ClaseDeEscuadra => {
      let suyos: PersonajeDePrueba[] | undefined
      return {
        id: `escuadra-monstruos-${i + 1}`,
        nombre: `Escuadra de monstruos ${i + 1}`,
        jugador: JUGADOR_MONSTRUOS,
        personajes: async () => (suyos ??= personajes.map((p) => new PersonajeDePrueba(p, puertas))),
        modoActivacion: async () => 'sigiloso',
        activar: async (acciones) => activacionDePrueba(acciones, personajes.map((p) => p.id)),
      }
    }),
  ],
})
