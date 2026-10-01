import { useMemo, useRef, useState } from 'react'
import { ConfirmarDialog } from '../../components/ConfirmarDialog'
import {
  activacionDeJugador,
  escuadrasDe,
  personajesNoJugadoresDe,
  type Ataque,
  type AtaqueDeEscuadra,
  type Configuracion,
  type DescripcionEstancia,
  type DescripcionPersonajeNoJugador,
  type Direccion,
  type Jugador,
  type Mapa,
  type MapaEnJuego,
  type ModoActivacion,
  type PersonajeNoJugador,
  type ProveedorMapa,
} from '../gamemap'
import { AvisoFinTurno, AvisoTrampas, AvisoTurno } from './AvisoTurno'
import { cargarConfiguracion, guardarConfiguracion, JUGADOR_MONSTRUOS } from './configuracion'
import { DialogoAtaque } from './DialogoAtaque'
import { DialogoReparto } from './DialogoReparto'
import { DialogoEstancia } from './DialogoEstancia'
import { escuadrasDePrueba, sinCoherenciaDePrueba } from './escuadras'
import { iniciativaDePrueba } from './iniciativa'
import { PersonajeDePrueba, type DialogosDePrueba } from './modelo/personaje'
import { PuertasDePrueba } from './modelo/puerta'

/** Pregunta de `confirmar` pendiente de respuesta */
type Confirmacion = { mensaje: string; responder: (si: boolean) => void }

type Peticion = { mapa?: Mapa; entrada?: Direccion; responder: (d: DescripcionEstancia) => void; cancelar: () => void }

/** Si el error es que se canceló el diálogo: no hay estancia nueva y no es un fallo */
export const esCancelacion = (error: unknown) => error instanceof DOMException && error.name === 'AbortError'

/**
 * Proveedor del mapa de pruebas: las estancias se describen a mano en un
 * diálogo, los personajes son las escuadras de prueba, las reglas son las del
 * formulario de configuración (`configuracion` y `cambiarConfiguracion`: el
 * gestor las lee cada vez, así que un cambio vale al momento) y las
 * confirmaciones, un diálogo de confirmar o cancelar. Tras cada activación
 * avisa en otro diálogo de a quién le toca.
 * A cada estancia creada se le asocian puertas de prueba (`PuertasDePrueba`),
 * cuyas acciones (abrirse) ofrecen los personajes que las pisan. Los
 * personajes no jugadores, que no tienen clase en el gestor, resuelven lo que
 * hacen con la de prueba (`claseDeNoJugador`). El `dialogo` se pinta en la
 * página; cerrarlo sin crear rechaza la promesa con una cancelación
 * (`esCancelacion`)
 */
