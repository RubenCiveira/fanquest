import type { Jugador, Jugadores, Postura } from '../gamemap'

const POSTURAS: Postura[] = ['aliada', 'neutral', 'hostil']

type Props = { jugadores: Jugadores; enTurno?: Jugador; onCambiar: (jugadores: Jugadores) => void }

/**
 * Reparto de la partida, que se cambia en cualquier momento con
 * `cambiarJugadores`: la alianza de cada jugador y la postura de cada alianza
 * hacia las demás (con `hostil`, sus personajes son enemigos de los de la otra)
 */
export function PanelJugadores({ jugadores: reparto, enTurno, onCambiar }: Props) {
  const { alianzas, jugadores } = reparto
  return (
    <fieldset className="map-debug-configuracion">
      <legend>Jugadores y alianzas</legend>
      {jugadores.map((j) => (
        <label key={j.id} className="campo">
          {j.nombre} ({j.tipo === 'ia' ? 'IA' : 'humano'}){j.id === enTurno?.id && ' · le toca'}
          <select
            value={j.alianza}
            onChange={(e) => onCambiar({ ...reparto, jugadores: jugadores.map((otro) => (otro.id === j.id ? { ...otro, alianza: e.target.value } : otro)) })}
          >
            {alianzas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </label>
      ))}
      {alianzas.flatMap((de) =>
        alianzas
          .filter((hacia) => hacia.id !== de.id)
          .map((hacia) => (
            <label key={`${de.id}-${hacia.id}`} className="campo">
              {de.nombre} hacia {hacia.nombre}
              <select
                value={de.posturas?.[hacia.id] ?? 'neutral'}
                onChange={(e) =>
                  onCambiar({
                    ...reparto,
                    alianzas: alianzas.map((a) => (a.id === de.id ? { ...a, posturas: { ...a.posturas, [hacia.id]: e.target.value as Postura } } : a)),
                  })
                }
              >
                {POSTURAS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
          )),
      )}
    </fieldset>
  )
}
