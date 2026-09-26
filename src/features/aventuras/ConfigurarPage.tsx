import { Link, useLoaderData } from 'react-router'
import { Icono } from '../../components/Icono'
import { PageHeader } from '../../components/PageHeader'
import { registrarEvento } from '../../lib/matomo'
import { Avisos } from './components/Avisos'
import { ETIQUETA_MODO, MAZOS_POR_MODO, NOMBRE_MAZO, type Modo } from './config/mazos'
import type { IdMazo } from './lib/mazos'
import { avisos, completar, recuento, seleccion } from './lib/preparacion'
import { useConfiguracion } from './lib/useConfiguracion'
import type { DatosConfiguracion } from './rutas'

const fecha = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' })

export function ConfigurarPage() {
  const datos = useLoaderData<DatosConfiguracion>()
  const { aventura, mazos } = datos
  const { mision } = aventura
  const { config, cambiarMazo, cambiarModo, barajar } = useConfiguracion(datos)
  const ids = MAZOS_POR_MODO[config.modo]
  const avisosPorMazo = Object.fromEntries(
    ids.map((id) => [id, avisos(mazos[id], mision, seleccion(config, id))]),
  ) as Record<IdMazo, string[]>
  const hayAvisos = ids.some((id) => avisosPorMazo[id].length)
  const titulo = (id: IdMazo, carta: string) =>
    mazos[id].cartas.find((c) => c.id === carta)?.titulo ?? carta

  return (
    <>
      <PageHeader title="Configurar misión" backTo={`/aventuras/${aventura.id}`}>
        {hayAvisos && (
          <span className="aviso-icono" title="La selección no cumple lo que pide la misión">
            <Icono nombre="aviso" />
          </span>
        )}
      </PageHeader>
      <p className="configurar-mision">{mision.titulo}</p>

      <fieldset className="modo">
        <legend>Mazmorra</legend>
        {(['losetas', 'tablero'] as Modo[]).map((modo) => (
          <label key={modo}>
            <input
              type="radio"
              name="modo"
              checked={config.modo === modo}
              onChange={() => cambiarModo(modo)}
            />
            {ETIQUETA_MODO[modo]}
          </label>
        ))}
      </fieldset>

      {ids.map((id) => {
        const s = seleccion(config, id)
        return (
          <section key={id} className="panel-mazo boceto">
            <header className="panel-cabecera">
              <h2>{NOMBRE_MAZO[id]}</h2>
              <span className={avisosPorMazo[id].length ? 'panel-estado mal' : 'panel-estado'}>
                <Icono nombre={avisosPorMazo[id].length ? 'aviso' : 'hecho'} />
                {s.cartas.length} cartas
              </span>
            </header>

            <ul className="recuento">
              {recuento(mazos[id], mision, s).map(({ categoria, hay }) => (
                <li key={categoria.id} className={hay === categoria.cantidad ? undefined : 'mal'}>
                  <span>{categoria.etiqueta}</span>
                  <span>
                    {hay} / {categoria.cantidad}
                  </span>
                </li>
              ))}
            </ul>

            {s.reemplazos.length > 0 && (
              <ul className="reemplazos">
                {s.reemplazos.map((r, i) => (
                  <li key={i}>
                    Regla especial: <s>{titulo(id, r.original)}</s> → {titulo(id, r.reemplazo)}
                  </li>
                ))}
              </ul>
            )}

            <Avisos avisos={avisosPorMazo[id]} />

            <div className="fila-botones">
              <Link to={id} className="button secondary">
                Escoger
              </Link>
              <button
                type="button"
                className="button secondary"
                onClick={() => cambiarMazo(id, completar(mazos[id], mision, s))}
              >
                Completar
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => cambiarMazo(id, { cartas: [], reemplazos: [] })}
              >
                Descartar
              </button>
            </div>
          </section>
        )
      })}

      <div className="configurar-acciones">
        <button
          type="button"
          className="button"
          onClick={() => {
            barajar()
            registrarEvento('Aventuras', 'Barajar y guardar', config.modo)
          }}
        >
          <Icono nombre="dado" />
          Barajar y guardar
        </button>
        <p className="nota">
          {config.barajado
            ? `Mazos barajados y guardados el ${fecha.format(new Date(config.barajado.fecha))}.`
            : 'Los mazos aún no están barajados.'}
        </p>
      </div>
    </>
  )
}
