import { useState } from 'react'
import type { DatosConfiguracion } from '../rutas'
import { actualizarAventura } from './aventuras'
import type { IdMazo } from './mazos'
import { barajarYGuardar, type Configuracion, type SeleccionMazo } from './preparacion'
import type { Modo } from '../config/mazos'

/** Configuración de la misión en edición, guardada en cada cambio */
export function useConfiguracion({ aventura, configuracion, mazos }: DatosConfiguracion) {
  const [config, setConfig] = useState(configuracion)

  const guardar = (nueva: Configuracion) => {
    setConfig(nueva)
    void actualizarAventura({ ...aventura, configuracion: nueva })
  }

  return {
    config,
    /** Cualquier cambio de selección invalida el orden barajado */
    cambiarMazo: (id: IdMazo, seleccion: SeleccionMazo) =>
      guardar({ ...config, mazos: { ...config.mazos, [id]: seleccion }, barajado: undefined }),
    cambiarModo: (modo: Modo) => guardar({ ...config, modo, barajado: undefined }),
    barajar: () => guardar(barajarYGuardar(mazos, config)),
  }
}
