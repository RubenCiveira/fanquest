import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { Icono } from '../../../components/Icono'
import { aGlobal, aLocal, cabeEnMapa, limites, salaEn, type Sala } from '../lib/mazmorra'
import { casillaEn, encajar, girar, huella, MAX_LADO, pared, puertaEn, type Pieza } from '../lib/rejilla'

/**
 * Lo que se puede poner en el mapa: miembros del grupo y monstruos en juego,
 * en cualquier sala, y el atrezo y las puertas de cada zona (`zona`), que no
 * salen de la suya
 */
export type Ocupante = {
  id: string
  tipo: Pieza['tipo']
  nombre: string
  /** Zona a la que pertenecen el atrezo y las puertas */
  zona?: number
  /** Número o nombre corto para distinguir miniaturas iguales; en las puertas, su rótulo */
  alias?: string
  /** Bando de su barra: soltar encima una ficha del otro es atacarla */
  bando?: string
  /** Tipo de carta de atrezo: marca las casillas que ocupa */
  atrezo?: string
  imagen?: string
  /** La imagen es una ficha VTT, ya redonda y con su aro */
  vtt?: boolean
  caido?: boolean
  /** Ha terminado su turno: no se mueve hasta empezar otro */
  terminado?: boolean
}

/** Sala del mapa con el nombre de su zona */
export type SalaMapa = Sala & { nombre: string }

/** Distancia a partir de la que pulsar una ficha pasa a ser arrastrarla */
const UMBRAL_ARRASTRE = 8

/** Píxeles que avanza el mapa en cada paso mientras se arrastra una ficha sobre una flecha */
const PASO_AUTODESPLAZAMIENTO = 14

/** Ficha del otro bando bajo el puntero, en el mapa o en una barra: soltar ahí es atacarla */
function enemigoBajo(o: Ocupante, x: number, y: number): HTMLElement | undefined {
  const ficha = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-ficha]')
  return o.bando && ficha?.dataset.bando && ficha.dataset.bando !== o.bando ? ficha : undefined
}

/** Resalta el enemigo al que se atacaría (la misma clase que usan las barras) */
function marcarObjetivo(objetivo?: HTMLElement) {
  document.querySelectorAll('[data-ficha].objetivo').forEach((el) => el !== objetivo && el.classList.remove('objetivo'))
  objetivo?.classList.add('objetivo')
}

const piezaDe = (o: Ocupante, x: number, y: number, anterior?: Pieza): Pieza =>
  o.tipo === 'atrezo'
    ? { id: o.id, tipo: 'atrezo', atrezo: o.atrezo ?? '', x, y, girada: anterior?.tipo === 'atrezo' && anterior.girada }
    : { id: o.id, tipo: o.tipo, x, y }

const esFicha = (o: Ocupante) => o.tipo === 'miembro' || o.tipo === 'monstruo'

/** En el mapa, la puerta lleva solo su rótulo; en la bandeja, el nombre entero para saber cuál es */
function Contenido({ ocupante: o, enMapa = false }: { ocupante: Ocupante; enMapa?: boolean }) {
  if (o.tipo === 'atrezo') return <span className="pieza-nombre">{o.nombre}</span>
  if (o.tipo === 'puerta') return <span className="pieza-nombre">{enMapa ? (o.alias ?? o.nombre) : o.nombre}</span>
  return (
    <>
      {o.imagen ? (
        <img className={o.vtt ? 'pieza-vtt' : undefined} src={o.imagen} alt="" draggable={false} />
      ) : (
        <span className="miembro-iniciales">{o.nombre.slice(0, 2)}</span>
      )}
      {o.alias && <span className="miembro-alias">{o.alias}</span>}
    </>
  )
}

