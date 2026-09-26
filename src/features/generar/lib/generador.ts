import { d6, entre, rnd } from '../../../lib/dados'
import { rellenar } from '../../../lib/texto'
import { FACCIONES } from '../config/facciones'
import { TABLA_OBJETIVOS_2D6, TIPOS_MISION } from '../config/misiones'
import { PREPARACION as preparacion } from '../config/preparacion'
import { REGLAS_EXTRAS } from '../config/reglasExtras'
import { redactar, redactarLargo } from './narrativa'
import { aplicarReglasExtras, tirarReglasExtras } from './reglasExtras'
import type { ConfigExtras, Mision, PlantillaAventuras } from './tipos'

/** Regla del tipo de misión forzada o tirada en la tabla de objetivos */
export type SeleccionRegla = number | 'aleatoria'

function porTirada<T extends { tirada: number[] }>(opciones: T[], tirada: number): T {
  const opcion = opciones.find((o) => o.tirada.includes(tirada))
  if (!opcion) throw new Error(`Ninguna opción cubre la tirada ${tirada}`)
  return opcion
}

function tipoMision(seleccion: SeleccionRegla) {
  const regla =
    seleccion === 'aleatoria' ? TABLA_OBJETIVOS_2D6[`${d6()},${d6()}`] : seleccion
  const tipo = TIPOS_MISION.find((t) => t.regla === regla)
  if (!tipo) throw new Error(`No existe el tipo de misión ${regla}`)
  return tipo
}

export function generarMision(
  p: PlantillaAventuras,
  seleccion: SeleccionRegla,
  configExtras: ConfigExtras,
): Mision {
  const faccion = porTirada(FACCIONES, d6())
  const tipoJefe = porTirada(faccion.jefes, d6()).tipo
  const tipo = tipoMision(seleccion)
  // solo se sortea lo que el objetivo del tipo de misión necesita
  const usa = (marcador: string) => tipo.objetivo.includes(`{${marcador}}`)
  const objeto = usa('objeto') ? rnd(p.objetos) : null
  const recompensa = rnd(preparacion.recompensas)

  const valores = {
    faccion: faccion.nombre,
    jefe: rnd(p.jefes[tipoJefe] ?? [preparacion.jefePorDefecto]),
    tipoJefe,
    lugarHeroes: rnd(p.lugares.heroes),
    lugarAventura: rnd(p.lugares.aventura),
    mecenas: rnd(p.personajes.mecenas),
    pnj: usa('pnj') ? rnd(p.personajes.pnjs) : null,
    perfil: usa('perfil') ? rnd(p.personajes.perfilesPnj) : null,
    objeto,
    botin: objeto ?? p.epilogos.botinPorDefecto,
    recompensa,
  }

  const extras = tirarReglasExtras(configExtras)
  const preparacionFinal = aplicarReglasExtras(
    extras,
    {
      peligro: preparacion.peligro,
      dadoTrampa: preparacion.dadoTrampa,
      salasNormales: entre(preparacion.salasNormales.min, preparacion.salasNormales.max),
      salasEspeciales: entre(preparacion.salasEspeciales.min, preparacion.salasEspeciales.max),
    },
    preparacion.dadosTrampa,
  )
  const { nombre, errante, erranteSuperior } = faccion

  return {
    ...preparacionFinal,
    regla: tipo.regla,
    titulo: redactar(p.titulos[tipo.narrativa], valores),
    introduccion: redactarLargo(
      p.introducciones[tipo.narrativa],
      p.introducciones.relleno,
      valores,
    ),
    epilogo: redactarLargo(p.epilogos[tipo.narrativa], p.epilogos.relleno, valores),
    pasillos: entre(preparacion.pasillos.min, preparacion.pasillos.max),
    recompensa,
    mazoAtrezo: preparacion.mazoAtrezo,
    faccion: { nombre, errante, erranteSuperior },
    jefe: valores.jefe,
    tipoJefe,
    puntosCuerpoJefe: preparacion.puntosCuerpoJefe,
    objetivo: rellenar(tipo.objetivo, valores),
    salaObjetivo: `${preparacion.salaObjetivo} ${rnd(preparacion.atrezoAdicional)}`,
    reglaEspecial: tipo.reglaEspecial,
    extras: extras.map(({ nombre, texto }) => ({ nombre, texto })),
    sinReglasExtras: REGLAS_EXTRAS.sinReglas,
  }
}
