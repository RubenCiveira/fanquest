import type { Casilla } from './casilla'
import type { OpcionMovimiento } from './opcionesMovimiento'
import type { Ubicacion } from './ubicacion'

/** De quién o de qué se acerca o se aleja un desplazamiento: un personaje, una escuadra (el más cercano de los suyos), un sitio o el enemigo más cercano */
export type Referencia = { personaje: string } | { escuadra: string } | { ubicacion: Ubicacion } | { enemigos: true }

/** Lo que tienen en común las dos formas de pedir un desplazamiento */
type Forzado = {
  /** Cómo le afectan el terreno y los muros interiores, como en `OpcionMovimiento` (sin ella, lo normal) */
  forma?: Pick<OpcionMovimiento, 'terreno' | 'cruzaMuros'>
  /** Si se pregunta a su clase al entrar en cada casilla (`ClaseDePersonaje.alEntrar`); sin decirlo, sí */
  alEntrar?: boolean
}

/**
 * Desplazamiento forzado (huir, consolidar, retroceder…): hacia o lejos de
 * `de`, recorriendo como mucho `casillas` (lo que cuesta el camino, con el
 * terreno) y parándose al quedar a `hasta` de la referencia (en línea recta,
 * según la medición del movimiento). Sin `hasta`, apura las casillas
 */
export type Desplazamiento = Forzado & {
  sentido: 'hacia' | 'lejos'
  de: Referencia
  casillas: number
  hasta?: number
  /** Si rodea la zona de control de sus enemigos; sin decirlo, la ignora */
  zonaDeControl?: 'ignorar' | 'respetar'
}

/** Desplazamiento forzado por un recorrido concreto (empujar a una casilla…), en casillas del mapa y empezando en la del personaje */
export type DesplazamientoPorRecorrido = Forzado & { recorrido: Casilla[] }

/**
 * Cómo ha quedado un desplazamiento forzado: por dónde ha ido (en casillas
 * del mapa, desde la suya; solo la suya si no se ha movido) y si ha llegado
 * a donde se pedía (a `hasta` de la referencia o al final del recorrido, sin
 * que lo detenga lo que pasa al entrar); o por qué no se ha podido
 */
export type ResultadoDesplazamiento = { personaje: string; recorrido: Casilla[]; llega: boolean } | { personaje: string; motivo: string }
