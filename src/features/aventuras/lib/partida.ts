import { barajar, caraDC, enResultado, rnd, tirable, tirar } from '../../../lib/dados'
import { objetoEquipable, type Equipo } from '../../../lib/equipo'
import type { CartaMazo, IdMazo, Mazo, Mazos, TiradaCarta } from '../../../lib/mazos'
import { DADOS_MOVIMIENTO, version, type Aliado, type Heroe, type Monstruos, type Sexo } from '../../../lib/personajes'
import { PREPARACION } from '../../generar/config/preparacion'
import type { EfectoEspecial, Mision, Sala } from '../../generar/lib/tipos'
import { TABLAS_ENCUENTROS, type Encuentro } from '../config/encuentros'
import type { Modo } from '../config/mazos'
import type { ReglaEspecial } from './reglasEspeciales'
import {
  bifurca,
  cartasDeAtrezo,
  filaErrantes,
  ENCUENTRO_SIN_MONSTRUOS,
  EVENTOS_MAZMORRA,
  letraSalaDeMision,
  PELIGRO_CON_COFRE,
  PELIGRO_MAXIMO,
  pideErrantes,
  PUERTA_SECRETA,
  REGLAS_A_DISTANCIA,
  REGLAS_DE_MAGIA,
  seccionDe,
  sinPuertas,
  subePeligro,
  TRAMPA_ACTIVADA,
  TRAMPA_ENCONTRADA,
  une,
  type Seccion,
} from '../config/partida'
import {
  claveMonstruo,
  columna,
  mazoMonstruos,
  opciones,
  puntosCuerpoJefe,
  tablaDeMision,
  type SeleccionMonstruos,
} from './monstruos'
import { claveAliado, heroesSeleccionados, type Configuracion } from './preparacion'
import type { Rejilla } from './rejilla'

/** Lo que la partida necesita saber de la aventura */
export type Contexto = {
  mazos: Mazos
  mision: Mision
  modo: Modo
  heroes: number
  monstruos: Monstruos
  /** Miniaturas preparadas: con varias opciones se juega la que tenéis */
  seleccion: SeleccionMonstruos
}

/** Dónde están los héroes: la Sala Inicial, lo que salió en la carta o una sala secreta */
export type TipoZona = 'inicial' | Seccion | 'secreta'

/** Paso pendiente de la secuencia de exploración, en el orden de las reglas */
export type Paso =
  | { tipo: 'atrezo'; robar: number | 'hasta-con-atrezo'; elegir?: boolean }
  | { tipo: 'elegir-atrezo'; cartas: string[] }
  | { tipo: 'encuentro' }
  | { tipo: 'errantes' }
  | { tipo: 'especial' }
  | { tipo: 'trampa' }

/** Lo que ha pasado en la zona, con las tiradas ya hechas */
export type Suceso =
  | { tipo: 'carta'; mazo: IdMazo; id: string }
  | { tipo: 'caminos'; texto: string }
  | { tipo: 'atrezo'; cartas: string[]; elegida?: string }
  | { tipo: 'encuentro'; dado: number; peligro: number }
  | { tipo: 'errantes'; dado: number; distancia: number }
  | { tipo: 'especial'; id?: string }
  | { tipo: 'trampa'; motivo: 'entrar' | 'mover' | 'buscar'; dado: string; valor: number; carta?: string; conMonstruos: boolean }
  | { tipo: 'tirada'; mazo: IdMazo; carta: string; valores: number[] }
  | { tipo: 'movimiento'; valores: number[] }
  /** Monstruos al azar de una categoría: una tirada por monstruo en la lista de candidatos */
  | { tipo: 'azar'; categoria: number; candidatos: string[]; valores: number[] }
  | { tipo: 'combate'; atacante: string; defensor: string; perdidas: { nombre: string; pc: number }[] }
  | { tipo: 'inventario'; clave: string; texto: string }
  | { tipo: 'puertas-secretas'; valores: number[] }
  | { tipo: 'brujo'; valor: number; evento?: number; tabla?: number; muerte?: number }
  | { tipo: 'cofre'; nivel: number; anadido: boolean }

/** Puerta de una sección: la que lleva a lo inexplorado roba de su camino */
export type Salida = {
  /** Camino (Mazo de Mazmorra) del que se roba al cruzarla por primera vez */
  camino?: number
  /** Sección a la que lleva, una vez explorada */
  destino?: number
  secreta?: boolean
}

export type Zona = {
  /** Orden de exploración: la Sala Inicial es la 0 */
  id: number
  /** Sección por la que se entró; volver por la entrada lleva a ella */
  padre?: number
  salidas: Salida[]
  /** Nombre en vez del de su tipo (la entrada que se crea para partidas antiguas) */
  nombre?: string
  tipo: TipoZona
  /** Momentos de la misión que interesan a esta zona (sus reglas especiales) */
  momentos: Sala[]
  pendientes: Paso[]
  sucesos: Suceso[]
  /** Alguien buscó trampas: moverse ya no hace tirar el Dado de Trampa */
  sinTrampas?: boolean
  /** Puerta secreta encontrada y aún sin abrir */
  puertaSecreta?: boolean
  /** Sin puertas hacia delante: solo se vuelve por la entrada o por una puerta secreta */
  sinPuertas?: boolean
  /** Casillas y lo colocado en ellas, con la regla «Usar mapa» */
  rejilla?: Rejilla
}

/** Monstruo sobre la mesa con sus Puntos de Cuerpo */
export type MonstruoEnJuego = {
  id: string
  monstruo: string
  avanzado: boolean
  /** Para distinguir miniaturas iguales: Orco 1, Orco 2… */
  numero: number
  /** Nombre corto al azar de su plantilla o el que le da la misión (el Jefe) */
  nombre?: string
  cuerpo: number
  pc: number
}

export type FinPartida = 'cumplida' | 'huida' | 'derrota'

export type InventarioHeroe = {
  oro: number
  equipo: string[]
  equipado: string[]
  pociones: string[]
  pergaminos: string[]
  artefactos: string[]
}

export type BotinSuelo =
  | { id: string; tipo: 'oro'; cantidad: number; origen?: { mazo: IdMazo; id: string } }
  | { id: string; tipo: 'item'; itemId: string; categoria: keyof Omit<InventarioHeroe, 'oro' | 'equipado'>; origen?: { mazo: IdMazo; id: string } }

export type BotinNuevo = Omit<Extract<BotinSuelo, { tipo: 'oro' }>, 'id'> | Omit<Extract<BotinSuelo, { tipo: 'item' }>, 'id'>

export type EfectoActivo = Pick<ReglaEspecial, 'id' | 'origenId' | 'nombre' | 'descripcion' | 'ataque' | 'defensa' | 'duracion'>

export type ReglaDescargada = Pick<ReglaEspecial, 'id' | 'origenId' | 'nombre' | 'descripcion' | 'recarga'>

