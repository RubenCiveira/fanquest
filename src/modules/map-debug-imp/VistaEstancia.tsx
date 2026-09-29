import { useId, useRef, useState, type PointerEvent } from 'react'
import {
  alcance,
  estanciaEn,
  estanciasDe,
  evaluarRecorrido,
  extenderRecorrido,
  type Accion,
  type Activacion,
  type Casilla,
  type Estancia,
  type FichaHeroe,
  type ModoActivacion,
  type OpcionesMovimiento,
  type Puerta,
  type RecorridoEvaluado,
} from '../gamemap'

/** Lado de una casilla en unidades del SVG */
const LADO = 32

/** Grosor de una puerta y margen para que las del muro exterior no se corten */
const GROSOR = 8

/** Largo de una puerta respecto al lado de la casilla */
const LARGO = 0.7

/** Puerta sobre la línea del muro, centrada en la arista de su casilla (`origen`: esquina de su estancia) */
function PuertaEnMuro({ puerta: { casilla, lado, tipo, id }, origen }: { puerta: Puerta; origen: Casilla }) {
  const x = (origen.x + casilla.x) * LADO
  const y = (origen.y + casilla.y) * LADO
  const hueco = (LADO * (1 - LARGO)) / 2
  const horizontal = lado === 'arriba' || lado === 'abajo'
  const linea = { arriba: y, abajo: y + LADO, izquierda: x, derecha: x + LADO }[lado] - GROSOR / 2
  return (
    <rect
      className={`vista-puerta ${tipo}`}
      x={horizontal ? x + hueco : linea}
      y={horizontal ? linea : y + hueco}
      width={horizontal ? LADO * LARGO : GROSOR}
      height={horizontal ? GROSOR : LADO * LARGO}
    >
      <title>{id}</title>
    </rect>
  )
}

const INICIAL_MODO = { normal: 'N', agresivo: 'A', sigiloso: 'S' }

type PropsFicha = { ficha: FichaHeroe; x: number; y: number; activacion?: Activacion; ultimoModo?: ModoActivacion }

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

/** Largo aproximado de un carácter del texto de la corona, para medir sus botones */
const ANCHO_LETRA = 6.2

/**
 * Menú en corona alrededor de la ficha centrada en `cx`, `cy`: un botón por
 * acción repartido en círculo, empezando por arriba
 */
