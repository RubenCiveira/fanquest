import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { Icono } from '../../../components/Icono'
import {
  cabe,
  casillaEn,
  colocar,
  encajar,
  girar,
  huella,
  MAX_LADO,
  quitar,
  redimensionar,
  type Pieza,
  type Rejilla,
} from '../lib/rejilla'

/** Lo que se puede poner en el mapa: miembros del grupo, monstruos en juego y atrezo de la zona */
export type Ocupante = {
  id: string
  tipo: Pieza['tipo']
  nombre: string
  /** Número o nombre corto para distinguir miniaturas iguales */
  alias?: string
  /** Bando de su barra: soltar encima una ficha del otro es atacarla */
  bando?: string
  /** Tipo de carta de atrezo: marca las casillas que ocupa */
  atrezo?: string
  imagen?: string
  /** La imagen es una ficha VTT, ya redonda y con su aro */
  vtt?: boolean
  caido?: boolean
}

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

function Contenido({ ocupante: o }: { ocupante: Ocupante }) {
  if (o.tipo === 'atrezo') return <span className="pieza-nombre">{o.nombre}</span>
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

function Medida({ etiqueta, valor, onCambiar }: { etiqueta: string; valor: number; onCambiar: (n: number) => void }) {
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

type Props = {
  rejilla: Rejilla
  ocupantes: Ocupante[]
  onCambiar: (cambio: (r: Rejilla) => Rejilla) => void
  /** Una ficha soltada sobre un enemigo lo ataca */
  onAtacar: (atacante: string, defensor: string) => void
  /** Tocar una miniatura (del grupo o un monstruo) abre su ficha */
  onFicha: (id: string) => void
}

/** La zona en casillas: las fichas se arrastran desde la bandeja y por el mapa */
export function MapaZona({ rejilla, ocupantes, onCambiar, onAtacar, onFicha }: Props) {
  const [elegida, setElegida] = useState<string | null>(null)
  const arrastre = useRef<{ x: number; y: number; dx: number; dy: number; moviendo: boolean } | null>(null)
  const [fantasma, setFantasma] = useState<{ x: number; y: number; ocupante: Ocupante } | null>(null)
  // casillas donde caería la pieza al soltarla, en rojo si no cabe
  const [destino, setDestino] = useState<{ pieza: Pieza; cabe: boolean } | null>(null)
  const colocadas = rejilla.piezas.flatMap((pieza) => {
    const ocupante = ocupantes.find((o) => o.id === pieza.id)
    return ocupante ? [{ pieza, ocupante }] : []
  })
  const enBandeja = ocupantes.filter((o) => !colocadas.some((c) => c.ocupante.id === o.id))
  const seleccion = colocadas.find((c) => c.pieza.id === elegida)

  // con casillas de al menos 50 px, una sala grande no cabe: se desplaza con flechas
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

  /** Dónde caería la pieza con el puntero ahí; fuera del mapa, en ninguna parte */
  const destinoEn = (o: Ocupante, x: number, y: number, dx = 0, dy = 0) => {
    const casilla = casillaEn(x, y)
    const anterior = rejilla.piezas.find((p) => p.id === o.id)
    return casilla && encajar(rejilla, piezaDe(o, casilla.x - dx, casilla.y - dy, anterior))
  }
  const resaltar = (pieza?: Pieza) => setDestino(pieza ? { pieza, cabe: cabe(rejilla, pieza) } : null)

  const arrastrar = (o: Ocupante, anterior?: Pieza) => ({
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      // se agarra por la casilla pulsada: el mobiliario grande no salta a su esquina
      const agarre = anterior && casillaEn(e.clientX, e.clientY)
      arrastre.current = {
        x: e.clientX,
        y: e.clientY,
        dx: agarre ? agarre.x - anterior.x : 0,
        dy: agarre ? agarre.y - anterior.y : 0,
        moviendo: false,
      }
    },
    onPointerMove: (e: PointerEvent) => {
      const a = arrastre.current
      if (!a || (!a.moviendo && Math.hypot(e.clientX - a.x, e.clientY - a.y) < UMBRAL_ARRASTRE)) return
      a.moviendo = true
      setFantasma({ x: e.clientX, y: e.clientY, ocupante: o })
      const enemigo = enemigoBajo(o, e.clientX, e.clientY)
      marcarObjetivo(enemigo)
      seguirBorde(e.clientX, e.clientY)
      resaltar(enemigo ? undefined : destinoEn(o, e.clientX, e.clientY, a.dx, a.dy))
    },
    onPointerUp: (e: PointerEvent) => {
      const a = arrastre.current
      arrastre.current = null
      setFantasma(null)
      setDestino(null)
      marcarObjetivo()
      seguirBorde()
      if (!a) return
      if (!a.moviendo) {
        if (o.tipo !== 'atrezo') return onFicha(o.id)
        return anterior && setElegida(elegida === o.id ? null : o.id)
      }
      const defensor = enemigoBajo(o, e.clientX, e.clientY)?.dataset.ficha
      if (defensor) return onAtacar(o.id, defensor)
      const pieza = destinoEn(o, e.clientX, e.clientY, a.dx, a.dy)
      // soltada fuera del mapa, vuelve a la bandeja
      if (pieza) onCambiar((r) => colocar(r, pieza))
      else if (anterior) onCambiar((r) => quitar(r, o.id))
    },
    onPointerCancel: () => {
      arrastre.current = null
      setFantasma(null)
      setDestino(null)
      marcarObjetivo()
      seguirBorde()
    },
  })

  return (
    <section className="mapa-zona" aria-label="Mapa de la zona">
      <div className="mapa-medidas">
        <Medida etiqueta="Columnas" valor={rejilla.columnas} onCambiar={(n) => onCambiar((r) => redimensionar(r, n, r.filas))} />
        <Medida etiqueta="Filas" valor={rejilla.filas} onCambiar={(n) => onCambiar((r) => redimensionar(r, r.columnas, n))} />
      </div>

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
            data-columnas={rejilla.columnas}
            data-filas={rejilla.filas}
            style={{ '--columnas': rejilla.columnas, '--filas': rejilla.filas } as CSSProperties}
          >
            {destino && (
              <span
                className={destino.cabe ? 'rejilla-destino' : 'rejilla-destino no-cabe'}
                style={{
                  gridColumn: `${destino.pieza.x + 1} / span ${huella(destino.pieza).columnas}`,
                  gridRow: `${destino.pieza.y + 1} / span ${huella(destino.pieza).filas}`,
                }}
                aria-hidden="true"
              />
            )}
            {colocadas.map(({ pieza, ocupante }) => {
              const { columnas, filas } = huella(pieza)
              return (
                <button
                  key={pieza.id}
                  type="button"
                  className={`pieza pieza-${pieza.tipo}${elegida === pieza.id ? ' elegida' : ''}${ocupante.caido ? ' caido' : ''}`}
                  style={{ gridColumn: `${pieza.x + 1} / span ${columnas}`, gridRow: `${pieza.y + 1} / span ${filas}` }}
                  data-ficha={pieza.tipo === 'atrezo' ? undefined : pieza.id}
                  data-bando={ocupante.bando}
                  data-mapa
                  aria-label={ocupante.alias ? `${ocupante.nombre} (${ocupante.alias})` : ocupante.nombre}
                  {...arrastrar(ocupante, pieza)}
                >
                  <Contenido ocupante={ocupante} />
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
          {seleccion.pieza.tipo === 'atrezo' && huella(seleccion.pieza).columnas !== huella(seleccion.pieza).filas && (
            <button
              type="button"
              className="button mini"
              disabled={girar(rejilla, seleccion.pieza.id) === rejilla}
              title={girar(rejilla, seleccion.pieza.id) === rejilla ? 'Girado no cabe: apártalo antes' : undefined}
              onClick={() => onCambiar((r) => girar(r, seleccion.pieza.id))}
            >
              Girar
            </button>
          )}
          <button
            type="button"
            className="button mini secondary"
            onClick={() => {
              setElegida(null)
              onCambiar((r) => quitar(r, seleccion.pieza.id))
            }}
          >
            Quitar del mapa
          </button>
        </div>
      )}

      <div className="mapa-bandeja" aria-label="Sin colocar">
        {enBandeja.length ? (
          enBandeja.map((o) => (
            <button key={o.id} type="button" className={`pieza pieza-${o.tipo}${o.caido ? ' caido' : ''}`} aria-label={`Colocar ${o.nombre}`} {...arrastrar(o)}>
              <Contenido ocupante={o} />
            </button>
          ))
        ) : (
          <p className="nota">Todo está en el mapa.</p>
        )}
      </div>
      <p className="nota">
        Toca un héroe o un monstruo para ver su ficha y sus acciones. Arrastra las fichas hasta su casilla o, para
        atacar, encima de un enemigo; soltadas fuera del mapa, vuelven a la bandeja. Toca el atrezo para girarlo o
        quitarlo.
      </p>

      {fantasma && (
        <span className={`pieza pieza-${fantasma.ocupante.tipo} mapa-fantasma`} style={{ left: fantasma.x, top: fantasma.y }} aria-hidden="true">
          <Contenido ocupante={fantasma.ocupante} />
        </span>
      )}
    </section>
  )
}