export function useProveedorDebug(inicial?: Mapa) {
  const [peticion, setPeticion] = useState<Peticion>()
  const [confirmacion, setConfirmacion] = useState<Confirmacion>()
  const [turno, setTurno] = useState<{ jugador: Jugador; modo?: ModoActivacion }>()
  const [finTurno, setFinTurno] = useState<MapaEnJuego>()
  const [ataque, setAtaque] = useState<{ ataque: Ataque; responder: (dano: number) => void; cancelar: () => void }>()
  const [reparto, setReparto] = useState<{ ataque: AtaqueDeEscuadra; responder: (reparto: Record<string, number>) => void; cancelar: () => void }>()
  const [aviso, setAviso] = useState<{ titulo: string; texto: string; cerrar: () => void }>()
  const [configuracion, setConfiguracion] = useState(cargarConfiguracion)
  // la que lee el gestor: la del proveedor no cambia al volver a pintar
  const vigente = useRef(configuracion)
  const [escuadrasMonstruos] = useState(() => {
    let actuales: DescripcionPersonajeNoJugador[][] = inicial
      ? escuadrasDe(inicial)
          .filter((e) => e.id.startsWith('escuadra-monstruos-'))
          .map((e) => e.personajes.map(({ id, nombre, imagenVtt }) => ({ id, nombre, ...(imagenVtt && { imagenVtt }), jugador: JUGADOR_MONSTRUOS })))
      : []
    return {
      listar: () => actuales,
      guardar: (nuevas: DescripcionPersonajeNoJugador[][]) => {
        actuales = nuevas
      },
    }
  })

  function cambiarConfiguracion(nueva: Configuracion) {
    vigente.current = nueva
    guardarConfiguracion(nueva)
    setConfiguracion(nueva)
  }

  const { proveedor, claseDeNoJugador } = useMemo(() => {
    const puertas = new PuertasDePrueba()
    const dialogos: DialogosDePrueba = {
      resolverAtaque: (ataque) =>
        new Promise((resolve, reject) =>
          setAtaque({
            ataque,
            responder: (dano) => (setAtaque(undefined), resolve(dano)),
            cancelar: () => (setAtaque(undefined), reject(new DOMException('Ataque cancelado', 'AbortError'))),
          }),
        ),
      repartirDano: (ataque) =>
        new Promise((resolve, reject) =>
          setReparto({
            ataque,
            responder: (r) => (setReparto(undefined), resolve(r)),
            cancelar: () => (setReparto(undefined), reject(new DOMException('Ataque cancelado', 'AbortError'))),
          }),
        ),
      avisar: (aviso) => new Promise((resolve) => setAviso({ ...aviso, cerrar: () => (setAviso(undefined), resolve()) })),
    }
    /** Los personajes no jugadores no tienen clase en el gestor: la de prueba, para resolver lo que hacen (atacar…) */
    const claseDeNoJugador = (personaje: PersonajeNoJugador) => new PersonajeDePrueba(personaje, puertas, dialogos)
    const proveedor: ProveedorMapa = {
      get configuracion() {
        return vigente.current
      },
      confirmar: (mensaje) =>
        new Promise((resolve) => setConfirmacion({ mensaje, responder: (si) => (setConfirmacion(undefined), resolve(si)) })),
      ...escuadrasDePrueba(puertas, escuadrasMonstruos.listar, dialogos),
      estanciaCreada: (estancia) => puertas.asociar(estancia),
      turnoDe: (jugador, mapa) =>
        setTurno({
          jugador,
          ...(vigente.current.modosActivacion === 'agresivo-sigiloso' && personajesNoJugadoresDe(mapa.mapa).some((p) => p.jugador === jugador.id)
            ? { modo: activacionDeJugador(mapa.mapa, jugador.id)?.activacion.terminada === false ? activacionDeJugador(mapa.mapa, jugador.id)?.activacion.modo : 'sigiloso' }
            : {}),
        }),
      finDeTurno: (mapa) => setFinTurno(mapa),
      ordenDelTurno: (mapa) => iniciativaDePrueba(mapa.mapa),
      escuadraSinCoherencia: (escuadra, fuera, mapa) => void sinCoherenciaDePrueba(escuadra, fuera, mapa, dialogos),
      describirEstancia: (mapa, entrada) =>
        new Promise((resolve, reject) =>
          setPeticion({
            mapa,
            entrada,
            responder: (d) => (setPeticion(undefined), resolve(d)),
            cancelar: () => (setPeticion(undefined), reject(new DOMException('Estancia cancelada', 'AbortError'))),
          }),
        ),
    }
    return { proveedor, claseDeNoJugador }
  }, [escuadrasMonstruos.listar])

  const dialogo = (
    <>
      {peticion && (
        <DialogoEstancia
          mapa={peticion.mapa}
          entrada={peticion.entrada}
          onCrear={peticion.responder}
          onEscuadrasMonstruos={escuadrasMonstruos.guardar}
          onCancelar={peticion.cancelar}
        />
      )}
      {turno && <AvisoTurno key={turno.jugador.id} jugador={turno.jugador} modo={turno.modo} onCerrar={() => setTurno(undefined)} />}
      {aviso && <AvisoTrampas titulo={aviso.titulo} texto={aviso.texto} onCerrar={aviso.cerrar} />}
      {ataque && <DialogoAtaque ataque={ataque.ataque} onAtacar={ataque.responder} onCancelar={ataque.cancelar} />}
      {reparto && <DialogoReparto ataque={reparto.ataque} onRepartir={reparto.responder} onCancelar={reparto.cancelar} />}
      {finTurno && <AvisoFinTurno onTerminar={() => (setFinTurno(undefined), finTurno.terminarTurno())} />}
      {confirmacion && (
        // al confirmar, el diálogo también se cierra: la segunda respuesta ya no cuenta
        <ConfirmarDialog
          titulo="Confirmar"
          accion="Confirmar"
          onConfirmar={() => confirmacion.responder(true)}
          onCerrar={() => confirmacion.responder(false)}
        >
          {confirmacion.mensaje}
        </ConfirmarDialog>
      )}
    </>
  )
  return { proveedor, claseDeNoJugador, dialogo, configuracion, cambiarConfiguracion }
}
