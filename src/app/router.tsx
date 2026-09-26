import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from './AppLayout'
import { GenerarError, GenerarPage } from '../features/generar/GenerarPage'
import { cargarPlantillaAventuras } from '../features/generar/lib/plantilla'
import { AventurasPage } from '../features/aventuras/AventurasPage'
import { AventuraPage } from '../features/aventuras/AventuraPage'
import { JugarPage } from '../features/aventuras/JugarPage'
import { ConfigurarPage } from '../features/aventuras/ConfigurarPage'
import { listarAventuras } from '../features/aventuras/lib/aventuras'
import { MazoPage } from '../features/aventuras/MazoPage'
import {
  accionAventura,
  cargarAventura,
  cargarConfiguracion,
} from '../features/aventuras/rutas'
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
      {
        path: 'aventuras',
        loader: () => listarAventuras(),
        element: <AventurasPage />,
      },
      {
        path: 'aventuras/:id',
        loader: cargarAventura,
        action: accionAventura,
        element: <AventuraPage />,
      },
      {
        path: 'aventuras/:id/configurar',
        loader: cargarConfiguracion,
        element: <ConfigurarPage />,
      },
      {
        path: 'aventuras/:id/configurar/:mazo',
        loader: cargarConfiguracion,
        element: <MazoPage />,
      },
      { path: 'aventuras/:id/jugar', element: <JugarPage /> },
      { path: 'imprimir', element: <ImprimirPage /> },
      { path: 'imprimir/:tipo', element: <ImprimirTipoPage /> },
      { path: '*', element: <Navigate to="/generar" replace /> },
    ],
  },
], { basename: import.meta.env.BASE_URL })