export type Partida = {
  peligro: number
  /** Puede bajar con el evento «Repleta de trampas» */
  dadoTrampa: string
  /**
   * Mazo de Mazmorra (losetas) o de Salas (tablero); varios tras una
   * bifurcación. Los índices no cambian: las puertas los guardan
   */
  caminos: string[][]
  mazos: Record<'pasillo' | 'salas-especiales' | 'atrezo' | 'cofres' | 'trampas', string[]> & Partial<Record<'tesoros' | 'sucesos', string[]>>
  /** PC de cada miembro del grupo, por `clave` */
  vidas: Record<string, number>
  hayMonstruos: boolean
  /** Monstruos en juego (las partidas antiguas no los tienen) */
  monstruos?: MonstruoEnJuego[]
  zona: Zona
  /** Secciones exploradas que no son la actual, con lo que pasó en ellas */
  exploradas?: Zona[]
  /** Salas (sin contar pasillos) y Salas Especiales exploradas */
  salas: number
  especiales: number
  /** Niveles de peligro que ya añadieron su cofre */
  cofres: number[]
  /** Contadores de muerte del PNJ (regla especial `contador-muerte`) */
  contadorMuerte: number
  inventario?: Record<string, InventarioHeroe>
  suelo?: Record<number, BotinSuelo[]>
  efectosActivos?: Record<string, EfectoActivo[]>
  reglasDescargadas?: Record<string, ReglaDescargada[]>
  fin?: FinPartida
}

/** Héroe o aliado del grupo con su clave en `vidas` */
export type Miembro = { clave: string; cuerpo: number; nombre?: string } & ({ heroe: Heroe; sexo?: Sexo } | { aliado: Aliado })

export function miembrosDelGrupo(c: Configuracion, heroes: Heroe[], grupos: { id: string; aliados: Aliado[] }[]): Miembro[] {
  return [
    ...heroesSeleccionados(c, heroes).flatMap((seleccionado) =>
      heroes
        .filter((h) => h.id === seleccionado.tipo)
        .map((heroe) => ({ clave: seleccionado.id, cuerpo: heroe.cuerpo, nombre: seleccionado.nombre, heroe, sexo: seleccionado.sexo })),
    ),
    ...grupos.flatMap((g) =>
      g.aliados
        .map((aliado) => ({ clave: claveAliado(g.id, aliado.id), cuerpo: aliado.cuerpo, aliado }))
        .filter((m) => c.aliados?.includes(m.clave)),
    ),
  ]
}

const copias = (mazo: Mazo) => mazo.cartas.flatMap((c) => Array<string>(c.copias).fill(c.id))

const VACIO_INVENTARIO: InventarioHeroe = { oro: 0, equipo: [], equipado: [], pociones: [], pergaminos: [], artefactos: [] }

const normalizar = (texto: string) =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

function idsEquipoInicial(m: Miembro, equipo: Equipo): string[] {
  if (!('heroe' in m)) return []
  return m.heroe.equipo
    .split(/,| y /)
    .map((nombre) => normalizar(nombre))
    .filter((id) => equipo.equipo.some((item) => item.id === id))
}

function inventarioInicial(m: Miembro, equipo: Equipo): InventarioHeroe {
  const ids = idsEquipoInicial(m, equipo)
  return { ...VACIO_INVENTARIO, equipo: ids, equipado: ids }
}

const inventarioDe = (p: Partida, clave: string): InventarioHeroe => p.inventario?.[clave] ?? VACIO_INVENTARIO

const guardarInventario = (p: Partida, clave: string, inventario: InventarioHeroe): Partida => ({
  ...p,
  inventario: { ...p.inventario, [clave]: inventario },
})

export function carta(mazo: Mazo, id: string): CartaMazo {
  const c = mazo.cartas.find((c) => c.id === id)
  if (!c) throw new Error(`El mazo ${mazo.id} no tiene la carta ${id}`)
  return c
}

/** Mazo de la mazmorra según el modo: de él salen salas y, con losetas, pasillos */
export const mazoMazmorra = (modo: Modo): IdMazo => (modo === 'losetas' ? 'mazmorra' : 'salas')

export function estadisticasMiembro(m: Miembro, inventario: InventarioHeroe | undefined, equipo: Equipo, efectos: EfectoActivo[] = []) {
  const base = 'heroe' in m ? m.heroe : m.aliado
  const equipados = inventario?.equipado ?? []
  const objetos = equipados.flatMap((id) => {
    const item = objetoEquipable(equipo, id)
    return item ? [item] : []
  })
  const armas = objetos.flatMap((item) => ('ataque' in item && item.ataque ? [item.ataque] : []))
  const defensaInicial = idsEquipoInicial(m, equipo).reduce((total, id) => total + (objetoEquipable(equipo, id)?.defensa ?? 0), 0)
  const defensaBase = Math.max(0, base.defensa - defensaInicial)
  const ataque = sumarDadosAtaque(armas.length ? Math.max(...armas) : base.ataque, efectos.reduce((total, e) => total + (e.ataque ?? 0), 0))
  const defensa = objetos.reduce((total, item) => total + (('defensa' in item && item.defensa) || 0), defensaBase) + efectos.reduce((total, e) => total + (e.defensa ?? 0), 0)
  return { ataque, defensa }
}

const quitar = (lista: string[], ids: string[]) =>
  ids.reduce((resto, id) => {
    const i = resto.indexOf(id)
    return i < 0 ? resto : [...resto.slice(0, i), ...resto.slice(i + 1)]
  }, lista)

function sumarDadosAtaque(ataque: number | string, bono: number) {
  if (!bono) return ataque
  if (typeof ataque === 'number') return ataque + bono
  return ataque
    .split('/')
    .map((parte) => `${parte}+${bono}`)
    .join('/')
}

/** Empieza la partida con los mazos en el orden barajado en la preparación */
export function nuevaPartida(ctx: Contexto, c: Configuracion, miembros: Miembro[], equipo: Equipo = { equipo: [], pociones: [], pergaminos: [], artefactos: [] }): Partida {
  const orden = c.barajado?.orden ?? {}
  const atrezo = orden.atrezo ?? []
  const cofres = ctx.mazos.atrezo.cartas.filter((carta) => carta.tipo === 'cofre')
  return {
    peligro: ctx.mision.peligro,
    dadoTrampa: ctx.mision.dadoTrampa,
    caminos: [orden[mazoMazmorra(ctx.modo)] ?? []],
    mazos: {
      pasillo: ctx.modo === 'tablero' ? barajar(copias(ctx.mazos.pasillo)) : [],
      'salas-especiales': orden['salas-especiales'] ?? [],
      atrezo,
      // el Mazo de Cofres: los que no están ya en el de atrezo
      cofres: barajar(quitar(cofres.flatMap((carta) => Array<string>(carta.copias).fill(carta.id)), atrezo)),
      trampas: barajar(copias(ctx.mazos.trampas)),
      tesoros: orden.tesoros,
      sucesos: orden.sucesos,
    },
    vidas: Object.fromEntries(miembros.map((m) => [m.clave, m.cuerpo])),
    hayMonstruos: false,
    monstruos: [],
    // con tablero las puertas las pone el tablero y se anotan al cruzarlas
    zona: { id: 0, salidas: ctx.modo === 'losetas' ? [{ camino: 0 }] : [], tipo: 'inicial', momentos: ['inicial'], pendientes: [], sucesos: [] },
    exploradas: [],
    salas: 0,
    especiales: 0,
    cofres: [],
    contadorMuerte: 0,
    inventario: Object.fromEntries(miembros.map((m) => [m.clave, inventarioInicial(m, equipo)])),
  }
}

