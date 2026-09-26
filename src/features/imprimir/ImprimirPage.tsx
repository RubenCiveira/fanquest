import { Link } from 'react-router'
import { PageHeader } from '../../components/PageHeader'
import { tiposImprimible } from './tipos'

export function ImprimirPage() {
  return (
    <>
      <PageHeader title="Imprimir" />
      <ul className="card-list">
        {tiposImprimible.map(({ slug, label }) => (
          <li key={slug}>
            <Link to={slug} className="card boceto">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
