import { Link, useNavigate } from 'react-router'
import { Icono } from '../../components/Icono'
import { PageHeader } from '../../components/PageHeader'
import { GestorMapa } from '../gamemap'
import { guardarMapa, listarMapas, nuevoId } from './mapas'
import { esCancelacion, useProveedorDebug } from './useProveedorDebug'
import './mapDebug.css'

/** Banco de pruebas del motor de mapas: los mapas guardados y el botón para crear otro */
export function MapDebugPage() {
  const navigate = useNavigate()
  const { proveedor, dialogo } = useProveedorDebug()

  /** Un mapa nuevo empieza pidiendo su primera estancia */
  async function crear() {
    const gestor = new GestorMapa(proveedor)
    try {
      await gestor.nuevaEstancia()
    } catch (error) {
      if (esCancelacion(error)) return
      throw error
    }
    const id = nuevoId()
    guardarMapa(id, gestor.mapa)
    navigate(id)
  }

  return (
    <>
      <PageHeader title="Mapas de prueba" />
      <button type="button" className="button aventura-empezar" onClick={crear}>
        <Icono nombre="mas" />
        Crear mapa
      </button>

      <ul className="card-list">
        {listarMapas().map(({ id, mapa }) => (
          <li key={id}>
            <Link to={id} className="aventura boceto">
              <span className="aventura-titulo">{id}</span>
              <span className="aventura-datos">
                {mapa.estancias.map((e) => `${e.id}: ${e.tipo} ${e.columnas} × ${e.filas}`).join(' · ')}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {dialogo}
    </>
  )
}
