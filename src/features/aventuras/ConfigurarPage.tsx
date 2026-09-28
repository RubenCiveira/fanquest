import { useState } from 'react'
import { Link, useLoaderData } from 'react-router'
import { ConfirmarDialog } from '../../components/ConfirmarDialog'
import { Icono } from '../../components/Icono'
import { PageHeader } from '../../components/PageHeader'
import { registrarEvento } from '../../lib/matomo'
import { DADOS_MOVIMIENTO } from '../../lib/personajes'
import { PanelAliados } from './components/PanelAliados'
import { PanelHeroes } from './components/PanelHeroes'
import { PanelHechizos } from './components/PanelHechizos'
import { PanelMazo } from './components/PanelMazo'
import { PanelMonstruos } from './components/PanelMonstruos'
import { PasosAsistente } from './components/PasosAsistente'
import {
  DESCRIPCION_MODO,
  ETIQUETA_MODO,
  MAZOS_POR_MODO,
  NOMBRE_MAZO,
  type Modo,
} from './config/mazos'
import { anulaBarajado, pasoActual, TITULO_PASO } from './lib/asistente'
import { urlDorso, type IdMazo } from '../../lib/mazos'
import { seleccionMonstruos } from './lib/monstruos'
import { avisos, claveAliado, heroesSeleccionados, mazosDePartida, reglas, seleccion, type Paso } from './lib/preparacion'
import { useConfiguracion } from './lib/useConfiguracion'
import type { DatosConfiguracion } from './rutas'

const fecha = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' })