const anotar = (p: Partida, ...sucesos: Suceso[]): Partida => ({
  ...p,
  zona: { ...p.zona, sucesos: [...p.zona.sucesos, ...sucesos] },
})

/** Sube o baja el Nivel de Peligro; al alcanzar 5 y 9 se añade un cofre al atrezo */
export function cambiarPeligro(p: Partida, delta: number): Partida {
  const peligro = Math.min(PELIGRO_MAXIMO, Math.max(0, p.peligro + delta))
  let nueva: Partida = { ...p, peligro }
  for (const nivel of PELIGRO_CON_COFRE) {
    if (peligro < nivel || p.peligro >= nivel || nueva.cofres.includes(nivel)) continue
    const [cofre, ...cofres] = nueva.mazos.cofres
    nueva = {
      ...nueva,
      cofres: [...nueva.cofres, nivel],
      mazos: cofre ? { ...nueva.mazos, cofres, atrezo: barajar([...nueva.mazos.atrezo, cofre]) } : nueva.mazos,
    }
    nueva = anotar(nueva, { tipo: 'cofre', nivel, anadido: Boolean(cofre) })
  }
  return nueva
}

/** Roba la primera carta; los mazos que se rehacen (pasillo y trampas) se vuelven a barajar */
function robar(p: Partida, ctx: Contexto, mazo: 'pasillo' | 'trampas'): [string, Partida] {
  const lista = p.mazos[mazo].length ? p.mazos[mazo] : barajar(copias(ctx.mazos[mazo]))
  const [id, ...resto] = lista
  return [id, { ...p, mazos: { ...p.mazos, [mazo]: resto } }]
}

function robarPreparado(p: Partida, mazo: 'tesoros' | 'sucesos'): [string | undefined, Partida] {
  const lista = p.mazos[mazo] ?? []
  const [id, ...resto] = lista
  return [id, { ...p, mazos: { ...p.mazos, [mazo]: resto } }]
}

const quitarUna = (lista: string[], id: string) => {
  const i = lista.indexOf(id)
  return i < 0 ? lista : [...lista.slice(0, i), ...lista.slice(i + 1)]
}

function clasificarItem(id: string): keyof Omit<InventarioHeroe, 'oro' | 'equipado'> {
  if (id.startsWith('pergamino-')) return 'pergaminos'
  if (id.startsWith('pocima-') || id.startsWith('agua-') || id === 'antidoto') return 'pociones'
  return 'equipo'
}

export function cambiarOro(p: Partida, clave: string, delta: number): Partida {
  const inventario = inventarioDe(p, clave)
  return guardarInventario(p, clave, { ...inventario, oro: Math.max(0, inventario.oro + delta) })
}

export function anadirItem(p: Partida, clave: string, id: string, tipo = clasificarItem(id)): Partida {
  const inventario = inventarioDe(p, clave)
  const lista = inventario[tipo]
  return guardarInventario(p, clave, { ...inventario, [tipo]: [...lista, id] })
}

const botinDe = (p: Partida, zona = p.zona.id): BotinSuelo[] => p.suelo?.[zona] ?? []

const conBotin = (p: Partida, zona: number, botin: BotinSuelo[]): Partida => ({
  ...p,
  suelo: { ...p.suelo, [zona]: botin },
})

const idBotin = (p: Partida) => `botin-${p.zona.id}-${Object.values(p.suelo ?? {}).flat().length + 1}`

export const botinDeZona = (p: Partida): BotinSuelo[] => botinDe(p)

export function dejarBotinEnSuelo(p: Partida, botin: BotinNuevo): Partida {
  return conBotin(p, p.zona.id, [...botinDe(p), { ...botin, id: idBotin(p) } as BotinSuelo])
}

export function consumirBotinSuelo(p: Partida, id: string): Partida {
  return conBotin(p, p.zona.id, botinDe(p).filter((b) => b.id !== id))
}

export function cogerBotinSuelo(p: Partida, clave: string, id: string): Partida {
  const botin = botinDe(p).find((b) => b.id === id)
  if (!botin) return p
  const sinBotin = consumirBotinSuelo(p, id)
  return botin.tipo === 'oro' ? cambiarOro(sinBotin, clave, botin.cantidad) : anadirItem(sinBotin, clave, botin.itemId, botin.categoria)
}

export function usarPocion(p: Partida, clave: string, id: string): Partida {
  const inventario = inventarioDe(p, clave)
  return guardarInventario(p, clave, { ...inventario, pociones: quitarUna(inventario.pociones, id) })
}

export function gastarPergamino(p: Partida, clave: string, id: string): Partida {
  const inventario = inventarioDe(p, clave)
  return guardarInventario(p, clave, { ...inventario, pergaminos: quitarUna(inventario.pergaminos, id) })
}

export function perderEquipo(p: Partida, clave: string, id: string): Partida {
  const inventario = inventarioDe(p, clave)
  return guardarInventario(p, clave, {
    ...inventario,
    equipo: quitarUna(inventario.equipo, id),
    artefactos: quitarUna(inventario.artefactos, id),
    equipado: quitarUna(inventario.equipado, id),
  })
}

export function alternarEquipado(p: Partida, clave: string, id: string): Partida {
  const inventario = inventarioDe(p, clave)
  const equipado = inventario.equipado.includes(id) ? quitarUna(inventario.equipado, id) : [...inventario.equipado, id]
  return guardarInventario(p, clave, { ...inventario, equipado })
}

const efectosDe = (p: Partida, clave: string): EfectoActivo[] => p.efectosActivos?.[clave] ?? []

const descargasDe = (p: Partida, clave: string): ReglaDescargada[] => p.reglasDescargadas?.[clave] ?? []

export function activarEfecto(p: Partida, clave: string, regla: EfectoActivo): Partida {
  const efectos = efectosDe(p, clave)
  if (efectos.some((e) => e.id === regla.id)) return p
  return { ...p, efectosActivos: { ...p.efectosActivos, [clave]: [...efectos, regla] } }
}

export function disiparEfecto(p: Partida, clave: string, id: string): Partida {
  return { ...p, efectosActivos: { ...p.efectosActivos, [clave]: efectosDe(p, clave).filter((e) => e.id !== id) } }
}

export function descargarRegla(p: Partida, clave: string, regla: ReglaDescargada): Partida {
  const reglas = descargasDe(p, clave)
  if (reglas.some((r) => r.id === regla.id)) return p
  return { ...p, reglasDescargadas: { ...p.reglasDescargadas, [clave]: [...reglas, regla] } }
}

