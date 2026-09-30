import { useId, useRef, useState, type PointerEvent } from 'react'
import { sitiosDeBotones } from './corona'
import {
  alcance,
  costeDe,
  costesDe,
  enElMapa,
  escuadraActiva,
  escuadrasDe,
  estanciaEn,
  estanciasDe,
  evaluarRecorrido,
  ruta,
  type Accion,
  type Activacion,
  type Casilla,
  type Estancia,
  type Escuadra,
  type Heroe,
  type Mapa,
  type MedicionMovimiento,
  type ModoActivacion,
  type OpcionesMovimiento,
  type Puerta,
  type RecorridoEvaluado,
  numeroDeTurno,
  turnoDeEscuadra,
} from '../gamemap'

/** Lado de una casilla en unidades del SVG */
const LADO = 32

/** Grosor de una puerta y margen para que las del muro exterior no se corten */
const GROSOR = 8

/** Largo de una puerta respecto al lado de la casilla */
const LARGO = 0.7

/** Puerta sobre la línea del muro, centrada en la arista de su casilla (`origen`: esquina de su estancia) */
function PuertaEnMuro({ puerta: { casilla, lado, tipo, id, abierta, destino }, origen }: { puerta: Puerta; origen: Casilla }) {
  const x = (origen.x + casilla.x) * LADO
  const y = (origen.y + casilla.y) * LADO
  const hueco = (LADO * (1 - LARGO)) / 2
  const horizontal = lado === 'arriba' || lado === 'abajo'
  const linea = { arriba: y, abajo: y + LADO, izquierda: x, derecha: x + LADO }[lado] - GROSOR / 2
  return (
    <rect
      className={`vista-puerta ${tipo}${abierta ? ' abierta' : ''}`}
      x={horizontal ? x + hueco : linea}
      y={horizontal ? linea : y + hueco}
      width={horizontal ? LADO * LARGO : GROSOR}
      height={horizontal ? GROSOR : LADO * LARGO}
    >
      <title>{abierta ? `${id}: abierta hacia ${destino}` : id}</title>
    </rect>
  )
}

const INICIAL_MODO = { normal: 'N', agresivo: 'A', sigiloso: 'S' }

type PropsFicha = { ficha: Heroe; x: number; y: number; activacion?: Activacion; ultimoModo?: ModoActivacion }

/** Texto del badge al pasar el puntero */
function estadoBadge(activacion?: Activacion, ultimoModo?: ModoActivacion) {
  if (activacion) return `${activacion.modo}, ${activacion.terminada ? 'activación completa' : 'activándose'}`
  return `${ultimoModo} en el turno anterior, aún sin activar`
}

/**
 * Ficha redonda de un héroe en la casilla de esquina `x`, `y`: su imagen VTT
 * o, sin ella, sus iniciales. El badge lleva la inicial del modo: con borde
 * mientras se activa, relleno al terminar y, si aún no se ha activado este
 * turno, discontinuo con su último modo (`ultimoModo`)
 */
function FichaEnMapa({ ficha: { id, nombre, imagenVtt }, x, y, activacion, ultimoModo }: PropsFicha) {
  const modo = activacion?.modo ?? ultimoModo
  const estado = activacion ? (activacion.terminada ? ' terminada' : '') : ' anterior'
  const radio = LADO / 2 - 2
  return (
    <>
      <clipPath id={`ficha-${id}`}>
        <circle cx={x + LADO / 2} cy={y + LADO / 2} r={radio} />
      </clipPath>
      <circle cx={x + LADO / 2} cy={y + LADO / 2} r={radio} />
      {imagenVtt ? (
        <image href={imagenVtt} x={x + 2} y={y + 2} width={LADO - 4} height={LADO - 4} clipPath={`url(#ficha-${id})`} />
      ) : (
        <text x={x + LADO / 2} y={y + LADO / 2 + 4}>
          {nombre.slice(0, 2)}
        </text>
      )}
      {modo && (
        <g className={`vista-badge ${modo}${estado}`}>
          <circle cx={x + LADO - 5} cy={y + 5} r={6} />
          <text x={x + LADO - 5} y={y + 8}>
            {INICIAL_MODO[modo]}
          </text>
        </g>
      )}
      <title>{modo ? `${nombre}: ${estadoBadge(activacion, ultimoModo)}` : nombre}</title>
    </>
  )
}

