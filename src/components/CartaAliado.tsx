import type { Aliado } from '../lib/personajes'
import { CartaPersonaje } from './CartaPersonaje'

type Props = {
  aliado: Aliado
  variante?: 'mini' | 'completa'
  sello?: string
}

/** Mercenario, compañero animal o PNJ dibujado como un naipe */
export function CartaAliado({ aliado, variante, sello }: Props) {
  return (
    <CartaPersonaje
      titulo={aliado.nombre}
      estadisticas={aliado}
      variante={variante}
      sello={sello}
      resumen={aliado.reglas.map((r) => r.nombre).join(' · ') || aliado.descripcion}
    >
      {aliado.descripcion && <p className="carta-cita">{aliado.descripcion}</p>}
      {aliado.reglas.map((r) => (
        <p key={r.nombre} className="carta-reglas">
          <strong>{r.nombre}{r.texto ? ':' : '.'}</strong> {r.texto}
        </p>
      ))}
      {aliado.coste && <p className="carta-reglas">Coste: {aliado.coste}.</p>}
    </CartaPersonaje>
  )
}
