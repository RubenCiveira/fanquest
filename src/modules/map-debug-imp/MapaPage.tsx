import { useEffect, useState, useSyncExternalStore } from 'react'
import { Navigate, useParams } from 'react-router'
import { Icono } from '../../components/Icono'
import { PageHeader } from '../../components/PageHeader'
import {
  escuadrasDelMapa,
  estanciaEn,
  GestorMapa,
  motivoParaNoActuar,
  turnoDe,
  type Accion,
  type Casilla,
  type Estancia,
  type Mapa,
  type ProveedorMapa,
} from '../gamemap'
import { ETIQUETA_ORIENTACION, guardarMapa, obtenerMapa } from './mapas'
import { esCancelacion, useProveedorDebug } from './useProveedorDebug'
import { VistaEstancia } from './VistaEstancia'
import './mapDebug.css'

/** Un mapa de prueba: pulsa una casilla para ver de qué estancia es */
export function MapaPage() {
  const id = useParams().id ?? ''
  const guardado = obtenerMapa(id)
  const { proveedor, dialogo } = useProveedorDebug()
  if (!guardado) return <Navigate to="/map-debug" replace />
  return (
    <>
      <PageHeader title={id} backTo="/map-debug" />
      <Gestionado key={id} id={id} inicial={guardado.mapa} proveedor={proveedor} />
      {dialogo}
    </>
  )
}

type Seleccion = { estancia: string; elemento: string }

/**
 * El mapa en manos de su gestor: cada cambio se dibuja y se guarda. El
 * gestor se crea una sola vez: `inicial` se relee en cada render de la página
 * (al abrir el diálogo, p. ej.) y otro gestor perdería la estancia que se pide
 */
function Gestionado({ id, inicial, proveedor }: { id: string; inicial: Mapa; proveedor: ProveedorMapa }) {
  const [gestor] = useState(() => new GestorMapa(proveedor, inicial))
  const mapa = useSyncExternalStore(gestor.suscribir, () => gestor.mapa)
  const [seleccion, setSeleccion] = useState<Seleccion>()
  const [nota, setNota] = useState<string>()

  useEffect(() => gestor.suscribir((m) => guardarMapa(id, m)), [gestor, id])

  // la miniatura elegida, si es un héroe, muestra en corona las acciones de su escuadra
  const heroe = mapa.estancias.flatMap((e) => e.elementos).find((el) => el.id === seleccion?.elemento)
  const escuadraElegida = heroe?.tipo === 'heroe' ? heroe.escuadra : undefined
  const [acciones, setAcciones] = useState<{ escuadra: string; mapa: Mapa; lista: Accion[] }>()

  useEffect(() => {
    if (!escuadraElegida) return
    let vigente = true
    gestor.accionesDisponibles(escuadraElegida).then((lista) => vigente && setAcciones({ escuadra: escuadraElegida, mapa, lista }))
    return () => {
      vigente = false
    }
  }, [gestor, escuadraElegida, mapa])

  // las de otra escuadra o de un mapa anterior ya no valen
  const accionesVigentes = acciones?.escuadra === escuadraElegida && acciones?.mapa === mapa ? acciones.lista : []

  async function accionar(accion: string) {
    if (escuadraElegida) setNota(await gestor.ejecutarAccion(escuadraElegida, accion))
  }

  async function nuevaEstancia() {
    try {
      await gestor.nuevaEstancia()
    } catch (error) {
      if (!esCancelacion(error)) throw error
    }
  }

  /** Con un elemento elegido, la casilla es su sitio nuevo; si no, se informa de qué estancia es */
  function elegirCasilla(e: Estancia, c: Casilla) {
    if (seleccion?.estancia !== e.id) {
      const en = estanciaEn(e, c)
      setNota(en && `Casilla ${c.x},${c.y}: ${en.estancia.id} (${en.estancia.tipo}), casilla ${en.casilla.x},${en.casilla.y}. Ruta: ${en.ruta.map((r) => r.id).join(' › ')}.`)
      return
    }
    setNota(gestor.colocarElemento(e.id, seleccion.elemento, c))
    setSeleccion(undefined)
  }

  const turno = turnoDe(mapa)
  const { ordenActivaciones, modosActivacion } = gestor.configuracion

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
      <div className="map-debug-turno">
        <strong>Turno {turno.numero}</strong>
        <span className="nota">
          Activaciones {ordenActivaciones === 'alternas' ? 'alternas' : 'de todos los héroes primero'} ·{' '}
          {modosActivacion === 'agresivo-sigiloso' ? 'modo agresivo o sigiloso' : 'todas normales'}
        </span>
        <button type="button" className="button secondary" onClick={() => setNota(gestor.terminarTurno())}>
          Terminar turno
        </button>
      </div>
      <ul className="map-debug-escuadras">
        {escuadrasDelMapa(mapa).map(({ id: escuadra, nombre }) => {
          const activacion = turno.activaciones[escuadra]
          return (
            <li key={escuadra} className="map-debug-turno">
              <strong>{nombre}</strong>
              {activacion && !activacion.terminada && <span className="nota">Activándose en modo {activacion.modo}.</span>}
              {activacion?.terminada && <span className="nota">Activación completa en modo {activacion.modo}.</span>}
              {!activacion && turno.ultimosModos?.[escuadra] && (
                <span className="nota">Último modo: {turno.ultimosModos[escuadra]}.</span>
              )}
            </li>
          )
        })}
      </ul>
      {nota && <p className="nota">{nota}</p>}

      {mapa.estancias.map((e) => {
        const enEspera = e.elementos.filter((el) => !el.posicion)
        const elegido = seleccion?.estancia === e.id ? seleccion.elemento : undefined
        return (
          <article key={e.id} className="map-debug-estancia">
            <h2>
              {e.id} · {e.tipo} {e.columnas} × {e.filas}
              {e.orientacion && ` · ${ETIQUETA_ORIENTACION[e.orientacion]}`}
            </h2>
            <VistaEstancia
              estancia={e}
              elemento={elegido}
              onElegir={(c) => elegirCasilla(e, c)}
              onElegirElemento={(elemento) => setSeleccion({ estancia: e.id, elemento })}
              activaciones={turno.activaciones}
              ultimosModos={turno.ultimosModos}
              corona={seleccion?.estancia === e.id && escuadraElegida ? { acciones: accionesVigentes, onAccion: accionar } : undefined}
            />
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
                  {el.nombre} ({el.columnas} × {el.filas})
                </button>
              ))}
              {elegido && e.elementos.find((el) => el.id === elegido)?.posicion && (
                <button type="button" className="button secondary" onClick={aEspera}>
                  Devolver a la zona de espera
                </button>
              )}
            </div>
            {elegido && <p className="nota">Pulsa la casilla donde quieres su esquina superior izquierda.</p>}
            {elegido && escuadraElegida && motivoParaNoActuar(mapa, escuadraElegida) && <p className="nota">{motivoParaNoActuar(mapa, escuadraElegida)}</p>}
          </article>
        )
      })}
    </section>
  )
}
