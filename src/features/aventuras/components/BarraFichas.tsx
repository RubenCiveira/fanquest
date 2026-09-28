import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { Icono } from '../../../components/Icono'
import { NaipeDialog } from '../../../components/NaipeDialog'

export type PanelFicha = {
  id: string
  label: ReactNode
  titulo: string
  tipo?: 'item' | 'habilidad' | 'hechizo'
  children: ReactNode
}

/** Personaje en la barra: retrato, Puntos de Cuerpo y su carta entera */
export type Ficha = {
  clave: string
  nombre: string
  retrato?: string
  pc: number
  cuerpo: number
  /** Nombre corto para distinguir miniaturas iguales */
  alias?: string
  carta: ReactNode
  acciones?: ReactNode
  resumen?: ReactNode
  inventario?: ReactNode
  hechizos?: ReactNode
  panelesIzquierda?: PanelFicha[]
  panelesDerecha?: PanelFicha[]
}

/** Distancia a partir de la que pulsar «Atacar» pasa a ser arrastrarlo */
const UMBRAL_ARRASTRE = 8

/** Soltar cerca de una ficha enemiga (p. ej. entre dos) también cuenta */
const MARGEN_OBJETIVO = 32

type Props = {
  etiqueta: string
  fichas: Ficha[]
  onVida: (clave: string, delta: 1 | -1) => void
  /** Aviso bajo el contador, p. ej. que a 0 PC el monstruo muere */
  nota?: string
  className?: string
  /** Bando de la barra: se ataca arrastrando hasta una ficha del otro */
  bando: string
  /** Atacar sin objetivo (se elige después) o soltando sobre un enemigo */
  onAtacar: (clave: string, objetivo?: string) => void
}

const iniciales = (texto: string) =>
  texto
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')

/** Héroes o monstruos a mano: su ficha y su contador de Puntos de Cuerpo */
/** Ficha enemiga bajo el puntero o, si no hay ninguna, la más cercana dentro del margen */
function enemigoEn(x: number, y: number, bando: string): HTMLElement | undefined {
  const bajo = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-ficha]')
  if (bajo) return bajo.dataset.bando !== bando ? bajo : undefined
  const distancia = (el: HTMLElement) => {
    const r = el.getBoundingClientRect()
    return Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom))
  }
  return [...document.querySelectorAll<HTMLElement>('[data-ficha]')]
    .filter((el) => el.dataset.bando !== bando && distancia(el) <= MARGEN_OBJETIVO)
    .toSorted((a, b) => distancia(a) - distancia(b))[0]
}

