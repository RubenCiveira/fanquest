import { useMemo, useState } from 'react'
import type { Configuracion, DescripcionEstancia, Mapa, ProveedorMapa } from '../gamemap'
import { DialogoEstancia } from './DialogoEstancia'
import { escuadrasDePrueba } from './escuadras'

/** Reglas del ejemplo: activaciones alternas y cada héroe elige modo agresivo o sigiloso */
const CONFIGURACION: Configuracion = { ordenActivaciones: 'alternas', modosActivacion: 'agresivo-sigiloso' }

type Peticion = { mapa?: Mapa; responder: (d: DescripcionEstancia) => void; cancelar: () => void }

/** Si el error es que se canceló el diálogo: no hay estancia nueva y no es un fallo */
export const esCancelacion = (error: unknown) => error instanceof DOMException && error.name === 'AbortError'

/**
 * Proveedor del mapa de pruebas: las estancias se describen a mano en un
 * diálogo, los héroes son las escuadras de prueba y las reglas, `CONFIGURACION`. El `dialogo` se pinta en
 * la página; cerrarlo sin crear rechaza la promesa con una cancelación
 * (`esCancelacion`)
 */
export function useProveedorDebug() {
  const [peticion, setPeticion] = useState<Peticion>()

  const proveedor = useMemo<ProveedorMapa>(
    () => ({
      configuracion: CONFIGURACION,
      ...escuadrasDePrueba,
      describirEstancia: (mapa) =>
        new Promise((resolve, reject) =>
          setPeticion({
            mapa,
            responder: (d) => (setPeticion(undefined), resolve(d)),
            cancelar: () => (setPeticion(undefined), reject(new DOMException('Estancia cancelada', 'AbortError'))),
          }),
        ),
    }),
    [],
  )

  const dialogo = peticion && <DialogoEstancia mapa={peticion.mapa} onCrear={peticion.responder} onCancelar={peticion.cancelar} />
  return { proveedor, dialogo }
}
