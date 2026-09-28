import { useEffect, useRef, useState } from 'react'
import { Icono } from '../../../components/Icono'
import { candidatosDeCategoria, type Contexto } from '../lib/partida'

/** Categorías de monstruos de Aventuras Infinitas */
const CATEGORIAS = [1, 2, 3, 4, 5, 6, 7, 8]

type Props = {
  contexto: Contexto
  onTirar: (categoria: number, cantidad: number) => void
  onAnadir: (monstruo: string, avanzado: boolean) => void
  onCerrar: () => void
}

/** Añade monstruos escogidos o sorteados; se monta abierto */
export function MonstruosDialog({ contexto, onTirar, onAnadir, onCerrar }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [categoria, setCategoria] = useState(1)
  const [cantidad, setCantidad] = useState(Math.max(1, contexto.heroes))
  const [seleccion, setSeleccion] = useState('')
  const [avanzado, setAvanzado] = useState(false)
  const candidatos = candidatosDeCategoria(contexto, categoria)
  const opciones = Object.entries(contexto.monstruos).toSorted(([, a], [, b]) => a.nombre.localeCompare(b.nombre, 'es'))
  const busqueda = seleccion.trim().toLocaleLowerCase('es')
  const sugerencias = opciones
    .filter(([id, m]) => !busqueda || id.includes(busqueda) || m.nombre.toLocaleLowerCase('es').includes(busqueda))
    .slice(0, 8)
  const monstruoElegido = opciones.find(([id, m]) => id === seleccion || m.nombre === seleccion)?.[0]

  useEffect(() => ref.current?.showModal(), [])

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="monstruos-titulo"
      onClose={onCerrar}
      onClick={(e) => e.target === ref.current && onCerrar()}
    >
      <div className="dialog-contenido">
        <header className="dialog-cabecera">
          <h2 id="monstruos-titulo">Añadir monstruos</h2>
          <button type="button" className="icon-button" onClick={onCerrar} aria-label="Cerrar">
            <Icono nombre="cerrar" />
          </button>
        </header>

        <details open>
          <summary>Escoger monstruos</summary>
          <div className="acciones-dialogo">
            <label className="campo monstruo-buscador">
              <span>Monstruo</span>
              <input type="search" value={seleccion} onChange={(e) => setSeleccion(e.target.value)} placeholder="Goblin, zombi…" autoComplete="off" />
            </label>
            <div className="monstruo-sugerencias" role="listbox" aria-label="Monstruos disponibles">
              {sugerencias.map(([id, m]) => (
                <button
                  key={id}
                  type="button"
                  className={id === monstruoElegido ? 'monstruo-opcion elegida' : 'monstruo-opcion'}
                  onClick={() => setSeleccion(m.nombre)}
                >
                  <strong>{m.nombre}</strong>
                  <span>Categoría {m.categoria ?? 'sin categoría'} · {id}</span>
                </button>
              ))}
              {!sugerencias.length && <p className="nota">No hay monstruos que coincidan con esa búsqueda.</p>}
            </div>
            <label className="regla-opcion">
              <input type="checkbox" checked={avanzado} onChange={() => setAvanzado(!avanzado)} />
              <span>Usar versión avanzada si existe</span>
            </label>
            <button
              type="button"
              className="button"
              disabled={!monstruoElegido}
              onClick={() => {
                if (!monstruoElegido) return
                onAnadir(monstruoElegido, avanzado)
                setSeleccion('')
              }}
            >
              Añadir monstruo
            </button>
          </div>
        </details>

        <details>
          <summary>Añadir al azar</summary>
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
        </details>
      </div>
    </dialog>
  )
}
