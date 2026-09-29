import { accionesDelGestor, ejecutarAccion, estadoDeEscuadra, motivoParaNoActuar } from '../acciones'
import { activar, motivoParaNoActivar, motivoParaNoTerminarTurno, terminarActivacion, terminarTurno, turnoDe } from '../activaciones'
import { construirEstancia } from '../construccion'
import { colocarElemento, motivoParaNoColocar, situar } from '../elementos'
import { estanciasDe } from '../estancias'
import type { Accion } from '../modelo/accion'
import type { ModoActivacion } from '../modelo/activacion'
import type { Casilla } from '../modelo/casilla'
import type { FichaHeroe } from '../modelo/elemento'
import type { Escuadra } from '../modelo/escuadra'
import type { Estancia } from '../modelo/estancia'
import type { Mapa } from '../modelo/mapa'
import type { ProveedorMapa } from './ProveedorMapa'

/**
 * Gestiona el estado del mapa: pide al proveedor del proyecto cada estancia
 * nueva y las escuadras de héroes, construye la estancia y avisa de cada cambio a quien se
 * suscriba (para dibujarlo o guardarlo). El mapa es inmutable: cada cambio
 * crea uno nuevo
 */
export class GestorMapa {
  #proveedor: ProveedorMapa
  #mapa: Mapa
  #avisos = new Set<(mapa: Mapa) => void>()
  /** Escuadras del proveedor: se piden una sola vez */
  #escuadras?: Promise<Escuadra[]>

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
   * mapa. En la inicial coloca además a los héroes de todas las escuadras,
   * guarda qué escuadras hay y, si hay modo agresivo o sigiloso, con qué modo
   * empieza cada una que aún no lo tenga
   */
  async nuevaEstancia(): Promise<Estancia> {
    const inicial = !this.#mapa.estancias.length
    const descripcion = await this.#proveedor.describirEstancia(inicial ? undefined : this.#mapa)
    const escuadras = inicial ? await this.#listarEscuadras() : []
    const heroes = await this.#fichasDeHeroes(escuadras)
    const turno = await this.#conModosIniciales(escuadras)
    const estancia = situar(construirEstancia(this.#idLibre(), descripcion), heroes)
    this.#cambiar({
      ...this.#mapa,
      estancias: [...this.#mapa.estancias, estancia],
      ...(inicial && { escuadras: escuadras.map(({ id, nombre }) => ({ id, nombre })), turno }),
    })
    return estancia
  }

  /**
   * Coloca o mueve a mano un elemento de una estancia del mapa; sin
   * `posicion`, lo devuelve a la zona de espera. Si no puede ir ahí, el mapa
   * no cambia y devuelve el motivo
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
    if (this.#mapa.turno?.activaciones[id]?.terminada !== false) return `«${id}» no tiene ninguna activación en curso`
    this.#cambiar(terminarActivacion(this.#mapa, id))
  }

  /** Pasa al turno siguiente si todas las escuadras han terminado su activación; si no, devuelve el motivo */
  terminarTurno(): string | undefined {
    const motivo = motivoParaNoTerminarTurno(this.#mapa)
    if (motivo) return motivo
    this.#cambiar(terminarTurno(this.#mapa))
  }

  /**
   * Acciones que puede hacer ahora la escuadra: las que dice ella, según su
   * estado, y las del gestor (cambiar de modo, terminar turno). Ninguna si
   * ya terminó su turno u otra escuadra se está activando
   */
  async accionesDisponibles(escuadraId: string): Promise<Accion[]> {
    if (motivoParaNoActuar(this.#mapa, escuadraId)) return []
    const escuadra = (await this.#listarEscuadras()).find((e) => e.id === escuadraId)
    const propias = escuadra ? await escuadra.acciones(estadoDeEscuadra(this.#mapa, this.configuracion, escuadraId)) : []
    return [...propias, ...accionesDelGestor(this.#mapa, this.configuracion, escuadraId)]
  }

  /** Ejecuta una de las acciones disponibles de la escuadra; si no puede, el mapa no cambia y devuelve el motivo */
  async ejecutarAccion(escuadraId: string, accionId: string): Promise<string | undefined> {
    const motivo = motivoParaNoActuar(this.#mapa, escuadraId)
    if (motivo) return motivo
    if (!(await this.accionesDisponibles(escuadraId)).some((a) => a.id === accionId)) return `«${accionId}» no es una acción disponible ahora`
    this.#cambiar(ejecutarAccion(this.#mapa, this.configuracion, escuadraId, accionId))
  }

  #listarEscuadras() {
    this.#escuadras ??= this.#proveedor.listarEscuadras().catch((error) => {
      this.#escuadras = undefined
      throw error
    })
    return this.#escuadras
  }

  /**
   * Turno con el modo de partida de cada escuadra que aún no tiene modo, el
   * que dice ella. Sin modo agresivo o sigiloso en la configuración, el turno
   * no cambia
   */
  async #conModosIniciales(escuadras: Escuadra[]) {
    const turno = turnoDe(this.#mapa)
    if (this.configuracion.modosActivacion !== 'agresivo-sigiloso') return turno
    const sinModo = escuadras.filter((e) => !turno.ultimosModos?.[e.id])
    const modos = await Promise.all(sinModo.map(async (e) => [e.id, await e.modoActivacion()]))
    return { ...turno, ultimosModos: { ...turno.ultimosModos, ...Object.fromEntries(modos) } }
  }

  /** Una ficha por cada héroe de cada escuadra */
  async #fichasDeHeroes(escuadras: Escuadra[]): Promise<FichaHeroe[]> {
    const porEscuadra = await Promise.all(
      escuadras.map(async (escuadra) =>
        (await escuadra.heroes()).map(({ id, nombre, imagenVtt }): FichaHeroe => ({
          id,
          nombre,
          imagenVtt,
          escuadra: escuadra.id,
          tipo: 'heroe',
          columnas: 1,
          filas: 1,
        })),
      ),
    )
    return porEscuadra.flat()
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
