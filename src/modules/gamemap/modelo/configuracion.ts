import type { Jugadores } from './jugadores'
import type { TipoTerreno } from './terreno'
import type { Coherencia } from './coherencia'

/** Reglas de activación y de movimiento que fija el proyecto */
export type Configuracion = {
  /**
   * A quién le toca activar una escuadra: `alternas`, tras cada activación la
   * siguiente alianza (y dentro de ella, el siguiente de sus jugadores);
   * `personajes-primero`, la primera alianza hasta que no le quede nada que
   * activar (rotando sus jugadores), luego la siguiente; `iniciativa`, el
   * orden que da el proveedor al empezar cada turno
   * (`ProveedorTurnos.ordenDelTurno`: cartas de iniciativa…) y, cuando se
   * acaba, como `alternas`
   */
  ordenActivaciones: 'alternas' | 'personajes-primero' | 'iniciativa'
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
  /**
   * Casillas alrededor de un personaje que controla (en recto o en diagonal;
   * 1: las de su lado). Ningún movimiento puede entrar en la zona de control
   * de un enemigo salvo una carga. Con 0, no hay zona de control
   */
  distanciaControl: number
  /**
   * Qué casillas están en contacto para el cuerpo a cuerpo: `ortogonal`, solo
   * las de al lado en recto (quien está en diagonal tiene que posicionarse
   * para atacar); `diagonal`, también las de las esquinas. Vale también para
   * terminar junto a un enemigo (cargar, posicionarse)
   */
  cuerpoACuerpo: 'ortogonal' | 'diagonal'
  /**
   * Si los personajes de cada escuadra tienen que mantenerse juntos y cómo
   * (`Coherencia`): a `distanciaCoherencia` o menos de alguno de los demás, en
   * cadena (`alguno`), de todos (`todos`) o del centro de un círculo puesto
   * donde deja dentro a más (`centro`). Se comprueba al terminar la activación de cada escuadra
   * (`ProveedorTurnos.escuadraSinCoherencia`). Con `ninguna`, no hay coherencia
   */
  coherencia: 'ninguna' | Coherencia['modo']
  /** Distancia de coherencia, en línea recta según `medicionMovimiento` (por Pitágoras, con el centro) */
  distanciaCoherencia: number
  /**
   * Cómo atacan los personajes de las escuadras: `uno-a-uno`, cada uno a su
   * objetivo; `escuadra`, al atacar a un enemigo atacan juntos a su escuadra
   * todos los de la escuadra atacante que aún puedan, y el daño se reparte
   * entre la escuadra objetivo (`ClaseDeEscuadra.atacarEscuadra`)
   */
  modoAtaque: 'uno-a-uno' | 'escuadra'
  /**
   * Casillas que se acercan los demás de la escuadra que carga a la escuadra
   * cargada cuando uno de ellos termina una carga en contacto con un enemigo,
   * hasta el contacto (no está en One Page Rules). Con 0, no se acercan
   */
  apoyoALaCarga: number
  /**
   * Casillas que se acercan, tras esa carga, los de la escuadra cargada a los
   * de la que carga, hasta el contacto (One Page Rules: 3″). Con 0, no se
   * acercan
   */
  ajusteDelDefensor: number
  /**
   * Tras un ataque cuerpo a cuerpo, si la escuadra atacada queda destruida,
   * casillas que avanza la atacante hacia el enemigo más cercano (One Page
   * Rules: 3″). Con 0, no avanza
   */
  consolidacionTrasCombate: number
  /**
   * Tras un ataque cuerpo a cuerpo, si la escuadra atacada no queda
   * destruida, casillas que retrocede la atacante (One Page Rules: 1″). Con
   * 0, no retrocede
   */
  retrocesoTrasCombate: number
  /**
   * Lo que cuesta, en casillas de movimiento, cada giro de 90° del
   * encaramiento (darse la vuelta, el doble): al moverse, el personaje gira
   * hasta mirar hacia donde va y acaba mirando hacia su último paso. Con 0,
   * girar es gratis
   */
  costeGiro: number
  /**
   * Lo que cuesta empezar un tramo en diagonal, hacia una de las dos
   * diagonales de delante del encaramiento (para otra, antes hay que girar).
   * Con 0, nada
   */
  costeGiroDiagonal: number
  /** Alianzas y jugadores con que empieza la partida: el gestor los guarda en el mapa y pueden cambiar (`cambiarJugadores`) */
  jugadores: Jugadores
}
