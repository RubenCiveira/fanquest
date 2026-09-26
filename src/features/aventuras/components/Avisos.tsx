import { Icono } from '../../../components/Icono'

/** Problemas de la selección: se muestran, pero no bloquean */
export function Avisos({ avisos }: { avisos: string[] }) {
  if (!avisos.length) return null
  return (
    <ul className="avisos" role="alert">
      {avisos.map((aviso) => (
        <li key={aviso}>
          <Icono nombre="aviso" />
          {aviso}
        </li>
      ))}
    </ul>
  )
}
