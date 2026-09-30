export type { Accion } from './modelo/accion'
export type { AccionEjecutada } from './modelo/accionEjecutada'
export type { Aparicion, Zona } from './modelo/aparicion'
export type { Alianza, Postura } from './modelo/alianza'
export type { Activacion, ModoActivacion, ModoAgresivoSigiloso } from './modelo/activacion'
export type { Casilla } from './modelo/casilla'
export type { ClaseDeEscuadra } from './modelo/claseDeEscuadra'
export type { ClaseDePersonaje } from './modelo/claseDePersonaje'
export { esComando, type Comando } from './modelo/comando'
export type { Configuracion } from './modelo/configuracion'
export type { DescripcionElemento, DescripcionEstancia } from './modelo/descripcionEstancia'
export type { DescripcionPersonaje, DescripcionPersonajeNoJugador } from './modelo/descripcionPersonaje'
export { OPUESTA, type Direccion } from './modelo/direccion'
export type { Elemento, Objeto } from './modelo/elemento'
export type { Escuadra, TurnoDeEscuadra } from './modelo/escuadra'
export type { Estancia, TipoEstancia } from './modelo/estancia'
export type { Personaje, TurnoDePersonaje } from './modelo/personaje'
export type { Jugador, TipoJugador } from './modelo/jugador'
export type { Jugadores } from './modelo/jugadores'
export type { Mapa } from './modelo/mapa'
export type { MapaEnJuego } from './modelo/mapaEnJuego'
export type { Medida } from './modelo/medida'
export type { MovimientoGastado } from './modelo/movimientoGastado'
export type { MovimientoHecho } from './modelo/movimientoHecho'
export type { OpcionesMovimiento, OpcionMovimiento, TramoMovimiento } from './modelo/opcionesMovimiento'
export type { PersonajeNoJugador } from './modelo/personajeNoJugador'
export type { Puerta } from './modelo/puerta'
export type { Terreno, TipoTerreno } from './modelo/terreno'
export type { ResultadoActivacion } from './modelo/resultadoActivacion'
export type { Ubicacion } from './modelo/ubicacion'
export { accionesDelGestor, accionesDelModo, apuntarAccion, CAMBIAR_MODO, ejecutarAccion, modoActual, motivoParaNoActuar, TERMINAR_TURNO } from './acciones'
export {
  activacionDe,
  activacionDeJugador,
  activacionDeNoJugador,
  activacionesDeJugador,
  activar,
  conActivacionDeJugador,
  conPersonajeNoJugador,
  conRotacion,
  escuadraActiva,
  escuadrasDe,
  esperandoA,
  jugadorEnTurno,
  jugadoresDe,
  motivoDeTurno,
  personajesDelMapa,
  personajesNoJugadoresDe,
  todosLosPersonajes,
  modosPermitidos,
  motivoParaNoActivar,
  motivoParaNoTerminarTurno,
  numeroDeTurno,
  terminarActivacion,
  terminarTurno,
  turnoDeEscuadra,
  turnoDePersonaje,
} from './activaciones'
export { anadirPersonajesNoJugadores, huecoDePersonaje, sitioParaPersonaje } from './apariciones'
export { esEnemigo, jugadorDe, motivoParaNoCambiarJugadores, postura } from './jugadores'
export { construirEstancia } from './construccion'
export { buscarSitio, colocarElemento, motivoParaNoColocar, situar } from './elementos'
export { anidar, crearEstancia, estanciaEn, estanciasDe, motivoParaNoAnidar } from './estancias'
export {
  accionesAdicionales,
  accionesConsumidas,
  alcance,
  casillaDelMapa,
  casillasDeEnemigos,
  conPersonajes,
  costeDe,
  costesDe,
  enElMapa,
  evaluarRecorrido,
  gastadoPor,
  mover,
  ruta,
  sePuedePasar,
  transitable,
  type MedicionMovimiento,
  type RecorridoEvaluado,
} from './movimiento'
export { casillaDelMuro, largoMuro, orientar } from './orientacion'
export { aparte, marcarAbierta, pegar, puertaEn } from './puertas'
export { COSTE_TERRENO, factorDeTerreno, motivoParaNoAnadirTerreno, terrenoEn } from './terrenos'
export { GestorMapa } from './gestor/GestorMapa'
export type { ProveedorConfiguracion } from './gestor/ProveedorConfiguracion'
export type { ProveedorConfirmacion } from './gestor/ProveedorConfirmacion'
export type { ProveedorEstancias } from './gestor/ProveedorEstancias'
export type { ProveedorPersonajes } from './gestor/ProveedorPersonajes'
export type { ProveedorTurnos } from './gestor/ProveedorTurnos'
export type { ProveedorMapa } from './gestor/ProveedorMapa'
