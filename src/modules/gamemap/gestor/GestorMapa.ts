import { accionesDelGestor, ejecutarAccion, motivoParaNoActuar } from '../acciones'
import {
  activacionDe,
  activar,
  conPersonaje,
  escuadrasDe,
  jugadorEnTurno,
  todosLosPersonajes,
  motivoParaNoActivar,
  motivoParaNoTerminarTurno,
  numeroDeTurno,
  terminarActivacion,
  terminarTurno,
  turnoDeEscuadra,
} from '../activaciones'
import { anadirPersonajesNoJugadores, huecoDePersonaje } from '../apariciones'
import { construirEstancia } from '../construccion'
import { buscarSitio, colocarElemento, motivoParaNoColocar } from '../elementos'
import { estanciasDe } from '../estancias'
import { motivoParaNoCambiarJugadores } from '../jugadores'
import { accionesAdicionales, casillasDeEnemigos, conPersonajes, evaluarRecorrido, gastadoPor, mover } from '../movimiento'
import { aparte, marcarAbierta, pegar, puertaEn } from '../puertas'
import type { Accion } from '../modelo/accion'
import type { ModoActivacion } from '../modelo/activacion'
import type { Casilla } from '../modelo/casilla'
import type { ClaseDeEscuadra } from '../modelo/claseDeEscuadra'
import type { ClaseDePersonaje } from '../modelo/claseDePersonaje'
import { esComando } from '../modelo/comando'
import { OPUESTA } from '../modelo/direccion'
import type { DescripcionPersonajeNoJugador } from '../modelo/descripcionPersonaje'
import type { Objeto } from '../modelo/elemento'
import type { Escuadra } from '../modelo/escuadra'
import type { Estancia } from '../modelo/estancia'
import type { Jugador } from '../modelo/jugador'
import type { Jugadores } from '../modelo/jugadores'
import type { Personaje } from '../modelo/personaje'
import type { Mapa } from '../modelo/mapa'
import type { MapaEnJuego } from '../modelo/mapaEnJuego'
import type { OpcionesMovimiento } from '../modelo/opcionesMovimiento'
import type { PersonajeNoJugador } from '../modelo/personajeNoJugador'
import type { Puerta } from '../modelo/puerta'
import type { Ubicacion } from '../modelo/ubicacion'
import type { ProveedorMapa } from './ProveedorMapa'

/**
 * Gestiona el estado del mapa (estancias, escuadras y personajes con sus turnos):
 * pide al proveedor del proyecto cada estancia nueva y las clases de sus
 * escuadras y personajes, que dicen qué pueden hacer, y avisa de cada cambio a
 * quien se suscriba (para dibujarlo o guardarlo). El mapa es inmutable: cada
 * cambio crea uno nuevo
 */
export class GestorMapa implements MapaEnJuego {
  #proveedor: ProveedorMapa
  #mapa: Mapa
  #avisos = new Set<(mapa: Mapa) => void>()
  /** Clases de las escuadras del proveedor: se piden una sola vez */
  #clases?: Promise<ClaseDeEscuadra[]>
  /** De dónde salen los sitios al azar de los personajes que aparecen (entre 0 y 1) */
  #azar: () => number

  constructor(proveedor: ProveedorMapa, mapa: Mapa = { estancias: [] }, azar: () => number = Math.random) {
    this.#proveedor = proveedor
    this.#mapa = mapa
    this.#azar = azar
  }

  get mapa() {
    return this.#mapa
  }

  /** Reglas de activación del proyecto */
  get configuracion() {
    return this.#proveedor.configuracion
  }

  /** Avisa de cada cambio del mapa; devuelve cómo dejar de recibir avisos */
  suscribir = (aviso: (mapa: Mapa) => void) => {
    this.#avisos.add(aviso)
    return () => void this.#avisos.delete(aviso)
  }

  /**
   * Pide al proveedor la descripción de una estancia nueva y la añade al
   * mapa, a la derecha de todo lo que hay (las que se abren desde una puerta
   * se pegan a ella: `abrirPuerta`). En la inicial guarda además el reparto
   * de jugadores de la configuración y crea las escuadras con sus personajes
   * colocados y, si hay modo agresivo o sigiloso, con el modo en que empieza
   * cada una. Falla si el reparto no vale para las escuadras
   */
  nuevaEstancia(): Promise<Estancia> {
    return this.#nuevaEstancia()
  }

