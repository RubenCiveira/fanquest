import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Ataque } from '../gamemap'

type Props = { ataque: Ataque; onAtacar: (dano: number) => void; onCancelar: () => void }

/** Diálogo del banco de pruebas para decidir a mano el daño de un ataque; se monta abierto */
export function DialogoAtaque({ ataque: { atacante, objetivo, tipo, distancia }, onAtacar, onCancelar }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [dano, setDano] = useState(1)

  useEffect(() => ref.current?.showModal(), [])

  function atacar(e: FormEvent) {
    e.preventDefault()
    onAtacar(dano)
  }

  return (
    <dialog ref={ref} className="dialog" aria-labelledby="ataque-titulo" onClose={onCancelar}>
      <form className="dialog-contenido" onSubmit={atacar}>
        <h2 id="ataque-titulo">
          {atacante.nombre} ataca a {objetivo.nombre}
        </h2>
        <p>
          {tipo === 'cuerpo-a-cuerpo' ? 'Cuerpo a cuerpo.' : `A distancia, a ${distancia} casillas.`}{' '}
          {objetivo.vida === undefined ? `${objetivo.nombre} no lleva la cuenta de su vida.` : `A ${objetivo.nombre} le quedan ${objetivo.vida} puntos de vida.`}
        </p>
        <label className="campo">
          Daño
          <input type="number" min={0} value={dano} autoFocus onChange={(e) => setDano(Math.max(0, Math.trunc(e.target.valueAsNumber) || 0))} />
        </label>
        <div className="fila-botones">
          <button type="button" className="button secondary" onClick={onCancelar}>
            Cancelar
          </button>
          <button type="submit" className="button">
            Atacar
          </button>
        </div>
      </form>
    </dialog>
  )
}
