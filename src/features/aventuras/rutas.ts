import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router'
import { registrarEvento } from '../../lib/matomo'
import { MAZOS_POR_MODO } from './config/mazos'
import {
  actualizarAventura,
  borrarAventura,
  obtenerAventura,
  type Aventura,
} from './lib/aventuras'
import { cargarMazos, type IdMazo, type Mazos } from '../../lib/mazos'
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
}

export async function cargarConfiguracion({ params }: LoaderFunctionArgs): Promise<DatosConfiguracion> {
  const [aventura, mazos] = await Promise.all([obtenerAventura(params.id ?? ''), cargarMazos()])
  if (!aventura) throw redirect('/aventuras')
  const { configuracion } = aventura
  if (!configuracion) throw redirect(`/aventuras/${aventura.id}`)
  // escoger cartas solo tiene sentido en el paso de mazos y sin barajar
  const escogible = MAZOS_POR_MODO[configuracion.modo].includes(params.mazo as IdMazo) && !configuracion.barajado
  if (params.mazo && !escogible) {
    throw redirect(`/aventuras/${aventura.id}/configurar`)
  }
  return { aventura, configuracion, mazos }
}
