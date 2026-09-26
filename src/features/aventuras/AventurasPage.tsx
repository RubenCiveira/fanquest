import { Link, useLoaderData } from 'react-router'
import { PageHeader } from '../../components/PageHeader'
import { ETIQUETA_ESTADO, type listarAventuras } from './lib/aventuras'

const fecha = new Intl.DateTimeFormat('es', { dateStyle: 'medium' })

export function AventurasPage() {
  const aventuras = useLoaderData<typeof listarAventuras>()

  return (
    <>
      <PageHeader title="Aventuras guardadas" />

      {aventuras.length === 0 ? (
        <p className="pendiente">
          Aún no has guardado ninguna aventura.{' '}
          <Link to="/generar">Genera una misión</Link> y guárdala para jugarla.
        </p>
      ) : (
        <ul className="card-list">
          {aventuras.map(({ id, guardadaEn, estado, mision }) => (
            <li key={id}>
              <Link to={id} className="aventura boceto">
                <span className="aventura-titulo">{mision.titulo}</span>
                <span className="aventura-datos">
                  {mision.faccion.nombre} · {mision.jefe} ({mision.tipoJefe})
                </span>
                <span className="aventura-pie">
                  <span className="nota">Guardada el {fecha.format(new Date(guardadaEn))}</span>
                  <span className="estado">{ETIQUETA_ESTADO[estado]}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
