import { useEffect, useRef, type ReactNode } from 'react'
import { Icono } from './Icono'

type Props = {
  etiqueta: string
  /** El naipe en su variante completa */
  children: ReactNode
  /** Botones bajo el naipe */
  acciones?: ReactNode
  onCerrar: () => void
}

/** Un naipe entero sobre la mesa; se monta abierto */
export function NaipeDialog({ etiqueta, children, acciones, onCerrar }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => ref.current?.showModal(), [])

  return (
    <dialog
      ref={ref}
      className="dialog dialog-carta"
      aria-label={etiqueta}
      onClose={onCerrar}
      onClick={(e) => e.target === ref.current && onCerrar()}
    >
      <button type="button" className="icon-button dialog-carta-cerrar" onClick={onCerrar} aria-label="Cerrar">
        <Icono nombre="cerrar" />
      </button>
      {children}
      {acciones && <div className="dialog-carta-acciones">{acciones}</div>}
    </dialog>
  )
}
