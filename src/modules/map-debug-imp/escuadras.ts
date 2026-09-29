import { cargarHeroes, urlFichaVtt } from '../../lib/personajes'
import type { AccionEjecutada, Escuadra, MovimientoGastado, OpcionesMovimiento, ProveedorHeroes, ResultadoActivacion } from '../gamemap'

const MOVER = { id: 'mover', nombre: 'Mover' }
const DESLIZAR = { id: 'deslizar', nombre: 'Deslizar' }

/** Casillas del movimiento de un héroe de prueba */
const MOVIMIENTO = 6

/**
 * Cómo se mueve un héroe de prueba: 6 casillas sin acercarse a un enemigo,
 * 8 para cargar contra uno o 6 más 3 deslizando (otra acción)
 */
export const MOVIMIENTO_DE_PRUEBA: OpcionesMovimiento = {
  base: { id: 'mover', nombre: 'Mover', tipo: 'normal', accion: MOVER, tramos: [{ distancia: MOVIMIENTO }], alejarseDeEnemigos: 1 },
  variaciones: [
    { id: 'cargar', nombre: 'Cargar', tipo: 'carga', accion: { id: 'cargar', nombre: 'Cargar' }, tramos: [{ distancia: 8 }], terminarJuntoAEnemigo: true },
    {
      id: 'mover-y-deslizar',
      nombre: 'Mover y deslizar',
      tipo: 'normal',
      accion: MOVER,
      tramos: [{ distancia: MOVIMIENTO }, { distancia: 3, accion: DESLIZAR }],
      alejarseDeEnemigos: 1,
    },
  ],
}

/**
 * Cómo puede moverse un héroe de prueba tras lo que ya ha movido este turno:
 * sin moverse, `MOVIMIENTO_DE_PRUEBA`; si ya se ha movido, lo que le quede de
 * mover más deslizar 3 (sin cargar); si ya ha deslizado, no puede moverse más
 */
export function movimientoDePrueba({ casillas, acciones }: MovimientoGastado): OpcionesMovimiento | undefined {
  if (acciones.includes(DESLIZAR.id)) return
  if (!casillas) return MOVIMIENTO_DE_PRUEBA
  const quedan = Math.max(0, MOVIMIENTO - casillas)
  const [, deslizar] = MOVIMIENTO_DE_PRUEBA.variaciones
  return {
    base: { ...MOVIMIENTO_DE_PRUEBA.base, tramos: [{ distancia: quedan }] },
    variaciones: [{ ...deslizar, tramos: [{ distancia: quedan }, { distancia: 3, accion: DESLIZAR }] }],
  }
}

/** La activación de una escuadra de prueba está completa cuando se ha movido y además ha hecho otra acción (deslizar…) */
export const activacionDePrueba = (acciones: AccionEjecutada[]): ResultadoActivacion => ({
  completo: acciones.some((a) => a.accion === MOVER.id) && acciones.some((a) => a.accion !== MOVER.id),
})

/**
 * Escuadra con los héroes de FetenQuest de esos ids, con su ficha VTT vista
 * desde arriba; empieza en modo sigiloso y por ahora no tiene acciones propias.
 * Sus héroes se mueven según `movimientoDePrueba` y su turno termina según
 * `activacionDePrueba`
 */
const escuadra = (id: string, nombre: string, ids: string[]): Escuadra => ({
  id,
  nombre,
  heroes: async () =>
    (await cargarHeroes())
      .filter((h) => ids.includes(h.id))
      .map((h) => ({
        id: h.id,
        nombre: h.nombre,
        imagenVtt: urlFichaVtt('heroes', h.id, 'hombre', 'vtt-heroe'),
        opcionesMovimiento: async (_estado, gastado) => movimientoDePrueba(gastado),
      })),
  modoActivacion: async () => 'sigiloso',
  acciones: async () => [],
  activar: async (acciones) => {
    const resultado = activacionDePrueba(acciones)
    // banco de pruebas: se ve en la consola qué recibe y qué responde cada escuadra
    console.log(`[map-debug] activar ${id}`, acciones, resultado)
    return resultado
  },
})

/** Dos escuadras de prueba: una con el bárbaro y otra con el enano */
export const escuadrasDePrueba: ProveedorHeroes = {
  listarEscuadras: async () => [
    escuadra('escuadra-barbaro', 'Escuadra del bárbaro', ['barbaro']),
    escuadra('escuadra-enano', 'Escuadra del enano', ['enano']),
  ],
}
