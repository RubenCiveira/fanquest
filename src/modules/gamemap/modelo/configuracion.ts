import type { Jugadores } from './jugadores'
import type { TipoTerreno } from './terreno'

/** Reglas de activación y de movimiento que fija el proyecto */
export type Configuracion = {
  /**
   * A quién le toca activar una escuadra: `alternas`, tras cada activación la
   * siguiente alianza (y dentro de ella, el siguiente de sus jugadores);
   * `personajes-primero`, la primera alianza hasta que no le quede nada que
   * activar (rotando sus jugadores), luego la siguiente
   */
  ordenActivaciones: 'alternas' | 'personajes-primero'
  /** Si cada escuadra elige activarse en modo agresivo o sigiloso, o todas las activaciones son normales */
  modosActivacion: 'normal' | 'agresivo-sigiloso'
  /**
   * Cómo se mide lo que se mueve un personaje: `ortogonal`, casilla a casilla sin
   * diagonales; `diagonal`, también en diagonal y cada paso cuesta lo mismo;
   * `euclidea`, también en diagonal pero el largo del camino por Pitágoras
   * (√2 cada paso en diagonal), redondeado hacia arriba
   */
  medicionMovimiento: 'ortogonal' | 'diagonal' | 'euclidea'
  /**
   * Cómo cuenta para moverse la casilla en que hay otro personaje que no sea
   * enemigo. `normal`,
   * se pasa por encima como si nada; `dificil` o `muy-dificil`, lo entorpece;
   * `impasable`, lo bloquea (uno parado ante una puerta cierra el paso). Nunca
   * se puede terminar encima de otro personaje. Los enemigos, siempre impasables
   */
  terrenoPersonajes: 'normal' | TipoTerreno
  /** Alianzas y jugadores con que empieza la partida: el gestor los guarda en el mapa y pueden cambiar (`cambiarJugadores`) */
  jugadores: Jugadores
}
