import { useState } from 'react'
import { CONFIG_EXTRAS_DEFECTO } from './reglasExtras'
import type { ConfigExtras } from './tipos'

const CLAVE = 'fanquest.generar.configExtras.v2'

function leer(): ConfigExtras {
  try {
    const guardada = localStorage.getItem(CLAVE)
    if (guardada) return { ...CONFIG_EXTRAS_DEFECTO, ...JSON.parse(guardada) }
  } catch {
    // sin almacenamiento disponible: se usa la configuración por defecto
  }
  return CONFIG_EXTRAS_DEFECTO
}

/**
 * Configuración de reglas extras recordada en este navegador. Hasta que
 * quien juega la guarda mandan los valores por defecto, y las reglas que no
 * ha tocado conservan siempre su estado inicial.
 */
export function useConfigExtras() {
  const [config, setConfig] = useState(leer)

  const guardar = (nueva: ConfigExtras) => {
    setConfig(nueva)
    try {
      localStorage.setItem(CLAVE, JSON.stringify(nueva))
    } catch {
      // sin almacenamiento disponible: la configuración dura la sesión
    }
  }

  return [config, guardar] as const
}
