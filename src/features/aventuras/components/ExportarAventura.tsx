import { useEffect, useRef, useState } from 'react'
import { Icono } from '../../../components/Icono'
import { registrarEvento } from '../../../lib/matomo'
import type { Mision } from '../../generar/lib/tipos'
import { exportarMision, nombreArchivo } from '../lib/editarMision'

/** Descargar la aventura como .json o copiar su JSON para compartirla */
export function ExportarAventura({ mision }: { mision: Mision }) {
  const [copiado, setCopiado] = useState(false)

  const descargar = () => {
    const url = URL.createObjectURL(new Blob([exportarMision(mision)], { type: 'application/json' }))
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = nombreArchivo(mision)
    enlace.click()
    URL.revokeObjectURL(url)
    registrarEvento('Aventuras', 'Exportar')
  }

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(exportarMision(mision))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch {
      alert('No se pudo copiar el JSON.')
    }
  }

  return (
    <>
      <button type="button" className="button secondary" onClick={descargar}>
        Exportar .json
      </button>
      <button type="button" className="button secondary" onClick={copiar}>
        {copiado ? 'JSON copiado' : 'Copiar JSON'}
      </button>
    </>
  )
}

/** Exportar desde la partida; se monta abierto */
export function ExportarDialog({ mision, onCerrar }: { mision: Mision; onCerrar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => ref.current?.showModal(), [])

  return (
    <dialog ref={ref} className="dialog" aria-labelledby="exportar-titulo" onClose={onCerrar} onClick={(e) => e.target === ref.current && onCerrar()}>
      <div className="dialog-contenido">
        <header className="dialog-cabecera">
          <h2 id="exportar-titulo">Exportar aventura</h2>
          <button type="button" className="icon-button" onClick={onCerrar} aria-label="Cerrar">
            <Icono nombre="cerrar" />
          </button>
        </header>
        <p>La aventura (textos, preparación y reglas especiales) como JSON para compartirla o guardarla aparte. La partida en curso no se incluye.</p>
        <div className="fila-botones">
          <ExportarAventura mision={mision} />
        </div>
      </div>
    </dialog>
  )
}