/** Contador de columnas o filas del mapa */
export function Medida({ etiqueta, valor, onCambiar }: { etiqueta: string; valor: number; onCambiar: (n: number) => void }) {
  return (
    <span className="mapa-medida">
      {etiqueta}
      <button type="button" className="icon-button" aria-label={`Menos ${etiqueta.toLowerCase()}`} disabled={valor <= 1} onClick={() => onCambiar(valor - 1)}>
        <Icono nombre="menos" />
      </button>
      <strong>{valor}</strong>
      <button type="button" className="icon-button" aria-label={`Más ${etiqueta.toLowerCase()}`} disabled={valor >= MAX_LADO} onClick={() => onCambiar(valor + 1)}>
        <Icono nombre="mas" />
      </button>
    </span>
  )
}

/** En todas las piezas, `pieza` va en casillas del mapa; `zona`, la de su sala */
type Props = {
  salas: SalaMapa[]
  /** Zona actual: su sala se resalta y, si su tamaño no está fijo, se ajusta */
  actual: number
  ocupantes: Ocupante[]
  /** Coloca o mueve atrezo o una puerta dentro de su zona */
  onColocar: (pieza: Pieza, zona: number) => void
  /** Devuelve una pieza a la bandeja: el atrezo y las puertas, de su zona; una ficha, de donde esté */
  onQuitar: (id: string, zona?: number) => void
  onGirar: (id: string, zona: number) => void
  onRedimensionar: (columnas: number, filas: number) => void
  /** Una ficha soltada sobre un enemigo lo ataca */
  onAtacar: (atacante: string, defensor: string) => void
  /** Tocar una miniatura (del grupo o un monstruo) abre su ficha */
  onFicha: (id: string) => void
  /** Un miembro del grupo o un monstruo entra en el mapa o cambia de casilla: quien lo recibe lo coloca */
  onMovido: (id: string, pieza: Pieza) => void
  /** Un miembro del grupo pisa una puerta de la zona `zona` (aún sin colocar) */
  onPuerta: (puerta: string, zona: number, id: string, pieza: Pieza) => void
  /** Se ha intentado mover a quien ya terminó su turno */
  onTerminado: (id: string) => void
}

