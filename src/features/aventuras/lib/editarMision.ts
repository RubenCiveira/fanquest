import { rellenar } from '../../../lib/texto'
import { FACCIONES } from '../../generar/config/facciones'
import { PREPARACION } from '../../generar/config/preparacion'
import { REGLAS_EXTRAS } from '../../generar/config/reglasExtras'
import type { Faccion, Mision, TipoMision } from '../../generar/lib/tipos'

/** Misión para rellenar a mano: la preparación estándar de Aventuras Infinitas */
export function misionVacia(tipo: TipoMision): Mision {
  const [faccion] = FACCIONES
  return aplicarTipo(
    aplicarFaccion(
      {
        regla: tipo.regla,
        titulo: '',
        introduccion: '',
        epilogo: '',
        salasNormales: PREPARACION.salasNormales.min,
        salasEspeciales: PREPARACION.salasEspeciales.min,
        pasillos: PREPARACION.pasillos.min,
        peligro: PREPARACION.peligro,
        dadoTrampa: PREPARACION.dadoTrampa,
        recompensa: 100,
        mazoAtrezo: PREPARACION.mazoAtrezo,
        faccion: { nombre: '', errante: '', erranteSuperior: '' },
        jefe: '',
        tipoJefe: '',
        puntosCuerpoJefe: PREPARACION.puntosCuerpoJefe,
        objetivo: '',
        salaObjetivo: PREPARACION.salaObjetivo,
        reglaEspecial: '',
        efectos: [],
        extras: [],
        sinReglasExtras: REGLAS_EXTRAS.sinReglas,
      },
      faccion,
    ),
    tipo,
  )
}

/**
 * Tipo de misión: su regla especial (texto y efectos para la partida) y su
 * objetivo, con los datos que ya tiene la misión; los marcadores sin valor
 * ({pnj}, {objeto}…) quedan a la vista para completarlos a mano
 */
export const aplicarTipo = (m: Mision, tipo: TipoMision): Mision => ({
  ...m,
  regla: tipo.regla,
  reglaEspecial: tipo.texto,
  efectos: tipo.efectos,
  objetivo: rellenar(tipo.objetivo, {
    faccion: m.faccion.nombre,
    jefe: m.jefe || null,
    tipoJefe: m.tipoJefe,
    recompensa: m.recompensa,
  }),
})

/** Facción: sus errantes y, si el tipo de jefe no es suyo, el primero de los suyos */
export function aplicarFaccion(m: Mision, f: Faccion): Mision {
  const tipos = f.jefes.map((j) => j.tipo)
  return {
    ...m,
    faccion: { nombre: f.nombre, errante: f.errante, erranteSuperior: f.erranteSuperior },
    tipoJefe: tipos.includes(m.tipoJefe) ? m.tipoJefe : (tipos[0] ?? ''),
  }
}

/** Marca del archivo exportado, para reconocerlo al importarlo */
const FORMATO = 'fetenquest-aventura'

export const exportarMision = (m: Mision) => JSON.stringify({ formato: FORMATO, version: 1, mision: m }, null, 2)

/**
 * Lee una aventura exportada (o una misión suelta). Lo que falte toma el
 * valor de una misión vacía; falla si no es JSON o no tiene título.
 */
export function importarMision(texto: string, base: Mision): Mision {
  let datos: unknown
  try {
    datos = JSON.parse(texto)
  } catch {
    throw new Error('El texto no es JSON válido.')
  }
  const envuelta = typeof datos === 'object' && datos !== null && 'mision' in datos ? datos.mision : datos
  if (typeof envuelta !== 'object' || envuelta === null || typeof (envuelta as { titulo?: unknown }).titulo !== 'string') {
    throw new Error('El JSON no es una aventura: le falta el título.')
  }
  const m = { ...base, ...(envuelta as Partial<Mision>) }
  return {
    ...m,
    faccion: { ...base.faccion, ...m.faccion },
    efectos: Array.isArray(m.efectos) ? m.efectos : [],
    extras: Array.isArray(m.extras) ? m.extras : [],
  }
}

/** Nombre de archivo a partir del título: «el-ultimo-aliento.json» */
export function nombreArchivo(m: Mision): string {
  const base = m.titulo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${base || 'aventura'}.json`
}
