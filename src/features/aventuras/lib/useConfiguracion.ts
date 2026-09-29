import { useState } from 'react'
import type { Modo } from '../config/mazos'
import type { DatosConfiguracion } from '../rutas'
import { avanzar, estadoAventura, volverA } from './asistente'
import { actualizarAventura } from './aventuras'
import type { SeleccionMonstruos } from './monstruos'
import type { IdMazo } from '../../../lib/mazos'
import type { Sexo } from '../../../lib/personajes'
import {
  alternarAliado,
  anadirHeroe,
  barajarYGuardar,
  quitarHeroe,
  type Configuracion,
  type Paso,
  type Reglas,
  type SeleccionMazo,
} from './preparacion'

/** Configuración de la misión en edición, guardada en cada cambio */
export function useConfiguracion({ aventura, configuracion, mazos, heroes }: DatosConfiguracion) {
  const [config, setConfig] = useState(configuracion)

  const guardar = (nueva: Configuracion) => {
    setConfig(nueva)
    // sin barajado no hay partida: volver a preparar la descarta
    const partida = nueva.barajado ? aventura.partida : undefined
    void actualizarAventura({ ...aventura, estado: estadoAventura(nueva, partida), configuracion: nueva, partida })
  }

  return {
    config,
    /** Cualquier cambio de selección invalida el orden barajado */
    cambiarMazo: (id: IdMazo, seleccion: SeleccionMazo) =>
      guardar({ ...config, mazos: { ...config.mazos, [id]: seleccion }, barajado: undefined }),
    cambiarModo: (modo: Modo) => guardar({ ...config, modo, barajado: undefined }),
    cambiarReglas: (reglas: Reglas) => guardar({ ...config, reglas }),
    anadirHeroe: (tipo: string, nombre: string, sexo: Sexo) =>
      guardar(anadirHeroe(config, tipo, nombre, sexo, heroes, mazos.hechizos)),
    quitarHeroe: (id: string) => guardar(quitarHeroe(config, id, heroes)),
    cambiarHechizosHeroe: (id: string, hechizos: string[]) =>
      guardar({ ...config, hechizos: { ...config.hechizos, [id]: hechizos }, barajado: undefined }),
    alternarAliado: (clave: string) => guardar(alternarAliado(config, clave)),
    /** Sin selección se vuelve a la propuesta de la misión */
    cambiarMonstruos: (monstruos?: SeleccionMonstruos) => guardar({ ...config, monstruos }),
    avanzar: () => guardar(avanzar(config)),
    volverA: (paso: Paso) => guardar(volverA(config, paso)),
    barajar: () => guardar(barajarYGuardar(mazos, config)),
  }
}
