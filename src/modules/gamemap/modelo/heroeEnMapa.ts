import type { Ubicacion } from './ubicacion'

/** Un héroe colocado en el mapa, tal como el gestor se lo pasa a su escuadra al preguntarle por sus acciones */
export type HeroeEnMapa = { id: string; nombre: string; escuadra: string; posicion: Ubicacion }
