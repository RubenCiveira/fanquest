import { useId, useRef, useState, type PointerEvent } from 'react'
import { sitiosDeBotones } from './corona'
import {
  alcance,
  activacionDeNoJugador,
  casillasDeEnemigos,
  conPersonajes,
  conZonaDeControl,
  costeDe,
  costesDe,
  enElMapa,
  enemigoEn,
  esEnemigo,
  escuadrasDe,
  estanciaEn,
  estanciasDe,
  evaluarRecorrido,
  medirAtaque,
  ruta,
  type Accion,
  type Activacion,
  type Casilla,
  type Configuracion,
  type Estancia,
  type Escuadra,
  type Jugador,
  type Personaje,
  type Mapa,
  type MedicionMovimiento,
  type ModoActivacion,
  type OpcionesMovimiento,
  type Puerta,
  type RecorridoEvaluado,
  type TipoAtaque,
  type Terreno,
  type TipoTerreno,
  numeroDeTurno,
  personajesNoJugadoresDe,
  turnoDeEscuadra,
  type PersonajeNoJugador,
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

type PropsFicha = { ficha: Personaje; x: number; y: number; activacion?: Activacion; ultimoModo?: ModoActivacion }

/** Texto del badge al pasar el puntero */
function estadoBadge(activacion?: Activacion, ultimoModo?: ModoActivacion) {
  if (activacion) return `${activacion.modo}, ${activacion.terminada ? 'activación completa' : 'activándose'}`
  return `${ultimoModo} en el turno anterior, aún sin activar`
}

/**
 * Ficha redonda de un personaje en la casilla de esquina `x`, `y`: su imagen VTT
 * o, sin ella, sus iniciales. El badge lleva la inicial del modo: con borde
 * mientras se activa, relleno al terminar y, si aún no se ha activado este
 * turno, discontinuo con su último modo (`ultimoModo`). Si lleva la cuenta de
 * su vida, otro badge abajo con los puntos que le quedan
 */
function FichaEnMapa({ ficha: { id, nombre, imagenVtt, vida }, x, y, activacion, ultimoModo }: PropsFicha) {
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
      {vida !== undefined && (
        <g className="vista-vida">
          <circle cx={x + 5} cy={y + LADO - 5} r={6} />
          <text x={x + 5} y={y + LADO - 2}>
            {vida}
          </text>
        </g>
      )}
      <title>
        {modo ? `${nombre}: ${estadoBadge(activacion, ultimoModo)}` : nombre}
        {vida !== undefined && ` (${vida} de vida)`}
      </title>
    </>
  )
}

/** Icono de cada tipo de ataque */
const ICONO_ATAQUE: Record<TipoAtaque, string> = { 'cuerpo-a-cuerpo': '⚔️', distancia: '🏹' }

/**
 * Mientras se arrastra sobre un enemigo: una línea de la ficha a él y el icono
 * del tipo de ataque (casillas del mapa); si no puede atacarlo, apagado y con
 * el `motivo`
 */
function IconoAtaque({ desde, hasta, objetivo, tipo, motivo }: { desde: Casilla; hasta: Casilla; objetivo: Personaje; tipo: TipoAtaque; motivo?: string }) {
  const centro = (c: Casilla) => ({ x: (c.x + 0.5) * LADO, y: (c.y + 0.5) * LADO })
  const [a, b] = [centro(desde), centro(hasta)]
  return (
    <g className={`vista-ataque ${tipo}${motivo ? ' invalido' : ''}`}>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
      <circle cx={b.x} cy={b.y} r={RADIO_ICONO} />
      <text x={b.x} y={b.y + 4}>
        {ICONO_ATAQUE[tipo]}
      </text>
      {motivo && (
        // en medio de la línea, donde hay más sitio a los dos lados para el texto
        <text className="vista-ataque-motivo" x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 8}>
          {motivo}
        </text>
      )}
      <title>{motivo ?? `Atacar a ${objetivo.nombre} ${tipo === 'cuerpo-a-cuerpo' ? 'cuerpo a cuerpo' : 'a distancia'}`}</title>
    </g>
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
  ficha: Personaje
  /** Casilla bajo el puntero: la ruta va de la ficha hasta ella */
  objetivo: Casilla
  recorrido: Casilla[]
  /** Mientras llegan, sin definir; `null` si el personaje no puede moverse */
  opciones?: OpcionesMovimiento | null
  /** El puntero está en una casilla a la que no llega: soltar ahí no hace nada */
  fuera?: boolean
  /** El puntero está sobre un enemigo: soltar ahí lo ataca */
  ataque?: { objetivo: Personaje; tipo: TipoAtaque; motivo?: string }
}

