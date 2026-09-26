import { useState } from 'react'
import { useLoaderData } from 'react-router'
import { ConfirmarDialog } from '../../components/ConfirmarDialog'
import { Icono } from '../../components/Icono'
import { PageHeader } from '../../components/PageHeader'
import { registrarEvento } from '../../lib/matomo'
import { PanelMazo } from './components/PanelMazo'
import { PasosAsistente } from './components/PasosAsistente'
import {
  DESCRIPCION_MODO,
  ETIQUETA_MODO,
  MAZOS_POR_MODO,
  NOMBRE_MAZO,
  type Modo,
} from './config/mazos'
import { anulaBarajado, pasoActual, TITULO_PASO } from './lib/asistente'
import { urlDorso, type IdMazo } from './lib/mazos'
import { avisos, seleccion, type Paso } from './lib/preparacion'
import { useConfiguracion } from './lib/useConfiguracion'
import type { DatosConfiguracion } from './rutas'

const fecha = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' })

export function ConfigurarPage() {
  const datos = useLoaderData<DatosConfiguracion>()
  const { aventura, mazos } = datos
  const { mision } = aventura
  const asistente = useConfiguracion(datos)
  const { config } = asistente
  const [volverA, setVolverA] = useState<Paso | null>(null)
  const ids = MAZOS_POR_MODO[config.modo]
  const conAvisos = ids.filter((id) => avisos(mazos[id], mision, seleccion(config, id)).length)
  const paso = pasoActual(config)

  const pedirVolver = (destino: Paso) =>
    anulaBarajado(config) ? setVolverA(destino) : asistente.volverA(destino)

  return (
    <>
      <PageHeader title="Preparar misión" backTo={`/aventuras/${aventura.id}`}>
        {conAvisos.length > 0 && (
          <span className="aviso-icono" title="La selección no cumple lo que pide la misión">
            <Icono nombre="aviso" />
          </span>
        )}
      </PageHeader>
      <p className="configurar-mision">{mision.titulo}</p>

      <PasosAsistente config={config} onVolver={pedirVolver} />

      {config.barajado ? (
        <section className="barajado">
          <h2>Mazos barajados</h2>
          <p className="nota">
            {ETIQUETA_MODO[config.modo]} · {fecha.format(new Date(config.barajado.fecha))}. El orden queda
            guardado para la partida.
          </p>
          <ul className="barajado-mazos">
            {ids.map((id) => {
              const dorso = urlDorso(mazos[id])
              return (
                <li key={id}>
                  {dorso && <img src={dorso} alt="" />}
                  <strong>{NOMBRE_MAZO[id]}</strong>
                  <span>{config.barajado?.orden[id]?.length ?? 0} cartas</span>
                </li>
              )
            })}
          </ul>
          {conAvisos.length > 0 && (
            <p className="nota mal">Se barajó con avisos en {conAvisos.map((id) => NOMBRE_MAZO[id]).join(', ')}.</p>
          )}
        </section>
      ) : paso === 'mazmorra' ? (
        <section className="paso-contenido">
          <fieldset className="modo">
            <legend>¿Cómo vais a montar la mazmorra?</legend>
            {(['losetas', 'tablero'] as Modo[]).map((modo) => (
              <label key={modo}>
                <input
                  type="radio"
                  name="modo"
                  checked={config.modo === modo}
                  onChange={() => asistente.cambiarModo(modo)}
                />
                {ETIQUETA_MODO[modo]}
              </label>
            ))}
          </fieldset>
          <p className="nota">{DESCRIPCION_MODO[config.modo]}</p>
          <button type="button" className="button" onClick={asistente.avanzar}>
            Siguiente: {TITULO_PASO.mazos}
          </button>
        </section>
      ) : paso === 'mazos' ? (
        <section className="paso-contenido">
          {ids.map((id) => (
            <PanelMazo
              key={id}
              id={id}
              mazo={mazos[id]}
              mision={mision}
              seleccion={seleccion(config, id)}
              onCambiar={(s) => asistente.cambiarMazo(id, s)}
            />
          ))}
          <button type="button" className="button" onClick={asistente.avanzar}>
            Siguiente: {TITULO_PASO.barajar}
          </button>
        </section>
      ) : (
        <section className="paso-contenido">
          <ul className="recuento">
            {ids.map((id) => (
              <li key={id} className={conAvisos.includes(id) ? 'mal' : undefined}>
                <span>{NOMBRE_MAZO[id as IdMazo]}</span>
                <span>{seleccion(config, id).cartas.length} cartas</span>
              </li>
            ))}
          </ul>
          {conAvisos.length > 0 && (
            <p className="nota mal">Hay avisos en la selección; puedes barajar igualmente o volver a Mazos.</p>
          )}
          <button
            type="button"
            className="button"
            onClick={() => {
              asistente.barajar()
              registrarEvento('Aventuras', 'Barajar y guardar', config.modo)
            }}
          >
            <Icono nombre="dado" />
            Barajar y guardar
          </button>
        </section>
      )}

      {volverA && (
        <ConfirmarDialog
          titulo={`Volver a ${TITULO_PASO[volverA]}`}
          accion="Volver y anular"
          onConfirmar={() => asistente.volverA(volverA)}
          onCerrar={() => setVolverA(null)}
        >
          Se anulará el barajado y tendrás que volver a barajar los mazos. La selección de cartas se conserva.
        </ConfirmarDialog>
      )}
    </>
  )
}