export function recargarRegla(p: Partida, clave: string, id: string): Partida {
  return { ...p, reglasDescargadas: { ...p.reglasDescargadas, [clave]: descargasDe(p, clave).filter((r) => r.id !== id) } }
}

function recargarPorCombate(p: Partida, clave: string, caras: { blancas: number; negras: number }): Partida {
  const reglas = descargasDe(p, clave)
  const restantes = reglas.filter((r) => {
    if (r.recarga === 'dos-escudos-blancos-combate') return caras.blancas < 2
    if (r.recarga === 'dos-escudos-negros-combate') return caras.negras < 2
    return true
  })
  return restantes.length === reglas.length ? p : { ...p, reglasDescargadas: { ...p.reglasDescargadas, [clave]: restantes } }
}

export function robarTesoro(p: Partida, ctx: Contexto): [string | undefined, Partida] {
  let [id, nueva] = robarPreparado(p, 'tesoros')
  if (!id) return [undefined, p]
  const c = carta(ctx.mazos.tesoros, id)
  if (c.reciclar) nueva = { ...nueva, mazos: { ...nueva.mazos, tesoros: barajar([...(nueva.mazos.tesoros ?? []), id]) } }
  nueva = anotar(nueva, { tipo: 'carta', mazo: 'tesoros', id })
  return [id, nueva]
}

export function botinDeTesoro(ctx: Contexto, id: string): BotinNuevo | undefined {
  const c = carta(ctx.mazos.tesoros, id)
  if (c.oro) return { tipo: 'oro', cantidad: c.oro, origen: { mazo: 'tesoros', id } }
  if (c.equipoId) return { tipo: 'item', itemId: c.equipoId, categoria: clasificarItem(c.equipoId), origen: { mazo: 'tesoros', id } }
  return undefined
}

export function cargarTesoroEnInventario(p: Partida, ctx: Contexto, clave: string, id: string): Partida {
  const botin = botinDeTesoro(ctx, id)
  if (!botin) return p
  return botin.tipo === 'oro' ? cambiarOro(p, clave, botin.cantidad) : anadirItem(p, clave, botin.itemId, botin.categoria)
}

export function dejarTesoroEnSuelo(p: Partida, ctx: Contexto, id: string): Partida {
  const botin = botinDeTesoro(ctx, id)
  return botin ? dejarBotinEnSuelo(p, botin) : p
}

export function robarSucesoDeTesoro(p: Partida): [string | undefined, Partida] {
  const [suceso, nueva] = robarPreparado(p, 'sucesos')
  return suceso ? [suceso, anotar(nueva, { tipo: 'carta', mazo: 'sucesos', id: suceso })] : [undefined, nueva]
}

/** Secuencia de exploración de lo que indica la carta */
function secuencia(seccion: Seccion, c: CartaMazo, secreta: boolean): Paso[] {
  switch (seccion) {
    case 'pasillo':
      return [...(pideErrantes(c) ? [{ tipo: 'errantes' } as const] : []), { tipo: 'trampa' }]
    case 'sala':
      return [
        secreta ? { tipo: 'atrezo', robar: 3, elegir: true } : { tipo: 'atrezo', robar: cartasDeAtrezo(c) },
        { tipo: 'encuentro' },
        { tipo: 'trampa' },
      ]
    case 'especial':
      return [{ tipo: 'especial' }, { tipo: 'trampa' }]
    // en la Sala Objetivo nunca se tira el Dado de Trampa
    case 'objetivo':
      return [{ tipo: 'atrezo', robar: 'hasta-con-atrezo' }]
    case 'escaleras':
      return [{ tipo: 'trampa' }]
  }
}

const efectosSala = (m: Mision, momentos: Sala[]) =>
  m.efectos.filter((e): e is Extract<EfectoEspecial, { tipo: 'sala' }> => e.tipo === 'sala' && momentos.includes(e.sala))

/** Las reglas especiales de la sala pueden quitar el atrezo o pedir encuentros */
function ajustar(pasos: Paso[], m: Mision, momentos: Sala[]): Paso[] {
  const efectos = efectosSala(m, momentos)
  let ajustados = efectos.some((e) => e.sinAtrezo) ? pasos.filter((p) => p.tipo !== 'atrezo') : pasos
  if (efectos.some((e) => e.tiradaEncuentros) && !ajustados.some((p) => p.tipo === 'encuentro')) {
    const trampa = ajustados.findIndex((p) => p.tipo === 'trampa')
    const i = trampa < 0 ? ajustados.length : trampa
    ajustados = [...ajustados.slice(0, i), { tipo: 'encuentro' }, ...ajustados.slice(i)]
  }
  return ajustados
}

/** Reparte el mazo en dos a partir del fondo: una carta a cada lado */
function repartir(mazo: string[]): [string[], string[]] {
  const izquierda: string[] = []
  const derecha: string[] = []
  mazo.toReversed().forEach((id, i) => (i % 2 ? derecha : izquierda).unshift(id))
  return [izquierda, derecha]
}

/** Nombre de la entrada que se crea para las partidas guardadas antes del mapa */
export const SECCIONES_ANTERIORES = 'Secciones ya exploradas'

/**
 * Partidas guardadas antes del mapa: con losetas, una puerta por camino con
 * cartas. Fuera de la Sala Inicial se crea una entrada que representa lo ya
 * explorado, para poder volver siempre; si la sección no tiene puertas, las
 * de los caminos pendientes quedan en esa entrada.
 */
export function conMapa(p: Partida, modo: Modo): Partida {
  if (p.zona.salidas) return p
  const puertas: Salida[] = modo === 'losetas' ? p.caminos.flatMap((c, camino) => (c.length ? [{ camino }] : [])) : []
  if (p.zona.tipo === 'inicial') return { ...p, exploradas: [], zona: { ...p.zona, id: 0, salidas: puertas } }
  const cerrada = p.zona.sucesos.some((s) => s.tipo === 'carta' && s.id.includes('sin-puertas'))
  const entrada: Zona = {
    id: 0,
    nombre: SECCIONES_ANTERIORES,
    tipo: 'sala',
    salidas: [{ destino: 1 }, ...(cerrada ? puertas : [])],
    momentos: [],
    pendientes: [],
    sucesos: [],
    sinTrampas: true,
  }
  const zona: Zona = { ...p.zona, id: 1, padre: 0, salidas: cerrada ? [] : puertas, sinPuertas: cerrada || undefined }
  return { ...p, exploradas: [entrada], zona }
}

/** Todas las secciones exploradas, la actual incluida, por orden */
export const secciones = (p: Partida): Zona[] => [...(p.exploradas ?? []), p.zona].toSorted((a, b) => a.id - b.id)

/** Deja la sección actual entre las exploradas y pasa a otra */
function cambiarDeZona(p: Partida, zona: Zona): Partida {
  const exploradas = [...(p.exploradas ?? []).filter((z) => z.id !== zona.id && z.id !== p.zona.id), p.zona]
  return { ...p, exploradas, zona }
}

