import {
  PERFILES_MOVIMIENTO,
  puntosMovimiento,
  urlRetrato,
  type Habilidad,
  type Habilidades,
  type Heroe,
} from '../lib/personajes'
import { Tirada } from './Carta'
import { CartaPersonaje } from './CartaPersonaje'

type Props = {
  heroe: Heroe
  /** Para la carta completa: el texto de sus habilidades */
  habilidades?: Habilidades
  variante?: 'mini' | 'completa'
  sello?: string
}

function TextoHabilidad({ habilidad, nota }: { habilidad: Habilidad; nota?: string }) {
  return (
    <>
      <p className="carta-reglas">
        <strong>{habilidad.titulo}</strong>
        {nota && ` (${nota})`}: {habilidad.texto}
      </p>
      {habilidad.tiradas?.map((t) => <Tirada key={t.accion} tirada={t} />)}
    </>
  )
}

/** Ficha de héroe dibujada como un naipe */
export function CartaHeroe({ heroe, habilidades = {}, variante, sello }: Props) {
  const propias = heroe.habilidades.flatMap((id) => habilidades[id] ?? [])
  const aElegir = (heroe.eligeUna ?? []).flatMap((id) => habilidades[id] ?? [])

  return (
    <CartaPersonaje
      titulo={heroe.nombre}
      imagen={urlRetrato('heroes', heroe)}
      estadisticas={{ ...heroe, movimiento: puntosMovimiento(heroe) }}
      variante={variante}
      sello={sello}
      resumen={heroe.equipo}
    >
      <p className="carta-cita">«{heroe.cita}»</p>
      <p className="carta-reglas">{heroe.descripcion}</p>
      <p className="carta-reglas">
        <strong>Movimiento:</strong> {PERFILES_MOVIMIENTO[heroe.movimiento].descripcion.toLowerCase()}.
      </p>
      <p className="carta-reglas">
        <strong>Equipo inicial:</strong> {heroe.equipo}.
      </p>
      <p className="carta-reglas">
        <strong>Limitaciones de equipo:</strong> {heroe.limitaciones}
      </p>
      {heroe.malvado && <p className="carta-reglas">Alineamiento malvado (regla opcional).</p>}

      <p className="carta-seccion">Habilidades</p>
      {propias.map((h) => (
        <TextoHabilidad key={h.id} habilidad={h} nota={heroe.opcionales?.includes(h.id) ? 'opcional' : undefined} />
      ))}
      {aElegir.length > 0 && (
        <>
          <p className="carta-reglas carta-nota">Además, elige una:</p>
          {aElegir.map((h) => (
            <TextoHabilidad key={h.id} habilidad={h} />
          ))}
        </>
      )}
    </CartaPersonaje>
  )
}
