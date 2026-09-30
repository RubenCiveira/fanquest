import { useEffect, useRef } from 'react'
import type { Elemento, Jugador, ModoActivacion } from '../gamemap'

/** Aviso de a qué jugador le toca, al terminar una activación; se monta abierto */
export function AvisoTurno({ jugador, modo, onCerrar }: { jugador: Jugador; modo?: ModoActivacion; onCerrar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => ref.current?.showModal(), [])

  return (
    <dialog ref={ref} className="dialog" aria-labelledby="turno-titulo" onClose={onCerrar}>
      <form method="dialog" className="dialog-contenido">
        <h2 id="turno-titulo">Le toca a {jugador.nombre}</h2>
        {modo && <p>Empieza en modo {modo}.</p>}
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

/** Aviso de que todas las activaciones del turno han terminado */
export function AvisoFinTurno({ onTerminar }: { onTerminar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => ref.current?.showModal(), [])

  return (
    <dialog ref={ref} className="dialog" aria-labelledby="fin-turno-titulo" onClose={onTerminar}>
      <form method="dialog" className="dialog-contenido">
        <h2 id="fin-turno-titulo">Turno terminado</h2>
        <p>Todos los jugadores han completado sus activaciones.</p>
        <div className="fila-botones">
          <button type="submit" className="button" autoFocus>
            Empezar siguiente turno
          </button>
        </div>
      </form>
    </dialog>
  )
}

/** Aviso del resultado de buscar trampas en una estancia */
export function AvisoTrampas({ titulo, texto, onCerrar }: { titulo: string; texto: string; onCerrar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => ref.current?.showModal(), [])

  return (
    <dialog ref={ref} className="dialog" aria-labelledby="trampas-titulo" onClose={onCerrar}>
      <form method="dialog" className="dialog-contenido">
        <h2 id="trampas-titulo">{titulo}</h2>
        <p>{texto}</p>
        <div className="fila-botones">
          <button type="submit" className="button" autoFocus>
            Entendido
          </button>
        </div>
      </form>
    </dialog>
  )
}

/** Diálogo para escoger qué mueble adyacente se revisa */
export function DialogoRevisarMueble({ muebles, onElegir, onCancelar }: { muebles: Elemento[]; onElegir: (mueble: string) => void; onCancelar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => ref.current?.showModal(), [])

  return (
    <dialog ref={ref} className="dialog" aria-labelledby="revisar-mueble-titulo" onClose={onCancelar}>
      <form method="dialog" className="dialog-contenido">
        <h2 id="revisar-mueble-titulo">Revisar mueble</h2>
        <p>Elige qué mueble quieres revisar.</p>
        <div className="fila-botones">
          {muebles.map((mueble) => (
            <button key={mueble.id} type="button" className="button" onClick={() => onElegir(mueble.id)}>
              {mueble.nombre}
            </button>
          ))}
          <button type="submit" className="button secondary">
            Cancelar
          </button>
        </div>
      </form>
    </dialog>
  )
}
