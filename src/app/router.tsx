import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from './AppLayout'
import { GenerarError, GenerarPage } from '../features/generar/GenerarPage'
import { cargarPlantillaAventuras } from '../features/generar/lib/plantilla'
import { AventurasPage } from '../features/aventuras/AventurasPage'
import { AventuraPage } from '../features/aventuras/AventuraPage'
import { JugarPage } from '../features/aventuras/JugarPage'
import { ImprimirPage } from '../features/imprimir/ImprimirPage'
import { ImprimirTipoPage } from '../features/imprimir/ImprimirTipoPage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    hydrateFallbackElement: <p className="nota">Cargando…</p>,
    children: [
      { index: true, element: <Navigate to="/generar" replace /> },
      {
        path: 'generar',
        loader: () => cargarPlantillaAventuras(),
        element: <GenerarPage />,
        errorElement: <GenerarError />,
      },
      { path: 'aventuras', element: <AventurasPage /> },
      { path: 'aventuras/:id', element: <AventuraPage /> },
      { path: 'aventuras/:id/jugar', element: <JugarPage /> },
      { path: 'imprimir', element: <ImprimirPage /> },
      { path: 'imprimir/:tipo', element: <ImprimirTipoPage /> },
      { path: '*', element: <Navigate to="/generar" replace /> },
    ],
  },
])
