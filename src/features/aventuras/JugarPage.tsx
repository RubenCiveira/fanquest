import { useParams } from 'react-router'
import { PageHeader } from '../../components/PageHeader'
import { Pendiente } from '../../components/Pendiente'

export function JugarPage() {
  const { id } = useParams()

  return (
    <>
      <PageHeader title="En juego" backTo={`/aventuras/${id}`} />
      <Pendiente>
        Utilidades de apoyo durante la partida, por ejemplo «entrar en sala»
        tira los dados de trampas y eventos.
      </Pendiente>
    </>
  )
}