/** Ir a una sección ya explorada (por una de sus puertas o volviendo por la entrada) */
export function irA(p: Partida, id: number): Partida {
  const destino = (p.exploradas ?? []).find((z) => z.id === id)
  return destino ? cambiarDeZona(p, destino) : p
}

/** Volver a la sección por la que se entró */
export const volver = (p: Partida) => (p.zona.padre === undefined ? p : irA(p, p.zona.padre))

const siguienteId = (p: Partida) => Math.max(...secciones(p).map((z) => z.id)) + 1

/** La puerta de la sección actual pasa a llevar a la nueva sección */
function llevarA(p: Partida, puerta: number | undefined, destino: number, extra: Salida = {}): Partida {
  const salidas =
    puerta === undefined ? [...p.zona.salidas, { ...extra, destino }] : p.zona.salidas.map((s, i) => (i === puerta ? { ...s, destino } : s))
  return { ...p, zona: { ...p.zona, salidas, puertaSecreta: extra.secreta ? false : p.zona.puertaSecreta } }
}

/** Puertas hacia delante de la sección (sin contar la entrada ni las secretas) */
export const puertas = (z: Zona) => z.salidas.filter((s) => !s.secreta)

/**
 * Una regla especial pone una puerta más. Como en una bifurcación, reparte
 * el mazo de una puerta sin explorar entre las dos; si no queda mazo que
 * repartir, la nueva comparte camino.
 */
export function anadirPuerta(p: Partida): Partida {
  const libre = p.zona.salidas.find((s) => s.destino === undefined && s.camino !== undefined && (p.caminos[s.camino]?.length ?? 0) > 1)
  let nueva = p
  let salida: Salida = { camino: p.zona.salidas.find((s) => s.camino !== undefined)?.camino ?? 0 }
  if (libre?.camino !== undefined) {
    const [izquierda, derecha] = repartir(p.caminos[libre.camino])
    nueva = { ...p, caminos: [...p.caminos.map((c, i) => (i === libre.camino ? izquierda : c)), derecha] }
    salida = { camino: nueva.caminos.length - 1 }
  }
  return { ...nueva, zona: { ...nueva.zona, sinPuertas: undefined, salidas: [...nueva.zona.salidas, salida] } }
}

/** Una regla especial quita una puerta sin explorar; su mazo se une al de otra puerta */
export function quitarPuerta(p: Partida): Partida {
  const i = p.zona.salidas.findLastIndex((s) => s.destino === undefined && !s.secreta)
  if (i < 0) return p
  const quitada = p.zona.salidas[i]
  const salidas = p.zona.salidas.filter((_, j) => j !== i)
  const otra = salidas.find((s) => s.destino === undefined && s.camino !== undefined)
  const caminos =
    quitada.camino !== undefined && otra?.camino !== undefined && otra.camino !== quitada.camino
      ? p.caminos.map((c, j) => (j === otra.camino ? [...c, ...(p.caminos[quitada.camino ?? -1] ?? [])] : j === quitada.camino ? [] : c))
      : p.caminos
  return { ...p, caminos, zona: { ...p.zona, salidas, sinPuertas: puertas({ ...p.zona, salidas }).length ? undefined : true } }
}

/** Con tablero las puertas las marca el tablero: solo se indica si la sección no tiene */
export const cambiarSinPuertas = (p: Partida, sin: boolean): Partida => ({ ...p, zona: { ...p.zona, sinPuertas: sin || undefined } })

type Entrada = { puerta?: number; seccion?: 'sala' | 'pasillo'; secreta?: boolean }

/**
 * Avanza por una puerta. Si ya lleva a una sección explorada, se va a ella.
 * Si no, con losetas se roba del camino de la puerta; con tablero, del
 * Mazo de Salas o del de Pasillo según lo que haya tras ella.
 */
export function entrar(p: Partida, ctx: Contexto, { puerta, seccion = 'sala', secreta = false }: Entrada): Partida {
  const salida = puerta === undefined ? undefined : p.zona.salidas[puerta]
  if (salida?.destino !== undefined) return irA(p, salida.destino)

  let nueva = p
  let mazo: IdMazo
  let id: string | undefined
  const camino = salida?.camino ?? 0
  if (ctx.modo === 'tablero' && seccion === 'pasillo') {
    mazo = 'pasillo'
    ;[id, nueva] = robar(nueva, ctx, 'pasillo')
  } else {
    mazo = mazoMazmorra(ctx.modo)
    const [primera, ...resto] = nueva.caminos[camino] ?? []
    if (!primera) return p
    id = primera
    nueva = { ...nueva, caminos: nueva.caminos.map((c, i) => (i === camino ? resto : c)) }
  }

  const c = carta(ctx.mazos[mazo], id)
  const tipo = seccionDe(c)
  const esSala = tipo !== 'pasillo'
  const momentos: Sala[] = [
    ...(esSala && nueva.salas === 0 ? (['primera-sala'] as const) : []),
    ...(tipo === 'objetivo' ? (['objetivo'] as const) : []),
  ]
  const sucesos: Suceso[] = [{ tipo: 'carta', mazo, id }]
  // con tablero las puertas las pone el tablero: se anotan al cruzarlas
  let salidas: Salida[] = ctx.modo === 'tablero' || tipo === 'objetivo' ? [] : [{ camino }]
  let cerrada = sinPuertas(c) || efectosSala(ctx.mision, momentos).some((e) => e.sinPuertas)

  // el camino se reparte entre las dos puertas o se une a otro antes de hacer nada más
  const actual = nueva.caminos[camino] ?? []
  if (ctx.modo === 'losetas' && bifurca(c) && actual.length > 1) {
    const [izquierda, derecha] = repartir(actual)
    nueva = { ...nueva, caminos: [...nueva.caminos.map((c, i) => (i === camino ? izquierda : c)), derecha] }
    salidas = [{ camino }, { camino: nueva.caminos.length - 1 }]
    sucesos.push({ tipo: 'caminos', texto: `El mazo se reparte entre las dos puertas: ${izquierda.length} y ${derecha.length} cartas.` })
  } else if (ctx.modo === 'losetas' && bifurca(c)) {
    sucesos.push({ tipo: 'caminos', texto: 'Queda una sola carta: resuélvela como si tuviera una sola puerta.' })
  } else if (ctx.modo === 'losetas' && une(c)) {
    const otro = nueva.caminos.findIndex((cartas, i) => i !== camino && cartas.length > 0)
    if (otro < 0) {
      // la carta lo dice: con un solo Mazo de Mazmorra la sala tiene una puerta para no quedar atrapados
      cerrada = false
      sucesos.push({ tipo: 'caminos', texto: 'Solo hay un Mazo de Mazmorra: coloca 1 puerta en la sala.' })
    } else {
      nueva = { ...nueva, caminos: nueva.caminos.map((c, i) => (i === otro ? [...c, ...actual] : i === camino ? [] : c)) }
      salidas = []
      sucesos.push({ tipo: 'caminos', texto: 'La sala no tiene puertas: su mazo se une al del otro camino.' })
    }
  }

  const nuevaId = siguienteId(nueva)
  const zona: Zona = {
    id: nuevaId,
    padre: p.zona.id,
    salidas: cerrada ? [] : salidas,
    sinPuertas: cerrada || undefined,
    tipo,
    momentos,
    pendientes: ajustar(secuencia(tipo, c, secreta), ctx.mision, momentos),
    sucesos,
  }
  const entrada = { ...cambiarDeZona(llevarA(nueva, puerta, nuevaId, secreta ? { secreta } : {}), zona), salas: nueva.salas + (esSala ? 1 : 0) }
  return tipo === 'objetivo' ? aparecen({ ...entrada, hayMonstruos: true }, ctx, monstruosObjetivo(ctx)) : entrada
}

