import { useEffect, useRef, useState } from 'react'
import { Icono } from '../../../components/Icono'
import { REGLAS_EXTRAS } from '../config/reglasExtras'
import { probabilidades, reglaActiva } from '../lib/reglasExtras'
import type { ConfigExtras } from '../lib/tipos'

type Props = {
  config: ConfigExtras
  onGuardar: (config: ConfigExtras) => void
  onCerrar: () => void
}

const porcentaje = (valor: string) =>
  Math.max(0, Math.min(100, Number(valor) || 0))

/** Se monta solo mientras está abierto */
export function ReglasExtrasDialog({ config, onGuardar, onCerrar }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [borrador, setBorrador] = useState(config)

  useEffect(() => ref.current?.showModal(), [])

  const { ninguna } = probabilidades(borrador)
  const sumaExcede = borrador.probUna + borrador.probDos > 100
  const marcar = (ids: string[], activa: boolean) =>
    setBorrador((b) => ({
      ...b,
      activas: { ...b.activas, ...Object.fromEntries(ids.map((id) => [id, activa])) },
    }))
  const todas = REGLAS_EXTRAS.reglas.map(({ id }) => id)

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="extras-titulo"
      onClose={onCerrar}
      onClick={(e) => e.target === ref.current && onCerrar()}
    >
      <form
        method="dialog"
        onSubmit={() => onGuardar(borrador)}
        className="dialog-contenido"
      >
        <header className="dialog-cabecera">
          <h2 id="extras-titulo">Reglas extras</h2>
          <button type="button" className="icon-button" onClick={onCerrar} aria-label="Cerrar">
            <Icono nombre="cerrar" />
          </button>
        </header>

        <fieldset>
          <legend>Reglas disponibles</legend>
          <div className="checks">
            {REGLAS_EXTRAS.reglas.map((regla) => (
              <label key={regla.id} title={regla.texto}>
                <input
                  type="checkbox"
                  checked={reglaActiva(regla, borrador)}
                  onChange={(e) => marcar([regla.id], e.target.checked)}
                />
                {regla.nombre}
              </label>
            ))}
          </div>
          <div className="fila-botones">
            <button type="button" className="button secondary" onClick={() => marcar(todas, true)}>
              Marcar todas
            </button>
            <button type="button" className="button secondary" onClick={() => marcar(todas, false)}>
              Desmarcar todas
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend>Probabilidades al generar</legend>
          <div className="fila-campos">
            <label>
              % una regla
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                value={borrador.probUna}
                onChange={(e) =>
                  setBorrador((b) => ({ ...b, probUna: porcentaje(e.target.value) }))
                }
              />
            </label>
            <label>
              % dos reglas
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                value={borrador.probDos}
                onChange={(e) =>
                  setBorrador((b) => ({ ...b, probDos: porcentaje(e.target.value) }))
                }
              />
            </label>
          </div>
          <p className="nota">
            El resto ({ninguna.toFixed(0)} %) será ninguna regla extra.
            {sumaExcede && ' La suma supera 100 % y se normalizará al generar.'}
          </p>
        </fieldset>

        <button type="submit" className="button">
          Guardar
        </button>
      </form>
    </dialog>
  )
}
