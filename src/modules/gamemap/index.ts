export type { Accion } from './modelo/accion'
export type { AccionEjecutada } from './modelo/accionEjecutada'
export type { Ataque, TipoAtaque, Trayectoria } from './modelo/ataque'
export type { Aparicion, Zona } from './modelo/aparicion'
export type { Alianza, Postura } from './modelo/alianza'
export type { Activacion, ModoActivacion, ModoAgresivoSigiloso } from './modelo/activacion'
export type { Casilla } from './modelo/casilla'
export type { ClaseDeEscuadra } from './modelo/claseDeEscuadra'
export type { ClaseDePersonaje } from './modelo/claseDePersonaje'
export type { Coherencia, GuiaDeCoherencia } from './modelo/coherencia'
export { esComando, type Comando } from './modelo/comando'
export type { Configuracion } from './modelo/configuracion'
export type { DescripcionElemento, DescripcionEstancia, DescripcionMueble, DescripcionMuro } from './modelo/descripcionEstancia'
export type { DescripcionPersonaje, DescripcionPersonajeNoJugador } from './modelo/descripcionPersonaje'
export type { Desplazamiento, DesplazamientoPorRecorrido, Referencia, ResultadoDesplazamiento } from './modelo/desplazamiento'
export { OPUESTA, type Direccion } from './modelo/direccion'
export type { Elemento, Mueble, Objeto } from './modelo/elemento'
export type { Escuadra, TurnoDeEscuadra } from './modelo/escuadra'
export type { Estancia, TipoEstancia } from './modelo/estancia'
export type { Personaje, TurnoDePersonaje } from './modelo/personaje'
export type { Jugador, TipoJugador } from './modelo/jugador'
export type { Jugadores } from './modelo/jugadores'
export type { Mapa } from './modelo/mapa'
export type { Arista, Muro } from './modelo/muro'
export type { MapaEnJuego } from './modelo/mapaEnJuego'
export type { Medida } from './modelo/medida'
export type { MovimientoGastado } from './modelo/movimientoGastado'
export type { MovimientoHecho } from './modelo/movimientoHecho'
export type { OpcionesMovimiento, OpcionMovimiento, TramoMovimiento } from './modelo/opcionesMovimiento'
export type { HuecoDelTurno, OrdenDelTurno } from './modelo/ordenDelTurno'
export type { PersonajeEnJuego } from './modelo/personajeEnJuego'
export type { PersonajeNoJugador } from './modelo/personajeNoJugador'
export type { Puerta } from './modelo/puerta'
export type { CosteDelTerreno, Terreno, TipoCobertura, TipoTerreno } from './modelo/terreno'
export type { ResultadoAccion } from './modelo/resultadoAccion'
export type { ResultadoAlEntrar } from './modelo/resultadoAlEntrar'
export type { TipoConFlags } from './modelo/tipoConFlags'
export type { ResultadoActivacion } from './modelo/resultadoActivacion'
export type { Ubicacion } from './modelo/ubicacion'
export { aAgrupar, recorridoParaAgrupar, type RecorridoParaAgrupar } from './agrupar'
export { AGRUPAR, ATACAR, accionesDelGestor, accionesDelModo, apuntarAccion, BUSCAR_TRAMPAS, CAMBIAR_MODO, ejecutarAccion, modoActual, motivoParaNoActuar, TERMINAR_TURNO } from './acciones'
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
  escuadraSinAcciones,
  sinAcciones,
  jugadorEnTurno,
  jugadoresDe,
  terminadasEnElTurno,
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
export { conVidaReducida, distanciaSegun, enemigoEn, lineaDeCasillas, medirAtaque, sinPersonaje, trayectoria } from './ataques'
export { anadirPersonajesNoJugadores, huecoDePersonaje, sitioParaPersonaje } from './apariciones'
export { esEnemigo, jugadorDe, motivoParaNoCambiarJugadores, postura } from './jugadores'
export { apoyosDe, estaTrabado, trabadoPor } from './zonaDeControl'
export { aristaEntre, alOtroLado, coberturaDeArista, cruce, motivoParaNoAnadirMuro, muroEnArista, puertaEnArista, tramosDe } from './muros'
export { guiaDeCoherencia } from './coherencia'
export { construirEstancia } from './construccion'
export { conFlags, flagsDe } from './flags'
export { casillasDeReferencia, conPersonajeEn, distanciaA, motivoParaNoRecorrer, planearDesplazamiento } from './desplazamientos'
export { buscarSitio, colocarElemento, motivoParaNoColocar, situar } from './elementos'
export { anidar, crearEstancia, estanciaEn, estanciasDe, motivoParaNoAnidar } from './estancias'
export {
  accionesAdicionales,
  accionesConsumidas,
  alcance,
  alcanzables,
  casillaDelMapa,
  casillasDeControl,
  casillasDeEnemigos,
  conPersonajes,
  conZonaDeControl,
  costeDe,
  costesDe,
  enContacto,
  enElMapa,
  enZonaDeControl,
  evaluarRecorrido,
  gastadoPor,
  desplazar,
  mover,
  planearMovimiento,
  ruta,
  sePuedePasar,
  seComunican,
  transitable,
  type FormaDeMoverse,
  type MedicionMovimiento,
  type ReglasDeMovimiento,
  type RecorridoEvaluado,
} from './movimiento'
export { casillaDelMuro, largoMuro, orientar } from './orientacion'
export { aparte, marcarAbierta, pegar, puertaEn } from './puertas'
export { COSTE_TERRENO, coberturaEn, factorDeTerreno, motivoParaNoAnadirTerreno, terrenoEn } from './terrenos'
export { GestorMapa } from './gestor/GestorMapa'
export type { ProveedorConfiguracion } from './gestor/ProveedorConfiguracion'
export type { ProveedorConfirmacion } from './gestor/ProveedorConfirmacion'
export type { ProveedorEstancias } from './gestor/ProveedorEstancias'
export type { ProveedorPersonajes } from './gestor/ProveedorPersonajes'
export type { ProveedorTurnos } from './gestor/ProveedorTurnos'
export type { ProveedorMapa } from './gestor/ProveedorMapa'
