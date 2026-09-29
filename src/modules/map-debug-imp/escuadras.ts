import { cargarHeroes, urlFichaVtt } from '../../lib/personajes'
import type { Escuadra, ProveedorHeroes } from '../gamemap'

/**
 * Escuadra con los héroes de FetenQuest de esos ids, con su ficha VTT vista
 * desde arriba; empieza en modo sigiloso y por ahora no tiene acciones propias
 */
const escuadra = (id: string, nombre: string, ids: string[]): Escuadra => ({
  id,
  nombre,
  heroes: async () =>
    (await cargarHeroes())
      .filter((h) => ids.includes(h.id))
      .map((h) => ({ id: h.id, nombre: h.nombre, imagenVtt: urlFichaVtt('heroes', h.id, 'hombre', 'vtt-heroe') })),
  modoActivacion: async () => 'sigiloso',
  acciones: async () => [],
})

/** Dos escuadras de prueba: una con el bárbaro y otra con el enano */
export const escuadrasDePrueba: ProveedorHeroes = {
  listarEscuadras: async () => [
    escuadra('escuadra-barbaro', 'Escuadra del bárbaro', ['barbaro']),
    escuadra('escuadra-enano', 'Escuadra del enano', ['enano']),
  ],
}
