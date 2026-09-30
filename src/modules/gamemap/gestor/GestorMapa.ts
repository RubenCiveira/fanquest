import { accionesDelGestor, ejecutarAccion, motivoParaNoActuar } from '../acciones'
import {
  activacionDe,
  activar,
  conHeroe,
  escuadrasDe,
  heroesDelMapa,
  motivoParaNoActivar,
  motivoParaNoTerminarTurno,
  numeroDeTurno,
  terminarActivacion,
  terminarTurno,
  turnoDeEscuadra,
} from '../activaciones'
import { construirEstancia } from '../construccion'
import { buscarSitio, colocarElemento, motivoParaNoColocar } from '../elementos'
import { estanciasDe } from '../estancias'
import { accionesAdicionales, evaluarRecorrido, gastadoPor, mover } from '../movimiento'
import { aparte, marcarAbierta, pegar, puertaEn } from '../puertas'
import type { Accion } from '../modelo/accion'
import type { ModoActivacion } from '../modelo/activacion'
import type { Casilla } from '../modelo/casilla'
import type { ClaseDeEscuadra } from '../modelo/claseDeEscuadra'
import type { ClaseDeHeroe } from '../modelo/claseDeHeroe'
import { esComando } from '../modelo/comando'
import { OPUESTA } from '../modelo/direccion'
import type { Objeto } from '../modelo/elemento'
import type { Escuadra } from '../modelo/escuadra'
import type { Estancia } from '../modelo/estancia'
import type { Heroe } from '../modelo/heroe'
import type { Mapa } from '../modelo/mapa'
import type { MapaEnJuego } from '../modelo/mapaEnJuego'
import type { OpcionesMovimiento } from '../modelo/opcionesMovimiento'
import type { Puerta } from '../modelo/puerta'
import type { Ubicacion } from '../modelo/ubicacion'
import type { ProveedorMapa } from './ProveedorMapa'

/** Casillas de los enemigos: aún no hay, así que no se puede cargar ni hay de quién alejarse */
const SIN_ENEMIGOS: Casilla[] = []

/** Hueco de una casilla que ocupa un héroe, para buscar sitio a otro sin que se pisen */
const hueco = (heroe: { id: string; nombre: string }, posicion?: Casilla): Objeto => ({
  id: `heroe-${heroe.id}`,
  tipo: 'objeto',
  nombre: heroe.nombre,
  columnas: 1,
  filas: 1,
  posicion,
})

/**
 * Gestiona el estado del mapa (estancias, escuadras y héroes con sus turnos):
 * pide al proveedor del proyecto cada estancia nueva y las clases de sus
 * escuadras y héroes, que dicen qué pueden hacer, y avisa de cada cambio a
 * quien se suscriba (para dibujarlo o guardarlo). El mapa es inmutable: cada
 * cambio crea uno nuevo
 */
export class GestorMapa implements MapaEnJuego {
  #proveedor: ProveedorMapa
  #mapa: Mapa
  #avisos = new Set<(mapa: Mapa) => void>()
  /** Clases de las escuadras del proveedor: se piden una sola vez */
  #clases?: Promise<ClaseDeEscuadra[]>

