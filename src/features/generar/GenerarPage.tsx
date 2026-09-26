import { useState } from 'react'
import { Link, useLoaderData, useRouteError } from 'react-router'
import { Icono } from '../../components/Icono'
import { PageHeader } from '../../components/PageHeader'
import { registrarEvento } from '../../lib/matomo'
import { guardarAventura } from '../aventuras/lib/aventuras'
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
  // id de la aventura guardada a partir de la misión actual
  const [guardada, setGuardada] = useState<string | null>(null)
  const [errorGuardar, setErrorGuardar] = useState(false)

  const etiquetaTipo = (regla: number) =>
    TIPOS_MISION.find((tipo) => tipo.regla === regla)?.etiqueta

  const guardar = async () => {
    try {
      setGuardada((await guardarAventura(mision)).id)
      setErrorGuardar(false)
      registrarEvento('Aventuras', 'Guardar', etiquetaTipo(mision.regla))
    } catch {
      setErrorGuardar(true)
    }
  }

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
            setGuardada(null)
            setErrorGuardar(false)
            registrarEvento(
              'Generador',
              seleccion === 'aleatoria' ? 'Generar aleatoria' : 'Generar tipo',
              etiquetaTipo(nueva.regla),
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

      <div className="guardar-aventura">
        {guardada ? (
          <p className="nota">
            Aventura guardada. <Link to={`/aventuras/${guardada}`}>Verla en Aventuras</Link>
          </p>
        ) : (
          <button type="button" className="button" onClick={guardar}>
            <Icono nombre="pergamino" />
            Guardar aventura
          </button>
        )}
        {errorGuardar && (
          <p className="nota" role="alert">
            No se ha podido guardar: este navegador no permite almacenar datos.
          </p>
        )}
      </div>

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