/** Con losetas, tras una puerta secreta hay una sala sin puertas y sin carta de mazmorra */
export function entrarPorPuertaSecreta(p: Partida, ctx: Contexto, seccion: 'sala' | 'pasillo' = 'sala'): Partida {
  if (ctx.modo === 'tablero') return entrar(p, ctx, { seccion, secreta: true })
  const id = siguienteId(p)
  const zona: Zona = {
    id,
    padre: p.zona.id,
    salidas: [],
    sinPuertas: true,
    tipo: 'secreta',
    momentos: [],
    pendientes: [{ tipo: 'atrezo', robar: 3, elegir: true }, { tipo: 'trampa' }],
    sucesos: [],
  }
  return { ...cambiarDeZona(llevarA(p, undefined, id, { secreta: true }), zona), salas: p.salas + 1 }
}

function tirarTrampa(p: Partida, ctx: Contexto, motivo: 'entrar' | 'mover' | 'buscar'): Partida {
  const valor = tirar(p.dadoTrampa)
  const hay = motivo === 'buscar' ? valor <= TRAMPA_ENCONTRADA : valor === TRAMPA_ACTIVADA
  const base = { tipo: 'trampa', motivo, dado: p.dadoTrampa, valor, conMonstruos: p.hayMonstruos } as const
  if (!hay) return anotar(p, base)
  const [id, nueva] = robar(p, ctx, 'trampas')
  const conCarta = anotar(nueva, { ...base, carta: id })
  const activada = carta(ctx.mazos.trampas, id).activada
  const texto = activada && (p.hayMonstruos ? activada.conMonstruos : activada.sinMonstruos)
  return motivo !== 'buscar' && texto && subePeligro(texto) ? cambiarPeligro(conCarta, 1) : conCarta
}

function robarAtrezo(p: Partida, ctx: Contexto, robar: number | 'hasta-con-atrezo'): [string[], Partida] {
  const mazo = p.mazos.atrezo
  const n =
    robar === 'hasta-con-atrezo'
      ? mazo.findIndex((id) => carta(ctx.mazos.atrezo, id).tipo !== 'sin-atrezo') + 1 || mazo.length
      : robar
  return [mazo.slice(0, n), { ...p, mazos: { ...p.mazos, atrezo: mazo.slice(n) } }]
}

/** Resuelve el siguiente paso de la secuencia de exploración */
export function avanzar(p: Partida, ctx: Contexto): Partida {
  const [paso, ...pendientes] = p.zona.pendientes
  if (!paso || paso.tipo === 'elegir-atrezo') return p
  const sigue: Partida = { ...p, zona: { ...p.zona, pendientes } }

  switch (paso.tipo) {
    case 'atrezo': {
      const [cartas, nueva] = robarAtrezo(sigue, ctx, paso.robar)
      const anotada = anotar(nueva, { tipo: 'atrezo', cartas })
      return paso.elegir && cartas.length > 1
        ? { ...anotada, zona: { ...anotada.zona, pendientes: [{ tipo: 'elegir-atrezo', cartas }, ...pendientes] } }
        : anotada
    }
    case 'encuentro': {
      const dado = tirar('1D20')
      const suceso: Suceso = { tipo: 'encuentro', dado, peligro: p.peligro }
      const anotada = anotar(sigue, suceso)
      return dado + p.peligro <= ENCUENTRO_SIN_MONSTRUOS
        ? cambiarPeligro(anotada, 1)
        : aparecen({ ...anotada, hayMonstruos: true }, ctx, llegadas(suceso, ctx))
    }
    case 'errantes': {
      const suceso: Suceso = { tipo: 'errantes', dado: tirar('1D6'), distancia: tirar('1D6') }
      return aparecen({ ...anotar(sigue, suceso), hayMonstruos: true }, ctx, llegadas(suceso, ctx))
    }
    case 'especial': {
      const [id, ...resto] = p.mazos['salas-especiales']
      const c = id ? carta(ctx.mazos['salas-especiales'], id) : undefined
      const momentos: Sala[] = [
        ...p.zona.momentos,
        'especial',
        ...(p.especiales === 0 ? (['primera-especial'] as const) : []),
        ...(c && letraSalaDeMision(c) === 'A' ? (['especial-a'] as const) : []),
      ]
      const cerrada = efectosSala(ctx.mision, momentos).some((e) => e.sinPuertas)
      const nueva: Partida = {
        ...sigue,
        especiales: p.especiales + 1,
        mazos: { ...p.mazos, 'salas-especiales': resto },
        zona: {
          ...sigue.zona,
          momentos,
          pendientes: ajustar(pendientes, ctx.mision, momentos),
          // la regla de la misión puede dejar la sala sin puertas
          ...(cerrada ? { sinPuertas: true, salidas: sigue.zona.salidas.filter((s) => s.destino !== undefined) } : {}),
        },
      }
      return cambiarPeligro(anotar(nueva, { tipo: 'especial', id }), 1)
    }
    case 'trampa':
      return tirarTrampa(sigue, ctx, 'entrar')
  }
}

/** Tras robar tres cartas de atrezo se coloca una; las demás vuelven al mazo */
export function elegirAtrezo(p: Partida, id: string): Partida {
  const [paso, ...pendientes] = p.zona.pendientes
  if (paso?.tipo !== 'elegir-atrezo') return p
  const devueltas = quitar(paso.cartas, [id])
  return {
    ...p,
    mazos: { ...p.mazos, atrezo: barajar([...p.mazos.atrezo, ...devueltas]) },
    zona: {
      ...p.zona,
      pendientes,
      sucesos: p.zona.sucesos.map((s) => (s.tipo === 'atrezo' && s.cartas === paso.cartas ? { ...s, elegida: id } : s)),
    },
  }
}

/** Atrezo colocado en la zona (de tres cartas, la elegida) */
export const atrezoColocado = (z: Zona) =>
  z.sucesos.flatMap((s) => {
    if (s.tipo !== 'atrezo') return []
    if (s.elegida) return [s.elegida]
    return z.pendientes.some((p) => p.tipo === 'elegir-atrezo' && p.cartas === s.cartas) ? [] : s.cartas
  })

