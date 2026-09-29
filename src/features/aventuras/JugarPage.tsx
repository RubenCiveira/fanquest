import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLoaderData } from 'react-router'
import { Carta, Tirada } from '../../components/Carta'
import { CartaDialog } from '../../components/CartaDialog'
import { ConfirmarDialog } from '../../components/ConfirmarDialog'
import { Icono } from '../../components/Icono'
import { PageHeader } from '../../components/PageHeader'
import { caraDC, entre } from '../../lib/dados'
import { itemPorId, nombreItem, type ItemEquipo } from '../../lib/equipo'
import { registrarEvento } from '../../lib/matomo'
import { DADOS_MOVIMIENTO, PERFILES_MOVIMIENTO, puntosMovimiento, urlFichaVtt, urlRetrato, version, type Heroe } from '../../lib/personajes'
import type { IdMazo, Mazos } from '../../lib/mazos'
import type { EfectoEspecial } from '../generar/lib/tipos'
import { CartaAliado } from '../../components/CartaAliado'
import { CartaMonstruo } from '../../components/CartaMonstruo'
import { BarraFichas, type Ficha, type PanelFicha } from './components/BarraFichas'
import { FichaDialog } from './components/FichaDialog'
import { CombateDialog, type Participante } from './components/CombateDialog'
import { MapaZona, Medida, type Ocupante, type SalaMapa } from './components/MapaZona'
import { perdidas, recuentoRecarga } from './lib/combate'
import { ReglasMisionDialog } from './components/ReglasMisionDialog'
import { SucesoPartida } from './components/SucesoPartida'
import { ExportarDialog } from './components/ExportarAventura'
import { MonstruosDialog } from './components/MonstruosAlAzarDialog'
import { TablaTiradaDialog, type TiradaEnTabla } from './components/TablaTiradaDialog'
import { SALA_INICIAL } from './config/partida'
import { opciones, puntosCuerpoJefe } from './lib/monstruos'
import {
  aplicarCombate,
  activarEfecto,
  alternarEquipado,
  anadirItem,
  anadirMonstruo,
  atrezoColocado,
  avanzar,
  botinDeTesoro,
  botinDeZona,
  buscarPuertasSecretas,
  buscarTrampas,
  cargarTesoroEnInventario,
  cambiarOro,
  cambiarPeligro,
  cambiarVida,
  cambiarVidaMonstruo,
  carta,
  descargarRegla,
  disiparEfecto,
  dejarTesoroEnSuelo,
  elegirAtrezo,
  entrar,
  entrarPorPuertaSecreta,
  irA,
  monstruosAlAzar,
  gastarPergamino,
  anadirPuerta,
  cambiarSinPuertas,
  puertas,
  quitarPuerta,
  recargarRegla,
  cogerBotinSuelo,
  consumirBotinSuelo,
  secciones,
  volver,
  type Zona,
  moverse,
  puedeBuscarPuertas,
  puedeCaerEnTrampa,
  reglasDeZona,
  robarTesoro,
  robarSucesoDeTesoro,
  sePuedeTirar,
  sinMonstruos,
  estadisticasMiembro,
  tirarCarta,
  turnoBrujo,
  usarPocion,
  perderEquipo,
  type FinPartida,
  type Miembro,
  type Partida,
  type Paso,
  type TipoZona,
} from './lib/partida'
import { reglas as reglasPartida } from './lib/preparacion'
import { aLocal, conZona, moverEnMapa, quitarDelMapa, salaEn, salas, situar, type Anclaje } from './lib/mazmorra'
import { adyacentes, conRejilla, fijarTamano, girar, pared, redimensionar, rejillaDe, renombrar, type Pieza } from './lib/rejilla'
import { actua, haTerminado, nuevoTurno, seMueve, sinTerminar, terminarTurno, tiroTrampa, yaTiroTrampa } from './lib/turno'
import { cartasHechizosSeleccionadas, HABILIDADES_MAGIA } from './lib/hechizos'
import { reglasDeHeroe, type ReglaEspecial } from './lib/reglasEspeciales'
import { usePartida } from './lib/usePartida'
import type { DatosPartida } from './rutas'

const NOMBRE_ZONA: Record<TipoZona, string> = {
  inicial: 'Sala Inicial',
  pasillo: 'Pasillo',
  sala: 'Sala normal',
  especial: 'Sala especial',
  objetivo: 'Sala Objetivo',
  escaleras: 'Sala de escaleras',
  secreta: 'Sala secreta',
}

const FIN: Record<FinPartida, { accion: string; titulo: string; texto: string }> = {
  cumplida: {
    accion: 'Misión cumplida',
    titulo: '¡Misión cumplida!',
    texto:
      'Tras recibir la recompensa, podéis salir todos juntos sin volver a la escalera si no quedan monstruos y la misión lo permite.',
  },
  huida: {
    accion: 'Huir de la mazmorra',
    titulo: 'Habéis huido',
    texto:
      'Si llegáis por vuestro pie a la salida, conserváis la mitad del oro conseguido (redondeando hacia abajo) y descartáis los objetos de la misión. Podréis volver a jugarla.',
  },
  derrota: {
    accion: 'Todos han muerto',
    titulo: 'La mazmorra os ha vencido',
    texto: 'Todos los héroes han muerto. Cread nuevos héroes: la misión podrá jugarse de nuevo.',
  },
}

type EfectoSala = Extract<EfectoEspecial, { tipo: 'sala' }>
type DadoEfecto = 'D4' | 'D6' | 'D8' | 'D10' | 'D12' | 'D20' | 'DC'
type TiradaEfecto = { clave: string; cantidad: number; dado: DadoEfecto }

const DADOS_EFECTO: DadoEfecto[] = ['D4', 'D6', 'D8', 'D10', 'D12', 'D20', 'DC']
const AVISO_MONSTRUOS_ACTIVOS = 'No se pueden ejecutar estas acciones habiendo un monstruo activo.'
const carasDado = (dado: DadoEfecto) => (dado === 'DC' ? 6 : Number(dado.slice(1)))
const etiquetaMultilinea = (texto: string) =>
  texto
    .replace(/^Pócima de /, 'Pócima ')
    .replace(/^Pergamino de /, 'Perg. ')
    .split(/\s+/)
    .slice(0, 3)
    .map((palabra) => <span key={palabra}>{palabra}</span>)

function AccionDialog({ titulo, children, onCerrar }: { titulo: string; children: ReactNode; onCerrar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  // se cierra al pulsar fuera, pero no con el clic que termina un arrastre por el mapa y lo abre
  const pulsadoFuera = useRef(false)

  useEffect(() => ref.current?.showModal(), [])

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="accion-titulo"
      onClose={onCerrar}
      onPointerDown={(e) => {
        pulsadoFuera.current = e.target === ref.current
      }}
      onClick={(e) => e.target === ref.current && pulsadoFuera.current && onCerrar()}
    >
      <div className="dialog-contenido">
        <header className="dialog-cabecera">
          <h2 id="accion-titulo">{titulo}</h2>
          <button type="button" className="icon-button" onClick={onCerrar} aria-label="Cerrar">
            <Icono nombre="cerrar" />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  )
}

/** Al descubrir una zona con mapa: su tamaño en casillas, que después ya no cambia */
function TamanoDialog({
  titulo,
  inicial,
  onFijar,
  onCerrar,
}: {
  titulo: string
  inicial: { columnas: number; filas: number }
  onFijar: (columnas: number, filas: number) => void
  onCerrar: () => void
}) {
  const [medida, setMedida] = useState({ columnas: inicial.columnas, filas: inicial.filas })
  return (
    <AccionDialog titulo={titulo} onCerrar={onCerrar}>
      <p>¿Cuántas casillas tiene? Parte del tamaño habitual de la carta; después ya no se podrá cambiar.</p>
      <div className="mapa-medidas">
        <Medida etiqueta="Columnas" valor={medida.columnas} onCambiar={(columnas) => setMedida({ ...medida, columnas })} />
        <Medida etiqueta="Filas" valor={medida.filas} onCambiar={(filas) => setMedida({ ...medida, filas })} />
      </div>
      <div className="fila-botones">
        <button type="button" className="button" onClick={() => onFijar(medida.columnas, medida.filas)}>
          Fijar tamaño
        </button>
      </div>
    </AccionDialog>
  )
}

/** Las reglas de sala sin texto propio se describen a partir de sus datos */
function describirSala(e: EfectoSala, mazos: Mazos): string {
  if (e.texto) return e.texto
  const partes = [
    ...(e.elementos ?? []).map((el) => {
      const titulo = mazos.atrezo.cartas.find((c) => c.tipo === el.tipo)?.titulo ?? el.tipo
      return `coloca ${titulo}${el.siEsPosible ? ' si es posible' : ''}${el.contiene === 'objeto' ? ' con el objeto de la misión' : ''}`
    }),
    ...(e.sinAtrezo ? ['sin atrezo'] : []),
    ...(e.sinPuertas ? ['sin puertas'] : []),
  ]
  const texto = partes.join('; ')
  return texto && `${texto[0].toUpperCase()}${texto.slice(1)}.`
}

function explicarPaso(paso: Paso, dadoTrampa: string, peligro: number): [string, string] {
  switch (paso.tipo) {
    case 'atrezo':
      if (paso.robar === 'hasta-con-atrezo') {
        return [
          'Robar atrezo hasta sacar uno',
          'Roba cartas de atrezo hasta sacar una con atrezo y colócalo si hay espacio: los enemigos tienen prioridad.',
        ]
      }
      return [
        paso.robar === 1 ? 'Robar carta de atrezo' : `Robar ${paso.robar} cartas de atrezo`,
        paso.elegir
          ? 'Tras una puerta secreta se roban tres cartas de atrezo y se coloca una a elección.'
          : 'Coloca el mueble sin bloquear puertas; los de pared, pegados a un muro, y el cofre, lo más lejos posible de quien entró.',
      ]
    case 'elegir-atrezo':
      return ['', 'Elegid qué atrezo colocar; las demás cartas vuelven al mazo.']
    case 'encuentro':
      return ['Tirar en la tabla de encuentros', `Tira 1D20 y suma el Nivel de Peligro (${peligro}).`]
    case 'errantes':
      return ['Tirar en la tabla de errantes', 'La carta pide una tirada en la tabla de monstruos errantes (1D6) y otra de 1D6 para la distancia.']
    case 'especial':
      return ['Robar carta de sala especial', 'Roba una carta de sala especial y resuélvela. Explorarla sube 1 el Nivel de Peligro.']
    case 'trampa':
      return [
        `Tirar el dado de trampa (${dadoTrampa})`,
        `Nadie ha buscado trampas aquí: quien ha entrado tira el dado de trampa. Con un 1 activa una trampa.`,
      ]
  }
}

