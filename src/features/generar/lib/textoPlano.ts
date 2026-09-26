import type { Mision } from './tipos'

/** Versión en texto plano para copiar al portapapeles */
export function textoPlano(m: Mision): string {
  const extras = m.extras.length
    ? m.extras.map((ex) => `♦ ${ex.nombre}: ${ex.texto}`).join('\n\n')
    : m.sinReglasExtras

  return `MISIÓN: ${m.titulo}

INTRODUCCIÓN
${m.introduccion}

PREPARACIÓN
Salas Normales: ${m.salasNormales}    Salas Especiales: ${m.salasEspeciales}    Losetas de Pasillo: ${m.pasillos}
Nivel de Peligro: ${m.peligro}    Dado de Trampa: ${m.dadoTrampa}  Recompensa: ${m.recompensa} mo
${m.mazoAtrezo}

TABLA DE ENCUENTROS Y JEFE
Facción: ${m.faccion.nombre}. Errante: ${m.faccion.errante}. Errante Superior: ${m.faccion.erranteSuperior}.
Jefe Final: ${m.jefe} (${m.tipoJefe}). ${m.puntosCuerpoJefe}

OBJETIVO DE LA MISIÓN
${m.objetivo}
${m.salaObjetivo}

REGLAS ESPECIALES
${m.reglaEspecial}

REGLAS EXTRAS
${extras}

EPÍLOGO
${m.epilogo}
`
}
