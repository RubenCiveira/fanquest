import type { TipoMision } from '../lib/tipos'

/** Resultado "dado1,dado2" → regla del tipo de misión */
export const TABLA_OBJETIVOS_2D6: Record<string, number> = {
  '1,1': 1,
  '1,2': 1,
  '1,3': 2,
  '1,4': 2,
  '1,5': 3,
  '1,6': 3,
  '2,1': 4,
  '2,2': 4,
  '2,3': 5,
  '2,4': 5,
  '2,5': 6,
  '2,6': 6,
  '3,1': 6,
  '3,2': 6,
  '3,3': 7,
  '3,4': 7,
  '3,5': 8,
  '3,6': 8,
  '4,1': 9,
  '4,2': 9,
  '4,3': 10,
  '4,4': 10,
  '4,5': 11,
  '4,6': 11,
  '5,1': 12,
  '5,2': 12,
  '5,3': 13,
  '5,4': 13,
  '5,5': 14,
  '5,6': 14,
  '6,1': 0,
  '6,2': 0,
  '6,3': 0,
  '6,4': 0,
  '6,5': 0,
  '6,6': 0
}

/**
 * Tipos de misión = reglas especiales. El `objetivo` admite {pnj}, {perfil}
 * y {objeto}: solo se sortean los que aparecen.
 */
