import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Icono } from '../../../components/Icono'
import type { Mision } from '../../generar/lib/tipos'
import { importarMision } from '../lib/editarMision'

type Props = {
  /** Lo que falte en el JSON toma estos valores */
  base: Mision
  onImportar: (m: Mision) => void
  onCerrar: () => void
}

/** Pegar el JSON de una aventura o abrir un .json exportado; se monta abierto */
export function ImportarDialog({ base, onImportar, onCerrar }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [texto, setTexto] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => ref.current?.showModal(), [])

  const pegar = async () => {
    try {
      setTexto(await navigator.clipboard.readText())
      setError(null)
    } catch {
      setError('El navegador no deja leer el portapapeles: pega el JSON en el cuadro.')
    }
  }

  const abrir = async (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    if (archivo) setTexto(await archivo.text())
    setError(null)
  }

  const importar = () => {
    try {
      onImportar(importarMision(texto, base))
      onCerrar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo importar.')
    }
  }

  return (
    <dialog ref={ref} className="dialog" aria-labelledby="importar-titulo" onClose={onCerrar} onClick={(e) => e.target === ref.current && onCerrar()}>
      <div className="dialog-contenido">
        <header className="dialog-cabecera">
          <h2 id="importar-titulo">Importar aventura</h2>
          <button type="button" className="icon-button" onClick={onCerrar} aria-label="Cerrar">
            <Icono nombre="cerrar" />
          </button>
        </header>
        <p className="nota">Sustituye lo que hay en el formulario. No se guarda hasta pulsar «Guardar aventura».</p>
        <div className="fila-botones">
          <button type="button" className="button secondary" onClick={pegar}>
            Pegar del portapapeles
          </button>
          <label className="button secondary">
            Abrir .json
            <input type="file" accept="application/json,.json" className="oculto" onChange={abrir} />
          </label>
        </div>
        <label className="campo">
          JSON de la aventura
          <textarea rows={8} value={texto} onChange={(e) => setTexto(e.target.value)} spellCheck={false} />
        </label>
        {error && (
          <p className="nota mal" role="alert">
            {error}
          </p>
        )}
        <button type="button" className="button" disabled={!texto.trim()} onClick={importar}>
          Importar
        </button>
      </div>
    </dialog>
  )
}
