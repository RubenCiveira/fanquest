import { useEffect, useRef } from 'react'
import type { Jugador } from '../gamemap'

/** Aviso de a qué jugador le toca, al terminar una activación; se monta abierto */
export function AvisoTurno({ jugador, onCerrar }: { jugador: Jugador; onCerrar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => ref.current?.showModal(), [])

  return (
    <dialog ref={ref} className="dialog" aria-labelledby="turno-titulo" onClose={onCerrar}>
      <form method="dialog" className="dialog-contenido">
        <h2 id="turno-titulo">Le toca a {jugador.nombre}</h2>
        <p>{jugador.tipo === 'ia' ? 'Juega la inteligencia artificial.' : 'Elige una miniatura suya para activarla.'}</p>
        <div className="fila-botones">
          <button type="submit" className="button" autoFocus>
            Entendido
          </button>
        </div>
      </form>
    </dialog>
  )
}
