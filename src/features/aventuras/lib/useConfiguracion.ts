import { useState } from 'react'
import type { Modo } from '../config/mazos'
import type { DatosConfiguracion } from '../rutas'
import { avanzar, estadoAventura, volverA } from './asistente'
import { actualizarAventura } from './aventuras'
import type { IdMazo } from '../../../lib/mazos'
import { barajarYGuardar, type Configuracion, type Paso, type SeleccionMazo } from './preparacion'

/** Configuración de la misión en edición, guardada en cada cambio */
export function useConfiguracion({ aventura, configuracion, mazos }: DatosConfiguracion) {
  const [config, setConfig] = useState(configuracion)

  const guardar = (nueva: Configuracion) => {
    setConfig(nueva)
    void actualizarAventura({ ...aventura, estado: estadoAventura(nueva), configuracion: nueva })
  }

  return {
    config,
    /** Cualquier cambio de selección invalida el orden barajado */
    cambiarMazo: (id: IdMazo, seleccion: SeleccionMazo) =>
      guardar({ ...config, mazos: { ...config.mazos, [id]: seleccion }, barajado: undefined }),
    cambiarModo: (modo: Modo) => guardar({ ...config, modo, barajado: undefined }),
    avanzar: () => guardar(avanzar(config)),
    volverA: (paso: Paso) => guardar(volverA(config, paso)),
    barajar: () => guardar(barajarYGuardar(mazos, config)),
  }
}
