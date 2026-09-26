import type { ConfigReglasExtras } from '../lib/tipos'

export const REGLAS_EXTRAS: ConfigReglasExtras = {
  probabilidades: {
    una: 50,
    dos: 10
  },
  sinReglas: 'Ninguna regla extra en esta misión.',
  reglas: [
    {
      id: 'cambio-de-lugar',
      nombre: 'Cambio de lugar',
      texto: 'El contenido de la Sala Objetivo será colocado en la Sala Especial B, y el de la Sala Especial B, en la Sala Objetivo.',
      activa: true
    },
    {
      id: 'cerradura',
      nombre: 'Cerradura',
      texto: 'Para poder entrar en la Sala Objetivo, habrá que encontrar primero una Llave, la cual se obtendrá buscando tesoros y encontrando la carta marcada (marca antes de empezar una carta de tesoro aleatoria del mazo de tesoros).',
      activa: true
    },
    {
      id: 'capturados',
      nombre: 'Capturados',
      texto: 'Los héroes serán emboscados y despojados de su equipo. La sala inicial será una pequeña sin escaleras. El equipo será encontrado si, al entrar en una sala, obtienen un escudo blanco en un dado de combate; mientras, el nivel de peligro no podrá sobrepasar el nivel 4. Añade una escalera en la Sala Especial B.',
      activa: true
    },
    {
      id: 'encerrados',
      nombre: 'Encerrados',
      texto: 'Un derrumbamiento anula la entrada. La sala inicial no tendrá escalera en esta misión. Añade una escalera de salida en la Sala Especial B. Los héroes no podrán huir ni finalizar la misión si no han encontrado la escalera. Si la han encontrado y han superado la misión, no es necesario que lleguen hasta ella para finalizarla.',
      activa: true
    },
    {
      id: 'niebla',
      nombre: 'Niebla',
      texto: 'Debido a una antinatural niebla, ninguna miniatura podrá atacar a distancia, ni lanzar hechizos, a más de tres casillas de distancia durante esta misión.',
      activa: true
    },
    {
      id: 'inundacion',
      nombre: 'Inundación',
      texto: 'Los pasillos y Salas Especiales de esta misión estarán inundados, y se considerarán terreno difícil, y costarán un punto de movimiento extra cruzar cada casilla de ellas. Las criaturas voladoras, éteres, y acuáticas no se verán afectadas. El MB contará con un Punto de Mejora Oscura menos en la actual misión. Se recomienda jugar con héroes de al menos hayan superado 7 misiones adicionales a lo estipulado normalmente.',
      activa: true
    },
    {
      id: 'jefe-imprevisible',
      nombre: 'Jefe Imprevisible',
      texto: 'Al encontrar una Sala Especial, lanzas un dado: si sale un 5 o un 6, el Jefe Final se encontrará en dicha sala, junto a un monstruo errante por héroe en juego (no tires encuentros). Si el objetivo de la misión es distinto al de matar al jefe, dicho objetivo seguirá estando en la Sala Objetivo (tira encuentros en la Sala Objetivo si ya había salido el Jefe antes). La sala con el Jefe nunca tiene trampas.',
      activa: true
    },
    {
      id: 'comienzo-intenso',
      nombre: 'Comienzo Intenso',
      texto: 'La sala inicial de la escalera será una Sala Especial aleatoria, atrezo y monstruos incluidos. Dicha sala no cuenta como cómputo del número de Salas Especiales en la misión (se suma +1 al total de Salas Especiales). Disminuye en uno la cantidad de salas normales de la misión.',
      activa: true,
      efectos: [
        {
          campo: 'salasNormales',
          suma: -1,
          minimo: 4
        },
        {
          campo: 'salasEspeciales',
          suma: 1
        }
      ]
    },
    {
      id: 'mision-peligrosa',
      nombre: 'Misión Peligrosa',
      texto: 'El nivel de peligro inicial de la misión aumenta en uno. El MB contará con dos Puntos de Mejora Oscura menos en la actual misión. Se recomienda jugar con héroes que al menos hayan superado 14 misiones adicionales a lo estimado normalmente.',
      activa: true,
      efectos: [
        {
          campo: 'peligro',
          suma: 1
        }
      ]
    },
    {
      id: 'mas-trampas',
      nombre: 'Más Trampas',
      texto: 'Reduce en uno el Dado de Trampa de la misión. El MB contará con dos Puntos de Mejora Oscura menos en la actual misión. Se recomienda jugar con héroes que hayan superado al menos 14 misiones adicionales a lo estimado normalmente.',
      activa: true,
      efectos: [
        {
          campo: 'dadoTrampa',
          suma: -1
        }
      ]
    },
    {
      id: 'menos-trampas',
      nombre: 'Menos Trampas',
      texto: 'Aumenta en uno el Dado de Trampa de la misión. El MB contará con dos Puntos de Mejora Oscura adicionales en la actual misión.',
      activa: true,
      efectos: [
        {
          campo: 'dadoTrampa',
          suma: 1
        }
      ]
    },
    {
      id: 'pasadizos-ocultos',
      nombre: 'Pasadizos ocultos',
      texto: 'Cuando un héroe revise un atrezo que esté pegado a una pared, si saca un 6 en 1D6, descubre también una puerta secreta o, de no ser posible, una trampilla, que conecta con una sala nueva. Estas salas siguen las normas de salas encontradas detrás de una puerta secreta, pero, además, se realizará una tirada de encuentros en ellas para colocar monstruos también.',
      activa: true
    },
    {
      id: 'ecos-del-pasado',
      nombre: 'Ecos del pasado',
      texto: 'Los espectros de los muertos resuenan en la mazmorra. Cada vez que un héroe entre en una sala especial por primera vez, ha de lanzar un dado de combate: con una calavera, encontrará un espíritu maligno y perderá un Punto de Mente; con otro resultado, encontrará un espíritu benévolo y recuperará un Punto de Cuerpo perdido.',
      activa: true
    },
    {
      id: 'disformidad-magica',
      nombre: 'Disformidad mágica',
      texto: 'Fluctuantes focos de poder arcano hacen que los habitantes de la mazmorra posean insólitos dones mágicos. Todos los monstruos de la misión ganan un hechizo de caos/terror aleatorio por cada Punto de Mente superior a 2. Cuando los héroes lancen algún conjuro o plegaria, podrán realizar dos tiradas en la tabla de Vientos de Magia, y quedarse con el resultado que prefieran.',
      activa: true
    }
  ]
}
