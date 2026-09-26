import { useEffect, useRef } from 'react'
import { Form } from 'react-router'
import { Icono } from '../../../components/Icono'

type Props = {
  titulo: string
  onCerrar: () => void
}

/** Confirmación del borrado; se monta solo mientras está abierto */
export function BorrarAventuraDialog({ titulo, onCerrar }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => ref.current?.showModal(), [])

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="borrar-titulo"
      onClose={onCerrar}
      onClick={(e) => e.target === ref.current && onCerrar()}
    >
      <Form method="post" className="dialog-contenido">
        <header className="dialog-cabecera">
          <h2 id="borrar-titulo">Borrar aventura</h2>
          <button type="button" className="icon-button" onClick={onCerrar} aria-label="Cerrar">
            <Icono nombre="cerrar" />
          </button>
        </header>

        <p>
          Se borrará «{titulo}» de este navegador. No se puede deshacer.
        </p>

        <div className="fila-botones">
          <button type="button" className="button secondary" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" name="intent" value="borrar" className="button peligro">
            Borrar
          </button>
        </div>
      </Form>
    </dialog>
  )
}
