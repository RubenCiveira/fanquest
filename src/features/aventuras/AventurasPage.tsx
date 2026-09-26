import { PageHeader } from '../../components/PageHeader'
import { Pendiente } from '../../components/Pendiente'

export function AventurasPage() {
  return (
    <>
      <PageHeader title="Aventuras guardadas" />
      <Pendiente>
        Listado de aventuras guardadas con su estado (sin empezar, en curso,
        terminada).
      </Pendiente>
    </>
  )
}
