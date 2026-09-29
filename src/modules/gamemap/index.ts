export type { Accion } from './modelo/accion'
export type { Activacion, ModoActivacion, ModoAgresivoSigiloso } from './modelo/activacion'
export type { Casilla } from './modelo/casilla'
export type { Configuracion } from './modelo/configuracion'
export type { DescripcionElemento, DescripcionEstancia } from './modelo/descripcionEstancia'
export { OPUESTA, type Direccion } from './modelo/direccion'
export type { Elemento, FichaHeroe, Objeto } from './modelo/elemento'
export type { Escuadra } from './modelo/escuadra'
export type { EstadoEscuadra, PosicionHeroe } from './modelo/estadoEscuadra'
export type { Heroe } from './modelo/heroe'
export type { Estancia, TipoEstancia } from './modelo/estancia'
export type { DatosEscuadra, Mapa } from './modelo/mapa'
export type { Medida } from './modelo/medida'
export type { Puerta } from './modelo/puerta'
export type { Turno } from './modelo/turno'
export { accionesDelGestor, CAMBIAR_MODO, ejecutarAccion, estadoDeEscuadra, modoActual, motivoParaNoActuar, TERMINAR_TURNO } from './acciones'
export {
  activar,
  escuadrasDelMapa,
  heroesDelMapa,
  modosPermitidos,
  motivoParaNoActivar,
  motivoParaNoTerminarTurno,
  terminarActivacion,
  terminarTurno,
  turnoDe,
} from './activaciones'
export { construirEstancia } from './construccion'
export { buscarSitio, colocarElemento, motivoParaNoColocar, situar } from './elementos'
export { anidar, crearEstancia, estanciaEn, estanciasDe, motivoParaNoAnidar } from './estancias'
export { largoMuro, orientar } from './orientacion'
export { GestorMapa } from './gestor/GestorMapa'
export type { ProveedorConfiguracion } from './gestor/ProveedorConfiguracion'
export type { ProveedorEstancias } from './gestor/ProveedorEstancias'
export type { ProveedorHeroes } from './gestor/ProveedorHeroes'
export type { ProveedorMapa } from './gestor/ProveedorMapa'
