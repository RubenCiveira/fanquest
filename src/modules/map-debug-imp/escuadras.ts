import { cargarHeroes, urlFichaVtt } from '../../lib/personajes'
import type { AccionEjecutada, ClaseDeEscuadra, DescripcionPersonajeNoJugador, Escuadra, MapaEnJuego, PersonajeEnJuego, ProveedorPersonajes, ResultadoActivacion } from '../gamemap'
import { JUGADOR_MONSTRUOS } from './configuracion'
import { PersonajeDePrueba, MOVER, type DialogosDePrueba } from './modelo/personaje'
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
 * (`PersonajeDePrueba`, con su ficha VTT vista desde arriba y su cuerpo como
 * vida, que abren las puertas de `puertas`, usan los diálogos de
 * `dialogos` y tiran los dados con `azar`); empieza en modo sigiloso y su turno termina según
 * `activacionDePrueba`
 */
function escuadra(id: string, nombre: string, jugador: string, ids: string[], puertas: PuertasDePrueba, dialogos: DialogosDePrueba, azar: () => number): ClaseDeEscuadra {
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
          .map((h) => new PersonajeDePrueba({ id: h.id, nombre: h.nombre, imagenVtt: urlFichaVtt('heroes', h.id, 'hombre', 'vtt-heroe'), vida: h.cuerpo }, puertas, dialogos, azar)),
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
/** Sin diálogos: los ataques no se resuelven y los avisos no se ven */
const sinDialogos: DialogosDePrueba = { resolverAtaque: () => Promise.reject(new Error('Este banco de pruebas no resuelve ataques')), avisar: async () => {} }

export const escuadrasDePrueba = (
  puertas: PuertasDePrueba,
  escuadrasMonstruos: () => DescripcionPersonajeNoJugador[][] = () => [],
  dialogos: DialogosDePrueba = sinDialogos,
  azar: () => number = Math.random,
): ProveedorPersonajes => ({
  listarEscuadras: async () => [
    escuadra('escuadra-barbaro', 'Escuadra del bárbaro', 'ana', ['barbaro'], puertas, dialogos, azar),
    escuadra('escuadra-enano', 'Escuadra del enano', 'bruno', ['enano'], puertas, dialogos, azar),
    ...escuadrasMonstruos().map((personajes, i): ClaseDeEscuadra => {
      let suyos: PersonajeDePrueba[] | undefined
      return {
        id: `escuadra-monstruos-${i + 1}`,
        nombre: `Escuadra de monstruos ${i + 1}`,
        jugador: JUGADOR_MONSTRUOS,
        // los monstruos del dueño de la mazmorra, como los solitarios, no buscan trampas
        buscaTrampas: false,
        personajes: async () => (suyos ??= personajes.map((p) => new PersonajeDePrueba(p, puertas, dialogos, azar))),
        modoActivacion: async () => 'sigiloso',
        activar: async (acciones) => activacionDePrueba(acciones, personajes.map((p) => p.id)),
      }
    }),
  ],
})

/**
 * Lo que hace el banco de pruebas con los personajes que quedan fuera de la
 * coherencia de su escuadra al terminar su activación: los quita del mapa como
 * si hubieran muerto y lo avisa en un diálogo
 */
export function sinCoherenciaDePrueba(escuadra: Escuadra, fuera: PersonajeEnJuego[], mapa: MapaEnJuego, dialogos: DialogosDePrueba) {
  for (const { id } of fuera) mapa.eliminarPersonaje(id)
  const varios = fuera.length > 1
  return dialogos.avisar({
    titulo: 'Fuera de coherencia',
    texto: `${fuera.map((p) => p.nombre).join(' y ')} ${varios ? 'han quedado' : 'ha quedado'} fuera de la coherencia de ${escuadra.nombre} y ${varios ? 'desaparecen' : 'desaparece'}.`,
  })
}