  /**
   * Estancia nueva: si sale de una puerta (`desde`), con su entrada en el muro
   * que encaja con esa puerta (se lo dice al proveedor) y pegada a ella; si
   * no, aparte
   */
  async #nuevaEstancia(desde?: Ubicacion): Promise<Estancia> {
    const inicial = !this.#mapa.estancias.length
    const puerta = desde && this.puertaEn(desde)
    const entrada = puerta && OPUESTA[puerta.lado]
    const descripcion = await this.#proveedor.describirEstancia(inicial ? undefined : this.#mapa, entrada)
    const construida = construirEstancia(this.#idLibre(), descripcion, entrada)
    const estancia = desde ? pegar(this.#mapa, desde, construida) : { ...construida, posicion: aparte(this.#mapa) }
    const escuadras = inicial ? await this.#escuadrasIniciales(estancia) : undefined
    const { jugadores } = this.configuracion
    const conEstancia = { ...this.#mapa, estancias: [...this.#mapa.estancias, estancia], ...(escuadras && { escuadras, turno: 1, jugadores }) }
    const reparto = escuadras && motivoParaNoCambiarJugadores(conEstancia, jugadores)
    if (reparto) throw new Error(reparto)
    this.#cambiar(anadirPersonajesNoJugadores(conEstancia, estancia.id, descripcion.personajesNoJugadores ?? [], this.#azar).mapa)
    this.#proveedor.estanciaCreada(estancia, this)
    return estancia
  }

  /**
   * Estado de partida de cada escuadra del proveedor: sus personajes, cada uno en
   * el sitio libre de la estancia más cercano al centro (o en su zona de
   * espera, si no cabe) y, con modo agresivo o sigiloso, el modo en que empieza
   */
  async #escuadrasIniciales(estancia: Estancia): Promise<Escuadra[]> {
    const ocupados: Objeto[] = []
    const escuadras: Escuadra[] = []
    for (const clase of await this.#listarEscuadras()) {
      const personajes: Personaje[] = []
      for (const { id, nombre, imagenVtt } of await clase.personajes()) {
        const casilla = buscarSitio({ ...estancia, elementos: [...estancia.elementos, ...ocupados] }, huecoDePersonaje({ id, nombre }))
        if (casilla) ocupados.push(huecoDePersonaje({ id, nombre }, casilla))
        personajes.push({ id, nombre, ...(imagenVtt && { imagenVtt }), estancia: estancia.id, ...(casilla && { casilla }), turnos: [] })
      }
      const modo = this.configuracion.modosActivacion === 'agresivo-sigiloso' ? await clase.modoActivacion() : undefined
      escuadras.push({ id: clase.id, nombre: clase.nombre, jugador: clase.jugador, personajes, ...(modo && { modo }), turnos: [] })
    }
    return escuadras
  }

  /**
   * Coloca o mueve a mano un objeto de una estancia del mapa; sin `posicion`,
   * lo devuelve a la zona de espera. Si no puede ir ahí, el mapa no cambia y
   * devuelve el motivo
   */
  colocarElemento(estanciaId: string, elementoId: string, posicion?: Casilla): string | undefined {
    const estancia = this.#mapa.estancias.find((e) => e.id === estanciaId)
    const elemento = estancia?.elementos.find((el) => el.id === elementoId)
    if (!estancia || !elemento) return `No hay ningún elemento «${elementoId}» en «${estanciaId}»`
    const motivo = posicion && motivoParaNoColocar(estancia, elemento, posicion)
    if (motivo) return motivo
    const colocada = colocarElemento(estancia, elementoId, posicion)
    this.#cambiar({ ...this.#mapa, estancias: this.#mapa.estancias.map((e) => (e.id === estanciaId ? colocada : e)) })
  }

  /**
   * Coloca a mano en esa casilla de su estancia un personaje de la zona de espera:
   * en el mapa, un personaje se mueve arrastrándolo (`moverPersonaje`). Si no puede ir
   * ahí, el mapa no cambia y devuelve el motivo
   */
  colocarPersonaje(personajeId: string, casilla: Casilla): string | undefined {
    const personaje = this.#personajeDe(personajeId)?.personaje
    if (!personaje) return `No hay ningún personaje «${personajeId}» en el mapa`
    if (personaje.casilla) return `${personaje.nombre} se mueve arrastrando su ficha`
    const estancia = this.#mapa.estancias.find((e) => e.id === personaje.estancia)
    if (!estancia) return `No hay ninguna estancia «${personaje.estancia}» en el mapa`
    const otros = todosLosPersonajes(this.#mapa).filter((h) => h.estancia === estancia.id && h.casilla)
    const motivo = motivoParaNoColocar({ ...estancia, elementos: [...estancia.elementos, ...otros.map((h) => huecoDePersonaje(h, h.casilla))] }, huecoDePersonaje(personaje), casilla)
    if (motivo) return motivo
    this.#cambiar(conPersonaje(this.#mapa, personajeId, (h) => ({ ...h, casilla })))
  }

  /**
   * Añade personajes no jugadores (enemigos…) a una estancia del mapa, como los
   * de la descripción de una estancia nueva: cada uno en su casilla o en una al
   * azar de su zona o de la estancia, libre y sin terreno impasable; si no hay
   * sitio, en la zona de espera. Falla si la estancia no está o un id se repite
   */
  anadirPersonajes(estanciaId: string, personajes: DescripcionPersonajeNoJugador[]): PersonajeNoJugador[] {
    const { mapa, anadidos } = anadirPersonajesNoJugadores(this.#mapa, estanciaId, personajes, this.#azar)
    this.#cambiar(mapa)
    return anadidos
  }

  /** Jugador al que le toca activar una escuadra (`ordenActivaciones`); nadie si no hay reparto de jugadores o nadie tiene nada que activar */
  get jugadorEnTurno(): Jugador | undefined {
    return jugadorEnTurno(this.#mapa, this.configuracion)
  }

  cambiarJugadores(jugadores: Jugadores): string | undefined {
    const motivo = motivoParaNoCambiarJugadores(this.#mapa, jugadores)
    if (motivo) return motivo
    this.#cambiar({ ...this.#mapa, jugadores })
  }

  /** Por qué el personaje de una escuadra no puede actuar ahora (no es su turno, ya actúa otro de su escuadra…), o nada si puede */
  motivoParaNoActuar(personajeId: string): string | undefined {
    const escuadra = this.#personajeDe(personajeId)?.escuadra
    if (!escuadra) return `${personajeId} no es de ninguna escuadra`
    return motivoParaNoActuar(this.#mapa, this.configuracion, escuadra.id, personajeId)
  }

  /**
   * Empieza la activación de la escuadra (todos sus personajes) en ese modo; si
   * no puede, el mapa no cambia y devuelve el motivo
   */
  activarEscuadra(id: string, modo: ModoActivacion): string | undefined {
    const motivo = motivoParaNoActivar(this.#mapa, this.configuracion, id, modo)
    if (motivo) return motivo
    this.#cambiar(activar(this.#mapa, this.configuracion, id, modo))
  }

  /** Da por completa la activación en curso de la escuadra; si no la tiene, devuelve el motivo */
  terminarActivacion(id: string): string | undefined {
    if (activacionDe(this.#mapa, id)?.terminada !== false) return `«${id}» no tiene ninguna activación en curso`
    this.#cambiar(terminarActivacion(this.#mapa, id))
  }

  /** Pasa al turno siguiente si todas las escuadras han terminado su activación; si no, devuelve el motivo */
  terminarTurno(): string | undefined {
    const motivo = motivoParaNoTerminarTurno(this.#mapa)
    if (motivo) return motivo
    this.#cambiar(terminarTurno(this.#mapa))
  }

  /**
   * Acciones que puede hacer ahora la escuadra: las que dice la clase del
   * personaje pulsado (`personajeId`) con su estado, donde está, y detrás las del
   * gestor (cambiar de modo, terminar turno). Ninguna si ya terminó su turno u
   * otra escuadra se está activando
   */
  async accionesDisponibles(escuadraId: string, personajeId?: string): Promise<Accion[]> {
    if (motivoParaNoActuar(this.#mapa, this.configuracion, escuadraId, personajeId)) return []
    return [...(await this.#accionesDelPersonaje(escuadraId, personajeId)), ...accionesDelGestor(this.#mapa, this.configuracion, escuadraId)]
  }

  /**
   * Ejecuta una de las acciones disponibles de la escuadra (con el personaje
   * `personajeId` pulsado). Si es un comando, antes ejecuta su código (`exec`): si
   * falla o se cancela, no se apunta y el error sigue. Las del personaje se apuntan
   * en su turno y en el de su escuadra. Si no puede, el mapa no cambia y
   * devuelve el motivo
   */
  async ejecutarAccion(escuadraId: string, accionId: string, personajeId?: string): Promise<string | undefined> {
    const motivo = motivoParaNoActuar(this.#mapa, this.configuracion, escuadraId, personajeId)
    if (motivo) return motivo
    const delPersonaje = (await this.#accionesDelPersonaje(escuadraId, personajeId)).find((a) => a.id === accionId)
    const delGestor = accionesDelGestor(this.#mapa, this.configuracion, escuadraId).find((a) => a.id === accionId)
    if (!delPersonaje && !delGestor) return `«${accionId}» no es una acción disponible ahora`
    if (delPersonaje && esComando(delPersonaje)) await delPersonaje.exec()
    this.#cambiar(ejecutarAccion(this.#mapa, this.configuracion, escuadraId, accionId, delPersonaje && personajeId))
    await this.#preguntarSiCompleta(escuadraId)
  }

  puertaEn(ubicacion: Ubicacion): Puerta | undefined {
    return puertaEn(this.#mapa, ubicacion)
  }

  async abrirPuerta(ubicacion: Ubicacion): Promise<Estancia> {
    const puerta = this.puertaEn(ubicacion)
    const { x, y } = ubicacion.casilla
    if (!puerta) throw new Error(`No hay ninguna puerta en la casilla ${x},${y} de «${ubicacion.estancia}»`)
    if (puerta.abierta) throw new Error(`La puerta «${puerta.id}» de «${ubicacion.estancia}» ya está abierta`)
    const nueva = await this.#nuevaEstancia(ubicacion)
    this.#cambiar(marcarAbierta(this.#mapa, ubicacion, nueva.id))
    return nueva
  }

  /**
   * Cómo puede moverse ahora el personaje, según le diga su clase con su estado y
   * lo que ya ha movido este turno. Nada si no está colocado o su escuadra no
   * puede actuar
   */
  async opcionesMovimiento(personajeId: string): Promise<OpcionesMovimiento | undefined> {
    const encontrado = this.#personajeDe(personajeId)
    if (!encontrado?.personaje.casilla || motivoParaNoActuar(this.#mapa, this.configuracion, encontrado.escuadra.id, personajeId)) return
    const clase = await this.#claseDePersonaje(encontrado.escuadra.id, personajeId)
    return clase?.opcionesMovimiento(encontrado.personaje, gastadoPor(this.#mapa, encontrado.personaje))
  }

  /**
   * Mueve el personaje por el recorrido (en casillas del mapa, de la suya a la
   * de destino; puede cruzar puertas abiertas a otras estancias) con la
   * primera de sus opciones de movimiento que lo permita; apunta el movimiento
   * en su turno y las acciones que consume en el de su escuadra. Si consume
   * acciones adicionales (deslizar…), antes pide confirmación al proveedor; sin
   * ella no se mueve. Si no puede moverse, el mapa no cambia y devuelve el motivo
   */
  async moverPersonaje(personajeId: string, recorrido: Casilla[]): Promise<string | undefined> {
    const opciones = await this.opcionesMovimiento(personajeId)
    const evaluar = () => {
      const encontrado = this.#personajeDe(personajeId)
      if (!encontrado?.personaje.casilla) return { motivo: `No hay ningún personaje «${personajeId}» colocado en el mapa` }
      const { personaje, escuadra } = encontrado
      if (!opciones) return { motivo: motivoParaNoActuar(this.#mapa, this.configuracion, escuadra.id, personaje.id) ?? `${personaje.nombre} no puede moverse ahora` }
      return { personaje, escuadra: escuadra.id, ...evaluarRecorrido(conPersonajes(this.#mapa, personaje.id, this.configuracion.terrenoPersonajes), personaje, recorrido, opciones, {
        medicion: this.configuracion.medicionMovimiento,
        enemigos: casillasDeEnemigos(this.#mapa, personaje.id),
      }) }
    }
    const evaluado = evaluar()
    if ('motivo' in evaluado) return evaluado.motivo
    const adicionales = accionesAdicionales(evaluado)
    if (adicionales.length && !(await this.#proveedor.confirmar(`Confirme que queremos ${adicionales.map((a) => a.nombre.toLowerCase()).join(' y ')}`))) return
    // mientras se confirmaba el mapa ha podido cambiar
    const confirmado = adicionales.length ? evaluar() : evaluado
    if ('motivo' in confirmado) return confirmado.motivo
    this.#cambiar(mover(this.#mapa, this.configuracion, confirmado.escuadra, confirmado.personaje, recorrido, confirmado))
    await this.#preguntarSiCompleta(confirmado.escuadra)
  }

  /**
   * Pasa a la clase de la escuadra, si sigue activándose, las acciones que
   * lleva en el turno; si responde que su activación está completa, termina su
   * turno
   */
  async #preguntarSiCompleta(escuadraId: string) {
    const enCurso = () => activacionDe(this.#mapa, escuadraId)?.terminada === false
    const clase = (await this.#listarEscuadras()).find((e) => e.id === escuadraId)
    const escuadra = escuadrasDe(this.#mapa).find((e) => e.id === escuadraId)
    if (!clase || !escuadra || !enCurso()) return
    const { completo } = await clase.activar(turnoDeEscuadra(escuadra, numeroDeTurno(this.#mapa)).acciones)
    if (completo && enCurso()) this.#cambiar(terminarActivacion(this.#mapa, escuadraId))
  }

  /** Lo que dice la clase del personaje pulsado de la escuadra (si está colocado) que puede hacer donde está */
  async #accionesDelPersonaje(escuadraId: string, personajeId?: string): Promise<Accion[]> {
    const encontrado = personajeId ? this.#personajeDe(personajeId) : undefined
    if (!encontrado?.personaje.casilla || encontrado.escuadra.id !== escuadraId) return []
    const clase = await this.#claseDePersonaje(escuadraId, encontrado.personaje.id)
    return clase ? clase.acciones(encontrado.personaje, this) : []
  }

  /** Estado del personaje y de su escuadra */
  #personajeDe(personajeId: string): { escuadra: Escuadra; personaje: Personaje } | undefined {
    for (const escuadra of escuadrasDe(this.#mapa)) {
      const personaje = escuadra.personajes.find((h) => h.id === personajeId)
      if (personaje) return { escuadra, personaje }
    }
  }

  /** La clase del proveedor del personaje con ese id, de su escuadra */
  async #claseDePersonaje(escuadraId: string, personajeId: string): Promise<ClaseDePersonaje | undefined> {
    const escuadra = (await this.#listarEscuadras()).find((e) => e.id === escuadraId)
    return (await escuadra?.personajes())?.find((h) => h.id === personajeId)
  }

  #listarEscuadras() {
    this.#clases ??= this.#proveedor.listarEscuadras().catch((error) => {
      this.#clases = undefined
      throw error
    })
    return this.#clases
  }

  #idLibre() {
    const ids = new Set(this.#mapa.estancias.flatMap((e) => estanciasDe(e).map(({ estancia }) => estancia.id)))
    let n = ids.size + 1
    while (ids.has(`estancia-${n}`)) n++
    return `estancia-${n}`
  }

  /** Guarda el mapa y avisa del cambio; si ha terminado una activación o el turno, avisa al proveedor de a quién le toca */
  #cambiar(mapa: Mapa) {
    const antes = this.#mapa
    this.#mapa = mapa
    this.#avisos.forEach((aviso) => aviso(mapa))
    const relevo = (mapa.rotacion?.length ?? 0) > (antes.rotacion?.length ?? 0) || numeroDeTurno(mapa) > numeroDeTurno(antes)
    const turno = relevo && this.jugadorEnTurno
    if (turno) this.#proveedor.turnoDe(turno, this)
  }
}
