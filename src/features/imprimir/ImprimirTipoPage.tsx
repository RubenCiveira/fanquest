import { Navigate, useParams } from 'react-router'
import { PageHeader } from '../../components/PageHeader'
import { Pendiente } from '../../components/Pendiente'
import { tiposImprimible } from './tipos'

export function ImprimirTipoPage() {
  const { tipo } = useParams()
  const imprimible = tiposImprimible.find(({ slug }) => slug === tipo)

  if (!imprimible) return <Navigate to="/imprimir" replace />

  return (
    <>
      <PageHeader title={imprimible.label} backTo="/imprimir" />
      <Pendiente>Selección y maquetación para imprimir.</Pendiente>
    </>
  )
}