/** Largo aproximado de un carácter del texto de la corona, para medir su etiqueta */
const ANCHO_LETRA = 6.2

/** Radio del botón de cada acción de la corona */
const RADIO_ICONO = 12

/**
 * Menú en corona alrededor de la ficha centrada en `cx`, `cy`: un botón con
 * el icono de cada acción, en las direcciones que no tapan otras fichas
 * (`evitar`). Al pasar el ratón o enfocarlo se despliega su nombre; en
 * pantalla táctil, el primer toque lo despliega y el segundo ejecuta la acción
 */
function Corona({
  cx,
  cy,
  acciones,
  onAccion,
  evitar,
}: {
  cx: number
  cy: number
  acciones: Accion[]
  onAccion: (id: string) => void
  /** Casillas con otras fichas (en coordenadas de la estancia) que los botones no deben tapar */
  evitar: Casilla[]
}) {
  const radio = LADO * 1.3
  const [desplegada, setDesplegada] = useState<string>()
  const tactil = useRef(false)
  const sitios = sitiosDeBotones(cx, cy, acciones.length, evitar, LADO)
  const botones = acciones.map((accion, i) => ({ accion, ...sitios[i] }))
  const etiqueta = botones.find((b) => b.accion.id === desplegada)
  const plegar = (id: string) => setDesplegada((d) => (d === id ? undefined : d))

  return (
    <g className="vista-corona">
      <circle cx={cx} cy={cy} r={radio} />
      {botones.map(({ accion: { id, nombre, icono }, x, y }) => (
        <g
          key={id}
          className="vista-corona-accion"
          role="button"
          tabIndex={0}
          aria-label={nombre}
          onPointerDown={(ev) => (tactil.current = ev.pointerType !== 'mouse')}
          onPointerEnter={(ev) => ev.pointerType === 'mouse' && setDesplegada(id)}
          onPointerLeave={(ev) => ev.pointerType === 'mouse' && plegar(id)}
          onFocus={() => setDesplegada(id)}
          onBlur={() => plegar(id)}
          onClick={() => (tactil.current && desplegada !== id ? setDesplegada(id) : onAccion(id))}
          onKeyDown={(ev) => (ev.key === 'Enter' || ev.key === ' ') && onAccion(id)}
        >
          <circle cx={x} cy={y} r={RADIO_ICONO} />
          <text x={x} y={y + 4}>
            {icono}
          </text>
        </g>
      ))}
      {etiqueta && (
        // encima de los demás botones y sin recibir el puntero: sigue siendo el botón el que se señala
        <g className="vista-corona-etiqueta">
          <rect
            x={etiqueta.x - RADIO_ICONO}
            y={etiqueta.y - RADIO_ICONO}
            width={2 * RADIO_ICONO + 8 + etiqueta.accion.nombre.length * ANCHO_LETRA}
            height={2 * RADIO_ICONO}
            rx={RADIO_ICONO}
          />
          <text className="icono" x={etiqueta.x} y={etiqueta.y + 4}>
            {etiqueta.accion.icono}
          </text>
          <text x={etiqueta.x + RADIO_ICONO + 4} y={etiqueta.y + 4}>
            {etiqueta.accion.nombre}
          </text>
        </g>
      )}
    </g>
  )
}

/** Cómo se pinta cada paso de la flecha: un color por tipo de movimiento y otro para los tramos que consumen otra acción */
const CLASES_FLECHA = ['normal', 'accion', 'carga', 'invalido'] as const

type ClaseFlecha = (typeof CLASES_FLECHA)[number]

