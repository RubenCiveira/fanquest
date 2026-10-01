import type { Casilla } from './casilla'
import type { Direccion } from './direccion'
import type { TipoCobertura } from './terreno'

/** Borde entre una casilla de una estancia y la de al lado: la casilla y el lado por el que se cruza */
export type Arista = { casilla: Casilla; lado: Direccion }

/**
 * Muro dentro de una estancia: no la divide en estancias ni ocupa casillas,
 * va por los bordes entre ellas, en línea recta de la esquina `desde` a la
 * `hasta` (en coordenadas de esquina: la superior izquierda de la casilla x,y
 * es x,y). No se puede cruzar salvo por sus `pasos` (los tramos, por su
 * orden de arriba abajo o de izquierda a derecha, desde 0, que se cruzan
 * limpiamente) y sus puertas abiertas. A los disparos que lo cruzan, el muro
 * les da cobertura bloqueante; sus puertas, bloqueante cerradas y ligera
 * abiertas; y sus pasos, la `cobertura` del muro (sin ella, ligera). Sus puertas van en
 * `Estancia.puertas`, de tipo `interior`, en el borde de uno de sus tramos
 */
export type Muro = { id: string; desde: Casilla; hasta: Casilla; pasos?: number[]; cobertura?: TipoCobertura }
