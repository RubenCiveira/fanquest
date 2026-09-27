import { useEffect, useRef, useState } from 'react'
import { Icono } from '../../../components/Icono'
import { candidatosDeCategoria, type Contexto } from '../lib/partida'

/** Categorías de monstruos de Aventuras Infinitas */
const CATEGORIAS = [1, 2, 3, 4, 5, 6, 7, 8]

type Props = {
  contexto: Contexto
  onTirar: (categoria: number, cantidad: number) => void
  onCerrar: () => void
}

/** Cuántos monstruos y de qué categoría se sortean; se monta abierto */
export function MonstruosAlAzarDialog({ contexto, onTirar, onCerrar }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [categoria, setCategoria] = useState(1)
  const [cantidad, setCantidad] = useState(Math.max(1, contexto.heroes))
  const candidatos = candidatosDeCategoria(contexto, categoria)

  useEffect(() => ref.current?.showModal(), [])

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="azar-titulo"
      onClose={onCerrar}
      onClick={(e) => e.target === ref.current && onCerrar()}
    >
      <div className="dialog-contenido">
        <header className="dialog-cabecera">
          <h2 id="azar-titulo">Monstruos al azar</h2>
          <button type="button" className="icon-button" onClick={onCerrar} aria-label="Cerrar">
            <Icono nombre="cerrar" />
          </button>
        </header>

        <fieldset className="azar-categorias">
          <legend>Categoría</legend>
          {CATEGORIAS.map((c) => {
            const n = candidatosDeCategoria(contexto, c).length
            return (
              <button
                key={c}
                type="button"
                className={c === categoria ? 'chip elegida' : 'chip'}
                aria-pressed={c === categoria}
                disabled={!n}
                onClick={() => setCategoria(c)}
              >
                {c}
              </button>
            )
          })}
        </fieldset>
        <p className="nota">
          Se sortea con 1D{candidatos.length} entre: {candidatos.map((id) => contexto.monstruos[id]?.nombre ?? id).join(', ')}.
        </p>

        <div className="editar-puertas">
          <span>Cantidad</span>
          <span className="contador">
            <button type="button" className="icon-button" aria-label="Un monstruo menos" disabled={cantidad <= 1} onClick={() => setCantidad(cantidad - 1)}>
              <Icono nombre="menos" />
            </button>
            <span>{cantidad}</span>
            <button type="button" className="icon-button" aria-label="Un monstruo más" onClick={() => setCantidad(cantidad + 1)}>
              <Icono nombre="mas" />
            </button>
          </span>
        </div>

        <button
          type="button"
          className="button"
          disabled={!candidatos.length}
          onClick={() => {
            onTirar(categoria, cantidad)
            onCerrar()
          }}
        >
          <Icono nombre="dado" />
          Tirar {cantidad} {cantidad === 1 ? 'vez' : 'veces'}
        </button>
      </div>
    </dialog>
  )
}