export function ConfigurarPage() {
  const datos = useLoaderData<DatosConfiguracion>()
  const { aventura, mazos, heroes, habilidades, monstruos, bestiario, aliados } = datos
  const { mision } = aventura
  const asistente = useConfiguracion(datos)
  const { config } = asistente
  const [volverA, setVolverA] = useState<Paso | null>(null)
  const ids = MAZOS_POR_MODO[config.modo]
  const idsBarajados = mazosDePartida(config)
  const conAvisos = ids.filter((id) => avisos(mazos[id], mision, seleccion(config, id)).length)
  const paso = pasoActual(config)
  const { movimientoFijo, tesorosYSucesos } = reglas(config)
  const grupo = heroesSeleccionados(config, heroes)
  const elegidos = config.aliados ?? []
  const nombresGrupo = [
    ...grupo.map((h) => h.nombre),
    ...aliados.flatMap((g) => g.aliados.filter((a) => elegidos.includes(claveAliado(g.id, a.id))).map((a) => a.nombre)),
  ].join(', ')
  // en el grupo van PNJ y compañeros animales; los mercenarios solo se imprimen
  const aliadosDelGrupo = aliados.filter((g) => g.id !== 'mercenarios')
  const pnj = mision.efectos?.find((e) => e.tipo === 'pnj')
  const miniaturas = Object.values(seleccionMonstruos(config.monstruos, mision, grupo.length)).reduce((a, b) => a + b, 0)

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
            {idsBarajados.map((id) => {
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
          {nombresGrupo && <p className="nota">Grupo: {nombresGrupo}.</p>}
          <p className="nota">Monstruos: {miniaturas} miniaturas.</p>
          <Link to={`/aventuras/${aventura.id}/jugar`} className="button">
            <Icono nombre="dado" />
            {aventura.partida ? 'Continuar partida' : 'Empezar partida'}
          </Link>
        </section>
      ) : paso === 'reglas' ? (
        <section className="paso-contenido">
          <fieldset className="panel-mazo boceto reglas-partida">
            <legend className="panel-cabecera">
              <h2>Reglas de la partida</h2>
            </legend>
            <label className="regla-opcion">
              <input
                type="checkbox"
                checked={movimientoFijo}
                onChange={() => asistente.cambiarReglas({ ...reglas(config), movimientoFijo: !movimientoFijo })}
              />
              <span>
                <strong>Usar atributo de movimiento</strong>
                <span className="nota">
                  {movimientoFijo
                    ? 'Cada héroe tiene Puntos de Movimiento fijos según su perfil (nuevas reglas de Aventuras Infinitas).'
                    : `Los héroes tiran ${DADOS_MOVIMIENTO} de movimiento cada turno, como en FetenQuest.`}
                </span>
              </span>
            </label>
            <label className="regla-opcion">
              <input
                type="checkbox"
                checked={tesorosYSucesos}
                onChange={() => asistente.cambiarReglas({ ...reglas(config), tesorosYSucesos: !tesorosYSucesos })}
              />
              <span>
                <strong>Usar mazo de tesoros y sucesos equilibrado</strong>
                <span className="nota">
                  Prepara automáticamente un mazo con proporción 2:1 de cartas positivas y negativas, y baraja el Mazo
                  de Sucesos para las cartas que lo pidan.
                </span>
              </span>
            </label>
          </fieldset>
          <button type="button" className="button" onClick={asistente.avanzar}>
            Siguiente: {TITULO_PASO.heroes}
          </button>
        </section>
      ) : paso === 'heroes' ? (
        <section className="paso-contenido">
          <PanelHeroes
            heroes={heroes}
            habilidades={habilidades}
            grupo={grupo}
            onAnadir={asistente.anadirHeroe}
            onQuitar={asistente.quitarHeroe}
            movimientoFijo={movimientoFijo}
          />
          <PanelAliados
            grupos={aliadosDelGrupo}
            elegidos={elegidos}
            onAlternar={asistente.alternarAliado}
            nota={
              pnj &&
              (pnj.estado === 'acompanante'
                ? 'El PNJ de esta misión os acompaña desde el principio: añade su perfil.'
                : 'Esta misión tiene un PNJ que puede unirse al grupo si lo encontráis: añade su perfil entonces.')
            }
          />
          <button type="button" className="button" disabled={!grupo.length} onClick={asistente.avanzar}>
            Siguiente: {TITULO_PASO.hechizos}
          </button>
        </section>
      ) : paso === 'hechizos' ? (
        <section className="paso-contenido">
          <PanelHechizos
            heroes={grupo.flatMap((seleccionado) => {
              const heroe = heroes.find((h) => h.id === seleccionado.tipo)
              return heroe ? [{ ...seleccionado, heroe }] : []
            })}
            mazo={mazos.hechizos}
            seleccion={config.hechizos ?? {}}
            onCambiar={asistente.cambiarHechizosHeroe}
            onAceptar={asistente.avanzar}
          />
        </section>
      ) : paso === 'mazos' ? (
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
            Siguiente: {TITULO_PASO.monstruos}
          </button>
        </section>
      ) : paso === 'monstruos' ? (
        <section className="paso-contenido">
          <PanelMonstruos
            mision={mision}
            monstruos={monstruos}
            bestiario={bestiario}
            heroes={grupo.length}
            elegidos={config.monstruos}
            onCambiar={asistente.cambiarMonstruos}
          />
          <button type="button" className="button" onClick={asistente.avanzar}>
            Siguiente: {TITULO_PASO.barajar}
          </button>
        </section>
      ) : (
        <section className="paso-contenido">
          <ul className="recuento">
            <li>
              <span>Movimiento</span>
              <span>{movimientoFijo ? 'Atributo de cada héroe' : `${DADOS_MOVIMIENTO} por turno`}</span>
            </li>
            <li className={grupo.length ? undefined : 'mal'}>
              <span>Grupo</span>
              <span>{nombresGrupo || 'Sin grupo'}</span>
            </li>
            {ids.map((id) => (
              <li key={id} className={conAvisos.includes(id) ? 'mal' : undefined}>
                <span>{NOMBRE_MAZO[id as IdMazo]}</span>
                <span>{seleccion(config, id).cartas.length} cartas</span>
              </li>
            ))}
            {tesorosYSucesos && (
              <li>
                <span>Tesoros y sucesos</span>
                <span>Equilibrado automático</span>
              </li>
            )}
            <li className={miniaturas ? undefined : 'mal'}>
              <span>Monstruos</span>
              <span>{miniaturas} miniaturas</span>
            </li>
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
          Se anulará el barajado{aventura.partida && ' y se perderá la partida en curso'} y tendrás que volver a barajar
          los mazos. La selección de cartas se conserva.
        </ConfirmarDialog>
      )}
    </>
  )
}