function FichaHeroePartida({ heroe, pc, movimientoFijo }: { heroe: Heroe; pc: number; movimientoFijo: boolean }) {
  return (
    <article className="ficha-heroe-compacta">
      <header>
        <img src={urlRetrato('heroes', heroe)} alt="" />
        <div>
          <h2>{heroe.nombre}</h2>
          <p>
            {pc}/{heroe.cuerpo} PC · {heroe.mente} PM
          </p>
        </div>
      </header>
      <dl className="ficha-atributos">
        <div>
          <dt>Mov</dt>
          <dd>{movimientoFijo ? puntosMovimiento(heroe) : DADOS_MOVIMIENTO}</dd>
        </div>
        <div>
          <dt>Atq</dt>
          <dd>{heroe.ataque}</dd>
        </div>
        <div>
          <dt>Def</dt>
          <dd>{heroe.defensa}</dd>
        </div>
        <div>
          <dt>Cue</dt>
          <dd>{heroe.cuerpo}</dd>
        </div>
        <div>
          <dt>Men</dt>
          <dd>{heroe.mente}</dd>
        </div>
      </dl>
      <p className="ficha-movimiento">
        <strong>Movimiento:</strong>{' '}
        {movimientoFijo ? `${PERFILES_MOVIMIENTO[heroe.movimiento].descripcion.toLowerCase()}.` : `tira ${DADOS_MOVIMIENTO} cada turno.`}
      </p>
      <details className="ficha-biografia">
        <summary>Biografía y equipo inicial</summary>
        <p className="carta-cita">«{heroe.cita}»</p>
        <p>{heroe.descripcion}</p>
        <p>
          <strong>Equipo inicial:</strong> {heroe.equipo}.
        </p>
        <p>
          <strong>Limitaciones:</strong> {heroe.limitaciones}
        </p>
        {heroe.malvado && <p>Alineamiento malvado (regla opcional).</p>}
      </details>
    </article>
  )
}

function PanelHabilidad({ titulo, texto, tiradas }: { titulo: string; texto: string; tiradas?: Parameters<typeof Tirada>[0]['tirada'][] }) {
  return (
    <section className="panel-habilidad-ficha">
      <h4>{titulo}</h4>
      <p>{texto}</p>
      {tiradas?.map((t) => <Tirada key={t.accion} tirada={t} />)}
    </section>
  )
}

function descripcionItem(item: ItemEquipo | undefined) {
  if (!item) return undefined
  if ('efecto' in item) return item.efecto
  if ('reglas' in item) return item.reglas?.join(' ')
  return undefined
}

function nombreBotin(equipo: Parameters<typeof nombreItem>[0], botin: ReturnType<typeof botinDeZona>[number]) {
  return botin.tipo === 'oro' ? `${botin.cantidad} mo` : nombreItem(equipo, botin.itemId)
}

