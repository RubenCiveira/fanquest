import { useState } from 'react'
import { useLoaderData, useRouteError } from 'react-router'
import { Icono } from '../../components/Icono'
import { PageHeader } from '../../components/PageHeader'
import { registrarEvento } from '../../lib/matomo'
import { MisionCard } from './components/MisionCard'
import { ReglasExtrasDialog } from './components/ReglasExtrasDialog'
import { TIPOS_MISION } from './config/misiones'
import { generarMision, type SeleccionRegla } from './lib/generador'
import { cargarPlantillaAventuras } from './lib/plantilla'
import { textoPlano } from './lib/textoPlano'
import { useConfigExtras } from './lib/useConfigExtras'

export function GenerarPage() {
  const plantilla = useLoaderData<typeof cargarPlantillaAventuras>()
  const [configExtras, setConfigExtras] = useConfigExtras()
  const [seleccion, setSeleccion] = useState<SeleccionRegla>('aleatoria')
  const [mision, setMision] = useState(() =>
    generarMision(plantilla, 'aleatoria', configExtras),
  )
  // cada tirada remonta la ficha para repetir la animación de tinta
  const [tirada, setTirada] = useState(0)
  const [extrasAbierto, setExtrasAbierto] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(textoPlano(mision))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch {
      alert('No se pudo copiar. Selecciona el texto manualmente.')
    }
  }

  return (
    <>
      <PageHeader title="Generar aventura" />

      <div className="generar-controles">
        <label className="campo">
          Tipo de misión
          <select
            value={seleccion}
            onChange={(e) =>
              setSeleccion(
                e.target.value === 'aleatoria' ? 'aleatoria' : Number(e.target.value),
              )
            }
          >
            <option value="aleatoria">Aleatoria (tirada de dados)</option>
            {TIPOS_MISION.map(({ regla, etiqueta }) => (
              <option key={regla} value={regla}>
                {regla} · {etiqueta}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="button"
          onClick={() => {
            const nueva = generarMision(plantilla, seleccion, configExtras)
            setMision(nueva)
            setTirada((t) => t + 1)
            registrarEvento(
              'Generador',
              seleccion === 'aleatoria' ? 'Generar aleatoria' : 'Generar tipo',
              TIPOS_MISION.find(({ regla }) => regla === nueva.regla)?.etiqueta,
            )
          }}
        >
          <Icono nombre="dado" />
          Generar nueva misión
        </button>

        <div className="fila-botones">
          <button type="button" className="button secondary" onClick={() => setExtrasAbierto(true)}>
            Reglas extras…
          </button>
          <button type="button" className="button secondary" onClick={copiar}>
            {copiado ? 'Copiado' : 'Copiar texto'}
          </button>
          <button type="button" className="button secondary" onClick={() => window.print()}>
            Imprimir
          </button>
        </div>
      </div>

      <MisionCard key={tirada} mision={mision} />

      {extrasAbierto && (
        <ReglasExtrasDialog
          config={configExtras}
          onGuardar={setConfigExtras}
          onCerrar={() => setExtrasAbierto(false)}
        />
      )}
    </>
  )
}

export function GenerarError() {
  const error = useRouteError()

  return (
    <>
      <PageHeader title="Generar aventura" />
      <p className="pendiente">
        No se han podido cargar las plantillas del generador.
        {error instanceof Error && ` ${error.message}.`}
      </p>
    </>
  )
}