function claseDelPaso(evaluado: RecorridoEvaluado | undefined, paso: number): ClaseFlecha {
  if (!evaluado || 'motivo' in evaluado) return 'invalido'
  if (evaluado.opcion.tipo === 'carga') return 'carga'
  return evaluado.opcion.tramos[evaluado.tramos[paso]]?.accion ? 'accion' : 'normal'
}

/**
 * Flecha del recorrido que se está arrastrando, por los centros de sus
 * casillas y en un tramo de color por cada parte del movimiento, con el nombre
 * de la opción que vale (o por qué no vale ninguna) junto al destino
 */
function Flecha({ recorrido, evaluado, marcador, coste }: { recorrido: Casilla[]; evaluado?: RecorridoEvaluado; marcador: string; coste: number }) {
  const centro = ({ x, y }: Casilla) => `${(x + 0.5) * LADO},${(y + 0.5) * LADO}`
  const tramos = recorrido.slice(1).reduce<{ clase: ClaseFlecha; casillas: Casilla[] }[]>((hechos, c, i) => {
    const clase = claseDelPaso(evaluado, i)
    const ultimo = hechos.at(-1)
    return ultimo?.clase === clase
      ? [...hechos.slice(0, -1), { clase, casillas: [...ultimo.casillas, c] }]
      : [...hechos, { clase, casillas: [recorrido[i], c] }]
  }, [])
  const destino = recorrido.at(-1)
  const pasos = recorrido.length - 1
  const etiqueta = !evaluado ? `${coste}…` : 'motivo' in evaluado ? evaluado.motivo : `${evaluado.opcion.nombre} · ${coste}`
  return (
    <g className="vista-recorrido">
      {tramos.map(({ clase, casillas }, i) => (
        <polyline
          key={i}
          className={clase}
          points={casillas.map(centro).join(' ')}
          markerEnd={i === tramos.length - 1 ? `url(#${marcador}-${clase})` : undefined}
        />
      ))}
      {destino && pasos > 0 && (
        <text x={(destino.x + 0.5) * LADO} y={destino.y * LADO - 4}>
          {etiqueta}
        </text>
      )}
    </g>
  )
}

type Arrastre = {
  ficha: Heroe
  /** Casilla bajo el puntero: la ruta va de la ficha hasta ella */
  objetivo: Casilla
  recorrido: Casilla[]
  /** Mientras llegan, sin definir; `null` si el héroe no puede moverse */
  opciones?: OpcionesMovimiento | null
  /** El puntero está en una casilla a la que no llega: soltar ahí no hace nada */
  fuera?: boolean
}

const misma = (a?: Casilla, b?: Casilla) => !!a && !!b && a.x === b.x && a.y === b.y

/** El recorrido recortado hasta donde llega el alcance, según la medición */
function recortado(recorrido: Casilla[], maximo: number, medicion: MedicionMovimiento) {
  const pasa = costesDe(recorrido, medicion).findIndex((coste) => coste > maximo)
  return pasa < 0 ? recorrido : recorrido.slice(0, pasa + 1)
}

/**
 * La ruta más corta (A*, según la medición) de la ficha a la casilla
 * `objetivo`, sea cual sea el camino que haya hecho el puntero. Si pasa del
 * alcance de sus opciones, se recorta hasta donde llega y queda `fuera`; si no
 * se puede llegar, la flecha se queda como estaba y también queda `fuera`
 */
function trazar(mapa: Mapa, a: Arrastre, objetivo: Casilla, medicion: MedicionMovimiento): Arrastre {
  const camino = ruta(mapa, a.recorrido[0], objetivo, medicion)
  if (!camino) return { ...a, objetivo, fuera: true }
  const recorrido = a.opciones ? recortado(camino, alcance(a.opciones), medicion) : camino
  return { ...a, objetivo, recorrido, fuera: recorrido.length < camino.length }
}