function Corona({ cx, cy, acciones, onAccion }: { cx: number; cy: number; acciones: Accion[]; onAccion: (id: string) => void }) {
  const radio = LADO * 1.3
  return (
    <g className="vista-corona">
      <circle cx={cx} cy={cy} r={radio} />
      {acciones.map(({ id, nombre }, i) => {
        const angulo = (2 * Math.PI * i) / acciones.length - Math.PI / 2
        const x = cx + radio * Math.cos(angulo)
        const y = cy + radio * Math.sin(angulo)
        const ancho = nombre.length * ANCHO_LETRA + 16
        return (
          <g key={id} className="vista-corona-accion" role="button" aria-label={nombre} onClick={() => onAccion(id)}>
            <rect x={x - ancho / 2} y={y - 10} width={ancho} height={20} rx={10} />
            <text x={x} y={y + 4}>
              {nombre}
            </text>
          </g>
        )
      })}
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
function Flecha({ recorrido, evaluado, marcador }: { recorrido: Casilla[]; evaluado?: RecorridoEvaluado; marcador: string }) {
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
  const etiqueta = !evaluado ? `${pasos}…` : 'motivo' in evaluado ? evaluado.motivo : `${evaluado.opcion.nombre} · ${pasos}`
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
  ficha: FichaHeroe
  recorrido: Casilla[]
  /** Mientras llegan, sin definir; `null` si el héroe no puede moverse */
  opciones?: OpcionesMovimiento | null
  /** El puntero está en una casilla a la que no llega: soltar ahí no hace nada */
  fuera?: boolean
}

const misma = (a?: Casilla, b?: Casilla) => !!a && !!b && a.x === b.x && a.y === b.y

/**
 * El recorrido hasta la casilla bajo el puntero, sin pasar del alcance de
 * sus opciones: si no llega, la flecha se queda donde estaba y queda `fuera`
 */
function hasta(estancia: Estancia, a: Arrastre, c: Casilla): Arrastre {
  if (misma(a.recorrido.at(-1), c)) return a.fuera ? { ...a, fuera: false } : a
  const recorrido = extenderRecorrido(estancia, a.ficha, a.recorrido, c)
  if (a.opciones && recorrido.length - 1 > alcance(a.opciones)) return { ...a, fuera: true }
  return { ...a, recorrido, fuera: !misma(recorrido.at(-1), c) }
}

type Props = {
  estancia: Estancia
  elegida?: Casilla
  onElegir?: (c: Casilla) => void
  /** Id del elemento resaltado */
  elemento?: string
  onElegirElemento?: (id: string) => void
  /** Activaciones del turno en curso por id de escuadra: marcan con un badge las fichas de sus héroes */
  activaciones?: Record<string, Activacion>
  /** Último modo de cada escuadra en turnos anteriores: su badge hasta que vuelva a activarse */
  ultimosModos?: Record<string, ModoActivacion>
  /** Acciones que se dibujan en corona alrededor del elemento resaltado */
  corona?: { acciones: Accion[]; onAccion: (id: string) => void }
  /** Cómo puede moverse un héroe: se pregunta al empezar a arrastrar su ficha */
  opcionesMovimiento?: (heroeId: string) => Promise<OpcionesMovimiento | undefined>
  /** Al soltar una ficha arrastrada: sin esto, las fichas no se arrastran */
  onMover?: (heroeId: string, recorrido: Casilla[]) => void
}

/**
 * Dibujo de una estancia con las suyas dentro, sus puertas y sus elementos
 * colocados; las casillas se colorean por su tipo. Las fichas de héroe de la
 * estancia se arrastran casilla a casilla, con la flecha del recorrido; pulsarlas
 * sin arrastrar las elige
 */
export function VistaEstancia({
  estancia,
  elegida,
  onElegir,
  elemento,
  onElegirElemento,
  activaciones,
  ultimosModos,
  corona,
  opcionesMovimiento,
  onMover,
}: Props) {
  const svg = useRef<SVGSVGElement>(null)
  // ids de las puntas de flecha, únicos aunque haya varias vistas en la página
  const marcador = `flecha${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const [arrastre, setArrastre] = useState<Arrastre>()
  const ancho = estancia.columnas * LADO
  const alto = estancia.filas * LADO

  const casillaBajo = (ev: PointerEvent): Casilla | undefined => {
    const matriz = svg.current?.getScreenCTM()
    if (!matriz) return
    const p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(matriz.inverse())
    return { x: Math.floor(p.x / LADO), y: Math.floor(p.y / LADO) }
  }

  function empezar(ev: PointerEvent, ficha: FichaHeroe) {
    if (!ficha.posicion) return
    svg.current?.setPointerCapture(ev.pointerId)
    setArrastre({ ficha, recorrido: [ficha.posicion] })
    // si ya se había arrastrado más allá de su alcance, la flecha se recorta hasta él
    opcionesMovimiento?.(ficha.id).then((opciones) =>
      setArrastre((a) => {
        if (a?.ficha.id !== ficha.id) return a
        const maximo = opciones ? alcance(opciones) + 1 : a.recorrido.length
        return { ...a, opciones: opciones ?? null, recorrido: a.recorrido.slice(0, maximo), fuera: a.fuera || a.recorrido.length > maximo }
      }),
    )
  }

  function arrastrar(ev: PointerEvent) {
    const c = casillaBajo(ev)
    if (!c) return
    setArrastre((a) => a && hasta(estancia, a, c))
  }

  function soltar() {
    if (!arrastre) return
    const { ficha, recorrido, fuera } = arrastre
    setArrastre(undefined)
    if (fuera) return
    if (recorrido.length > 1) onMover?.(ficha.id, recorrido)
    else onElegirElemento?.(ficha.id)
  }

  const evaluado: RecorridoEvaluado | undefined =
    arrastre?.opciones === null
      ? { motivo: `${arrastre.ficha.nombre} no puede moverse ahora` }
      : arrastre?.opciones && evaluarRecorrido(estancia, arrastre.ficha, arrastre.recorrido, arrastre.opciones)

  return (
    <svg
      ref={svg}
      onPointerMove={arrastre ? arrastrar : undefined}
      onPointerUp={soltar}
      onPointerCancel={() => setArrastre(undefined)}
      className="vista-estancia"
      viewBox={`${-GROSOR} ${-GROSOR} ${ancho + 2 * GROSOR} ${alto + 2 * GROSOR}`}
      role="img"
      aria-label={`Estancia ${estancia.id}`}
    >
      <defs>
        {CLASES_FLECHA.map((clase) => (
          <marker key={clase} id={`${marcador}-${clase}`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path className={`vista-recorrido-punta ${clase}`} d="M0 0L10 5L0 10z" />
          </marker>
        ))}
      </defs>
      {Array.from({ length: estancia.columnas * estancia.filas }, (_, i) => {
        const c = { x: i % estancia.columnas, y: Math.floor(i / estancia.columnas) }
        const activa = elegida?.x === c.x && elegida.y === c.y
        return (
          <rect
            key={i}
            className={`vista-casilla ${estanciaEn(estancia, c)?.estancia.tipo}${activa ? ' activa' : ''}`}
            x={c.x * LADO}
            y={c.y * LADO}
            width={LADO}
            height={LADO}
            onClick={() => onElegir?.(c)}
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
                <g
                  key={el.id}
                  className={`vista-elemento ${el.tipo}${el.id === elemento ? ' activo' : ''}`}
                  {...(el.tipo === 'heroe' && onMover && e.id === estancia.id
                    ? { onPointerDown: (ev: PointerEvent) => empezar(ev, el) }
                    : { onClick: () => onElegirElemento?.(el.id) })}
                >
                  {el.tipo === 'heroe' ? (
                    <FichaEnMapa
                      ficha={el}
                      x={(origen.x + el.posicion.x) * LADO}
                      y={(origen.y + el.posicion.y) * LADO}
                      activacion={activaciones?.[el.escuadra]}
                      ultimoModo={ultimosModos?.[el.escuadra]}
                    />
                  ) : (
                    <>
                      <rect
                        x={(origen.x + el.posicion.x) * LADO + 3}
                        y={(origen.y + el.posicion.y) * LADO + 3}
                        width={el.columnas * LADO - 6}
                        height={el.filas * LADO - 6}
                      />
                      <text x={(origen.x + el.posicion.x + el.columnas / 2) * LADO} y={(origen.y + el.posicion.y + el.filas / 2) * LADO + 4}>
                        {el.nombre}
                      </text>
                    </>
                  )}
                </g>,
              ]
            : [],
        ),
      )}
      {estanciasDe(estancia).flatMap(({ estancia: e, origen }) =>
        e.puertas.map((p) => <PuertaEnMuro key={`${e.id}-${p.id}`} puerta={p} origen={origen} />),
      )}
      {arrastre && (
        <Flecha
          recorrido={arrastre.recorrido}
          evaluado={arrastre.fuera ? { motivo: 'Fuera de alcance' } : evaluado}
          marcador={marcador}
        />
      )}
      {!arrastre && corona && corona.acciones.length > 0 &&
        estanciasDe(estancia).flatMap(({ estancia: e, origen }) =>
          e.elementos.flatMap((el) =>
            el.id === elemento && el.posicion
              ? [
                  <Corona
                    key="corona"
                    cx={(origen.x + el.posicion.x + el.columnas / 2) * LADO}
                    cy={(origen.y + el.posicion.y + el.filas / 2) * LADO}
                    {...corona}
                  />,
                ]
              : [],
          ),
        )}
    </svg>
  )
}