const misma = (a?: Casilla, b?: Casilla) => !!a && !!b && a.x === b.x && a.y === b.y

/** El recorrido recortado hasta donde llega el alcance, según la medición y el terreno */
function recortado(mapa: Mapa, recorrido: Casilla[], maximo: number, medicion: MedicionMovimiento) {
  const pasa = costesDe(mapa, recorrido, medicion).findIndex((coste) => coste > maximo)
  return pasa < 0 ? recorrido : recorrido.slice(0, pasa + 1)
}

/**
 * La ruta más corta (A*, según la medición) de la ficha a la casilla
 * `objetivo`, sea cual sea el camino que haya hecho el puntero: rodeando la
 * zona de control de los enemigos (`rodeando`, el mapa con ella impasable)
 * si se puede y, si no (una carga), por donde sea. Si pasa del
 * alcance de sus opciones, se recorta hasta donde llega y queda `fuera`; si no
 * se puede llegar, la flecha se queda como estaba y también queda `fuera`
 */
function trazar(mapa: Mapa, rodeando: Mapa, a: Arrastre, objetivo: Casilla, medicion: MedicionMovimiento): Arrastre {
  const camino = ruta(rodeando, a.recorrido[0], objetivo, medicion) ?? ruta(mapa, a.recorrido[0], objetivo, medicion)
  if (!camino) return { ...a, objetivo, fuera: true }
  const recorrido = a.opciones ? recortado(mapa, camino, alcance(a.opciones), medicion) : camino
  return { ...a, objetivo, recorrido, fuera: recorrido.length < camino.length }
}

/** Lo que la vista deja hacer sobre las estancias; `onElegir` recibe la casilla en coordenadas de su estancia */
type Props = {
  onElegir?: (estancia: Estancia, c: Casilla) => void
  /** Id del elemento o personaje resaltado */
  elemento?: string
  onElegirElemento?: (id: string) => void
  /** Acciones que se dibujan en corona alrededor del elemento resaltado */
  corona?: { acciones: Accion[]; onAccion: (id: string) => void }
  /** Cómo puede moverse un personaje: se pregunta al empezar a arrastrar su ficha */
  opcionesMovimiento?: (personajeId: string) => Promise<OpcionesMovimiento | undefined>
  /** Al soltar una ficha arrastrada: sin esto, las fichas no se arrastran */
  onMover?: (personajeId: string, recorrido: Casilla[]) => void
  /** Al soltar una ficha arrastrada sobre la de un enemigo suyo: sin esto, no se ataca */
  onAtacar?: (personajeId: string, objetivoId: string) => void
  /** Por qué un personaje no puede atacar a ese enemigo (se pregunta al arrastrar su ficha por encima), o nada si puede */
  motivoParaNoAtacar?: (personajeId: string, objetivoId: string) => Promise<string | undefined>
  /** Cómo se miden los movimientos al arrastrar (sin diagonales, si no se dice) */
  medicion?: MedicionMovimiento
  /** Cómo cuenta para moverse la casilla de otro personaje (se pasa por encima como si nada, si no se dice) */
  terrenoPersonajes?: Configuracion['terrenoPersonajes']
  /** Casillas alrededor de un personaje que controla: salvo cargando, no se entra en la de un enemigo (sin zona de control, si no se dice) */
  distanciaControl?: number
  /** Por qué no puede actuar ahora un personaje de una escuadra: si lo hay, se ve apagado y no se arrastra (pulsarlo solo lo elige) */
  motivoParaNoActuar?: (personajeId: string) => string | undefined
  /** Jugador al que le toca: los personajes no jugadores enemigos suyos se marcan como tales */
  jugadorEnTurno?: Jugador
  /** Modo inicial o actual de un personaje no jugador */
  modoNoJugador?: (personajeId: string) => ModoActivacion | undefined
}

/** Personaje colocado en una estancia, con su escuadra */
type PersonajeColocado = { personaje: Personaje & { casilla: Casilla }; escuadra: Escuadra }

/** Personaje no jugador colocado en una estancia, y si es enemigo del jugador al que le toca */
type NoJugadorColocado = PersonajeNoJugador & { casilla: Casilla; enemigo: boolean }