function AccionesRegla({ reglas, descargadas, onActivar, onDescargar }: { reglas: ReglaEspecial[]; descargadas: string[]; onActivar: (regla: ReglaEspecial) => void; onDescargar: (regla: ReglaEspecial) => void }) {
  const manuales = reglas.filter((r) => r.disparador === 'manual')
  if (!manuales.length) return null
  return (
    <div className="acciones-reglas">
      {manuales.map((regla) => {
        const descargada = descargadas.includes(regla.id)
        return (
          <button
            key={regla.id}
            type="button"
            className="button mini secondary"
            disabled={descargada}
            title={regla.descripcion}
            onClick={() => (regla.tipo === 'efecto' ? onActivar(regla) : onDescargar(regla))}
          >
            {descargada ? `${regla.nombre} descargada` : regla.tipo === 'efecto' ? `Activar ${regla.nombre}` : `Usar ${regla.nombre}`}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Resultado de una acción en un popup encima de la ficha: el suceso anotado en esa posición de la zona
 * (buscar trampas) o un texto (tirar dados)
 */
type ResultadoAccion = { titulo: string } & ({ zona: number; suceso: number } | { texto: string })

/** Lo que se sugiere tras mover a alguien por el mapa */
type AvisoMapa =
  | { tipo: 'trampa'; clave: string }
  | { tipo: 'atrezo'; clave: string; carta: string }
  /** Resultado de la tirada recién hecha, que se anotó en esa posición de los sucesos */
  | { tipo: 'resultado'; suceso: number }
  /** En tablero, qué hay tras la puerta pisada; la zona nueva se pegará a ella */
  | { tipo: 'destino'; puerta: string; anclaje: Anclaje }

/** Puerta de una zona como pieza del mapa */
type PuertaMapa = {
  id: string
  nombre: string
  /** Lo que se lee en la pieza */
  rotulo: string
  /** Solo las puertas sin explorar se abren al pisarlas; las demás se cruzan andando */
  abrir?: (p: Partida, seccion: 'sala' | 'pasillo') => Partida
  /** En tablero, qué hay tras ella se elige al cruzarla */
  eligeSeccion?: boolean
  /** La puerta nueva o secreta pasa a ser una salida más: su pieza la sigue marcando */
  pasaASalida?: boolean
}

export function JugarPage() {
  const datos = useLoaderData<DatosPartida>()
  const { aventura, contexto, miembros, habilidades, monstruos, equipo } = datos
  const { mision, modo, mazos, heroes } = contexto
  const { partida: p, hacer, puedeDeshacer, deshacer } = usePartida(datos)
  const [verCarta, setVerCarta] = useState<{ mazo: IdMazo; id: string } | null>(null)
  const [verReglas, setVerReglas] = useState(false)
  const [terminar, setTerminar] = useState<FinPartida | null>(null)
  const [tabla, setTabla] = useState<TiradaEnTabla | null>(null)
  const [anadirMonstruos, setAnadirMonstruos] = useState(false)
  const [exportar, setExportar] = useState(false)
  const [ataque, setAtaque] = useState<{ atacante: string; defensor?: string } | null>(null)
  const [miembroAcciones, setMiembroAcciones] = useState<string | null>(null)
  /** Con mapa no hay barras laterales: la ficha se abre tocándola en el mapa */
  const [fichaMapa, setFichaMapa] = useState<string | null>(null)
  /** Lo que se sugiere, en orden, tras mover a alguien por el mapa de esta zona */
  const [avisosMapa, setAvisosMapa] = useState<{ zona: number; avisos: AvisoMapa[] }>({ zona: -1, avisos: [] })
  /** Se ha intentado mover a quien ya terminó su turno: se propone empezar otro */
  const [turnoAcabado, setTurnoAcabado] = useState<string | null>(null)
  /**
   * Descubrimiento de la zona en popups: en qué zona va (visto ya su tipo), el resultado del último paso por
   * enseñar (desde esa posición de los sucesos) o si se cerró para seguir en la página
   */
  const [descubrimiento, setDescubrimiento] = useState<{ zona: number; resultado?: number; cerrado?: boolean } | null>(null)
  const [resultadoAccion, setResultadoAccion] = useState<ResultadoAccion | null>(null)
  const [accionMiembro, setAccionMiembro] = useState<{ clave: string; tipo: 'equipo' | 'encontrado' } | null>(null)
  const [volverAccionesMiembro, setVolverAccionesMiembro] = useState<string | null>(null)
  const [avisoAccion, setAvisoAccion] = useState<string | null>(null)
  const [equipoAUsar, setEquipoAUsar] = useState('')
  const [equipoEncontrado, setEquipoEncontrado] = useState('')
  const [tiradaEfecto, setTiradaEfecto] = useState<TiradaEfecto | null>(null)
  const [tesoroRobado, setTesoroRobado] = useState<{ clave: string; id: string } | null>(null)
  const [botinElegido, setBotinElegido] = useState<{ id: string; clave: string } | null>(null)
  const { zona } = p
  const mapa = secciones(p)
  const seccion = (id: number) => mapa.find((z) => z.id === id)
  const padre = zona.padre === undefined ? undefined : seccion(zona.padre)
  const nombreZona = (z: Zona) => z.nombre ?? (z.tipo === 'inicial' ? NOMBRE_ZONA.inicial : `${NOMBRE_ZONA[z.tipo]} ${z.id}`)
  const porExplorar = (z: Zona) =>
    z.salidas.filter((s) => s.destino === undefined && p.caminos[s.camino ?? -1]?.length).length
  const { movimientoFijo, habilidadesEspeciales, usarMapa } = reglasPartida(aventura.configuracion)
  /** Con mapa, anota la acción del turno de esa ficha (atacar, buscar…); si ya se movió, su turno termina */
  const accion = (a: Partida, clave: string) => (usarMapa ? actua(a, clave) : a)
  // la carta robada se enseña encima de la ficha, con sus opciones
  const robarTesoroPara = (clave: string) => {
    const [id, nueva] = robarTesoro(p, contexto)
    hacer(() => accion(nueva, clave))
    if (id) setTesoroRobado({ clave, id })
  }
  // la tirada se anota al final de los sucesos de la zona y se enseña aparte
  const buscarTrampasCon = (clave: string, nombre: string) => {
    setResultadoAccion({ zona: zona.id, suceso: zona.sucesos.length, titulo: `Buscar trampas: ${nombre}` })
    hacer((a) => accion(buscarTrampas(a, contexto), clave))
  }
  const [paso] = zona.pendientes
  const onVerCarta = (mazo: IdMazo, id: string) => setVerCarta({ mazo, id })
  const reglas = reglasDeZona(mision, zona).map((e) => describirSala(e, mazos)).filter(Boolean)
  const contador = mision.efectos.find((e) => e.tipo === 'contador-muerte')
  const pnjAlInicio = mision.efectos.some((e) => e.tipo === 'pnj' && e.aparece === 'inicio')
  const especial = zona.sucesos.find((s) => s.tipo === 'especial')?.id
  const tiradas = [
    ...atrezoColocado(zona).map((id) => ({ mazo: 'atrezo' as const, id })),
    ...(especial ? [{ mazo: 'salas-especiales' as const, id: especial }] : []),
  ].filter(({ mazo, id }, i, todas) => sePuedeTirar(carta(mazos[mazo], id)) && todas.findIndex((t) => t.id === id) === i)
  const botinSuelo = botinDeZona(p)
  const opcionesEquipoEncontrado: { id: string; nombre: string; tipo?: 'equipo' | 'pociones' | 'pergaminos' | 'artefactos' }[] = [
    ...equipo.equipo.map((item) => ({ id: item.id, nombre: item.nombre, tipo: 'equipo' as const })),
    ...equipo.pociones.map((item) => ({ id: item.id, nombre: item.nombre, tipo: 'pociones' as const })),
    ...equipo.pergaminos.map((item) => ({ id: item.id, nombre: item.nombre, tipo: 'pergaminos' as const })),
    ...equipo.artefactos.map((item) => ({ id: item.id, nombre: item.nombre, tipo: 'artefactos' as const })),
    ...mazos.tesoros.cartas.flatMap((c) => (c.equipoId ? [{ id: c.equipoId, nombre: c.titulo }] : [])),
    ...mazos.sucesos.cartas
      .filter((c) => c.titulo.startsWith('Arcano Mágico'))
      .map((c) => ({ id: c.tipo, nombre: c.titulo, tipo: 'artefactos' as const })),
  ]
    .filter((item, i, todos) => todos.findIndex((otro) => otro.id === item.id) === i)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  const busquedaEquipoEncontrado = equipoEncontrado.trim().toLocaleLowerCase('es')
  const sugerenciasEquipoEncontrado = opcionesEquipoEncontrado
    .filter((item) => !busquedaEquipoEncontrado || item.id.includes(busquedaEquipoEncontrado) || item.nombre.toLocaleLowerCase('es').includes(busquedaEquipoEncontrado))
    .slice(0, 8)
  const [errante] = opciones(mision.faccion.errante)
  const grupo: Ficha[] = miembros.map((m) => {
    const hechizos = 'heroe' in m ? cartasHechizosSeleccionadas(m.heroe, mazos.hechizos, aventura.configuracion.hechizos?.[m.clave]) : []
    const nombre = m.nombre ?? ('heroe' in m ? m.heroe.nombre : m.aliado.nombre)
    const puedeActuar = (p.vidas[m.clave] ?? m.cuerpo) > 0
    const puedeCogerCartaTesoro = zona.tipo !== 'inicial' && zona.tipo !== 'pasillo' && Boolean(p.mazos.tesoros?.length)
    const inv = p.inventario?.[m.clave]
    const efectosActivos = p.efectosActivos?.[m.clave] ?? []
    const reglasDescargadas = p.reglasDescargadas?.[m.clave] ?? []
    const idsDescargados = reglasDescargadas.map((r) => r.id)
    const reglasEspeciales = reglasDeHeroe('heroe' in m ? m.heroe : undefined, hechizos.map((h) => h.id), inv, habilidadesEspeciales)
    const activarRegla = (regla: ReglaEspecial) => hacer((a) => activarEfecto(a, m.clave, regla))
    const descargar = (regla: ReglaEspecial) => hacer((a) => descargarRegla(a, m.clave, regla))
    const equipoDisponible = [...(inv?.equipo ?? []), ...(inv?.artefactos ?? [])]
    const itemsInventario = [...(inv?.equipo ?? []), ...(inv?.artefactos ?? []), ...(inv?.pociones ?? []), ...(inv?.pergaminos ?? [])]
    const panelesIzquierda: PanelFicha[] = [
      ...itemsInventario.map((id, i) => {
        const texto = descripcionItem(itemPorId(equipo, id))
        const esPocion = inv?.pociones.includes(id)
        const esPergamino = inv?.pergaminos.includes(id)
        const esEquipo = inv?.equipo.includes(id) || inv?.artefactos.includes(id)
        return {
          id: `${m.clave}-${id}-${i}`,
          label: etiquetaMultilinea(nombreItem(equipo, id)),
          titulo: nombreItem(equipo, id),
          tipo: 'item' as const,
          children: (
            <div className="panel-item-ficha">
              {texto && <p>{texto}</p>}
              <AccionesRegla reglas={reglasEspeciales.filter((r) => r.origenId === id)} descargadas={idsDescargados} onActivar={activarRegla} onDescargar={descargar} />
              <div className="fila-botones">
                {esEquipo && (
                  <button type="button" className="button mini" onClick={() => hacer((a) => alternarEquipado(a, m.clave, id))}>
                    {inv?.equipado.includes(id) ? 'Desequipar' : 'Equipar'}
                  </button>
                )}
                {esPocion && (
                  <button type="button" className="button mini" onClick={() => hacer((a) => usarPocion(a, m.clave, id))}>
                    Usar
                  </button>
                )}
                {esPergamino && (
                  <button type="button" className="button mini" onClick={() => hacer((a) => gastarPergamino(a, m.clave, id))}>
                    Gastar
                  </button>
                )}
                {esEquipo && (
                  <button type="button" className="button mini secondary" onClick={() => hacer((a) => perderEquipo(a, m.clave, id))}>
                    Perder
                  </button>
                )}
              </div>
            </div>
          ),
        }
      }),
    ]
    const panelesDerecha: PanelFicha[] =
      'heroe' in m
        ? [
            ...[
              ...(habilidadesEspeciales ? m.heroe.habilidades.filter((id) => !HABILIDADES_MAGIA.has(id)).map((id) => ({ id, nota: m.heroe.opcionales?.includes(id) ? ' (opcional)' : '' })) : []),
              ...(habilidadesEspeciales ? (m.heroe.eligeUna ?? []).filter((id) => !HABILIDADES_MAGIA.has(id)).map((id) => ({ id, nota: '' })) : []),
            ].flatMap(({ id, nota }, i) => {
              const h = habilidades[id]
              return h
                ? [{
                    id: `${m.clave}-${id}-${i}`,
                    label: etiquetaMultilinea(h.titulo),
                    titulo: `${h.titulo}${nota}`,
                    tipo: 'habilidad' as const,
                    children: (
                      <>
                        <PanelHabilidad titulo={`${h.titulo}${nota}`} texto={h.texto} tiradas={h.tiradas} />
                        <AccionesRegla reglas={reglasEspeciales.filter((r) => r.origenId === id)} descargadas={idsDescargados} onActivar={activarRegla} onDescargar={descargar} />
                      </>
                    ),
                  }]
                : []
            }),
            ...hechizos.map((c) => ({
              id: `${m.clave}-${c.id}`,
              label: etiquetaMultilinea(c.titulo),
              titulo: c.titulo,
              tipo: 'hechizo' as const,
              children: (
                <>
                  <Carta mazo="hechizos" carta={c} variante="completa" />
                  <AccionesRegla reglas={reglasEspeciales.filter((r) => r.origenId === c.id)} descargadas={idsDescargados} onActivar={activarRegla} onDescargar={descargar} />
                </>
              ),
            })),
          ]
        : []
    return {
      clave: m.clave,
      nombre,
      retrato: 'heroe' in m ? urlRetrato('heroes', m.heroe) : undefined,
      vtt: 'heroe' in m ? urlFichaVtt('heroes', m.heroe.id, m.sexo) : undefined,
      pc: p.vidas[m.clave] ?? m.cuerpo,
      cuerpo: m.cuerpo,
      panelesIzquierda,
      panelesDerecha,
      resumen: inv && (
        <div className="ficha-dialog-resumen">
          <span className="ficha-oro">
            <strong>{inv.oro}</strong> mo
          </span>
          <button type="button" className="icon-button" aria-label={`Restar oro a ${nombre}`} onClick={() => hacer((a) => cambiarOro(a, m.clave, -25))}>
            <Icono nombre="menos" />
          </button>
          <button type="button" className="icon-button" aria-label={`Sumar oro a ${nombre}`} onClick={() => hacer((a) => cambiarOro(a, m.clave, 25))}>
            <Icono nombre="mas" />
          </button>
          {efectosActivos.map((efecto) => (
            <button key={efecto.id} type="button" className="button mini efecto-activo" title={efecto.descripcion} onClick={() => hacer((a) => disiparEfecto(a, m.clave, efecto.id))}>
              Disipar {efecto.nombre}
            </button>
          ))}
          {reglasDescargadas.map((regla) => (
            <button key={regla.id} type="button" className="button mini secondary" title={regla.descripcion} onClick={() => hacer((a) => recargarRegla(a, m.clave, regla.id))}>
              Recargar {regla.nombre}
            </button>
          ))}
        </div>
      ),
      acciones: (
        <div className="acciones-ficha-personaje acciones-rueda">
          <button type="button" className="button" disabled={!puedeActuar} onClick={() => setAtaque({ atacante: m.clave })}>
            <Icono nombre="espada" />
            Atacar
          </button>
          <button type="button" className="button secondary" disabled={!puedeActuar} onClick={() => setTiradaEfecto({ clave: m.clave, cantidad: 1, dado: 'D6' })}>
            <Icono nombre="dado" />
            Tirar dados
          </button>
          <button
            type="button"
            className="button secondary"
            disabled={!puedeActuar || (!p.hayMonstruos && !puedeCaerEnTrampa(zona))}
            onClick={() => {
              if (p.hayMonstruos) return setAvisoAccion(AVISO_MONSTRUOS_ACTIVOS)
              buscarTrampasCon(m.clave, nombre)
            }}
          >
            Buscar trampas
          </button>
          <button
            type="button"
            className="button secondary"
            disabled={!puedeActuar || (!p.hayMonstruos && !puedeCogerCartaTesoro)}
            onClick={() => (p.hayMonstruos ? setAvisoAccion(AVISO_MONSTRUOS_ACTIVOS) : robarTesoroPara(m.clave))}
          >
            Coger carta de tesoro
          </button>
          <button
            type="button"
            className="button secondary"
            disabled={!puedeActuar || !equipoDisponible.length}
            onClick={() => {
              setEquipoAUsar(equipoDisponible[0] ? nombreItem(equipo, equipoDisponible[0]) : '')
              setAccionMiembro({ clave: m.clave, tipo: 'equipo' })
            }}
          >
            Consumir equipo
          </button>
          <button
            type="button"
            className="button secondary"
            disabled={!puedeActuar || !opcionesEquipoEncontrado.length}
            onClick={() => {
              setEquipoEncontrado(opcionesEquipoEncontrado[0]?.id || '')
              setAccionMiembro({ clave: m.clave, tipo: 'encontrado' })
            }}
          >
            Coger equipo específico
          </button>
        </div>
      ),
      carta:
        'heroe' in m ? (
          <FichaHeroePartida heroe={m.heroe} pc={p.vidas[m.clave] ?? m.cuerpo} movimientoFijo={movimientoFijo} />
        ) : (
          <CartaAliado aliado={m.aliado} variante="completa" />
        ),
    }
  })
  const enJuego: Ficha[] = (p.monstruos ?? []).flatMap((m) => {
    const datos = monstruos[m.monstruo]
    return datos
      ? [
          {
            clave: m.id,
            nombre: m.nombre ? datos.nombre : `${datos.nombre} ${m.numero}`,
            alias: m.nombre ?? String(m.numero),
            retrato: urlRetrato('monstruos', datos),
            vtt: urlFichaVtt('monstruos', datos.id),
            pc: m.pc,
            cuerpo: m.cuerpo,
            carta: <CartaMonstruo monstruo={datos} avanzado={m.avanzado} variante="completa" papel={m.nombre ?? `Nº ${m.numero}`} />,
          },
        ]
      : []
  })
  // quién puede atacar a quién: el grupo a los monstruos y al revés
  const participantes: Participante[] = [
    ...miembros.map((m): Participante => {
      const datos = 'heroe' in m ? m.heroe : m.aliado
      const ficha = grupo.find((f) => f.clave === m.clave)
      const stats = estadisticasMiembro(m, p.inventario?.[m.clave], equipo, p.efectosActivos?.[m.clave])
      return { clave: m.clave, nombre: m.nombre ?? datos.nombre, bando: 'grupo', ataque: stats.ataque, defensa: stats.defensa, retrato: ficha?.retrato }
    }),
    ...(p.monstruos ?? []).flatMap((m): Participante[] => {
      const datos = monstruos[m.monstruo]
      const ficha = enJuego.find((f) => f.clave === m.id)
      if (!datos || !ficha) return []
      const { ataque: dados, defensa } = version(datos, m.avanzado)
      return [{ clave: m.id, nombre: ficha.alias ?? ficha.nombre, bando: 'monstruos', ataque: dados, defensa, retrato: ficha.retrato }]
    }),
  ]
  const participante = (clave?: string) => participantes.find((x) => x.clave === clave)
  const reglasCombate = Object.fromEntries(
    miembros.map((m) => {
      const hechizos = 'heroe' in m ? cartasHechizosSeleccionadas(m.heroe, mazos.hechizos, aventura.configuracion.hechizos?.[m.clave]) : []
      const descargadas = new Set((p.reglasDescargadas?.[m.clave] ?? []).map((r) => r.id))
      return [m.clave, reglasDeHeroe('heroe' in m ? m.heroe : undefined, hechizos.map((h) => h.id), p.inventario?.[m.clave], habilidadesEspeciales).filter((r) => !descargadas.has(r.id))]
    }),
  )
  const atacante = participante(ataque?.atacante)
  const pcJefe = puntosCuerpoJefe(mision, monstruos, heroes)
  const miembroEnAcciones = miembros.find((m) => m.clave === miembroAcciones)
  const miembroEnSubaccion = miembros.find((m) => m.clave === accionMiembro?.clave)
  const miembroEnTirada = miembros.find((m) => m.clave === tiradaEfecto?.clave)
  const nombreMiembro = (m: Miembro) => ('heroe' in m ? m.heroe.nombre : m.aliado.nombre)
  /**
   * Puertas de una zona como piezas del mapa. Con la mazmorra entera en el mapa, solo las que están sin
   * explorar se abren (y la zona nueva se pega a ellas); las demás se cruzan andando de sala en sala
   */
  const puertasDe = (z: Zona): PuertaMapa[] => {
    const lista = z.salidas.map((salida, i): PuertaMapa => {
      const destino = salida.destino === undefined ? undefined : seccion(salida.destino)
      const sinSalida = !destino && !p.caminos[salida.camino ?? -1]?.length
      const rotulo = salida.secreta ? 'Secreta' : String(i + 1)
      return {
        id: `salida-${i}`,
        nombre: destino ? `Puerta a ${nombreZona(destino)}` : `Puerta ${rotulo}${sinSalida ? ' (sin salida)' : ''}`,
        rotulo,
        abrir: destino || sinSalida ? undefined : (a) => entrar(a, contexto, { puerta: i }),
      }
    })
    const anterior = z.padre === undefined ? undefined : seccion(z.padre)
    if (anterior) lista.unshift({ id: 'entrada', nombre: `Entrada (desde ${nombreZona(anterior)})`, rotulo: 'Entrada' })
    if (z.puertaSecreta) {
      lista.push({
        id: 'secreta',
        nombre: 'Puerta secreta',
        rotulo: 'Secreta',
        abrir: (a, s) => entrarPorPuertaSecreta(a, contexto, s),
        eligeSeccion: modo === 'tablero',
        pasaASalida: true,
      })
    }
    // con tablero, las puertas sin explorar las marca el tablero: una pieza basta para todas
    if (modo === 'tablero' && !z.sinPuertas) {
      lista.push({
        id: 'nueva',
        nombre: 'Puerta sin explorar',
        rotulo: '?',
        abrir: (a, s) => entrar(a, contexto, { seccion: s }),
        eligeSeccion: true,
        pasaASalida: true,
      })
    }
    return lista
  }
  // la misma carta puede salir dos veces: cada copia es una pieza
  const atrezoDe = (z: Zona): Ocupante[] =>
    atrezoColocado(z).flatMap((id, i, lista) => {
      const c = carta(mazos.atrezo, id)
      const copia = lista.slice(0, i).filter((otra) => otra === id).length
      return c.tipo === 'sin-atrezo' ? [] : [{ id: copia ? `${id}#${copia}` : id, tipo: 'atrezo', atrezo: c.tipo, nombre: c.titulo, zona: z.id }]
    })
  // con mapa, la zona actual siempre tiene sitio en él (se guarda con la siguiente acción)
  const salasMapa: SalaMapa[] = usarMapa ? salas(situar(p)).map((s) => ({ ...s, nombre: nombreZona(seccion(s.zona) ?? zona) })) : []
  // en el mapa, la figura vista desde arriba o, si no la hay, el retrato recortado en redondo
  const ocupantes: Ocupante[] = usarMapa
    ? [
        ...miembros.map((m): Ocupante => {
          const vtt = 'heroe' in m ? urlFichaVtt('heroes', m.heroe.id, m.sexo, 'vtt-heroe') : undefined
          return {
            id: m.clave,
            tipo: 'miembro',
            bando: 'grupo',
            nombre: m.nombre ?? nombreMiembro(m),
            imagen: vtt ?? grupo.find((f) => f.clave === m.clave)?.retrato,
            vtt: Boolean(vtt),
            caido: !(p.vidas[m.clave] ?? m.cuerpo),
            terminado: haTerminado(p, m.clave),
          }
        }),
        ...(p.monstruos ?? []).flatMap((m): Ocupante[] => {
          const datos = monstruos[m.monstruo]
          if (!datos) return []
          const vtt = urlFichaVtt('monstruos', datos.id, undefined, 'vtt')
          return [
            {
              id: m.id,
              tipo: 'monstruo',
              bando: 'monstruos',
              nombre: datos.nombre,
              alias: m.nombre ?? String(m.numero),
              imagen: vtt ?? urlRetrato('monstruos', datos),
              vtt: Boolean(vtt),
              terminado: haTerminado(p, m.id),
            },
          ]
        }),
        // el atrezo y las puertas de cada sala del mapa
        ...salasMapa.flatMap((s): Ocupante[] => {
          const z = seccion(s.zona)
          return z
            ? [...atrezoDe(z), ...puertasDe(z).map((pu): Ocupante => ({ id: pu.id, tipo: 'puerta', nombre: pu.nombre, alias: pu.rotulo, zona: z.id }))]
            : []
        }),
      ]
    : []
  const vidaGrupo = (clave: string, delta: 1 | -1) =>
    hacer((a) => cambiarVida(a, clave, delta, grupo.find((f) => f.clave === clave)?.cuerpo ?? 0))
  const vidaMonstruo = (id: string, delta: 1 | -1) => hacer((a) => cambiarVidaMonstruo(a, id, delta))
  // cada aviso sigue en pie mientras tenga sentido: sin buscar trampas, sin monstruos, sin paso pendiente…
  const avisosZona = avisosMapa.zona === zona.id ? avisosMapa.avisos : []
  const aviso = avisosZona.find((av) =>
    av.tipo === 'trampa'
      ? puedeCaerEnTrampa(zona) && !yaTiroTrampa(p, av.clave)
      : av.tipo === 'atrezo'
        ? !p.hayMonstruos
        : av.tipo === 'destino'
          ? !paso && !p.fin
          : Boolean(zona.sucesos[av.suceso]),
  )
  /** Quita el aviso a la vista y pone delante los nuevos (p. ej. el resultado de su tirada) */
  const siguienteAviso = (...nuevos: AvisoMapa[]) =>
    setAvisosMapa({ zona: zona.id, avisos: [...nuevos, ...avisosZona.filter((av) => av !== aviso)] })
  const nombreEnMapa = (clave: string) => {
    const monstruo = p.monstruos?.find((m) => m.id === clave)
    if (monstruo) return monstruo.nombre ?? `${monstruos[monstruo.monstruo]?.nombre ?? ''} ${monstruo.numero}`
    return grupo.find((f) => f.clave === clave)?.nombre ?? ''
  }
  // colocarlo y anotar que se ha movido (con su acción ya hecha, su turno termina); a un héroe que entra en
  // otra sala, esa pasa a ser la zona actual, y se le sugiere el dado de trampa (una vez por turno) y revisar
  // el atrezo que tiene al lado
  const alMoverse = (clave: string, pieza: Pieza) => {
    const sala = salaEn(salasMapa, pieza.x, pieza.y)
    const destino = sala && seccion(sala.zona)
    if (!sala || !destino) return
    const esMonstruo = p.monstruos?.some((m) => m.id === clave)
    hacer((a) => {
      const movida = seMueve(moverEnMapa(situar(a), pieza), clave)
      return !esMonstruo && sala.zona !== movida.zona.id ? irA(movida, sala.zona) : movida
    })
    if (esMonstruo) return
    const junto = adyacentes(sala.rejilla, aLocal(sala, pieza)).map((j) => j.id.split('#')[0])
    const revisables =
      destino.tipo === 'inicial' ? [] : [...new Set(atrezoColocado(destino))].filter((id) => junto.includes(id) && sePuedeTirar(carta(mazos.atrezo, id)))
    setAvisosMapa({
      zona: sala.zona,
      avisos: [
        ...(puedeCaerEnTrampa(destino) && !yaTiroTrampa(p, clave) ? [{ tipo: 'trampa' as const, clave }] : []),
        ...revisables.map((id) => ({ tipo: 'atrezo' as const, clave, carta: id })),
      ],
    })
  }
  // la zona de la puerta es la actual; la nueva queda anclada a la puerta para pegarse a ella en el mapa
  const abrirPuerta = (a: Partida, puerta: PuertaMapa, seccionNueva: 'sala' | 'pasillo', anclaje: Anclaje) => {
    if (!puerta.abrir) return a
    // la puerta nueva o secreta pasa a ser una salida más y su pieza la sigue marcando
    const marcada = puerta.pasaASalida
      ? conZona(a, anclaje.zona, (z) => ({ ...z, rejilla: renombrar(rejillaDe(z), puerta.id, `salida-${z.salidas.length}`) }))
      : a
    const nueva = puerta.abrir(marcada, seccionNueva)
    return nueva.zona.id === a.zona.id ? nueva : { ...nueva, zona: { ...nueva.zona, anclaje } }
  }
  // pisar una puerta sin explorar es abrirla, salvo con la exploración a medias; quien la abre se queda en
  // ella, en su sala
  const alPisarPuerta = (id: string, zonaPuerta: number, clave: string, pieza: Pieza) => {
    const sala = salasMapa.find((s) => s.zona === zonaPuerta)
    const z = seccion(zonaPuerta)
    const puerta = z && puertasDe(z).find((pu) => pu.id === id)
    if (!sala || !puerta?.abrir || paso || p.fin) return alMoverse(clave, pieza)
    const anclaje: Anclaje = { zona: zonaPuerta, puerta: { x: pieza.x, y: pieza.y }, pared: pared(sala.rejilla, aLocal(sala, pieza)) }
    const enLaPuerta = (a: Partida) => {
      const movida = seMueve(moverEnMapa(situar(a), pieza), clave)
      return movida.zona.id === zonaPuerta ? movida : irA(movida, zonaPuerta)
    }
    if (!puerta.eligeSeccion) return hacer((a) => abrirPuerta(enLaPuerta(a), puerta, 'sala', anclaje))
    hacer(enLaPuerta)
    setAvisosMapa({ zona: zonaPuerta, avisos: [{ tipo: 'destino', puerta: id, anclaje }] })
  }
  // quienes siguen en pie, héroes y monstruos, y aún no han jugado su turno
  const faltanPorTerminar = sinTerminar(p, [
    ...miembros.filter((m) => (p.vidas[m.clave] ?? m.cuerpo) > 0).map((m) => m.clave),
    ...(p.monstruos ?? []).map((m) => m.id),
  ])
  const puertaDestino = aviso?.tipo === 'destino' ? puertasDe(zona).find((pu) => pu.id === aviso.puerta) : undefined
  const anclajeDestino = aviso?.tipo === 'destino' ? aviso.anclaje : undefined
  // con mapa, héroes y monstruos están en él: tocarlos abre su ficha
  const mapaZona = usarMapa && (
    <>
      <MapaZona
        salas={salasMapa}
        actual={zona.id}
        ocupantes={ocupantes}
        onColocar={(pieza, z) => hacer((a) => moverEnMapa(situar(a), pieza, z))}
        onQuitar={(id, z) => hacer((a) => quitarDelMapa(a, id, z))}
        onGirar={(id, z) => hacer((a) => conZona(a, z, (zz) => ({ ...zz, rejilla: girar(rejillaDe(zz), id) })))}
        onRedimensionar={(columnas, filas) => hacer((a) => conRejilla(situar(a), (r) => redimensionar(r, columnas, filas)))}
        onAtacar={(atacante, defensor) => setAtaque({ atacante, defensor })}
        onFicha={setFichaMapa}
        onMovido={alMoverse}
        onPuerta={alPisarPuerta}
        onTerminado={setTurnoAcabado}
      />
      {/* un popup por aviso: cada uno se abre al cerrarse el anterior */}
      {aviso && (
        <AccionDialog
          key={JSON.stringify(aviso)}
          titulo={
            aviso.tipo === 'resultado'
              ? 'Resultado'
              : aviso.tipo === 'trampa'
                ? `Dado de trampa: ${nombreEnMapa(aviso.clave)}`
                : aviso.tipo === 'atrezo'
                  ? `Revisar ${carta(mazos.atrezo, aviso.carta).titulo}`
                  : '¿Qué hay tras la puerta?'
          }
          onCerrar={() => siguienteAviso()}
        >
          {aviso.tipo === 'resultado' ? (
            <>
              <ol className="sucesos">
                <SucesoPartida suceso={zona.sucesos[aviso.suceso]} contexto={contexto} monstruos={monstruos} onVerCarta={onVerCarta} onVerTabla={setTabla} />
              </ol>
              <div className="fila-botones">
                <button type="button" className="button secondary" onClick={() => siguienteAviso()}>
                  Entendido
                </button>
              </div>
            </>
          ) : aviso.tipo === 'trampa' ? (
            <>
              <p className="nota">
                {nombreEnMapa(aviso.clave)} se ha movido y aquí nadie ha buscado trampas: tira el dado de trampa, una vez en
                su turno.
              </p>
              <div className="fila-botones">
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    const nueva = tiroTrampa(moverse(p, contexto), aviso.clave)
                    const tirada = nueva.zona.sucesos.at(-1)
                    // con la trampa activada se detiene y su turno acaba ahí: ya no revisa nada
                    const activada = tirada?.tipo === 'trampa' && tirada.carta !== undefined
                    setAvisosMapa({
                      zona: zona.id,
                      avisos: [
                        // la tirada se anota al final de los sucesos de la zona
                        { tipo: 'resultado', suceso: zona.sucesos.length },
                        ...avisosZona.filter((av) => av !== aviso && !(activada && av.tipo === 'atrezo')),
                      ],
                    })
                    hacer(() => nueva)
                  }}
                >
                  <Icono nombre="dado" />
                  Tirar dado de trampa ({p.dadoTrampa})
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => {
                    siguienteAviso()
                    hacer((a) => tiroTrampa(a, aviso.clave))
                  }}
                >
                  Ya tiró este turno
                </button>
              </div>
            </>
          ) : aviso.tipo === 'atrezo' ? (
            <>
              <p className="nota">
                {nombreEnMapa(aviso.clave)} está junto a {carta(mazos.atrezo, aviso.carta).titulo}: revisarlo es una acción
                gratuita.
              </p>
              <div className="fila-botones">
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    siguienteAviso({ tipo: 'resultado', suceso: zona.sucesos.length })
                    hacer((a) => tirarCarta(a, contexto, 'atrezo', aviso.carta))
                  }}
                >
                  <Icono nombre="dado" />
                  Revisar {carta(mazos.atrezo, aviso.carta).titulo}
                </button>
                <button type="button" className="button secondary" onClick={() => siguienteAviso()}>
                  Ahora no
                </button>
              </div>
            </>
          ) : (
            puertaDestino && (
              <>
                <p className="nota">¿Qué hay tras {puertaDestino.nombre.toLowerCase()}?</p>
                <div className="fila-botones">
                  <button
                    type="button"
                    className="button"
                    disabled={puertaDestino.id === 'nueva' && !p.caminos[0]?.length}
                    onClick={() => {
                      siguienteAviso()
                      if (anclajeDestino) hacer((a) => abrirPuerta(a, puertaDestino, 'sala', anclajeDestino))
                    }}
                  >
                    Una sala nueva
                  </button>
                  <button
                    type="button"
                    className="button"
                    onClick={() => {
                      siguienteAviso()
                      if (anclajeDestino) hacer((a) => abrirPuerta(a, puertaDestino, 'pasillo', anclajeDestino))
                    }}
                  >
                    Un pasillo nuevo
                  </button>
                  <button type="button" className="button secondary" onClick={() => siguienteAviso()}>
                    No cruzar
                  </button>
                </div>
              </>
            )
          )}
        </AccionDialog>
      )}
      {turnoAcabado && (
        <AccionDialog titulo="Turno terminado" onCerrar={() => setTurnoAcabado(null)}>
          {faltanPorTerminar.length ? (
            <>
              <p>
                {nombreEnMapa(turnoAcabado)} ya ha terminado su turno. Aún no han terminado:{' '}
                {faltanPorTerminar.map(nombreEnMapa).join(', ')}.
              </p>
              <div className="fila-botones">
                <button type="button" className="button secondary" onClick={() => setTurnoAcabado(null)}>
                  Entendido
                </button>
              </div>
            </>
          ) : (
            // solo con héroes y monstruos terminados se puede pasar al turno siguiente
            <>
              <p>Todos, héroes y monstruos, han terminado su turno. ¿Empezáis un turno nuevo?</p>
              <p className="nota">Quita las marcas y cada héroe vuelve a tirar el dado de trampa al moverse.</p>
              <div className="fila-botones">
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    setTurnoAcabado(null)
                    hacer(nuevoTurno)
                  }}
                >
                  Empezar un turno nuevo
                </button>
                <button type="button" className="button secondary" onClick={() => setTurnoAcabado(null)}>
                  Cancelar
                </button>
              </div>
            </>
          )}
        </AccionDialog>
      )}
    </>
  )
  const fichaDelGrupo = grupo.find((f) => f.clave === fichaMapa)
  const fichaEnMapa = fichaDelGrupo ?? enJuego.find((f) => f.clave === fichaMapa)
  const inventarioSubaccion = miembroEnSubaccion ? p.inventario?.[miembroEnSubaccion.clave] : undefined
  const equipoSubaccion = [...(inventarioSubaccion?.equipo ?? []), ...(inventarioSubaccion?.artefactos ?? [])]
  const busquedaEquipoAUsar = equipoAUsar.trim().toLocaleLowerCase('es')
  const sugerenciasEquipoAUsar = equipoSubaccion
    .map((id) => ({ id, nombre: nombreItem(equipo, id) }))
    .filter((item) => !busquedaEquipoAUsar || item.id.includes(busquedaEquipoAUsar) || item.nombre.toLocaleLowerCase('es').includes(busquedaEquipoAUsar))
    .slice(0, 8)
  const equipoSeleccionado = equipoSubaccion.find((id) => id === equipoAUsar || nombreItem(equipo, id) === equipoAUsar) ?? ''
  const encontradoSeleccionado = opcionesEquipoEncontrado.find((item) => item.id === equipoEncontrado || item.nombre === equipoEncontrado)?.id ?? ''
  const cartaTesoroRobado = tesoroRobado ? carta(mazos.tesoros, tesoroRobado.id) : undefined
  const sucesoResultado =
    resultadoAccion && 'suceso' in resultadoAccion && resultadoAccion.zona === zona.id ? zona.sucesos[resultadoAccion.suceso] : undefined
  const botinTesoroRobado = tesoroRobado ? botinDeTesoro(contexto, tesoroRobado.id) : undefined
  const botinActual = botinSuelo.find((b) => b.id === botinElegido?.id)
  const volverADialogoAcciones = () => {
    const clave = volverAccionesMiembro
    setVolverAccionesMiembro(null)
    if (clave) setMiembroAcciones(clave)
  }
  const cerrarAccionMiembro = () => {
    setAccionMiembro(null)
    volverADialogoAcciones()
  }
  const cerrarTiradaEfecto = () => {
    setTiradaEfecto(null)
    volverADialogoAcciones()
  }
  const cerrarAtaque = () => {
    setAtaque(null)
    volverADialogoAcciones()
  }
  const finalizarAccionMiembro = () => {
    setAccionMiembro(null)
    setVolverAccionesMiembro(null)
  }
  const resolverPaso = (siguiente: Paso) => {
    const nueva = avanzar(p, contexto)
    hacer(() => nueva)
    // la tirada en una tabla de monstruos se muestra con la tabla entera
    const tirada = nueva.zona.sucesos.findLast((s): s is TiradaEnTabla => s.tipo === 'encuentro' || s.tipo === 'errantes')
    if (tirada && (siguiente.tipo === 'encuentro' || siguiente.tipo === 'errantes')) setTabla(tirada)
  }
  // al entrar en una zona nueva: su tipo, con mapa su tamaño y después cada paso de la exploración con su
  // resultado, en popups; cerrarlos deja la secuencia en la página
  const enDescubrimiento = descubrimiento?.zona === zona.id ? descubrimiento : undefined
  const nuevosSucesos = enDescubrimiento?.resultado === undefined ? [] : zona.sucesos.slice(enDescubrimiento.resultado)
  const faseDescubrimiento =
    p.fin || enDescubrimiento?.cerrado
      ? undefined
      : !enDescubrimiento
        ? zona.pendientes.length
          ? 'tipo'
          : undefined
        : nuevosSucesos.length
          ? 'resultado'
          : usarMapa && zona.tipo !== 'inicial' && !zona.rejilla?.fija
            ? 'tamano'
            : paso
              ? 'paso'
              : undefined
  const continuarDescubrimiento = () => setDescubrimiento({ zona: zona.id })
  const cerrarDescubrimiento = () => setDescubrimiento({ zona: zona.id, cerrado: true })
  const hacerPaso = (accionPaso: () => void) => {
    setDescubrimiento({ zona: zona.id, resultado: zona.sucesos.length })
    accionPaso()
  }

  return (
    <>
      <PageHeader title="En juego" backTo={`/aventuras/${aventura.id}`}>
        <span className="partida-cabecera">
          <button type="button" className="icon-button" onClick={() => setExportar(true)} aria-label="Exportar aventura">
            <Icono nombre="exportar" />
          </button>
          <button type="button" className="icon-button" onClick={() => setVerReglas(true)} aria-label="Reglas de la misión">
            <Icono nombre="pergamino" />
          </button>
          <button type="button" className="icon-button" onClick={deshacer} disabled={!puedeDeshacer} aria-label="Deshacer">
            <Icono nombre="deshacer" />
          </button>
        </span>
      </PageHeader>
      <p className="configurar-mision">{mision.titulo}</p>

      <div className={usarMapa ? 'partida con-mapa' : enJuego.length ? 'partida con-monstruos' : 'partida'}>
        {!usarMapa && (
          <BarraFichas
            etiqueta="Grupo"
            className="partida-grupo"
            fichas={grupo}
            bando="grupo"
            onAtacar={(atacante, defensor) => setAtaque({ atacante, defensor })}
            onVida={vidaGrupo}
          />
        )}

        <div className="partida-centro">
          <dl className="marcador boceto">
            <div>
              <dt>Peligro</dt>
              <dd className="contador">
                <button type="button" className="icon-button" aria-label="Bajar el peligro" disabled={p.peligro <= 0} onClick={() => hacer((a) => cambiarPeligro(a, -1))}>
                  <Icono nombre="menos" />
                </button>
                <span>{p.peligro}</span>
                <button type="button" className="icon-button" aria-label="Subir el peligro" onClick={() => hacer((a) => cambiarPeligro(a, 1))}>
                  <Icono nombre="mas" />
                </button>
              </dd>
            </div>
            <div>
              <dt>Trampas</dt>
              <dd>{p.dadoTrampa}</dd>
            </div>
            <div>
              <dt>{modo === 'losetas' ? 'Mazmorra' : 'Salas'}</dt>
              <dd>{p.caminos.map((c) => c.length).filter(Boolean).join(' · ') || 0}</dd>
            </div>
            {p.mazos.tesoros && (
              <div>
                <dt>Tesoros</dt>
                <dd>{p.mazos.tesoros.length}</dd>
              </div>
            )}
            {p.mazos.sucesos && (
              <div>
                <dt>Sucesos</dt>
                <dd>{p.mazos.sucesos.length}</dd>
              </div>
            )}
            <div>
              <dt>
                <label htmlFor="hay-monstruos">Monstruos</label>
              </dt>
              <dd>
                <input
                  id="hay-monstruos"
                  type="checkbox"
                  checked={p.hayMonstruos}
                  onChange={() => hacer((a) => (a.hayMonstruos ? sinMonstruos(a) : { ...a, hayMonstruos: true }))}
                />
              </dd>
            </div>
            {contador?.tipo === 'contador-muerte' && (
              <div>
                <dt>PNJ</dt>
                <dd>
                  {p.contadorMuerte}/{contador.maximo}
                </dd>
              </div>
            )}
          </dl>

          {contador?.tipo === 'contador-muerte' && p.contadorMuerte >= contador.maximo && (
            <p className="aviso-partida">{contador.alCompletar}</p>
          )}

          {mapa.length > 1 && (
            <details className="mapa">
              <summary>Mazmorra explorada: {mapa.length} secciones</summary>
              <ol>
                {mapa.map((z) => (
                  <li key={z.id} className={z.id === zona.id ? 'aqui' : undefined}>
                    {nombreZona(z)}
                    {z.id === zona.id && ' · estáis aquí'}
                    {porExplorar(z) > 0 && ` · ${porExplorar(z)} ${porExplorar(z) === 1 ? 'puerta' : 'puertas'} sin explorar`}
                  </li>
                ))}
              </ol>
            </details>
          )}

          <section className="zona" aria-labelledby="zona-titulo">
            <p className="zona-etiqueta">Dónde estáis</p>
            <h2 id="zona-titulo">{nombreZona(zona)}</h2>
            {padre && <p className="nota">Entrasteis desde {nombreZona(padre)}.</p>}

            {zona.tipo === 'inicial' && (
              <>
                <p>{SALA_INICIAL}</p>
                {pnjAlInicio && <p>El PNJ de la misión os acompaña desde el principio.</p>}
              </>
            )}
            {zona.tipo === 'secreta' && (
              <p>
                Coloca una loseta mediana o pequeña sin puertas. No se roba carta de mazmorra ni se tira en la tabla de
                encuentros, y aquí no se pueden buscar más puertas secretas.
              </p>
            )}
            {zona.tipo !== 'inicial' && zona.tipo !== 'secreta' && (
              <p className="nota">
                Quien abrió la puerta está en la primera casilla y decide dónde colocar la loseta, las puertas (cerradas y
                centradas en muros sin puerta) y el contenido.
              </p>
            )}
            {zona.tipo === 'objetivo' && (
              <div className="objetivo">
                <p>
                  <strong>Jefe Final:</strong> {mision.jefe} ({mision.tipoJefe})
                  {pcJefe !== undefined && `, ${pcJefe} PC más el rango más alto del grupo`}.
                </p>
                <p>
                  <strong>Monstruos errantes:</strong> {heroes} {errante ? (monstruos[errante.monstruo]?.nombre ?? mision.faccion.errante) : mision.faccion.errante}
                  , uno por héroe.
                </p>
                <p>
                  <strong>Además:</strong> un cofre y atrezo si hay espacio. Aquí no se tira el dado de trampa.
                </p>
                <p className="nota">{mision.salaObjetivo}</p>
              </div>
            )}
            {reglas.map((texto) => (
              <p key={texto} className="regla-mision">
                <strong>Regla de la misión:</strong> {texto}{' '}
                <button type="button" className="enlace" onClick={() => setVerReglas(true)}>
                  Ver completa
                </button>
              </p>
            ))}

            {zona.sucesos.length > 0 && (
              <ol className="sucesos">
                {zona.sucesos.map((s, i) => (
                  <SucesoPartida key={i} suceso={s} contexto={contexto} monstruos={monstruos} onVerCarta={onVerCarta} onVerTabla={setTabla} />
                ))}
              </ol>
            )}

            {botinSuelo.length > 0 && (
              <section className="botin-suelo">
                <h3>En el suelo</h3>
                <ul className="recuento">
                  {botinSuelo.map((botin) => (
                    <li key={botin.id}>
                      <span>{nombreBotin(equipo, botin)}</span>
                      <span className="fila-botones compacta">
                        <button type="button" className="button mini" onClick={() => setBotinElegido({ id: botin.id, clave: miembros[0]?.clave ?? '' })}>
                          Coger
                        </button>
                        <button type="button" className="button mini secondary" onClick={() => hacer((a) => consumirBotinSuelo(a, botin.id))}>
                          Consumir
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {paso && !p.fin && (
              <div className="paso-siguiente">
                <p className="zona-etiqueta">Ahora</p>
                <p>{explicarPaso(paso, p.dadoTrampa, p.peligro)[1]}</p>
                {paso.tipo === 'elegir-atrezo' ? (
                  <div className="fila-botones">
                    {[...new Set(paso.cartas)].map((id) => (
                      <button key={id} type="button" className="button" onClick={() => hacer((a) => elegirAtrezo(a, id))}>
                        {carta(mazos.atrezo, id).titulo}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button type="button" className="button" onClick={() => resolverPaso(paso)}>
                    <Icono nombre="dado" />
                    {explicarPaso(paso, p.dadoTrampa, p.peligro)[0]}
                  </button>
                )}
              </div>
            )}
          </section>

          {p.fin ? (
            <section className="zona fin-partida">
              <h2>{FIN[p.fin].titulo}</h2>
              <p>{FIN[p.fin].texto}</p>
              {p.fin === 'cumplida' && (
                <>
                  <p>
                    <strong>Recompensa:</strong> {mision.recompensa} mo a repartir.
                  </p>
                  <p className="mision-narrativa">{mision.epilogo}</p>
                </>
              )}
              <p className="nota">Si os habéis equivocado, podéis deshacer.</p>
            </section>
          ) : paso ? (
            // con un paso pendiente no hay acciones, pero el mapa sigue bajo los sucesos
            mapaZona
          ) : (
              <section className="acciones" aria-labelledby="acciones-titulo">
                <h2 id="acciones-titulo">Qué podéis hacer</h2>

                {mapaZona || <div className="acciones-heroes" aria-label="Acciones por héroe">
                  {miembros.map((m) => {
                    const ficha = grupo.find((f) => f.clave === m.clave)
                    const nombre = nombreMiembro(m)
                    const puedeActuar = (p.vidas[m.clave] ?? m.cuerpo) > 0
                    const vtt = 'heroe' in m ? urlFichaVtt('heroes', m.heroe.id, m.sexo, 'vtt-heroe') : undefined
                    return (
                      <button
                        key={m.clave}
                        type="button"
                        className={puedeActuar ? 'acciones-heroe' : 'acciones-heroe caido'}
                        disabled={!puedeActuar}
                        onClick={() => setMiembroAcciones(m.clave)}
                      >
                        <span className="acciones-heroe-cabecera">
                          {vtt ? (
                            <img className="miembro-vtt" src={vtt} alt="" />
                          ) : ficha?.retrato ? (
                            <img src={ficha.retrato} alt="" />
                          ) : (
                            <span className="miembro-iniciales">{nombre.slice(0, 2)}</span>
                          )}
                          <strong>{nombre}</strong>
                        </span>
                      </button>
                    )
                  })}
                </div>}

                {p.hayMonstruos && zona.tipo !== 'inicial' && (
                  <p className="aviso-partida">
                    Hay monstruos a la vista: repartid las cartas de iniciativa. En su turno, activadlos como lo haría el
                    Malvado Brujo.
                  </p>
                )}

                <div className="grupo-acciones">
                  {!zona.sinPuertas && (
                    <p className="nota">Quien abre una puerta entra de inmediato y se detiene en la primera casilla.</p>
                  )}
                  {zona.sinPuertas && (
                    <p className="nota">
                      Sin puertas: solo podéis volver por la entrada{zona.tipo === 'secreta' ? '' : ' o buscar una puerta secreta'}.
                    </p>
                  )}
                  {modo === 'tablero' && !zona.sinPuertas && (
                    <div className="fila-botones">
                      <button
                        type="button"
                        className="button"
                        disabled={!p.caminos[0]?.length}
                        onClick={() => hacer((a) => entrar(a, contexto, { seccion: 'sala' }))}
                      >
                        Avanzar a una sala nueva
                      </button>
                      <button type="button" className="button" onClick={() => hacer((a) => entrar(a, contexto, { seccion: 'pasillo' }))}>
                        Avanzar a un pasillo nuevo
                      </button>
                    </div>
                  )}
                  {zona.salidas.map((salida, i) => {
                    const destino = salida.destino === undefined ? undefined : seccion(salida.destino)
                    const puerta = salida.secreta
                      ? 'la puerta secreta'
                      : modo === 'tablero' || zona.salidas.length === 1
                        ? 'la puerta'
                        : `la puerta ${i + 1}`
                    const sinSalida = !destino && !p.caminos[salida.camino ?? -1]?.length
                    return (
                      <button
                        key={i}
                        type="button"
                        className={destino ? 'button secondary' : 'button'}
                        disabled={sinSalida}
                        onClick={() => hacer((a) => entrar(a, contexto, { puerta: i }))}
                      >
                        Avanzar por {puerta}
                        {destino ? ` (a ${nombreZona(destino)})` : sinSalida ? ' · sin salida' : ' · sin explorar'}
                      </button>
                    )
                  })}
                  {padre && (
                    <button type="button" className="button secondary" onClick={() => hacer(volver)}>
                      Volver por la entrada (a {nombreZona(padre)})
                    </button>
                  )}
                  {zona.puertaSecreta &&
                    (modo === 'losetas' ? (
                      <button type="button" className="button secondary" onClick={() => hacer((a) => entrarPorPuertaSecreta(a, contexto))}>
                        Abrir la puerta secreta
                      </button>
                    ) : (
                      <div className="fila-botones">
                        <button type="button" className="button secondary" onClick={() => hacer((a) => entrarPorPuertaSecreta(a, contexto, 'sala'))}>
                          Puerta secreta a una sala
                        </button>
                        <button type="button" className="button secondary" onClick={() => hacer((a) => entrarPorPuertaSecreta(a, contexto, 'pasillo'))}>
                          Puerta secreta a un pasillo
                        </button>
                      </div>
                    ))}
                  {modo === 'losetas' ? (
                    <div className="editar-puertas">
                      <span>
                        Puertas de esta sección
                        <span className="nota">Ajústalas si una regla especial pone o quita puertas.</span>
                      </span>
                      <span className="contador">
                        <button
                          type="button"
                          className="icon-button"
                          aria-label="Quitar una puerta"
                          disabled={!zona.salidas.some((s) => s.destino === undefined && !s.secreta)}
                          onClick={() => hacer(quitarPuerta)}
                        >
                          <Icono nombre="menos" />
                        </button>
                        <span>{puertas(zona).length}</span>
                        <button type="button" className="icon-button" aria-label="Añadir una puerta" onClick={() => hacer(anadirPuerta)}>
                          <Icono nombre="mas" />
                        </button>
                      </span>
                    </div>
                  ) : (
                    <label className="editar-puertas">
                      <span>
                        Sección sin puertas
                        <span className="nota">Márcalo si una regla especial quita las puertas.</span>
                      </span>
                      <input type="checkbox" checked={Boolean(zona.sinPuertas)} onChange={() => hacer((a) => cambiarSinPuertas(a, !a.zona.sinPuertas))} />
                    </label>
                  )}
                  {modo === 'losetas' && p.caminos.every((c) => !c.length) && !zona.puertaSecreta && (
                    <p className="nota">
                      No quedan cartas de mazmorra: buscad puertas secretas o volved sobre vuestros pasos.
                    </p>
                  )}
                </div>

                {zona.tipo !== 'inicial' && (
                  <>
                    {(!movimientoFijo || puedeCaerEnTrampa(zona)) && (
                      <div className="grupo-acciones">
                        <p className="nota">
                          {movimientoFijo ? '' : `Cada héroe tira ${DADOS_MOVIMIENTO} al moverse en su turno. `}
                          {puedeCaerEnTrampa(zona) &&
                            'Aquí nadie ha buscado trampas: quien se mueva tira el dado de trampa una vez en su turno.'}
                        </p>
                        <div className="fila-botones">
                          <button type="button" className="button secondary" onClick={() => hacer((a) => moverse(a, contexto, !movimientoFijo))}>
                            {movimientoFijo ? `Dado de trampa al moverse (${p.dadoTrampa})` : `Moverse (${DADOS_MOVIMIENTO})`}
                          </button>
                        </div>
                      </div>
                    )}

                    {puedeBuscarPuertas(zona) && !p.hayMonstruos && (
                      <div className="grupo-acciones">
                        <p className="nota">Buscar puertas secretas: 1D6 por cada pared sin puertas. Con un 6, la encontráis.</p>
                        <div className="fila-botones">
                          {[1, 2, 3, 4].map((n) => (
                            <button key={n} type="button" className="button secondary" onClick={() => hacer((a) => buscarPuertasSecretas(a, n))}>
                              {n} {n === 1 ? 'pared' : 'paredes'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {tiradas.length > 0 && !p.hayMonstruos && (
                      <div className="grupo-acciones">
                        <p className="nota">Revisar un mueble es una acción gratuita junto a él.</p>
                        <div className="fila-botones">
                          {tiradas.map(({ mazo, id }) => {
                            const c = carta(mazos[mazo], id)
                            return (
                              <button key={id} type="button" className="button secondary" onClick={() => hacer((a) => tirarCarta(a, contexto, mazo, id))}>
                                {mazo === 'atrezo' ? `Revisar ${c.titulo}` : (c.tirada?.accion ?? c.titulo)}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {zona.tipo !== 'pasillo' && (
                      <div className="grupo-acciones">
                        <p className="nota">Si la sala o una regla especial pide monstruos de una categoría.</p>
                        <button type="button" className="button secondary" onClick={() => setAnadirMonstruos(true)}>
                          <Icono nombre="dado" />
                          Añadir monstruos
                        </button>
                      </div>
                    )}

                    <div className="grupo-acciones">
                      {p.hayMonstruos ? (
                        <button type="button" className="button secondary" onClick={() => hacer(sinMonstruos)}>
                          Ya no quedan monstruos
                        </button>
                      ) : (
                        <>
                          <p className="nota">Sin monstruos a la vista, en su turno el Malvado Brujo hace la tirada de peligro.</p>
                          <button type="button" className="button secondary" onClick={() => hacer((a) => turnoBrujo(a, contexto))}>
                            Turno del Malvado Brujo
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}

                <details className="terminar">
                  <summary>Terminar la partida</summary>
                  <div className="fila-botones">
                    {(Object.keys(FIN) as FinPartida[]).map((fin) => (
                      <button key={fin} type="button" className="button secondary" onClick={() => setTerminar(fin)}>
                        {FIN[fin].accion}
                      </button>
                    ))}
                  </div>
                </details>
              </section>
          )}
        </div>

        {!usarMapa && enJuego.length > 0 && (
          <BarraFichas
            etiqueta="Monstruos en juego"
            className="partida-monstruos"
            fichas={enJuego}
            bando="monstruos"
            onAtacar={(atacante, defensor) => setAtaque({ atacante, defensor })}
            onVida={vidaMonstruo}
            nota="A 0 PC el monstruo muere y sale de la barra."
          />
        )}
      </div>

      {fichaEnMapa && (
        <FichaDialog
          key={fichaEnMapa.clave}
          ficha={fichaEnMapa}
          onVida={fichaDelGrupo ? vidaGrupo : vidaMonstruo}
          nota={fichaDelGrupo ? undefined : 'A 0 PC el monstruo muere y sale del mapa.'}
          turno={{ terminado: haTerminado(p, fichaEnMapa.clave), onTerminar: () => hacer((a) => terminarTurno(a, fichaEnMapa.clave)) }}
          onAtacar={(atacante) => setAtaque({ atacante })}
          onCerrar={() => setFichaMapa(null)}
        />
      )}

      {miembroEnAcciones && (
        <AccionDialog
          titulo={`Acciones de ${nombreMiembro(miembroEnAcciones)}`}
          onCerrar={() => {
            setVolverAccionesMiembro(null)
            setMiembroAcciones(null)
          }}
        >
          {(() => {
            const puedeActuar = (p.vidas[miembroEnAcciones.clave] ?? miembroEnAcciones.cuerpo) > 0
            const puedeCogerCartaTesoro = zona.tipo !== 'inicial' && zona.tipo !== 'pasillo' && Boolean(p.mazos.tesoros?.length)
            const inv = p.inventario?.[miembroEnAcciones.clave]
            const equipoDisponible = [...(inv?.equipo ?? []), ...(inv?.artefactos ?? [])]
            return (
              <div className="acciones-dialogo acciones-rueda">
                <button
                  type="button"
                  className="button"
                  disabled={!puedeActuar}
                  onClick={() => {
                    setVolverAccionesMiembro(miembroEnAcciones.clave)
                    setAtaque({ atacante: miembroEnAcciones.clave })
                    setMiembroAcciones(null)
                  }}
                >
                  Atacar
                </button>
                <button
                  type="button"
                  className="button secondary"
                  disabled={!puedeActuar}
                  onClick={() => {
                    setVolverAccionesMiembro(miembroEnAcciones.clave)
                    setTiradaEfecto({ clave: miembroEnAcciones.clave, cantidad: 1, dado: 'D6' })
                    setMiembroAcciones(null)
                  }}
                >
                  <Icono nombre="dado" />
                  Tirar dados para efecto
                </button>
                <button
                  type="button"
                  className="button secondary"
                  disabled={!puedeActuar || (!p.hayMonstruos && !puedeCaerEnTrampa(zona))}
                  onClick={() => {
                    if (p.hayMonstruos) {
                      setAvisoAccion(AVISO_MONSTRUOS_ACTIVOS)
                      return
                    }
                    buscarTrampasCon(miembroEnAcciones.clave, nombreMiembro(miembroEnAcciones))
                    setMiembroAcciones(null)
                  }}
                >
                  Buscar trampas
                </button>
                <button
                  type="button"
                  className="button secondary"
                  disabled={!puedeActuar || (!p.hayMonstruos && !puedeCogerCartaTesoro)}
                  onClick={() => {
                    if (p.hayMonstruos) {
                      setAvisoAccion(AVISO_MONSTRUOS_ACTIVOS)
                      return
                    }
                    robarTesoroPara(miembroEnAcciones.clave)
                    setMiembroAcciones(null)
                  }}
                >
                  Coger carta de tesoro
                </button>
                <button
                  type="button"
                  className="button secondary"
                  disabled={!puedeActuar || !equipoDisponible.length}
                  onClick={() => {
                    setVolverAccionesMiembro(miembroEnAcciones.clave)
                    setEquipoAUsar(equipoDisponible[0] ? nombreItem(equipo, equipoDisponible[0]) : '')
                    setAccionMiembro({ clave: miembroEnAcciones.clave, tipo: 'equipo' })
                    setMiembroAcciones(null)
                  }}
                >
                  Consumir equipo
                </button>
                <button
                  type="button"
                  className="button secondary"
                  disabled={!puedeActuar || !opcionesEquipoEncontrado.length}
                  onClick={() => {
                    setVolverAccionesMiembro(miembroEnAcciones.clave)
                    setEquipoEncontrado(opcionesEquipoEncontrado[0]?.id || '')
                    setAccionMiembro({ clave: miembroEnAcciones.clave, tipo: 'encontrado' })
                    setMiembroAcciones(null)
                  }}
                >
                  Coger equipo específico
                </button>
              </div>
            )
          })()}
        </AccionDialog>
      )}

      {avisoAccion && (
        <AccionDialog titulo="Acción no disponible" onCerrar={() => setAvisoAccion(null)}>
          <div className="acciones-dialogo">
            <p className="aviso-partida">{avisoAccion}</p>
            <button type="button" className="button" onClick={() => setAvisoAccion(null)}>
              Entendido
            </button>
          </div>
        </AccionDialog>
      )}

      {miembroEnSubaccion && accionMiembro?.tipo === 'equipo' && (
        <AccionDialog titulo={`Consumir equipo: ${nombreMiembro(miembroEnSubaccion)}`} onCerrar={cerrarAccionMiembro}>
          <div className="acciones-dialogo">
            <label className="campo equipo-buscador">
              <span>Equipo</span>
              <input type="search" value={equipoAUsar} onChange={(e) => setEquipoAUsar(e.target.value)} placeholder="Busca en su inventario…" autoComplete="off" />
            </label>
            <div className="equipo-sugerencias" role="listbox" aria-label="Equipo del personaje">
              {sugerenciasEquipoAUsar.map((item, i) => (
                <button
                  key={`${item.id}-${i}`}
                  type="button"
                  className={item.id === equipoSeleccionado ? 'equipo-opcion elegida' : 'equipo-opcion'}
                  onClick={() => setEquipoAUsar(item.nombre)}
                >
                  <strong>{item.nombre}</strong>
                  <span>{item.id}</span>
                </button>
              ))}
              {!sugerenciasEquipoAUsar.length && <p className="nota">No hay equipo que coincida con esa búsqueda.</p>}
            </div>
            <button
              type="button"
              className="button"
              disabled={!equipoSeleccionado}
              onClick={() => {
                hacer((a) => perderEquipo(a, miembroEnSubaccion.clave, equipoSeleccionado))
                finalizarAccionMiembro()
              }}
            >
              Consumir equipo
            </button>
          </div>
        </AccionDialog>
      )}

      {tesoroRobado && cartaTesoroRobado && (
        <AccionDialog titulo={`Tesoro: ${cartaTesoroRobado.titulo}`} onCerrar={() => setTesoroRobado(null)}>
          <div className="acciones-dialogo tesoro-robado">
            <Carta mazo="tesoros" carta={cartaTesoroRobado} variante="completa" />
            <div className="fila-botones">
              {cartaTesoroRobado.suceso && (
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    const [suceso, nueva] = robarSucesoDeTesoro(p)
                    hacer(() => nueva)
                    setTesoroRobado(null)
                    if (suceso) setVerCarta({ mazo: 'sucesos', id: suceso })
                  }}
                >
                  Mostrar suceso
                </button>
              )}
              {botinTesoroRobado && (
                <>
                  <button
                    type="button"
                    className="button"
                    onClick={() => {
                      hacer((a) => cargarTesoroEnInventario(a, contexto, tesoroRobado.clave, tesoroRobado.id))
                      setTesoroRobado(null)
                    }}
                  >
                    Cargar en inventario
                  </button>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => {
                      hacer((a) => dejarTesoroEnSuelo(a, contexto, tesoroRobado.id))
                      setTesoroRobado(null)
                    }}
                  >
                    Dejar en el suelo
                  </button>
                </>
              )}
              {!cartaTesoroRobado.suceso && !botinTesoroRobado && (
                <button type="button" className="button" onClick={() => setTesoroRobado(null)}>
                  Resuelto
                </button>
              )}
            </div>
          </div>
        </AccionDialog>
      )}

      {botinActual && botinElegido && (
        <AccionDialog titulo={`Coger ${nombreBotin(equipo, botinActual)}`} onCerrar={() => setBotinElegido(null)}>
          <div className="acciones-dialogo">
            <label>
              <span>Personaje</span>
              <select value={botinElegido.clave} onChange={(e) => setBotinElegido({ ...botinElegido, clave: e.target.value })}>
                {miembros.map((m) => (
                  <option key={m.clave} value={m.clave}>
                    {nombreMiembro(m)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="button"
              disabled={!botinElegido.clave}
              onClick={() => {
                hacer((a) => cogerBotinSuelo(a, botinElegido.clave, botinElegido.id))
                setBotinElegido(null)
              }}
            >
              Añadir al inventario
            </button>
          </div>
        </AccionDialog>
      )}

      {miembroEnSubaccion && accionMiembro?.tipo === 'encontrado' && (
        <AccionDialog titulo={`Equipo encontrado: ${nombreMiembro(miembroEnSubaccion)}`} onCerrar={cerrarAccionMiembro}>
          <div className="acciones-dialogo">
            <label className="campo equipo-buscador">
              <span>Equipo</span>
              <input type="search" value={equipoEncontrado} onChange={(e) => setEquipoEncontrado(e.target.value)} placeholder="Poción, espada, pergamino…" autoComplete="off" />
            </label>
            <div className="equipo-sugerencias" role="listbox" aria-label="Equipo disponible">
              {sugerenciasEquipoEncontrado.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={item.id === encontradoSeleccionado ? 'equipo-opcion elegida' : 'equipo-opcion'}
                  onClick={() => setEquipoEncontrado(item.nombre)}
                >
                  <strong>{item.nombre}</strong>
                  <span>{item.tipo ?? 'tesoro'} · {item.id}</span>
                </button>
              ))}
              {!sugerenciasEquipoEncontrado.length && <p className="nota">No hay equipo que coincida con esa búsqueda.</p>}
            </div>
            <button
              type="button"
              className="button"
              disabled={!encontradoSeleccionado}
              onClick={() => {
                const item = opcionesEquipoEncontrado.find((item) => item.id === encontradoSeleccionado)
                if (item) hacer((a) => anadirItem(a, miembroEnSubaccion.clave, item.id, item.tipo))
                finalizarAccionMiembro()
              }}
            >
              Anotar en inventario
            </button>
          </div>
        </AccionDialog>
      )}

      {miembroEnTirada && tiradaEfecto && (
        <AccionDialog titulo={`Tirada de efecto: ${nombreEnMapa(miembroEnTirada.clave)}`} onCerrar={cerrarTiradaEfecto}>
          <div className="acciones-dialogo tirada-efecto">
            <label>
              <span>Cantidad</span>
              <select
                value={tiradaEfecto.cantidad}
                onChange={(e) => setTiradaEfecto({ ...tiradaEfecto, cantidad: Number(e.target.value) })}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Tipo de dado</span>
              <select value={tiradaEfecto.dado} onChange={(e) => setTiradaEfecto({ ...tiradaEfecto, dado: e.target.value as DadoEfecto })}>
                {DADOS_EFECTO.map((dado) => (
                  <option key={dado} value={dado}>
                    {dado === 'DC' ? 'Dado de combate' : dado}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="button"
              onClick={() => {
                const resultado = Array.from({ length: tiradaEfecto.cantidad }, () => {
                  const valor = entre(1, carasDado(tiradaEfecto.dado))
                  return tiradaEfecto.dado === 'DC' ? caraDC(valor) : String(valor)
                })
                const total = tiradaEfecto.dado === 'DC' ? '' : ` = ${resultado.reduce((suma, valor) => suma + Number(valor), 0)}`
                // el resultado, en su propio popup encima de la ficha
                setResultadoAccion({ titulo: `Tirada de efecto: ${nombreEnMapa(tiradaEfecto.clave)}`, texto: `${resultado.join(' · ')}${total}` })
                cerrarTiradaEfecto()
              }}
            >
              <Icono nombre="dado" />
              Tirar
            </button>
          </div>
        </AccionDialog>
      )}

      {verCarta && (
        <CartaDialog
          mazo={verCarta.mazo}
          carta={carta(mazos[verCarta.mazo], verCarta.id)}
          onCerrar={() => setVerCarta(null)}
        />
      )}
      {atacante && (
        <CombateDialog
          atacante={atacante}
          defensor={participante(ataque?.defensor)}
          enemigos={participantes.filter((x) => x.bando !== atacante.bando && (x.bando === 'monstruos' || (p.vidas[x.clave] ?? 1) > 0))}
          reglas={reglasCombate}
          onUsarRegla={(clave, regla) => {
            if (regla.origenId === 'pocima-de-batalla') hacer((a) => usarPocion(a, clave, regla.origenId))
            else if (regla.tipo !== 'repetir-dados' || regla.origenId !== 'cimitarra') hacer((a) => descargarRegla(a, clave, regla))
          }}
          onAplicar={(c) =>
            hacer((a) =>
              accion(
                aplicarCombate(
                  a,
                  c.atacante.nombre,
                  c.defensor.nombre,
                  perdidas(c).map((x) => ({
                    ...x,
                    monstruo: participante(x.clave)?.bando === 'monstruos',
                    cuerpo: grupo.find((f) => f.clave === x.clave)?.cuerpo ?? 0,
                  })),
                  recuentoRecarga(c),
                ),
                c.atacante.clave,
              ),
            )
          }
          onCerrar={cerrarAtaque}
        />
      )}
      {resultadoAccion && ('texto' in resultadoAccion || sucesoResultado) && (
        <AccionDialog titulo={resultadoAccion.titulo} onCerrar={() => setResultadoAccion(null)}>
          {'texto' in resultadoAccion ? (
            <p className="tirada-efecto-resultado">
              Resultado: <strong>{resultadoAccion.texto}</strong>
            </p>
          ) : (
            sucesoResultado && (
              <ol className="sucesos">
                <SucesoPartida suceso={sucesoResultado} contexto={contexto} monstruos={monstruos} onVerCarta={onVerCarta} onVerTabla={setTabla} />
              </ol>
            )
          )}
          <div className="fila-botones">
            <button type="button" className="button" onClick={() => setResultadoAccion(null)}>
              Entendido
            </button>
          </div>
        </AccionDialog>
      )}
      {faseDescubrimiento === 'tamano' ? (
        <TamanoDialog
          titulo={`${nombreZona(zona)}: tamaño`}
          inicial={rejillaDe(zona)}
          onFijar={(columnas, filas) => {
            // con su tamaño definitivo, la sala se vuelve a pegar a la puerta por la que se entró
            hacer((a) => situar(conRejilla(a, (r) => fijarTamano(r, columnas, filas)), true))
            continuarDescubrimiento()
          }}
          onCerrar={cerrarDescubrimiento}
        />
      ) : (
        faseDescubrimiento && (
          <AccionDialog key={`${faseDescubrimiento}-${zona.sucesos.length}`} titulo={nombreZona(zona)} onCerrar={cerrarDescubrimiento}>
            {faseDescubrimiento === 'paso' && paso ? (
              <>
                <p>{explicarPaso(paso, p.dadoTrampa, p.peligro)[1]}</p>
                <div className="fila-botones">
                  {paso.tipo === 'elegir-atrezo' ? (
                    [...new Set(paso.cartas)].map((id) => (
                      <button key={id} type="button" className="button" onClick={() => hacerPaso(() => hacer((a) => elegirAtrezo(a, id)))}>
                        {carta(mazos.atrezo, id).titulo}
                      </button>
                    ))
                  ) : (
                    <button type="button" className="button" onClick={() => hacerPaso(() => resolverPaso(paso))}>
                      <Icono nombre="dado" />
                      {explicarPaso(paso, p.dadoTrampa, p.peligro)[0]}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <ol className="sucesos">
                  {(faseDescubrimiento === 'tipo' ? zona.sucesos : nuevosSucesos).map((s, i) => (
                    <SucesoPartida key={i} suceso={s} contexto={contexto} monstruos={monstruos} onVerCarta={onVerCarta} onVerTabla={setTabla} />
                  ))}
                </ol>
                <div className="fila-botones">
                  <button type="button" className="button" onClick={continuarDescubrimiento}>
                    Continuar
                  </button>
                </div>
              </>
            )}
          </AccionDialog>
        )
      )}
      {exportar && <ExportarDialog mision={mision} onCerrar={() => setExportar(false)} />}
      {anadirMonstruos && (
        <MonstruosDialog
          contexto={contexto}
          onAnadir={(monstruo, avanzado) => hacer((a) => anadirMonstruo(a, contexto, monstruo, avanzado))}
          onTirar={(categoria, cantidad) => {
            const nueva = monstruosAlAzar(p, contexto, categoria, cantidad)
            hacer(() => nueva)
            const tirada = nueva.zona.sucesos.at(-1)
            if (tirada?.tipo === 'azar') setTabla(tirada)
          }}
          onCerrar={() => setAnadirMonstruos(false)}
        />
      )}
      {tabla && <TablaTiradaDialog tirada={tabla} contexto={contexto} monstruos={monstruos} onCerrar={() => setTabla(null)} />}
      {verReglas && <ReglasMisionDialog mision={mision} onCerrar={() => setVerReglas(false)} />}
      {terminar && (
        <ConfirmarDialog
          titulo={FIN[terminar].accion}
          accion="Terminar"
          onConfirmar={() => {
            hacer((a) => ({ ...a, fin: terminar }))
            registrarEvento('Aventuras', 'Terminar partida', terminar)
          }}
          onCerrar={() => setTerminar(null)}
        >
          {FIN[terminar].texto}
        </ConfirmarDialog>
      )}
    </>
  )
}
