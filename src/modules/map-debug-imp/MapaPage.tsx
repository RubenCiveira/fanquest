import { useEffect, useState, useSyncExternalStore } from 'react'
import { Navigate, useParams } from 'react-router'
import { Icono } from '../../components/Icono'
import { PageHeader } from '../../components/PageHeader'
import {
  activacionDe,
  escuadrasDe,
  estanciaEn,
  GestorMapa,
  jugadoresDe,
  jugadorEnTurno,
  numeroDeTurno,
  type Accion,
  type Casilla,
  type Estancia,
  type Mapa,
} from '../gamemap'
import { FormularioConfiguracion } from './FormularioConfiguracion'
import { ETIQUETA_ORIENTACION, guardarMapa, obtenerMapa } from './mapas'
import { PanelJugadores } from './PanelJugadores'
import { esCancelacion, useProveedorDebug } from './useProveedorDebug'
import { VistaMapa } from './VistaMapa'
import './mapDebug.css'

/** Un mapa de prueba: pulsa una casilla para ver de qué estancia es */
export function MapaPage() {
  const id = useParams().id ?? ''
  const guardado = obtenerMapa(id)
  if (!guardado) return <Navigate to="/map-debug" replace />
  return (
    <>
      <PageHeader title={id} backTo="/map-debug" />
      <Gestionado key={id} id={id} inicial={guardado.mapa} />
    </>
  )
}

type Seleccion = { estancia: string; elemento: string }

/**
 * El mapa en manos de su gestor, con su propio proveedor: cada cambio se
 * dibuja y se guarda. El gestor se crea una sola vez: `inicial` se relee en
 * cada render de la página (al abrir el diálogo, p. ej.) y otro gestor
 * perdería la estancia que se pide. Las estancias del mapa guardado se avisan
 * como creadas, para que el proveedor les asocie sus puertas de prueba (sin
 * atarlas a este gestor: StrictMode crea dos y React se queda con uno)
 */