export const TIPOS_MISION: TipoMision[] = [
  {
    regla: 0,
    etiqueta: 'Matar al Jefe Final',
    narrativa: 'jefe',
    objetivo: 'Matar al Jefe Final.',
    reglaEspecial: 'Ninguna regla especial adicional. El objetivo es simplemente matar al Jefe Final.'
  },
  {
    regla: 1,
    etiqueta: 'Objeto almacenado (Librerías)',
    narrativa: 'objeto',
    objetivo: 'Recuperar {objeto} almacenado en un lugar.',
    reglaEspecial: '♦ Regla Especial 1: cambia 2 Cartas de Atrezo al azar del Mazo de Atrezo (que no sean cofres) por 2 Librerías. Las Salas Especiales, además de lo que se especifique, contendrán una Librería si es posible. Si un héroe revisa una Librería deberá lanzar 1D6. Si obtiene 6 se habrá encontrado el objeto (los héroes podrán salir de la mazmorra y cobrar una recompensa). Cada Librería adicional revisada otorgará +1 al D6. Si no se encontró el objeto en las Librerías, se encontrará al matar al Jefe de la Sala Objetivo.'
  },
  {
    regla: 2,
    etiqueta: 'Objeto en lugar mágico (Mesa de Hechicero)',
    narrativa: 'objeto',
    objetivo: 'Recuperar {objeto} almacenado en un lugar mágico.',
    reglaEspecial: '♦ Regla Especial 2: cambia una Carta de Atrezo al azar del Mazo de Atrezo (que no sea un cofre) por una Mesa de Hechicero. Si un héroe revisa la Mesa de Hechicero, habrá encontrado el objeto (los héroes podrán salir de la mazmorra y cobrar la recompensa). Si no, se encontrará al matar al Jefe de la Sala Objetivo.'
  },
  {
    regla: 3,
    etiqueta: 'Objeto perdido (Armería)',
    narrativa: 'objeto',
    objetivo: 'Recuperar {objeto} perdido en un lugar.',
    reglaEspecial: '♦ Regla Especial 3: cambia una Carta de Atrezo al azar del Mazo de Atrezo (que no sea un cofre) por una Armería. Si un héroe revisa la Armería, habrá encontrado el objeto (los héroes podrán salir de la mazmorra y cobrar la recompensa). Si no, se encontrará al matar al Jefe de la Sala Objetivo.'
  },
  {
    regla: 4,
    etiqueta: 'Objeto perdido (Armarios)',
    narrativa: 'objeto',
    objetivo: 'Recuperar {objeto} perdido en un lugar.',
    reglaEspecial: '♦ Regla Especial 4: cambia dos Cartas de Atrezo al azar del Mazo de Atrezo (que no sean cofres) por Armarios. Las Salas Especiales, además de lo que se especifique, contendrán un Armario si es posible. Si un héroe revisa un Armario deberá lanzar 1D6. Si obtiene 6 se habrá encontrado el objeto (los héroes podrán salir de la mazmorra y cobrar la recompensa). Cada Armario adicional revisado otorgará +1 al D6. Si no se encontró el objeto en los Armarios, se encontrará al matar al Jefe de la Sala Objetivo.'
  },
  {
    regla: 5,
    etiqueta: 'Objeto perdido (Tesoros marcados)',
    narrativa: 'objeto',
    objetivo: 'Recuperar {objeto} perdido en un lugar.',
    reglaEspecial: '♦ Regla Especial 5: Introduce 2 Cartas de Tesoro marcadas en tu Mazo de Tesoros. Si se roba alguna de ellas al buscar tesoros, el héroe que buscó habrá encontrado el Objeto (los héroes podrán salir de la mazmorra y cobrar la recompensa). Si no, el objeto se encontrará al matar al Jefe de la Sala Objetivo.'
  },
  {
    regla: 6,
    etiqueta: 'Objeto en manos del Jefe Final',
    narrativa: 'objeto',
    objetivo: 'Recuperar {objeto} en manos del Jefe Final.',
    reglaEspecial: '♦ Regla Especial 6: cuando muera el Jefe de la Sala Objetivo, el objeto se encontrará en su cadáver.'
  },
  {
    regla: 7,
    etiqueta: 'Objeto custodiado (Cofre en Sala Especial)',
    narrativa: 'objeto',
    objetivo: 'Recuperar {objeto} custodiado en un lugar.',
    reglaEspecial: '♦ Regla Especial 7: la primera Sala Especial que aparezca, además de su contenido, tiene un Cofre que al abrirlo se encontrará el objeto (no robes Carta de Cofre para este cofre). Los héroes podrán salir de la mazmorra y cobrar una recompensa de 100mo o bien continuar para abatir al Jefe Final.'
  },
  {
    regla: 8,
    etiqueta: 'Salvar a un prisionero',
    narrativa: 'rescate',
    objetivo: 'Salvar a un prisionero: {pnj}.',
    reglaEspecial: '♦ Regla Especial 8: Cambia una carta de Sala Especial por la carta Sala Especial A.\nSala Especial A: Al abrir la puerta os encontráis con unos imponentes monstruos que custodian con celo un cofre tras ellos. Coloca tantos monstruos de Categoría 3 de la facción de la Misión como héroes en juego. El cofre se abre de la forma habitual pero además del oro, contiene una Llave de Jaula.\nSala Objetivo: además del Jefe, en la sala objetivo se encuentra el PNJ cautivo en una jaula. Una vez destruido el Jefe, los héroes podrán liberar al PNJ si consiguieron la Llave de Jaula y la misión acabará.'
  },
  {
    regla: 9,
    etiqueta: 'Encontrar a alguien perdido',
    narrativa: 'rescate',
    objetivo: 'Encontrar a {pnj} {perfil}.',
    reglaEspecial: '♦ Regla Especial 9: Cambia una carta de Sala Especial por la carta Sala Especial A. Cuando dicha sala sea encontrada lee el texto a continuación.\nSala Especial A: Coloca un Armario y ninguna puerta. Quien revise el Armario encontrará al PNJ escondido en él. Parece encontrarse en buen estado y a partir de ahora acompañará a los héroes (uno de los jugadores lo manejará como mercenario). Deberéis encontrar al Jefe final y matarlo para aseguraros de que el PNJ esté a salvo en el futuro. Si lo hacéis, y aún está vivo el PNJ, recibiréis una recompensa adicional de 100 mo.'
  },
  {
    regla: 10,
    etiqueta: 'Rescatar a alguien torturado',
    narrativa: 'rescate',
    objetivo: 'Rescatar a {pnj} {perfil}.',
    reglaEspecial: '♦ Regla Especial 10: Cambia una carta de Sala Especial por la carta de Sala Especial A. Cuando dicha sala sea encontrada lee el texto a continuación.\nSala Especial A: Coloca un Potro de tortura y tira en la Tabla de Encuentros. El PNJ se encuentra ensangrentado y con la ropa hecha girones sobre el potro. Cuando acabéis con los monstruos y reviséis el Potro lanzad 1D6:\n1-2: al acercaros el PNJ expira su último aliento mientras señala una zona oscura de la sala. Obtenéis un Pergamino al azar que se hallaba en la zona señalada. Debéis matar al Jefe Final para vengarle.\n3-4: el PNJ está malherido y tiene la mitad de sus PCs. Tras liberarlo os acompaña durante esta Misión como mercenario para destruir al jefe de sus captores (Jefe Final).\n5-6: el PNJ apenas está herido, pues sus torturadores no han tenido tiempo suficiente. Al liberarlo, os acompaña durante esta Misión como mercenario para destruir al jefe de sus captores (Jefe Final).'
  },
  {
    regla: 11,
    etiqueta: 'Salvar de un sacrificio',
    narrativa: 'rescate',
    objetivo: 'Salvar a {pnj} que va a ser sacrificado.',
    reglaEspecial: '♦ Regla Especial 11: Debéis daros prisa, pues el PNJ va a ser sacrificado en un horrible ritual de invocación. Cada vez que se haga una Tirada de Peligro, además lanza 1D10 y suma el nivel del mismo. Si el resultado es 10 o más, pon un Contador de Muerte en el PNJ. Si se llega a 6 contadores de muerte, el PNJ habrá muerto sacrificado: ahora el mal al que os tendréis que enfrentar será mayor y deberéis encontrar la Sala Objetivo para destruirlo.\nSala Objetivo: sustituye los Monstruos Errantes a colocar por Cultistas. En vez de robar Cartas de Atrezo para montar la sala, coloca un Potro de Tortura donde se hallará el PNJ (vivo o muerto). Si el PNJ ha muerto, sustituye un Cultista por una Gárgola (el demonio ha sido invocado).'
  },
  {
    regla: 12,
    etiqueta: 'Encontrar explorador + objeto',
    narrativa: 'explorador',
    objetivo: 'Encontrar a {pnj} {perfil} y ayudarle a recuperar {objeto}.',
    reglaEspecial: '♦ Regla Especial 12: Encontráis al PNJ en la primera sala de la mazmorra intentando encontrar el objeto sagrado. En las Salas Especiales, al buscar tesoros o revisar muebles, lanzad 1d6, si sacáis un 6, el objeto aparecerá, y podréis abandonar la misión y cobrar la recompensa, si no, lo tendrá el Jefe Final. \nEl PNJ os acompañará durante toda la Misión en busca del objeto. Si la completáis, pero el PNJ muere, no recibiréis la recompensa por acabarla.'
  },
  {
    regla: 13,
    etiqueta: 'Objeto para salvar una vida',
    narrativa: 'salvavidas',
    objetivo: 'Encontrar {objeto} para salvar la vida de {pnj}.',
    reglaEspecial: '♦ Regla Especial 13: Debéis daros prisa en encontrar el objeto, pues la vida del PNJ pende de un hilo.\n- Introduce la Carta de Tesoro Antídoto en el Mazo de Tesoros o bien marca una carta, la cual será el objeto.\n- Cambia una carta al azar del Mazo de Atrezo por una carta Mesa de Alquimista. El primer héroe que la revise, encontrará el objeto.\n- Si no se encontró el objeto, se encontrará en el cadáver del Jefe de la Sala Objetivo. Los héroes deben encontrarlo antes de que el PNJ muera. Cada vez que se haga una Tirada de Peligro, además lanza 1D10 y suma el nivel del mismo. Si el resultado es 10 o más, pon un Contador de Muerte en el PNJ. Si se llega a 6 contadores de muerte, el PNJ habrá muerto.\nSi el PNJ murió, los héroes pueden continuar la partida, para acabar con el Jefe de la Sala Objetivo.\nSi los héroes encontraron el Antídoto antes de llegar a la Sala Objetivo, podrán finalizar la misión, y cobrar una recompensa extra de 100 mo por salvar la vida del PNJ.'
  },
  {
    regla: 14,
    etiqueta: 'Ayudar a un PNJ (compañero)',
    narrativa: 'aliado',
    objetivo: 'Ayudar a {pnj} {perfil} en su objetivo de matar al Jefe Final',
    reglaEspecial: '♦ Regla Especial 14: El PNJ acompañará a los héroes desde el principio para ayudar a destruir al Jefe Final. Suma al Jefe Final de esta Misión 2 PCs adicionales.'
  }
]
