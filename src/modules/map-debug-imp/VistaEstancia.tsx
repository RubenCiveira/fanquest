import { estanciaEn, estanciasDe, type Accion, type Activacion, type Casilla, type ModoActivacion, type Estancia, type FichaHeroe, type Puerta } from '../gamemap'

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
}

/** Dibujo de una estancia con las suyas dentro, sus puertas y sus elementos colocados; las casillas se colorean por su tipo */
export function VistaEstancia({ estancia, elegida, onElegir, elemento, onElegirElemento, activaciones, ultimosModos, corona }: Props) {
  const ancho = estancia.columnas * LADO
  const alto = estancia.filas * LADO
  return (
    <svg
      className="vista-estancia"
      viewBox={`${-GROSOR} ${-GROSOR} ${ancho + 2 * GROSOR} ${alto + 2 * GROSOR}`}
      role="img"
      aria-label={`Estancia ${estancia.id}`}
    >
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
                <g key={el.id} className={`vista-elemento ${el.tipo}${el.id === elemento ? ' activo' : ''}`} onClick={() => onElegirElemento?.(el.id)}>
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
      {corona && corona.acciones.length > 0 &&
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