/**
 * Una estancia del mapa en su sitio (`origen`, en casillas del mapa), con las
 * suyas dentro, sus puertas, sus objetos colocados y los personajes que están en
 * ella; las casillas se colorean por su tipo. Todo lo de dentro va en
 * coordenadas de la estancia
 */
function CapaEstancia({
  estancia,
  mapa,
  origen,
  personajes,
  noJugadores,
  patrones,
  fichas,
  numero,
  onElegir,
  elemento,
  onElegirElemento,
  corona,
  onArrastrar,
  arrastrando,
  motivoParaNoActuar,
  jugadorEnTurno,
  modoNoJugador,
}: Props & {
  estancia: Estancia
  mapa: Mapa
  origen: Casilla
  personajes: PersonajeColocado[]
  /** Personajes no jugadores que están en ella */
  noJugadores: NoJugadorColocado[]
  /** Prefijo de los ids de los rayados del terreno (`<prefijo>-dificil`…), definidos en el mapa */
  patrones: string
  /** Casillas de todas las fichas de personaje del mapa, en coordenadas de esta estancia */
  fichas: Casilla[]
  /** Número del turno en curso */
  numero: number
  /** Al pulsar una ficha de personaje que se puede arrastrar: el arrastre lo lleva el mapa */
  onArrastrar?: (ev: PointerEvent, personaje: Personaje) => void
  /** Mientras se arrastra una ficha no se muestra la corona */
  arrastrando: boolean
}) {
  const motivoBloqueo = (personaje: Personaje) => motivoParaNoActuar?.(personaje.id)
  const elegirBloqueado = (personaje: Personaje) => {
    const motivo = motivoBloqueo(personaje)
    if (motivo) console.warn(`[map-debug] ${personaje.nombre} (${personaje.id}) no puede moverse ahora: ${motivo}`)
    onElegirElemento?.(personaje.id)
  }
  const puedeMoverNoJugador = (personaje: NoJugadorColocado) => personaje.jugador === jugadorEnTurno?.id && jugadorEnTurno.tipo === 'ia'
  const elegido =
    personajes.find(({ personaje }) => personaje.id === elemento)?.personaje.casilla ??
    noJugadores.find((personaje) => personaje.id === elemento)?.casilla ??
    estancia.elementos.find((el) => el.id === elemento)?.posicion
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
      {estancia.terrenos?.map((t, i) => {
        const [x, y, width, height] = [t.posicion.x * LADO, t.posicion.y * LADO, t.columnas * LADO, t.filas * LADO]
        // con imagen, solo la imagen; sin ella, el rayado de su tipo
        return t.imagen ? (
          <image key={i} className="vista-terreno" href={t.imagen} x={x} y={y} width={width} height={height} preserveAspectRatio="xMidYMid slice">
            <title>{conCobertura(t)}</title>
          </image>
        ) : (
          <rect key={i} className={`vista-terreno ${t.tipo}`} x={x} y={y} width={width} height={height} fill={`url(#${patrones}-${t.tipo})`}>
            <title>{conCobertura(t)}</title>
          </rect>
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
                  {el.tipo === 'mueble' && el.imagenVtt ? (
                    <image href={el.imagenVtt} x={(origen.x + el.posicion.x) * LADO + 3} y={(origen.y + el.posicion.y) * LADO + 3} width={el.columnas * LADO - 6} height={el.filas * LADO - 6} />
                  ) : (
                    <text x={(origen.x + el.posicion.x + el.columnas / 2) * LADO} y={(origen.y + el.posicion.y + el.filas / 2) * LADO + 4}>
                      {el.nombre}
                    </text>
                  )}
                  <title>{el.tipo === 'mueble' && el.flags?.length ? `${el.nombre}: ${el.flags.join(', ')}` : el.nombre}</title>
                </g>,
              ]
            : [],
        ),
      )}
      {personajes.map(({ personaje, escuadra }) => {
        const activacion = turnoDeEscuadra(escuadra, numero).activacion
        const esperando = !!motivoBloqueo(personaje)
        return (
          <g
            key={personaje.id}
            className={`vista-elemento personaje${personaje.id === elemento ? ' activo' : ''}${esperando ? ' esperando' : ''}`}
            {...(onArrastrar && !esperando
              ? { onPointerDown: (ev: PointerEvent) => onArrastrar(ev, personaje) }
              : { onClick: () => elegirBloqueado(personaje) })}
          >
            <FichaEnMapa
              ficha={personaje}
              x={personaje.casilla.x * LADO}
              y={personaje.casilla.y * LADO}
              activacion={activacion}
              ultimoModo={escuadra.modo === 'normal' ? undefined : escuadra.modo}
            />
          </g>
        )
      })}
      {noJugadores.map((p) => {
        const esperando = !!motivoBloqueo(p)
        return (
          <g
            key={p.id}
            className={`vista-elemento personaje no-jugador${p.enemigo ? ' enemigo' : ''}${esperando ? ' esperando' : ''}`}
            {...(onArrastrar && puedeMoverNoJugador(p) && !esperando ? { onPointerDown: (ev: PointerEvent) => onArrastrar(ev, p) } : { onClick: () => elegirBloqueado(p) })}
          >
            <FichaEnMapa
              ficha={p}
              x={p.casilla.x * LADO}
              y={p.casilla.y * LADO}
              activacion={activacionDeNoJugador(mapa, p.id)?.activacion}
              ultimoModo={modoNoJugador?.(p.id) === 'normal' ? undefined : modoNoJugador?.(p.id)}
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

const NOMBRE_TERRENO: Record<TipoTerreno, string> = { dificil: 'Terreno difícil', 'muy-dificil': 'Terreno muy difícil', impasable: 'Terreno impasable' }

/** Nombre del terreno y, si la da, su cobertura contra los disparos */
const conCobertura = ({ tipo, cobertura = 'ninguna' }: Terreno) => `${NOMBRE_TERRENO[tipo]}${cobertura === 'ninguna' ? '' : `, cobertura ${cobertura}`}`

/**
 * Rayados con que se marca el terreno sin imagen: rayas sueltas el difícil,
 * trama cruzada el muy difícil y rayas densas sobre fondo oscuro el impasable
 */
function RayadosDeTerreno({ prefijo }: { prefijo: string }) {
  return (
    <>
      <pattern id={`${prefijo}-dificil`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line className="vista-rayado dificil" x1="0" y1="0" x2="0" y2="8" />
      </pattern>
      <pattern id={`${prefijo}-muy-dificil`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line className="vista-rayado muy-dificil" x1="0" y1="0" x2="0" y2="7" />
        <line className="vista-rayado muy-dificil" x1="0" y1="0" x2="7" y2="0" />
      </pattern>
      <pattern id={`${prefijo}-impasable`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect className="vista-rayado-fondo" width="5" height="5" />
        <line className="vista-rayado impasable" x1="0" y1="0" x2="0" y2="5" />
      </pattern>
    </>
  )
}

/** Esquina de una estancia en las casillas del mapa */
const origenDe = (e: Estancia): Casilla => e.posicion ?? { x: 0, y: 0 }

/**
 * El mapa: cada estancia en su sitio, en un solo dibujo que las abarca a
 * todas. La estancia de la ficha elegida se pinta la última, para que su
 * corona quede por encima de las demás. Las fichas de personaje se arrastran
 * casilla a casilla por todo el mapa (cruzando puertas abiertas), con la
 * flecha del recorrido; pulsarlas sin arrastrar las elige
 */
export function VistaMapa({ mapa, ...props }: Props & { mapa: Mapa }) {
  const { opcionesMovimiento, onMover, onAtacar, motivoParaNoAtacar, onElegirElemento, medicion = 'ortogonal', terrenoPersonajes = 'normal', distanciaControl = 0 } = props
  /** El mapa como lo ve la ficha que se arrastra: los demás personajes, con su terreno */
  const vistoPor = (ficha: Personaje) => conPersonajes(mapa, ficha.id, terrenoPersonajes)
  /** Como lo ve la ficha, con la zona de control de sus enemigos impasable: para rutas que la rodeen */
  const rodeando = (ficha: Personaje) => conZonaDeControl(vistoPor(ficha), casillasDeEnemigos(mapa, ficha.id), distanciaControl)
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

  function empezar(ev: PointerEvent, ficha: Personaje) {
    const desde = enElMapa(mapa, ficha)
    if (!desde) return
    svg.current?.setPointerCapture(ev.pointerId)
    setArrastre({ ficha, objetivo: desde, recorrido: [desde] })
    // al llegar las opciones, la ruta que ya se estuviera mostrando se recorta a su alcance
    opcionesMovimiento?.(ficha.id).then((opciones) =>
      setArrastre((a) => (a?.ficha.id === ficha.id ? trazar(vistoPor(a.ficha), rodeando(a.ficha), { ...a, opciones: opciones ?? null }, a.objetivo, medicion) : a)),
    )
  }

  function arrastrar(ev: PointerEvent) {
    const c = casillaBajo(ev)
    if (!c || !arrastre || misma(arrastre.objetivo, c)) return
    // sobre un enemigo, en vez de la flecha del recorrido, el icono de ataque
    const { ficha } = arrastre
    const enemigo = onAtacar && enemigoEn(mapa, ficha.id, c)
    const medida = enemigo && medirAtaque(mapa, { medicionMovimiento: medicion, terrenoPersonajes }, ficha, enemigo)
    if (!enemigo || !medida) return setArrastre((a) => a && { ...trazar(vistoPor(a.ficha), rodeando(a.ficha), a, c, medicion), ataque: undefined })
    setArrastre((a) => a && { ...a, objetivo: c, ataque: { objetivo: enemigo, tipo: medida.tipo } })
    // si no puede atacarlo, el icono lo dice; la respuesta solo vale si el puntero sigue sobre ese enemigo
    motivoParaNoAtacar?.(ficha.id, enemigo.id).then((motivo) =>
      setArrastre((a) => (a?.ataque?.objetivo.id === enemigo.id ? { ...a, ataque: { ...a.ataque, ...(motivo && { motivo }) } } : a)),
    )
  }

  function soltar() {
    if (!arrastre) return
    const { ficha, recorrido, fuera, ataque } = arrastre
    setArrastre(undefined)
    if (ataque) return onAtacar?.(ficha.id, ataque.objetivo.id)
    if (fuera) return
    if (recorrido.length > 1) onMover?.(ficha.id, recorrido)
    else onElegirElemento?.(ficha.id)
  }

  if (!estancias.length) return null
  const evaluado: RecorridoEvaluado | undefined =
    arrastre?.opciones === null
      ? { motivo: `${arrastre.ficha.nombre} no puede moverse ahora` }
      : arrastre?.opciones && evaluarRecorrido(vistoPor(arrastre.ficha), arrastre.ficha, arrastre.recorrido, arrastre.opciones, { medicion, enemigos: casillasDeEnemigos(mapa, arrastre.ficha.id), distanciaControl })
  const x0 = Math.min(...estancias.map((e) => origenDe(e).x))
  const y0 = Math.min(...estancias.map((e) => origenDe(e).y))
  const x1 = Math.max(...estancias.map((e) => origenDe(e).x + e.columnas))
  const y1 = Math.max(...estancias.map((e) => origenDe(e).y + e.filas))
  const colocados = escuadrasDe(mapa).flatMap((escuadra) =>
    escuadra.personajes.flatMap((personaje) => (personaje.casilla ? [{ personaje: { ...personaje, casilla: personaje.casilla }, escuadra }] : [])),
  )
  const noJugadores = personajesNoJugadoresDe(mapa).flatMap((p) => (p.casilla ? [{ ...p, casilla: p.casilla, enemigo: esEnemigo(mapa, p.id, props.jugadorEnTurno?.alianza) }] : []))
  const numero = numeroDeTurno(mapa)
  const conElegido = (e: Estancia) =>
    Number(
      colocados.some(({ personaje }) => personaje.id === props.elemento && personaje.estancia === e.id) ||
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
        <RayadosDeTerreno prefijo={marcador} />
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
            mapa={mapa}
            origen={origenDe(e)}
            personajes={colocados.filter(({ personaje }) => personaje.estancia === e.id)}
            noJugadores={noJugadores.filter((p) => p.estancia === e.id)}
            patrones={marcador}
            fichas={[...colocados.map(({ personaje }) => personaje), ...noJugadores].flatMap((personaje) => {
              const c = enElMapa(mapa, personaje)
              return c ? [{ x: c.x - origenDe(e).x, y: c.y - origenDe(e).y }] : []
            })}
            numero={numero}
            onArrastrar={onMover ? empezar : undefined}
            arrastrando={!!arrastre}
            {...props}
          />
        ))}
      {arrastre?.ataque && <IconoAtaque desde={arrastre.recorrido[0]} hasta={arrastre.objetivo} {...arrastre.ataque} />}
      {arrastre && !arrastre.ataque && (
        <Flecha
          recorrido={arrastre.recorrido}
          evaluado={arrastre.fuera ? { motivo: 'Fuera de alcance' } : evaluado}
          marcador={marcador}
          coste={costeDe(vistoPor(arrastre.ficha), arrastre.recorrido, medicion)}
        />
      )}
    </svg>
  )
}
