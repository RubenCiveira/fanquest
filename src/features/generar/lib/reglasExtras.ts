import { barajar } from '../../../lib/dados'
import { REGLAS_EXTRAS } from '../config/reglasExtras'
import type { ConfigExtras, Preparacion, ReglaExtra } from './tipos'

/** Configuración inicial: la que fijan las reglas del juego */
export const CONFIG_EXTRAS_DEFECTO: ConfigExtras = {
  activas: {},
  probUna: REGLAS_EXTRAS.probabilidades.una,
  probDos: REGLAS_EXTRAS.probabilidades.dos,
}

export function reglaActiva(regla: ReglaExtra, config: ConfigExtras): boolean {
  return config.activas[regla.id] ?? regla.activa
}

/** Probabilidades normalizadas si su suma supera 100 */
export function probabilidades({ probUna, probDos }: ConfigExtras) {
  const p1 = Math.max(0, probUna)
  const p2 = Math.max(0, probDos)
  const suma = p1 + p2
  if (suma <= 100) return { p1, p2, ninguna: 100 - suma }
  return { p1: (p1 / suma) * 100, p2: (p2 / suma) * 100, ninguna: 0 }
}

/** 0, 1 o 2 reglas extras al azar entre las activas */
export function tirarReglasExtras(config: ConfigExtras): ReglaExtra[] {
  const { p1, p2 } = probabilidades(config)
  const r = Math.random() * 100
  const count = r < p1 ? 1 : r < p1 + p2 ? 2 : 0

  return barajar(
    REGLAS_EXTRAS.reglas.filter((regla) => reglaActiva(regla, config)),
  ).slice(0, count)
}

/** Aplica los efectos declarados por las reglas extras */
export function aplicarReglasExtras(
  extras: ReglaExtra[],
  base: Preparacion,
  dadosTrampa: readonly string[],
): Preparacion {
  const valores = { ...base, dadoTrampa: dadosTrampa.indexOf(base.dadoTrampa) }

  for (const { campo, suma, minimo = -Infinity } of extras.flatMap(
    ({ efectos = [] }) => efectos,
  )) {
    valores[campo] = Math.max(minimo, valores[campo] + suma)
  }

  const dado = Math.min(dadosTrampa.length - 1, Math.max(0, valores.dadoTrampa))
  return { ...valores, dadoTrampa: dadosTrampa[dado] }
}
