import { useEffect, useRef } from 'react'
import { Icono } from '../../../components/Icono'
import type { Mision } from '../../generar/lib/tipos'

/** Objetivo y reglas de la misión a mano durante la partida; se monta abierto */
export function ReglasMisionDialog({ mision: m, onCerrar }: { mision: Mision; onCerrar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => ref.current?.showModal(), [])

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="reglas-mision-titulo"
      onClose={onCerrar}
      onClick={(e) => e.target === ref.current && onCerrar()}
    >
      <div className="dialog-contenido reglas-mision">
        <header className="dialog-cabecera">
          <h2 id="reglas-mision-titulo">Misión</h2>
          <button type="button" className="icon-button" onClick={onCerrar} aria-label="Cerrar">
            <Icono nombre="cerrar" />
          </button>
        </header>
        <section>
          <h3>Objetivo</h3>
          <p>{m.objetivo}</p>
          <p className="nota">{m.salaObjetivo}</p>
        </section>
        <section>
          <h3>Regla especial</h3>
          <p>{m.reglaEspecial}</p>
        </section>
        {m.extras.length > 0 && (
          <section>
            <h3>Reglas extras</h3>
            {m.extras.map((ex) => (
              <p key={ex.nombre}>
                <strong>{ex.nombre}:</strong> {ex.texto}
              </p>
            ))}
          </section>
        )}
        <section>
          <h3>Enemigos</h3>
          <p>
            {m.faccion.nombre}. Errante: {m.faccion.errante}. Errante superior: {m.faccion.erranteSuperior}. Jefe Final:{' '}
            {m.jefe} ({m.tipoJefe}).
          </p>
        </section>
      </div>
    </dialog>
  )
}