/** Lo que la vista deja hacer sobre las estancias; `onElegir` recibe la casilla en coordenadas de su estancia */
type Props = {
  onElegir?: (estancia: Estancia, c: Casilla) => void
  /** Id del elemento o héroe resaltado */
  elemento?: string
  onElegirElemento?: (id: string) => void
  /** Acciones que se dibujan en corona alrededor del elemento resaltado */
  corona?: { acciones: Accion[]; onAccion: (id: string) => void }
  /** Cómo puede moverse un héroe: se pregunta al empezar a arrastrar su ficha */
  opcionesMovimiento?: (heroeId: string) => Promise<OpcionesMovimiento | undefined>
  /** Al soltar una ficha arrastrada: sin esto, las fichas no se arrastran */
  onMover?: (heroeId: string, recorrido: Casilla[]) => void
  /** Cómo se miden los movimientos al arrastrar (sin diagonales, si no se dice) */
  medicion?: MedicionMovimiento
}

/** Héroe colocado en una estancia, con su escuadra */
type HeroeColocado = { heroe: Heroe & { casilla: Casilla }; escuadra: Escuadra }

/**
 * Una estancia del mapa en su sitio (`origen`, en casillas del mapa), con las
 * suyas dentro, sus puertas, sus objetos colocados y los héroes que están en
 * ella; las casillas se colorean por su tipo. Todo lo de dentro va en
 * coordenadas de la estancia
 */
function CapaEstancia({
  estancia,
  origen,
  heroes,
  fichas,
  numero,
  activa,
  onElegir,
  elemento,
  onElegirElemento,
  corona,
  onArrastrar,
  arrastrando,
}: Props & {
  estancia: Estancia
  origen: Casilla
  heroes: HeroeColocado[]
  /** Casillas de todas las fichas de héroe del mapa, en coordenadas de esta estancia */
  fichas: Casilla[]
  /** Número del turno en curso */
  numero: number
  /**
   * Escuadra con la activación en curso: los héroes de las demás se ven
   * apagados y no se arrastran (pulsarlos solo los elige) hasta que termine
   */
  activa?: string
  /** Al pulsar una ficha de héroe que se puede arrastrar: el arrastre lo lleva el mapa */
  onArrastrar?: (ev: PointerEvent, heroe: Heroe) => void
  /** Mientras se arrastra una ficha no se muestra la corona */
  arrastrando: boolean
}) {
  /** Héroe de otra escuadra mientras una se activa */
  const esperando = (escuadra: Escuadra) => !!activa && escuadra.id !== activa
  const elegido = heroes.find(({ heroe }) => heroe.id === elemento)?.heroe.casilla ?? estancia.elementos.find((el) => el.id === elemento)?.posicion
  const medidaElegida = estancia.elementos.find((el) => el.id === elemento) ?? { columnas: 1, filas: 1 }

  return (
    <g transform={`translate(${origen.x * LADO} ${origen.y * LADO})`} aria-label={`Estancia ${estancia.id}`}>
      {Array.from({ length: estancia.columnas * estancia.filas }, (_, i) => {
        const c = { x: i % estancia.columnas, y: Math.floor(i / estancia.columnas) }
        return (
          <rect
            key={i}
            className={`vista-casilla ${estanciaEn(estancia, c)?.estancia.tipo}`}
            x={c.x * LADO}
            y={c.y * LADO}
            width={LADO}
            height={LADO}
            onClick={() => onElegir?.(estancia, c)}
          />
        )
      })}
      {estanciasDe(estancia).map(({ estancia: e, origen }) => (
        <g key={e.id} className="vista-muros">
          <rect x={origen.x * LADO} y={origen.y * LADO} width={e.columnas * LADO} height={e.filas * LADO} />
          <text x={origen.x * LADO + 4} y={origen.y * LADO + 12}>
            {e.id}
          </text>
        </g>
      ))}
      {estanciasDe(estancia).flatMap(({ estancia: e, origen }) =>
        e.elementos.flatMap((el) =>
          el.posicion
            ? [
                <g key={el.id} className={`vista-elemento ${el.tipo}${el.id === elemento ? ' activo' : ''}`} onClick={() => onElegirElemento?.(el.id)}>
                  <rect
                    x={(origen.x + el.posicion.x) * LADO + 3}
                    y={(origen.y + el.posicion.y) * LADO + 3}
                    width={el.columnas * LADO - 6}
                    height={el.filas * LADO - 6}
                  />
                  <text x={(origen.x + el.posicion.x + el.columnas / 2) * LADO} y={(origen.y + el.posicion.y + el.filas / 2) * LADO + 4}>
                    {el.nombre}
                  </text>
                </g>,
              ]
            : [],
        ),
      )}
      {heroes.map(({ heroe, escuadra }) => {
        const activacion = turnoDeEscuadra(escuadra, numero).activacion
        return (
          <g
            key={heroe.id}
            className={`vista-elemento heroe${heroe.id === elemento ? ' activo' : ''}${esperando(escuadra) ? ' esperando' : ''}`}
            {...(onArrastrar && !esperando(escuadra)
              ? { onPointerDown: (ev: PointerEvent) => onArrastrar(ev, heroe) }
              : { onClick: () => onElegirElemento?.(heroe.id) })}
          >
            <FichaEnMapa
              ficha={heroe}
              x={heroe.casilla.x * LADO}
              y={heroe.casilla.y * LADO}
              activacion={activacion}
              ultimoModo={escuadra.modo === 'normal' ? undefined : escuadra.modo}
            />
          </g>
        )
      })}
      {estanciasDe(estancia).flatMap(({ estancia: e, origen }) =>
        e.puertas.map((p) => <PuertaEnMuro key={`${e.id}-${p.id}`} puerta={p} origen={origen} />),
      )}
      {!arrastrando && corona && corona.acciones.length > 0 && elegido && (
        <Corona
          cx={(elegido.x + medidaElegida.columnas / 2) * LADO}
          cy={(elegido.y + medidaElegida.filas / 2) * LADO}
          evitar={fichas.filter((c) => c.x !== elegido.x || c.y !== elegido.y)}
          {...corona}
        />
      )}
    </g>
  )
}

