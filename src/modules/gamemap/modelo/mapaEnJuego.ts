import type { Estancia } from './estancia'
import type { DescripcionPersonajeNoJugador } from './descripcionPersonaje'
import type { Jugadores } from './jugadores'
import type { Mapa } from './mapa'
import type { PersonajeNoJugador } from './personajeNoJugador'
import type { Puerta } from './puerta'
import type { Ubicacion } from './ubicacion'

/** Lo que el gestor deja hacer al proyecto sobre el mapa: al preguntar por las acciones y desde sus comandos */
export interface MapaEnJuego {
  /** El mapa tal como está ahora */
  readonly mapa: Mapa
  /** Puerta de esa casilla, si la hay */
  puertaEn(ubicacion: Ubicacion): Puerta | undefined
  /**
   * Abre la puerta de esa casilla: pide al proveedor la estancia a la que da
   * y la marca abierta hacia ella. Falla si no hay puerta, ya está abierta o
   * el proveedor no da la estancia (la puerta sigue cerrada)
   */
  abrirPuerta(ubicacion: Ubicacion): Promise<Estancia>
  /**
   * Añade a la estancia esos personajes no jugadores, cada uno donde diga su
   * aparición (en una casilla libre que no sea impasable; si no hay sitio, en la
   * zona de espera). Falla si la estancia no existe o un id ya está en el mapa
   */
  anadirPersonajes(estancia: string, personajes: DescripcionPersonajeNoJugador[]): PersonajeNoJugador[]
  /**
   * Cambia las alianzas, los jugadores o sus posturas en mitad de la partida
   * (un evento vuelve enemigos a unos acólitos…). Si el reparto no vale, no
   * cambia nada y devuelve el motivo
   */
  cambiarJugadores(jugadores: Jugadores): string | undefined
  /** Pasa al turno siguiente si todas las activaciones han terminado */
  terminarTurno(): string | undefined
}
