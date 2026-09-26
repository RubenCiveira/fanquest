import { Link, useParams } from 'react-router'
import { PageHeader } from '../../components/PageHeader'
import { Pendiente } from '../../components/Pendiente'

export function AventuraPage() {
  const { id } = useParams()

  return (
    <>
      <PageHeader title={`Aventura ${id}`} backTo="/aventuras" />
      <Pendiente>Detalle y estado de la aventura guardada.</Pendiente>
      <Link to="jugar" className="button">
        Empezar / continuar
      </Link>
    </>
  )
}