/** Moverse por una sección donde nadie buscó trampas obliga a tirar el Dado de Trampa */
export const puedeCaerEnTrampa = (z: Zona) => z.tipo !== 'inicial' && z.tipo !== 'objetivo' && !z.sinTrampas

/**
 * Un héroe se mueve: sin Puntos de Movimiento fijos tira sus dados y, si
 * nadie buscó trampas aquí, el Dado de Trampa
 */
export function moverse(p: Partida, ctx: Contexto, conDados = false): Partida {
  const [dados, caras] = DADOS_MOVIMIENTO.split('D')
  const conMovimiento = conDados
    ? anotar(p, { tipo: 'movimiento', valores: Array.from({ length: Number(dados) }, () => tirar(`1D${caras}`)) })
    : p
  return puedeCaerEnTrampa(p.zona) ? tirarTrampa(conMovimiento, ctx, 'mover') : conMovimiento
}

export function buscarTrampas(p: Partida, ctx: Contexto): Partida {
  const nueva = tirarTrampa(p, ctx, 'buscar')
  return { ...nueva, zona: { ...nueva.zona, sinTrampas: true } }
}

/** Solo en salas; en las secretas (losetas) no se vuelve a buscar */
export const puedeBuscarPuertas = (z: Zona) => z.tipo !== 'inicial' && z.tipo !== 'pasillo' && z.tipo !== 'secreta' && !z.puertaSecreta

/** 1D6 por cada pared sin puertas; con un 6 hay puerta secreta */
export function buscarPuertasSecretas(p: Partida, paredes: number): Partida {
  const valores = Array.from({ length: paredes }, () => tirar('1D6'))
  const nueva = anotar(p, { tipo: 'puertas-secretas', valores })
  return valores.includes(PUERTA_SECRETA) ? { ...nueva, zona: { ...nueva.zona, puertaSecreta: true } } : nueva
}

/** Valores de una tirada y de las anidadas que pida su resultado */
function tirarTabla(t: TiradaCarta): number[] {
  if (!t.dado || !tirable(t.dado)) return []
  const valor = tirar(t.dado)
  const anidada = t.resultados.find((r) => enResultado(r.resultado, valor))?.tirada
  return [valor, ...(anidada ? tirarTabla(anidada) : [])]
}

/** Resultados que tocan en cada nivel de la tirada */
export function resultados(t: TiradaCarta, valores: number[]): TiradaCarta['resultados'] {
  const [valor, ...resto] = valores
  const r = valor === undefined ? undefined : t.resultados.find((r) => enResultado(r.resultado, valor))
  return r ? [r, ...(r.tirada ? resultados(r.tirada, resto) : [])] : []
}

export const sePuedeTirar = (c: CartaMazo) => Boolean(c.tirada?.dado && tirable(c.tirada.dado))

/** Revisar un mueble o resolver la tirada de una Sala Especial */
export function tirarCarta(p: Partida, ctx: Contexto, mazo: IdMazo, id: string): Partida {
  const tirada = carta(ctx.mazos[mazo], id).tirada
  return tirada ? anotar(p, { tipo: 'tirada', mazo, carta: id, valores: tirarTabla(tirada) }) : p
}

const contadorMuerte = (m: Mision) =>
  m.efectos.find((e): e is Extract<EfectoEspecial, { tipo: 'contador-muerte' }> => e.tipo === 'contador-muerte')

/**
 * Turno del Malvado Brujo sin monstruos: Tirada de Peligro (1DC); con
 * calavera, tirada de evento (1D10) y, si no supera el peligro, evento.
 */
export function turnoBrujo(p: Partida, ctx: Contexto): Partida {
  let nueva = p
  let muerte: number | undefined
  const contador = contadorMuerte(ctx.mision)
  if (contador && p.contadorMuerte < contador.maximo) {
    muerte = tirar(contador.dado) + (contador.sumaNivelPeligro ? p.peligro : 0)
    if (muerte >= contador.umbral) nueva = { ...nueva, contadorMuerte: p.contadorMuerte + 1 }
  }

  const valor = tirar('1D6')
  const cara = caraDC(valor)
  if (cara === 'Escudo negro') return cambiarPeligro(anotar(nueva, { tipo: 'brujo', valor, muerte }), 1)
  if (cara === 'Escudo blanco') return anotar(nueva, { tipo: 'brujo', valor, muerte })

  const evento = tirar('1D10')
  if (evento > p.peligro) return anotar(nueva, { tipo: 'brujo', valor, evento, muerte })
  const tabla = tirar('1D20')
  const e = EVENTOS_MAZMORRA[tabla - 1]
  nueva = anotar(nueva, { tipo: 'brujo', valor, evento, tabla, muerte })
  if (e.bajaDadoTrampa) {
    const dados = PREPARACION.dadosTrampa
    nueva = { ...nueva, dadoTrampa: dados[Math.max(0, dados.indexOf(nueva.dadoTrampa) - 1)] ?? nueva.dadoTrampa }
  }
  return cambiarPeligro(nueva, e.subePeligro ? 1 : -1)
}

export const cambiarVida = (p: Partida, clave: string, delta: number, maximo: number): Partida => ({
  ...p,
  vidas: { ...p.vidas, [clave]: Math.min(maximo, Math.max(0, (p.vidas[clave] ?? maximo) + delta)) },
})

/** Fila de la tabla de encuentros de la misión; sin fila, no hay monstruos */
export function filaEncuentro(m: Mision, total: number): Encuentro | undefined {
  const tabla = tablaDeMision(m)
  if (!tabla || total <= ENCUENTRO_SIN_MONSTRUOS) return undefined
  const encuentros = TABLAS_ENCUENTROS[tabla].encuentros
  return encuentros.find((e) => e.resultado === Math.min(total, encuentros[encuentros.length - 1].resultado))
}

/** Grupo de monstruos de un encuentro para los héroes en juego */
export type Aparicion = { monstruos: string[]; cantidad: number; avanzado: boolean }

/**
 * Monstruos en el orden en que se colocan: los más débiles junto al héroe,
 * luego los más fuertes, los de ataque a distancia y por último los que
 * usan magia.
 */
export function apariciones(e: Encuentro, heroes: number, monstruos: Monstruos): Aparicion[] {
  const puesto = (id: string) => {
    const reglas = monstruos[id]?.reglas.map((r) => r.nombre) ?? []
    const grupo = reglas.some((r) => REGLAS_DE_MAGIA.includes(r)) ? 2 : reglas.some((r) => REGLAS_A_DISTANCIA.includes(r)) ? 1 : 0
    return grupo * 10 + (monstruos[id]?.categoria ?? 0)
  }
  return e.grupos
    .map((g) => ({ monstruos: [g.monstruo].flat(), cantidad: g.cantidad[columna(heroes)], avanzado: Boolean(g.avanzado) }))
    .filter((a) => a.cantidad > 0)
    .toSorted((a, b) => puesto(a.monstruos[0]) - puesto(b.monstruos[0]))
}

