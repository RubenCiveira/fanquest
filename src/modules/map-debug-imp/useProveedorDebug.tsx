import { useMemo, useState } from 'react'
import { ConfirmarDialog } from '../../components/ConfirmarDialog'
import type { Configuracion, DescripcionEstancia, Direccion, Mapa, ProveedorMapa } from '../gamemap'
import { DialogoEstancia } from './DialogoEstancia'
import { escuadrasDePrueba } from './escuadras'

/** Reglas del ejemplo: activaciones alternas y cada héroe elige modo agresivo o sigiloso */
const CONFIGURACION: Configuracion = { ordenActivaciones: 'alternas', modosActivacion: 'agresivo-sigiloso' }

/** Pregunta de `confirmar` pendiente de respuesta */
type Confirmacion = { mensaje: string; responder: (si: boolean) => void }

type Peticion = { mapa?: Mapa; entrada?: Direccion; responder: (d: DescripcionEstancia) => void; cancelar: () => void }

/** Si el error es que se canceló el diálogo: no hay estancia nueva y no es un fallo */
export const esCancelacion = (error: unknown) => error instanceof DOMException && error.name === 'AbortError'

/**
 * Proveedor del mapa de pruebas: las estancias se describen a mano en un
 * diálogo, los héroes son las escuadras de prueba, las reglas son
 * `CONFIGURACION` y las confirmaciones, un diálogo de confirmar o cancelar. El `dialogo` se pinta en
 * la página; cerrarlo sin crear rechaza la promesa con una cancelación
 * (`esCancelacion`)
 */
export function useProveedorDebug() {
  const [peticion, setPeticion] = useState<Peticion>()
  const [confirmacion, setConfirmacion] = useState<Confirmacion>()

  const proveedor = useMemo<ProveedorMapa>(
    () => ({
      configuracion: CONFIGURACION,
      confirmar: (mensaje) =>
        new Promise((resolve) => setConfirmacion({ mensaje, responder: (si) => (setConfirmacion(undefined), resolve(si)) })),
      ...escuadrasDePrueba,
      describirEstancia: (mapa, entrada) =>
        new Promise((resolve, reject) =>
          setPeticion({
            mapa,
            entrada,
            responder: (d) => (setPeticion(undefined), resolve(d)),
            cancelar: () => (setPeticion(undefined), reject(new DOMException('Estancia cancelada', 'AbortError'))),
          }),
        ),
    }),
    [],
  )

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
  return { proveedor, dialogo }
}
