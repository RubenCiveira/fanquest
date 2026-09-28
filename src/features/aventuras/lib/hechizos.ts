import type { CartaMazo, Mazo } from '../../../lib/mazos'
import type { Heroe } from '../../../lib/personajes'

export type OpcionHechizos = {
  id: string
  titulo: string
  descripcion: string
  cartas: CartaMazo[]
}

const porGrupo = (mazo: Mazo, grupo: string, nivel?: number) =>
  mazo.cartas.filter((carta) => carta.grupo === grupo && (nivel === undefined || carta.nivel === nivel))

const opcion = (mazo: Mazo, id: string, titulo: string, descripcion: string, grupo: string, nivel?: number): OpcionHechizos => ({
  id,
  titulo,
  descripcion,
  cartas: porGrupo(mazo, grupo, nivel),
})

const tiene = (heroe: Heroe, habilidad: string) => heroe.habilidades.includes(habilidad) || heroe.eligeUna?.includes(habilidad)

export function opcionesHechizosHeroe(heroe: Heroe, mazo: Mazo): OpcionHechizos[] {
  const opciones: OpcionHechizos[] = []
  if (tiene(heroe, 'conocedor-de-la-magia-elemental') || tiene(heroe, 'maestro-de-la-magia-elemental')) {
    opciones.push(
      opcion(mazo, 'elemental-agua', 'Elementales de agua', 'Escoge este grupo elemental para el reto.', 'Elementales de agua'),
      opcion(mazo, 'elemental-aire', 'Elementales de aire', 'Escoge este grupo elemental para el reto.', 'Elementales de aire'),
      opcion(mazo, 'elemental-tierra', 'Elementales de tierra', 'Escoge este grupo elemental para el reto.', 'Elementales de tierra'),
      opcion(mazo, 'elemental-fuego', 'Elementales de fuego', 'Escoge este grupo elemental para el reto.', 'Elementales de fuego'),
    )
  }
  if (tiene(heroe, 'maestro-de-magia-bardica')) opciones.push(opcion(mazo, 'bardo', 'Bardo', 'Grupo de hechizos inicial.', 'Bardo'))
  if (tiene(heroe, 'maestro-de-la-brujeria')) opciones.push(opcion(mazo, 'brujeria', 'Brujería', 'Grupo de hechizos inicial.', 'Brujería'))
  if (tiene(heroe, 'maestro-de-la-magia-druidica')) opciones.push(opcion(mazo, 'druidicos', 'Druídicos', 'Grupo de hechizos inicial.', 'Druídicos'))
  if (tiene(heroe, 'maestro-de-la-nigromancia')) opciones.push(opcion(mazo, 'nigromancia-1', 'Nigromancia nivel 1', 'Grupo de hechizos inicial.', 'Nigromancia', 1))
  if (tiene(heroe, 'acolito-de-la-luz')) opciones.push(opcion(mazo, 'plegarias-1', 'Plegarias nivel 1', 'Grupo de plegarias inicial.', 'Plegarias', 1))
  if (tiene(heroe, 'conocimiento-arcano')) opciones.push(opcion(mazo, 'caos', 'Magia del Caos', 'Anota los resultados obtenidos al azar.', 'Magia del Caos'))
  if (tiene(heroe, 'maestro-runico') || tiene(heroe, 'fragua-runica')) {
    opciones.push(
      opcion(mazo, 'runas', 'Runas', 'Runas forjadas para el reto.', 'Runas'),
      opcion(mazo, 'runas-magistrales', 'Runas magistrales', 'Runas magistrales forjadas para el reto.', 'Runas magistrales'),
    )
  }
  if (tiene(heroe, 'afin-a-la-nigromancia')) opciones.push(opcion(mazo, 'nigromancia-vampiro', 'Nigromancia nivel 1', 'Hechizos obtenidos al renunciar a PC máximos.', 'Nigromancia', 1))
  return opciones.filter((opcion) => opcion.cartas.length)
}

export const puedeLanzarHechizos = (heroe: Heroe, mazo: Mazo) => opcionesHechizosHeroe(heroe, mazo).length > 0

export function hechizosInicialesHeroe(heroe: Heroe, mazo: Mazo): string[] {
  const fijos = new Set([
    'bardo',
    'brujeria',
    'druidicos',
    'nigromancia-1',
    'plegarias-1',
  ])
  return opcionesHechizosHeroe(heroe, mazo)
    .filter((opcion) => fijos.has(opcion.id))
    .flatMap((opcion) => opcion.cartas.map((carta) => carta.id))
}

export function cartasHechizosSeleccionadas(heroe: Heroe, mazo: Mazo, seleccion: string[] = []): CartaMazo[] {
  const permitidas = new Set(opcionesHechizosHeroe(heroe, mazo).flatMap((opcion) => opcion.cartas.map((carta) => carta.id)))
  return seleccion.flatMap((id) => mazo.cartas.find((carta) => carta.id === id && permitidas.has(id)) ?? [])
}
