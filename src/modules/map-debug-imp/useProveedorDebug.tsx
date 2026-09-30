import { useMemo, useRef, useState } from 'react'
import { ConfirmarDialog } from '../../components/ConfirmarDialog'
import type { Configuracion, DescripcionEstancia, Direccion, Mapa, ProveedorMapa } from '../gamemap'
import { cargarConfiguracion, guardarConfiguracion } from './configuracion'
import { DialogoEstancia } from './DialogoEstancia'
import { escuadrasDePrueba } from './escuadras'
import { PuertasDePrueba } from './modelo/puerta'

/** Pregunta de `confirmar` pendiente de respuesta */
type Confirmacion = { mensaje: string; responder: (si: boolean) => void }

type Peticion = { mapa?: Mapa; entrada?: Direccion; responder: (d: DescripcionEstancia) => void; cancelar: () => void }

/** Si el error es que se canceló el diálogo: no hay estancia nueva y no es un fallo */
export const esCancelacion = (error: unknown) => error instanceof DOMException && error.name === 'AbortError'

/**
 * Proveedor del mapa de pruebas: las estancias se describen a mano en un
 * diálogo, los héroes son las escuadras de prueba, las reglas son las del
 * formulario de configuración (`configuracion` y `cambiarConfiguracion`: el
 * gestor las lee cada vez, así que un cambio vale al momento) y las
 * confirmaciones, un diálogo de confirmar o cancelar.
 * A cada estancia creada se le asocian puertas de prueba (`PuertasDePrueba`),
 * cuyas acciones (abrirse) ofrecen los héroes que las pisan. El `dialogo` se pinta en la página; cerrarlo sin
 * crear rechaza la promesa con una cancelación (`esCancelacion`)
 */
export function useProveedorDebug() {
  const [peticion, setPeticion] = useState<Peticion>()
  const [confirmacion, setConfirmacion] = useState<Confirmacion>()
  const [configuracion, setConfiguracion] = useState(cargarConfiguracion)
  // la que lee el gestor: la del proveedor no cambia al volver a pintar
  const vigente = useRef(configuracion)

  function cambiarConfiguracion(nueva: Configuracion) {
    vigente.current = nueva
    guardarConfiguracion(nueva)
    setConfiguracion(nueva)
  }

  const proveedor = useMemo<ProveedorMapa>(() => {
    const puertas = new PuertasDePrueba()
    return {
      get configuracion() {
        return vigente.current
      },
      confirmar: (mensaje) =>
        new Promise((resolve) => setConfirmacion({ mensaje, responder: (si) => (setConfirmacion(undefined), resolve(si)) })),
      ...escuadrasDePrueba(puertas),
      estanciaCreada: (estancia) => puertas.asociar(estancia),
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
  }, [])

  const dialogo = (
    <>
      {peticion && <DialogoEstancia mapa={peticion.mapa} entrada={peticion.entrada} onCrear={peticion.responder} onCancelar={peticion.cancelar} />}
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
  return { proveedor, dialogo, configuracion, cambiarConfiguracion }
}
