import { useEffect, useRef, type ReactNode } from 'react'
import { Icono } from './Icono'

type Props = {
  titulo: string
  children: ReactNode
  /** Texto del botón que confirma */
  accion: string
  onConfirmar: () => void
  onCerrar: () => void
}

/** Confirmación de una acción que no se puede deshacer; se monta abierta */
export function ConfirmarDialog({ titulo, children, accion, onConfirmar, onCerrar }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => ref.current?.showModal(), [])

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="confirmar-titulo"
      onClose={onCerrar}
      onClick={(e) => e.target === ref.current && onCerrar()}
    >
      <div className="dialog-contenido">
        <header className="dialog-cabecera">
          <h2 id="confirmar-titulo">{titulo}</h2>
          <button type="button" className="icon-button" onClick={onCerrar} aria-label="Cerrar">
            <Icono nombre="cerrar" />
          </button>
        </header>
        <p>{children}</p>
        <div className="fila-botones">
          <button type="button" className="button secondary" onClick={onCerrar}>
            Cancelar
          </button>
          <button
            type="button"
            className="button peligro"
            onClick={() => {
              onConfirmar()
              onCerrar()
            }}
          >
            {accion}
          </button>
        </div>
      </div>
    </dialog>
  )
}