/** La mazmorra en casillas: sus salas en su sitio; las fichas se arrastran desde la bandeja y de sala en sala */
export function MapaZona({ salas, actual, ocupantes, onColocar, onQuitar, onGirar, onRedimensionar, onAtacar, onFicha, onMovido, onPuerta, onTerminado }: Props) {
  const [elegida, setElegida] = useState<string | null>(null)
  const arrastre = useRef<{ x: number; y: number; dx: number; dy: number; moviendo: boolean } | null>(null)
  const [fantasma, setFantasma] = useState<{ x: number; y: number; ocupante: Ocupante } | null>(null)
  // casillas donde caería la pieza al soltarla, en rojo si no cabe
  const [destino, setDestino] = useState<{ pieza: Pieza; cabe: boolean } | null>(null)
  const caja = limites(salas)
  const salaActual = salas.find((s) => s.zona === actual)
  const colocadas = salas.flatMap((sala) =>
    sala.rejilla.piezas.flatMap((local) => {
      const ocupante = ocupantes.find((o) => o.id === local.id && (o.zona === undefined || o.zona === sala.zona))
      return ocupante ? [{ sala, local, pieza: aGlobal(sala, local), ocupante, clave: `${sala.zona}:${local.id}` }] : []
    }),
  )
  const colocada = (o: Ocupante) => colocadas.find((c) => c.ocupante === o)
  // en la bandeja, lo que falta por colocar: las fichas y lo de la zona actual
  const enBandeja = ocupantes.filter((o) => (o.zona === undefined || o.zona === actual) && !colocada(o))
  const seleccion = colocadas.find((c) => c.clave === elegida)

  // con casillas de al menos 50 px, la mazmorra no cabe: se desplaza con flechas
  const marco = useRef<HTMLDivElement>(null)
  const flechaIzquierda = useRef<HTMLButtonElement>(null)
  const flechaDerecha = useRef<HTMLButtonElement>(null)
  const [desborde, setDesborde] = useState({ izquierda: false, derecha: false })
  const medir = () => {
    const el = marco.current
    if (el) setDesborde({ izquierda: el.scrollLeft > 1, derecha: el.scrollLeft + el.clientWidth < el.scrollWidth - 1 })
  }
  useEffect(() => {
    const el = marco.current
    if (!el) return
    const observador = new ResizeObserver(medir)
    observador.observe(el)
    if (el.firstElementChild) observador.observe(el.firstElementChild)
    return () => observador.disconnect()
  }, [])
  // al cambiar de zona, su sala a la vista
  useEffect(() => {
    const el = marco.current
    const sala = el?.querySelector<HTMLElement>('.sala-fondo.actual')
    if (el && sala) el.scrollTo({ left: sala.offsetLeft - (el.clientWidth - sala.offsetWidth) / 2, behavior: 'smooth' })
  }, [actual])
  const desplazar = (sentido: 1 | -1) =>
    marco.current?.scrollBy({ left: sentido * marco.current.clientWidth * 0.8, behavior: 'smooth' })
  const flechas = desborde.izquierda || desborde.derecha

  // arrastrando una ficha sobre una flecha, el mapa avanza solo hasta soltarla o salir
  const autodesplazamiento = useRef<{ sentido: number; temporizador?: number }>({ sentido: 0 })
  const seguirBorde = (x = Number.NaN, y = Number.NaN) => {
    const sobre = (flecha: HTMLButtonElement | null) => {
      const r = flecha?.getBoundingClientRect()
      return r !== undefined && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
    }
    const auto = autodesplazamiento.current
    auto.sentido = sobre(flechaIzquierda.current) ? -1 : sobre(flechaDerecha.current) ? 1 : 0
    if (auto.sentido && auto.temporizador === undefined) {
      auto.temporizador = window.setInterval(() => marco.current?.scrollBy({ left: auto.sentido * PASO_AUTODESPLAZAMIENTO }), 30)
    } else if (!auto.sentido && auto.temporizador !== undefined) {
      window.clearInterval(auto.temporizador)
      auto.temporizador = undefined
    }
  }
  useEffect(() => () => window.clearInterval(autodesplazamiento.current.temporizador), [])

  /** Casilla del mapa bajo el puntero (la rejilla empieza en la esquina de la caja de salas) */
  const enMapa = (x: number, y: number) => {
    const c = casillaEn(x, y)
    return c && { x: c.x + caja.x, y: c.y + caja.y }
  }
  /** Dónde caería la pieza con el puntero ahí; el mobiliario se encaja dentro de su sala */
  const destinoEn = (o: Ocupante, x: number, y: number, dx = 0, dy = 0) => {
    const c = enMapa(x, y)
    if (!c) return
    const pieza = piezaDe(o, c.x - dx, c.y - dy, colocada(o)?.local)
    const sala = o.zona === undefined ? salaEn(salas, pieza.x, pieza.y) : salas.find((s) => s.zona === o.zona)
    return sala && !esFicha(o) ? aGlobal(sala, encajar(sala.rejilla, aLocal(sala, pieza))) : pieza
  }
  const resaltar = (o: Ocupante, pieza?: Pieza) => setDestino(pieza ? { pieza, cabe: Boolean(cabeEnMapa(salas, pieza, o.zona)) } : null)

  const arrastrar = (o: Ocupante) => ({
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      // se agarra por la casilla pulsada: el mobiliario grande no salta a su esquina
      const antes = colocada(o)?.pieza
      const agarre = antes && enMapa(e.clientX, e.clientY)
      arrastre.current = {
        x: e.clientX,
        y: e.clientY,
        dx: agarre && antes ? agarre.x - antes.x : 0,
        dy: agarre && antes ? agarre.y - antes.y : 0,
        moviendo: false,
      }
    },
    onPointerMove: (e: PointerEvent) => {
      const a = arrastre.current
      if (!a || (!a.moviendo && Math.hypot(e.clientX - a.x, e.clientY - a.y) < UMBRAL_ARRASTRE)) return
      // quien terminó su turno no se mueve: se avisa en lugar de arrastrarlo (tocarlo sigue abriendo su ficha)
      if (o.terminado) {
        arrastre.current = null
        return onTerminado(o.id)
      }
      a.moviendo = true
      setFantasma({ x: e.clientX, y: e.clientY, ocupante: o })
      const enemigo = enemigoBajo(o, e.clientX, e.clientY)
      marcarObjetivo(enemigo)
      seguirBorde(e.clientX, e.clientY)
      resaltar(o, enemigo ? undefined : destinoEn(o, e.clientX, e.clientY, a.dx, a.dy))
    },
    onPointerUp: (e: PointerEvent) => {
      const a = arrastre.current
      arrastre.current = null
      setFantasma(null)
      setDestino(null)
      marcarObjetivo()
      seguirBorde()
      if (!a) return
      const antes = colocada(o)
      if (!a.moviendo) {
        if (esFicha(o)) return onFicha(o.id)
        return antes && setElegida(elegida === antes.clave ? null : antes.clave)
      }
      const defensor = enemigoBajo(o, e.clientX, e.clientY)?.dataset.ficha
      if (defensor) return onAtacar(o.id, defensor)
      const pieza = destinoEn(o, e.clientX, e.clientY, a.dx, a.dy)
      // soltada fuera del mapa, vuelve a la bandeja
      if (!pieza) return antes && onQuitar(o.id, o.zona)
      const sala = cabeEnMapa(salas, pieza, o.zona)
      if (!sala || (antes && antes.pieza.x === pieza.x && antes.pieza.y === pieza.y)) return
      if (!esFicha(o)) return onColocar(pieza, sala.zona)
      // solo los héroes abren y cruzan puertas; los monstruos se quedan en ellas
      const local = aLocal(sala, pieza)
      const puerta = o.tipo === 'miembro' ? puertaEn(sala.rejilla, local.x, local.y) : undefined
      if (puerta) return onPuerta(puerta.id, sala.zona, o.id, pieza)
      onMovido(o.id, pieza)
    },
    onPointerCancel: () => {
      arrastre.current = null
      setFantasma(null)
      setDestino(null)
      marcarObjetivo()
      seguirBorde()
    },
  })

  // la rejilla abarca todas las salas: su casilla (1, 1) es la esquina de la caja
  const area = (p: { x: number; y: number }, columnas: number, filas: number): CSSProperties => ({
    gridColumn: `${p.x - caja.x + 1} / span ${columnas}`,
    gridRow: `${p.y - caja.y + 1} / span ${filas}`,
  })

  return (
    <section className="mapa-zona" aria-label="Mapa de la mazmorra">
      {/* con el tamaño fijado al descubrir la zona, ya no se cambia */}
      {salaActual && !salaActual.rejilla.fija && (
        <div className="mapa-medidas">
          <Medida etiqueta="Columnas" valor={salaActual.rejilla.columnas} onCambiar={(n) => onRedimensionar(n, salaActual.rejilla.filas)} />
          <Medida etiqueta="Filas" valor={salaActual.rejilla.filas} onCambiar={(n) => onRedimensionar(salaActual.rejilla.columnas, n)} />
        </div>
      )}

      <div className="rejilla-vista">
        {flechas && (
          <button
            ref={flechaIzquierda}
            type="button"
            className="rejilla-flecha"
            disabled={!desborde.izquierda}
            onClick={() => desplazar(-1)}
            aria-label="Ver las columnas de la izquierda"
          >
            <Icono nombre="volver" />
          </button>
        )}
        <div ref={marco} className="rejilla-marco" onScroll={medir}>
          <div
            className="rejilla"
            data-columnas={caja.columnas}
            data-filas={caja.filas}
            style={{ '--columnas': caja.columnas, '--filas': caja.filas } as CSSProperties}
          >
            {salas.map((sala) => (
              <span
                key={sala.zona}
                className={sala.zona === actual ? 'sala-fondo actual' : 'sala-fondo'}
                style={{ ...area(sala.origen, sala.rejilla.columnas, sala.rejilla.filas), '--columnas': sala.rejilla.columnas, '--filas': sala.rejilla.filas } as CSSProperties}
                aria-hidden="true"
              >
                <span className="sala-nombre">{sala.nombre}</span>
              </span>
            ))}
            {destino && (
              <span
                className={destino.cabe ? 'rejilla-destino' : 'rejilla-destino no-cabe'}
                style={area(destino.pieza, huella(destino.pieza).columnas, huella(destino.pieza).filas)}
                aria-hidden="true"
              />
            )}
            {colocadas.map(({ sala, local, pieza, ocupante, clave }) => {
              const { columnas, filas } = huella(pieza)
              return (
                <button
                  key={clave}
                  type="button"
                  className={`pieza pieza-${pieza.tipo}${pieza.tipo === 'puerta' ? ` pared-${pared(sala.rejilla, local)}` : ''}${elegida === clave ? ' elegida' : ''}${ocupante.caido ? ' caido' : ''}${ocupante.terminado ? ' terminado' : ''}`}
                  style={area(pieza, columnas, filas)}
                  data-ficha={esFicha(ocupante) ? pieza.id : undefined}
                  data-bando={ocupante.bando}
                  data-mapa
                  aria-label={ocupante.alias ? `${ocupante.nombre} (${ocupante.alias})` : ocupante.nombre}
                  {...arrastrar(ocupante)}
                >
                  <Contenido ocupante={ocupante} enMapa />
                </button>
              )
            })}
          </div>
        </div>
        {flechas && (
          <button
            ref={flechaDerecha}
            type="button"
            className="rejilla-flecha"
            disabled={!desborde.derecha}
            onClick={() => desplazar(1)}
            aria-label="Ver las columnas de la derecha"
          >
            <Icono nombre="derecha" />
          </button>
        )}
      </div>

      {seleccion && (
        <div className="mapa-seleccion">
          <strong>{seleccion.ocupante.nombre}</strong>
          {seleccion.local.tipo === 'atrezo' && huella(seleccion.local).columnas !== huella(seleccion.local).filas && (
            <button
              type="button"
              className="button mini"
              disabled={girar(seleccion.sala.rejilla, seleccion.local.id) === seleccion.sala.rejilla}
              title={girar(seleccion.sala.rejilla, seleccion.local.id) === seleccion.sala.rejilla ? 'Girado no cabe: apártalo antes' : undefined}
              onClick={() => onGirar(seleccion.local.id, seleccion.sala.zona)}
            >
              Girar
            </button>
          )}
          <button
            type="button"
            className="button mini secondary"
            onClick={() => {
              setElegida(null)
              onQuitar(seleccion.local.id, seleccion.ocupante.zona)
            }}
          >
            Quitar del mapa
          </button>
        </div>
      )}

      <div className="mapa-bandeja" aria-label="Sin colocar">
        {enBandeja.length ? (
          enBandeja.map((o) => (
            <button key={`${o.zona ?? ''}:${o.id}`} type="button" className={`pieza pieza-${o.tipo}${o.caido ? ' caido' : ''}${o.terminado ? ' terminado' : ''}`} aria-label={`Colocar ${o.nombre}`} {...arrastrar(o)}>
              <Contenido ocupante={o} />
            </button>
          ))
        ) : (
          <p className="nota">Todo está en el mapa.</p>
        )}
      </div>
      <p className="nota">
        Toca un héroe o un monstruo para ver su ficha y sus acciones. Arrastra las fichas hasta su casilla, de sala en
        sala, o, para atacar, encima de un enemigo; soltadas fuera del mapa, vuelven a la bandeja. Las puertas van en
        el borde de su sala: un héroe que pisa una sin explorar la abre y la sala nueva se pega a ella.
      </p>

      {fantasma && (
        <span className={`pieza pieza-${fantasma.ocupante.tipo} mapa-fantasma`} style={{ left: fantasma.x, top: fantasma.y }} aria-hidden="true">
          <Contenido ocupante={fantasma.ocupante} />
        </span>
      )}
    </section>
  )
}
