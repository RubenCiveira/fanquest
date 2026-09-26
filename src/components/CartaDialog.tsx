import { useEffect, useRef } from 'react'
import type { CartaMazo, IdMazo } from '../lib/mazos'
import { Carta } from './Carta'
import { Icono } from './Icono'

type Props = {
  mazo: IdMazo
  carta: CartaMazo
  sello?: string
  onCerrar: () => void
}

/** La carta entera sobre la mesa; se monta abierta */
export function CartaDialog({ mazo, carta, sello, onCerrar }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => ref.current?.showModal(), [])

  return (
    <dialog
      ref={ref}
      className="dialog dialog-carta"
      aria-label={carta.titulo}
      onClose={onCerrar}
      onClick={(e) => e.target === ref.current && onCerrar()}
    >
      <button type="button" className="icon-button dialog-carta-cerrar" onClick={onCerrar} aria-label="Cerrar">
        <Icono nombre="cerrar" />
      </button>
      <Carta mazo={mazo} carta={carta} variante="completa" sello={sello} />
    </dialog>
  )
}