/** Esquina de una estancia en las casillas del mapa */
const origenDe = (e: Estancia): Casilla => e.posicion ?? { x: 0, y: 0 }

/**
 * El mapa: cada estancia en su sitio, en un solo dibujo que las abarca a
 * todas. La estancia de la ficha elegida se pinta la última, para que su
 * corona quede por encima de las demás. Las fichas de héroe se arrastran
 * casilla a casilla por todo el mapa (cruzando puertas abiertas), con la
 * flecha del recorrido; pulsarlas sin arrastrar las elige
 */
export function VistaMapa({ mapa, ...props }: Props & { mapa: Mapa }) {
  const { opcionesMovimiento, onMover, onElegirElemento, medicion = 'ortogonal' } = props
  const { estancias } = mapa
  const svg = useRef<SVGSVGElement>(null)
  // ids de las puntas de flecha, únicos aunque haya varios mapas en la página
  const marcador = `flecha${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const [arrastre, setArrastre] = useState<Arrastre>()

  /** Casilla del mapa bajo el puntero */
  const casillaBajo = (ev: PointerEvent): Casilla | undefined => {
    const matriz = svg.current?.getScreenCTM()
    if (!matriz) return
    const p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(matriz.inverse())
    return { x: Math.floor(p.x / LADO), y: Math.floor(p.y / LADO) }
  }

  function empezar(ev: PointerEvent, ficha: Heroe) {
    const desde = enElMapa(mapa, ficha)
    if (!desde) return
    svg.current?.setPointerCapture(ev.pointerId)
    setArrastre({ ficha, objetivo: desde, recorrido: [desde] })
    // al llegar las opciones, la ruta que ya se estuviera mostrando se recorta a su alcance
    opcionesMovimiento?.(ficha.id).then((opciones) =>
      setArrastre((a) => (a?.ficha.id === ficha.id ? trazar(mapa, { ...a, opciones: opciones ?? null }, a.objetivo, medicion) : a)),
    )
  }

  function arrastrar(ev: PointerEvent) {
    const c = casillaBajo(ev)
    if (c) setArrastre((a) => (a && !misma(a.objetivo, c) ? trazar(mapa, a, c, medicion) : a))
  }

  function soltar() {
    if (!arrastre) return
    const { ficha, recorrido, fuera } = arrastre
    setArrastre(undefined)
    if (fuera) return
    if (recorrido.length > 1) onMover?.(ficha.id, recorrido)
    else onElegirElemento?.(ficha.id)
  }

  if (!estancias.length) return null
  const evaluado: RecorridoEvaluado | undefined =
    arrastre?.opciones === null
      ? { motivo: `${arrastre.ficha.nombre} no puede moverse ahora` }
      : arrastre?.opciones && evaluarRecorrido(mapa, arrastre.ficha, arrastre.recorrido, arrastre.opciones, { medicion })
  const x0 = Math.min(...estancias.map((e) => origenDe(e).x))
  const y0 = Math.min(...estancias.map((e) => origenDe(e).y))
  const x1 = Math.max(...estancias.map((e) => origenDe(e).x + e.columnas))
  const y1 = Math.max(...estancias.map((e) => origenDe(e).y + e.filas))
  const colocados = escuadrasDe(mapa).flatMap((escuadra) =>
    escuadra.heroes.flatMap((heroe) => (heroe.casilla ? [{ heroe: { ...heroe, casilla: heroe.casilla }, escuadra }] : [])),
  )
  const numero = numeroDeTurno(mapa)
  const activa = escuadraActiva(mapa)?.id
  const conElegido = (e: Estancia) =>
    Number(
      colocados.some(({ heroe }) => heroe.id === props.elemento && heroe.estancia === e.id) ||
        estanciasDe(e).some(({ estancia }) => estancia.elementos.some((el) => el.id === props.elemento)),
    )
  return (
    <svg
      ref={svg}
      onPointerMove={arrastre ? arrastrar : undefined}
      onPointerUp={soltar}
      onPointerCancel={() => setArrastre(undefined)}
      className="vista-estancia"
      viewBox={`${x0 * LADO - GROSOR} ${y0 * LADO - GROSOR} ${(x1 - x0) * LADO + 2 * GROSOR} ${(y1 - y0) * LADO + 2 * GROSOR}`}
      role="img"
      aria-label="Mapa"
    >
      <defs>
        {CLASES_FLECHA.map((clase) => (
          <marker key={clase} id={`${marcador}-${clase}`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path className={`vista-recorrido-punta ${clase}`} d="M0 0L10 5L0 10z" />
          </marker>
        ))}
      </defs>
      {[...estancias]
        .sort((a, b) => conElegido(a) - conElegido(b))
        .map((e) => (
          <CapaEstancia
            key={e.id}
            estancia={e}
            origen={origenDe(e)}
            heroes={colocados.filter(({ heroe }) => heroe.estancia === e.id)}
            fichas={colocados.flatMap(({ heroe }) => {
              const c = enElMapa(mapa, heroe)
              return c ? [{ x: c.x - origenDe(e).x, y: c.y - origenDe(e).y }] : []
            })}
            numero={numero}
            activa={activa}
            onArrastrar={onMover ? empezar : undefined}
            arrastrando={!!arrastre}
            {...props}
          />
        ))}
      {arrastre && (
        <Flecha
          recorrido={arrastre.recorrido}
          evaluado={arrastre.fuera ? { motivo: 'Fuera de alcance' } : evaluado}
          marcador={marcador}
          coste={costeDe(arrastre.recorrido, medicion)}
        />
      )}
    </svg>
  )
}
