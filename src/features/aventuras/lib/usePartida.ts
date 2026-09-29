import { useState } from 'react'
import type { DatosPartida } from '../rutas'
import { estadoAventura } from './asistente'
import { actualizarAventura } from './aventuras'
import type { Partida } from './partida'
import { reglas } from './preparacion'
import { retirarCaidos, situar } from './mazmorra'

/** Acciones que se pueden deshacer (solo en esta visita a la página) */
const MAX_DESHACER = 20

/** Partida en curso, guardada tras cada acción */
export function usePartida({ aventura }: DatosPartida) {
  const [partida, setPartida] = useState(aventura.partida)
  const [anteriores, setAnteriores] = useState<Partida[]>([])

  const guardar = (accion: Partida) => {
    // con mapa, cada zona guarda su tamaño y su sitio en el mapa en cuanto se llega a ella, y quien muere
    // deja libre su casilla
    const nueva = reglas(aventura.configuracion).usarMapa ? situar(retirarCaidos(accion)) : accion
    setPartida(nueva)
    void actualizarAventura({ ...aventura, estado: estadoAventura(aventura.configuracion, nueva), partida: nueva })
  }

  return {
    partida,
    /** Aplica una acción del motor de la partida */
    hacer: (accion: (p: Partida) => Partida) => {
      setAnteriores([...anteriores.slice(1 - MAX_DESHACER), partida])
      guardar(accion(partida))
    },
    puedeDeshacer: anteriores.length > 0,
    deshacer: () => {
      const anterior = anteriores.at(-1)
      if (!anterior) return
      setAnteriores(anteriores.slice(0, -1))
      guardar(anterior)
    },
  }
}
