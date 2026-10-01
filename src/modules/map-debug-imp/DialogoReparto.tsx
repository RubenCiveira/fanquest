import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { AtaqueDeEscuadra } from '../gamemap'
import { repartoEnOrden } from './reparto'

type Props = { ataque: AtaqueDeEscuadra; onRepartir: (reparto: Record<string, number>) => void; onCancelar: () => void }

/**
 * Diálogo del banco de pruebas para repartir a mano el daño de un ataque de
 * escuadra: quién ataca a quién, quién no puede y el daño a cada objetivo,
 * de los más cercanos a los más lejanos. Propone el daño total (uno por
 * atacante) repartido en orden (`repartoEnOrden`); se monta abierto
 */
export function DialogoReparto({ ataque: { ataques, objetivos, sinAtacar }, onRepartir, onCancelar }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [total, setTotal] = useState(ataques.length)
  const [reparto, setReparto] = useState(() => repartoEnOrden(objetivos, ataques.length))

  useEffect(() => ref.current?.showModal(), [])

  const numero = (valor: number) => Math.max(0, Math.trunc(valor) || 0)
  function cambiarTotal(nuevo: number) {
    setTotal(nuevo)
    setReparto(repartoEnOrden(objetivos, nuevo))
  }
  function repartir(e: FormEvent) {
    e.preventDefault()
    onRepartir(reparto)
  }

  return (
    <dialog ref={ref} className="dialog" aria-labelledby="reparto-titulo" onClose={onCancelar}>
      <form className="dialog-contenido" onSubmit={repartir}>
        <h2 id="reparto-titulo">Ataque de escuadra</h2>
        <ul>
          {ataques.map(({ atacante, objetivo, tipo, distancia }) => (
            <li key={atacante.id}>
              {atacante.nombre} ataca a {objetivo.nombre} {tipo === 'cuerpo-a-cuerpo' ? 'cuerpo a cuerpo' : `a distancia (${distancia} casillas)`}
            </li>
          ))}
          {sinAtacar.map(({ atacante, motivo }) => (
            <li key={atacante.id} className="nota">
              {atacante.nombre} no ataca: {motivo}
            </li>
          ))}
        </ul>
        <label className="campo">
          Daño total
          <input type="number" min={0} value={total} autoFocus onChange={(e) => cambiarTotal(numero(e.target.valueAsNumber))} />
        </label>
        <p className="nota">Reparto, de los más cercanos a los más lejanos:</p>
        {objetivos.map(({ id, nombre, vida }) => (
          <label key={id} className="campo">
            {nombre}
            {vida === undefined ? '' : ` (${vida} de vida)`}
            <input type="number" min={0} value={reparto[id] ?? 0} onChange={(e) => setReparto({ ...reparto, [id]: numero(e.target.valueAsNumber) })} />
          </label>
        ))}
        <div className="fila-botones">
          <button type="button" className="button secondary" onClick={onCancelar}>
            Cancelar
          </button>
          <button type="submit" className="button">
            Repartir
          </button>
        </div>
      </form>
    </dialog>
  )
}
