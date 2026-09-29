export type { Accion } from './modelo/accion'
export type { AccionEjecutada } from './modelo/accionEjecutada'
export type { Activacion, ModoActivacion, ModoAgresivoSigiloso } from './modelo/activacion'
export type { Casilla } from './modelo/casilla'
export { esComando, type Comando } from './modelo/comando'
export type { Configuracion } from './modelo/configuracion'
export type { DescripcionElemento, DescripcionEstancia } from './modelo/descripcionEstancia'
export { OPUESTA, type Direccion } from './modelo/direccion'
export type { Elemento, FichaHeroe, Objeto } from './modelo/elemento'
export type { Escuadra } from './modelo/escuadra'
export type { EstadoEscuadra, PosicionHeroe } from './modelo/estadoEscuadra'
export type { Heroe } from './modelo/heroe'
export type { HeroeEnMapa } from './modelo/heroeEnMapa'
export type { MapaEnJuego } from './modelo/mapaEnJuego'
export type { Estancia, TipoEstancia } from './modelo/estancia'
export type { DatosEscuadra, Mapa } from './modelo/mapa'
export type { OpcionesMovimiento, OpcionMovimiento, TramoMovimiento } from './modelo/opcionesMovimiento'
export type { Medida } from './modelo/medida'
export type { MovimientoGastado } from './modelo/movimientoGastado'
export type { MovimientoHecho } from './modelo/movimientoHecho'
export type { Puerta } from './modelo/puerta'
export type { ResultadoActivacion } from './modelo/resultadoActivacion'
export type { Turno } from './modelo/turno'
export type { Ubicacion } from './modelo/ubicacion'
export { accionesDelGestor, CAMBIAR_MODO, ejecutarAccion, estadoDeEscuadra, modoActual, motivoParaNoActuar, TERMINAR_TURNO } from './acciones'
export {
  activar,
  escuadraActiva,
  escuadrasDelMapa,
  esperandoA,
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
export {
  accionesAdicionales,
  accionesConsumidas,
  alcance,
  casillaDelMapa,
  enElMapa,
  evaluarRecorrido,
  extenderRecorrido,
  gastadoPor,
  mover,
  sePuedePasar,
  transitable,
  type RecorridoEvaluado,
} from './movimiento'
export { casillaDelMuro, largoMuro, orientar } from './orientacion'
export { aparte, marcarAbierta, pegar, puertaEn } from './puertas'
export { GestorMapa } from './gestor/GestorMapa'
export type { ProveedorConfiguracion } from './gestor/ProveedorConfiguracion'
export type { ProveedorConfirmacion } from './gestor/ProveedorConfirmacion'
export type { ProveedorEstancias } from './gestor/ProveedorEstancias'
export type { ProveedorHeroes } from './gestor/ProveedorHeroes'
export type { ProveedorMapa } from './gestor/ProveedorMapa'
