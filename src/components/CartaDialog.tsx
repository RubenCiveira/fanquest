import type { CartaMazo, IdMazo } from '../lib/mazos'
import { Carta } from './Carta'
import { NaipeDialog } from './NaipeDialog'

type Props = {
  mazo: IdMazo
  carta: CartaMazo
  sello?: string
  onCerrar: () => void
}

/** La carta entera sobre la mesa; se monta abierta */
export function CartaDialog({ mazo, carta, sello, onCerrar }: Props) {
  return (
    <NaipeDialog etiqueta={carta.titulo} onCerrar={onCerrar}>
      <Carta mazo={mazo} carta={carta} variante="completa" sello={sello} />
    </NaipeDialog>
  )
}