function Gestionado({ id, inicial }: { id: string; inicial: Mapa }) {
  const { proveedor, dialogo, configuracion, cambiarConfiguracion } = useProveedorDebug()
  const [gestor] = useState(() => {
    const nuevo = new GestorMapa(proveedor, inicial)
    inicial.estancias.forEach((e) => proveedor.estanciaCreada(e, nuevo))
    return nuevo
  })
  const mapa = useSyncExternalStore(gestor.suscribir, () => gestor.mapa)
  const [seleccion, setSeleccion] = useState<Seleccion>()
  const [nota, setNota] = useState<string>()

  useEffect(() => gestor.suscribir((m) => guardarMapa(id, m)), [gestor, id])

  // la miniatura elegida, si es un personaje, muestra en corona sus acciones
  const escuadraDelElegido = escuadrasDe(mapa).find((e) => e.personajes.some((h) => h.id === seleccion?.elemento))
  const personajeElegido = escuadraDelElegido?.personajes.find((h) => h.id === seleccion?.elemento)
  const escuadraElegida = escuadraDelElegido?.id
  // un personaje ya en el mapa no se coloca a mano: se arrastra
  const personajeEnMapa = !!personajeElegido?.casilla
  const [acciones, setAcciones] = useState<{ escuadra: string; mapa: Mapa; lista: Accion[] }>()

  useEffect(() => {
    if (!escuadraElegida) return
    let vigente = true
    gestor.accionesDisponibles(escuadraElegida, seleccion?.elemento).then((lista) => vigente && setAcciones({ escuadra: escuadraElegida, mapa, lista }))
    return () => {
      vigente = false
    }
  }, [gestor, escuadraElegida, seleccion?.elemento, mapa])

  // las de otra escuadra o de un mapa anterior ya no valen
  const accionesVigentes = acciones?.escuadra === escuadraElegida && acciones?.mapa === mapa ? acciones.lista : []

  /** Ejecuta la acción de la corona; si abre un diálogo (una puerta pide una estancia nueva) y se cancela, no pasa nada */
  async function accionar(accion: string) {
    if (!escuadraElegida) return
    try {
      setNota(await gestor.ejecutarAccion(escuadraElegida, accion, seleccion?.elemento))
    } catch (error) {
      if (!esCancelacion(error)) throw error
    }
  }

  async function nuevaEstancia() {
    try {
      await gestor.nuevaEstancia()
    } catch (error) {
      if (!esCancelacion(error)) throw error
    }
  }

  /**
   * Con un elemento elegido que se coloca a mano, la casilla es su sitio
   * nuevo; si no (o es un personaje ya en el mapa, que se arrastra), se informa de
   * qué estancia es
   */
  function elegirCasilla(e: Estancia, c: Casilla) {
    if (seleccion?.estancia !== e.id || personajeEnMapa) {
      const en = estanciaEn(e, c)
      setNota(en && `Casilla ${c.x},${c.y}: ${en.estancia.id} (${en.estancia.tipo}), casilla ${en.casilla.x},${en.casilla.y}. Ruta: ${en.ruta.map((r) => r.id).join(' › ')}.`)
      return
    }
    setNota(personajeElegido ? gestor.colocarPersonaje(personajeElegido.id, c) : gestor.colocarElemento(e.id, seleccion.elemento, c))
    setSeleccion(undefined)
  }

  const numero = numeroDeTurno(mapa)
  const enTurno = jugadorEnTurno(mapa, configuracion)
  const nombreDeJugador = (jugador: string) => jugadoresDe(mapa).jugadores.find((j) => j.id === jugador)?.nombre ?? jugador

  function aEspera() {
    if (!seleccion) return
    setNota(gestor.colocarElemento(seleccion.estancia, seleccion.elemento))
    setSeleccion(undefined)
  }

  return (
    <section className="map-debug">
      <button type="button" className="button" onClick={nuevaEstancia}>
        <Icono nombre="mas" />
        Nueva estancia
      </button>
      <FormularioConfiguracion configuracion={configuracion} onCambiar={cambiarConfiguracion} />
      <PanelJugadores jugadores={jugadoresDe(mapa)} enTurno={enTurno} onCambiar={(jugadores) => setNota(gestor.cambiarJugadores(jugadores))} />
      <div className="map-debug-turno">
        <strong>Turno {numero}</strong>
        <span className="nota">{enTurno ? `Le toca a ${enTurno.nombre}.` : 'Nadie tiene nada que activar: termina el turno.'}</span>
        <button type="button" className="button secondary" onClick={() => setNota(gestor.terminarTurno())}>
          Terminar turno
        </button>
      </div>
      <ul className="map-debug-escuadras">
        {escuadrasDe(mapa).map(({ id: escuadra, nombre, jugador, modo, activo, personajes }) => {
          const activacion = activacionDe(mapa, escuadra)
          return (
            <li key={escuadra} className="map-debug-turno">
              <strong>{nombre}</strong>
              <span className="nota">de {nombreDeJugador(jugador)}.</span>
              {activacion && !activacion.terminada && (
                <span className="nota">
                  Activándose en modo {activacion.modo}
                  {activo && ` con ${personajes.find((h) => h.id === activo)?.nombre ?? activo}`}.
                </span>
              )}
              {activacion?.terminada && <span className="nota">Activación completa en modo {activacion.modo}.</span>}
              {!activacion && modo && <span className="nota">Último modo: {modo}.</span>}
            </li>
          )
        })}
      </ul>
      {nota && <p className="nota">{nota}</p>}

      <VistaMapa
        mapa={mapa}
        elemento={seleccion?.elemento}
        onElegir={elegirCasilla}
        onElegirElemento={(elemento) => {
          const personaje = escuadrasDe(mapa).flatMap((e) => e.personajes).find((h) => h.id === elemento)
          const estancia = personaje?.estancia ?? mapa.estancias.find((e) => e.elementos.some((el) => el.id === elemento))?.id
          if (estancia) setSeleccion({ estancia, elemento })
        }}
        corona={escuadraElegida ? { acciones: accionesVigentes, onAccion: accionar } : undefined}
        opcionesMovimiento={(personaje) => gestor.opcionesMovimiento(personaje)}
        onMover={async (personaje, recorrido) => setNota(await gestor.moverPersonaje(personaje, recorrido))}
        medicion={configuracion.medicionMovimiento}
        terrenoPersonajes={configuracion.terrenoPersonajes}
        motivoParaNoActuar={(personaje) => gestor.motivoParaNoActuar(personaje)}
        jugadorEnTurno={enTurno}
      />

      {mapa.estancias.map((e) => {
        const enEspera = [
          ...e.elementos.filter((el) => !el.posicion).map((el) => ({ id: el.id, texto: `${el.nombre} (${el.columnas} × ${el.filas})` })),
          ...escuadrasDe(mapa).flatMap((esc) => esc.personajes.filter((h) => h.estancia === e.id && !h.casilla).map((h) => ({ id: h.id, texto: h.nombre }))),
        ]
        const elegido = seleccion?.estancia === e.id ? seleccion.elemento : undefined
        return (
          <article key={e.id} className="map-debug-estancia">
            <h2>
              {e.id} · {e.tipo} {e.columnas} × {e.filas}
              {e.orientacion && ` · ${ETIQUETA_ORIENTACION[e.orientacion]}`}
            </h2>
            <div className="map-debug-espera">
              <span className="nota">Zona de espera:</span>
              {enEspera.length === 0 && <span className="nota">vacía</span>}
              {enEspera.map((el) => (
                <button
                  key={el.id}
                  type="button"
                  className={`button secondary${el.id === elegido ? ' activo' : ''}`}
                  aria-pressed={el.id === elegido}
                  onClick={() => setSeleccion({ estancia: e.id, elemento: el.id })}
                >
                  {el.texto}
                </button>
              ))}
              {elegido && !personajeEnMapa && e.elementos.find((el) => el.id === elegido)?.posicion && (
                <button type="button" className="button secondary" onClick={aEspera}>
                  Devolver a la zona de espera
                </button>
              )}
            </div>
            {elegido && !personajeEnMapa && <p className="nota">Pulsa la casilla donde quieres su esquina superior izquierda.</p>}
            {elegido && personajeElegido && gestor.motivoParaNoActuar(personajeElegido.id) && <p className="nota">{gestor.motivoParaNoActuar(personajeElegido.id)}</p>}
          </article>
        )
      })}
      {dialogo}
    </section>
  )
}
