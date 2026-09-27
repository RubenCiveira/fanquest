import { urlRetrato, version, type Monstruo } from '../lib/personajes'
import { CartaPersonaje } from './CartaPersonaje'

type Props = {
  monstruo: Monstruo
  /** Con las estadísticas y reglas de «Monstruos avanzados» */
  avanzado?: boolean
  variante?: 'mini' | 'completa'
  copias?: number
  /** Papel en la misión, p. ej. «Jefe Final»; va delante de avanzado y estimado */
  papel?: string
}

/** Monstruo del bestiario dibujado como un naipe */
export function CartaMonstruo({ monstruo, avanzado = false, variante, copias, papel }: Props) {
  const v = version(monstruo, avanzado)
  const sello = [papel, avanzado && 'Avanzado', monstruo.estimado && 'Estimado'].filter(Boolean).join(' · ')

  return (
    <CartaPersonaje
      titulo={monstruo.nombre}
      imagen={urlRetrato('monstruos', monstruo)}
      estadisticas={v}
      variante={variante}
      copias={copias}
      sello={sello || undefined}
      resumen={v.reglas.map((r) => r.nombre).join(' · ') || monstruo.descripcion}
    >
      <p className="carta-cita">{monstruo.descripcion}</p>
      {v.reglas.map((r) => (
        <p key={r.nombre} className="carta-reglas">
          <strong>{r.nombre}{r.texto ? ':' : '.'}</strong> {r.texto}
        </p>
      ))}
      {monstruo.categoria && <p className="carta-reglas">Categoría {monstruo.categoria}.</p>}
      {monstruo.estimado && <p className="carta-reglas carta-nota">{monstruo.estimado}</p>}
    </CartaPersonaje>
  )
}
