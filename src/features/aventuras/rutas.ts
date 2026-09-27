import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router'
import { registrarEvento } from '../../lib/matomo'
import { cargarPlantillaAventuras } from '../generar/lib/plantilla'
import type { PlantillaAventuras } from '../generar/lib/tipos'
import { MAZOS_POR_MODO } from './config/mazos'
import {
  actualizarAventura,
  borrarAventura,
  obtenerAventura,
  type Aventura,
} from './lib/aventuras'
import { cargarMazos, type IdMazo, type Mazos } from '../../lib/mazos'
import {
  cargarAliados,
  cargarBestiario,
  cargarHabilidades,
  cargarHeroes,
  cargarMonstruos,
  type Familia,
  type GrupoAliados,
  type Habilidades,
  type Heroe,
  type Monstruos,
} from '../../lib/personajes'
import { estadoAventura } from './lib/asistente'
import { seleccionMonstruos } from './lib/monstruos'
import { conMapa, miembrosDelGrupo, nuevaPartida, type Contexto, type Miembro, type Partida } from './lib/partida'
import { nuevaConfiguracion, type Configuracion } from './lib/preparacion'

export async function cargarAventura({ params }: LoaderFunctionArgs) {
  return (await obtenerAventura(params.id ?? '')) ?? redirect('/aventuras')
}

/** Empezar la aventura (pasa a configurar la misión) o borrarla */
export async function accionAventura({ params, request }: ActionFunctionArgs) {
  const id = params.id ?? ''
  if ((await request.formData()).get('intent') === 'empezar') {
    const aventura = await obtenerAventura(id)
    if (aventura) {
      await actualizarAventura({
        ...aventura,
        estado: 'configurando',
        configuracion: aventura.configuracion ?? nuevaConfiguracion(await cargarMazos(), aventura.mision),
      })
      registrarEvento('Aventuras', 'Empezar')
    }
    return redirect(`/aventuras/${id}/configurar`)
  }
  await borrarAventura(id)
  registrarEvento('Aventuras', 'Borrar')
  return redirect('/aventuras')
}

export type DatosConfiguracion = {
  aventura: Aventura
  configuracion: Configuracion
  mazos: Mazos
  heroes: Heroe[]
  habilidades: Habilidades
  monstruos: Monstruos
  bestiario: Familia[]
  aliados: GrupoAliados[]
}

export async function cargarConfiguracion({ params }: LoaderFunctionArgs): Promise<DatosConfiguracion> {
  const [aventura, mazos, heroes, habilidades, monstruos, bestiario, aliados] = await Promise.all([
    obtenerAventura(params.id ?? ''),
    cargarMazos(),
    cargarHeroes(),
    cargarHabilidades(),
    cargarMonstruos(),
    cargarBestiario(),
    cargarAliados(),
  ])
  if (!aventura) throw redirect('/aventuras')
  const { configuracion } = aventura
  if (!configuracion) throw redirect(`/aventuras/${aventura.id}`)
  // escoger cartas solo tiene sentido en el paso de mazos y sin barajar
  const escogible = MAZOS_POR_MODO[configuracion.modo].includes(params.mazo as IdMazo) && !configuracion.barajado
  if (params.mazo && !escogible) {
    throw redirect(`/aventuras/${aventura.id}/configurar`)
  }
  return { aventura, configuracion, mazos, heroes, habilidades, monstruos, bestiario, aliados }
}

export type DatosPartida = {
  aventura: Aventura & { configuracion: Configuracion; partida: Partida }
  contexto: Contexto
  miembros: Miembro[]
  habilidades: Habilidades
  monstruos: Monstruos
}

/** Con los mazos barajados se juega; la primera vez empieza la partida */
export async function cargarPartida({ params }: LoaderFunctionArgs): Promise<DatosPartida> {
  const [aventura, mazos, heroes, habilidades, monstruos, aliados] = await Promise.all([
    obtenerAventura(params.id ?? ''),
    cargarMazos(),
    cargarHeroes(),
    cargarHabilidades(),
    cargarMonstruos(),
    cargarAliados(),
  ])
  if (!aventura) throw redirect('/aventuras')
  const { configuracion } = aventura
  if (!configuracion?.barajado) throw redirect(`/aventuras/${aventura.id}`)
  const miembros = miembrosDelGrupo(configuracion, heroes, aliados)
  const heroesEnJuego = configuracion.heroes?.length ?? 0
  const contexto: Contexto = {
    mazos,
    mision: aventura.mision,
    modo: configuracion.modo,
    heroes: heroesEnJuego,
    monstruos,
    seleccion: seleccionMonstruos(configuracion.monstruos, aventura.mision, heroesEnJuego),
  }
  let partida = aventura.partida && conMapa(aventura.partida, configuracion.modo)
  if (!partida) {
    partida = nuevaPartida(contexto, configuracion, miembros)
    await actualizarAventura({ ...aventura, estado: estadoAventura(configuracion, partida), partida })
    registrarEvento('Aventuras', 'Empezar partida', configuracion.modo)
  }
  return { aventura: { ...aventura, configuracion, partida }, contexto, miembros, habilidades, monstruos }
}

export type DatosEditor = { plantilla: PlantillaAventuras; aventura?: Aventura }

/** Editor de aventuras: una nueva o la guardada con ese id */
export async function cargarEditor({ params }: LoaderFunctionArgs): Promise<DatosEditor> {
  const plantilla = await cargarPlantillaAventuras()
  if (!params.id) return { plantilla }
  const aventura = await obtenerAventura(params.id)
  if (!aventura) throw redirect('/aventuras')
  return { plantilla, aventura }
}
