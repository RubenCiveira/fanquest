import type { Estancia } from './estancia'
import type { DescripcionMueble } from './descripcionEstancia'
import type { DescripcionPersonajeNoJugador } from './descripcionPersonaje'
import type { Elemento } from './elemento'
import type { Jugadores } from './jugadores'
import type { Mapa } from './mapa'
import type { Personaje } from './personaje'
import type { PersonajeEnJuego } from './personajeEnJuego'
import type { PersonajeNoJugador } from './personajeNoJugador'
import type { Puerta } from './puerta'
import type { Ubicacion } from './ubicacion'

/** Lo que el gestor deja hacer al proyecto sobre el mapa: al preguntar por las acciones y desde sus comandos */
export interface MapaEnJuego {
  /** El mapa tal como está ahora */
  readonly mapa: Mapa
  /** El personaje con ese id (de escuadra o no jugador), en juego: para saber si está trabado, sus apoyos… */
  personaje(id: string): PersonajeEnJuego | undefined
  /** Los personajes de esa estancia (colocados o en su zona de espera), en juego */
  personajesEn(estancia: string): PersonajeEnJuego[]
  /** Puerta de esa casilla, si la hay */
  puertaEn(ubicacion: Ubicacion): Puerta | undefined
  /** Si esa estancia tiene marcada esa bandera de estado */
  tieneFlag(estancia: string, flag: string): boolean
  /** Marca esa bandera de estado en la estancia, si existe */
  marcarFlag(estancia: string, flag: string): string | undefined
  /** Elementos colocados junto al personaje */
  dameLoQueEstaAlLado(personaje: Personaje): Elemento[]
  /** Quita el elemento de su estancia (un personaje coge el objeto…); si no está, el motivo */
  quitarElemento(elemento: string): string | undefined
  /** Si ese mueble tiene marcada esa bandera de estado */
  tieneFlagMueble(mueble: string, flag: string): boolean
  /** Marca esa bandera de estado en el mueble, si existe */
  marcarFlagMueble(mueble: string, flag: string): string | undefined
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
  /** Añade muebles nuevos a la estancia, colocándolos al azar donde quepan */
  anadirMuebles(estancia: string, muebles: DescripcionMueble[]): Elemento[]
  /** Quita esos puntos de vida al personaje (de escuadra o no jugador); si no está o no lleva la cuenta, el motivo */
  reducirVida(personaje: string, puntos: number): string | undefined
  /** Quita al personaje del mapa (muere, huye…); si no está, el motivo */
  eliminarPersonaje(personaje: string): string | undefined
  /**
   * Cambia las alianzas, los jugadores o sus posturas en mitad de la partida
   * (un evento vuelve enemigos a unos acólitos…). Si el reparto no vale, no
   * cambia nada y devuelve el motivo
   */
  cambiarJugadores(jugadores: Jugadores): string | undefined
  /** Pasa al turno siguiente si todas las activaciones han terminado */
  terminarTurno(): string | undefined
}