/** Reglas especiales de la misión para los momentos de la zona */
export const reglasDeZona = (m: Mision, z: Zona) => efectosSala(m, z.momentos)

/** Monstruos que aparecen: uno de los que pueden salir y cuántos */
type Llegada = { opciones: string[]; avanzado: boolean; cantidad: number; cuerpo?: number; nombre?: string }

/** Coloca monstruos en juego; de varias opciones, la que tenéis preparada */
export function aparecen(p: Partida, ctx: Contexto, llegadas: Llegada[]): Partida {
  const monstruos = [...(p.monstruos ?? [])]
  for (const { opciones: ids, avanzado, cantidad, cuerpo, nombre } of llegadas) {
    const monstruo = ids.find((id) => ctx.seleccion[claveMonstruo(id, avanzado)]) ?? ids[0]
    const datos = monstruo && ctx.monstruos[monstruo]
    if (!datos) continue
    const pc = cuerpo ?? version(datos, avanzado).cuerpo
    for (let i = 0; i < cantidad; i++) {
      const numero = Math.max(0, ...monstruos.filter((m) => m.monstruo === monstruo).map((m) => m.numero)) + 1
      // un nombre que no lleve ya otro monstruo en juego
      const libres = (datos.nombres ?? []).filter((n) => !monstruos.some((m) => m.nombre === n))
      monstruos.push({
        id: `${monstruo}-${numero}`,
        monstruo,
        avanzado,
        numero,
        nombre: nombre ?? (libres.length ? rnd(libres) : undefined),
        cuerpo: pc,
        pc,
      })
    }
  }
  return { ...p, monstruos, hayMonstruos: p.hayMonstruos || monstruos.length > 0 }
}

const errantes = (nombre: string, cantidad: number): Llegada[] => {
  const ids = opciones(nombre)
  return ids.length ? [{ opciones: ids.map((o) => o.monstruo), avanzado: Boolean(ids[0].avanzado), cantidad }] : []
}

/** Los monstruos que indica una tirada o una sala */
function llegadas(s: Suceso, ctx: Contexto): Llegada[] {
  const { mision: m, heroes, monstruos } = ctx
  if (s.tipo === 'encuentro') {
    const e = filaEncuentro(m, s.dado + s.peligro)
    return e ? apariciones(e, heroes, monstruos).map((a) => ({ opciones: a.monstruos, avanzado: a.avanzado, cantidad: a.cantidad })) : []
  }
  if (s.tipo === 'errantes') {
    const f = filaErrantes(s.dado)
    return [...errantes(m.faccion.errante, f.errantes), ...errantes(m.faccion.erranteSuperior, f.superiores)]
  }
  return []
}

/** En la Sala Objetivo: el Jefe Final y un errante por héroe */
function monstruosObjetivo(ctx: Contexto): Llegada[] {
  const [jefe] = opciones(ctx.mision.tipoJefe)
  return [
    ...errantes(ctx.mision.faccion.errante, Math.max(1, ctx.heroes)),
    ...(jefe
      ? [
          {
            opciones: [jefe.monstruo],
            avanzado: Boolean(jefe.avanzado),
            cantidad: 1,
            cuerpo: puntosCuerpoJefe(ctx.mision, ctx.monstruos, ctx.heroes),
            nombre: ctx.mision.jefe,
          },
        ]
      : []),
  ]
}

/** Un monstruo sin Puntos de Cuerpo muere; sin ninguno, no quedan monstruos */
export function cambiarVidaMonstruo(p: Partida, id: string, delta: number): Partida {
  const monstruos = (p.monstruos ?? []).flatMap((m) =>
    m.id !== id ? [m] : m.pc + delta <= 0 ? [] : [{ ...m, pc: Math.min(m.cuerpo, m.pc + delta) }],
  )
  return { ...p, monstruos, hayMonstruos: monstruos.length > 0 }
}

export const sinMonstruos = (p: Partida): Partida => ({
  ...p,
  monstruos: [],
  hayMonstruos: false,
  efectosActivos: Object.fromEntries(Object.entries(p.efectosActivos ?? {}).map(([clave, efectos]) => [clave, efectos.filter((e) => e.duracion !== 'hasta-sin-enemigos-visibles')])),
})

/** Daño de un combate: a cada combatiente, sus PC perdidos */
export function aplicarCombate(
  p: Partida,
  atacante: string,
  defensor: string,
  perdidas: { clave: string; nombre: string; pc: number; monstruo: boolean; cuerpo: number }[],
  recargas: Record<string, { blancas: number; negras: number }> = {},
): Partida {
  let nueva = anotar(p, { tipo: 'combate', atacante, defensor, perdidas: perdidas.map(({ nombre, pc }) => ({ nombre, pc })) })
  for (const x of perdidas) {
    if (!x.pc) continue
    nueva = x.monstruo ? cambiarVidaMonstruo(nueva, x.clave, -x.pc) : cambiarVida(nueva, x.clave, -x.pc, x.cuerpo)
    if (!x.monstruo) {
      const efectos = efectosDe(nueva, x.clave).filter((e) => e.duracion !== 'hasta-dano')
      nueva = { ...nueva, efectosActivos: { ...nueva.efectosActivos, [x.clave]: efectos } }
    }
  }
  for (const [clave, caras] of Object.entries(recargas)) nueva = recargarPorCombate(nueva, clave, caras)
  return nueva
}

/**
 * Monstruos de una categoría entre los que se sortea: los de la tabla de
 * encuentros de la misión («del tipo de monstruos de la Tabla de
 * Encuentros») o, si no tiene ninguno, los de todo el bestiario
 */
export function candidatosDeCategoria(ctx: Contexto, categoria: number): string[] {
  const tabla = tablaDeMision(ctx.mision)
  const deCategoria = (ids: string[]) => [...new Set(ids)].filter((id) => ctx.monstruos[id]?.categoria === categoria)
  const deTabla = deCategoria(tabla ? mazoMonstruos(tabla, ctx.heroes).map((c) => c.monstruo) : [])
  return deTabla.length ? deTabla : deCategoria(Object.keys(ctx.monstruos))
}

/** Añade monstruos al azar de una categoría, con una tirada por monstruo */
export function monstruosAlAzar(p: Partida, ctx: Contexto, categoria: number, cantidad: number): Partida {
  const candidatos = candidatosDeCategoria(ctx, categoria)
  if (!candidatos.length || cantidad < 1) return p
  const valores = Array.from({ length: cantidad }, () => tirar(`1D${candidatos.length}`))
  return aparecen(
    anotar(p, { tipo: 'azar', categoria, candidatos, valores }),
    ctx,
    valores.map((v) => ({ opciones: [candidatos[v - 1]], avanzado: false, cantidad: 1 })),
  )
}

export function anadirMonstruo(p: Partida, ctx: Contexto, monstruo: string, avanzado: boolean): Partida {
  return aparecen(p, ctx, [{ opciones: [monstruo], avanzado, cantidad: 1 }])
}
