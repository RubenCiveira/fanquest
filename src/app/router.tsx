import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from './AppLayout'
import { AventurasPage } from '../features/aventuras/AventurasPage'
import { AventuraPage } from '../features/aventuras/AventuraPage'
import { JugarPage } from '../features/aventuras/JugarPage'
import { ConfigurarPage } from '../features/aventuras/ConfigurarPage'
import { EditarAventuraPage } from '../features/aventuras/EditarAventuraPage'
import { listarAventuras } from '../features/aventuras/lib/aventuras'
import { MazoPage } from '../features/aventuras/MazoPage'
import {
  accionAventura,
  cargarAventura,
  cargarConfiguracion,
  cargarEditor,
  cargarPartida,
} from '../features/aventuras/rutas'
import { CreditosPage } from '../features/creditos/CreditosPage'
import {
  FichasAliadosPage,
  FichasHeroesPage,
  FichasMonstruosPage,
} from '../features/imprimir/FichasPages'
import { ImprimirPage } from '../features/imprimir/ImprimirPage'
import { cargarFichasHeroes } from '../features/imprimir/rutas'
import { cargarAliados, cargarBestiario } from '../lib/personajes'
import { ImprimirTipoPage } from '../features/imprimir/ImprimirTipoPage'
import { MapaPage } from '../modules/map-debug-imp/MapaPage'
import { MapDebugPage } from '../modules/map-debug-imp/MapDebugPage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    hydrateFallbackElement: <p className="nota">Cargando…</p>,
    children: [
      // el generador (features/generar) queda sin ruta por ahora: las aventuras se escriben a mano
      { index: true, element: <Navigate to="/aventuras" replace /> },
      {
        path: 'aventuras',
        loader: () => listarAventuras(),
        element: <AventurasPage />,
      },
      { path: 'aventuras/nueva', loader: cargarEditor, element: <EditarAventuraPage /> },
      { path: 'aventuras/:id/editar', loader: cargarEditor, element: <EditarAventuraPage /> },
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
      {
        path: 'aventuras/:id/jugar',
        loader: cargarPartida,
        element: <JugarPage />,
      },
      { path: 'creditos', element: <CreditosPage /> },
      { path: 'imprimir', element: <ImprimirPage /> },
      { path: 'imprimir/heroes', loader: cargarFichasHeroes, element: <FichasHeroesPage /> },
      { path: 'imprimir/monstruos', loader: () => cargarBestiario(), element: <FichasMonstruosPage /> },
      { path: 'imprimir/aliados', loader: () => cargarAliados(), element: <FichasAliadosPage /> },
      { path: 'imprimir/:tipo', element: <ImprimirTipoPage /> },
      // banco de pruebas del motor de mapas (modules/gamemap), sin enlace en la navegación
      { path: 'map-debug', element: <MapDebugPage /> },
      { path: 'map-debug/:id', element: <MapaPage /> },
      { path: '*', element: <Navigate to="/aventuras" replace /> },
    ],
  },
], { basename: import.meta.env.BASE_URL })
