import type { Equipo } from '../../../lib/equipo'
import type { Heroe } from '../../../lib/personajes'
import { HABILIDADES_MAGIA } from './hechizos'

export type DisparadorRegla = 'manual' | 'antes-ataque' | 'despues-ataque' | 'antes-defensa' | 'despues-defensa'

export type TipoReglaEspecial =
  | 'efecto'
  | 'descarga'
  | 'repetir-dados'
  | 'cambiar-cara'
  | 'dividir-impactos'
  | 'recargar'

export type ReglaEspecial = {
  id: string
  origenId: string
  nombre: string
  descripcion: string
  tipo: TipoReglaEspecial
  disparador: DisparadorRegla
  ataque?: number
  defensa?: number
  duracion?: 'proxima-tirada' | 'hasta-dano' | 'hasta-sin-enemigos-visibles' | 'manual'
  recarga?: 'dos-escudos-blancos-combate' | 'dos-escudos-negros-combate'
}

export const REGLAS_ESPECIALES: ReglaEspecial[] = [
  {
    id: 'dividir-ataque-hendedura',
    origenId: 'hendedura',
    nombre: 'Dividir ataque',
    descripcion: 'Reparte calaveras de una tirada de ataque entre otros objetivos. Recarga con 2 escudos blancos en combate.',
    tipo: 'dividir-impactos',
    disparador: 'despues-ataque',
    recarga: 'dos-escudos-blancos-combate',
  },
  {
    id: 'marca-de-cazador-ataque',
    origenId: 'marca-de-cazador',
    nombre: 'Marca de cazador',
    descripcion: '+1 dado de ataque contra el enemigo marcado. Recarga con 2 escudos negros en combate.',
    tipo: 'efecto',
    disparador: 'manual',
    ataque: 1,
    duracion: 'manual',
    recarga: 'dos-escudos-negros-combate',
  },
  {
    id: 'waaagh-ataque-extra',
    origenId: 'waaagh',
    nombre: '¡Waaagh!',
    descripcion: 'Ataque extra en tu turno. Recarga con 2 escudos negros en combate.',
    tipo: 'descarga',
    disparador: 'manual',
    recarga: 'dos-escudos-negros-combate',
  },
  {
    id: 'pocima-de-batalla-repetir',
    origenId: 'pocima-de-batalla',
    nombre: 'Pócima de Batalla',
    descripcion: 'Tras atacar, repite cualquier número de dados antes de la defensa.',
    tipo: 'repetir-dados',
    disparador: 'despues-ataque',
  },
  {
    id: 'cimitarra-repetir',
    origenId: 'cimitarra',
    nombre: 'Cimitarra',
    descripcion: 'Repite 1 dado de tu tirada de ataque.',
    tipo: 'repetir-dados',
    disparador: 'despues-ataque',
  },
  {
    id: 'piel-de-roca-defensa',
    origenId: 'piel-de-roca-1',
    nombre: 'Piel de roca',
    descripcion: '+1 dado de defensa hasta sufrir daño.',
    tipo: 'efecto',
    disparador: 'manual',
    defensa: 1,
    duracion: 'hasta-dano',
  },
  {
    id: 'valentia-ataque',
    origenId: 'valentia-1',
    nombre: 'Valentía',
    descripcion: '+2 dados de ataque hasta que no queden monstruos visibles.',
    tipo: 'efecto',
    disparador: 'manual',
    ataque: 2,
    duracion: 'hasta-sin-enemigos-visibles',
  },
  {
    id: 'forma-demoniaca-ataque',
    origenId: 'forma-demoniaca-1',
    nombre: 'Forma demoníaca',
    descripcion: '+1 dado de ataque hasta sufrir daño.',
    tipo: 'efecto',
    disparador: 'manual',
    ataque: 1,
    duracion: 'hasta-dano',
  },
  {
    id: 'cambio-de-forma-combate',
    origenId: 'cambio-de-forma-1',
    nombre: 'Cambio de forma',
    descripcion: '+1 ataque y +1 defensa hasta sufrir daño.',
    tipo: 'efecto',
    disparador: 'manual',
    ataque: 1,
    defensa: 1,
    duracion: 'hasta-dano',
  },
  {
    id: 'coraza-osea-defensa',
    origenId: 'coraza-osea-1',
    nombre: 'Coraza ósea',
    descripcion: '+1 dado de defensa hasta sufrir daño.',
    tipo: 'efecto',
    disparador: 'manual',
    defensa: 1,
    duracion: 'hasta-dano',
  },
  {
    id: 'runa-de-alric-cambiar-dado',
    origenId: 'runa-de-alric-el-loco-1',
    nombre: 'Runa de Alric',
    descripcion: 'Después de atacar, cambia un dado al resultado que desees.',
    tipo: 'cambiar-cara',
    disparador: 'despues-ataque',
  },
  {
    id: 'amuleto-disforme-cambiar-dado',
    origenId: 'amuleto-disforme',
    nombre: 'Amuleto disforme',
    descripcion: 'Una vez por misión, cambia un dado lanzado al resultado que desees.',
    tipo: 'cambiar-cara',
    disparador: 'despues-ataque',
  },
]

const porOrigen = (origenId: string) => REGLAS_ESPECIALES.filter((r) => r.origenId === origenId)

export function reglasDeHeroe(
  heroe: Heroe | undefined,
  hechizos: string[],
  inventario: { equipo?: string[]; equipado?: string[]; pociones?: string[]; artefactos?: string[] } = {},
  habilidadesEspeciales = true,
) {
  const habilidades = heroe ? [...heroe.habilidades, ...(heroe.eligeUna ?? [])].filter((id) => habilidadesEspeciales || HABILIDADES_MAGIA.has(id)) : []
  const ids = [...habilidades, ...hechizos, ...(inventario.equipo ?? []), ...(inventario.equipado ?? []), ...(inventario.pociones ?? []), ...(inventario.artefactos ?? [])]
  return ids.flatMap(porOrigen).filter((regla, i, todas) => todas.findIndex((r) => r.id === regla.id) === i)
}

export function reglasDeItem(equipo: Equipo, id: string) {
  return REGLAS_ESPECIALES.filter((r) => r.origenId === id && Boolean(equipo))
}