  constructor(proveedor: ProveedorMapa, mapa: Mapa = { estancias: [] }) {
    this.#proveedor = proveedor
    this.#mapa = mapa
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
   * se pegan a ella: `abrirPuerta`). En la inicial crea además las escuadras
   * con sus héroes colocados y, si hay modo agresivo o sigiloso, con el modo en
   * que empieza cada una
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
    this.#cambiar({
      ...this.#mapa,
      estancias: [...this.#mapa.estancias, estancia],
      ...(escuadras && { escuadras, turno: 1 }),
    })
    this.#proveedor.estanciaCreada(estancia, this)
    return estancia
  }

  /**
   * Estado de partida de cada escuadra del proveedor: sus héroes, cada uno en
   * el sitio libre de la estancia más cercano al centro (o en su zona de
   * espera, si no cabe) y, con modo agresivo o sigiloso, el modo en que empieza
   */
  async #escuadrasIniciales(estancia: Estancia): Promise<Escuadra[]> {
    const ocupados: Objeto[] = []
    const escuadras: Escuadra[] = []
    for (const clase of await this.#listarEscuadras()) {
      const heroes: Heroe[] = []
      for (const { id, nombre, imagenVtt } of await clase.heroes()) {
        const casilla = buscarSitio({ ...estancia, elementos: [...estancia.elementos, ...ocupados] }, hueco({ id, nombre }))
        if (casilla) ocupados.push(hueco({ id, nombre }, casilla))
        heroes.push({ id, nombre, ...(imagenVtt && { imagenVtt }), estancia: estancia.id, ...(casilla && { casilla }), turnos: [] })
      }
      const modo = this.configuracion.modosActivacion === 'agresivo-sigiloso' ? await clase.modoActivacion() : undefined
      escuadras.push({ id: clase.id, nombre: clase.nombre, heroes, ...(modo && { modo }), turnos: [] })
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
   * Coloca a mano en esa casilla de su estancia un héroe de la zona de espera:
   * en el mapa, un héroe se mueve arrastrándolo (`moverHeroe`). Si no puede ir
   * ahí, el mapa no cambia y devuelve el motivo
   */
  colocarHeroe(heroeId: string, casilla: Casilla): string | undefined {
    const heroe = this.#heroeDe(heroeId)?.heroe
    if (!heroe) return `No hay ningún héroe «${heroeId}» en el mapa`
    if (heroe.casilla) return `${heroe.nombre} se mueve arrastrando su ficha`
    const estancia = this.#mapa.estancias.find((e) => e.id === heroe.estancia)
    if (!estancia) return `No hay ninguna estancia «${heroe.estancia}» en el mapa`
    const otros = heroesDelMapa(this.#mapa).filter((h) => h.estancia === estancia.id && h.casilla)
    const motivo = motivoParaNoColocar({ ...estancia, elementos: [...estancia.elementos, ...otros.map((h) => hueco(h, h.casilla))] }, hueco(heroe), casilla)
    if (motivo) return motivo
    this.#cambiar(conHeroe(this.#mapa, heroeId, (h) => ({ ...h, casilla })))
  }

  /**
   * Empieza la activación de la escuadra (todos sus héroes) en ese modo; si
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
   * héroe pulsado (`heroeId`) con su estado, donde está, y detrás las del
   * gestor (cambiar de modo, terminar turno). Ninguna si ya terminó su turno u
   * otra escuadra se está activando
   */
  async accionesDisponibles(escuadraId: string, heroeId?: string): Promise<Accion[]> {
    if (motivoParaNoActuar(this.#mapa, escuadraId)) return []
    return [...(await this.#accionesDelHeroe(escuadraId, heroeId)), ...accionesDelGestor(this.#mapa, this.configuracion, escuadraId)]
  }

  /**
   * Ejecuta una de las acciones disponibles de la escuadra (con el héroe
   * `heroeId` pulsado). Si es un comando, antes ejecuta su código (`exec`): si
   * falla o se cancela, no se apunta y el error sigue. Las del héroe se apuntan
   * en su turno y en el de su escuadra. Si no puede, el mapa no cambia y
   * devuelve el motivo
   */
  async ejecutarAccion(escuadraId: string, accionId: string, heroeId?: string): Promise<string | undefined> {
    const motivo = motivoParaNoActuar(this.#mapa, escuadraId)
    if (motivo) return motivo
    const delHeroe = (await this.#accionesDelHeroe(escuadraId, heroeId)).find((a) => a.id === accionId)
    const delGestor = accionesDelGestor(this.#mapa, this.configuracion, escuadraId).find((a) => a.id === accionId)
    if (!delHeroe && !delGestor) return `«${accionId}» no es una acción disponible ahora`
    if (delHeroe && esComando(delHeroe)) await delHeroe.exec()
    this.#cambiar(ejecutarAccion(this.#mapa, this.configuracion, escuadraId, accionId, delHeroe && heroeId))
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
   * Cómo puede moverse ahora el héroe, según le diga su clase con su estado y
   * lo que ya ha movido este turno. Nada si no está colocado o su escuadra no
   * puede actuar
   */
  async opcionesMovimiento(heroeId: string): Promise<OpcionesMovimiento | undefined> {
    const encontrado = this.#heroeDe(heroeId)
    if (!encontrado?.heroe.casilla || motivoParaNoActuar(this.#mapa, encontrado.escuadra.id)) return
    const clase = await this.#claseDeHeroe(encontrado.escuadra.id, heroeId)
    return clase?.opcionesMovimiento(encontrado.heroe, gastadoPor(this.#mapa, encontrado.heroe))
  }

  /**
   * Mueve el héroe por el recorrido (en casillas del mapa, de la suya a la
   * de destino; puede cruzar puertas abiertas a otras estancias) con la
   * primera de sus opciones de movimiento que lo permita; apunta el movimiento
   * en su turno y las acciones que consume en el de su escuadra. Si consume
   * acciones adicionales (deslizar…), antes pide confirmación al proveedor; sin
   * ella no se mueve. Si no puede moverse, el mapa no cambia y devuelve el motivo
   */
  async moverHeroe(heroeId: string, recorrido: Casilla[]): Promise<string | undefined> {
    const opciones = await this.opcionesMovimiento(heroeId)
    const evaluar = () => {
      const encontrado = this.#heroeDe(heroeId)
      if (!encontrado?.heroe.casilla) return { motivo: `No hay ningún héroe «${heroeId}» colocado en el mapa` }
      const { heroe, escuadra } = encontrado
      if (!opciones) return { motivo: motivoParaNoActuar(this.#mapa, escuadra.id) ?? `${heroe.nombre} no puede moverse ahora` }
      return { heroe, escuadra: escuadra.id, ...evaluarRecorrido(this.#mapa, heroe, recorrido, opciones, { medicion: this.configuracion.medicionMovimiento, enemigos: SIN_ENEMIGOS }) }
    }
    const evaluado = evaluar()
    if ('motivo' in evaluado) return evaluado.motivo
    const adicionales = accionesAdicionales(evaluado)
    if (adicionales.length && !(await this.#proveedor.confirmar(`Confirme que queremos ${adicionales.map((a) => a.nombre.toLowerCase()).join(' y ')}`))) return
    // mientras se confirmaba el mapa ha podido cambiar
    const confirmado = adicionales.length ? evaluar() : evaluado
    if ('motivo' in confirmado) return confirmado.motivo
    this.#cambiar(mover(this.#mapa, this.configuracion, confirmado.escuadra, confirmado.heroe, recorrido, confirmado))
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

  /** Lo que dice la clase del héroe pulsado de la escuadra (si está colocado) que puede hacer donde está */
  async #accionesDelHeroe(escuadraId: string, heroeId?: string): Promise<Accion[]> {
    const encontrado = heroeId ? this.#heroeDe(heroeId) : undefined
    if (!encontrado?.heroe.casilla || encontrado.escuadra.id !== escuadraId) return []
    const clase = await this.#claseDeHeroe(escuadraId, encontrado.heroe.id)
    return clase ? clase.acciones(encontrado.heroe, this) : []
  }

  /** Estado del héroe y de su escuadra */
  #heroeDe(heroeId: string): { escuadra: Escuadra; heroe: Heroe } | undefined {
    for (const escuadra of escuadrasDe(this.#mapa)) {
      const heroe = escuadra.heroes.find((h) => h.id === heroeId)
      if (heroe) return { escuadra, heroe }
    }
  }

  /** La clase del proveedor del héroe con ese id, de su escuadra */
  async #claseDeHeroe(escuadraId: string, heroeId: string): Promise<ClaseDeHeroe | undefined> {
    const escuadra = (await this.#listarEscuadras()).find((e) => e.id === escuadraId)
    return (await escuadra?.heroes())?.find((h) => h.id === heroeId)
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

  #cambiar(mapa: Mapa) {
    this.#mapa = mapa
    this.#avisos.forEach((aviso) => aviso(mapa))
  }
}
