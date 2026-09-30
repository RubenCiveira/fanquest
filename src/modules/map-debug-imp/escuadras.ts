import { cargarHeroes, urlFichaVtt } from '../../lib/personajes'
import type { AccionEjecutada, ClaseDeEscuadra, ProveedorPersonajes, ResultadoActivacion } from '../gamemap'
import { PersonajeDePrueba, MOVER } from './modelo/personaje'
import type { PuertasDePrueba } from './modelo/puerta'

/** La activación de una escuadra de prueba está completa cuando se ha movido y además ha hecho otra acción (deslizar…) */
export const activacionDePrueba = (acciones: AccionEjecutada[]): ResultadoActivacion => ({
  completo: acciones.some((a) => a.accion === MOVER.id) && acciones.some((a) => a.accion !== MOVER.id),
})

/**
 * Clase de una escuadra de prueba con los personajes de FetenQuest de esos ids
 * (`PersonajeDePrueba`, con su ficha VTT vista desde arriba, que abren las puertas
 * de `puertas`); empieza en modo sigiloso y su turno termina según
 * `activacionDePrueba`
 */
function escuadra(id: string, nombre: string, ids: string[], puertas: PuertasDePrueba): ClaseDeEscuadra {
  // las mismas clases de personaje cada vez
  let suyos: Promise<PersonajeDePrueba[]> | undefined
  return {
    id,
    nombre,
    personajes: () =>
      (suyos ??= cargarHeroes().then((todos) =>
        todos
          .filter((h) => ids.includes(h.id))
          .map((h) => new PersonajeDePrueba({ id: h.id, nombre: h.nombre, imagenVtt: urlFichaVtt('heroes', h.id, 'hombre', 'vtt-heroe') }, puertas)),
      )),
    modoActivacion: async () => 'sigiloso',
    activar: async (acciones) => {
      const resultado = activacionDePrueba(acciones)
      // banco de pruebas: se ve en la consola qué recibe y qué responde cada escuadra
      console.log(`[map-debug] activar ${id}`, acciones, resultado)
      return resultado
    },
  }
}

/** Dos escuadras de prueba, una con el bárbaro y otra con el enano, cuyos personajes abren las puertas de `puertas` */
export const escuadrasDePrueba = (puertas: PuertasDePrueba): ProveedorPersonajes => ({
  listarEscuadras: async () => [
    escuadra('escuadra-barbaro', 'Escuadra del bárbaro', ['barbaro'], puertas),
    escuadra('escuadra-enano', 'Escuadra del enano', ['enano'], puertas),
  ],
})