export function BarraFichas({ etiqueta, fichas, onVida, nota, className = '', bando, onAtacar }: Props) {
  const [abierta, setAbierta] = useState<string | null>(null)
  const [pestana, setPestana] = useState<'ficha' | 'inventario' | 'hechizos'>('ficha')
  const [panel, setPanel] = useState<PanelFicha | null>(null)
  const ficha = fichas.find((f) => f.clave === abierta)
  const barra = useRef<HTMLElement>(null)
  const lista = useRef<HTMLDivElement>(null)
  const [alto, setAlto] = useState<number>()
  const [desborde, setDesborde] = useState({ arriba: false, abajo: false })

  // la barra llega hasta la navegación inferior y, con más fichas de las que
  // caben, muestra flechas para recorrer la lista
  const medirLista = () => {
    const el = lista.current
    if (el) setDesborde({ arriba: el.scrollTop > 1, abajo: el.scrollTop + el.clientHeight < el.scrollHeight - 1 })
  }
  const medir = () => {
    const arriba = barra.current?.getBoundingClientRect().top
    const abajo = document.querySelector('.app-nav')?.getBoundingClientRect().top ?? window.innerHeight
    const cabecera = document.querySelector('.app-header')?.getBoundingClientRect().bottom ?? 0
    // al menos la mitad del alto entre la cabecera y la navegación
    if (arriba !== undefined) setAlto(Math.max((abajo - cabecera) / 2, abajo - arriba - 12))
    medirLista()
  }
  // con la nueva altura cambia lo que cabe
  useEffect(medirLista, [alto])
  useEffect(() => {
    medir()
    window.addEventListener('resize', medir)
    window.addEventListener('scroll', medir, { passive: true })
    return () => {
      window.removeEventListener('resize', medir)
      window.removeEventListener('scroll', medir)
    }
  }, [fichas.length])
  const desplazar = (sentido: 1 | -1) =>
    lista.current?.scrollBy({ top: sentido * lista.current.clientHeight * 0.8, behavior: 'smooth' })
  const flechas = desborde.arriba || desborde.abajo

  // «Atacar»: al pulsar se elige el enemigo en el diálogo; al arrastrar, se suelta sobre él
  const arrastre = useRef<{ clave: string; x: number; y: number; moviendo: boolean } | null>(null)
  const [fantasma, setFantasma] = useState<{ x: number; y: number } | null>(null)
  const marcar = (objetivo?: HTMLElement) => {
    document.querySelectorAll('.objetivo').forEach((el) => el !== objetivo && el.classList.remove('objetivo'))
    objetivo?.classList.add('objetivo')
  }
  const soltar = (e: PointerEvent, cancelar = false) => {
    const a = arrastre.current
    arrastre.current = null
    setFantasma(null)
    marcar()
    if (!a || cancelar) return
    if (!a.moviendo) return onAtacar(a.clave)
    const objetivo = enemigoEn(e.clientX, e.clientY, bando)?.dataset.ficha
    if (objetivo) onAtacar(a.clave, objetivo)
  }
  const atacar = (clave: string) => ({
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      arrastre.current = { clave, x: e.clientX, y: e.clientY, moviendo: false }
    },
    onPointerMove: (e: PointerEvent) => {
      const a = arrastre.current
      if (!a || (!a.moviendo && Math.hypot(e.clientX - a.x, e.clientY - a.y) < UMBRAL_ARRASTRE)) return
      a.moviendo = true
      setFantasma({ x: e.clientX, y: e.clientY })
      marcar(enemigoEn(e.clientX, e.clientY, bando))
    },
    onPointerUp: (e: PointerEvent) => soltar(e),
    onPointerCancel: (e: PointerEvent) => soltar(e, true),
  })

  return (
    <aside ref={barra} className={`partida-fichas ${className}`} aria-label={etiqueta} style={{ maxHeight: alto }}>
      {flechas && (
        <button type="button" className="icon-button barra-flecha" disabled={!desborde.arriba} onClick={() => desplazar(-1)} aria-label="Ver anteriores">
          <Icono nombre="arriba" />
        </button>
      )}
      <div ref={lista} className="partida-fichas-lista" onScroll={medirLista}>
      {fichas.map((f) => (
        <div key={f.clave} className="ficha-barra" data-ficha={f.clave} data-bando={bando}>
          <button
            type="button"
            className={f.pc ? 'miembro' : 'miembro caido'}
            onClick={() => {
              setAbierta(f.clave)
              setPestana('ficha')
              setPanel(null)
            }}
            aria-label={`${f.alias ? `${f.alias}, ` : ''}${f.nombre}: ${f.pc} de ${f.cuerpo} PC`}
          >
            {f.alias && <span className="miembro-alias">{f.alias}</span>}
            {f.retrato ? <img src={f.retrato} alt="" /> : <span className="miembro-iniciales">{iniciales(f.nombre)}</span>}
          </button>
          <span className="ficha-pie">
            <span className="miembro-vida">
              {f.pc}/{f.cuerpo}
            </span>
            {f.pc > 0 && (
              <button type="button" className="icon-button atacar" aria-label={`${f.alias ?? f.nombre} ataca`} title="Pulsa o arrastra hasta un enemigo" {...atacar(f.clave)}>
                <Icono nombre="espada" />
              </button>
            )}
          </span>
        </div>
      ))}
      </div>
      {flechas && (
        <button type="button" className="icon-button barra-flecha" disabled={!desborde.abajo} onClick={() => desplazar(1)} aria-label="Ver siguientes">
          <Icono nombre="abajo" />
        </button>
      )}

      {ficha && (
        <NaipeDialog
          etiqueta={ficha.nombre}
          onCerrar={() => {
            setPanel(null)
            setAbierta(null)
          }}
          acciones={
            <div className="ficha-dialog-acciones">
              <div className="fila-copias">
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Perder 1 PC"
                  disabled={!ficha.pc}
                  onClick={() => onVida(ficha.clave, -1)}
                >
                  <Icono nombre="menos" />
                </button>
                <span>
                  {ficha.pc} / {ficha.cuerpo} PC
                </span>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Recuperar 1 PC"
                  disabled={ficha.pc >= ficha.cuerpo}
                  onClick={() => onVida(ficha.clave, 1)}
                >
                  <Icono nombre="mas" />
                </button>
              </div>
              {ficha.resumen}
              {nota && <p className="nota">{nota}</p>}
              {ficha.acciones ?? (ficha.pc > 0 && (
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    setAbierta(null)
                    onAtacar(ficha.clave)
                  }}
                >
                  <Icono nombre="espada" />
                  Atacar
                </button>
              ))}
            </div>
          }
        >
          {ficha.panelesIzquierda?.length || ficha.panelesDerecha?.length ? (
            <div className="ficha-popup-marco">
              {ficha.panelesIzquierda?.length ? (
                <div className="ficha-pestanas ficha-pestanas-izquierda" aria-label="Objetos del inventario">
                  {ficha.panelesIzquierda.map((p) => (
                    <button key={p.id} type="button" className={`${panel?.id === p.id ? 'activo' : ''} ${p.tipo ?? ''}`} onClick={() => setPanel(p)} title={p.titulo}>
                      {p.label}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="ficha-popup-centro">{ficha.carta}</div>
              {ficha.panelesDerecha?.length ? (
                <div className="ficha-pestanas ficha-pestanas-derecha" aria-label="Habilidades y hechizos">
                  {ficha.panelesDerecha.map((p) => (
                    <button key={p.id} type="button" className={`${panel?.id === p.id ? 'activo' : ''} ${p.tipo ?? ''}`} onClick={() => setPanel(p)} title={p.titulo}>
                      {p.label}
                    </button>
                  ))}
                </div>
              ) : null}
              {panel && (
                <div className="ficha-panel-popover" role="dialog" aria-label={panel.titulo}>
                  <header>
                    <h3>{panel.titulo}</h3>
                    <button type="button" className="icon-button" onClick={() => setPanel(null)} aria-label="Cerrar">
                      <Icono nombre="cerrar" />
                    </button>
                  </header>
                  {panel.children}
                </div>
              )}
            </div>
          ) : ficha.inventario || ficha.hechizos ? (
            <>
              <div className="naipes-tabs" role="tablist" aria-label={`Contenido de ${ficha.nombre}`}>
                <button type="button" role="tab" aria-selected={pestana === 'ficha'} className={pestana === 'ficha' ? 'activo' : undefined} onClick={() => setPestana('ficha')}>
                  Ficha
                </button>
                {ficha.inventario && (
                  <button type="button" role="tab" aria-selected={pestana === 'inventario'} className={pestana === 'inventario' ? 'activo' : undefined} onClick={() => setPestana('inventario')}>
                    Inventario
                  </button>
                )}
                {ficha.hechizos && (
                  <button type="button" role="tab" aria-selected={pestana === 'hechizos'} className={pestana === 'hechizos' ? 'activo' : undefined} onClick={() => setPestana('hechizos')}>
                    Hechizos
                  </button>
                )}
              </div>
              {pestana === 'ficha' ? ficha.carta : pestana === 'inventario' ? ficha.inventario : ficha.hechizos}
            </>
          ) : (
            ficha.carta
          )}
        </NaipeDialog>
      )}

      {fantasma && (
        <span className="fantasma-ataque" style={{ left: fantasma.x, top: fantasma.y }} aria-hidden="true">
          <Icono nombre="espada" />
        </span>
      )}
    </aside>
  )
}
